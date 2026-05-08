import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@stackly/db";
import { buildCustomThemeCss, CONFIGURATION_LABELS, readAdminConfiguration } from "@/lib/configuration";
import { getThemeClass, normalizeTheme } from "@/lib/theme/themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "Stackly",
  title: {
    template: "%s | Stackly",
    default: "Stackly",
  },
  description: "Self-hosted collection manager for physical collections, metadata, wishlists, albums, and loans.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stackly",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();

  const [dbUser, configurationEntries] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { theme: true },
        })
      : Promise.resolve(null),
    prisma.configuration.findMany({
      where: {
        label: {
          in: [CONFIGURATION_LABELS.customLightThemeCss, CONFIGURATION_LABELS.customDarkThemeCss],
        },
      },
      select: { label: true, value: true },
    }),
  ]);

  const normalizedTheme = normalizeTheme(dbUser?.theme ?? session?.user?.theme);
  const themeClass = getThemeClass(normalizedTheme);
  const customThemeCss = buildCustomThemeCss(normalizedTheme, readAdminConfiguration(configurationEntries));

  return (
    <html lang={locale} className={themeClass} suppressHydrationWarning>
      <body className={inter.className}>
        {customThemeCss ? <style dangerouslySetInnerHTML={{ __html: customThemeCss }} /> : null}
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
