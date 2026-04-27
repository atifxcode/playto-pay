import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { generateIdempotencyKey } from "../lib/idempotency";

export function useRequestPayout() {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  const mutation = useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post("/payouts/", body, {
        headers: {
          "Idempotency-Key": idempotencyKeyRef.current,
        },
      });
      return data;
    },
    onSuccess: () => {
      idempotencyKeyRef.current = generateIdempotencyKey();
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });

  return mutation;
}
