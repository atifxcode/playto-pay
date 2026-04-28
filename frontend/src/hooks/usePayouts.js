// import { useQuery } from "@tanstack/react-query";
// import { api } from "../lib/api";

// export function usePayouts() {
//   return useQuery({
//     queryKey: ["payouts"],
//     queryFn: async () => {
//       const { data } = await api.get("/payouts/");
//       return data;
//     },
//     refetchInterval: 3000,
//   });
// }


import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "../lib/api";


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


export function usePayouts() {
  const queryClient = useQueryClient();
  const prevDataRef = useRef();

  const query = useQuery({
    queryKey: ["payouts"],
    queryFn: async () => {
      const { data } = await api.get("/payouts/");
      return data;
    },
    refetchInterval: 3000, 
  });

  useEffect(() => {
    if (query.data) {
      const currentStatuses = query.data.map(p => `${p.id}-${p.status}`).join("|");
      
      // If the statuses are different from the last time we checked
      if (prevDataRef.current && prevDataRef.current !== currentStatuses) {
        console.log("Status change detected! Refreshing balance...");
        queryClient.invalidateQueries({ queryKey: ["balance"] });
      }
      
      prevDataRef.current = currentStatuses;
    }
  }, [query.data, queryClient]);

  return query;
}