import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useBalance() {
  return useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const { data } = await api.get("/balance/");
      return data;
    },
    // refetchInterval: 5000,
  });
}
