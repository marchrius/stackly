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

Il progetto è **in fase di migrazione** da un'architettura Symfony/PHP con frontend Twig+Materialize verso una **Full Stack Next.js** (App Router, React, shadcn/ui).

| Strato | Stack attuale (legacy) | Stack target (new) |
|---|---|---|
| Backend framework | Symfony 8 | Next.js 14+ (App Router) |
| API | API Platform 4.2 | Route Handlers / Server Actions |
| Auth | LexikJWT | NextAuth.js (Auth.js v5) |
| ORM | Doctrine ORM | Prisma ORM |
| Frontend template | Twig | React (App Router) |
| CSS/UI | Materialize CSS | shadcn/ui + Tailwind CSS |
| Asset bundler | Webpack Encore (Symfony) | Next.js built-in (Turbopack) |
| DB | PostgreSQL | PostgreSQL (invariato) |

---

## Regola Fondamentale: Cartella `new/`

> **TUTTO il codice della conversione vive ESCLUSIVAMENTE in `/new`.**

- Non apportare modifiche strutturali o di codice fuori da `new/`, eccetto configurazioni minime di routing/proxy strettamente indispensabili.
- Se `new/` non esiste, va **creata**.
- Il codice legacy in `src/`, `assets/`, `templates/`, `api/` non va toccato durante la migrazione.

---

## Struttura Target (`new/`)

```
new/
├── apps/
│   └── web/                  ← Applicazione Next.js principale (Frontend + API)
│       ├── app/
│       │   ├── (auth)/       ← Pagine autenticazione
│       │   ├── api/          ← Route Handlers (REST API)
│       │   └── (dashboard)/  ← Pagine autenticate (collezioni, album, wishlist…)
│       ├── components/
│       ├── lib/
│       └── middleware.ts
└── packages/
    ├── db/                   ← Schema Prisma + client DB condiviso
    ├── ui/                   ← Componenti shadcn/ui condivisi
    └── lib/                  ← Utility, tipi TypeScript condivisi
```

---

## Priorità di Conversione

1. **Auth** — NextAuth.js con provider Credentials (compatibile con hash password esistenti)
2. **Collections** — CRUD Collezioni + Oggetti
3. **Album** — Gestione album fotografici
4. **Wishlist** — Liste dei desideri
5. **Tags / Template / ChoiceList** — Funzionalità secondarie
6. **Admin / Statistics / Tools** — Funzionalità avanzate

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
1. Verificare se si sta lavorando nel contesto **legacy** (`src/`, `templates/`, `api/`) o **new** (`new/`).
2. Per la migrazione, **operare sempre in `new/`**.
3. Usare **TypeScript** per tutto il nuovo codice.
4. Usare **Prisma** come ORM — partire da `npx prisma db pull` per introspettare il DB esistente.
5. Usare **shadcn/ui** per i componenti UI.

### Convenzioni di naming:
- File componenti React: `PascalCase.tsx`
- Route handlers: `app/api/[risorsa]/route.ts`
- Server Actions: `actions/[risorsa].ts`
- Schema Prisma: rispecchiare i nomi delle tabelle PostgreSQL esistenti

### Autenticazione:
- Provider: `Credentials` (email + password)
- Strategia sessione: JWT
- Le password legacy sono hashate con bcrypt (Symfony `password_hasher`) — verificare compatibilità con `bcrypt` di Node.js

### Upload file:
- Gestire upload in `app/api/upload/route.ts`
- Mantenere compatibilità con la struttura `public/uploads/` esistente

---

## Riferimenti Utili

- [Documentazione progetto](./README.md)
- [Architettura del progetto](./ARCHITECTURE.md)
- [Changelog](./CHANGELOG.md)
- [File di migrazione DB](./migrations/)
- [Entità Doctrine (legacy)](./src/Entity/)
- [Controller legacy](./src/Controller/)

