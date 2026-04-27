from django.urls import path
from .views import MerchantViewSet, BankAccountViewSet

urlpatterns = [
    path("merchants/", MerchantViewSet.as_view({"get": "list"})),
    path("bank-accounts/", BankAccountViewSet.as_view({"get": "list"})),
]
