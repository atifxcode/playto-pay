from django.db.models import Q, Sum

from .models import LedgerEntry


# def available_balance_paise(merchant_id) -> int:
#     """
#     available = SUM(credit + release) - SUM(hold)
#     A HOLD without a RELEASE = settled debit (payout completed).
#     """
#     rows = LedgerEntry.objects.filter(merchant_id=merchant_id).aggregate(
#         credits=Sum("amount_paise", filter=Q(entry_type__in=["credit", "release"])),
#         holds=Sum("amount_paise", filter=Q(entry_type="hold")),
#     )
#     return (rows["credits"] or 0) - (rows["holds"] or 0)

def available_balance_paise(merchant_id) -> int:
    """
    available = SUM(credit + release) - SUM(hold)
    A HOLD without a RELEASE = settled debit (payout completed).
    """
    rows = LedgerEntry.objects.filter(merchant_id=merchant_id).aggregate(
        credits=Sum("amount_paise", filter=Q(entry_type__in=["credit", "release"])),
        holds=Sum("amount_paise", filter=Q(entry_type="hold")),
    )
    
    credits = rows["credits"] or 0
    holds = rows["holds"] or 0
    available = credits - holds
    
    print(f"--------------------------------------------------------------------------------------------")
    print(f"DEBUG: Merchant {merchant_id} | Credits: {credits} | Holds: {holds} | Available: {available}")
    print(f"--------------------------------------------------------------------------------------------")
    
    return available



def held_balance_paise(merchant_id) -> int:
    """Sum of HOLDs whose payout is still pending/processing."""
    return (
        LedgerEntry.objects.filter(
            merchant_id=merchant_id,
            entry_type="hold",
            payout__status__in=["pending", "processing"],
        ).aggregate(s=Sum("amount_paise"))["s"]
        or 0
    )
