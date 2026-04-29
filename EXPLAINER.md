# Payout Engine Explainer

### 1. The Ledger. Paste your balance calculation query. Why did you model credits and debits this way?

```python
def available_balance_paise(merchant_id) -> int:
    rows = LedgerEntry.objects.filter(merchant_id=merchant_id).aggregate(
        credits=Sum("amount_paise", filter=Q(entry_type__in=["credit", "release"])),
        holds=Sum("amount_paise", filter=Q(entry_type="hold")),
    )
    return (rows["credits"] or 0) - (rows["holds"] or 0)
```

I modeled credits and debits using an append-only HOLD and RELEASE mechanism. When a payout is initiated, we write a `HOLD` entry immediately. If the payout terminally fails, we write a `RELEASE` entry (which acts like a credit). This prevents the balance from being overdrawn without requiring us to wait for the slow, synchronous response from the bank network before confirming the API request or locking the ledger rows for extended periods.

### 2. The Lock. Paste the exact code that prevents two concurrent payouts from overdrawing a balance. Explain what database primitive it relies on.

```python
merchant = Merchant.objects.select_for_update().get(id=merchant_id)
# ...
available = available_balance_paise(merchant_id)
if available < amount_paise:
    raise InsufficientBalance()
```

This relies on PostgreSQL's row-level write lock (`SELECT ... FOR UPDATE`). When two concurrent requests attempt to create a payout for the same merchant, the database isolates the transactions. The first transaction acquires the write lock on the merchant record, and the second transaction blocks until the first completes (commits or rolls back). This ensures that the dynamic balance calculation is serialized and strictly accurate, effectively preventing overdrafts.

### 3. The Idempotency. How does your system know it has seen a key before? What happens if the first request is in flight when the second arrives?

The system intercepts the API request in an `IdempotencyMiddleware`. It ensures atomic uniqueness via the `IdempotencyKey` model which has a `UniqueConstraint` on `(merchant, key)`.

```python
        try:
            with transaction.atomic():
                idem = IdempotencyKey.objects.create(...)
        except IntegrityError:
            with transaction.atomic():
                idem = IdempotencyKey.objects.select_for_update().get(merchant=merchant, key=key)

                # ...
                if idem.state == IdempotencyKey.State.IN_FLIGHT:
                    return JsonResponse({"error": "request_in_flight"}, status=409)
```

If the first request is still processing (`IN_FLIGHT`), the second request triggers an `IntegrityError` due to the unique constraint, drops into a `select_for_update` fetch to safely evaluate the record, and returns an HTTP 409 Conflict with `"error": "request_in_flight"` to prevent duplicate processing.

### 4. The State Machine. Where in the code is failed-to-completed blocked? Show the check.

The restriction is centrally enforced in `backend/payouts/tasks.py` within the `_record_transition()` function, which consults an explicit `ALLOWED_TRANSITIONS` set. Attempting any transition not on this list raises a `ValueError`.

```python
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
    # ...
```

Therefore, a transition from `"failed"` to `"completed"` is blocked at the application level because `("failed", "completed")` is not in the allowed transitions list.

### 5. The AI Audit. One specific example where AI wrote subtly wrong code (bad locking, wrong aggregation, race condition). Paste what it gave you, what you caught, and what you replaced it with.

**What the AI generated:**
Initially, the AI suggested a bloated schema for ledger entry types to track every possible nuanced state:

```python
class EntryType(models.TextChoices):
        CREDIT          = "credit",          "Credit (customer payment)"
        DEBIT_HOLD      = "debit_hold",      "Hold for pending payout"
        DEBIT_SETTLED   = "debit_settled",   "Final debit on payout success"  # only used if you choose 2-step
        CREDIT_REVERSAL = "credit_reversal", "Reversal when payout fails"
        CREDIT_ADJUST   = "credit_adjust",   "Manual adjustment (ops)"
        DEBIT_ADJUST    = "debit_adjust",    "Manual adjustment (ops)"
```

**What I caught:**
The AI overcomplicated the state representations. We don't want so many entry types because it makes balance aggregations heavily fragmented and prone to bugs (for example, missing `CREDIT_REVERSAL` in a sum). An append-only ledger should rely on fundamental constraints, not excessive terminology.

**What I replaced it with:**
I stripped it down to just three core primitives. Real payments come as `credits`, locked funds are a `hold`, and failed payouts return money via a `release`. This drastically simplified our balance SQL queries while preserving complete traceability.

```python
class EntryType(models.TextChoices):
    CREDIT  = "credit"   # seeded money (or real customer payment later)
    HOLD    = "hold"     # funds locked when payout created
    RELEASE = "release"  # funds returned when payout fails
```
