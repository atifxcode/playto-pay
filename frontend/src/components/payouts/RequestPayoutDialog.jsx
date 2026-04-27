import { useState, useEffect } from "react";
import { useRequestPayout } from "../../hooks/useRequestPayout";
import { useBalance } from "../../hooks/useBalance";
import { api } from "../../lib/api";
import { formatPaise } from "../../lib/money";
import { X, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export function RequestPayoutDialog({ isOpen, onClose }) {
  const { data: balanceData } = useBalance();
  const { mutate: requestPayout, isPending } = useRequestPayout();
  
  const [bankAccounts, setBankAccounts] = useState([]);
  const [amountRupees, setAmountRupees] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");

  const availablePaise = balanceData?.available_paise || 0;
  const amountPaise = Math.round(Number(amountRupees || 0) * 100);
  const isAmountValid = amountPaise > 0 && amountPaise <= availablePaise;
  const isFormValid = isAmountValid && selectedBankId;

  useEffect(() => {
    if (isOpen) {
      api.get("/bank-accounts/").then(res => {
        setBankAccounts(res.data);
        if (res.data.length > 0) setSelectedBankId(res.data[0].id);
      }).catch(err => {
        toast.error("Failed to fetch bank accounts");
      });
    } else {
      setAmountRupees("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    requestPayout(
      { bank_account_id: selectedBankId, amount_paise: amountPaise },
      {
        onSuccess: () => {
          toast.success("Payout requested successfully");
          onClose();
        },
        onError: (err) => {
          const detail = err.response?.data?.detail || "Something went wrong";
          toast.error("Failed to request payout: " + detail);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1f2028] border dark:border-[#2e303a] rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-gray-100">Request Payout</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Account</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full h-11 border border-gray-200 dark:border-[#2e303a] rounded-lg px-3 bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" disabled>Select a bank account</option>
              {bankAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_holder_name} (•••• {acc.account_number_last4})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full h-11 border border-gray-200 dark:border-[#2e303a] rounded-lg pl-8 pr-4 bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className={cn("text-gray-500", amountPaise > availablePaise && "text-red-500")}>
                Available: {formatPaise(availablePaise)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className="w-full h-11 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Request Payout
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
