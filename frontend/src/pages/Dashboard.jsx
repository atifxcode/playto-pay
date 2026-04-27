import { useState } from "react";
import { BalanceCards } from "../components/balance/BalanceCards";
import { PayoutsTable } from "../components/payouts/PayoutsTable";
import { RequestPayoutDialog } from "../components/payouts/RequestPayoutDialog";

export function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View your balances and latest activity.</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="h-10 bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Request Payout
        </button>
      </div>

      <BalanceCards />
      
      <PayoutsTable />

      <RequestPayoutDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
}
