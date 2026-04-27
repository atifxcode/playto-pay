import { useBalance } from "../../hooks/useBalance";
import { BalanceCard } from "./BalanceCard";
import { Wallet, Lock, Coins } from "lucide-react";

export function BalanceCards() {
  const { data, isLoading } = useBalance();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
      <BalanceCard
        title="Available Balance"
        amountPaise={data?.available_paise}
        icon={Wallet}
        loading={isLoading}
      />
      <BalanceCard
        title="Held Balance"
        amountPaise={data?.held_paise}
        icon={Lock}
        loading={isLoading}
      />
      <BalanceCard
        title="Total Balance"
        amountPaise={(data?.available_paise || 0) + (data?.held_paise || 0)}
        icon={Coins}
        loading={isLoading}
      />
    </div>
  );
}
