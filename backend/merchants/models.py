import uuid

from django.contrib.auth.models import User
from django.db import models


class Merchant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.PROTECT)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class BankAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name="bank_accounts")
    account_holder_name = models.CharField(max_length=200)
    account_number_last4 = models.CharField(max_length=4)
    account_number_encrypted = models.BinaryField()
    ifsc = models.CharField(max_length=11)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
