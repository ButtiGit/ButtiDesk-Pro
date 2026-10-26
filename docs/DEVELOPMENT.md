# Sviluppo e verifiche — Fase 1

## Avvio locale

Il percorso più semplice è `composer run setup` e poi `composer run dev` con PHP 8.4+ e Node 22.12+ installati. SQLite viene preparato in `database/database.sqlite`, escluso da Git. Su Windows usa PHP 8.4 tramite Herd o un’installazione equivalente; una versione PHP 8.2 di XAMPP non basta.

Per avviare senza Vite dopo `npm run build`:

```bash
php artisan serve
```

Il document root è `public/`, non la radice della repository. Evita di esporre `.env`, file SQLite, `vendor` o `storage` attraverso una configurazione Apache generica.

## Docker e PostgreSQL

```bash
cp .env.example .env
# PowerShell: Copy-Item .env.example .env
docker compose up --build
```

L’applicazione risponde su http://localhost:8000 dopo la prima build. Il volume `postgres_data` conserva i dati, mentre `vendor` e `node_modules` hanno volumi dedicati al container. `docker compose down` ferma i servizi senza cancellare questi volumi. Il database non è pubblicato sull’host.

Il file Compose configura solo un ambiente locale: server PHP di sviluppo, `APP_DEBUG` dalla `.env`, credenziali di esempio e nessun deploy. Non è pronto per esposizione pubblica.

```bash
docker compose exec -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: -e DB_URL= app composer test
docker compose exec app composer analyse
docker compose exec app composer lint
docker compose exec app npm run check
```

**Attenzione al contesto di test:** Compose configura `DB_DATABASE=buttidesk_demo`. Non lanciare direttamente la suite con queste variabili: per usare un database test SQLite effimero, esegui invece:

```bash
docker compose exec -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: -e DB_URL= app composer test
```

Per PostgreSQL crea un database test separato e indica quel nome:

```bash
docker compose exec postgres createdb -U buttidesk buttidesk_test
docker compose exec -e APP_ENV=testing -e DB_DATABASE=buttidesk_test app composer test
```

Un controllo in `Tests/TestCase.php`, eseguito prima di `RefreshDatabase`, rifiuta connessioni diverse da SQLite `:memory:`/`*_test.sqlite` o PostgreSQL `*_test`. `RefreshDatabase` e le migrazioni di test ricreano lo schema: usare **sempre** un database dedicato e sacrificabile. Non usare credenziali reali.

## Identità simulata

`IdentityProvider` è il punto di sostituzione futuro. Oggi `DemoIdentityProvider` accetta esclusivamente `APP_ENV=local|testing` e `DESK_DEMO_ENABLED=true`. Il workspace e il profilo provengono da valori server-side predefiniti, memorizzati nella sessione e validati a ogni richiesta.

L’app non offre registrazione, recupero password o SSO e non concede accesso in produzione, anche se il flag demo è erroneamente attivo. `/up` rimane disponibile senza identità e serve solo come controllo del runtime Laravel, non come verifica del database o del dominio.

Per code/CLI futuri occorre risolvere una `DeskIdentity` autorizzata e impostare esplicitamente `WorkspaceContext`. La registrazione `scoped` evita di riutilizzare il contesto tra richieste/job nei runtime persistenti Laravel. Nessuna tabella locale utenti pretende di sostituire PitMetric.

## Sicurezza del database di test

SQLite usa FK abilitate. PostgreSQL usa lo stesso schema; i riferimenti tenant sono protetti da FK composite. La suite verifica i tentativi di riferimenti incrociati tramite HTTP e tramite SQL diretto.

La configurazione PHPUnit usa SQLite `:memory:` in assenza di variabili ambiente esplicite; la CI fornisce database effimeri. Le variabili di ambiente hanno precedenza sul file `.env` e sui default PHPUnit. Non eseguire i test se non hai verificato connessione e database destinazione.

## Verifica dell’interfaccia

Provare almeno:

1. Dashboard desktop e mobile, temi chiaro/scuro e persistenza alla ricarica.
2. Ricerca/filtri ticket, paginazione e stato vuoto con una query senza risultati.
3. Creazione ticket con cliente, scadenza, cambio stato e registrazione di un intervento.
4. Rapportino del ticket e registro per intervallo; la stampa del registro riguarda la pagina corrente.
5. Cambio workspace: i dati del precedente non devono comparire, anche modificando l’ID nella URL.
6. Profilo osservatore: nessuna azione di scrittura disponibile o autorizzata lato server.
7. Navigazione mobile con menu, focus, tasto Escape, etichette accessibili, scorrimento della sola tabella e assenza di overflow della pagina.

La CI di questa fase contiene test PHP su SQLite/PostgreSQL, analisi statica, formattazione, TypeScript, build e una verifica dell’avvio Docker con la pagina demo. L’automazione browser in CI è prevista nella Fase 3.

## Limiti intenzionali

- Quattro tabelle di dominio e flussi ticket essenziali; gestione contatti/agenda, modifica ticket completa e retention ancora da completare.
- Lo schema non certifica ancora tutti i vincoli della Fase 2 (es. regole per modifiche/cancellazioni future e appuntamenti scrivibili).
- Fixture idempotenti riconosciute da nome/titolo, generate rispetto alla prima inizializzazione. Prima di rendere quei campi modificabili, usare identificatori fixture stabili.
- Nessuna posta, feed, credenziale, chiamata al sito PitMetric o dipendenza da un backend Node. SSR Inertia esplicitamente disabilitato.
- Nessun ruolo della demo rappresenta una membership reale. L’adapter autentico dovrà verificare email, abilitazioni, membership attiva e revoche.
