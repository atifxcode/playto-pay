import { formatPaise } from "../../lib/money";

export function MoneyDisplay({ paise, className }) {
  return <span className={className}>{formatPaise(paise)}</span>;
}
