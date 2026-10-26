# ButtiDesk-Pro — Roadmap di ricostruzione

**Stato al 26/10/2026:** Fase 1 implementata. Laravel 13, Inertia 3/React/TypeScript, tema blu, demo locale, Docker PostgreSQL e CI SQLite/PostgreSQL. Una parte del dominio e delle schermate è anticipata per poter provare la base; Fasi 2–3 ancora parziali. Nessun collegamento produttivo.

## Consegna Fase 1

- Scaffold autonomo PHP 8.4, dipendenze bloccate, TypeScript strict, pagine React lazy, Tailwind 4 e font locali.
- Panoramica, ticket con creazione/cambio stato/interventi, rapportini stampabili, rubrica e agenda in lettura.
- Quattro tabelle nuove con FK composite tenant; identità fittizie server-side, due workspace e profilo osservatore.
- Test Pest per isolamento, ruoli, validazione, UTC, integrità e chiusura demo in produzione; Pint, Larastan e build.
- Compose locale e pipeline senza deployment; istruzioni in [DEVELOPMENT.md](DEVELOPMENT.md).

**Restano per la Fase 2:** CRUD completo e policy di contatti/agenda, modifica/archiviazione ticket, ulteriori vincoli e test transazionali di dominio. **Restano per la Fase 3:** test browser automatici in CI, rifinitura dei flussi completi e report/export previsti. Posta, feed, SSO e migrazione reale non sono implementati.

## Priorità

Costruire prima un service desk **affidabile e multi-workspace**, poi integrarlo in PitMetric con un contratto verificabile. Il primo prodotto usabile deve consentire contatto → ticket → intervento → report, senza richiedere posta live, SSO o servizi esterni durante lo sviluppo.

| Fase | Consegna attesa | Criteri di completamento |
| --- | --- | --- |
| **0 — Analisi** | README, modello del modulo originale, confini, roadmap | Requisiti e differenze rispetto al codice corrente espliciti; **questa fase è documentata** |
| **1 — Fondamenta** | Progetto Laravel 13/PHP 8.4 autonomo, Inertia + React/TypeScript + Tailwind 4, PostgreSQL, ambiente Docker locale e CI | Avvio locale; `tsc`, Pest, Pint, analisi statica e build eseguibili; nessuna dipendenza runtime da PitMetric |
| **2 — Dominio** | Migrazioni nuove e modelli per contatti, ticket, worklog, agenda; workspace esterno simulato nei test | Policy e isolamento tenant, validazione relazioni, test CRUD e transazioni; compatibilità SQLite/PostgreSQL verificata |
| **3 — MVP usabile** | Dashboard, rubrica, ticket, interventi, report stampabili, calendario di base | Navigazione desktop/mobile, stati di caricamento/errore/vuoto, accessibilità, test end-to-end dei flussi principali |
| **4 — Connessione PitMetric** | Contratto identità/team, accesso federato, link tra prodotti, feature flag | Sessioni autorizzate e revoche controllate, niente permessi basati su ID client, test di contratto e cross-workspace su entrambe le app |
| **5 — Comunicazioni** | Integrazione casella Studio, invio/ricezione/risposte, collegamento ticket; feed `.ics` sicuro | Webhook/adapter idempotenti, gating posta, rate limiting, token iCal revocabili, nessun segreto esposto |
| **6 — Migrazione e rilascio** | Dry-run dati esistenti, riconciliazione, cutover, deployment autonomo e monitoraggio | Backup/restore testati, piano di rollback, nessuna doppia scrittura, PitMetric funzionante con ButtiDesk disabilitato |

Le fasi 4–6 richiedono decisioni sull'infrastruttura e sull'accesso. Nessuna connessione o modifica in produzione va realizzata durante la sola fase di analisi.

## Pacchetti di lavoro tecnici

### MVP (necessari)

- Migrations e repository/service layer focalizzato sui casi d'uso, non logica di business accentrata nei controller.
- Isolamento obbligatorio dei tenant su CRUD, report, export e riferimenti, con test di accesso negato.
- Filtri ticket per stato, priorità e ricerca; scadenze, collegamento cliente/fornitore e cronologia degli interventi.
- Dashboard pratica: ticket aperti/urgenti, ore del mese, prossimi impegni.
- Report stampabili: numero ticket, cliente, interventi, durate e periodo; PDF/CSV solo dopo MVP.
- Validazione server-side, CSRF, autorizzazione, audit, paginazione e indici sulle query frequenti.
- UI coerente con PitMetric (tipografia, proporzioni, navigazione, dark mode, layout mobile), con componenti React accessibili e identità ButtiDesk-Pro riconoscibile; niente import diretto dei componenti Flux/Livewire.

