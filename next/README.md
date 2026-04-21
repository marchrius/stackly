# Stackly — Next.js (v2.x)

Versione full-stack Next.js di Stackly. Monorepo Turborepo con App Router, Prisma, shadcn/ui e NextAuth.js v5.

## Struttura

```
next/
├── apps/
│   └── web/                  ← App Next.js 15 (frontend + API)
│       ├── app/
│       │   ├── (auth)/       ← /login, /register
│       │   ├── (dashboard)/  ← Pagine autenticate
│       │   └── api/          ← Route Handlers REST
│       ├── components/       ← Componenti React per modulo
│       ├── lib/
│       │   ├── actions/      ← Server Actions (CRUD)
│       │   └── auth-utils.ts ← Helper requireAuth()
│       ├── auth.ts           ← Configurazione NextAuth.js v5
│       └── middleware.ts     ← Protezione route
└── packages/
    ├── db/                   ← Prisma schema + client (tabelle stk_*)
    ├── lib/                  ← Tipi, utility, costanti condivisi
    └── ui/                   ← Componenti shadcn/ui condivisi
```

## Prerequisiti

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL (stesso DB del legacy, o nuovo)

## Setup

```bash
# 1. Dalla cartella next/
cd next
npm install

# 2. Configura le variabili d'ambiente
cp .env.example .env
# Modifica DATABASE_URL e NEXTAUTH_SECRET in .env

# 3. Genera il client Prisma
npm run db:generate

# 4. (Opzionale) Esegui le migrazioni su un nuovo DB
npm run db:push

# 5. Avvia in sviluppo
npm run dev
```

## Variabili d'Ambiente (`next/.env`)

Usa un solo file centrale: `next/.env`.
Non creare `apps/web/.env` o `packages/db/.env`: tutti gli script workspace leggono `../../.env`.

| Variabile | Descrizione | Esempio |
|---|---|---|
| `DATABASE_URL` | DSN PostgreSQL | `postgresql://user:pass@localhost:5432/stackly` |
| `NEXTAUTH_SECRET` | Secret JWT sessione (random 32 byte) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base app | `http://localhost:3000` |
| `UPLOAD_DIR` | Cartella upload file | `./public/uploads` |

## Compatibilità con il DB Legacy

Lo schema Prisma usa i **nomi di tabella originali** (`stk_*`), quindi è possibile puntare allo stesso PostgreSQL usato dal backend Symfony. Le password sono compatibili: Symfony usa `bcrypt $2y$` che viene normalizzato a `$2b$` per `bcryptjs` (Node.js).

## Comandi

```bash
npm run dev           # Avvia in development (Turbopack)
npm run build         # Build di produzione
npm run start         # Avvia il server Next.js built in produzione
npm run i18n:validate # Valida schema/placeholder dei cataloghi messages/*.json
npm run db:generate   # Rigenera client Prisma
npm run db:push       # Sincronizza schema sul DB (dev)
npm run db:migrate    # Crea migration (produzione)
npm run db:studio     # Apre Prisma Studio
npm run maintenance:refresh-cached-values # Riallinea contatori/cachedValues
npm run maintenance:regenerate-logs       # Rigenera create logs mancanti e marca delete logs
npm run maintenance:regenerate-thumbnails # Rigenera thumbnails dai file originali
```

Tutti i comandi `maintenance:*` supportano `--help` e `--dry-run`.

## Deployment e runtime

Il legacy espone solo il runtime Symfony/PHP dai file Docker alla root del repository. Per il nuovo stack Next.js usare invece:

- `next/Dockerfile` per la build/runtime container del monorepo `next/`
- `docker-compose.next.dist.yml` alla root per un setup di esempio con app Next.js + PostgreSQL

### Avvio locale del runtime container

```bash
# Dalla root del repository
cp next/.env.example next/.env

# Modifica DATABASE_URL, NEXTAUTH_SECRET e NEXTAUTH_URL
docker compose -f docker-compose.next.dist.yml up --build
```

### Note operative di produzione

