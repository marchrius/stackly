# BUGS.md

Registro dei bug noti per il progetto `next/`.

## Regola operativa

- Ogni volta che viene individuato un bug funzionale, di UX, di build o di integrazione nel progetto `next/`, va aggiunto qui subito.
- Ogni entry deve includere almeno: stato, area coinvolta, descrizione del problema, comportamento atteso e note utili per la riproduzione o la diagnosi.
- Quando un bug viene risolto, la relativa entry va aggiornata esplicitando la correzione o lo stato finale.

---

## Bug aperti

### 1. Tema utente non applicato dopo il salvataggio delle preferenze

- Stato: in verifica
- Area: `apps/web` · impostazioni utente · theming
- Gravità: alta

**Descrizione**

La selezione del tema nelle impostazioni veniva salvata, ma il tema scelto non veniva applicato correttamente all'interfaccia dopo il salvataggio delle preferenze.

**Comportamento atteso**

Dopo aver selezionato un tema e salvato le preferenze, l'interfaccia deve aggiornarsi usando il tema scelto dall'utente.

**Comportamento osservato**

Il tema continuava a non cambiare in modo effettivo dopo il salvataggio.

**Note tecniche**

- Correzioni applicate in `apps/web/components/settings/SettingsForm.tsx`, `apps/web/app/layout.tsx`, `apps/web/lib/actions/user.actions.ts`, `apps/web/lib/theme/themes.ts`, `apps/web/app/globals.css`, `packages/ui/src/components/{badge,dialog}.tsx`, `apps/web/components/settings/ThemePicker.tsx`, `apps/web/app/(dashboard)/{page.tsx,history/page.tsx}`, `apps/web/components/{shared/SearchResults.tsx,statistics/StatisticsCharts.tsx,wishlists/WishlistDetail.tsx}`
- Il flusso non usa piu' cookie per il tema: il server decide il tema leggendo la preferenza persistita dell'utente e il client salva poi forza un reload completo del layout.
- Ultimo intervento: semplificata l'applicazione del tema sul root document (`html.theme-*`), aggiunto `color-scheme`, verificato il supporto Tailwind alle CSS variables e sostituiti diversi colori hardcoded che bypassavano i token del tema.

### 2. Lo schema Prisma utente non esponeva la display configuration dell'indice collezioni

- Stato: risolto
- Area: `packages/db` · schema Prisma · collections index
- Gravità: media

**Descrizione**

Il legacy salva l'indice collezioni tramite `User.collectionsDisplayConfiguration`, ma il modello Prisma del progetto `next/` non esponeva ancora la relativa relazione utente.

**Comportamento atteso**

Il progetto `next/` deve poter leggere e persistere la display configuration dell'utente per la pagina `/collections`, così la lista collezioni può ripristinare modalità griglia/lista, ordinamento e colonne.

**Comportamento osservato**

`schema.prisma` esponeva `DisplayConfiguration` per collection children/items e search, ma non la relazione `User.collectionsDisplayConfiguration`, quindi la schermata indice collezioni non poteva offrire né consumare le opzioni di visualizzazione legacy.

**Note tecniche**

- Correzione applicata in `packages/db/prisma/schema.prisma`, `apps/web/lib/actions/user.actions.ts`, `apps/web/app/(dashboard)/collections/page.tsx`, `apps/web/app/(dashboard)/collections/edit/page.tsx`, `apps/web/components/collections/CollectionGrid.tsx`, `apps/web/components/collections/CollectionList.tsx`
- Aggiunta copertura regressiva in `apps/web/test/lib/collection-index-display.test.ts`

## Bug risolti

### 3. Lo schema Prisma delle collection non esponeva `scrapedFromUrl`

- Stato: risolto
- Area: `packages/db` · schema Prisma · collection form scraping
- Gravità: media

**Descrizione**

Il legacy espone `Collection.scrapedFromUrl` e il form collezione usa questo dato nel workflow di scraping/import, ma il modello Prisma del progetto `next/` non includeva ancora la colonna.

**Comportamento atteso**

Il modello `Collection` del progetto `next/` deve leggere e persistere anche `scrapedFromUrl`, così il form può salvare l'URL sorgente dello scrape e mantenere la parità con il legacy.

**Comportamento osservato**

`schema.prisma` includeva `scrapedFromUrl` per `Item` ma non per `Collection`, quindi il nuovo form collezione non poteva completare correttamente il flow di scraping/import.

**Note tecniche**

- Correzione applicata in `packages/db/prisma/schema.prisma`, `apps/web/lib/actions/collection.actions.ts`, `apps/web/app/api/collections/route.ts`, `apps/web/app/api/collections/[id]/route.ts`, `apps/web/components/collections/CollectionForm.tsx`
- Aggiunti `apps/web/app/api/scrapers/collection-preview/route.ts`, `apps/web/lib/server/scraper-preview.ts` e copertura regressiva in `apps/web/test/lib/scraper-preview.test.ts`

---

### 4. La valuta dei datum `price` degli item non veniva persistita

- Stato: risolto
- Area: `apps/web` · item form · datum persistence · item API
- Gravità: media

**Descrizione**

I campi custom di tipo `price` negli item salvavano il valore numerico ma non la valuta associata, quindi la parità con il comportamento legacy restava incompleta.

**Comportamento atteso**

Quando un utente compila o modifica un datum `price`, la valuta selezionata deve viaggiare dal form alla persistenza e tornare correttamente nelle pagine dettaglio e nelle API item.

**Comportamento osservato**

`Datum.currency` rimaneva `null` perché il payload item non la serializzava/persistiva, e il dettaglio item mostrava `USD` come fallback implicito anche in assenza di una valuta reale.

**Note tecniche**

- Correzione applicata in `apps/web/components/items/ItemForm.tsx`, `apps/web/lib/actions/item.actions.ts`, `apps/web/lib/item-persistence.ts`, `apps/web/app/api/items/route.ts`, `apps/web/app/api/items/[id]/route.ts`, `apps/web/components/items/ItemDetail.tsx`
- Aggiunta copertura regressiva in `apps/web/test/lib/item-persistence.test.ts` e aggiornato `apps/web/test/app/api/items.route.test.ts`
