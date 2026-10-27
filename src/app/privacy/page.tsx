import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy e IA" };

// Dati del titolare: vanno impostati nelle variabili d'ambiente prima del lancio pubblico.
const OWNER = process.env.LEGAL_OWNER || "[Titolare del trattamento: nome o ragione sociale da completare]";
const EMAIL = process.env.LEGAL_EMAIL || "[email di contatto da completare]";
const UPDATED = "27 ottobre 2026";

export default function PrivacyPage() {
  return (
    <article className="view legal">
      <header className="panel">
        <h2 className="vh">Privacy e uso dell&apos;IA</h2>
        <p className="hint">Informativa ai sensi degli artt. 13–14 del Regolamento (UE) 2016/679 (GDPR) e informazioni di trasparenza ai sensi del Regolamento (UE) 2024/1689 (AI Act). Aggiornata al {UPDATED}.</p>
        <div className="tldr">
          <b>In breve</b>
          <ul>
            <li>Non ti chiediamo nome, email o account. Il tuo profilo è legato solo a un codice casuale.</li>
            <li>Nessuna pubblicità, nessun tracciamento, nessun cookie di profilazione.</li>
            <li>L&apos;IA serve solo a trascrivere la foto di un&apos;etichetta, se lo chiedi tu. Il voto dei prodotti non è calcolato dall&apos;IA.</li>
            <li>Puoi scaricare o cancellare i tuoi dati in ogni momento dal <Link href="/profilo#dati">Profilo</Link>.</li>
          </ul>
        </div>
      </header>

      <section className="panel">
        <h3 className="sh">Chi tratta i dati</h3>
        <p>Titolare del trattamento: {OWNER}. Contatto per la privacy e per esercitare i tuoi diritti: {EMAIL}.</p>
      </section>

      <section className="panel">
        <h3 className="sh">Quali dati e perché</h3>
        <dl className="defs">
          <dt>Profilo anonimo</dt>
          <dd>Preferiti, prodotti visti di recente e ingredienti da evitare. Sono legati a un identificativo casuale salvato in un cookie tecnico, senza alcun dato che ti identifichi.
            Gli ingredienti da evitare potrebbero far intuire informazioni sulla salute (per esempio un&apos;allergia): li usiamo solo per segnalarti i prodotti non adatti, non li colleghiamo a nessuna identità e non li comunichiamo a nessuno.
            <br /><i>Base giuridica:</i> esecuzione del servizio che richiedi (art. 6.1.b GDPR). <i>Conservazione:</i> fino a quando lo cancelli, e comunque non oltre 12 mesi dall&apos;ultimo utilizzo.</dd>
          <dt>Foto dei prodotti che carichi</dt>
          <dd>Diventano visibili a tutti gli utenti nella scheda del prodotto. Alla ricezione le ricomprimiamo eliminando i metadati, compresa la posizione GPS. Inquadra solo il prodotto, senza persone o documenti.
            <br /><i>Base giuridica:</i> esecuzione del servizio richiesto. <i>Conservazione:</i> finché la scheda del prodotto esiste o finché ne chiedi la rimozione.</dd>
          <dt>Foto delle etichette per la trascrizione</dt>
          <dd>Vedi la sezione sull&apos;IA qui sotto. Non le conserviamo.</dd>
          <dt>Dati tecnici</dt>
          <dd>Il server riceve l&apos;indirizzo IP e i dati tecnici di ogni richiesta, necessari a far funzionare il sito e a proteggerlo; non li usiamo per altro.</dd>
        </dl>
      </section>

      <section className="panel" id="ia">
        <h3 className="sh">Uso dell&apos;intelligenza artificiale</h3>
        <ul>
          <li><b>Dove:</b> solo nella funzione &quot;Leggi l&apos;INCI da una foto&quot;. Quando la usi, la foto viene inviata a Claude, un modello di IA di Anthropic, con l&apos;unico scopo di trascrivere il testo dell&apos;etichetta. Ogni volta te lo segnaliamo accanto al pulsante.</li>
          <li><b>Risultato:</b> il testo trascritto è generato dall&apos;IA e può contenere errori. Te lo indichiamo sempre e puoi correggerlo prima di usarlo.</li>
          <li><b>Conservazione:</b> noi non salviamo la foto. Anthropic la tratta per nostro conto come responsabile del trattamento, secondo i propri termini commerciali, che escludono l&apos;uso dei dati inviati tramite API per addestrare i modelli.</li>
          <li><b>Cosa non fa l&apos;IA:</b> non calcola il voto, non giudica gli ingredienti e non prende decisioni su di te. Il voto nasce da regole fisse e pubbliche, spiegate nel <Link href="/profilo#metodo">metodo di calcolo</Link>.</li>
        </ul>
      </section>

      <section className="panel">
        <h3 className="sh">Cookie e memoria del dispositivo</h3>
        <p>Usiamo solo cookie tecnici, necessari al funzionamento, per cui non serve il consenso:</p>
        <ul>
          <li><code>li_pid</code>: collega il dispositivo al tuo profilo anonimo. Dura 12 mesi.</li>
          <li><code>li_session</code>: solo durante la beta privata, ricorda che hai inserito la password di accesso.</li>
        </ul>
        <p>Il browser conserva inoltre una copia del profilo e una cache delle pagine, per far funzionare l&apos;app anche con poca connessione. Cancellando i dati del sito dal browser le elimini.</p>
      </section>

      <section className="panel">
        <h3 className="sh">Fornitori e trasferimenti</h3>
        <ul>
          <li><b>Database:</b> Neon, server nell&apos;Unione europea (Francoforte).</li>
          <li><b>Hosting dell&apos;app:</b> il fornitore di hosting su cui è pubblicata l&apos;app.</li>
          <li><b>Trascrizione con IA:</b> Anthropic. Il trattamento può avvenire negli Stati Uniti, con le garanzie previste dal capo V del GDPR.</li>
          <li><b>Catalogo prodotti:</b> Open Beauty Facts (dati aperti, licenza ODbL). Le immagini passano dal nostro server: il tuo browser non contatta siti esterni, nemmeno per i caratteri tipografici.</li>
        </ul>
      </section>

      <section className="panel">
        <h3 className="sh">I tuoi diritti</h3>
        <p>Puoi accedere ai tuoi dati, ottenerne una copia (portabilità), correggerli, cancellarli, limitarne il trattamento od opporti. Esportazione e cancellazione sono immediate dal <Link href="/profilo#dati">Profilo</Link>; per il resto scrivi a {EMAIL}.
          Se ritieni che il trattamento violi il GDPR puoi presentare reclamo al <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">Garante per la protezione dei dati personali</a>.</p>
      </section>
    </article>
  );
}
