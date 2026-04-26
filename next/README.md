# Stackly — Next.js (v2.x)

Versione full-stack Next.js di Stackly, il collection manager self-hosted per catalogare collezioni fisiche di qualsiasi tipo: libri, DVD, fumetti, giochi, francobolli, album fotografici e wishlist.

La nuova app mantiene il modello a gerarchia tipo directory/file: puoi creare collezioni e sottocollezioni, poi inserire oggetti con metadata personalizzati, tag, immagini, file, link e campi definiti dall'utente. Gli scraper sono configurabili dall'utente e vengono eseguiti solo manualmente tramite preview/import: Stackly non scarica metadata automaticamente.

Stack tecnico: monorepo Turborepo con Next.js App Router, Prisma, shadcn/ui, Tailwind CSS, NextAuth.js v5 e PostgreSQL.

## Funzionalita' prodotto

| Funzionalita' | Stato |
|---|---|
| Gestione collezioni, sottocollezioni e oggetti | ✅ Implementata |
| Metadata liberi sugli oggetti e sulle collezioni (`Datum`, template, choice list) | ✅ Implementata |
| Tag e categorie tag per raggruppare oggetti tra collezioni diverse | ✅ Implementata |
| Sharing pubblico base per collezioni, oggetti, album e wishlist pubbliche | ✅ Implementato |
| Wishlist e wish | ✅ Implementate |
| Prestiti oggetti | ✅ Implementati |
| Multi-user con ruoli utente/admin | ✅ Implementato |
| Dark mode e temi personalizzabili | ✅ Implementati |
| i18n multi-lingua | ✅ Implementato |
| PWA installabile tramite manifest e icone | ✅ Implementata |
| REST API | ✅ Implementata |
| Scraper manuali/configurabili | ✅ Implementati |

## Compatibilita' database

La versione Next.js v2 usa **PostgreSQL** tramite Prisma. Il supporto legacy a MySQL/MariaDB non fa parte di questo ciclo di conversione ed e' intenzionalmente escluso dalla configurazione attuale.

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

Lo schema Prisma usa i **nomi di tabella target** (`stk_*`) e PostgreSQL. Le password legacy sono compatibili: Symfony usa `bcrypt $2y$` che viene normalizzato a `$2b$` per `bcryptjs` (Node.js).

Per importare un database legacy `koi_*` verso il nuovo schema `stk_*`, usare gli script `legacy:migrate`, `legacy:validate` e `legacy:uploads:*`.

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
npm run legacy:migrate                    # Migra un DB legacy PostgreSQL koi_* verso stk_* (dry-run di default)
npm run legacy:validate                   # Valida conteggi e integrita' post-migrazione
npm run legacy:uploads:audit              # Verifica i file upload referenziati dal DB migrato
npm run legacy:uploads:copy               # Copia i file upload usando path sorgente/destinazione definiti dall'utente
```

Tutti i comandi `maintenance:*` supportano `--help` e `--dry-run`.

Per la migrazione PostgreSQL legacy verso il nuovo schema Prisma, vedere `LEGACY_DB_MIGRATION.md`.

## Deployment e runtime

Il legacy espone solo il runtime Symfony/PHP dai file Docker alla root del repository. Per il nuovo stack Next.js usare invece:

- `next/Dockerfile` per la build/runtime container del monorepo `next/`
- `next/Dockerfile.scratch` per una variante runtime minimale basata su `scratch`
- `next/docker-compose.yml` per avviare app Next.js + PostgreSQL usando l'immagine pubblicata su GHCR

### Avvio locale del runtime container

```bash
# Dalla cartella next/
docker compose up -d
```

### Note operative di produzione

- Montare il volume persistente su `/var/lib/stackly/uploads` (il container lo collega a `/app/apps/web/public/uploads`)
- Le operazioni DB avvengono a startup tramite `entrypoint.sh`: crea il DB se non esiste, poi esegue `prisma migrate deploy`
- La build produzione usa output standalone di Next.js; l'entrypoint avvia `apps/web/server.js`
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` e `UPLOAD_DIR` devono essere valorizzate a runtime
- I comandi `maintenance:*` possono essere eseguiti nello stesso container applicativo

## PWA

Stackly include un manifest installabile (`/manifest.webmanifest`) e icone applicazione in `apps/web/public/icons/`.

Il progetto non registra un service worker aggressivo per impostazione predefinita: le pagine autenticate e i dati privati non vengono messi in cache offline automaticamente.

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

### Sharing pubblico

| Route | Descrizione | Stato |
|---|---|---|
| `/public/collections/[id]` | Vista pubblica collezione/sottocollezione | ✅ Implementato |
| `/public/items/[id]` | Vista pubblica oggetto | ✅ Implementato |
| `/public/albums/[id]` | Vista pubblica album/sotto-album | ✅ Implementato |
| `/public/wishlists/[id]` | Vista pubblica wishlist/sotto-wishlist | ✅ Implementato |
| `/user/[username]/wishlists` | Vista compatibile per wishlist pubbliche utente | ✅ Implementato |

### Funzionalità secondarie

| Route | Descrizione | Stato |
|---|---|---|
| `/tags` | Gestione tag e categorie tag | ✅ Implementato |
| `/templates` | Template per struttura oggetti + Field | ✅ Implementato |
| `/choice-lists` | Liste di valori riusabili per i campi custom | ✅ Implementato |
| `/loans` | Prestiti attivi e restituiti | ✅ Implementato |
| `/inventories` | Inventari | ✅ Implementato |
| `/scrapers` | Configurazione scraper manuali | ✅ Implementato |
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

### Funzionalita' secondarie

| Endpoint | Metodi | Descrizione | Stato |
|---|---|---|---|
| `/api/tags` | GET, POST | Lista e crea tag | ✅ |
| `/api/tags/[id]` | GET, PATCH, DELETE | CRUD tag | ✅ |
| `/api/tag-categories` | GET, POST | Lista e crea categorie tag | ✅ |
| `/api/templates` | GET, POST | Lista e crea template | ✅ |
| `/api/templates/[id]` | GET, PATCH, DELETE | CRUD template | ✅ |
| `/api/choice-lists` | GET, POST | Lista e crea choice list | ✅ |
| `/api/inventories` | GET, POST | Lista e crea inventari | ✅ |
| `/api/loans` | GET, POST | Lista e crea prestiti | ✅ |
| `/api/scrapers` | GET, POST | Lista e crea scraper manuali | ✅ |
| `/api/scrapers/collection-preview` | POST | Preview/import manuale metadata collezione | ✅ |
| `/api/scrapers/item-preview` | POST | Preview/import manuale metadata oggetto | ✅ |

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
| `tags/` | `TagList`, `TagForm` | Gestione tag |
| `templates/` | `TemplateList`, `TemplateForm`, `FieldEditor` | Template e field |
| `scrapers/` | `ScraperForm` | Configurazione scraper manuali |
| `public/` | `PublicShell`, `PublicCards`, `CopyPublicLinkButton` | Viste pubbliche e sharing |
| `statistics/` | `StatsCard`, `CollectionsChart`, `ItemsChart` | Visualizzazione statistiche |
| `history/` | `LogTable`, `LogFilter` | Storico modifiche |
| `search/` | `SearchBox`, `SearchResults` | Ricerca full-text |
| `settings/` | `ProfileForm`, `ChangePasswordForm` | Impostazioni utente |
| `shared/` | `Sidebar`, `Navbar`, `Breadcrumb`, `LoadingSpinner`, `Dialog`, `Table` | Componenti shared UI |
| `layout/` | `ProtectedLayout`, `AuthLayout`, `DashboardLayout` | Layout comuni |
