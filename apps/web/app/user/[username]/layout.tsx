import Link from "next/link";
import { AppVersion } from "@/components/shared/AppVersion";

export default function SharedUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Stackly
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </div>
      <AppVersion />
    </main>
  );
}
