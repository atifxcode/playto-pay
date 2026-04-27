import hashlib
import json
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils import timezone

from .models import IdempotencyKey

IDEMPOTENT_PATHS = {"/api/v1/payouts", "/api/v1/payouts/"}


def _fingerprint(request) -> str:
    raw = f"{request.method}|{request.path}|{request.body.decode('utf-8', errors='ignore')}"
    return hashlib.sha256(raw.encode()).hexdigest()


class IdempotencyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method != "POST" or request.path not in IDEMPOTENT_PATHS:
            return self.get_response(request)

        key = request.headers.get("Idempotency-Key")
        if not key:
            return JsonResponse({"error": "Idempotency-Key header required"}, status=400)

        merchant = getattr(request, "merchant", None)
        if not merchant:
            return JsonResponse({"error": "merchant_context_required"}, status=401)

        fp = _fingerprint(request)
        now = timezone.now()

        try:
            with transaction.atomic():
                idem = IdempotencyKey.objects.create(
                    merchant=merchant,
                    key=key,
                    request_fingerprint=fp,
                    expires_at=now + timedelta(hours=24),
                )
        except IntegrityError:
            with transaction.atomic():
                idem = IdempotencyKey.objects.select_for_update().get(merchant=merchant, key=key)

                # Expired keys are treated as fresh keys and can be reused.
                if idem.expires_at <= now:
                    idem.delete()
                    idem = IdempotencyKey.objects.create(
                        merchant=merchant,
                        key=key,
                        request_fingerprint=fp,
                        expires_at=now + timedelta(hours=24),
                    )
                else:
                    if idem.request_fingerprint != fp:
                        return JsonResponse(
                            {"error": "idempotency_key_reused_with_different_body"},
                            status=422,
                        )

                    if idem.state == IdempotencyKey.State.IN_FLIGHT:
                        return JsonResponse({"error": "request_in_flight"}, status=409)

        response = self.get_response(request)

        try:
            body = json.loads(response.content.decode())
        except Exception:
            body = {}

        idem.state = IdempotencyKey.State.COMPLETED
        idem.response_status = response.status_code
        idem.response_body = body
        if response.status_code in (200, 201) and "id" in body:
            idem.payout_id = body["id"]
        idem.save(update_fields=["state", "response_status", "response_body", "payout"])

        return response
