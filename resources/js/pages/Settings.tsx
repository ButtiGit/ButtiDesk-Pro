import { Head, router, usePage } from '@inertiajs/react';
import {
    Check,
    FlaskConical,
    Link2,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
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
                description="Un ambiente indipendente per provare il nuovo ButtiDesk-Pro."
            />
            <div className="settings-grid">
                <section className="panel settings-panel">
                    <div className="settings-title">
                        <FlaskConical size={21} />
                        <h2>Ambiente dimostrativo</h2>
                    </div>
                    <p>
                        Ticket, contatti e appuntamenti sono sintetici. Le
                        modifiche ai ticket restano nel database locale.
                    </p>
                    <div className="setting-row">
                        <div>
                            <strong>Workspace attivo</strong>
                            <span>I dati di ciascun team sono separati.</span>
                        </div>
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
                    </div>
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
                                desk.user.role === 'viewer' ? 'viewer' : 'owner'
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
                            <p>Integrazione prevista in una fase successiva.</p>
                        </div>
                        <span className="subtle-chip">Non collegato</span>
                    </div>
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
                            Questa demo non utilizza credenziali o dati del sito
                            PitMetric.
                        </span>
                    </div>
                </section>
                <section className="panel settings-panel foundation-panel">
                    <div>
                        <span className="eyebrow">FASE 1 / FONDAMENTA</span>
                        <h2>Una base pronta a crescere.</h2>
                        <p>
                            Un solo progetto, dal backend all’interfaccia.
                            Costruito per restare veloce e facile da mantenere.
                        </p>
                    </div>
                    <ul>
                        {[
                            'Laravel 13 + PHP 8.4',
                            'React + TypeScript + Inertia',
                            'Tema blu, chiaro e scuro',
                            'Database locale e workspace isolati',
                        ].map((item) => (
                            <li key={item}>
                                <Check size={15} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </>
    );
}
