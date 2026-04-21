import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale } from "./locales";
import { LOCALE_COOKIE_NAMES } from "@/lib/cookies";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw =
    LOCALE_COOKIE_NAMES.map((cookieName) => cookieStore.get(cookieName)?.value).find(Boolean) ?? DEFAULT_LOCALE;
  const locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
