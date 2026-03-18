import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Registrazione" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Koillection</h1>
        <p className="text-muted-foreground mt-2">Crea il tuo account</p>
      </div>
      <RegisterForm />
    </div>
  );
}

