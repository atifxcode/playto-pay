from django.http import Http404
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from ledger.services import available_balance_paise, held_balance_paise

from .models import Payout
from .serializers import PayoutCreateSerializer, PayoutReadSerializer
from .services import InsufficientBalance, InvalidBankAccount, create_payout
from .tasks import process_payout


class BalanceView(APIView):
    def get(self, request):
        merchant = request.merchant
        if merchant is None:
            return Response({"error": "merchant_context_required"}, status=401)
        return Response(
            {
                "available_paise": available_balance_paise(merchant.id),
                "held_paise": held_balance_paise(merchant.id),
            }
        )


class PayoutViewSet(viewsets.ViewSet):
    def create(self, request):
        merchant = getattr(request, "merchant", None)
        if merchant is None:
            return Response({"error": "merchant_context_required"}, status=401)

        ser = PayoutCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        idem_key = request.headers.get("Idempotency-Key", "")
        try:
            payout, created = create_payout(
                merchant_id=merchant.id,
                bank_account_id=ser.validated_data["bank_account_id"],
                amount_paise=ser.validated_data["amount_paise"],
                idem_key=idem_key,
            )
            payout.refresh_from_db()
        except InsufficientBalance as exc:
            return Response({"error": "insufficient_balance", "detail": str(exc)}, status=422)
        except InvalidBankAccount as exc:
            return Response({"error": "invalid_bank_account", "detail": str(exc)}, status=400)

        if created:
            process_payout.delay(str(payout.id))
            return Response(PayoutReadSerializer(payout).data, status=201)
        return Response(PayoutReadSerializer(payout).data, status=200)

    def retrieve(self, request, pk=None):
        merchant = getattr(request, "merchant", None)
        if merchant is None:
            return Response({"error": "merchant_context_required"}, status=401)

        try:
            payout = Payout.objects.get(id=pk, merchant=merchant)
        except Payout.DoesNotExist as exc:
            raise Http404 from exc
        return Response(PayoutReadSerializer(payout).data)

    def list(self, request):
        merchant = getattr(request, "merchant", None)
        if merchant is None:
            return Response({"error": "merchant_context_required"}, status=401)

        qs = Payout.objects.filter(merchant=merchant).order_by("-created_at")[:100]
        return Response(PayoutReadSerializer(qs, many=True).data)
