import uuid

from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection, transaction

from ledger.models import LedgerEntry
from merchants.models import BankAccount, Merchant


class Command(BaseCommand):
    help = "Seed 3 merchants with bank accounts and initial credit balances."

    def _drop_all_tables(self):
        vendor = connection.vendor
        with connection.cursor() as cursor:
            if vendor == "postgresql":
                cursor.execute(
                    """
                    DO $$
                    DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (
                            SELECT tablename
                            FROM pg_tables
                            WHERE schemaname = 'public'
                        )
                        LOOP
                            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                        END LOOP;
                    END $$;
                    """
                )
            
            else:
                raise RuntimeError(f"Unsupported DB vendor for reset: {vendor}")

    def handle(self, *args, **options):
        self.stdout.write("Resetting database: dropping all tables...")
        self._drop_all_tables()
        self.stdout.write("Re-running migrations...")
        call_command("migrate", interactive=False, verbosity=0)

        seeds = [
            {
                "username": "merchant_alpha",
                "name": "Alpha Agency",
                "ifsc": "HDFC0000001",
                "last4": "1111",
                "credit_paise": 250000,
            },
            {
                "username": "merchant_beta",
                "name": "Beta Freelance",
                "ifsc": "ICIC0000002",
                "last4": "2222",
                "credit_paise": 180000,
            },
            {
                "username": "merchant_gamma",
                "name": "Gamma Studio",
                "ifsc": "SBIN0000003",
                "last4": "3333",
                "credit_paise": 300000,
            },
        ]

        with transaction.atomic():
            for item in seeds:
                user, _ = User.objects.get_or_create(
                    username=item["username"],
                    defaults={
                        "email": f"{item['username']}@example.com",
                        "is_active": True,
                    },
                )

                merchant, merchant_created = Merchant.objects.get_or_create(
                    user=user,
                    defaults={"name": item["name"]},
                )
                if not merchant_created and merchant.name != item["name"]:
                    merchant.name = item["name"]
                    merchant.save(update_fields=["name"])

                BankAccount.objects.get_or_create(
                    merchant=merchant,
                    account_number_last4=item["last4"],
                    defaults={
                        "account_holder_name": item["name"],
                        "account_number_encrypted": uuid.uuid4().bytes,
                        "ifsc": item["ifsc"],
                        "is_active": True,
                    },
                )

                LedgerEntry.objects.create(
                    merchant=merchant,
                    entry_type=LedgerEntry.EntryType.CREDIT,
                    amount_paise=item["credit_paise"],
                    description="seed_initial_credit",
                )

        self.stdout.write(self.style.SUCCESS("Seed complete: 3 merchants with starting balances."))
