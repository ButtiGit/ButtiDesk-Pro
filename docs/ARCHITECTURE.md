# ButtiDesk-Pro — Architettura e contratto dati (proposta)

**Ultima analisi:** 26 ottobre 2026. Fonte: `ButtiGit/pitmetric@8ef8f780ec90bfb7c2751fd0901bd0e686041e20`, non accesso diretto al database di produzione.

## Stato di implementazione della base autonoma

Al 26/10/2026 la Fase 1 è implementata: Laravel 13 + PHP 8.4, Inertia 3/React 19/TypeScript/Tailwind 4, tema blu con font Instrument Sans locali, SQLite per l’avvio leggero e Compose PostgreSQL 16. Sono presenti quattro nuove tabelle (`desk_contacts`, `desk_tickets`, `desk_worklogs`, `desk_appointments`) con FK composite di workspace e global scope obbligatorio. Le due tabelle per posta/feed restano future.

L’identità è fornita da un `IdentityProvider` dimostrativo, consentito esclusivamente in `local/testing` e con flag esplicito. Due workspace e due profili sintetici permettono di verificare isolamento e permessi. L’applicazione non copia utenti/password né contatta PitMetric. Il collegamento riservato è descritto nella sezione successiva; le proposte di integrazione email/migrazione restano future. Sono anticipati creazione ticket, cambio stato e worklog, mentre rubrica e agenda sono in sola lettura.

## Collegamento riservato implementato

Il bridge attuale usa un codice privato monouso con state/PKCE, scambio server firmato HMAC e contesto verificato a ogni richiesta. PitMetric espone `/apps/buttidesk` e `/apps/buttidesk/authorize`; le API private sono `POST /api/buttidesk/v1/{token,context,revoke}`. ButtiDesk usa `/auth/pitmetric/{start,callback,problem}` e logout locale. Questo non costituisce un provider OAuth/OIDC pubblico.

Il gate sorgente accetta editor o `users.buttidesk_access_enabled`, indipendentemente dall’accesso database generale. Email verificata, membership attiva e ruoli sono verificati sul server. Token e chiavi non sono esposti al frontend; nessun dato del workspace è ricavato dai parametri del browser. Codici consumati atomicamente, nonce anti-replay, cache dei grant sul servizio sorgente e revoca della sessione sorgente al logout. I dettagli di attivazione sono nel README.

La descrizione successiva conserva l’analisi originale e le proposte per le integrazioni ancora future. Hosting, URL pubblico e segreti devono essere configurati prima dell’attivazione; nessuna migrazione dei dati o integrazione email viene eseguita automaticamente.

## 1. Analisi del modulo esistente

Il modulo è attualmente **parte dell'applicazione Laravel PitMetric**:

- PHP: `app/Modules/ButtiDeskPro/{Http,Models}`.
- HTTP: `routes/buttidesk.php`, con prefisso `/buttidesk` e route nominate `buttidesk.*`.
- UI: `resources/views/buttidesk` e `resources/views/components/buttidesk/shell.blade.php`; CSS dedicato in `public/desk-assets/buttidesk.css`.
- Schema: migrazione `2026_10_14_160000_create_buttidesk_tables.php`, con **sei tabelle `desk_*`**.
- Accesso: middleware `auth`, `verified`, `database.access`, gate `team-view`/`team-write`; la posta richiede in più `manage-updates`.
- Sicurezza di attivazione: `BUTTIDESK_ENABLED=false` per default, controllo della presenza delle sei tabelle e risposta isolata se non pronte.
- Posta: casella Studio condivisa con PitMetric, trasporto email Laravel/Resend; feed iCal privato con token casuale e hash in archivio.

Questi sono **concetti e comportamenti di riferimento**. Il nuovo progetto non importerà le classi così come sono, perché dipendono direttamente dal runtime di PitMetric.

## 2. Confini consigliati

### ButtiDesk-Pro autonomo

