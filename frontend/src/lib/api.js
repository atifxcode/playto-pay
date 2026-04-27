import axios from "axios";
import { getMerchantContext } from "./auth";

export const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
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
