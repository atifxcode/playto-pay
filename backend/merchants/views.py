from rest_framework import viewsets
from rest_framework.response import Response
from .models import Merchant, BankAccount

class MerchantViewSet(viewsets.ViewSet):
    def list(self, request):
        merchants = Merchant.objects.all()
        return Response([{"id": m.id, "name": m.name} for m in merchants])

class BankAccountViewSet(viewsets.ViewSet):
    def list(self, request):
        merchant = getattr(request, "merchant", None)
        if merchant is None:
            return Response({"error": "merchant_context_required"}, status=401)
        accounts = BankAccount.objects.filter(merchant=merchant)
        return Response([
            {
                "id": str(a.id),
                "account_holder_name": a.account_holder_name,
                "account_number_last4": a.account_number_last4,
                "ifsc": a.ifsc
             }
            for a in accounts
        ])
