import { cn } from "../../lib/utils";

export function PayoutStatusBadge({ status }) {
  const statusConfig = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-900",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-900",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-900",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500 border-red-200 dark:border-red-900",
  };

  const defaultClasses = "px-2.5 py-0.5 rounded-full text-xs font-semibold border";
  const colors = statusConfig[status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={cn(defaultClasses, colors)}>
      {status?.toUpperCase()}
    </span>
  );
}