- Montare una volume persistente su `/app/apps/web/public/uploads`
- Eseguire `npm run db:generate` in fase di build immagine
- Usare `npm run build` per generare `.next/` e `npm run start` come entrypoint runtime
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` e `UPLOAD_DIR` devono essere valorizzate a runtime
- I comandi `maintenance:*` possono essere eseguiti nello stesso container applicativo

## Internazionalizzazione (i18n)

L'app usa `next-intl` con strategia cookie-based (`stk_locale`).

**Source of truth locale:** `apps/web/i18n/locales.ts`

Locale supportati in `next/apps/web/messages/`:

| Codice | Lingua |
|---|---|
| `da` | Danish |
| `de` | German |
| `en` | English (default) |
| `es` | Spanish |
| `fr` | French |
| `it` | Italiano |
| `nl` | Dutch |
| `pl` | Polish |
| `pt` | Portuguese |
| `pt_BR` | Portuguese (Brazil) |
| `ru` | Russian |
| `tr` | Turkish |
| `uk` | Ukrainian |
| `zh` | Chinese |

Prima di aprire una PR con modifiche ai testi UI, eseguire:

```bash
npm run i18n:validate
```

## Route Disponibili

### Autenticazione

| Route | Descrizione | Stato |
|---|---|---|
| `/login` | Accesso (provider Credentials) | ✅ Implementato |
| `/register` | Registrazione nuovo utente | ✅ Implementato |

### Dashboard e principale

| Route | Descrizione | Stato |
|---|---|---|
| `/` | Dashboard (statistiche rapide) | ✅ Implementato |

### Collezioni e Oggetti

| Route | Descrizione | Stato |
|---|---|---|
| `/collections` | Gestione collezioni (lista, create, hierarchical) | ✅ Implementato |
| `/collections/[id]` | Dettaglio collezione con oggetti annidati | ✅ Implementato |
| `/collections/[id]/edit` | Modifica collezione | ✅ Implementato |
| `/items/[id]` | Dettaglio oggetto con dati custom (Datum) | ✅ Implementato |
| `/items/[id]/edit` | Modifica oggetto | ✅ Implementato |

### Album e Foto

| Route | Descrizione | Stato |
|---|---|---|
| `/albums` | Gestione album fotografici (lista, create, hierarchical) | ✅ Implementato |
| `/albums/[id]` | Dettaglio album con foto | ✅ Implementato |
| `/albums/[id]/edit` | Modifica album | ✅ Implementato |
| `/photos/[id]` | Dettaglio foto | ✅ Implementato |

### Wishlist e Wish

| Route | Descrizione | Stato |
|---|---|---|
| `/wishlists` | Gestione liste desideri (lista, create, hierarchical) | ✅ Implementato |
| `/wishlists/[id]` | Dettaglio wishlist con wish | ✅ Implementato |
| `/wishlists/[id]/edit` | Modifica wishlist | ✅ Implementato |
| `/wishes/[id]` | Dettaglio wish | ✅ Implementato |

### Funzionalità secondarie

| Route | Descrizione | Stato |
|---|---|---|
| `/tags` | Gestione tag e categorie tag | 🔲 Da implementare |
| `/templates` | Template per struttura oggetti + Field | 🔲 Da implementare |
| `/loans` | Prestiti attivi | 🔲 Da implementare |
| `/history` | Storico modifiche (Log) | ✅ Implementato |
| `/statistics` | Statistiche e grafici | ✅ Implementato |
| `/search` | Ricerca full-text (Collections, Items, Albums, Photos, Wishlists, Wishes) | ✅ Implementato |
| `/settings` | Impostazioni profilo utente | ✅ Implementato |

## API REST

### Autenticazione

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Handler NextAuth.js (login, logout, session) | ✅ |

### Collezioni

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/collections` | GET, POST | Lista e crea collezioni | ✅ |
| `/api/collections/[id]` | GET, PATCH, DELETE | CRUD collezione | ✅ |

### Oggetti

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/items` | GET, POST | Lista e crea oggetti | ✅ |
| `/api/items/[id]` | GET, PATCH, DELETE | CRUD oggetto | ✅ |

### Album

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/albums` | GET, POST | Lista e crea album | ✅ |
| `/api/albums/[id]` | GET, PATCH, DELETE | CRUD album | ✅ |

### Foto

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/photos` | GET, POST | Lista e crea foto | ✅ |
| `/api/photos/[id]` | GET, PATCH, DELETE | CRUD foto | ✅ |

### Wishlist

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/wishlists` | GET, POST | Lista e crea wishlist | ✅ |
| `/api/wishlists/[id]` | GET, PATCH, DELETE | CRUD wishlist | ✅ |

### Wish

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/wishes` | GET, POST | Lista e crea wish | ✅ |
| `/api/wishes/[id]` | GET, PATCH, DELETE | CRUD wish | ✅ |

### Utility

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/search` | GET | Ricerca full-text su tutte le entità | ✅ |
| `/api/upload` | POST | Upload immagini con auto-resize thumbnail | ✅ |
| `/api/logs` | GET | Storico modifiche | ✅ |

## Server Actions

Tutte le operazioni CRUD sono implementate anche come **Server Actions** (file `lib/actions/*.actions.ts`) per integrazione diretta nei component React:

| File | Descrizione | Stato |
|---|---|---|
| `lib/actions/collection.actions.ts` | CRUD collezioni | ✅ |
| `lib/actions/item.actions.ts` | CRUD oggetti | ✅ |
| `lib/actions/media.actions.ts` | CRUD media (helper per upload) | ✅ |
| `lib/actions/photo.actions.ts` | CRUD foto | ✅ |
| `lib/actions/wish.actions.ts` | CRUD wish | ✅ |
| `lib/actions/user.actions.ts` | Azioni utente (profilo, settings) | ✅ |

## Componenti React (shadcn/ui)

Organizzati per modulo funzionale in `apps/web/components/`:

| Modulo | Componenti | Descrizione |
|---|---|---|
| `auth/` | `LoginForm`, `RegisterForm` | Form autenticazione |
| `collections/` | `CollectionList`, `CollectionForm`, `CollectionBreadcrumb`, `ItemTree`, `ItemForm`, `ItemDetail` | Componenti collezioni e oggetti |
| `albums/` | `AlbumList`, `AlbumForm`, `AlbumBreadcrumb`, `PhotoGrid`, `PhotoUpload` | Componenti album e foto |
| `wishlists/` | `WishlistList`, `WishlistForm`, `WishlistBreadcrumb`, `WishGrid`, `WishForm` | Componenti wishlist e wish |
| `tags/` | `TagList`, `TagForm` | Gestione tag (🔲 da implementare) |
| `templates/` | `TemplateList`, `TemplateForm`, `FieldEditor` | Template e field (🔲 da implementare) |
| `statistics/` | `StatsCard`, `CollectionsChart`, `ItemsChart` | Visualizzazione statistiche |
| `history/` | `LogTable`, `LogFilter` | Storico modifiche |
| `search/` | `SearchBox`, `SearchResults` | Ricerca full-text |
| `settings/` | `ProfileForm`, `ChangePasswordForm` | Impostazioni utente |
| `shared/` | `Sidebar`, `Navbar`, `Breadcrumb`, `LoadingSpinner`, `Dialog`, `Table` | Componenti shared UI |
| `layout/` | `ProtectedLayout`, `AuthLayout`, `DashboardLayout` | Layout comuni |
