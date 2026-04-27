import { Link } from "react-router-dom";
import { format } from "date-fns";
import { usePayouts } from "../../hooks/usePayouts";
import { PayoutStatusBadge } from "./PayoutStatusBadge";
import { MoneyDisplay } from "../common/MoneyDisplay";
import { EmptyState } from "../common/EmptyState";
import { ArrowRight, ReceiptText } from "lucide-react";

export function PayoutsTable() {
  const { data: payouts, isLoading } = usePayouts();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#16171d] shadow-sm border dark:border-[#2e303a] rounded-2xl overflow-hidden p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!payouts || payouts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#16171d] p-6 shadow-sm border dark:border-[#2e303a] rounded-2xl">
        <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Payout History</h2>
        <EmptyState
          icon={ReceiptText}
          title="No payouts yet"
          description="Request your first payout to see it appear here."
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#16171d] shadow-sm border dark:border-[#2e303a] rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2e303a]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payout History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-[#1f2028]/50 border-b border-gray-200 dark:border-[#2e303a]">
              <th className="px-6 py-3 text-xs justify-start font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider relative"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#2e303a]">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2028] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {format(new Date(payout.created_at), "MMM d, yyyy HH:mm")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <MoneyDisplay paise={payout.amount_paise} className="text-gray-900 dark:text-gray-100" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <PayoutStatusBadge status={payout.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payout.attempt_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(payout.updated_at), "HH:mm:ss")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    to={`/payouts/${payout.id}`}
                    className="inline-flex items-center text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                  >
                    View <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
