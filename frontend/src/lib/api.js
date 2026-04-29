import axios from "axios";
import { getMerchantContext } from "./auth";

const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/api/v1`;

export const api = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const merchant = getMerchantContext();
  if (merchant?.id) {
    config.headers["X-Merchant-Id"] = merchant.id;
  }
  return config;
});
