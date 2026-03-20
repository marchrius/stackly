# BUGS.md

Registro dei bug noti per il progetto `next/`.

## Regola operativa

- Ogni volta che viene individuato un bug funzionale, di UX, di build o di integrazione nel progetto `next/`, va aggiunto qui subito.
- Ogni entry deve includere almeno: stato, area coinvolta, descrizione del problema, comportamento atteso e note utili per la riproduzione o la diagnosi.
- Quando un bug viene risolto, la relativa entry va aggiornata esplicitando la correzione o lo stato finale.

---

## Bug aperti

### 1. Tema utente non applicato dopo il salvataggio delle preferenze

- Stato: aperto
- Area: `apps/web` · impostazioni utente · theming
- Gravità: alta

**Descrizione**

La selezione del tema nelle impostazioni viene salvata, ma il tema scelto non viene applicato correttamente all'interfaccia dopo il salvataggio delle preferenze.

**Comportamento atteso**

Dopo aver selezionato un tema e salvato le preferenze, l'interfaccia deve aggiornarsi usando il tema scelto dall'utente.

**Comportamento osservato**

Il tema continua a non cambiare in modo effettivo dopo il salvataggio.

**Note tecniche**

- Area investigata: `apps/web/components/settings/*`, `apps/web/app/layout.tsx`, `apps/web/lib/actions/user.actions.ts`, `apps/web/lib/theme/themes.ts`, `apps/web/app/globals.css`
- Sono già stati tentati fix lato cookie/layout/sync client, ma il bug risulta ancora presente secondo verifica utente.
