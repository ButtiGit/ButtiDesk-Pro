# ButtiDesk-Pro

**Il lavoro, sotto controllo.** Service desk autonomo per gestire richieste, clienti, interventi e appuntamenti. Laravel 13 + React 19/TypeScript + Inertia 3, con identità blu e stile coerente con PitMetric.

> **Fase 1 + collegamento PitMetric riservato — 26 ottobre 2026.** Due modalità: demo locale con dati sintetici oppure identità verificata da PitMetric. Il bridge è implementato e testato; l’attivazione effettiva richiede il deploy separato, un URL HTTPS, un database proprio e le variabili runtime descritte sotto. Non importa dati o credenziali da PitMetric.

## Avvio rapido

### Con Docker (PHP 8.4, Node 22 e PostgreSQL 16 inclusi)

Clona questa repository e, dalla sua cartella:

```bash
cp .env.example .env
# PowerShell: Copy-Item .env.example .env
docker compose up --build
```

Apri **http://localhost:8000**. Il primo avvio installa le dipendenze dai lockfile, prepara un database proprio e compila il frontend. Gli avvii successivi conservano ticket e interventi. Nessun database di PitMetric è utilizzato; PostgreSQL non espone porte sull’host e l’app è pubblicata solo su `127.0.0.1`.

Per cambiare porta: `DESK_PORT=8080 docker compose up` (in PowerShell: `$env:DESK_PORT=8080; docker compose up`). Il container usa il server di sviluppo PHP e asset compilati, **non** è un’immagine di deploy produttivo.

### Senza Docker (SQLite, avvio leggero)

Requisiti: **PHP 8.4+**, Composer 2, **Node 22.12+** (o 24) e npm; estensioni PHP Laravel più `pdo_sqlite`, `intl` e `mbstring`. Per PostgreSQL serve anche `pdo_pgsql`. Non usare una vecchia versione PHP di XAMPP.

```bash
composer run setup
composer run dev
```

Apri **http://localhost:8000**. `setup` crea `.env` solo se manca, genera la chiave solo se assente, applica migrazioni additive e inserisce fixture senza cancellare le righe esistenti. `dev` avvia Laravel e Vite con aggiornamento automatico dell’interfaccia.

Se `.env` esiste già, prima controlla che punti **esclusivamente a un database demo dedicato**. Non inserire credenziali, URL, cookie, chiavi o dati reali di PitMetric.

## Collegamento a PitMetric e produzione

La sidebar delle due applicazioni permette il passaggio con un click. PitMetric mostra ButtiDesk solo agli editor o agli utenti abilitati esplicitamente in **Studio → Utenti → ButtiDesk-Pro**. L’accesso al database PitMetric e l’abilitazione ButtiDesk sono indipendenti. La nuova app applica anche email verificata, membership attiva e ruolo del workspace.

L’accesso usa un bridge privato con state/PKCE e codici monouso; le chiamate server sono firmate HMAC, con timestamp e nonce. Nessuna password, chiave applicativa o session cookie è condivisa. Le autorizzazioni vengono ricontrollate a ogni richiesta ButtiDesk, senza cache di permessi; la sidebar PitMetric non chiama l’altra app. Assets e pagine React restano esclusivamente in ButtiDesk.

### Risorsa Coolify autonoma

Usa il **Dockerfile nella radice**, porta **8080**, un hostname dedicato con HTTPS e PostgreSQL dedicato inizialmente vuoto. L’immagine usa Nginx + PHP-FPM, asset già compilati e dipendenze PHP senza pacchetti di sviluppo. La CI ne verifica build, avvio e frontiera di autenticazione. `compose.yaml` rimane solo per lo sviluppo locale.

Variabili runtime ButtiDesk:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://<hostname-ButtiDesk>
APP_KEY=<chiave-propria-della-nuova-app>
DESK_IDENTITY_PROVIDER=pitmetric
DESK_DEMO_ENABLED=false
PITMETRIC_URL=https://pitmetric.it
BUTTIDESK_BRIDGE_SECRET=<chiave-casuale-dedicata-condivisa-dai-due-servizi>
DB_CONNECTION=pgsql
DB_HOST=<host-database-ButtiDesk>
DB_PORT=5432
DB_DATABASE=<database-ButtiDesk>
DB_USERNAME=<utente-ButtiDesk>
DB_PASSWORD=<password-ButtiDesk>
```

Nessun segreto reale è incluso. Genera una chiave dedicata con `php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'` e imposta lo stesso valore in entrambi i servizi. Usa `APP_KEY` e cookie separati, con `SESSION_DOMAIN` non impostato. Non rigenerare la chiave di PitMetric.

