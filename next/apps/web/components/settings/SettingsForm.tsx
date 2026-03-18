"use client";

import type { User } from "@koillection/db";
import { useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@koillection/ui";
import { updateSettings, changePassword } from "@/lib/actions/user.actions";

export function SettingsForm({ user }: { user: User }) {
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    await updateSettings(new FormData(e.currentTarget));
    setSaving(false);
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    const result = await changePassword(new FormData(e.currentTarget));
    if (result?.error) setPwError(String(Object.values(result.error)[0]?.[0]));
    else setPwSuccess(true);
    setPwLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* Preferenze */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Preferenze</h2>
        <form onSubmit={handleSettings} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locale">Lingua</Label>
              <Select name="locale" defaultValue={user.locale}>
                <SelectTrigger id="locale"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["en","it","fr","de","es","pt","nl","pl","ru","uk","tr","da","zh","pt_BR"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Valuta</Label>
              <Input id="currency" name="currency" defaultValue={user.currency} maxLength={3} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <Select name="theme" defaultValue={user.theme}>
                <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatico</SelectItem>
                  <SelectItem value="light">Chiaro</SelectItem>
                  <SelectItem value="dark">Scuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Formato data</Label>
              <Input id="dateFormat" name="dateFormat" defaultValue={user.dateFormat} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Salvataggio…" : "Salva preferenze"}</Button>
        </form>
      </section>

      {/* Password */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Cambia Password</h2>
        <form onSubmit={handlePassword} className="space-y-4 max-w-sm">
          {pwError && <p className="text-destructive text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">Password aggiornata con successo.</p>}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password attuale</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nuova password</Label>
            <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
          </div>
          <Button type="submit" disabled={pwLoading}>{pwLoading ? "Aggiornamento…" : "Cambia password"}</Button>
        </form>
      </section>
    </div>
  );
}

