# Lente INCI (beta)

[![CI](https://github.com/MarcoPesare/lente-inci/actions/workflows/ci.yml/badge.svg)](https://github.com/MarcoPesare/lente-inci/actions/workflows/ci.yml)

Web app per analizzare gli ingredienti (INCI) dei cosmetici. Funziona dal browser sia su computer sia su telefono e si può **installare sulla schermata Home** come un'app (PWA), senza App Store né TestFlight.

<!-- screenshot -->

## Cosa fa

- **Ricerca** per nome, marca o codice a barre nel catalogo (Open Beauty Facts, circa 42.000 prodotti) e nei prodotti aggiunti a mano.
- **Codice a barre dal vivo** con la fotocamera (lettore nativo su Android/Chrome, ZXing su iPhone). Se il codice non è nel database, l'app lo cerca **in tempo reale su Open Beauty Facts** e lo salva.
- **Analisi INCI** con voto da 0 a 100, scheda di ogni ingrediente e segnalazioni (siliconi, solfati, allergeni UE, profumo, alcol, PEG, derivati del petrolio, conservanti che rilasciano formaldeide, sostanze vietate in UE).
- **Lettura dell'INCI da foto** dell'etichetta con Claude (facoltativa, serve una chiave API Anthropic).
- **Foto dei prodotti**: quelle del catalogo, oppure scattate da te e salvate in WebP a 480 px (circa 20–40 KB). Le miniature sono normalizzate dal server: quadrate, con il prodotto intero.
- **Profilo personale** con gli ingredienti da evitare, **alternative migliori**, **confronto** fino a 3 prodotti, **preferiti** e **cronologia**. Il profilo è anonimo e vale per un solo dispositivo: non viene sincronizzato tra dispositivi diversi.

## Stato del progetto (beta)

### Funziona

- Ricerca per nome, marca e codice a barre su circa 42.000 prodotti (Open Beauty Facts) e su quelli aggiunti a mano.
- Scansione del codice a barre dalla fotocamera, con ricerca in tempo reale su Open Beauty Facts per i codici mancanti.
- Analisi INCI con voto da 0 a 100, scheda di ogni ingrediente e segnalazioni (siliconi, solfati, allergeni UE…).
- Preferiti, cronologia, ingredienti da evitare, confronto fino a 3 prodotti e alternative migliori.
- App installabile (PWA) e utilizzabile da telefono e da computer.
- Profilo anonimo per dispositivo, con esportazione e cancellazione dei dati.

### Limiti noti

- Nessun account utente: l'accesso alla beta è protetto da una password condivisa e il profilo non si sincronizza tra dispositivi.
- Chiunque abbia accesso all'app può modificare o cancellare i prodotti del catalogo, e non ci sono limiti di frequenza sulle richieste: per questo non esiste ancora una demo pubblica.
- Il voto si basa su un dizionario di circa 580 ingredienti curato a mano: è un'indicazione, non un parere medico.
- La lettura dell'INCI da foto richiede una chiave API Anthropic. Senza, il resto dell'app funziona normalmente e il pulsante risponde che la funzione non è configurata.
- I test automatici coprono solo il motore di analisi.

### In sviluppo

Lavori pianificati per le prossime versioni:

- Account utente e ruoli, con modifiche al catalogo riservate ai moderatori.
- Foto da catalogo e link d'acquisto tramite feed di affiliazione.
- Invio a Open Beauty Facts degli INCI letti dalle foto, così il catalogo cresce anche per gli altri.

## Tecnologie

| Parte | Scelta |
|---|---|
| Linguaggio | TypeScript, lo stesso per backend e frontend |
| Framework | Next.js 15 (App Router): pagine React e API nello stesso progetto |
| Database | PostgreSQL con ricerca per trigrammi (`pg_trgm`) |
| Immagini | `sharp` per ridimensionare, normalizzare e convertire in WebP |
| Codici a barre | `BarcodeDetector` del browser, con ZXing come alternativa |
| Validazione | Zod |

Il motore di analisi (`src/lib/inci/engine.ts`) è lo stesso sul server, dove calcola i voti salvati nel database, e nel browser, dove mostra l'analisi in tempo reale. Il dizionario contiene circa 580 ingredienti (`src/lib/inci/ingredients.json`), con regole aggiuntive per famiglie (oli vegetali, estratti, siliconi, PEG, coloranti CI…).

## Avvio in locale

Servono **Node.js 24 o superiore** (la versione è indicata anche in `.nvmrc`: con nvm basta `nvm use`) e, solo per il database locale, **Docker**.

```bash
cp .env.example .env
docker compose up -d          # PostgreSQL su localhost:5432
npm install
npm run db:migrate            # crea le tabelle
npm run db:seed               # 21 prodotti verificati a mano
npm run import:obf            # scarica e importa Open Beauty Facts (circa 42.000 prodotti)
npm run dev                   # http://localhost:3000
```

**La porta 5432 deve essere libera.** Se sul tuo computer c'è già un altro PostgreSQL in ascolto, `docker compose up` non riesce a usarla. In quel caso cambia la porta esterna in `docker-compose.yml` (per esempio `"5433:5432"`) e lo stesso numero in `DATABASE_URL` nel file `.env` (`postgres://lente:lente@localhost:5433/lente`).

Se il download automatico non funziona, scarica a mano il file `en.openbeautyfacts.org.products.csv.gz` (o il `.csv`) e lancia:

```bash
npm run import:obf -- --file percorso/del/file.csv.gz
```

Con `--only-inci` importi solo i prodotti che hanno la lista ingredienti. Senza, vengono importati anche quelli senza INCI: la scansione li riconosce e l'app ti propone di completarli fotografando l'etichetta.

Per provare l'app dal telefono in locale, la fotocamera richiede https: usa `npx next dev --experimental-https` oppure pubblica online come indicato sotto.

## Pubblicazione online (beta privata)

> Le scritture sul catalogo non sono ancora protette da account e ruoli (vedi *Limiti noti*): pubblica l'app solo con `APP_PASSWORD` impostata.

1. Crea un database PostgreSQL gratuito su [Neon](https://neon.tech) o [Supabase](https://supabase.com) e copia la stringa di connessione.
2. Su [Vercel](https://vercel.com) importa questo repository.
3. In *Settings → Environment Variables* imposta `DATABASE_URL`, `APP_PASSWORD`, `APP_SECRET` e, se vuoi la lettura da foto, `ANTHROPIC_API_KEY`.
4. Dal tuo computer, con `DATABASE_URL` che punta al database online, esegui `npm run db:migrate`, `npm run db:seed` e `npm run import:obf`.
5. Apri l'indirizzo che ti dà Vercel.

### Installarla sul telefono

- **iPhone (Safari):** tasto Condividi, poi *Aggiungi alla schermata Home*.
- **Android (Chrome):** menu ⋮, poi *Installa app*.

## Variabili d'ambiente

| Nome | A cosa serve |
|---|---|
| `DATABASE_URL` | Connessione a PostgreSQL |
| `APP_PASSWORD` | Se impostata, l'app chiede una password: tiene privata la beta |
| `APP_SECRET` | Stringa casuale per firmare il cookie di accesso |
| `ANTHROPIC_API_KEY` | Abilita la lettura dell'INCI da foto |
| `OCR_MODEL` | Modello usato per la lettura (predefinito `claude-sonnet-5-5`) |
| `OBF_LIVE_LOOKUP` | `false` per disattivare la ricerca in tempo reale su Open Beauty Facts |
| `OBF_USER_AGENT` | Identificazione richiesta da Open Beauty Facts: metti un tuo contatto |
| `LEGAL_OWNER` | Titolare del trattamento, mostrato nella pagina /privacy (letto in fase di build) |
| `LEGAL_EMAIL` | Contatto per la privacy e i diritti GDPR, mostrato nella pagina /privacy (letto in fase di build) |

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm run lint` | Controllo del codice con ESLint (configurazione standard di Next.js) |
| `npm run typecheck` | Controllo dei tipi |
| `npm test` | Test del motore di analisi |
| `npm run db:migrate` | Applica i file in `sql/` |
| `npm run db:seed` | Inserisce i prodotti di `data/seed-products.json` |
| `npm run import:obf` | Importa o aggiorna il catalogo Open Beauty Facts |
| `npm run rescore` | Ricalcola tutti i voti dopo una modifica al dizionario o al motore |

## Come viene calcolato il voto

Il voto va da 0 a 100 e nasce da regole fisse, non da un'intelligenza artificiale. Ogni ingrediente ha un giudizio su cinque livelli, da "da evitare" a "ottimo", basato su sicurezza, tollerabilità e utilità; i riferimenti sono il regolamento cosmetico UE 1223/2009 e i pareri del comitato scientifico europeo SCCS. Gli ingredienti in cima alla lista pesano di più. Nei prodotti da risciacquare, profumi, allergeni, solfati e irritanti valgono un gradino in più. Gli ingredienti vietati o che rilasciano formaldeide abbassano il voto anche se sono in fondo. Sotto il 70% di ingredienti riconosciuti il voto è segnalato come poco affidabile, sotto il 50% non entra in classifica. Il voto misura la qualità degli ingredienti, non l'efficacia del prodotto.

## Struttura

```
src/
  app/              pagine e API (Next.js App Router)
    api/            prodotti, codice a barre, foto, miniature, profilo, lettura da foto, accesso
  components/       interfaccia (scheda prodotto, analisi, lettore codici…)
  lib/
    inci/           motore di analisi e dizionario ingredienti
    products.ts     accesso ai prodotti nel database
    image.ts        normalizzazione delle miniature
    obf.ts          ricerca in tempo reale su Open Beauty Facts
sql/                schema del database
scripts/            migrazione, dati iniziali, importazione catalogo
tests/              test del motore
```

## Come è stato sviluppato

Il progetto è ideato e diretto da me: requisiti, scelte di architettura, revisione del codice e test sono a mio carico. Gran parte del codice è stata scritta con Claude Code (Anthropic) sotto la mia supervisione, a partire dalle mie indicazioni e con le mie verifiche a ogni passo.

## Fonti dei dati e licenze

- **Catalogo prodotti:** dati di [Open Beauty Facts](https://world.openbeautyfacts.org) sotto [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/); i singoli contenuti sotto [Database Contents License 1.0](https://opendatacommons.org/licenses/dbcl/1-0/). © Open Beauty Facts contributors. I dati sono inseriti da volontari e possono essere incompleti o riferiti a vecchie formule: in caso di dubbio vale l'etichetta.
- **Foto dei prodotti del catalogo:** © Open Beauty Facts contributors, sotto [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/deed.it) (CC BY-SA 3.0), come indicato nelle [condizioni d'uso di Open Beauty Facts](https://world.openbeautyfacts.org/terms-of-use). Le miniature mostrate dall'app sono versioni ritagliate e ridimensionate, distribuite con la stessa licenza.
- **Correzioni degli utenti al catalogo:** le modifiche ai prodotti di Open Beauty Facts fatte nell'app sono rilasciate sotto la stessa licenza ODbL 1.0.
- **Prodotti di esempio** (`data/seed-products.json`): liste INCI trascritte dalle fonti indicate nel campo `source` di ciascun prodotto (schede prodotto dm, Skinsort, INCIDecoder).
- **Dizionario degli ingredienti** (`src/lib/inci/ingredients.json`): contenuto originale del progetto. I giudizi sono nostri e non provengono da una fonte ufficiale; è rilasciato sotto [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/deed.it) (CC BY 4.0).
- **Font:** Geist (Vercel), sotto SIL Open Font License 1.1, incluso tramite il pacchetto npm `geist`.
- **Codice:** licenza [MIT](LICENSE). La licenza MIT copre **solo il codice** del progetto, non i dati, le foto e il dizionario elencati sopra, che restano sotto le rispettive licenze.
