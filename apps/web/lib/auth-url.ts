const AUTH_BASE_URL_ENV_KEYS = [
  "AUTH_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "PUBLIC_APP_URL",
  "APP_URL",
] as const;

type AuthBaseUrlEnv = NodeJS.ProcessEnv & Partial<Record<(typeof AUTH_BASE_URL_ENV_KEYS)[number], string>>;

function normalizeAuthBaseUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function isLocalAuthBaseUrl(value: string): boolean {
  const hostname = new URL(value).hostname.toLowerCase();
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "0.0.0.0"
    || hostname === "::1"
    || hostname === "[::1]"
    || hostname.endsWith(".localhost");
}

export function resolveAuthBaseUrl(env: AuthBaseUrlEnv = process.env): string | null {
  const candidates = AUTH_BASE_URL_ENV_KEYS
    .map((key) => normalizeAuthBaseUrl(env[key]))
    .filter((value): value is string => Boolean(value));

  if (candidates.length === 0) return null;

  if (env.NODE_ENV === "production") {
    return candidates.find((candidate) => !isLocalAuthBaseUrl(candidate)) ?? candidates[0];
  }

  return candidates[0];
}

export function configureAuthBaseUrlEnv(env: AuthBaseUrlEnv = process.env): string | null {
  const authBaseUrl = resolveAuthBaseUrl(env);
  if (!authBaseUrl) return null;

  env.AUTH_URL = authBaseUrl;
  env.NEXTAUTH_URL = authBaseUrl;
  return authBaseUrl;
}

export function validateOidcAuthBaseUrl(env: AuthBaseUrlEnv = process.env): void {
  if (env.OIDC_ENABLED !== "true" || env.NODE_ENV !== "production") return;

  const authBaseUrl = resolveAuthBaseUrl(env);
  if (!authBaseUrl) {
    throw new Error("OIDC is enabled in production, but AUTH_URL or NEXTAUTH_URL is not configured.");
  }

  if (isLocalAuthBaseUrl(authBaseUrl)) {
    throw new Error(
      "OIDC is enabled in production, but the auth base URL points to localhost. "
        + "Set NEXTAUTH_URL or AUTH_URL to the public site domain.",
    );
  }
}
