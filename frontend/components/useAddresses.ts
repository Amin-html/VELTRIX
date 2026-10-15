import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth-client";

export type SavedAddress = { id: number; label: string; address: string };

export function useAddresses(enabled: boolean) {
  const [items, setItems] = useState<SavedAddress[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  const reload = useCallback(async () => {
    try {
      const res = await apiFetch("/auth/addresses/");
      if (!res.ok) return setState("error");
      setItems((await res.json()) as SavedAddress[]);
      setState("ok");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { items, state, reload };
}