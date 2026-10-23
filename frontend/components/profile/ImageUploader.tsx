"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch, errorMessages } from "@/lib/auth-client";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploader({
  kind,
  currentUrl,
  maxMb,
}: {
  kind: "avatar" | "cover";
  currentUrl: string | null;
  maxMb: number;
}) {
  const { m } = useI18n();
  const { refresh } = useAuth();
  const u = m.profile.upload;
  const urlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isAvatar = kind === "avatar";

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function select(f: File | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = f ? URL.createObjectURL(f) : null;
    setFile(f);
    setPreview(urlRef.current);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    setError("");
    if (!f) return;
    if (!TYPES.includes(f.type)) return setError(u.errType);
    if (f.size > maxMb * 1024 * 1024) return setError(u.errSize(maxMb));
    select(f);
  }

  async function send(method: "POST" | "DELETE") {
    setPending(true);
    setError("");
    try {
      let body: FormData | undefined;
      if (method === "POST" && file) {
        body = new FormData();
        body.append("image", file);
      }
      const res = await apiFetch(`/auth/me/${kind}/`, { method, body });
      if (res.ok) {
        select(null);
        await refresh();
      } else {
        setError(Object.values(await errorMessages(res))[0]?.[0] ?? u.failed);
      }
    } catch {
      setError(m.profile.form.offline);
    } finally {
      setPending(false);
    }
  }

  function remove() {
    if (window.confirm(u.removeConfirm)) void send("DELETE");
  }

  const shown = preview ?? currentUrl;

  return (
    <div>
      <p className="text-sm font-medium">{isAvatar ? u.avatar : u.cover}</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={
            isAvatar
              ? "h-24 w-24 shrink-0 overflow-hidden rounded-full border border-line bg-raised"
              : "aspect-[16/5] w-full max-w-md overflow-hidden rounded-xl border border-line bg-raised"
          }
        >
          {shown && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 text-sm">
          <p className="text-xs text-muted">{isAvatar ? u.hintAvatar(maxMb) : u.hintCover(maxMb)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {file ? (
              <>
                <Button onClick={() => send("POST")} disabled={pending} className="h-10">
                  {pending ? u.uploading : u.save}
                </Button>
                <Button variant="secondary" onClick={() => select(null)} disabled={pending} className="h-10">
                  {u.cancel}
                </Button>
              </>
            ) : (
              <>
                <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-line px-4 text-sm font-semibold transition-colors hover:bg-raised focus-within:outline-2 focus-within:outline-accent">
                  {u.choose}
                  <input type="file" accept={TYPES.join(",")} onChange={onPick} className="sr-only" />
                </label>
                {currentUrl && (
                  <Button variant="secondary" onClick={remove} disabled={pending} className="h-10">
                    {u.remove}
                  </Button>
                )}
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}