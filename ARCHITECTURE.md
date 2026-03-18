# ARCHITECTURE.md — Architettura di Koillection (Legacy v1.x)

> Documento tecnico dell'architettura del backend Symfony/PHP.  
> Versione corrente: **1.8.0** · Aggiornato al: **marzo 2026**  
> Per l'architettura Next.js (v2.x) vedi [`next/ARCHITECTURE.md`](./next/ARCHITECTURE.md).

---

## Indice

1. [Panoramica](#1-panoramica)
2. [Struttura del repository](#2-struttura-del-repository)
3. [Stack tecnologico](#3-stack-tecnologico)
4. [Namespace `App\` — `src/`](#4-namespace-app--src)
   - [Controller](#41-controller)
   - [Entity](#42-entity)
   - [Repository](#43-repository)
   - [Service](#44-service)
   - [EventListener](#45-eventlistener)
   - [Form](#46-form)
   - [Enum](#47-enum)
   - [Command](#48-command)
   - [Twig](#49-twig)
   - [Security](#410-security)
   - [Validator](#411-validator)
   - [Doctrine](#412-doctrine)
   - [Attribute](#413-attribute)
   - [Model](#414-model)
   - [Http](#415-http)
   - [Monolog](#416-monolog)
5. [Namespace `Api\` — `api/`](#5-namespace-api--api)
6. [Frontend — `assets/`](#6-frontend--assets)
7. [Template — `templates/`](#7-template--templates)
8. [Configurazione — `config/`](#8-configurazione--config)
9. [Docker e deploy](#9-docker-e-deploy)
10. [Database e modello dati](#10-database-e-modello-dati)
11. [Sicurezza e autenticazione](#11-sicurezza-e-autenticazione)
12. [Flusso di una richiesta](#12-flusso-di-una-richiesta)
13. [Test](#13-test)
14. [Internazionalizzazione](#14-internazionalizzazione)
15. [Migrazioni DB](#15-migrazioni-db)
16. [Variabili d'ambiente](#16-variabili-dambiente)

---

## 1. Panoramica

Koillection è un'applicazione web **self-hosted** per la gestione di collezioni personali (fumetti, vinili, giochi, libri, ecc.). L'architettura v1.x è un'applicazione **monolitica Symfony 8** con:

- Frontend server-side renderizzato via **Twig + Materialize CSS + Stimulus JS**
- API REST completa esposta tramite **API Platform 4**
- Autenticazione **dual**: sessione cookie per il web, JWT per le API
- Runtime **FrankenPHP** (PHP come modulo Go) con web server **Caddy**
- Database: **PostgreSQL** (supporto anche MySQL via driver configurabile)

---

## 2. Struttura del repository

```
/
├── api/                        ← Namespace Api\ — customizzazioni API Platform
│   ├── Controller/
│   │   └── MetricsController.php
│   ├── Doctrine/Extension/
│   │   └── OwnershipExtension.php
│   ├── Encoder/
│   │   └── MultipartDecoder.php
│   ├── OpenApi/
│   │   ├── JwtDecorator.php
│   │   └── MetricsDecorator.php
│   └── Serializer/
│       └── UploadedFileDenormalizer.php
│
├── assets/                     ← Frontend (Webpack Encore → public/build/)
│   ├── app.js                  ← Entry point JS
│   ├── bootstrap.js            ← Inizializzazione Stimulus
│   ├── controllers.json        ← Mappa controller Stimulus
│   ├── webpack.config.js
│   ├── controllers/            ← Controller Stimulus (44+)
│   ├── fixtures/               ← Immagini di esempio
│   ├── fonts/
│   ├── img/
│   ├── js/                     ← Librerie JS aggiuntive
│   └── styles/                 ← CSS (Materialize + temi)
│
├── bin/
│   └── console                 ← CLI Symfony
│
├── config/
│   ├── routes.yaml             ← Route principali
│   ├── services.yaml           ← DI container
│   ├── packages/               ← Configurazione bundle (16 file)
│   └── routes/                 ← Route aggiuntive (API Platform dev)
│
├── docker/
│   ├── Caddyfile               ← Web server prod
│   ├── Caddyfile-dev           ← Web server dev
│   ├── default.conf            ← Config Nginx alternativa
│   ├── entrypoint.sh           ← Bootstrap container prod
│   ├── entrypoint-dev.sh       ← Bootstrap container dev
│   ├── php.ini                 ← Configurazione PHP
│   └── volumes/                ← Volume mount points
│
├── migrations/
│   ├── Postgresql/             ← 65+ migrazioni PostgreSQL (dal 2018)
│   └── Mysql/                  ← Migrazioni MySQL
│
├── public/
│   ├── index.php               ← Front controller Symfony
│   ├── build/                  ← Asset compilati (gitignored)
│   └── uploads/                ← File caricati dagli utenti
│
├── src/                        ← Namespace App\ — codice applicativo
│   ├── Kernel.php
│   ├── Attribute/
│   ├── Command/
│   ├── Controller/
│   ├── Doctrine/
│   ├── Entity/
│   ├── Enum/
│   ├── EventListener/
│   ├── Form/
│   ├── Http/
│   ├── Model/
│   ├── Monolog/
│   ├── Repository/
│   ├── Security/
│   ├── Service/
│   ├── Twig/
│   └── Validator/
│
├── templates/                  ← Template Twig (suddivisi per modulo)
│   ├── base.html.twig
│   ├── layout.html.twig
│   └── App/                    ← 25+ cartelle modulo
│
├── tests/                      ← Suite PHPUnit
│   ├── Api/                    ← Test HTTP per ogni risorsa API
│   ├── App/                    ← Test funzionali web
│   ├── Command/                ← Test comandi CLI
│   ├── Factory/                ← Zenstruck Foundry (23 factory)
│   ├── ApiTestCase.php
│   └── AppTestCase.php
│
├── translations/               ← File i18n (14 lingue)
├── Dockerfile                  ← Immagine prod (FrankenPHP)
├── Dockerfile.dev              ← Immagine dev
├── docker-compose.dist.yml
├── composer.json
├── phpunit.xml
└── rector.php                  ← Configurazione Rector (refactoring automatico)
```

---

## 3. Stack tecnologico

| Livello | Tecnologia | Versione |
|---|---|---|
| Linguaggio | PHP | ≥ 8.5 |
| Framework | Symfony | 8.0 |
| API Layer | API Platform | 4.2 |
| ORM | Doctrine ORM | 3.6 |
| DBAL | Doctrine DBAL | 4.4 |
| Database | PostgreSQL / MySQL | — |
| Autenticazione API | LexikJWT Bundle | 3.2 |
| Template engine | Twig | 3.x |
| CSS Framework | Materialize CSS | — |
| JS Framework | Stimulus (Hotwire) | — |
| Asset bundler | Webpack Encore | — |
| Runtime PHP | FrankenPHP | — |
| Web server | Caddy | — |
| Test | PHPUnit + Paratest | 12.x |
| Factory per test | Zenstruck Foundry | — |
| CORS | NelmioCorsBundle | 2.6 |
| Zip streaming | maennchen/zipstream-php | 3.2 |
| Refactoring | Rector | — |
| Containerizzazione | Docker / Docker Compose | — |

**Estensioni PHP richieste:** `ctype`, `fileinfo`, `gd`, `iconv`, `intl`, `json`, `pdo_pgsql`, `pdo_mysql`, `opcache`, `apcu`, `curl`, `zip`

---

## 4. Namespace `App\` — `src/`

### 4.1 Controller

Tutti i controller estendono `App\Controller\AbstractController` e usano attributi PHP per il routing. Le route sono auto-registrate da `config/routes.yaml`.

```
src/Controller/
├── AbstractController.php              ← Base con helper: getPaginator, getUser, …
├── SecurityController.php              ← Login / logout / primo accesso
├── ProfileController.php               ← Profilo utente (avatar, dati personali)
├── SettingsController.php              ← Impostazioni app dell'utente
├── StatisticsController.php            ← Dashboard statistiche e grafici
├── SearchController.php                ← Ricerca semplice e avanzata
├── AdvancedItemSearchController.php    ← Ricerca avanzata con blocchi/filtri
├── HistoryController.php               ← Storico azioni (log)
├── InventoryController.php             ← Generazione e visualizzazione inventari
├── LoanController.php                  ← Gestione prestiti oggetti
├── SignController.php                  ← Firma digitale per oggetti
├── ToolsController.php                 ← Strumenti admin (esportazione, merge tag, …)
├── DatumController.php                 ← CRUD dati custom (Datum) degli Item
├── CollectionController.php            ← CRUD collezioni + navigazione gerarchica
├── ItemController.php                  ← CRUD oggetti nelle collezioni
├── AlbumController.php                 ← CRUD album fotografici
├── PhotoController.php                 ← CRUD foto negli album
├── WishlistController.php              ← CRUD liste dei desideri
├── WishController.php                  ← CRUD desideri nelle wishlist
├── TagController.php                   ← CRUD tag e viste per tag
├── TagCategoryController.php           ← CRUD categorie tag
├── TemplateController.php              ← CRUD template struttura Item
├── ChoiceListController.php            ← CRUD liste di valori predefiniti
├── Admin/
│   ├── AdminController.php             ← Dashboard admin
│   ├── ConfigurationController.php     ← Configurazione globale
│   ├── ErrorController.php             ← Gestione pagine errore
│   └── UserController.php             ← Gestione utenti (admin)
└── Scraper/
    ├── CollectionScraperController.php ← Scraping per collezioni
    ├── ItemScraperController.php       ← Scraping per oggetti
    └── WishScraperController.php       ← Scraping per desideri
```

---

### 4.2 Entity

Tutte le entità usano attributi PHP 8 per il mapping Doctrine. Le tabelle hanno il prefisso `koi_`.

```
src/Entity/
├── Interfaces/
│   ├── BreadcrumbableInterface.php     ← Entità con percorso breadcrumb
│   ├── CacheableInterface.php          ← Entità con valori cached (contatori)
│   ├── LoggableInterface.php           ← Entità con audit log automatico
│   └── VisibleInterface.php            ← Entità con visibilità (public/internal/private)
│
├── Traits/
│   └── VisibleTrait.php                ← Implementazione default visibilità
│
├── User.php                            ← koi_user — utente con ruoli e preferenze
├── Collection.php                      ← koi_collection — collezione con gerarchia
├── Item.php                            ← koi_item — oggetto in una collezione
├── Datum.php                           ← koi_datum — dato custom di un Item
├── Album.php                           ← koi_album — album fotografico
├── Photo.php                           ← koi_photo — foto in un album
├── Wishlist.php                        ← koi_wishlist — lista dei desideri
├── Wish.php                            ← koi_wish — singolo desiderio
├── Tag.php                             ← koi_tag — tag applicabile agli Item
├── TagCategory.php                     ← koi_tag_category — categoria di tag
├── Template.php                        ← koi_template — template struttura Item
├── Field.php                           ← koi_field — campo di un Template
├── ChoiceList.php                      ← koi_choice_list — lista valori Datum
├── Inventory.php                       ← koi_inventory — inventario
├── Loan.php                            ← koi_loan — prestito di un Item
├── Log.php                             ← koi_log — audit log azione
├── Scraper.php                         ← koi_scraper — configurazione scraper
├── Configuration.php                   ← koi_configuration — configurazione globale
├── DisplayConfiguration.php            ← koi_display_configuration — preferenze vista
├── Path.php                            ← koi_path — cache breadcrumb
├── Search.php                          ← koi_search — ricerca salvata
├── SearchBlock.php                     ← koi_search_block — blocco di ricerca avanzata
├── SearchFilter.php                    ← koi_search_filter — filtro singolo in un blocco
└── Error.php                           ← Entità errore (transiente, non mappata)
```

**Interfacce e trait principali:**

| Interfaccia / Trait | Scopo |
|---|---|
| `VisibleInterface` + `VisibleTrait` | Gestisce `visibility`, `parentVisibility`, `finalVisibility` con propagazione a cascata |
| `LoggableInterface` | Marca l'entità per audit log automatico in `LoggableListener` |
| `CacheableInterface` | Marca l'entità per ricalcolo contatori cached |
| `BreadcrumbableInterface` | Espone metodo per costruire il breadcrumb |

---

### 4.3 Repository

Un repository Doctrine per ogni entità. Estendono `ServiceEntityRepository` con query personalizzate.

```
src/Repository/
├── UserRepository.php
├── CollectionRepository.php       ← Query albero gerarchico, contatori, statistiche
├── ItemRepository.php             ← Ricerca avanzata, filtri, paginazione
├── DatumRepository.php
├── AlbumRepository.php
├── PhotoRepository.php
├── WishlistRepository.php
├── WishRepository.php
├── TagRepository.php              ← Ricerca con count item, batch tagging
├── TagCategoryRepository.php
├── TemplateRepository.php
├── ChoiceListRepository.php
├── InventoryRepository.php
├── LoanRepository.php
├── LogRepository.php              ← Filtro per tipo/classe/data
├── ScraperRepository.php
├── ConfigurationRepository.php
├── DisplayConfigurationRepository.php
├── SearchRepository.php
├── SearchBlockRepository.php
├── SearchFilterRepository.php
└── ErrorRepository.php
```

---

### 4.4 Service

```
src/Service/
├── AdvancedItemSearcher.php          ← Esecuzione ricerche avanzate con blocchi/filtri
├── ArraySorter.php                   ← Ordinamento array con logica custom
├── Autocompleter.php                 ← Auto-completamento campi (tag, collezioni, …)
├── BreadcrumbBuilder.php             ← Costruisce il percorso breadcrumb da Path
├── CachedValuesCalculator.php        ← Ricalcola contatori e valori cached di un nodo
├── CachedValuesGetter.php            ← Legge i valori cached con fallback al ricalcolo
├── ColorPicker.php                   ← Genera colori casuali per nuove entità
├── CommandExecutor.php               ← Esegue comandi Symfony in background
├── ConfigurationHelper.php           ← Accesso centralizzato alla Configuration
├── ContextHandler.php                ← Gestisce il contesto corrente (utente, locale, …)
├── DiskUsageCalculator.php           ← Calcola spazio disco usato per utente
├── FeatureChecker.php                ← Verifica se una feature è abilitata (quota, …)
├── ImageHandler.php                  ← Crop, resize, salvataggio immagini caricate
├── InventoryHandler.php              ← Genera file inventario (CSV/ZIP)
├── ItemNameGuesser.php               ← Suggerisce nome Item dal contenuto Datum
├── JavascriptTranslationsDumper.php  ← Esporta traduzioni in JS per Stimulus
├── LatestReleaseChecker.php          ← Verifica ultima versione disponibile su GitHub
├── LocaleHelper.php                  ← Normalizzazione e validazione locale
├── PaginatorFactory.php              ← Crea paginatori Doctrine
├── PasswordUpdater.php               ← Aggiorna hash password con bcrypt
├── RandomStringGenerator.php         ← Genera stringhe casuali (token, slug, …)
├── RefreshCachedValuesQueue.php      ← Coda in-memory per ricalcoli batch
├── ThumbnailGenerator.php            ← Genera thumbnail small/large con GD
│
├── Graph/
│   ├── CalendarBuilder.php           ← Dati per heatmap calendario attività
│   ├── ChartBuilder.php              ← Dati per grafici statistiche (bar, pie, …)
│   └── TreeBuilder.php               ← Costruisce albero gerarchico per JS
│
└── Scraper/
    ├── HtmlScraper.php               ← Base scraper HTML (Symfony HttpClient)
    ├── HtmlCollectionScraper.php     ← Scraping dati per collezioni
    ├── HtmlItemScraper.php           ← Scraping dati per oggetti
    └── HtmlWishScraper.php           ← Scraping dati per desideri
```

---

### 4.5 EventListener

I listener sono registrati via autoconfigure Symfony. Operano su eventi kernel HTTP e Doctrine.

```
src/EventListener/
├── AccessDeniedListener.php          ← Converte AccessDeniedException in redirect login
├── ActivityListener.php              ← Aggiorna timestamp ultima attività utente
├── ColorListener.php                 ← Assegna colore random a nuove entità senza colore
├── ContextListener.php               ← Imposta locale/timezone/theme in base all'utente
├── FilterListener.php                ← Abilita filtri Doctrine (ownership, visibility)
├── LocaleListener.php                ← Imposta locale Symfony dalla sessione/preferenze
├── LoggableListener.php              ← Crea record Log per ogni create/update/delete
├── OwnershipListener.php             ← Assegna owner corrente alle entità al persist
├── RefreshCachedValuesListener.php   ← Ricalcola cached values post-flush
├── RefreshCachedValuesQueueListener.php ← Processa la coda dei ricalcoli batch
├── SeenListener.php                  ← Incrementa seenCounter sulle view
├── TimestampableListener.php         ← Aggiorna createdAt/updatedAt automaticamente
├── TimezoneListener.php              ← Converte DateTime nel timezone utente
├── UploadListener.php                ← Gestisce salvataggio file caricati (Upload attr.)
└── UserListener.php                  ← Hook utente: creazione configurazioni default
```

---

### 4.6 Form

```
src/Form/
├── Extension/
│   └── ModelTransformerExtension.php         ← Estende FormType con DataTransformer
│
├── DataTransformer/
│   ├── Base64ToImageTransformer.php          ← Base64 → File per upload da API
│   ├── JsonToItemTransformer.php             ← JSON ID → entità Item
│   ├── JsonToTagTransformer.php              ← JSON IDs → entità Tag[]
│   ├── StringToInventoryContentTransformer.php ← CSV → array inventario
│   └── UrlToImageTransformer.php             ← URL → File scaricato
│
└── Type/
    ├── Entity/                               ← FormType per le entità principali
    │   ├── AlbumType.php
    │   ├── ChoiceListType.php
    │   ├── CollectionType.php
    │   ├── DatumType.php
    │   ├── DisplayConfigurationType.php
    │   ├── FieldType.php
    │   ├── InventoryType.php
    │   ├── ItemType.php
    │   ├── LoanType.php
    │   ├── PathType.php
    │   ├── PhotoType.php
    │   ├── ScraperType.php
    │   ├── SearchBlockType.php
    │   ├── SearchDisplayConfigurationType.php
    │   ├── SearchFilterType.php
    │   ├── SearchType.php
    │   ├── TagCategoryType.php
    │   ├── TagType.php
    │   ├── TemplateType.php
    │   ├── WishType.php
    │   ├── WishlistType.php
    │   └── Admin/
    │       ├── ConfigurationCheckboxType.php
    │       ├── ConfigurationChoiceType.php
    │       ├── ConfigurationTextareaType.php
    │       └── UserType.php
    │
    ├── Model/                                ← FormType per DTO/Model
    │   ├── BatchTaggerType.php               ← Tag multipli su selezione Item
    │   ├── CollectionScraperImporterType.php
    │   ├── ConfigurationAdminType.php
    │   ├── HeaderType.php
    │   ├── ItemScraperImporterType.php
    │   ├── ProfileType.php
    │   ├── ScrapingCollectionType.php
    │   ├── ScrapingItemType.php
    │   ├── ScrapingWishType.php
    │   ├── SearchHistoryType.php
    │   ├── SearchTagType.php
    │   ├── SearchType.php
    │   ├── SettingsType.php
    │   └── WishScraperImporterType.php
    │
    └── Security/
        └── UserType.php                      ← Form login
```

---

### 4.7 Enum

```
src/Enum/
├── VisibilityEnum.php           ← public | internal | private
├── RoleEnum.php                 ← ROLE_USER | ROLE_ADMIN
├── DatumTypeEnum.php            ← text | number | image | file | … (20 tipi)
├── DisplayModeEnum.php          ← grid | list
├── LogTypeEnum.php              ← create | update | delete
├── ScraperTypeEnum.php          ← html | json | isbn | barcode
├── ThemeEnum.php                ← light | dark | auto
├── DateFormatEnum.php           ← Y-m-d | d/m/Y | m/d/Y | …
├── CurrencyEnum.php             ← EUR | USD | GBP | … (50+ valute)
├── SortingDirectionEnum.php     ← ASC | DESC
├── HistoryFilterEnum.php        ← filtri per lo storico
├── ConfigurationEnum.php        ← chiavi configurazione globale
├── ReservedLabelEnum.php        ← label riservate per Datum speciali
└── AdvancedItemSearch/
    ├── TypeEnum.php             ← tipo blocco di ricerca (and | or)
    ├── OperatorEnum.php         ← operatore filtro (=, !=, contains, …)
    └── ConditionEnum.php        ← condizione filtro
```

---

### 4.8 Command

```
src/Command/
├── CleanUpCommand.php                     ← Elimina file orfani (immagini senza entità)
├── DumpJavascriptTranslationsCommand.php  ← Esporta traduzioni PHP → JS
├── RefreshCachedValuesCommand.php         ← Ricalcola tutti i cached values
├── RegenerateLogsCommand.php              ← Rigenera i Log da zero
└── RegenerateThumbnailsCommand.php        ← Rigenera thumbnail per tutti gli upload
```

---

### 4.9 Twig

```
src/Twig/
├── AppExtension.php                  ← Funzioni generali (url asset, helper UI)
├── ArrayExtension.php                ← Filtri per array (chunk, flatten, …)
├── AdvancedItemSearchExtension.php   ← Funzioni per ricerca avanzata
├── BreadcrumbExtension.php           ← Tag Twig per costruzione breadcrumb
├── ContextExtension.php              ← Accesso al contesto corrente nei template
├── DateExtension.php                 ← Formattazione date con timezone utente
├── DiskUsageExtension.php            ← Barra utilizzo spazio disco
├── EnumExtension.php                 ← Conversione enum → label leggibile
├── FooterExtension.php               ← Informazioni footer (versione, …)
├── IntlExtension.php                 ← Formattazione numero/valuta/lingua (intl)
├── LogExtension.php                  ← Rendering righe log nel template
└── VisibilityExtension.php           ← Helper badge visibilità
```

---

### 4.10 Security

```
src/Security/
└── UsernameOrEmailPasswordAuthenticator.php
    ← Authenticator custom: accetta login con username O email
       Usato nel firewall `main` (sessione web)
```

La sicurezza API usa il firewall `api` con `json_login` + LexikJWT (vedi §11).

---

### 4.11 Validator

```
src/Validator/
├── AvailableLocale.php / AvailableLocaleValidator.php
│   ← Verifica che il locale scelto sia supportato dall'applicazione
│
├── HasEnoughSpaceForUpload.php / HasEnoughSpaceForUploadValidator.php
│   ← Controlla che l'utente non superi la quota disco prima dell'upload
│
├── DatumLabelNotExistsInParent.php / DatumLabelNotExistsInParentValidator.php
│   ← Verifica che un campo Datum non duplichi un label già presente nel template padre
│
└── UniqueDatumLabel.php / UniqueDatumLabelValidator.php
    ← Verifica unicità label Datum all'interno dello stesso Item
```

---

### 4.12 Doctrine

```
src/Doctrine/
├── Filter/
│   ├── OwnershipFilter.php    ← Filtro globale: aggiunge WHERE owner_id = :userId
│   └── VisibilityFilter.php   ← Filtro globale: aggiunge WHERE final_visibility IN (…)
│
└── Query/
    └── AST/
        └── (Cast.php)         ← Funzione DQL CAST() custom per PostgreSQL/MySQL
```

I filtri `OwnershipFilter` e `VisibilityFilter` sono abilitati/disabilitati per richiesta in `FilterListener`.

---

### 4.13 Attribute

```
src/Attribute/
├── Upload.php                 ← Attributo PHP per mappare file upload su proprietà entità
│                                 Parametri: pathProperty, deleteProperty, maxWidth, maxHeight
└── UploadAnnotationReader.php ← Legge l'attributo Upload tramite reflection
```

`UploadListener` usa questi attributi per intercettare il persist e salvare il file fisico.

---

### 4.14 Model

DTO e oggetti di supporto non mappati su DB.

```
src/Model/
├── BatchTagger.php            ← DTO: tag da applicare in batch a una selezione di Item
├── BreadcrumbElement.php      ← VO: singolo elemento del breadcrumb (label + url)
├── ConfigurationAdmin.php     ← DTO: configurazione globale (admin)
├── Paginator.php              ← Wrapper Doctrine paginazione (classe + helper)
├── ScrapingCollection.php     ← DTO: risultato scraping per una collezione
├── ScrapingItem.php           ← DTO: risultato scraping per un oggetto
├── ScrapingWish.php           ← DTO: risultato scraping per un desiderio
└── Search/
    ├── Search.php             ← DTO: parametri ricerca semplice
    ├── SearchHistory.php      ← DTO: voce ricerca storica
    └── SearchTag.php          ← DTO: ricerca per tag
```

---

### 4.15 Http

```
src/Http/
├── CsvResponse.php    ← Response Symfony con header CSV per export
└── FileResponse.php   ← Response Symfony per download file generico
```

---

### 4.16 Monolog

```
src/Monolog/
└── DatabaseHandler.php   ← Handler Monolog personalizzato: scrive i log su DB (koi_log)
```

---

## 5. Namespace `Api\` — `api/`

Customizzazioni per **API Platform 4**.

```
api/
├── Controller/
│   └── MetricsController.php          ← GET /api/metrics — metriche Prometheus-style
│
├── Doctrine/Extension/
│   └── OwnershipExtension.php         ← Extension API Platform: filtra per owner_id
│                                         nelle collection query REST
│
├── Encoder/
│   └── MultipartDecoder.php           ← Decodifica multipart/form-data per upload API
│
├── OpenApi/
│   ├── JwtDecorator.php               ← Aggiunge sezione SecurityScheme JWT agli spec OpenAPI
│   └── MetricsDecorator.php           ← Aggiunge endpoint /api/metrics agli spec OpenAPI
│
└── Serializer/
    └── UploadedFileDenormalizer.php    ← Denormalizzatore: converte file upload in File PHP
```

**Endpoint API Platform generati automaticamente** (per ogni entità con `#[ApiResource]`):

| Metodo | Pattern | Descrizione |
|---|---|---|
| `GET` | `/api/{risorsa}` | Collection (lista paginata) |
| `POST` | `/api/{risorsa}` | Crea risorsa |
| `GET` | `/api/{risorsa}/{id}` | Item (dettaglio) |
| `PUT` | `/api/{risorsa}/{id}` | Sostituisci risorsa |
| `PATCH` | `/api/{risorsa}/{id}` | Aggiorna parzialmente |
| `DELETE` | `/api/{risorsa}/{id}` | Elimina |
| `POST` | `/api/{risorsa}/{id}/image` | Upload immagine (multipart) |

**Formati supportati:** `application/ld+json` (JSON-LD), `application/json`, `text/html`

---

## 6. Frontend — `assets/`

Il frontend è costruito con **Webpack Encore** e usa il pattern **Stimulus** (Hotwire) per il comportamento JS. Non è un'SPA: ogni pagina è renderizzata server-side da Twig.

### Controller Stimulus (`assets/controllers/`)

| Controller | Scopo |
|---|---|
| `additional-data_controller.js` | Aggiunge dinamicamente campi Datum extra |
| `additional-image-scraping_controller.js` | Aggiunge immagini aggiuntive via scraping |
| `advanced-search_controller.js` | UI ricerca avanzata (blocchi + filtri) |
| `burgermenu_controller.js` | Menu mobile hamburger |
| `cascading-checkboxes_controller.js` | Selezione a cascata checkbox |
| `choice-list-value_controller.js` | Gestione dinamica ChoiceList |
| `columns-list_controller.js` | Layout colonne lista drag-and-drop |
| `croppie_controller.js` | Crop immagini prima dell'upload |
| `csrf_protection_controller.js` | Gestione token CSRF nelle form AJAX |
| `datepicker_controller.js` | Date picker UI |
| `datum-list_controller.js` | Lista Datum riordinabile |
| `dropdown_controller.js` | Menu a tendina generico |
| `field_controller.js` | Gestione campi Template |
| `file-input_controller.js` | Input file custom con preview |
| `filter_ajax_controller.js` | Filtraggio lista via AJAX |
| `filter_controller.js` | Filtraggio lista client-side |
| `inventory_controller.js` | Gestione checkbox inventario |
| `keyboard-navigation_controller.js` | Navigazione da tastiera nelle liste |
| `lightbox_controller.js` | Lightbox per foto |
| `list-properties_controller.js` | Proprietà layout lista |
| `modal/` | Componenti modal |
| `offline-message_controller.js` | Messaggio offline (PWA) |
| `preview-video_controller.js` | Preview file video |
| `preview_controller.js` | Preview immagine prima dell'upload |
| `scraper-data-path_controller.js` | UI configurazione path scraper |
| `scraper-header_controller.js` | UI header scraper |
| `scraping_controller.js` | Esecuzione scraping e import dati |
| `search-blocks_controller.js` | Blocchi ricerca avanzata |
| `search-filter_controller.js` | Singolo filtro ricerca |
| `search-filters_controller.js` | Lista filtri ricerca |
| `search_controller.js` | Ricerca live |
| `select/` | Select custom con ricerca |
| `show-more_controller.js` | Espansione contenuto troncato |
| `show-password_controller.js` | Toggle visibilità password |
| `slider_controller.js` | Slider rating |
| `statistics/` | Grafici statistiche (Chart.js) |
| `suggestions_controller.js` | Suggerimenti auto-completamento |
| `swipe_controller.js` | Gesti swipe mobile |
| `table_controller.js` | Tabella ordinabile |
| `tabs_controller.js` | Tab UI |
| `template-field_controller.js` | Campi template dinamici |
| `textarea_controller.js` | Auto-resize textarea |
| `timepicker_controller.js` | Time picker UI |
| `toast_controller.js` | Notifiche toast |
| `tooltip_controller.js` | Tooltip UI |

---

## 7. Template — `templates/`

Tutti i template estendono `layout.html.twig` che estende `base.html.twig`.

```
templates/
├── base.html.twig              ← HTML base (head, meta, asset, sw.js)
├── layout.html.twig            ← Layout con sidebar, navbar, flash messages
└── App/
    ├── Admin/                  ← Gestione utenti, configurazione
    ├── AdvancedItemSearch/     ← UI ricerca avanzata
    ├── Album/                  ← CRUD album
    ├── ChoiceList/             ← CRUD choice list
    ├── Collection/             ← CRUD collezioni + gerarchia
    ├── Datum/                  ← Form dati custom (inline)
    ├── Field/                  ← Campi template
    ├── History/                ← Log e storico
    ├── Inventory/              ← Inventari
    ├── Item/                   ← CRUD oggetti
    ├── Loan/                   ← Prestiti
    ├── Photo/                  ← CRUD foto
    ├── Profile/                ← Profilo utente
    ├── Scraper/                ← Configurazione e UI scraper
    ├── Search/                 ← Risultati ricerca
    ├── Security/               ← Login, registrazione
    ├── Settings/               ← Impostazioni
    ├── Sign/                   ← Firme digitali
    ├── Statistics/             ← Grafici e statistiche
    ├── Tag/                    ← CRUD tag
    ├── TagCategory/            ← CRUD categorie tag
    ├── Template/               ← CRUD template
    ├── Tools/                  ← Strumenti admin
    ├── Wish/                   ← CRUD desideri
    ├── Wishlist/               ← CRUD wishlist
    └── _partials/              ← Componenti riutilizzabili (card, form fragments, …)
```

---

## 8. Configurazione — `config/`

```
config/
├── routes.yaml                    ← Route principali: controller src/, api/, logout, JWT login
├── services.yaml                  ← DI: autowire, autoconfigure, namespace App\, Api\
│
└── packages/
    ├── api_platform.yaml          ← API Platform: formati, cache, title, defaults
    ├── cache.yaml                 ← APCu cache (prod) + filesystem (dev)
    ├── csrf.yaml                  ← Protezione CSRF (abilitata)
    ├── doctrine.yaml              ← ORM: driver, filtri ownership/visibility, DQL CAST
    ├── doctrine_migrations.yaml   ← Path migrazioni (Postgresql/ e Mysql/)
    ├── framework.yaml             ← Session, secret, translator, form, validator
    ├── lexik_jwt_authentication.yaml ← JWT: chiavi pub/priv, TTL, header
    ├── monolog.yaml               ← Log: canali, handler per ambiente
    ├── nelmio_cors.yaml           ← CORS: allow_origin, methods, headers per /api/*
    ├── routing.yaml               ← UTF-8 strict mode
    ├── security.yaml              ← Firewalls, access_control, password hashers
    ├── translation.yaml           ← Default locale: en, fallback: en
    ├── twig.yaml                  ← Global twig vars, form theme
    ├── validator.yaml             ← Configurazione validator
    ├── webpack_encore.yaml        ← Manifest path per asset Webpack
    └── zenstruck_foundry.yaml     ← Factory test: reset DB tra i test
```

---

## 9. Docker e deploy

### File Docker

```
Dockerfile             ← Immagine prod: FrankenPHP + PHP 8.5 + Caddy
Dockerfile.dev         ← Immagine dev: stessa base con Xdebug + Panther
docker-compose.dist.yml ← Compose: web + db (PostgreSQL)
docker/
├── Caddyfile          ← Config Caddy prod (HTTPS auto, gzip, headers)
├── Caddyfile-dev      ← Config Caddy dev (HTTP)
├── default.conf       ← Config Nginx alternativa
├── entrypoint.sh      ← Bootstrap prod:
│                          1. Crea /uploads e symlink
│                          2. Scrive .env.local da variabili container
│                          3. Genera chiavi JWT se mancanti
│                          4. Installa dipendenze Composer (prod)
│                          5. Esegue migrazioni DB
│                          6. Cache warmup Symfony
│                          7. Genera asset Webpack
│                          8. Fix permessi
│                          9. Avvia FrankenPHP worker
└── entrypoint-dev.sh  ← Bootstrap dev (no cache warmup, asset in watch)
```

### Processo di avvio container (prod)

```
Docker start
  └─ entrypoint.sh
       ├── mkdir /uploads + symlink → public/uploads
       ├── genera .env.local (da env vars)
       ├── genera chiavi JWT RSA (se non presenti)
       ├── composer install --no-dev
       ├── php bin/console doctrine:migrations:migrate --no-interaction
       ├── php bin/console cache:warmup
       ├── npm ci && npm run build  (asset Webpack)
       └── frankenphp run (worker mode)
```

### Estensioni PHP nel container

`opcache`, `pdo_pgsql`, `pdo_mysql`, `intl`, `gd`, `zip`, `apcu`, `curl`  
Chromium + chromedriver (per test Panther)

---

## 10. Database e modello dati

### Modello entità (relazioni principali)

```
User (koi_user)
 │
 ├─[1:N]─ Collection (koi_collection)
 │          ├─[self 1:N]─ Collection (gerarchia parent/child)
 │          └─[1:N]─ Item (koi_item)
 │                    └─[1:N]─ Datum (koi_datum)
 │
 ├─[1:N]─ Album (koi_album)
 │          ├─[self 1:N]─ Album (gerarchia parent/child)
 │          └─[1:N]─ Photo (koi_photo)
 │
 ├─[1:N]─ Wishlist (koi_wishlist)
 │          ├─[self 1:N]─ Wishlist (gerarchia parent/child)
 │          └─[1:N]─ Wish (koi_wish)
 │
 ├─[1:N]─ Template (koi_template)
 │          └─[1:N]─ Field (koi_field)
 │
 ├─[1:N]─ ChoiceList (koi_choice_list)
 ├─[1:N]─ TagCategory (koi_tag_category)
 │          └─[1:N]─ Tag (koi_tag)
 │                    └─[M:N]─ Item (koi_item_tag)
 ├─[1:N]─ Inventory (koi_inventory)
 ├─[1:N]─ Loan (koi_loan) ──[N:1]── Item
 ├─[1:N]─ Log (koi_log)
 ├─[1:N]─ Scraper (koi_scraper)
 └─[1:N]─ Search (koi_search)
            ├─[1:N]─ SearchBlock (koi_search_block)
            └─       SearchFilter (koi_search_filter) ──[N:1]── SearchBlock
```

### Visibilità a cascata

Le entità `Collection`, `Album`, `Wishlist`, `Item`, `Photo`, `Wish`, `Datum` implementano la visibilità su tre livelli:

| Campo | Descrizione |
|---|---|
| `visibility` | Valore impostato dall'utente: `public` \| `internal` \| `private` |
| `parentVisibility` | Snapshot della `finalVisibility` del nodo padre |
| `finalVisibility` | `max(visibility, parentVisibility)` — usato per tutti i filtri e ACL |

La propagazione avviene tramite listener Doctrine e servizi dedicati.

### Campi comuni

| Campo | Tipo | Descrizione |
|---|---|---|
| `id` | `CHAR(36)` | UUID v4 |
| `createdAt` | `DATETIME IMMUTABLE` | Timestamp creazione |
| `updatedAt` | `DATETIME` | Timestamp ultima modifica |
| `seenCounter` | `INT` | Contatore visualizzazioni |
| `cachedValues` | `JSON` | Valori cached (contatori figli, statistiche) |

---

## 11. Sicurezza e autenticazione

### Firewall `main` — sessione web

```
Browser → POST /login
           → UsernameOrEmailPasswordAuthenticator
             → cerca User per username O email
             → verifica password (bcrypt)
             → crea sessione autenticata
             → Remember Me cookie (1 mese)

Accesso: ROLE_USER (tutte le route tranne /login, /user, /first-connection)
Admin:   ROLE_ADMIN (gerarchia: ROLE_ADMIN → ROLE_USER)
```

### Firewall `api` — JWT

```
Client → POST /api/authentication_token
          body: { "username": "…", "password": "…" }
          → json_login handler
          → LexikJWT success handler
          → Response: { "token": "<JWT>" }

Client → GET /api/collezioni
          header: Authorization: Bearer <JWT>
          → LexikJWT jwt: ~ verifica firma RSA
          → Accesso concesso
```

**Chiavi JWT:** RSA a 4096 bit (generate al primo avvio container). TTL configurabile (default: 3600s).

### Filtri Doctrine automatici

- **OwnershipFilter**: aggiunge `WHERE t.owner_id = :userId` a tutte le query entità utente. Disabilitato per admin e route pubbliche.
- **VisibilityFilter**: aggiunge `WHERE t.final_visibility IN ('public', 'internal')` per accessi non-owner.

### Route pubbliche

```
/                         ← Homepage pubblica (landing)
/login                    ← Form login
/first-connection         ← Primo setup utente
/user/*                   ← Profilo pubblico utente
/api/authentication_token ← Endpoint JWT
/api/metrics              ← Metriche (no auth)
/api, /api/docs           ← Documentazione API Platform
```

---

## 12. Flusso di una richiesta

### A. Richiesta web (Twig)

```
Browser
  │
  ▼
Caddy (web server / reverse proxy)
  │
  ▼
FrankenPHP (worker mode — PHP persistente)
  │
  ▼
Symfony Kernel
  ├─ Kernel::boot() → DI container
  ├─ EventDispatcher: kernel.request
  │   ├─ ContextListener     ← imposta locale/timezone
  │   ├─ LocaleListener      ← imposta locale Symfony
  │   ├─ FilterListener      ← abilita OwnershipFilter + VisibilityFilter
  │   └─ ActivityListener    ← aggiorna last_activity
  │
  ├─ Router → Controller
  │
  ├─ Controller
  │   ├─ requireAuth (se necessario)
  │   ├─ Service layer (query, logica, form)
  │   └─ return Response (Twig render)
  │
  ├─ EventDispatcher: kernel.response
  │   └─ TimezoneListener    ← converte datetime in risposta
  │
  └─ EventDispatcher: kernel.terminate (post-response)
      ├─ LoggableListener           ← scrive koi_log
      ├─ RefreshCachedValuesQueueListener ← aggiorna cached values
      └─ RefreshCachedValuesListener
```

### B. Richiesta API Platform

```
Client (HTTP)
  │
  ▼
FrankenPHP → Symfony Kernel
  │
  ├─ JWT Authenticator (verifica Bearer token)
  │
  ├─ API Platform Provider
  │   ├─ OwnershipExtension (aggiunge WHERE owner_id)
  │   ├─ Doctrine ORM query
  │   └─ Serializer (JSON-LD / JSON)
  │
  └─ Response JSON
```

---

## 13. Test

### Struttura

```
tests/
├── ApiTestCase.php          ← Base per test API: client autenticato JWT, helper assert
├── AppTestCase.php          ← Base per test web: browser Symfony, login, helper form
│
├── Api/                     ← Test HTTP per ogni risorsa API Platform
│   ├── Album/
│   ├── ChoiceList/
│   ├── Collection/
│   ├── Datum/
│   ├── Field/
│   ├── Inventory/
│   ├── Item/
│   ├── Loan/
│   ├── Log/
│   ├── Photo/
│   ├── Security/
│   ├── Tag/
│   ├── TagCategory/
│   ├── Template/
│   ├── User/
│   ├── Wish/
│   ├── Wishlist/
│   ├── DocumentationTest.php  ← Verifica accessibilità docs OpenAPI
│   ├── MetricsTest.php
│   └── UploadTest.php
│
├── App/                     ← Test funzionali web (BrowserKit)
│   ├── Admin/
│   ├── Album/
│   ├── Collection/
│   ├── Datum/
│   ├── Item/
│   ├── Photo/
│   ├── Scraper/
│   ├── Security/
│   ├── Visibility/
│   ├── Wish/
│   ├── Wishlist/
│   ├── AdvancedItemSearchTest.php
│   ├── HistoryTest.php
│   ├── InventoryTest.php
│   ├── LoanTest.php
│   ├── ProfileTest.php
│   ├── SearchTest.php
│   ├── SettingsTest.php
│   ├── StatisticsTest.php
│   ├── TagCategoryTest.php
│   ├── TagTest.php
│   ├── TemplateTest.php
│   ├── ToolsTest.php
│   └── …
│
├── Command/                 ← Test comandi CLI
│
└── Factory/                 ← Zenstruck Foundry (23 factory, una per entità)
    ├── UserFactory.php
    ├── CollectionFactory.php
    ├── ItemFactory.php
    └── …
```

### Comandi

```bash
# Esegui tutti i test
composer test:phpunit

# Esecuzione parallela
composer test:paratest

# Con code coverage
composer test:coverage
```

**Configurazione DB test:** `dama_doctrine_test_bundle` — ogni test gira in transazione rollback-at-end.

---

## 14. Internazionalizzazione

Supporto **14 lingue** tramite Symfony Translator:

| Codice | Lingua |
|---|---|
| `en` | Inglese (default) |
| `it` | Italiano |
| `fr` | Francese |
| `de` | Tedesco |
| `es` | Spagnolo |
| `pt` | Portoghese |
| `pt_BR` | Portoghese (Brasile) |
| `nl` | Olandese |
| `da` | Danese |
| `pl` | Polacco |
| `ru` | Russo |
| `uk` | Ucraino |
| `tr` | Turco |
| `zh` | Cinese |

Le traduzioni sono in formato YAML/XLIFF nella cartella `translations/`. Il locale è impostato per ogni richiesta in base alle preferenze dell'utente (`User.locale`).

---

## 15. Migrazioni DB

Le migrazioni Doctrine si trovano in `migrations/Postgresql/` (65+ file dal 2018) e `migrations/Mysql/`.  
Ogni file è una classe PHP `VersionYYYYMMDDHHMMSS` con metodi `up()` e `down()`.

Esecuzione:
```bash
php bin/console doctrine:migrations:migrate
```

---

## 16. Variabili d'ambiente

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `APP_ENV` | ✅ | `prod` \| `dev` \| `test` |
| `APP_SECRET` | ✅ | Secret Symfony (CSRF, sessioni) |
| `DB_DRIVER` | ✅ | `pdo_pgsql` \| `pdo_mysql` |
| `DB_HOST` | ✅ | Host database |
| `DB_PORT` | ✅ | Porta database |
| `DB_NAME` | ✅ | Nome database |
| `DB_USER` | ✅ | Utente database |
| `DB_PASSWORD` | ✅ | Password database |
| `DB_VERSION` | ✅ | Versione server DB (es. `16`) |
| `JWT_SECRET_KEY` | ✅ | Path chiave privata RSA JWT |
| `JWT_PUBLIC_KEY` | ✅ | Path chiave pubblica RSA JWT |
| `JWT_PASSPHRASE` | ✅ | Passphrase chiave JWT |
| `APP_DEBUG` | ❌ | `1` \| `0` (default: `0` in prod) |
| `PUID` | ❌ | UID processo PHP (default: `1001`) |
| `PGID` | ❌ | GID processo PHP (default: `1001`) |
| `CORS_ALLOW_ORIGIN` | ❌ | Origin permessa per CORS API (default: `^https?://localhost`) |

---

*Per la documentazione dell'architettura Next.js (v2.x) vedi [`next/ARCHITECTURE.md`](./next/ARCHITECTURE.md).*  
*Per il piano di migrazione vedi [`AGENTS.md`](./AGENTS.md).*
