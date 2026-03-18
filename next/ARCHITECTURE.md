# ARCHITECTURE.md — Stack Next.js di Koillection

> Documento tecnico dell'architettura del monorepo `next/`.  
> Aggiornato al: **marzo 2026** — versione target **2.0.0-alpha**

---

## Indice

1. [Panoramica](#1-panoramica)
2. [Struttura del monorepo](#2-struttura-del-monorepo)
3. [Package `apps/web`](#3-package-appsweb)
   - [App Router — Route Groups](#31-app-router--route-groups)
   - [Pagine (dashboard)](#32-pagine-dashboard)
   - [Route Handler API](#33-route-handler-api)
   - [Server Actions](#34-server-actions)
   - [Componenti React](#35-componenti-react)
   - [Utility di libreria (`lib/`)](#36-utility-di-libreria-lib)
   - [Autenticazione](#37-autenticazione)
   - [Middleware](#38-middleware)
   - [Upload file](#39-upload-file)
4. [Package `packages/db`](#4-package-packagesdb)
5. [Package `packages/ui`](#5-package-packagesui)
6. [Package `packages/lib`](#6-package-packageslib)
7. [Toolchain e build](#7-toolchain-e-build)
8. [Database e modello dati](#8-database-e-modello-dati)
9. [Flusso di una richiesta tipica](#9-flusso-di-una-richiesta-tipica)
10. [Convenzioni di naming](#10-convenzioni-di-naming)
11. [Variabili d'ambiente](#11-variabili-dambiente)

---

## 1. Panoramica

Il progetto è un **monorepo Turborepo + npm workspaces** che ospita la versione Next.js 15 di Koillection — una web app self-hosted per la gestione di collezioni personali.

```
Turborepo
├── apps/web          ← Next.js 15 (App Router) — frontend + API
├── packages/db       ← Prisma ORM + client condiviso
├── packages/ui       ← Componenti shadcn/ui condivisi
└── packages/lib      ← Tipi, costanti e utility condivisi
```

**Stack principale:**

| Livello | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Runtime | Node.js ≥ 20 |
| Linguaggio | TypeScript 5 (strict) |
| ORM | Prisma 6 + PostgreSQL |
| Auth | NextAuth.js v5 (Auth.js) — provider Credentials, sessione JWT |
| UI | shadcn/ui + Tailwind CSS 3 |
| Bundler (dev) | Turbopack (`next dev --turbopack`) |
| Monorepo runner | Turborepo 2 |
| Gestione pacchetti | npm workspaces (npm ≥ 10) |

---

## 2. Struttura del monorepo

```
next/
├── package.json              ← root workspace, script Turbo globali
├── turbo.json                ← pipeline Turbo (build, dev, lint, type-check, db:*)
├── tsconfig.base.json        ← tsconfig condivisa (estesa da tutti i package)
├── .env                      ← variabili d'ambiente (non committato)
├── .env.example              ← template variabili d'ambiente
├── apps/
│   └── web/                  ← applicazione principale
│       ├── app/              ← Next.js App Router
│       ├── components/       ← componenti React per dominio
│       ├── lib/              ← utility lato server e server actions
│       ├── types/            ← augmentation tipi NextAuth
│       ├── public/           ← asset statici
│       ├── auth.ts           ← configurazione NextAuth.js v5
│       ├── middleware.ts     ← protezione route JWT
│       ├── next.config.ts    ← configurazione Next.js
│       ├── tailwind.config.js
│       └── package.json
└── packages/
    ├── db/
    │   ├── prisma/
    │   │   ├── schema.prisma ← schema Prisma (tabelle koi_*)
    │   │   └── migrations/   ← migrazioni PostgreSQL
    │   └── src/index.ts      ← singleton PrismaClient + re-export tipi
    ├── ui/
    │   └── src/
    │       ├── components/   ← componenti shadcn/ui (Button, Card, …)
    │       ├── lib/utils.ts  ← helper cn()
    │       └── index.ts      ← barrel export
    └── lib/
        └── src/
            ├── types/        ← Visibility, DatumType, PaginatedResult, …
            ├── constants/    ← DATUM_TYPES, VISIBILITY_OPTIONS, CURRENCIES, …
            ├── utils/        ← computeFinalVisibility, buildPaginatedResult, normalizeSymfonyPassword, …
            └── index.ts      ← barrel export
```

---

## 3. Package `apps/web`

### 3.1 App Router — Route Groups

Next.js 15 App Router organizza le route in due **route group**:

```
app/
├── layout.tsx              ← root layout (html, body, globals.css)
├── globals.css
├── (auth)/                 ← layout pubblico (no sidebar)
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/            ← layout autenticato (sidebar + navbar)
│   ├── layout.tsx          ← verifica sessione, struttura UI
│   ├── page.tsx            ← homepage dashboard (statistiche rapide)
│   ├── collections/…
│   ├── albums/…
│   ├── photos/…
│   ├── items/…
│   ├── wishlists/…
│   ├── tags/…
│   ├── templates/…
│   ├── settings/…
│   ├── statistics/…
│   ├── history/…
│   ├── loans/…
│   └── search/…
└── api/                    ← Route Handlers (REST JSON)
    ├── auth/[...nextauth]/
    ├── collections/
    ├── albums/
    ├── items/
    ├── photos/
    ├── logs/
    ├── search/
    └── upload/
```

Il gruppo `(auth)` è pubblico; il gruppo `(dashboard)` richiede una sessione JWT valida (verificata sia nel layout che tramite `middleware.ts`).

---

### 3.2 Pagine (dashboard)

Tutte le pagine sono **Server Components** che:
1. chiamano `requireAuth()` per recuperare la sessione,
2. eseguono query Prisma direttamente (no fetch intermedi),
3. passano i dati a Client Components per le interazioni.

| Percorso | Descrizione |
|---|---|
| `/` | Dashboard — statistiche rapide |
| `/collections` | Lista collezioni radice dell'utente |
| `/collections/new` | Form creazione collezione (con selezione parent e template) |
| `/collections/[id]` | Dettaglio collezione: sotto-collezioni, oggetti, breadcrumb |
| `/collections/[id]/edit` | Form modifica collezione |
| `/items/new` | Nuovo oggetto (con `?collectionId` pre-selezionato) |
| `/items/[id]` | Dettaglio oggetto (dati custom, tag, prestiti) |
| `/items/[id]/edit` | Modifica oggetto |
| `/albums` | Lista album radice dell'utente |
| `/albums/new` | Form creazione album (con `?parentId` e selezione parent) |
| `/albums/[id]` | Dettaglio album: sub-album, foto, breadcrumb |
| `/albums/[id]/edit` | Form modifica album |
| `/albums/[id]/photos/new` | Nuova foto nell'album corrente |
| `/photos/[id]` | Dettaglio foto (immagine full, commento, luogo, data) |
| `/photos/[id]/edit` | Modifica foto |
| `/settings` | Impostazioni profilo utente |
| `/statistics` | Grafici e statistiche (recharts) |
| `/history` | Log delle azioni (create/update/delete) |
| `/search` | Ricerca full-text |

---

### 3.3 Route Handler API

Tutti i route handler seguono lo schema:
- **Autenticazione**: `const session = await auth(); if (!session) return 401`
- **Risposta**: `NextResponse.json(...)` con status HTTP appropriato
- **Errori di dominio**: `TreeValidationError` → 400/403

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts     ← handler NextAuth (signIn, signOut, session)
├── upload/
│   └── route.ts                   ← POST multipart → salva file + genera thumbnail sharp
├── collections/
│   ├── route.ts                   ← GET (lista paginata) · POST (crea)
│   └── [id]/route.ts              ← GET · PATCH · DELETE (con ancestors, propagazione visibilità)
├── items/
│   ├── route.ts                   ← GET · POST
│   └── [id]/route.ts              ← GET · PATCH · DELETE
├── albums/
│   ├── route.ts                   ← GET · POST
│   └── [id]/route.ts              ← GET · PATCH · DELETE (con ancestors, propagazione)
├── photos/
│   ├── route.ts                   ← GET (filtro ?albumId) · POST
│   └── [id]/route.ts              ← GET · PATCH · DELETE
├── logs/
│   └── route.ts                   ← GET (log paginati dell'utente)
└── search/
    └── route.ts                   ← GET ?q= (ricerca multi-entità)
```

**Paginazione** (parametri comuni): `?page=1&perPage=30`  
**Risposta paginata**: `{ data, total, page, perPage, totalPages }`

---

### 3.4 Server Actions

Le **Server Actions** (`"use server"`) sono la via preferita per le mutazioni da form React. Gestiscono:
- validazione con **Zod**,
- operazioni Prisma,
- gestione immagini (upload pre-eseguito via `/api/upload`),
- propagazione visibilità nell'albero,
- logging su `koi_log`,
- `revalidatePath` + `redirect`.

```
lib/actions/
├── collection.actions.ts   ← createCollection · updateCollection · deleteCollection
├── item.actions.ts         ← createItem · updateItem · deleteItem
├── media.actions.ts        ← createAlbum · updateAlbum · deleteAlbum
│                              createWishlist · updateWishlist · deleteWishlist
├── photo.actions.ts        ← createPhoto · updatePhoto · deletePhoto
└── user.actions.ts         ← updateProfile · updatePassword
```

**Schema di validazione** (`zod`): ogni action ha uno schema dedicato con `.safeParse()`. In caso di errore restituisce `{ error: fieldErrors }` senza lanciare eccezioni.

---

### 3.5 Componenti React

I componenti sono suddivisi per **dominio** e distinguono chiaramente tra:
- **Server Components** (pagine, layout): accesso diretto a Prisma e sessione
- **Client Components** (`"use client"`): form interattivi, upload, stato locale

```
components/
├── layout/
│   ├── Navbar.tsx          ← barra superiore (utente, tema)
│   └── Sidebar.tsx         ← navigazione laterale
├── auth/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── collections/
│   ├── CollectionGrid.tsx  ← griglia card collezioni
│   ├── CollectionForm.tsx  ← form crea/modifica (upload img, parent select, template)
│   └── CollectionDetail.tsx ← dettaglio con breadcrumb, sotto-collezioni, oggetti
├── items/
│   ├── ItemForm.tsx        ← form con dati custom (Datum)
│   └── ItemDetail.tsx      ← dettaglio oggetto
├── albums/
│   ├── AlbumGrid.tsx       ← griglia card album
│   ├── AlbumForm.tsx       ← form crea/modifica (upload img, parent select)
│   └── AlbumDetail.tsx     ← dettaglio con breadcrumb, sub-album, foto cliccabili
├── photos/
│   ├── PhotoForm.tsx       ← form (upload img, album, luogo, data scatto)
│   └── PhotoDetail.tsx     ← dettaglio foto full-size con breadcrumb
└── shared/
    └── SearchResults.tsx   ← risultati ricerca multi-entità
```

**Pattern upload immagine** (usato in `CollectionForm`, `AlbumForm`, `PhotoForm`):
1. L'utente seleziona un file → `fetch POST /api/upload` con `FormData`
2. Il server salva il file e genera i thumbnail, restituisce `{ path, smallThumbnail, largeThumbnail }`
3. Il componente salva il path nello stato locale
4. Al submit del form, il path viene incluso nel `FormData` della Server Action

---

### 3.6 Utility di libreria (`lib/`)

```
lib/
├── auth-utils.ts         ← requireAuth(): recupera sessione o redirect /login
├── collections-tree.ts   ← logica dominio per la gerarchia collezioni:
│                            resolveCollectionParent (con cycle-detection)
│                            syncCollectionDescendantsVisibility
│                            getCollectionAncestors
│                            computeFinalVisibility
│                            deleteUploadImageVariants
└── albums-tree.ts        ← logica dominio per la gerarchia album:
                             resolveAlbumParent (con cycle-detection)
                             syncAlbumDescendantsVisibility (propaga anche alle foto)
                             getAlbumAncestors
                             re-export di computeFinalVisibility e deleteUploadImageVariants
```

#### Visibilità a cascata

Sia per collezioni che per album la visibilità finale è calcolata come il valore **più restrittivo** tra la visibilità propria e quella del padre:

```
public < internal < private

finalVisibility = max(ownVisibility, parentVisibility)
```

Quando un nodo cambia visibilità, la funzione `sync*DescendantsVisibility` aggiorna ricorsivamente tutti i figli (e le foto, per gli album).

#### Gestione file upload

`deleteUploadImageVariants(relativePath)` calcola i path di tutte le varianti (`_small`, `_large`) e li elimina dal filesystem con `fs/promises.rm`, ignorando gli errori di cleanup.

---

### 3.7 Autenticazione

**File:** `apps/web/auth.ts`

Configurazione **NextAuth.js v5** con:

| Parametro | Valore |
|---|---|
| Provider | `Credentials` (username o email + password) |
| Strategia sessione | JWT (`maxAge`: 30 giorni) |
| Hash password | bcrypt — normalizzazione `$2y$` → `$2b$` (compatibilità Symfony) |
| Pagina login | `/login` |

**Dati nel token JWT** (e quindi in `session.user`):

```typescript
{
  id: string           // UUID utente
  name: string         // username
  email: string
  image: string | null // avatar
  roles: string[]      // ["ROLE_USER"] | ["ROLE_ADMIN"]
  currency: string     // "EUR", "USD", …
  locale: string       // "it", "en", …
  theme: string        // "light" | "dark" | "auto"
  dateFormat: string   // "Y-m-d", "d/m/Y", …
}
```

**Augmentation tipi** in `types/next-auth.d.ts`: estende `Session["user"]` con i campi custom.

---

### 3.8 Middleware

**File:** `apps/web/middleware.ts`

Usa `auth` di NextAuth come middleware di protezione. Redireziona a `/login` se non autenticato.

**Route escluse dalla protezione:**

```
/login, /register                  ← pagine auth
/api/auth/*                        ← handler NextAuth
/_next/static, /_next/image        ← asset Next.js
/uploads/*                         ← file upload statici
/favicon.ico, /robots.txt          ← file statici
```

---

### 3.9 Upload file

**Route:** `POST /api/upload`

Flusso:
1. Riceve `multipart/form-data` con `file` (File) e `entity` (string, es. `"collection"`, `"album"`, `"photo"`)
2. Valida tipo MIME (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`) e dimensione (max 10 MB)
3. Genera un UUID per il nome file
4. Salva l'originale in `UPLOAD_DIR/{userId}/{entity}/{uuid}{ext}`
5. Genera con **sharp**:
   - `{uuid}_small{ext}` — 200×200 px (cover)
   - `{uuid}_large{ext}` — 600×600 px (inside, senza ingrandimento)
6. Risponde con `{ path, smallThumbnail, largeThumbnail }`

**Variabile d'ambiente:** `UPLOAD_DIR` (default `./public/uploads`)  
I file sono serviti staticamente da Next.js tramite la cartella `public/`.

---

## 4. Package `packages/db`

**Nome npm:** `@koillection/db`

Espone:
- `prisma` — singleton `PrismaClient` (pattern `globalThis` per hot-reload Next.js)
- Tutti i tipi generati da Prisma (re-export di `@prisma/client`)

**Schema:** `prisma/schema.prisma`  
Rispecchia le tabelle PostgreSQL esistenti di Koillection (prefisso `koi_`).

**Modelli principali:**

| Modello Prisma | Tabella DB | Descrizione |
|---|---|---|
| `User` | `koi_user` | Utente con ruoli, preferenze, quota disco |
| `Collection` | `koi_collection` | Collezione con gerarchia parent/child |
| `Item` | `koi_item` | Oggetto in una collezione |
| `Datum` | `koi_datum` | Dato custom di un Item (tipo, valore, file) |
| `Album` | `koi_album` | Album fotografico con gerarchia |
| `Photo` | `koi_photo` | Foto in un Album |
| `Wishlist` | `koi_wishlist` | Lista dei desideri con gerarchia |
| `Wish` | `koi_wish` | Singolo desiderio |
| `Tag` | `koi_tag` | Tag per gli Item |
| `TagCategory` | `koi_tag_category` | Categoria di tag |
| `Template` | `koi_template` | Template per struttura dati degli Item |
| `Field` | `koi_field` | Campo di un Template |
| `ChoiceList` | `koi_choice_list` | Lista valori predefiniti per Datum |
| `Inventory` | `koi_inventory` | Inventario |
| `Loan` | `koi_loan` | Prestito di un Item |
| `Log` | `koi_log` | Log azioni (create/update/delete) |
| `Scraper` | `koi_scraper` | Configurazione scraper |
| `DisplayConfiguration` | `koi_display_configuration` | Preferenze di visualizzazione |
| `Path` | `koi_path` | Path gerarchici (breadcrumb cache) |

**Script DB:**

```bash
npm run db:generate   # genera il client Prisma da schema.prisma
npm run db:push       # applica schema senza migrazione (dev)
npm run db:migrate    # crea e applica una migrazione
npm run db:studio     # apre Prisma Studio nel browser
```

---

## 5. Package `packages/ui`

**Nome npm:** `@koillection/ui`

Libreria di componenti UI basata su **shadcn/ui** + **Tailwind CSS**.

**Componenti esportati:**

| Componente | Descrizione |
|---|---|
| `Button` | Bottone con varianti (`default`, `outline`, `destructive`, `ghost`) e `size` |
| `Card`, `CardContent` | Card contenitore |
| `Input` | Campo input testuale |
| `Label` | Etichetta form |
| `Badge` | Badge colorato (varianti: `default`, `outline`, `secondary`) |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` | Modal dialog |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | Select dropdown |
| `Textarea` | Campo testo multiriga |
| `cn()` | Utility `clsx` + `tailwind-merge` |

Tutti i componenti sono **Client Components** (compatibili con `"use client"`).

---

## 6. Package `packages/lib`

**Nome npm:** `@koillection/lib`

Codice TypeScript condiviso tra app e packages, **senza dipendenze runtime** pesanti.

### Tipi (`types/`)

```typescript
type Visibility = "public" | "internal" | "private"
type DisplayMode = "grid" | "list"
type LogType = "create" | "update" | "delete"
type DatumType = "text" | "textarea" | "number" | "price" | "date" | "rating"
               | "country" | "link" | "list" | "choice-list" | "checkbox"
               | "image" | "file" | "video" | "sign" | "blank-line" | "section"
type ScraperType = "html" | "json" | "isbn" | "barcode"

interface PaginatedResult<T> { data: T[]; total: number; page: number; perPage: number; totalPages: number }
```

### Costanti (`constants/`)

- `DATUM_TYPES` — array con metadata per ogni tipo dato (label, hasFile, hasImage)
- `DATUM_TYPES_WITH_VALUE` — tipi che hanno un campo `value`
- `VISIBILITY_OPTIONS` — array `{ value, label }` per i select
- `CURRENCIES` — codici valuta con simbolo
- `DEFAULT_PAGE_SIZE` — 30

### Utility (`utils/`)

- `computeFinalVisibility(own, parent)` — calcola visibilità finale
- `buildPaginatedResult(data, total, page, perPage)` — costruisce risposta paginata
- `normalizeSymfonyPassword(hash)` — converte `$2y$` → `$2b$` per `bcryptjs`

---

## 7. Toolchain e build

### Turborepo

`turbo.json` definisce la pipeline con dipendenze tra task:

```
build       → dipende da ^build (prima costruisce i package dipendenti)
dev         → parallelo, persistente (no cache)
lint        → dipende da ^build
type-check  → dipende da ^build
db:*        → no cache
```

### Script radice

```bash
npm run dev           # avvia tutti i package in watch mode (Turbopack per web)
npm run build         # build di produzione completo
npm run type-check    # tsc --noEmit su tutti i package
npm run lint          # ESLint su tutti i package
npm run db:generate   # genera client Prisma
npm run db:push       # push schema (dev)
npm run db:migrate    # migrazione DB
npm run db:studio     # Prisma Studio
```

> ⚠️ Tutti gli script leggono `.env` dalla root tramite `dotenv-cli`.

### TypeScript

- `tsconfig.base.json` (root) — configurazione base condivisa (`strict: true`, `moduleResolution: bundler`)
- Ogni package estende la base con il proprio `tsconfig.json`
- `next.config.ts` ha `typescript.ignoreBuildErrors: true` temporaneamente (da rimuovere a stabilizzazione)

### Stato avanzamento conversione (Next.js stack)

| # | Feature | Stato | Note |
|---|---------|-------|------|
| 1 | **Auth** | ✅ Completato | NextAuth.js v5 · provider Credentials · JWT · hash `$2y$→$2b$` · 2 errori TS2742 (non bloccanti, soppresse) |
| 2 | **Collections** | ✅ Completato | CRUD collezioni + Items · gerarchia parent/child · upload immagine · type-check pulito |
| 3 | **Album** | ✅ Completato | CRUD album + Foto · gerarchia parent/child · upload immagine · breadcrumb · propagazione visibilità · type-check pulito |
| 4 | **Wishlist** | ✅ Completato | CRUD wishlist + Wish · gerarchia parent/child · upload immagine · breadcrumb · API REST (`/api/wishlists`, `/api/wishlists/[id]`, `/api/wishes`, `/api/wishes/[id]`) · server actions · propagazione visibilità |
| 5 | **Tags / Template / ChoiceList** | 🔲 Da fare | Backend API + frontend components |
| 6 | **Admin / Statistics / Tools** | 🔲 Da fare | Dashboard admin + statistiche + inventory/loans |

---

## 8. Database e modello dati

**DBMS:** PostgreSQL (condiviso con il backend Symfony legacy)  
**ORM:** Prisma 6

### Gerarchia e visibilità

Sia `Collection` che `Album` (e `Wishlist`) implementano una **gerarchia parent/child** con tre campi di visibilità:

| Campo | Descrizione |
|---|---|
| `visibility` | Visibilità impostata dall'utente |
| `parentVisibility` | Visibilità finale del nodo padre (snapshot) |
| `finalVisibility` | `max(visibility, parentVisibility)` — usato per filtri e ACL |

Quando un nodo cambia `visibility`, la propagazione ricorsiva aggiorna `parentVisibility` e `finalVisibility` di tutti i discendenti (e delle foto per gli album).

### Indici principali

```sql
idx_collection_final_visibility  ON koi_collection(final_visibility)
idx_album_final_visibility        ON koi_album(final_visibility)
idx_item_final_visibility         ON koi_item(final_visibility)
idx_photo_final_visibility        ON koi_photo(final_visibility)
idx_datum_final_visibility        ON koi_datum(final_visibility)
```

---

## 9. Flusso di una richiesta tipica

### A. Navigazione pagina autenticata (Server Component)

```
Browser → Next.js middleware
         ├── JWT valido? → continua
         └── no JWT → redirect /login

Next.js → Server Component (es. /albums/[id]/page.tsx)
         ├── requireAuth() → Session
         ├── prisma.album.findFirst(…) → dati DB
         ├── getAlbumAncestors(…) → breadcrumb
         └── <AlbumDetail album={…} /> → RSC stream al browser
```

### B. Submit form (Server Action)

```
Browser (Client Component)
  → handleSubmit()
    ├── (opzionale) fetch POST /api/upload → { path, smallThumbnail }
    └── Server Action (es. updateAlbum)
          ├── requireAuth()
          ├── albumSchema.safeParse(formData)
          ├── resolveAlbumParent() → valida parent + cycle-detection
          ├── prisma.album.update(…)
          ├── syncAlbumDescendantsVisibility(…)
          ├── prisma.photo.updateMany(…)
          ├── logAction(…) → koi_log
          ├── revalidatePath(…)
          └── redirect(/albums/[id])
```

### C. Chiamata API REST (client esterno o SPA)

```
Client → GET /api/albums/[id]
         ├── auth() → Session | null
         ├── 401 se non autenticato
         ├── prisma.album.findFirst(…)
         ├── getAlbumAncestors(…)
         └── NextResponse.json({ ...album, ancestors })
```

---

## 10. Convenzioni di naming

| Tipo | Convenzione | Esempio |
|---|---|---|
| Componenti React | `PascalCase.tsx` | `AlbumDetail.tsx` |
| Server Actions | `[risorsa].actions.ts` | `photo.actions.ts` |
| Route Handlers | `app/api/[risorsa]/route.ts` | `app/api/albums/route.ts` |
| Utility/lib | `camelCase.ts` | `albums-tree.ts` |
| Costanti | `UPPER_SNAKE_CASE` | `VISIBILITY_OPTIONS` |
| Tipi condivisi | `PascalCase` | `Visibility`, `DatumType` |
| Modelli Prisma | `PascalCase` (rispecchia tabella) | `Album` → `koi_album` |
| Path param Next.js | `[id]` — sempre `id` come nome | `/albums/[id]` |

---

## 11. Variabili d'ambiente

Definite in `next/.env` (non committato). Template in `next/.env.example`.

| Variabile | Obbligatoria | Descrizione | Default |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL | — |
| `AUTH_SECRET` | ✅ | Secret JWT NextAuth (min 32 char) | — |
| `NEXTAUTH_URL` | ✅ (prod) | URL pubblico dell'app | — |
| `UPLOAD_DIR` | ❌ | Path assoluto o relativo cartella upload | `./public/uploads` |
| `NODE_ENV` | ❌ | `development` \| `production` | `development` |

> `DATABASE_URL` è condivisa tra `apps/web/.env` e `packages/db/.env` perché sia Next.js che Prisma CLI la leggono dal proprio working directory.

