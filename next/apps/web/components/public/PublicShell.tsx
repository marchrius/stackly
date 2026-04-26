import Link from "next/link";

interface PublicShellProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}

export function PublicShell({ children, eyebrow, title }: PublicShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Stackly
          </Link>
          <span className="text-xs font-medium text-muted-foreground">{eyebrow}</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}
