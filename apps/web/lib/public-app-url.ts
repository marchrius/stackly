const PUBLIC_APP_URL_ENV_KEYS = [
  "AUTH_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "PUBLIC_APP_URL",
  "APP_URL",
] as const;

type PublicAppUrlEnv = NodeJS.ProcessEnv &
  Partial<Record<(typeof PUBLIC_APP_URL_ENV_KEYS)[number], string>>;

function normalizePublicAppUrl(value: string | undefined): URL | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    url.hash = "";
    url.search = "";
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
    return url;
  } catch {
    return null;
  }
}

export function resolvePublicAppUrl(env: PublicAppUrlEnv = process.env): URL | null {
  const candidates: URL[] = [];
  for (const key of PUBLIC_APP_URL_ENV_KEYS) {
    const url = normalizePublicAppUrl(env[key]);
    if (url) candidates.push(url);
  }

  if (env.NODE_ENV === "production") {
    return candidates.find((url) => !isLocalHostname(url.hostname)) ?? null;
  }

  return candidates[0] ?? new URL("http://localhost:3000/");
}

export function resolvePublicUrl(path: string, env: PublicAppUrlEnv = process.env): string {
  const baseUrl = resolvePublicAppUrl(env);
  return baseUrl ? new URL(path, baseUrl).toString() : path;
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost"
    || normalized === "127.0.0.1"
    || normalized === "0.0.0.0"
    || normalized === "::1"
    || normalized.endsWith(".localhost");
}
