import { format } from "date-fns";
import { cn } from "../../lib/utils";

export function PayoutAttemptsTable({ attempts }) {
  if (!attempts || attempts.length === 0) return <p className="text-sm text-gray-500">No attempts logged.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-[#1f2028]/50 border-b border-gray-200 dark:border-[#2e303a]">
            <th className="px-4 py-2 text-xs font-medium text-gray-500 tracking-wider">#</th>
            <th className="px-4 py-2 text-xs font-medium text-gray-500 tracking-wider">Started</th>
            <th className="px-4 py-2 text-xs font-medium text-gray-500 tracking-wider">Finished</th>
            <th className="px-4 py-2 text-xs font-medium text-gray-500 tracking-wider">Outcome</th>
            <th className="px-4 py-2 text-xs font-medium text-gray-500 tracking-wider">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-[#2e303a]">
          {attempts.map(a => (
            <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2028] transition-colors">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{a.attempt_number}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 w-32">
                {format(new Date(a.started_at), "HH:mm:ss")}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 w-32">
                {a.finished_at ? format(new Date(a.finished_at), "HH:mm:ss") : "-"}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={cn("px-2 py-0.5 rounded text-xs", a.outcome === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400")}>
                  {a.outcome || "pending"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={a.notes}>
                {a.notes || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