Dopo il deploy nuovo, esegui **solo** `php artisan migrate --force --no-interaction`. Non eseguire seed demo o `composer setup` in produzione. Nell’app PitMetric configura:

```dotenv
BUTTIDESK_BRIDGE_ENABLED=true
BUTTIDESK_PRO_URL=https://<hostname-ButtiDesk>
BUTTIDESK_BRIDGE_SECRET=<stesso-valore-dedicato>
```

Il flag storico `BUTTIDESK_ENABLED` in PitMetric riguarda il vecchio modulo e può rimanere `false`. La migrazione PitMetric aggiunge soltanto `users.buttidesk_access_enabled`, disattivo per default. Distribuisci e migra prima i servizi con bridge spento, verifica il nuovo hostname e abilita il flag alla fine. Configurazioni mancanti o non valide chiudono il collegamento senza influenzare il sito principale.

Per cambiare workspace, selezionalo in PitMetric e riapri ButtiDesk. Il ritorno dalla sidebar apre PitMetric; i link fra prodotti eseguono una navigazione normale, mentre la navigazione interna resta Inertia. Il logout PitMetric revoca i collegamenti della stessa sessione; “Esci da ButtiDesk” chiude solo la sessione locale.

Il bridge usa cache Laravel e lock per grant e nonce; PitMetric deve avere una cache condivisa fra le eventuali repliche. Grant fino a due ore, codice monouso di 60 secondi, richieste firmate valide per 30 secondi. Se il servizio identità non risponde, ButtiDesk non autorizza letture o scritture usando vecchi permessi.

## Cosa puoi già provare

| Area | Disponibile nella Fase 1 |
| --- | --- |
| Panoramica | Ticket attivi e urgenti, ore del mese, contatti, priorità, impegni e attività settimanale; tutti calcolati dal database |
| Ticket | Elenco paginato, ricerca, filtri per stato/priorità, creazione, dettaglio e cambio stato |
| Interventi | Registrazione sul ticket in minuti interi e cronologia; identità e workspace stabiliti dal server |
| Rapportini | Stampa del ticket completo e registro per periodo; il riepilogo stampa la pagina corrente, non un export completo |
| Rubrica | Clienti/fornitori sintetici, ricerca e filtro; sola lettura in questa fase |
| Calendario | Vista settimanale navigabile con appuntamenti sintetici e link ai ticket; sola lettura |
| Ambiente | Due workspace demo, profilo amministratore/osservatore, tema blu chiaro/scuro persistente e navigazione mobile |

La posta è indicata come futura: non esiste alcun invio reale, inbox connessa, feed iCal o sincronizzazione esterna. Modifica completa/archiviazione ticket, CRUD rubrica/agenda, export PDF/CSV, allegati, migrazione dei dati storici e ulteriori integrazioni fanno parte delle fasi successive.

### Dati e identità demo

- Workspace: **Butti Studio** (`101`) e **Officina Demo** (`202`), ognuno con 6 contatti, 12 ticket, 13 interventi e 3 appuntamenti all’inizializzazione.
- Profili fittizi: **Alex Demo**, amministratore, e **Jamie Demo**, osservatore; nessun login o password copiati da altri sistemi.
- Cambia workspace dal menu laterale; cambia profilo in **Impostazioni**. L’osservatore può leggere ma non creare ticket, cambiare stati o registrare lavoro.
- Le scritture persistono nel database locale; ricaricare il browser non le annulla. `php artisan desk:prepare` è ripetibile e non azzera i dati. Le date delle fixture sono relative alla prima inizializzazione; non vengono spostate automaticamente a ogni avvio.
- Il seeder riconosce le fixture da titolo/nome, campi non modificabili dall’attuale demo; prima di introdurne la modifica nella Fase 2 serviranno chiavi fixture stabili.

## Struttura e scelte tecniche

```text
app/Contracts/IdentityProvider.php  Contratto sostituibile per l’identità futura
app/Identity/                     Identità demo e ruoli compatibili con PitMetric
app/Support/WorkspaceContext.php   Contesto obbligatorio, scoped alla richiesta/job
app/Models/                       Contatti, ticket, interventi, appuntamenti
app/Services/TicketService.php     Scritture transazionali e audit senza contenuti sensibili
app/Http/                         Controller, validazione e middleware Inertia/identità
resources/js/pages/               Pagine React caricate su richiesta
resources/js/components/          Componenti tipizzati e tabella ticket
resources/css/app.css             Token chiaro/scuro, blu, responsive e stampa
config/desk.php                    Configurazione solo demo e fuso Europe/Rome
compose.yaml                      Ambiente locale PostgreSQL isolato
.github/workflows/checks.yml       Controlli su SQLite e PostgreSQL
```

