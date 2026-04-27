import uuid

from django.db import models


class IdempotencyKey(models.Model):
    class State(models.TextChoices):
        IN_FLIGHT = "in_flight"
        COMPLETED = "completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey("merchants.Merchant", on_delete=models.CASCADE)
    key = models.CharField(max_length=128)
    request_fingerprint = models.CharField(max_length=64)
    state = models.CharField(max_length=16, choices=State.choices, default=State.IN_FLIGHT)
    response_status = models.PositiveSmallIntegerField(null=True)
    response_body = models.JSONField(null=True)
    payout = models.ForeignKey("payouts.Payout", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["merchant", "key"], name="uniq_merchant_idem_key"),
        ]
        indexes = [
            models.Index(fields=["expires_at"]),
        ]
