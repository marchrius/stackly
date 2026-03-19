# AGENTS.md — Contesto Agente per Koillection

## Identità del Progetto

- **Nome**: Koillection
- **Autore**: benjaminjonard
- **Licenza**: MIT
- **Versione attuale (legacy)**: 1.8.0
- **Versione target (conversione)**: 2.0.0-alpha
- **Descrizione**: Applicazione self-hosted per la gestione di collezioni personali di qualsiasi tipo (fumetti, vinili, giochi, ecc.).
- **Ultimo aggiornamento documento**: marzo 2026

---

## Stato del Progetto

Il progetto è **in fase di migrazione** da un'architettura Symfony/PHP con frontend Twig+Materialize verso una **Full Stack Next.js** (App Router, React, shadcn/ui) in monorepo Turborepo.

| Strato | Stack attuale (legacy) | Stack target (next/) |
|---|---|---|
| Backend framework | Symfony 8 | Next.js 15 (App Router) |
| API | API Platform 4.2 | Route Handlers / Server Actions |
| Auth | LexikJWT | NextAuth.js (Auth.js v5) |
| ORM | Doctrine ORM | Prisma ORM |
| Frontend template | Twig | React (App Router) |
| CSS/UI | Materialize CSS | shadcn/ui + Tailwind CSS |
| Asset bundler | Webpack Encore (Symfony) | Next.js built-in (Turbopack) |
| DB | PostgreSQL | PostgreSQL (invariato) |
| i18n | Symfony Translator | next-intl v3 (cookie-based) |

---

## Regola Fondamentale: Cartella `next/`

> **TUTTO il codice della conversione vive ESCLUSIVAMENTE in `/next`.**

- Non apportare modifiche strutturali o di codice fuori da `next/`, eccetto configurazioni minime di routing/proxy strettamente indispensabili.
- Se `next/` non esiste, va **creata**.
- Il codice legacy in `src/`, `assets/`, `templates/`, `api/` non va toccato durante la migrazione.

---

## Struttura Target (`next/`)