- Repository e deploy propri; servizi, code, cache e configurazione separati.
- Backend Laravel 13; frontend React + TypeScript con Inertia.js e Vite nello **stesso deploy Laravel**, Tailwind CSS 4 e design coerente con PitMetric. I componenti Livewire/Flux restano esclusivamente nel frontend di PitMetric.
- Database di dominio **proprio**: PostgreSQL come obiettivo per ButtiDesk-Pro, con test SQLite solo se riproducono correttamente i vincoli. Verificare il motore effettivo di PitMetric soltanto per progettare l'eventuale trasferimento dei dati storici.
- API interna versionata per identità/interscambio, non un'API pubblica generica.
- Integrazione futura come link dal menu PitMetric a una destinazione dedicata (es. sottodominio, **non ancora deciso**) e ritorno al contesto di provenienza.

### PitMetric come sorgente autorevole

PitMetric resta la fonte di verità per:

| Entità / regola reale | Dettaglio osservato | Implicazione per ButtiDesk-Pro |
| --- | --- | --- |
| `users` | Utenti con verifica email e `database_access_enabled` | SSO e autorizzazione, senza replicare credenziali |
| `workspaces` | `id`, `name` | Identificatore esterno stabile del tenant |
| `workspace_user` | PK composta (`workspace_id`, `user_id`), `role`, `status`, `joined_at` | Membership attiva obbligatoria per operare |
| Ruoli | `owner`, `manager`, `mechanic_engineer`, `driver`, `viewer` | Lettura per membri attivi; scrittura per owner, manager e mechanic_engineer; gestione avanzata per owner/manager |
| `WorkspaceContext` | Workspace attivo selezionato nella sessione `pitmetric.current_workspace_id` | Il client **non** decide da solo il workspace autorizzato |
| Gate `manage-updates` | Editor selezionati in configurazione | Posta Studio come funzione riservata, diversa dai normali permessi ticket |
| `BelongsToWorkspace` | Scope Eloquent e audit automatico | Riprodurre isolamento e audit nel proprio dominio, anche nei job senza sessione |

In PitMetric, `database.access` verifica anche `database_access_enabled` per gli utenti normali; l'editor Studio ha regole specifiche. L'integrazione non può assumere che un semplice login basti a dare accesso ai ticket.

### Identità fra applicazioni (da progettare prima di collegarle)

1. L'utente accede a PitMetric, seleziona il team e apre ButtiDesk-Pro.
2. Un protocollo verificabile lato server (preferibilmente OAuth2/OIDC con authorization code + PKCE, **da realizzare: PitMetric non risulta oggi provider SSO**) conferma identità, verifica email, abilitazione e membership.
3. ButtiDesk-Pro associa la sessione a `external_pitmetric_user_id` e a un `external_pitmetric_workspace_id` autorizzato. Per ogni cambio workspace ricalcola i permessi; non si fida di ID inviati dal browser.
4. Per autorizzazioni sensibili o membership revocate, interroga un endpoint protetto lato PitMetric oppure applica un meccanismo di invalidazione tempestivo. Token brevi, audience/scope minimi, rotazione e controllo anti-replay.
5. In caso di errore del servizio identità, nega nuove operazioni privilegiate: nessuna apertura implicita fra team.

**Non** condividere direttamente session cookie, `APP_KEY`, hash password o accesso indiscriminato al database. Nessun endpoint SSO viene dichiarato esistente: va prima definito, testato e aggiunto esplicitamente a PitMetric.

## 3. Schema di dominio ricostruito

Lo schema qui sotto fotografa i campi osservati nella migrazione PitMetric. I nomi `desk_*` sono candidati per la compatibilità, ma **non sono una migrazione pronta da eseguire** nel database autonomo.

