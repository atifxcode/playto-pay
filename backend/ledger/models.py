import uuid

from django.db import models
from django.db.models import CheckConstraint, Q


class LedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        CREDIT = "credit"
        HOLD = "hold"
        RELEASE = "release"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey("merchants.Merchant", on_delete=models.PROTECT, related_name="ledger_entries")
    entry_type = models.CharField(max_length=16, choices=EntryType.choices)
    amount_paise = models.BigIntegerField()
    payout = models.ForeignKey(
        "payouts.Payout",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="ledger_entries",
    )
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            CheckConstraint(condition=Q(amount_paise__gt=0), name="ledger_amount_positive"),
            CheckConstraint(
                condition=(
                    Q(entry_type="credit", payout__isnull=True)
                    | Q(entry_type__in=["hold", "release"], payout__isnull=False)
                ),
                name="ledger_payout_required_for_hold_release",
            ),
        ]
        indexes = [
            models.Index(fields=["merchant", "created_at"]),
            models.Index(fields=["payout"]),
            models.Index(fields=["merchant", "entry_type"]),
        ]
