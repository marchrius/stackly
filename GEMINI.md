---
alwaysApply: true
---
---
title: "Conversione Koillection: Symfony/PHP → Full Stack Next.js (Node.js)"
project: "benjaminjonard/koillection"
version: "2.0.0-alpha"
backend_as_is:
  framework: "Symfony 8 (IN DISMISSIONE)"
  api: "API Platform 4.2 (DA MIGRARE)"
  auth_api: "LexikJWT (DA SOSTITUIRE)"
  ui_server: "Twig templates (DA RIMUOVERE)"
  db: "PostgreSQL (MANTENUTO)"
frontend_as_is:
  tooling: "Webpack Encore (DA RIMUOVERE)"
  js: "Stimulus (DA RIMUOVERE)"
  css: "Materialize (DA RIMUOVERE)"
constraints:
  - "Non usare Firebase"
  - "Full Stack Next.js (App Router) + Server Actions/Route Handlers"
  - "UI in React con shadcn/ui"
  - "Architettura Modulare (Monorepo-style)"
  - "TUTTO il codice convertito deve vivere SOLO in /new"
conversion_workspace:
  root_dir: "new"
  rule: "Nessuna modifica strutturale o refactor fuori da /new (eccetto configurazioni minime di routing/proxy se e solo se indispensabili)."
---

## Clausola fondamentale: cartella `new/` (obbligatoria)

- **Regola**: tutto il codice “convertito” (Next.js/React/shadcn, config frontend, scripts, toolchain, Docker/compose dedicati al nuovo frontend, proxy/BFF, ecc.) deve stare **interamente e solo** dentro la cartella **`new/`**.
- **Creazione**: se `new/` **non esiste**, deve essere **creata**.
- **Divieto**: non introdurre nuovo codice conversione fuori da `new/`.

## Obiettivo

Trasformare il progetto attuale (Symfony + Twig) in un’architettura **Full Stack Next.js** moderna. Il backend PHP verrà completamente sostituito da API Routes e Server Actions in Node.js, mantenendo però il database PostgreSQL esistente. L'architettura dovrà essere modulare per facilitare la manutenzione e il riutilizzo del codice.

## Strategia di Migrazione (Modulare)

### 1. Struttura Monorepo (in `new/`)

Adottare un approccio a workspace (anche se implicito in `new/`) per separare le responsabilità:

- `new/apps/web`: L'applicazione Next.js principale (Frontend + Backend API).
- `new/packages/db`: (Opzionale/Consigliato) Configurazione Prisma/Drizzle e schema DB condiviso.
- `new/packages/ui`: (Opzionale/Consigliato) Componenti UI condivisi (shadcn/ui).
- `new/packages/lib`: (Opzionale/Consigliato) Utility, helper, tipi condivisi.

### 2. Backend (Next.js API / Server Actions)

- **ORM**: Utilizzare **Prisma** (o Drizzle) per connettersi al DB PostgreSQL esistente.
  - *Azione*: Introspezione del DB attuale per generare lo schema iniziale.
- **Auth**: Sostituire LexikJWT con **NextAuth.js (Auth.js v5)**.
  - *Compatibilità*: Assicurarsi di poter verificare le password esistenti (o prevedere strategia di reset).
- **API**: Migrare le route di API Platform verso **Route Handlers** (`app/api/...`) o **Server Actions**.
  - *Priorità*: Auth -> Collezioni -> Oggetti.

### 3. Frontend (React + shadcn/ui)

- Continuare lo sviluppo in `new/apps/web` integrando le chiamate al nuovo backend locale (invece del proxy verso Symfony).
- Riutilizzare componenti comuni definendoli in modo isolato.

## Checklist di conformità

### Regole
- **Tutto in `new/`**.
- **Database**: Non modificare lo schema del DB originale finché la migrazione non è stabile. Usare l'introspezione.
- **Modularity**: Se una funzione o un componente può essere usato in più contesti, estrarlo in `new/packages/*` o in una cartella `shared/` ben definita.

## Mappa Funzionalità Backend (Symfony → Next.js)

| Feature Symfony | Soluzione Next.js | Note |
|---|---|---|
| API Platform (REST) | Route Handlers (`app/api/...`) | Implementare standard REST o usare Server Actions per i form |
| LexikJWT | NextAuth.js (Auth.js) | Provider `Credentials` + JWT strategy |
| Doctrine ORM | Prisma ORM | `npx prisma db pull` per partire |
| Voter/Security | Middleware + Service Layer | Implementare check permessi prima delle query |
| Upload Multipart | `formData` + Upload locale/S3 | Gestire upload in `app/api/upload` |

## Stato attuale conversione

- Frontend parziale in `new/apps/web` (pagine Collections, Album, Wishlist).
- **Prossimo passo**: Setup Prisma e NextAuth in `new/apps/web` per rimuovere dipendenza da Symfony.
