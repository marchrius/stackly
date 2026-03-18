# ARCHITECTURE.md — Architettura di Koillection

## Panoramica

Koillection è un'applicazione web **self-hosted** per la gestione di collezioni personali. L'architettura attuale (v1.x) è basata su **Symfony 8** con frontend **Twig + Materialize CSS**, esposta tramite **API Platform** per la parte REST e con autenticazione JWT tramite **LexikJWT**.

L'architettura è in fase di migrazione verso un'applicazione **Full Stack Next.js** (v2.x). Vedi [`AGENTS.md`](./AGENTS.md) e [`GEMINI.md`](./GEMINI.md) per il piano di conversione.

---

## Architettura Attuale (v1.x — Legacy)

### Stack Tecnologico

| Livello | Tecnologia | Versione |
|---|---|---|
| Linguaggio backend | PHP | ≥ 8.5 |
| Framework backend | Symfony | 8.0 |
| API Layer | API Platform | 4.2 |
| ORM | Doctrine ORM | 3.x |
| Database | PostgreSQL | — |
| Autenticazione (API) | LexikJWT | 3.x |
| Template engine | Twig | 3.x |
| CSS Framework | Materialize CSS | — |
| JS Framework | Stimulus (Hotwire) | — |
| Asset bundler | Webpack Encore | — |
| Runtime | FrankenPHP | — |
| Web server | Caddy | — |
| Test | PHPUnit + Paratest | 12.x |
| Containerizzazione | Docker / Docker Compose | — |

---

### Struttura Directory (Legacy)

```
/
├── api/                        ← Namespace API\ (API Platform custom)
│   ├── Controller/             ← Controller API (es. MetricsController)
│   ├── Doctrine/Extension/     ← Estensioni Doctrine per API Platform
│   ├── Encoder/                ← Decodificatori multipart
│   ├── OpenApi/                ← Decoratori OpenAPI (JWT, Metrics)
│   └── Serializer/             ← Denormalizzatori custom
│
├── assets/                     ← Frontend (compilato con Webpack Encore)
│   ├── app.js                  ← Entry point JS principale
│   ├── controllers/            ← Controller Stimulus
│   ├── styles/                 ← CSS (Materialize + custom + temi)
│   ├── fonts/
│   ├── img/
│   └── webpack.config.js
│
├── bin/                        ← Binari Symfony e utilità CLI
│
├── config/                     ← Configurazione Symfony
│   ├── packages/               ← Config bundle (api_platform, doctrine, security…)
│   ├── routes/
│   └── services.yaml
│
├── docker/                     ← File di configurazione Docker
│   ├── Caddyfile               ← Config web server (prod)
│   ├── Caddyfile-dev           ← Config web server (dev)
│   └── entrypoint.sh
│
├── migrations/                 ← Migrazioni DB (Mysql/ e Postgresql/)
│
├── public/                     ← Document root (servito da Caddy)
│   ├── index.php               ← Front controller Symfony
│   ├── build/                  ← Asset compilati (output Webpack)
│   └── uploads/                ← Upload utenti
│
├── src/                        ← Namespace App\ (codice applicativo)
│   ├── Kernel.php
│   ├── Attribute/              ← Attributi PHP custom
│   ├── Command/                ← Comandi CLI Symfony
│   ├── Controller/             ← Controller HTTP (Twig-based)
│   ├── Doctrine/               ← Tipi e listener Doctrine
│   ├── Entity/                 ← Entità Doctrine (modello dati)
│   ├── Enum/                   ← Enumerazioni PHP
│   ├── EventListener/          ← Event Listener / Subscriber
│   ├── Form/                   ← Form Symfony
│   ├── Http/                   ← Resolver e middleware HTTP custom
│   ├── Model/                  ← DTO / Value Object
│   ├── Monolog/                ← Processori di log custom
│   ├── Repository/             ← Repository Doctrine
│   ├── Security/               ← Voter, Guard, Authenticator
│   ├── Service/                ← Servizi applicativi (business logic)
│   ├── Twig/                   ← Extension e Runtime Twig
│   └── Validator/              ← Vincoli di validazione custom
│
├── templates/                  ← Template Twig
│   ├── base.html.twig
│   ├── layout.html.twig
│   └── App/                    ← Template per ogni modulo
│
├── tests/                      ← Suite di test
│   ├── Api/                    ← Test API (HTTP)
│   ├── App/                    ← Test applicazione (browser/functional)
│   ├── Command/                ← Test comandi CLI
│   └── Factory/                ← Factory Zenstruck Foundry
│
└── translations/               ← File di traduzione (14 lingue)
```

---

### Modello dei Dati (Entità Principali)

