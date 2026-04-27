import random
import time
import uuid


class BankResult:
    def __init__(self, status: str, reference: str = "", message: str = ""):
        self.status = status
        self.reference = reference
        self.message = message


def transfer(amount_paise: int, ifsc: str, account_last4: str, idem_key: str) -> BankResult:
    """
    Simulates the bank API per the challenge:
      70% success, 20% failure, 10% hung.
    """
    time.sleep(random.uniform(0.2, 1.5))

    roll = random.random()
    if roll < 0.70:
        return BankResult("success", reference=f"BANK-{uuid.uuid4().hex[:12]}")
    if roll < 0.90:
        reasons = ["insufficient_bank_balance", "invalid_ifsc", "account_frozen", "rejected_by_bank"]
        return BankResult("failed", message=random.choice(reasons))

    time.sleep(45)
    return BankResult("hung", message="bank_did_not_respond")
