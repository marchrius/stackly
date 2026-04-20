import { z } from "zod";

const oidcProviderSchema = z.enum(["generic", "keycloak", "microsoft", "google"]);

const oidcEnvSchema = z.object({
  enabled: z.boolean(),
  provider: oidcProviderSchema,
  issuer: z.string().url().optional(),
  clientId: z.string().min(1).optional(),
  clientSecret: z.string().min(1).optional(),
  scopes: z.string().default("openid profile email"),
});

export interface OidcProviderConfig {
  id: "oidc";
  name: string;
  type: "oidc";
  issuer: string;
  clientId: string;
  clientSecret: string;
  authorization?: {
    params: {
      scope: string;
      prompt?: string;
    };
  };
}

function readEnv() {
  const rawProvider = (process.env.OIDC_PROVIDER ?? "generic").toLowerCase();
  const provider = oidcProviderSchema.safeParse(rawProvider).success ? rawProvider : "generic";

  const parsed = oidcEnvSchema.safeParse({
    enabled: process.env.OIDC_ENABLED === "true",
    provider,
    issuer: process.env.OIDC_ISSUER_URL,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    scopes: process.env.OIDC_SCOPES ?? "openid profile email",
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function getOidcProviderConfig(): OidcProviderConfig | null {
  const env = readEnv();
  if (!env || !env.enabled) return null;

  if (!env.clientId || !env.clientSecret) return null;

  const scope = env.scopes;

  if (env.provider === "keycloak") {
    if (!env.issuer) return null;
    return {
      id: "oidc",
      name: "Keycloak",
      type: "oidc",
      issuer: env.issuer,
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      authorization: {
        params: { scope },
      },
    };
  }

  if (env.provider === "microsoft") {
    const issuer = env.issuer ?? "https://login.microsoftonline.com/common/v2.0";
    return {
      id: "oidc",
      name: "Microsoft",
      type: "oidc",
      issuer,
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      authorization: {
        params: { scope },
      },
    };
  }

  if (env.provider === "google") {
    const issuer = env.issuer ?? "https://accounts.google.com";
    return {
      id: "oidc",
      name: "Google",
      type: "oidc",
      issuer,
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      authorization: {
        params: { scope, prompt: "consent" },
      },
    };
  }

  if (!env.issuer) return null;
  return {
    id: "oidc",
    name: "OIDC",
    type: "oidc",
    issuer: env.issuer,
    clientId: env.clientId,
    clientSecret: env.clientSecret,
    authorization: {
      params: { scope },
    },
  };
}

export function isOidcEnabled(): boolean {
  return Boolean(getOidcProviderConfig());
}
