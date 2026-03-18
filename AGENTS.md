# AGENTS.md — Contesto Agente per Koillection

## Identità del Progetto

- **Nome**: Koillection
- **Autore**: benjaminjonard
- **Licenza**: MIT
- **Versione attuale (legacy)**: 1.8.0
- **Versione target (conversione)**: 2.0.0-alpha
- **Descrizione**: Applicazione self-hosted per la gestione di collezioni personali di qualsiasi tipo (fumetti, vinili, giochi, ecc.).

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
│       ├── lib/              ← `actions/*.actions.ts`, auth-utils e utility app
│       ├── auth.ts           ← Configurazione NextAuth.js v5
│       └── middleware.ts
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
| 3 | **Album** | ✅ Completato | CRUD album + Foto · gerarchia parent/child · upload immagine · breadcrumb · propagazione visibilità · type-check pulito |
| 4 | **Wishlist** | ✅ Completato | CRUD wishlist + Wish · gerarchia parent/child · upload immagine · breadcrumb · API REST (`/api/wishlists`, `/api/wishlists/[id]`, `/api/wishes`, `/api/wishes/[id]`) · server actions · propagazione visibilità |
| 5 | **Tags / Template / ChoiceList** | 🔲 Da fare | |
| 6 | **Admin / Statistics / Tools** | 🔲 Da fare | |

### Note sugli errori residui
- `auth.ts` → 2 errori TS2742 (`next-auth` v5) — noti, pre-esistenti, già soppressi con `// @ts-nocheck`. Non bloccare il lavoro su questo file.

---

## Priorità di Conversione

1. ✅ **Auth** — NextAuth.js con provider Credentials (compatibile con hash password esistenti)
2. ✅ **Collections** — CRUD Collezioni + Oggetti + alberatura collezioni (REST API: `/api/collections`, `/api/collections/[id]`; viste: `/collections`, `/collections/[id]`; funzionalità: gerarchia parent/child, upload immagine, navigazione e gestione nodi con UI React + shadcn/ui)
3. ✅ **Album** — CRUD album + Foto · gerarchia parent/child · upload immagine · breadcrumb · API REST (`/api/albums`, `/api/albums/[id]`, `/api/photos`, `/api/photos/[id]`) · server actions · propagazione visibilità
4. ✅ **Wishlist** — CRUD wishlist + Wish · gerarchia parent/child · upload immagine · breadcrumb · API REST (`/api/wishlists`, `/api/wishlists/[id]`, `/api/wishes`, `/api/wishes/[id]`) · server actions · propagazione visibilità
5. 🔲 **Tags / Template / ChoiceList** — Funzionalità secondarie
6. 🔲 **Admin / Statistics / Tools** — Funzionalità avanzate

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
4. Usare **Prisma** come ORM — lavorare da `next/packages/db` (esempio introspezione: `DATABASE_URL="<url>" npx prisma db pull`).
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

---

## Riferimenti Utili

- [Documentazione progetto](./README.md)
- [README stack Next.js](./next/README.md)
- [Monorepo scripts](./next/package.json)
- [App web scripts/deps](./next/apps/web/package.json)
- [Schema Prisma](./next/packages/db/prisma/schema.prisma)
- [Configurazione auth](./next/apps/web/auth.ts)
- [Architettura del progetto](./ARCHITECTURE.md)
- [Changelog](./CHANGELOG.md)
- [File di migrazione DB](./migrations/)
- [Entità Doctrine (legacy)](./src/Entity/)
- [Controller legacy](./src/Controller/)

