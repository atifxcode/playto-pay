import uuid

from django.db import models
from django.db.models import CheckConstraint, Q


class Payout(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        PROCESSING = "processing"
        COMPLETED = "completed"
        FAILED = "failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey("merchants.Merchant", on_delete=models.PROTECT, related_name="payouts")
    bank_account = models.ForeignKey("merchants.BankAccount", on_delete=models.PROTECT)
    amount_paise = models.BigIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)

    attempt_count = models.PositiveSmallIntegerField(default=0)
    locked_at = models.DateTimeField(null=True, blank=True)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            CheckConstraint(condition=Q(amount_paise__gt=0), name="payout_amount_positive"),
        ]
        indexes = [
            models.Index(fields=["status", "locked_at"]),
            models.Index(fields=["status", "next_retry_at"]),
            models.Index(fields=["merchant", "-created_at"]),
        ]


class PayoutAttempt(models.Model):
    class Outcome(models.TextChoices):
        SUCCESS = "success"
        FAILED = "failed"
        HUNG = "hung"
        TIMEOUT = "timeout"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payout = models.ForeignKey(Payout, on_delete=models.CASCADE, related_name="attempts")
    attempt_number = models.PositiveSmallIntegerField()
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    outcome = models.CharField(max_length=16, choices=Outcome.choices, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["payout", "attempt_number"], name="uniq_payout_attempt"),
        ]


class PayoutStateTransition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payout = models.ForeignKey(Payout, on_delete=models.CASCADE, related_name="transitions")
    from_status = models.CharField(max_length=16)
    to_status = models.CharField(max_length=16)
    actor = models.CharField(max_length=32)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
