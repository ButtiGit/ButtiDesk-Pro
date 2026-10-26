import { Head, router, usePage } from '@inertiajs/react';
import { FlaskConical, Link2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/ui';
import type { SharedProps } from '../lib/types';

export default function Settings() {
    const { desk } = usePage<SharedProps>().props;
    return (
        <>
            <Head title="Impostazioni" />
            <PageHeader
                eyebrow="IL TUO SPAZIO DI LAVORO"
                title="Semplice, fin dalle basi."
                description={
                    desk.demo
                        ? 'Un ambiente indipendente per provare il nuovo ButtiDesk-Pro.'
                        : 'Il tuo account PitMetric, nello spazio dedicato al lavoro.'
                }
            />
            <div className="settings-grid">
                <section className="panel settings-panel">
                    <div className="settings-title">
                        {desk.demo ? (
                            <FlaskConical size={21} />
                        ) : (
                            <ShieldCheck size={21} />
                        )}
                        <h2>
                            {desk.demo
                                ? 'Ambiente dimostrativo'
                                : 'Account e workspace'}
                        </h2>
                    </div>
                    <p>
                        {desk.demo
                            ? 'Ticket, contatti e appuntamenti sono sintetici. Le modifiche ai ticket restano nel database locale.'
                            : 'Identità, abilitazione e ruolo sono verificati da PitMetric. I dati operativi restano separati per workspace.'}
                    </p>
                    <div className="setting-row">
                        <div>
                            <strong>Workspace attivo</strong>
                            <span>I dati di ciascun team sono separati.</span>
                        </div>
                        {desk.demo ? (
                            <select
                                aria-label="Cambia workspace"
                                value={desk.workspace.id}
                                onChange={(e) =>
                                    router.post('/demo/context', {
                                        workspace_id: Number(e.target.value),
                                    })
                                }
                            >
                                {desk.workspaces.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="subtle-chip">
                                {desk.workspace.name}
                            </span>
                        )}
                    </div>
                    {desk.demo ? (
                        <div className="setting-row">
                            <div>
                                <strong>Profilo di prova</strong>
                                <span>
                                    Verifica anche l’esperienza in sola lettura.
                                </span>
                            </div>
                            <select
                                aria-label="Profilo di prova"
                                value={
                                    desk.user.role === 'viewer'
                                        ? 'viewer'
                                        : 'owner'
                                }
                                onChange={(e) =>
                                    router.post('/demo/context', {
                                        profile: e.target.value,
                                    })
                                }
                            >
                                <option value="owner">Amministratore</option>
                                <option value="viewer">Osservatore</option>
                            </select>
                        </div>
                    ) : (
                        <div className="setting-row">
                            <div>
                                <strong>{desk.user.name}</strong>
                                <span>
                                    Il tuo ruolo determina le operazioni
                                    disponibili.
                                </span>
                            </div>
                            <span className="subtle-chip">
                                {desk.canWrite
                                    ? 'Accesso operativo'
                                    : 'Sola lettura'}
                            </span>
                        </div>
                    )}
                    <div className="setting-row">
                        <div>
                            <strong>Fuso orario</strong>
                            <span>
                                Date e orari mostrati nell’applicazione.
                            </span>
                        </div>
                        <span className="subtle-chip">{desk.timezone}</span>
                    </div>
                </section>
                <section className="panel settings-panel">
                    <div className="settings-title">
                        <Link2 size={21} />
                        <h2>Connessioni</h2>
                    </div>
                    <div className="connection-row">
                        <span className="connection-logo">P</span>
                        <div>
                            <strong>PitMetric</strong>
                            <p>
                                {desk.demo
                                    ? 'La demo locale rimane separata.'
                                    : 'Cambia team o gestisci il tuo account in PitMetric.'}
                            </p>
                        </div>
                        <span className="subtle-chip">
                            {desk.demo ? 'Non collegato' : 'Collegato'}
                        </span>
                    </div>
                    {desk.links.pitmetric && (
                        <a className="button ghost" href={desk.links.pitmetric}>
                            Apri PitMetric
                        </a>
                    )}
                    <div className="connection-row">
                        <LockKeyhole size={23} />
                        <div>
                            <strong>Posta e calendari esterni</strong>
                            <p>Nessuna casella o account esterno connesso.</p>
                        </div>
                    </div>
                    <div className="info-banner">
                        <ShieldCheck size={19} />
                        <span>
                            {desk.demo
                                ? 'Questa demo non utilizza credenziali o dati del sito PitMetric.'
                                : 'L’accesso a ButtiDesk-Pro è riservato agli editor e agli account abilitati da Studio → Utenti.'}
                        </span>
                    </div>
                </section>
            </div>
        </>
    );
}
