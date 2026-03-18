# Koillection — Next.js (v2.x)

Versione full-stack Next.js di Koillection. Monorepo Turborepo con App Router, Prisma, shadcn/ui e NextAuth.js v5.

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
    ├── db/                   ← Prisma schema + client (tabelle koi_*)
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
cp apps/web/.env.example apps/web/.env.local
# Modifica DATABASE_URL e NEXTAUTH_SECRET in apps/web/.env.local

# 3. Genera il client Prisma
cd packages/db
DATABASE_URL="<tua-url>" npx prisma generate

# 4. (Opzionale) Esegui le migrazioni su un nuovo DB
DATABASE_URL="<tua-url>" npx prisma db push

# 5. Avvia in sviluppo
cd ../../
npm run dev
```

## Variabili d'Ambiente (`apps/web/.env.local`)

| Variabile | Descrizione | Esempio |
|---|---|---|
| `DATABASE_URL` | DSN PostgreSQL | `postgresql://user:pass@localhost:5432/koillection` |
| `NEXTAUTH_SECRET` | Secret JWT sessione (random 32 byte) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base app | `http://localhost:3000` |
| `UPLOAD_DIR` | Cartella upload file | `./public/uploads` |

## Compatibilità con il DB Legacy

Lo schema Prisma usa i **nomi di tabella originali** (`koi_*`), quindi è possibile puntare allo stesso PostgreSQL usato dal backend Symfony. Le password sono compatibili: Symfony usa `bcrypt $2y$` che viene normalizzato a `$2b$` per `bcryptjs` (Node.js).

## Comandi

```bash
npm run dev           # Avvia in development (Turbopack)
npm run build         # Build di produzione
npm run db:generate   # Rigenera client Prisma
npm run db:push       # Sincronizza schema sul DB (dev)
npm run db:migrate    # Crea migration (produzione)
npm run db:studio     # Apre Prisma Studio
```

## Route Disponibili

| Route | Descrizione |
|---|---|
| `/login` | Accesso |
| `/register` | Registrazione |
| `/` | Dashboard (statistiche rapide) |
| `/collections` | Gestione collezioni |
| `/collections/[id]` | Dettaglio collezione con oggetti |
| `/items/[id]` | Dettaglio oggetto con dati custom |
| `/albums` | Album fotografici |
| `/wishlists` | Liste dei desideri |
| `/tags` | Gestione tag |
| `/templates` | Template per struttura oggetti |
| `/loans` | Prestiti attivi |
| `/history` | Storico modifiche |
| `/statistics` | Statistiche e grafici |
| `/search` | Ricerca globale |
| `/settings` | Impostazioni profilo |

## API REST

| Endpoint | Metodi | Descrizione |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Handler NextAuth.js |
| `/api/collections` | GET, POST | Lista e crea collezioni |
| `/api/collections/[id]` | GET, PATCH, DELETE | CRUD collezione |
| `/api/items` | GET, POST | Lista e crea oggetti |
| `/api/items/[id]` | GET, PATCH, DELETE | CRUD oggetto |
| `/api/search` | GET | Ricerca full-text |
| `/api/upload` | POST | Upload immagini (con thumbnail) |
| `/api/logs` | GET | Storico modifiche |