```
next/
├── apps/
│   └── web/                  ← Applicazione Next.js principale (Frontend + API)
│       ├── app/
│       │   ├── (auth)/       ← Pagine autenticazione
│       │   ├── api/          ← Route Handlers (REST API)
│       │   └── (dashboard)/  ← Pagine autenticate (collezioni, album, wishlist…)
│       ├── components/
│       │   ├── shared/       ← Componenti trasversali (DeleteConfirmDialog, SearchResults…)
│       │   └── layout/       ← Sidebar, Navbar
│       ├── i18n/
│       │   └── request.ts    ← Configurazione next-intl (legge cookie locale)
│       ├── messages/
│       │   ├── en.json       ← Traduzioni inglese
│       │   └── it.json       ← Traduzioni italiano
│       ├── lib/              ← `actions/*.actions.ts`, auth-utils e utility app
│       ├── auth.ts           ← Configurazione NextAuth.js v5
│       └── middleware.ts     ← Protezione route JWT + impostazione cookie locale
└── packages/
    ├── db/                   ← Schema Prisma + client DB condiviso
    ├── ui/                   ← Componenti shadcn/ui condivisi
    └── lib/                  ← Utility, tipi TypeScript condivisi
```

---

## Stato Avanzamento Conversione

| # | Feature | Stato | Note |
|---|---------|-------|------|
| 1 | **Auth** | ✅ Completato | NextAuth.js v5 · provider Credentials · JWT · hash `$2y$→$2b$` |
| 2 | **Collections** | ✅ Completato | CRUD collezioni + Items · gerarchia parent/child · upload immagine · type-check pulito |
| 3 | **Album** | ✅ Completato | CRUD album + Foto · gerarchia parent/child · upload immagine · breadcrumb · propagazione visibilità |
| 4 | **Wishlist** | ✅ Completato | CRUD wishlist + Wish · gerarchia parent/child · upload immagine · breadcrumb · API REST · propagazione visibilità |
| 5 | **i18n** | ✅ Completato | `next-intl` v3 · cookie-based · lingue: `da`, `de`, `en`, `es`, `fr`, `it`, `nl`, `pl`, `pt`, `pt_BR`, `ru`, `tr`, `uk`, `zh` · selettore in impostazioni utente |
| 6 | **UI — Card immagini** | ✅ Completato | Aspect ratio `10/13` (≈1:1.3) su tutte le card · `object-contain` · auto-fill grid |
| 7 | **UI — Conferma eliminazione** | ✅ Completato | `DeleteConfirmDialog` (shadcn Dialog) su tutte le azioni delete · nessun `window.confirm` |
| 8 | **Tags / Template / ChoiceList** | 🔲 Da fare | Backend API + frontend components |
| 9 | **Admin / Statistics / Tools** | 🔲 Da fare | Dashboard admin + statistiche avanzate + inventory/loans |

### Note sugli errori residui
- `auth.ts` → 2 errori TS2742 (`next-auth` v5) — noti, pre-esistenti, già soppressi con `// @ts-nocheck`. Non bloccare il lavoro su questo file.

---

## Priorità di Conversione

1. ✅ **Auth** — NextAuth.js con provider Credentials (compatibile con hash password esistenti)
2. ✅ **Collections** — CRUD Collezioni + Oggetti + alberatura
3. ✅ **Album** — CRUD album + Foto · gerarchia · breadcrumb · propagazione visibilità
4. ✅ **Wishlist** — CRUD wishlist + Wish · gerarchia · breadcrumb · propagazione visibilità
5. ✅ **i18n** — next-intl v3, lingue `da`/`de`/`en`/`es`/`fr`/`it`/`nl`/`pl`/`pt`/`pt_BR`/`ru`/`tr`/`uk`/`zh`, selettore nelle impostazioni
6. 🔲 **Tags / Template / ChoiceList** — Funzionalità secondarie
7. 🔲 **Admin / Statistics / Tools** — Funzionalità avanzate

---

## Entità Principali (dal dominio Symfony/Doctrine)

- `User` — Utente con ruoli (admin/utente normale)
- `Collection` — Collezione principale
- `Item` — Oggetto all'interno di una collezione
- `Datum` — Dato custom associato a un Item
- `Album` — Album fotografico
- `Photo` — Foto in un Album
- `Wishlist` — Lista desideri
- `Wish` — Singolo desiderio
- `Tag` / `TagCategory` — Tagging degli oggetti
- `Template` / `Field` — Template per la struttura dati degli Item
- `ChoiceList` — Liste di valori predefiniti per i Datum
- `Inventory` — Inventario
- `Loan` — Prestiti
- `Log` — Storico modifiche
- `Scraper` — Configurazione scraper per auto-completamento

---

## Istruzioni per l'Agente

### Prima di generare codice:
1. Verificare se si sta lavorando nel contesto **legacy** (`src/`, `templates/`, `api/`) o **next** (`next/`).
2. Per la migrazione, **operare sempre in `next/`**.
3. Usare **TypeScript** per tutto il nuovo codice.
4. Usare **Prisma** come ORM — lavorare da `next/packages/db`.
5. Usare **shadcn/ui** per i componenti UI.
6. Eseguire i comandi del nuovo stack dalla cartella `next/` (`npm run dev`, `npm run build`, `npm run lint`, `npm run type-check`, `npm run db:generate`).

### Convenzioni di naming:
- File componenti React: `PascalCase.tsx`
- Route handlers: `apps/web/app/api/[risorsa]/route.ts`
- Server Actions: `apps/web/lib/actions/[risorsa].actions.ts`
- Schema Prisma: rispecchiare i nomi delle tabelle PostgreSQL esistenti

### Autenticazione:
- Provider: `Credentials` (`username` + password, con fallback su email)
- Strategia sessione: JWT
- Le password legacy sono hashate con bcrypt Symfony (`$2y$`) — normalizzare a `$2b$` per `bcryptjs` (vedi `next/apps/web/auth.ts`)

### Upload file:
- Gestire upload in `next/apps/web/app/api/upload/route.ts`
- Mantenere compatibilità con la struttura `public/uploads/` usando `UPLOAD_DIR` (default `./public/uploads`)

### Azioni di eliminazione:
- **Non usare mai** `window.confirm`, `window.alert` o `<form action={…}>` direttamente per le azioni delete.
- Utilizzare sempre il componente `DeleteConfirmDialog` (`components/shared/DeleteConfirmDialog.tsx`) che mostra un modale di conferma (shadcn Dialog) prima di eseguire l'azione.
- Passare una `description` con il nome dell'elemento da eliminare usando `t("delete.confirm", { name: … })`.

```tsx
// ✅ CORRETTO
<DeleteConfirmDialog
  description={t("delete.confirm", { name: item.name })}
  onConfirm={deleteItem.bind(null, item.id)}
/>

// ❌ VIETATO
<form action={deleteItem.bind(null, item.id)}>
  <Button type="submit">Elimina</Button>
</form>
```

### Card immagini (griglia collezioni, album, oggetti, wishlist, foto):
- Usare sempre `aspect-[10/13]` (rapporto 1:1.3 — formato libro/fumetto) per il container dell'immagine.
- Usare `object-contain` (non `object-cover`) per non ritagliare l'immagine.
- Usare `auto-fill minmax(160px, 1fr)` per il grid (non colonne fisse).
- Fallback senza immagine: icona centrata nel container con sfondo `bg-muted`.

```tsx
// ✅ Pattern corretto per card con immagine
<div
  className="grid gap-x-2.5 gap-y-4"
  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
>
  <div className="group cursor-pointer rounded-lg border bg-card overflow-hidden">
    <div className="relative aspect-[10/13] bg-muted flex items-center justify-center overflow-hidden">
      {item.imageSmallThumbnail ? (
        <img
          className="max-h-full max-w-full object-contain"
          src={item.imageSmallThumbnail}
          alt={item.name}
        />
      ) : (
        <IconFallback className="h-8 w-8 text-muted-foreground opacity-40" />
      )}
    </div>
    <div className="p-2">
      <p className="truncate text-xs font-medium">{item.name}</p>
    </div>
  </div>
</div>
```

---

## Regola Obbligatoria: Internazionalizzazione (i18n)

> **Ogni testo leggibile dall'utente deve essere tradotto. Nessuna stringa UI hardcodata nel codice.**

Il sistema i18n è basato su **next-intl v3** con strategia **cookie-based** (cookie `koillection_locale`).

### Lingue supportate

| Codice | Lingua | File |
|---|---|---|
| `da` | Danish | `apps/web/messages/da.json` |
| `de` | German | `apps/web/messages/de.json` |
| `en` | English (default) | `apps/web/messages/en.json` |
| `es` | Spanish | `apps/web/messages/es.json` |
| `fr` | French | `apps/web/messages/fr.json` |
| `it` | Italiano | `apps/web/messages/it.json` |
| `nl` | Dutch | `apps/web/messages/nl.json` |
| `pl` | Polish | `apps/web/messages/pl.json` |
| `pt` | Portuguese | `apps/web/messages/pt.json` |
| `pt_BR` | Portuguese (Brazil) | `apps/web/messages/pt_BR.json` |
| `ru` | Russian | `apps/web/messages/ru.json` |
| `tr` | Turkish | `apps/web/messages/tr.json` |
| `uk` | Ukrainian | `apps/web/messages/uk.json` |
| `zh` | Chinese | `apps/web/messages/zh.json` |

### Source of Truth locale

- L'elenco ufficiale dei locale supportati è in `apps/web/i18n/locales.ts` (`SUPPORTED_LOCALES`, `DEFAULT_LOCALE`).
- Non duplicare liste statiche di lingue in altri file: importare sempre da `i18n/locales.ts`.

### Checklist per ogni nuova feature con testo UI

1. **Nessuna stringa letterale** nel JSX/TSX — tutto va in `messages/*.json`
2. **Aggiornare tutti i file lingua** (`messages/*.json`) per **tutti** i locale in `SUPPORTED_LOCALES`
3. **Namespace** coerente con il dominio (es. `"tags"` per i tag, `"common"` per azioni generiche)
4. **Interpolazione** con `{variabile}` per valori dinamici (nomi, contatori)
5. **Client Component** → `useTranslations("namespace")` da `next-intl`
6. **Server Component / Page** → `getTranslations("namespace")` da `next-intl/server`
7. **`generateMetadata()`** → usare `getTranslations` per tradurre il `title` della pagina

```typescript
// Client Component
const t = useTranslations("collections");
<h1>{t("title")}</h1>                                   // "Collections" / "Collezioni"
<p>{t("delete.confirm", { name: col.title })}</p>       // con interpolazione

// Server Component / Page
const t = await getTranslations("albums");
return <h1>{t("title")}</h1>;

// generateMetadata
export async function generateMetadata() {
  const t = await getTranslations("tags");
  return { title: t("title") };
}
```

### Namespace dei messaggi esistenti

```
common        → save, cancel, edit, delete, loading, yes, no, noImage, …
nav           → voci menu laterale
auth.login    → login page
auth.register → register page
dashboard     → homepage
collections   → collezioni, items, form, delete
items         → oggetti, form, delete
albums        → album, foto, form, delete
photos        → foto, form, delete
wishlists     → wishlist, desideri, form, delete
wishes        → desideri, form, delete
settings      → preferenze, password, temi, lingue
search        → ricerca, risultati
history       → storico modifiche
statistics    → statistiche
deleteDialog  → modale conferma eliminazione
visibility    → etichette visibilità (public, internal, private)
upload        → messaggi upload immagine
```

### Come aggiungere una nuova lingua

1. Aggiungere il codice in `SUPPORTED_LOCALES` dentro `apps/web/i18n/locales.ts`
2. Creare `messages/<codice>.json` copiando `messages/en.json` e tradurre tutti i valori
3. Aggiungere `<SelectItem value="<codice>">` in `SettingsForm.tsx` **solo se non è già dinamico**
4. Aggiungere `"languages.<codice>": "Nome Lingua"` in **tutti** i file `messages/*.json` esistenti
5. Verificare che middleware, request config e action settings usino la lista centralizzata (`i18n/locales.ts`)

---

## Riferimenti Utili

- [Documentazione progetto](./README.md)
- [README stack Next.js](./next/README.md)
- [Monorepo scripts](./next/package.json)
- [App web scripts/deps](./next/apps/web/package.json)
- [Schema Prisma](./next/packages/db/prisma/schema.prisma)
- [Configurazione auth](./next/apps/web/auth.ts)
- [Architettura del progetto](./next/ARCHITECTURE.md)
- [Changelog](./CHANGELOG.md)
- [File di migrazione DB](./migrations/)
- [Entità Doctrine (legacy)](./src/Entity/)
- [Controller legacy](./src/Controller/)
- [Messaggi i18n DA](./next/apps/web/messages/da.json)
- [Messaggi i18n DE](./next/apps/web/messages/de.json)
- [Messaggi i18n EN](./next/apps/web/messages/en.json)
- [Messaggi i18n ES](./next/apps/web/messages/es.json)
- [Messaggi i18n FR](./next/apps/web/messages/fr.json)
- [Messaggi i18n IT](./next/apps/web/messages/it.json)
- [Messaggi i18n NL](./next/apps/web/messages/nl.json)
- [Messaggi i18n PL](./next/apps/web/messages/pl.json)
- [Messaggi i18n PT](./next/apps/web/messages/pt.json)
- [Messaggi i18n PT_BR](./next/apps/web/messages/pt_BR.json)
- [Messaggi i18n RU](./next/apps/web/messages/ru.json)
- [Messaggi i18n TR](./next/apps/web/messages/tr.json)
- [Messaggi i18n UK](./next/apps/web/messages/uk.json)
- [Messaggi i18n ZH](./next/apps/web/messages/zh.json)
- [Componente DeleteConfirmDialog](./next/apps/web/components/shared/DeleteConfirmDialog.tsx)
