# ButtiDesk-Pro

**Service desk e gestione operativa del lavoro**, progettato come applicazione autonoma ma integrabile con [PitMetric](https://github.com/ButtiGit/pitmetric).

> **Stato al 26 ottobre 2026: progettazione.** Questa repository contiene per ora l'analisi funzionale, l'architettura proposta e la roadmap. **Non contiene ancora un'applicazione avviabile.** Il modulo da cui nascono i requisiti si trova attualmente nel codice di PitMetric: non è stato copiato, spostato o disattivato.

## Perché esiste

ButtiDesk-Pro aiuta un piccolo team o uno sviluppatore a gestire richieste, interventi, contatti, comunicazioni e appuntamenti senza disperdere le informazioni tra email, note e fogli di calcolo.

PitMetric resta il prodotto per le **operazioni tecniche motorsport**; ButtiDesk-Pro si occupa del **service desk e dell'organizzazione del lavoro**. I due prodotti potranno aprirsi reciprocamente e condividere in modo controllato identità e contesto del team, mantenendo separati i dati applicativi.

## Funzionalità di riferimento

Queste funzionalità sono **derivate dal modulo oggi presente in PitMetric**, non promesse di un'app già pronta in questa repository.

| Area | Cosa permette di fare | Evoluzione prevista |
| --- | --- | --- |
| Dashboard | Vedere ticket attivi/urgenti, contatti, ore registrate e prossimi appuntamenti | Indicatori, filtri e azioni contestuali |
| Ticket | Creare e modificare richieste con categoria, stato, priorità, scadenza, cliente e fornitore | Assegnatari, commenti, allegati, cronologia e ricerca avanzata |
| Interventi e report | Registrare attività, data, descrizione e durata; stampare il rapportino del ticket e il riepilogo per periodo | Esportazione PDF/CSV e report professionali |
| Rubrica | Gestire clienti, fornitori e contatti misti, con azienda, email, telefono, P. IVA e note | Relazioni e duplicati controllati |
| Calendario | Gestire appuntamenti collegabili a ticket o contatti, con download `.ics` e feed privato revocabile | Promemoria e successive integrazioni, solo dopo consenso/permessi |
| Posta | Leggere, inviare e rispondere tramite la casella Studio di PitMetric e associare messaggi ai ticket | Conversazioni per ticket, webhook e tracciamento idempotente |
| Team e sicurezza | Limitare visibilità e modifiche al workspace attivo e ai permessi dell'utente | Integrazione server-to-server con identità PitMetric e audit specifico |

### Modello operativo dei ticket

- Stati osservati: `open`, `progress`, `waiting`, `done`, `cancelled`.
- Priorità osservate: `low`, `normal`, `high`, `urgent`.
- Un ticket può riferirsi a un cliente e/o a un fornitore, avere più interventi, appuntamenti e messaggi collegati.
- Le durate degli interventi sono espresse in **minuti interi**; i timestamp persistiti sono in **UTC**, presentati all'utente nel fuso di configurazione (predefinito `Europe/Rome`).

## Rapporto con PitMetric

L'integrazione **non è ancora implementata** nel nuovo repository.

| Aspetto | Proprietario previsto | Regola |
| --- | --- | --- |
| Login, verifica email, utenti | PitMetric | Niente copie di password o condivisioni improvvisate di cookie |
| Workspace, appartenenze, ruoli | PitMetric | La membership attiva determina l'accesso, verificato lato server |
| Ticket, contatti, interventi, agenda, log | ButtiDesk-Pro | Dati isolati per `workspace_id`, propri del service desk |
| Casella Studio e credenziali Resend | Servizio autorizzato da PitMetric | Accesso per competenza, non esposizione delle credenziali nel browser |
| Navigazione tra prodotti | Entrambi | Link contestuali e futuro accesso federato, con rollout graduale |

**Vincolo principale:** nessun utente deve poter leggere o collegare entità di un altro workspace, neppure modificando un ID nella URL o in una richiesta API.

## Tecnologie: continuità e apprendimento

Il progetto mantiene **Laravel e il modello dati di PitMetric** ma, essendo un'app autonoma, propone un frontend **React + TypeScript con Inertia**: permette di mettere in pratica competenze full stack richieste senza modificare il frontend Livewire di PitMetric.

| Componente | Scelta iniziale | Motivazione |
| --- | --- | --- |
| Backend | PHP 8.4 + Laravel 13 | Convenzioni, regole di dominio e test coerenti con PitMetric |
| UI applicativa | React + TypeScript + Inertia.js + Tailwind CSS 4 | Pratica di React/TS, mantenendo routing e validazione in Laravel e una sola applicazione da distribuire |
| Design | Stessi principi visivi, tipografia, layout e stati d'interfaccia di PitMetric | Coerenza di esperienza; i componenti Flux/Livewire non sono riusabili direttamente in React |
| Database | PostgreSQL proposto per il servizio autonomo, Eloquent e migrazioni Laravel | SQL, vincoli, indici e portabilità; **la produzione PitMetric non è stata identificata dal solo repository** |
| Test | Pest 4; successivamente Playwright per i flussi critici | Sicurezza, regressioni e usabilità |
| Distribuzione | Docker/Coolify e GitHub Actions in una fase successiva | Deploy riproducibili e verificati |

**Perché React qui e non in PitMetric?** Il progetto indipendente è anche un'occasione concreta per usare TypeScript, React, SQL avanzato, Docker e CI/CD. React resta confinato a ButtiDesk-Pro: PitMetric continua con Laravel + Livewire 4 + Flux 2 e non ne riceve il bundle. Non si aggiungono Next.js, Node.js come secondo backend, Vue, Spring o .NET senza un caso d'uso reale.

## Documenti di progetto

- [Architettura e contratto dati](docs/ARCHITECTURE.md): analisi del modulo originale, sei entità, permessi, confini di integrazione, sicurezza e migrazione.
- [Roadmap e criteri di completamento](docs/ROADMAP.md): ordine di realizzazione, test richiesti, vincoli per il collegamento a PitMetric e decisioni ancora aperte.

### Origine dei requisiti (fotografia del 26/10/2026)

Analisi basata sul branch `main` di [ButtiGit/pitmetric](https://github.com/ButtiGit/pitmetric) al commit [`8ef8f78`](https://github.com/ButtiGit/pitmetric/commit/8ef8f780ec90bfb7c2751fd0901bd0e686041e20):

- [Modulo PHP](https://github.com/ButtiGit/pitmetric/tree/main/app/Modules/ButtiDeskPro)
- [Rotte](https://github.com/ButtiGit/pitmetric/blob/main/routes/buttidesk.php)
- [Migrazione delle sei tabelle](https://github.com/ButtiGit/pitmetric/blob/main/database/migrations/2026_10_14_160000_create_buttidesk_tables.php)
- [Test funzionali](https://github.com/ButtiGit/pitmetric/blob/main/tests/Feature/ButtiDeskProTest.php)
- [Note per il rilascio protetto](https://github.com/ButtiGit/pitmetric/blob/main/docs/buttidesk-coolify.md)

La fotografia descrive il **codice versionato**, non certifica che tutte le funzioni siano abilitate o collaudate sull'istanza di produzione.

## Regole di sviluppo

1. Non copiare codice, credenziali, migrazioni già eseguite o dati reali di PitMetric in questa repository.
2. Prima sviluppare e testare ButtiDesk-Pro separatamente; integrare PitMetric solo quando interfacce, permessi e rollback sono verificati.
3. Nessuna migrazione distruttiva, `migrate:fresh`, `db:wipe`, `key:generate` o sostituzione di schema sul database produttivo.
4. Un solo commit per ogni rilascio coordinato che modifica PitMetric/Coolify, preceduto da test e possibilità di disattivare il collegamento.
5. Trattare README, architettura e roadmap come specifiche **proposte**, da adattare con i test di integrazione e le decisioni aperte.

**Prossimo passo:** Fase 1 della [roadmap](docs/ROADMAP.md): scaffolding Laravel autonomo, modelli e test di isolamento, senza toccare PitMetric.
