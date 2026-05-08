import { describe, expect, it } from "vitest";
import {
  configureAuthBaseUrlEnv,
  isLocalAuthBaseUrl,
  resolveAuthBaseUrl,
  validateOidcAuthBaseUrl,
} from "@/lib/auth-url";

describe("auth base URL configuration", () => {
  it("uses a public app URL instead of a localhost NextAuth URL in production", () => {
    const env = {
      NODE_ENV: "production",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "https://koillection.example.com/",
    } as NodeJS.ProcessEnv;

    expect(resolveAuthBaseUrl(env)).toBe("https://koillection.example.com");
    expect(configureAuthBaseUrlEnv(env)).toBe("https://koillection.example.com");
    expect(env.AUTH_URL).toBe("https://koillection.example.com");
    expect(env.NEXTAUTH_URL).toBe("https://koillection.example.com");
  });

  it("rejects localhost auth URLs when OIDC is enabled in production", () => {
    const env = {
      NODE_ENV: "production",
      OIDC_ENABLED: "true",
      NEXTAUTH_URL: "http://localhost:3000",
    } as NodeJS.ProcessEnv;

    expect(() => validateOidcAuthBaseUrl(env)).toThrow(/localhost/);
  });

  it("allows localhost auth URLs outside production", () => {
    const env = {
      NODE_ENV: "development",
      OIDC_ENABLED: "true",
      NEXTAUTH_URL: "http://localhost:3000",
    } as NodeJS.ProcessEnv;

    expect(() => validateOidcAuthBaseUrl(env)).not.toThrow();
    expect(resolveAuthBaseUrl(env)).toBe("http://localhost:3000");
  });

  it("recognizes local development hostnames", () => {
    expect(isLocalAuthBaseUrl("http://localhost:3000")).toBe(true);
    expect(isLocalAuthBaseUrl("http://0.0.0.0:3000")).toBe(true);
    expect(isLocalAuthBaseUrl("http://app.localhost:3000")).toBe(true);
    expect(isLocalAuthBaseUrl("https://koillection.example.com")).toBe(false);
  });
});
