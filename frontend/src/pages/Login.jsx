import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { toast } from "sonner";
import { LayoutDashboard } from "lucide-react";

export function Login() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    api.get("/merchants/")
      .then(res => {
        setMerchants(res.data);
      })
      .catch(err => toast.error("Failed to fetch merchants. Please ensure backend is running."))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (merchant) => {
    login(merchant);
    toast.success(`Logged in as ${merchant.name}`);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#16171d] p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1f2028] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2e303a] p-8 transform transition-all hover:scale-[1.01]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Playto Payouts</h1>
          <p className="text-sm text-gray-500 mt-2 text-center leading-relaxed">Select a seeded demo account to autofill credentials.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {merchants.length === 0 ? (
              <p className="text-sm text-red-500 text-center py-4 bg-red-50 dark:bg-red-900/10 rounded-lg">No merchants found. Did you run the seed script?</p>
            ) : (
              merchants.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleLogin(m)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-[#2e303a] hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">{m.name}</span>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
