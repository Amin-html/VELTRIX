export type User = {
  id: string;
  email: string;
  first_name: string;
  phone: string;
  role: "customer" | "master" | "admin";
  email_verified: boolean;
  username: string | null;
  bio: string;
  city: string;
  avatar_url: string | null;
  cover_url: string | null;
  date_joined: string;
};

function csrfToken(): string {
  const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (method !== "GET") {
    if (!csrfToken()) await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
    headers.set("X-CSRFToken", csrfToken());
  }
  // JSON-заголовок только для строки: у FormData браузер сам ставит multipart с границей
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`/api/v1${path}`, { ...init, headers, credentials: "same-origin" });
}

export async function errorMessages(
  res: Response,
  texts?: { tooMany: string; generic: string },
): Promise<Record<string, string[]>> {
  if (res.status === 429) {
    return { detail: [texts?.tooMany ?? "Слишком много попыток. Подождите минуту."] };
  }
  try {
    const data = await res.json();
    const out: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(data)) {
      out[key] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
    return out;
  } catch {
    return { detail: [texts?.generic ?? "Что-то пошло не так. Попробуйте ещё раз."] };
  }
}