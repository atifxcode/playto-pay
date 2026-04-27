import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function usePayouts() {
  return useQuery({
    queryKey: ["payouts"],
    queryFn: async () => {
      const { data } = await api.get("/payouts/");
      return data;
    },
    refetchInterval: 3000,
  });
}

export function usePayout(id) {
  return useQuery({
    queryKey: ["payout", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/payouts/${id}/`);
      return data;
    },
    enabled: !!id,
    refetchInterval: 3000,
  });
}
