# Lente INCI (beta)

Web app per analizzare gli ingredienti (INCI) dei cosmetici. Funziona dal browser sia su computer sia su telefono e si può **installare sulla schermata Home** come un'app (PWA), senza App Store né TestFlight.

## Cosa fa

- **Ricerca** per nome, marca o codice a barre nel catalogo (Open Beauty Facts) e nei prodotti aggiunti a mano.
- **Codice a barre dal vivo** con la fotocamera (lettore nativo su Android/Chrome, ZXing su iPhone). Se il codice non è nel database, l'app lo cerca **in tempo reale su Open Beauty Facts** e lo salva.
- **Analisi INCI** con voto su 20, scheda di ogni ingrediente e segnalazioni (siliconi, solfati, allergeni UE, profumo, alcol, PEG, derivati del petrolio, conservanti che rilasciano formaldeide, sostanze vietate in UE).
- **Lettura dell'INCI da foto** dell'etichetta con Claude (facoltativa, serve una chiave API Anthropic).
- **Foto dei prodotti**: quelle del catalogo, oppure scattate da te e salvate in WebP a 480 px (circa 20–40 KB).
- **Profilo personale** con gli ingredienti da evitare, **alternative migliori**, **confronto** fino a 3 prodotti, **preferiti** e **cronologia**, sincronizzati tra i dispositivi.

## Tecnologie

| Parte | Scelta |
|---|---|
| Linguaggio | TypeScript, lo stesso per backend e frontend |
| Framework | Next.js 15 (App Router): pagine React e API nello stesso progetto |
| Database | PostgreSQL con ricerca per trigrammi (`pg_trgm`) |
| Immagini | `sharp` per ridimensionare e convertire in WebP |
| Codici a barre | `BarcodeDetector` del browser, con ZXing come alternativa |
| Validazione | Zod |

Il motore di analisi (`src/lib/inci/engine.ts`) è lo stesso sul server, dove calcola i voti salvati nel database, e nel browser, dove mostra l'analisi in tempo reale. Il dizionario contiene circa 580 ingredienti (`src/lib/inci/ingredients.json`), con regole aggiuntive per famiglie (oli vegetali, estratti, siliconi, PEG, coloranti CI…).

## Avvio in locale

Servono Node.js 20.12 o superiore (consigliato il 22) e, solo per il database locale, Docker.

```bash
cp .env.example .env
docker compose up -d          # PostgreSQL su localhost:5432
npm install
npm run db:migrate            # crea le tabelle
npm run db:seed               # 21 prodotti verificati a mano
npm run import:obf            # scarica e importa Open Beauty Facts (~64.000 prodotti)
npm run dev                   # http://localhost:3000
```

Se il download automatico non funziona, scarica a mano il file `en.openbeautyfacts.org.products.csv.gz` (o il `.csv`) e lancia:

```bash
npm run import:obf -- --file percorso/del/file.csv.gz
```

Con `--only-inci` importi solo i prodotti che hanno la lista ingredienti. Senza, vengono importati anche quelli senza INCI: la scansione li riconosce e l'app ti propone di completarli fotografando l'etichetta.

Per provare l'app dal telefono in locale, la fotocamera richiede https: usa `npx next dev --experimental-https` oppure pubblica online come indicato sotto.

## Pubblicazione online (gratuita per la beta)

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

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm run typecheck` | Controllo dei tipi |
| `npm test` | Test del motore di analisi |
| `npm run db:migrate` | Applica i file in `sql/` |
| `npm run db:seed` | Inserisce i prodotti di `data/seed-products.json` |
| `npm run import:obf` | Importa o aggiorna il catalogo Open Beauty Facts |
| `npm run rescore` | Ricalcola tutti i voti dopo una modifica al dizionario |

## Come viene calcolato il voto

Ogni ingrediente ha un giudizio da 0 (da evitare) a 4 (ottimo), basato su sicurezza, tollerabilità e utilità; i riferimenti sono il regolamento cosmetico UE 1223/2009 e i pareri del comitato scientifico europeo SCCS. Gli ingredienti in cima alla lista pesano di più. Nei prodotti da risciacquare, profumi, allergeni, solfati e irritanti valgono un gradino in più. Gli ingredienti vietati o che rilasciano formaldeide abbassano il voto anche se sono in fondo. Sotto il 70% di ingredienti riconosciuti il voto è segnalato come poco affidabile. Il voto misura la qualità degli ingredienti, non l'efficacia del prodotto.

## Struttura

```
src/
  app/              pagine e API (Next.js App Router)
    api/            prodotti, codice a barre, foto, profilo, lettura da foto, accesso
  components/       interfaccia (scheda prodotto, analisi, lettore codici…)
  lib/
    inci/           motore di analisi e dizionario ingredienti
    products.ts     accesso ai prodotti nel database
    obf.ts          ricerca in tempo reale su Open Beauty Facts
sql/                schema del database
scripts/            migrazione, dati iniziali, importazione catalogo
tests/              test del motore
```

## Dati e licenze

Il catalogo proviene da [Open Beauty Facts](https://world.openbeautyfacts.org), con dati aperti sotto licenza [ODbL](https://opendatacommons.org/licenses/odbl/1-0/). I dati sono inseriti da volontari e possono essere incompleti o riferiti a vecchie formule: in caso di dubbio vale l'etichetta.

## Prossimi passi

- Account utente veri, al posto della password condivisa della beta.
- Invio a Open Beauty Facts degli INCI letti dalle foto, così il catalogo cresce anche per gli altri.
- Notifiche quando un prodotto preferito cambia formula.
- Pubblicazione sugli store con un involucro nativo (Capacitor), quando la beta sarà stabile.