### Dopo il primo uso reale (candidati)

- Assegnazione ticket, commenti interni, allegati privati e scadenze/notifiche.
- Ricerca globale, filtri salvati, report esportabili, promemoria.
- Collega conversazioni email e crea ticket da messaggi verificati.
- Integrazioni calendario Google/Outlook in sola lettura o scrittura **solo se richieste e autorizzate**, oltre all'iCal.
- Dashboard KPI e tempi di presa in carico: introdurre SLA solo quando il workflow lo richiede.
- TypeScript già usato per pagine e componenti React; espandere calendario e interazioni complesse senza aggiungere un secondo backend JavaScript.

## Pipeline e ambienti previsti

1. **Local/test:** Laravel 13, DB SQLite o PostgreSQL, mail fake, fixture sintetiche, nessun accesso a credenziali PitMetric.
2. **CI:** `composer install`, `npm ci`, lint Pint, Larastan, controllo TypeScript (`tsc --noEmit` o comando equivalente), Pest con database effimero, build Vite e successivamente Playwright con browser desktop/mobile. Nessun deploy se falliscono controlli di tenant/permessi.
3. **Staging autonomo:** container Docker/Coolify, database proprio, worker e log propri, integrazione PitMetric su endpoint di staging.
4. **Produzione:** health checks, backup cifrati con ripristino verificato, migrazioni additive, monitoraggio e feature flag per sospendere l'integrazione senza spegnere PitMetric.

Docker, PostgreSQL, TypeScript e CI/CD sono competenze interessanti anche in ottica lavorativa; qui vanno introdotte con prove misurabili. Kubernetes, microservizi ulteriori, Spring, .NET, FastAPI e Node server non fanno parte dell'MVP.

## Test obbligatori prima del collegamento

- Un membro del workspace A non vede contatti, ticket, rapportini, appuntamenti né email del workspace B.
- Un ID di contatto/ticket appartenente a B non è accettato nelle form o nelle API di A.
- `viewer` e `driver` non creano/modificano ticket; ruoli autorizzati sì, se membership attiva e abilitazione confermata.
- Utente sospeso, non verificato o senza accesso DB non ottiene nuove sessioni operative.
- Un editor della posta non aggira l'isolamento dei workspace.
- Feed iCal: token errato/revocato/rigenerato o utente sospeso produce negazione; gli eventi non attraversano tenant.
- Invio email fallito non viene registrato come successo; messaggi/webhook duplicati non generano attività duplicate.
- Il sito PitMetric e le sue route restano funzionanti con ButtiDesk disabilitato, in staging e dopo eventuale rollback.

## Decisioni da prendere prima della Fase 4

1. **Posizionamento:** sottodominio/app esterna oppure installazione come pacchetto separato nel runtime PitMetric? La proposta preferisce un'app autonoma, ma va definito il percorso utente.
2. **Identità:** chi implementa il provider/bridge SSO lato PitMetric, con quali scope e tempi di revoca?
3. **Database:** quale engine usa davvero l'istanza PitMetric e come esportare/importare in modo sicuro gli eventuali dati storici verso PostgreSQL?
4. **Email:** la casella Studio resta unica per editor o è necessaria una gestione per singolo workspace? Nessuna inbox globale accessibile senza isolamento.
5. **Dati storici:** esistono record `desk_*` reali da migrare, o si parte dal sistema nuovo vuoto?
6. **Hosting:** destinazione, nome dominio, HTTPS, segreti, backup e limiti di esposizione dell'API interna.

## Disciplina di rilascio

- Questa repository può evolvere autonomamente. **Nessun auto-deploy su PitMetric** solo perché cambia ButtiDesk-Pro.
- Quando servirà aggiornare PitMetric, preparare un cambiamento verificato e **un solo commit finale** per il suo ciclo Coolify, secondo il vincolo operativo già stabilito.
- Non cancellare né spostare in questa fase il modulo o le tabelle oggi presenti in PitMetric.
- Per la prima versione separata puntare a una release provabile con dati fittizi, prima di import o connessioni con dati reali.
