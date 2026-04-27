from rest_framework import serializers
from .models import Payout, PayoutStateTransition, PayoutAttempt

class PayoutStateTransitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutStateTransition
        fields = ["id", "from_status", "to_status", "actor", "reason", "created_at"]

class PayoutAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutAttempt
        fields = ["id", "attempt_number", "started_at", "finished_at", "outcome", "notes"]

class PayoutCreateSerializer(serializers.Serializer):
    bank_account_id = serializers.UUIDField()
    amount_paise = serializers.IntegerField(min_value=1)

class PayoutReadSerializer(serializers.ModelSerializer):
    transitions = PayoutStateTransitionSerializer(many=True, read_only=True)
    attempts = PayoutAttemptSerializer(many=True, read_only=True)

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
            "transitions",
            "attempts",
        ]
