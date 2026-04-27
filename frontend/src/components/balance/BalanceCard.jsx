import { cn } from "../../lib/utils";
import { formatPaise } from "../../lib/money";

export function BalanceCard({ title, amountPaise, className, icon: Icon, loading }) {
  return (
    <div className={cn("p-6 rounded-2xl border bg-white shadow-sm dark:bg-[#16171d] dark:border-[#2e303a]", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      {loading ? (
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {formatPaise(amountPaise || 0)}
        </div>
      )}
    </div>
  );
}