| Tabella di origine | Campi di dominio principali | Relazioni |
| --- | --- | --- |
| `desk_contacts` | `id`, `workspace_id`, `type`, `name`, `company`, `email`, `phone`, `vat_number`, `notes` | `type` = `client`, `supplier`, `both` |
| `desk_tickets` | `id`, `workspace_id`, `client_id`, `supplier_id`, `created_by`, `title`, `description`, `category`, `status`, `priority`, `due_at`, `closed_at` | Cliente/fornitore opzionali; autore PitMetric |
| `desk_worklogs` | `id`, `workspace_id`, `ticket_id`, `user_id`, `summary`, `details`, `duration_minutes`, `performed_at` | Più interventi per ticket e autore |
| `desk_appointments` | `id`, `workspace_id`, `ticket_id`, `contact_id`, `created_by`, `title`, `location`, `description`, `starts_at`, `ends_at` | Appuntamento libero o legato a ticket/contatto |
| `desk_calendar_feeds` | `id`, `workspace_id`, `user_id`, `token_hash` | Un feed per coppia workspace/utente |
| `desk_mail_logs` | `id`, `workspace_id`, `ticket_id`, `sent_by`, `recipient`, `subject`, `message`, `in_reply_to` | Log invii/risposte, ticket opzionale |

Ogni tabella comprende `created_at`/`updated_at`. Nella migrazione originale le relazioni locali hanno FK e gli ID `created_by`, `user_id`, `sent_by` referenziano `users` nello **stesso database**; in database separati tali FK non attraversano sistemi: gli ID PitMetric diventano riferimenti esterni validati tramite contratto, **non** FK locali verso una falsa tabella `users` copiata.

### Contratti e invarianti minimi

- **Tenant:** tutte le query, inclusi export, report, processi in coda e feed, filtrano `workspace_id`; i lookup di relazioni controllano il medesimo workspace.
- **Permessi:** 401 senza identità, 403 senza autorizzazione; 404 per record di altri workspace quando appropriato. Verificare anche stato `active` della membership.
- **Ticket:** stati originali `open`, `progress`, `waiting`, `done`, `cancelled`; priorità `low`, `normal`, `high`, `urgent`; `closed_at` valorizzato per `done`, nullo alla riapertura.
- **Contatti:** clienti, fornitori o entrambi; il ticket può agganciare solo un contatto di tipo compatibile nel proprio tenant.
- **Durate e date:** `duration_minutes` intero non negativo; data canonica UTC, render in `Europe/Rome` o timezone del workspace definito in futuro; `ends_at` successivo a `starts_at`.
- **Auditing:** log strutturato su creazione/modifica/cancellazione, attore, tenant e momento; evitare di registrare segreti o contenuto integrale delle email nei log tecnici.
- **Cancellazioni:** favorire archiviazione/stati tracciabili per ticket, rapportini e comunicazioni; definire conservazione e privacy prima di introdurre soft-delete o retention.

Per tenere integro un riferimento anche a livello database valutare FK composite `(workspace_id, id)` e indici per stato/priorità/scadenza, oltre a validazione lato applicazione. Prima di applicarle serve una migrazione nuova e testata; il vincolo non è presente ovunque nel modello originale.

## 4. Funzioni e responsabilità

### Ticket e report

Creazione/modifica, filtri, scadenze, cliente/fornitore, lavoro svolto, totale minuti, report per singolo ticket e periodo. Il codice attuale produce **pagine stampabili**; generazione PDF/CSV, assegnatari, notifiche, SLA, allegati e automazioni sono obiettivi futuri e non funzionalità osservate.

### Calendario

CRUD appuntamenti, collegamento a ticket/contatto, `.ics` scaricabile e feed privato. Il feed attuale usa token casuale di 48 caratteri, conserva solo hash SHA-256, si rigenera/revoca e verifica membership attiva. Il nuovo sistema deve garantire isolamento, possibilità di rotazione, URL segreto non loggato e corretta serializzazione iCalendar; non deve promettere una sincronizzazione bidirezionale Google/Outlook già esistente.

### Email

