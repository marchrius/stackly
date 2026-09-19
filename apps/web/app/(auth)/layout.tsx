import type { Metadata } from "next";
import { AppVersion } from "@/components/shared/AppVersion";

export const metadata: Metadata = {
  title: "Login",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
      <AppVersion />
    </div>
  );
}
