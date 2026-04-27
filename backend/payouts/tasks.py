from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from bank_simulator.client import transfer
from ledger.models import LedgerEntry

from .models import Payout, PayoutAttempt, PayoutStateTransition

MAX_ATTEMPTS = 3
WORKER_TIMEOUT = timedelta(seconds=30)
ALLOWED_TRANSITIONS = {
    ("", "pending"),
    ("pending", "processing"),
    ("processing", "pending"),
    ("processing", "completed"),
    ("processing", "failed"),
}


def _record_transition(payout, frm, to, actor, reason=""):
    if (frm, to) not in ALLOWED_TRANSITIONS:
        raise ValueError(f"illegal state transition: {frm} -> {to}")
    PayoutStateTransition.objects.create(
        payout=payout,
        from_status=frm,
        to_status=to,
        actor=actor,
        reason=reason,
    )


@shared_task(bind=True)
def process_payout(self, payout_id):
    """
    Worker: pending -> processing -> (completed | failed | back to pending for retry)
    """
    with transaction.atomic():
        updated = Payout.objects.filter(
            id=payout_id,
            status=Payout.Status.PENDING,
        ).update(
            status=Payout.Status.PROCESSING,
            locked_at=timezone.now(),
            attempt_count=F("attempt_count") + 1,
        )
        if updated == 0:
            return

        payout = Payout.objects.select_related("bank_account").get(id=payout_id)
        attempt = PayoutAttempt.objects.create(
            payout=payout,
            attempt_number=payout.attempt_count,
        )
        _record_transition(payout, "pending", "processing", "worker")

    result = transfer(
        amount_paise=payout.amount_paise,
        ifsc=payout.bank_account.ifsc,
        account_last4=payout.bank_account.account_number_last4,
        idem_key=str(payout.id),
    )

    with transaction.atomic():
        payout = Payout.objects.select_for_update().get(id=payout_id)
        attempt = PayoutAttempt.objects.select_for_update().get(id=attempt.id)
        attempt.finished_at = timezone.now()

        # A sweeper/other worker may have already moved this payout; never finalize stale attempts.
        if payout.status != Payout.Status.PROCESSING:
            if attempt.outcome is None:
                attempt.outcome = PayoutAttempt.Outcome.HUNG
                attempt.notes = f"stale_result_ignored: {result.status}"
                attempt.save(update_fields=["finished_at", "outcome", "notes"])
            return

        if result.status == "success":
            payout.status = Payout.Status.COMPLETED
            payout.locked_at = None
            payout.failure_reason = ""
            payout.next_retry_at = None
            payout.save(update_fields=["status", "locked_at", "failure_reason", "next_retry_at", "updated_at"])


            
            attempt.outcome = PayoutAttempt.Outcome.SUCCESS
            attempt.notes = f"bank_ref={result.reference}"
            attempt.save(update_fields=["finished_at", "outcome", "notes"])

            _record_transition(payout, "processing", "completed", "worker")
        elif result.status == "failed":
            _fail_payout(payout, attempt, reason=result.message)
        else:
            # Treat explicit hung responses as timeout failures so retries can proceed
            # even when Celery beat/sweeper isn't running locally.
            attempt.outcome = PayoutAttempt.Outcome.HUNG
            attempt.notes = result.message or "bank_did_not_respond"
            attempt.save(update_fields=["finished_at", "outcome", "notes"])
            _fail_payout(payout, attempt, reason="bank_timeout")


def _fail_payout(payout, attempt, *, reason: str):
    """Either retry (back to pending) or terminally fail (write RELEASE)."""
    if payout.attempt_count < MAX_ATTEMPTS:
        backoff = timedelta(seconds=2 ** payout.attempt_count)
        payout.status = Payout.Status.PENDING
        payout.locked_at = None
        payout.next_retry_at = timezone.now() + backoff
        payout.failure_reason = reason
        payout.save(update_fields=["status", "locked_at", "next_retry_at", "failure_reason", "updated_at"])

        if attempt is not None:
            attempt.outcome = PayoutAttempt.Outcome.FAILED
            attempt.notes = f"will_retry: {reason}"
            attempt.save(update_fields=["finished_at", "outcome", "notes"])

        _record_transition(payout, "processing", "pending", "worker", f"retry: {reason}")
    else:
        payout.status = Payout.Status.FAILED
        payout.locked_at = None
        payout.next_retry_at = None
        payout.failure_reason = reason
        payout.save(update_fields=["status", "locked_at", "next_retry_at", "failure_reason", "updated_at"])

        LedgerEntry.objects.create(
            merchant=payout.merchant,
            entry_type=LedgerEntry.EntryType.RELEASE,
            amount_paise=payout.amount_paise,
            payout=payout,
            description=f"Release after terminal failure: {reason}",
        )

        if attempt is not None:
            attempt.outcome = PayoutAttempt.Outcome.FAILED
            attempt.notes = f"terminal: {reason}"
            attempt.save(update_fields=["finished_at", "outcome", "notes"])

        _record_transition(payout, "processing", "failed", "worker", f"terminal: {reason}")


@shared_task
def sweep_stuck_payouts():
    """
    Runs every 15 seconds (Celery beat).
    1. Find payouts stuck in 'processing' for > 30s (the bank hung).
    2. Re-enqueue 'pending' payouts whose next_retry_at has arrived.
    """
    cutoff = timezone.now() - WORKER_TIMEOUT
    stuck_ids = list(
        Payout.objects.filter(status=Payout.Status.PROCESSING, locked_at__lt=cutoff).values_list("id", flat=True)
    )
    for payout_id in stuck_ids:
        with transaction.atomic():
            payout = Payout.objects.select_for_update().get(id=payout_id)
            if payout.status != Payout.Status.PROCESSING or not payout.locked_at or payout.locked_at >= cutoff:
                continue

            attempt = payout.attempts.order_by("-attempt_number").first()
            if attempt and attempt.outcome is None:
                attempt.outcome = PayoutAttempt.Outcome.TIMEOUT
                attempt.finished_at = timezone.now()
                attempt.notes = "swept: bank did not respond in 30s"
                attempt.save(update_fields=["outcome", "finished_at", "notes"])

            _fail_payout(payout, attempt, reason="bank_timeout")

    ready_ids = list(
        Payout.objects.filter(
            status=Payout.Status.PENDING,
            next_retry_at__isnull=False,
            next_retry_at__lte=timezone.now(),
        ).values_list("id", flat=True)
    )
    for payout_id in ready_ids:
        process_payout.delay(str(payout_id))