Un solo backend Laravel e un solo deploy futuro: React non introduce un secondo server applicativo. Vite divide il codice per pagina, Lucide è importato per singola icona, il grafico settimanale usa CSS e i font Instrument Sans sono locali. Non ci sono CDN o runtime chiamati per disegnare la UI.

Lo stile riprende i principi visivi di PitMetric — superfici `#0b0d10`/`#111419`, bordi `#272d36`, tipografia Instrument Sans, menu laterale e pannelli compatti — con accenti blu `#3478f6` in tema scuro e `#2563eb` in tema chiaro. I componenti Flux/Livewire non sono copiati.

### Isolamento e contratto dati

Le quattro nuove tabelle `desk_*` mantengono i nomi di dominio e gli stati originali:

- Stati: `open`, `progress`, `waiting`, `done`, `cancelled`; priorità: `low`, `normal`, `high`, `urgent`.
- Ogni query Eloquent richiede un `WorkspaceContext`; senza contesto fallisce, anche fuori dalle richieste web. Tenant e autore delle scritture non sono accettati dal browser.
- Le FK composite `(workspace_id, id)` impediscono riferimenti fra workspace anche nel database; la validazione controlla anche cliente/fornitore compatibili.
- Durate in minuti, timestamp in UTC e presentazione in `Europe/Rome`. Chiudere un ticket valorizza `closed_at`, riaprirlo lo azzera.
- Gli ID di workspace e attore sono riferimenti esterni simulati: non esiste una copia della tabella utenti PitMetric. Per job futuri va risolto esplicitamente un contesto autorizzato; non usare query senza scope per aggirarlo.
- CSRF Laravel, limiti sulle creazioni, query paginate, transazioni e audit strutturato. Il cambio di profilo/workspace è una funzione **solo demo**, non un sistema di autorizzazione per la produzione.

## Controlli

```bash
composer lint        # Pint
composer analyse     # Larastan, livello 5
composer test        # Pest: dominio, tenant, ruoli, validazione, demo chiusa in produzione
npm run check        # TypeScript strict + Prettier + build Vite
```

In Docker anteponi `docker compose exec app` per lint/analisi/build; per i test usa `docker compose exec -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: -e DB_URL= app composer test`. I test usano SQLite in memoria per default. La CI ripete l’intera suite anche con PostgreSQL 16, verifica l’avvio della demo in Docker e non pubblica né distribuisce nulla.

Per provare i test su un PostgreSQL **dedicato ed effimero**, consulta [sviluppo e verifiche](docs/DEVELOPMENT.md). La suite ricrea le tabelle del database di test: non puntarla a database condivisi o reali.

## Roadmap e relazione con PitMetric

- [Roadmap aggiornata](docs/ROADMAP.md): Fase 1 e passi ancora necessari.
- [Architettura e contratto di riferimento](docs/ARCHITECTURE.md): origine dei requisiti, dati, permessi e integrazione proposta.
- [Avvio, configurazione e verifiche](docs/DEVELOPMENT.md): comandi e limiti della demo.

La Fase 1 anticipa una parte delle fondamenta del dominio per rendere la base realmente provabile. Le Fasi 2–3 **non sono completate**: rubrica e agenda sono ancora in lettura, mancano i flussi completi e il contratto identità reale. Posta e feed non hanno ancora modelli o tabelle applicative.

PitMetric rimane un servizio separato. Il suo cambiamento coordinato aggiunge il flag utenti, i link e gli endpoint del bridge; i dati di dominio restano in ButtiDesk. Il modulo storico non viene spostato o cancellato e non viene effettuato alcun import automatico. Non condividere `APP_KEY`, cookie di sessione o accesso diretto ai database.

### Origine

Concetti derivati dall’analisi read-only di `ButtiGit/pitmetric@8ef8f780ec90bfb7c2751fd0901bd0e686041e20`, documentata in [ARCHITECTURE.md](docs/ARCHITECTURE.md). Scaffold ricostruito sulla base dello skeleton ufficiale Laravel 13; implementazione autonoma, senza trasferimento del vecchio modulo.