```
User
 ├── Collection (1:N)
 │    └── Item (1:N)
 │         └── Datum (1:N)        ← Dati custom per ogni oggetto
 ├── Album (1:N)
 │    └── Photo (1:N)
 ├── Wishlist (1:N)
 │    └── Wish (1:N)
 ├── Template (1:N)
 │    └── Field (1:N)
 ├── ChoiceList (1:N)
 ├── Tag (1:N) ←──── Item (M:N)
 ├── TagCategory (1:N)
 │    └── Tag
 ├── Inventory (1:N)
 ├── Loan (1:N)
 ├── Log (1:N)                    ← Audit log automatico
 └── Scraper (1:N)                ← Configurazioni scraper web
```

---

### Flusso Request/Response (Legacy)

```
Browser
  │
  ▼
Caddy (web server)
  │
  ├─→ /api/*     → FrankenPHP → Symfony Kernel → API Platform → Controller API
  │                                                              → Doctrine ORM → PostgreSQL
  │
  └─→ /*         → FrankenPHP → Symfony Kernel → Controller Twig
                                                → Service Layer
                                                → Doctrine ORM → PostgreSQL
                                                → Twig Template → HTML
                                                    ↑
                                               Materialize CSS + Stimulus JS
                                               (serviti da Webpack Encore)
```

---

### Autenticazione (Legacy)

- **Sessione web**: Form login classico Symfony (`SecurityController`), sessione cookie-based.
- **API REST**: Token JWT — generato via `POST /api/authentication_token` (LexikJWT), da passare come `Authorization: Bearer <token>`.

---

### Funzionalità Principali

| Modulo | Descrizione |
|---|---|
| **Collections** | Gestione gerarchica di collezioni e oggetti |
| **Items** | Oggetti con campi dinamici (Datum) e template |
| **Album** | Album fotografici |
| **Wishlist** | Liste dei desideri |
| **Tags** | Sistema di tagging trasversale |
| **Templates** | Template riutilizzabili per la struttura degli Item |
| **ChoiceList** | Liste di valori predefiniti per i campi |
| **Inventory** | Generazione inventari |
| **Loans** | Tracciamento prestiti di oggetti |
| **History / Log** | Storico modifiche automatico |
| **Scraper** | Auto-completamento dati via scraping web |
| **Statistics** | Statistiche e grafici della collezione |
| **Admin** | Gestione utenti, configurazione globale |
| **Search** | Ricerca avanzata full-text e per attributi |
| **i18n** | Supporto multilingua (14 lingue) |

---

## Architettura Target (v2.x — Next.js)

> In costruzione. Vedi [`AGENTS.md`](./AGENTS.md) per il piano dettagliato.

### Stack Target

| Livello | Tecnologia |
|---|---|
| Framework Full Stack | Next.js 14+ (App Router) |
| Linguaggio | TypeScript |
| API Layer | Route Handlers + Server Actions |
| ORM | Prisma |
| Database | PostgreSQL (invariato) |
| Autenticazione | NextAuth.js (Auth.js v5) |
| UI Components | shadcn/ui + Tailwind CSS |
| Runtime | Node.js |

### Struttura Target (`new/`)

```
new/
├── apps/
│   └── web/                  ← App Next.js (frontend + backend API)
└── packages/
    ├── db/                   ← Prisma schema e client
    ├── ui/                   ← Componenti condivisi
    └── lib/                  ← Utility e tipi TypeScript
```

---

## Ambiente di Sviluppo

### Prerequisiti

- Docker + Docker Compose
- PHP 8.5+ (per sviluppo legacy)
- Node.js (per frontend legacy e nuovo)

### Avvio (Legacy)

```bash
cp docker-compose.dist.yml docker-compose.yml
docker compose up -d
```

### Variabili d'Ambiente Principali

| Variabile | Descrizione |
|---|---|
| `DATABASE_URL` | DSN PostgreSQL |
| `JWT_SECRET_KEY` | Chiave privata JWT |
| `JWT_PUBLIC_KEY` | Chiave pubblica JWT |
| `JWT_PASSPHRASE` | Passphrase chiave JWT |
| `APP_ENV` | Ambiente (`dev`/`prod`) |
| `APP_SECRET` | Secret Symfony |

---

## Testing

- **Framework**: PHPUnit 12 + Paratest (esecuzione parallela)
- **Dati di test**: Zenstruck Foundry (factory pattern)
- **Test API**: `tests/Api/` — test HTTP contro le route API Platform
- **Test App**: `tests/App/` — test funzionali con Symfony BrowserKit

```bash
# Eseguire tutti i test
composer test:phpunit

# Eseguire in parallelo
composer test:paratest

# Con code coverage
composer test:coverage
```

