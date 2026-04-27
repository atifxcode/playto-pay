import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

export function PayoutTimeline({ transitions }) {
  if (!transitions || transitions.length === 0) return <p className="text-sm text-gray-500">No transitions yet.</p>;

  return (
    <div className="space-y-4">
      {transitions.map((t, idx) => (
        <div key={t.id} className="flex gap-4 relative">
          {idx !== transitions.length - 1 && (
            <div className="absolute top-8 bottom-[-16px] left-[15px] border-l-2 border-dashed border-gray-200 dark:border-gray-700" />
          )}
          <div className="flex-none z-10 bg-white dark:bg-[#16171d] mt-1">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-2 border-white dark:border-[#16171d]">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            </div>
          </div>
          <div className="pb-4">
            <p className="text-sm text-gray-900 dark:text-gray-100 font-medium flex items-center gap-2">
              <span className="capitalize">{t.from_status}</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <span className="capitalize">{t.to_status}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {format(new Date(t.created_at), "MMM d, yyyy HH:mm:ss")}
            </p>
            {t.reason && <p className="text-xs text-red-500 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/10 p-2 rounded max-w-sm">{t.reason}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
