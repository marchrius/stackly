import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import { getThemeClass } from "@/lib/theme/themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Koillection",
    default: "Koillection",
  },
  description: "Gestisci le tue collezioni personali",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();

  let themeValue: string | null | undefined = session?.user?.theme;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    });
    themeValue = dbUser?.theme ?? themeValue;
  }

  const themeClass = getThemeClass(themeValue);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} ${themeClass}`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
