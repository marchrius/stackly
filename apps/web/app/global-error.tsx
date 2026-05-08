"use client";

import en from "../messages/en.json";
import it from "../messages/it.json";
import fr from "../messages/fr.json";
import es from "../messages/es.json";
import de from "../messages/de.json";
import nl from "../messages/nl.json";
import da from "../messages/da.json";
import pl from "../messages/pl.json";
import pt from "../messages/pt.json";
import ptBR from "../messages/pt_BR.json";
import ru from "../messages/ru.json";
import tr from "../messages/tr.json";
import uk from "../messages/uk.json";
import zh from "../messages/zh.json";

const messagesByLocale = {
  da,
  de,
  en,
  es,
  fr,
  it,
  nl,
  pl,
  pt,
  pt_BR: ptBR,
  ru,
  tr,
  uk,
  zh,
} as const;

function getErrorMessages() {
  const locale = typeof document === "undefined" ? "en" : document.documentElement.lang;
  const normalizedLocale = locale.replace("-", "_") as keyof typeof messagesByLocale;
  const baseLocale = locale.split("-")[0] as keyof typeof messagesByLocale;
  return (messagesByLocale[normalizedLocale] ?? messagesByLocale[baseLocale] ?? en).errors;
}

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = getErrorMessages();

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground">Stackly</p>
            <h1 className="text-3xl font-bold tracking-tight">{t.globalTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.globalDescription}</p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.reload}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
