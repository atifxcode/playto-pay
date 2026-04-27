import { useParams, Link } from "react-router-dom";
import { usePayout } from "../hooks/usePayouts";
import { PayoutStatusBadge } from "../components/payouts/PayoutStatusBadge";
import { PayoutTimeline } from "../components/payouts/PayoutTimeline";
import { PayoutAttemptsTable } from "../components/payouts/PayoutAttemptsTable";
import { MoneyDisplay } from "../components/common/MoneyDisplay";
import { format } from "date-fns";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";

export function PayoutDetail() {
  const { id } = useParams();
  const { data: payout, isLoading } = usePayout(id);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="text-center py-12 bg-white dark:bg-[#16171d] rounded-2xl border dark:border-[#2e303a]">
        <p className="text-gray-500">Payout not found.</p>
        <Link to="/dashboard" className="text-purple-600 dark:text-purple-400 hover:underline mt-4 inline-block font-medium">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Payout <span className="text-gray-400 font-mono text-lg ml-2">#{payout.id.split('-')[0]}</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Requested on {format(new Date(payout.created_at), "MMM d, yyyy 'at' HH:mm")}
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-[#16171d] px-6 py-3 rounded-xl border dark:border-[#2e303a] shadow-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wider">Amount</p>
              <MoneyDisplay paise={payout.amount_paise} className="text-2xl font-bold text-gray-900 dark:text-gray-100" />
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-[#2e303a] mx-2" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2 tracking-wider">Status</p>
              <PayoutStatusBadge status={payout.status} />
            </div>
          </div>
        </div>
      </div>

      {payout.failure_reason && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 flex-none" />
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Payout Failed</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{payout.failure_reason}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white dark:bg-[#16171d] shadow-sm border dark:border-[#2e303a] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2e303a] bg-gray-50/50 dark:bg-[#1a1b23]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Processing Attempts</h2>
            <p className="text-sm text-gray-500 mt-1">Detailed log of network attempts made by the payout engine.</p>
          </div>
          <PayoutAttemptsTable attempts={payout.attempts} />
        </div>
        
        <div className="bg-white dark:bg-[#16171d] shadow-sm border dark:border-[#2e303a] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2e303a] bg-gray-50/50 dark:bg-[#1a1b23]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Execution Timeline</h2>
          </div>
          <div className="p-6">
            <PayoutTimeline transitions={payout.transitions} attempts={payout.attempts} />
          </div>
        </div>
      </div>
    </div>
  );
}
