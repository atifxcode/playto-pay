from django.http import JsonResponse

from merchants.models import Merchant


class MerchantContextMiddleware:
    """
    Attaches request.merchant using X-Merchant-Id header.
    This keeps local testing simple until auth-based merchant resolution is added.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.merchant = None

        merchant_id = request.headers.get("X-Merchant-Id")
        if merchant_id:
            try:
                request.merchant = Merchant.objects.get(id=merchant_id)
            except Merchant.DoesNotExist:
                return JsonResponse({"error": "invalid_merchant"}, status=401)

        return self.get_response(request)
