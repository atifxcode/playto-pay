import { useState } from "react";
import {
  getMerchantContext,
  setMerchantContext,
  clearMerchantContext,
} from "../lib/auth";

export function useAuth() {
  const [merchant, setMerchant] = useState(getMerchantContext());

  const login = (merchantData) => {
    setMerchantContext(merchantData);
    setMerchant(merchantData);
  };

  const logout = () => {
    clearMerchantContext();
    setMerchant(null);
  };

  return { merchant, login, logout, isAuthenticated: !!merchant };
}
