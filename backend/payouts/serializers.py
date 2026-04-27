from rest_framework import serializers

from .models import Payout


class PayoutCreateSerializer(serializers.Serializer):
    bank_account_id = serializers.UUIDField()
    amount_paise = serializers.IntegerField(min_value=1)


class PayoutReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            "id",
            "amount_paise",
            "status",
            "attempt_count",
            "failure_reason",
            "created_at",
            "updated_at",
        ]
