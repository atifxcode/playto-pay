from django.db import transaction

from ledger.models import LedgerEntry
from ledger.services import available_balance_paise
from merchants.models import BankAccount, Merchant

from idempotency.models import IdempotencyKey
from .models import Payout, PayoutStateTransition


class InsufficientBalance(Exception):
    pass


class InvalidBankAccount(Exception):
    pass


@transaction.atomic
def create_payout(*, merchant_id, bank_account_id, amount_paise: int, idem_key: str) -> tuple[Payout, bool]:
    """
    The atomic core. All of this happens in ONE transaction:
      1. Lock the merchant row    -> serializes balance reads for this merchant
      2. Verify bank account
      3. Recompute balance from ledger
      4. Reject if insufficient
      5. Create Payout row (status=pending)
      6. Write HOLD ledger entry
      7. Write state transition: (none) -> pending
    """
    if amount_paise <= 0:
        raise ValueError("amount_paise must be positive")

    merchant = Merchant.objects.select_for_update().get(id=merchant_id)

    if idem_key:
        idem = IdempotencyKey.objects.filter(merchant_id=merchant_id, key=idem_key).first()
        if idem and idem.payout_id:
            return Payout.objects.get(id=idem.payout_id), False

    try:
        bank = BankAccount.objects.get(id=bank_account_id, merchant_id=merchant_id, is_active=True)
    except BankAccount.DoesNotExist as exc:
        raise InvalidBankAccount("bank account not found or inactive") from exc

    available = available_balance_paise(merchant_id)
    if available < amount_paise:
        raise InsufficientBalance(f"available={available} requested={amount_paise}")

    payout = Payout.objects.create(
        merchant=merchant,
        bank_account=bank,
        amount_paise=amount_paise,
        status=Payout.Status.PENDING,
    )

    LedgerEntry.objects.create(
        merchant=merchant,
        entry_type=LedgerEntry.EntryType.HOLD,
        amount_paise=amount_paise,
        payout=payout,
        description=f"Hold for payout {payout.id}",
    )

    PayoutStateTransition.objects.create(
        payout=payout,
        from_status="",
        to_status="pending",
        actor="api",
        reason="payout_created",
    )
    return payout, True
