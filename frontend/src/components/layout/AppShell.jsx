import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function AppShell() {
  const { merchant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#16171d]">
      <header className="border-b bg-white dark:bg-[#1f2028] dark:border-[#2e303a] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 italic">Playto</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {merchant?.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
