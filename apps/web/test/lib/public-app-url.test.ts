import { describe, expect, it } from "vitest";
import { resolvePublicAppUrl, resolvePublicUrl } from "@/lib/public-app-url";

describe("public app URL", () => {
  it("prefers the public app URL over the authentication URL", () => {
    const env = {
      NODE_ENV: "production",
      AUTH_URL: "https://auth.example.com/base/",
      NEXT_PUBLIC_APP_URL: "https://public.example.com",
    } as NodeJS.ProcessEnv;

    expect(resolvePublicAppUrl(env)?.toString()).toBe("https://public.example.com/");
    expect(resolvePublicUrl("/public/collections/123", env)).toBe(
      "https://public.example.com/public/collections/123",
    );
  });

  it("skips invalid values", () => {
    const env = {
      NODE_ENV: "production",
      AUTH_URL: "javascript:alert(1)",
      NEXTAUTH_URL: "not a URL",
      PUBLIC_APP_URL: "https://stackly.example.com/",
    } as NodeJS.ProcessEnv;

    expect(resolvePublicAppUrl(env)?.toString()).toBe("https://stackly.example.com/");
  });

  it("does not publish localhost metadata when a production origin is available", () => {
    const env = {
      NODE_ENV: "production",
      AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "https://stackly.example.com",
    } as NodeJS.ProcessEnv;

    expect(resolvePublicAppUrl(env)?.toString()).toBe("https://stackly.example.com/");
  });

  it("falls back to localhost only outside production", () => {
    expect(resolvePublicAppUrl({ NODE_ENV: "development" } as NodeJS.ProcessEnv)?.toString()).toBe(
      "http://localhost:3000/",
    );
    expect(resolvePublicAppUrl({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBeNull();
    expect(
      resolvePublicAppUrl({ NODE_ENV: "production", AUTH_URL: "http://localhost:3000" } as NodeJS.ProcessEnv),
    ).toBeNull();
  });

  it("keeps relative URLs in production when no public origin is configured", () => {
    expect(
      resolvePublicUrl("/api/public/previews/collections/123?v=abc", {
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).toBe("/api/public/previews/collections/123?v=abc");
  });
});
