"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch, errorMessages } from "@/lib/auth-client";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type CredentialResponse = { credential?: string };
type GoogleId = {
  initialize: (config: { client_id: string; callback: (r: CredentialResponse) => void }) => void;
  renderButton: (el: HTMLElement, options: Record<string, string | number>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

export default function GoogleSignIn() {
  const router = useRouter();
  const { refresh } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const onCredential = useCallback(
    async (resp: CredentialResponse) => {
      if (!resp.credential) return;
      setError("");
      try {
        const res = await apiFetch("/auth/google/", {
          method: "POST",
          body: JSON.stringify({ credential: resp.credential }),
        });
        if (res.ok) {
          await refresh();
          router.push("/account");
          return;
        }
        setError(Object.values(await errorMessages(res))[0]?.[0] ?? "Не удалось войти через Google.");
      } catch {
        setError("Нет соединения с сервером. Попробуйте ещё раз.");
      }
    },
    [refresh, router],
  );

  useEffect(() => {
    if (!CLIENT_ID || !ready || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: onCredential });
    const width = Math.min(400, Math.max(200, Math.floor(buttonRef.current.offsetWidth)));
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      width,
    });
  }, [ready, onCredential]);

  if (!CLIENT_ID) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        или
        <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={buttonRef} className="mt-4 flex min-h-11 justify-center" />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
    </div>
  );
}