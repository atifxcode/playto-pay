from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BalanceView, PayoutViewSet

router = DefaultRouter()
router.register(r"payouts", PayoutViewSet, basename="payout")

urlpatterns = router.urls + [
    path("balance/", BalanceView.as_view()),
]
