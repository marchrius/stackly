import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Koillection</h1>
        <p className="text-muted-foreground mt-2">Accedi al tuo account</p>
      </div>
      <LoginForm />
    </div>
  );
}