Il codice originale usa la casella Studio di PitMetric: lettura API Resend, invio Laravel, risposta con intestazioni `In-Reply-To`/`References` e registrazione del messaggio inviato. L'inbound viene interrogato come casella condivisa e **non costituisce già una inbox separata per ogni workspace**.

Obiettivo futuro: un adapter autorizzato e isolato lato server, caselle/identità mittente esplicite, webhook verificati e idempotenti, correlazione messaggio↔ticket, limiti d'invio e audit. Le credenziali della casella restano sotto il controllo del sistema che ne è responsabile. Per la prima fase si può usare un trasporto finto nei test e disabilitare l'invio reale.

## 5. Interfacce di integrazione proposte (non implementate)

| Contratto da definire | Scopo | Vincolo |
| --- | --- | --- |
| `GET /internal/v1/context` in PitMetric | Fornire utente verificato, workspace, membership/ruolo e abilitazioni | Solo server autenticati, scope minimo, accesso autorizzato |
| Notifica di revoca/cambio membership | Invalidare accessi ButtiDesk non più validi | Firma, retry, idempotenza e riconciliazione |
| Riferimento al ticket da PitMetric | Aprire un ticket nel proprio tenant | Link firmato o deep link senza concessione di permessi |
| Adapter email server-side | Elencare/inviare solo messaggi autorizzati | Niente chiave Resend sul frontend né inbox globale ai membri del team |

Gli URI e i payload sono **segnaposto di progetto**, non endpoint già presenti. Prima dell'implementazione creare una specifica OpenAPI o equivalente con esempi, codici di errore, versioni e test di contratto.

## 6. Migrazione futura senza interruzioni

1. **Rilevazione read-only:** controllare schema, database realmente in uso, record e FK in PitMetric. Non inferire i dati di produzione dalle sole migrazioni.
2. **Piano di mapping:** preservare `id`, `workspace_id`, autore, timestamp e collegamenti fra le sei entità, o documentare una mappa `legacy_id → new_id` stabile.
3. **Backup e dry-run:** esportazione cifrata/controllata, import idempotente in staging e riconciliazione per conteggi e record campione, con test cross-workspace.
4. **Cutover:** bloccare le scritture sul vecchio dominio al momento concordato, sincronizzare il delta e abilitare il nuovo servizio solo dopo verifica; **mai due sistemi scriventi contemporaneamente sugli stessi record**.
5. **Rollback:** disattivare il link/feature flag di integrazione, conservare vecchi dati e snapshot senza sovrascritture. Definire esplicitamente il trattamento delle scritture effettuate dopo il cutover prima di promettere rollback dati.
6. **Pulizia:** qualsiasi rimozione di vecchie route/tabelle o plugin PitMetric è un progetto successivo, con approvazione, backup verificato e finestra di rilascio dedicata.

Il precedente runbook Coolify protegge PitMetric con `BUTTIDESK_ENABLED=false`, migrazioni non distruttive e `optimize:clear`; il nuovo servizio dovrà avere un flag proprio e non ereditare automaticamente il ciclo di deploy del sito principale.

## 7. Decisioni tecniche e limiti

**Scelta raccomandata per l'MVP:** monolite Laravel 13 + Inertia/React/TypeScript + Tailwind CSS 4, schema PostgreSQL proprio + API di integrazione strettamente delimitata. Inertia consente la navigazione React senza creare subito un backend Node o una seconda API CRUD soltanto per il frontend. La coerenza con PitMetric riguarda modelli, autorizzazioni, nomi di dominio, navigazione e design; i componenti Flux/Livewire non si copiano né si montano in React. **Nessun React dentro PitMetric**.

**Non deciso:** dominio del nuovo servizio, SSO concreto, database di produzione, scelta dell'infrastruttura, trattamento delle email condivise, portata del trasferimento dati reali, requisiti di retention/privacy e calendario esterno in scrittura. Nessuna di queste ipotesi autorizza modifiche a PitMetric in questa fase.
