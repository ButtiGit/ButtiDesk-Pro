import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, Clock3, Printer, Wrench } from 'lucide-react';
import { Field, PageHeader, Priority, StatusBadge } from '../components/ui';
import {
    date,
    duration,
    localToday,
    statuses,
    ticketCode,
} from '../lib/format';
import type { SharedProps, Ticket } from '../lib/types';

export default function TicketShow({ ticket }: { ticket: Ticket }) {
    const { desk } = usePage<SharedProps>().props;
    const statusForm = useForm({ status: ticket.status });
    const form = useForm({
        summary: '',
        details: '',
        duration_minutes: '30',
        performed_date: localToday(),
    });
    return (
        <>
            <Head title={ticketCode(ticket.id)} />
            <Link className="back-link" href="/tickets">
                <ArrowLeft size={16} />
                Tutti i ticket
            </Link>
            <PageHeader
                eyebrow={`${ticketCode(ticket.id)} / ${ticket.category}`}
                title={ticket.title}
                description={
                    ticket.client?.name ?? 'Richiesta senza cliente associato'
                }
                action={
                    <button
                        className="button ghost no-print"
                        onClick={() => window.print()}
                    >
                        <Printer size={16} />
                        Stampa rapportino
                    </button>
                }
            />
            <div className="detail-layout">
                <div className="detail-main">
                    <section className="panel detail-description">
                        <div className="detail-badges">
                            <StatusBadge status={ticket.status} />
                            <Priority value={ticket.priority} />
                        </div>
                        <h2>La richiesta</h2>
                        <p className="preserve-lines">
                            {ticket.description ||
                                'Nessuna descrizione aggiunta.'}
                        </p>
                    </section>
                    <section className="panel">
                        <div className="panel-heading">
                            <div>
                                <span className="eyebrow">IL LAVORO FATTO</span>
                                <h2>
                                    Interventi{' '}
                                    <span className="count-pill">
                                        {ticket.worklogs?.length ?? 0}
                                    </span>
                                </h2>
                            </div>
                            <span className="time-total">
                                <Clock3 size={16} />
                                {duration(ticket.worklogs_sum_duration_minutes)}
                            </span>
                        </div>
                        <div className="timeline">
                            {ticket.worklogs?.length ? (
                                ticket.worklogs.map((log) => (
                                    <article
                                        key={log.id}
                                        className="timeline-item"
                                    >
                                        <span className="timeline-dot">
                                            <Wrench size={14} />
                                        </span>
                                        <div>
                                            <div className="timeline-meta">
                                                <span>
                                                    {date(log.performed_at, {
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                <strong>
                                                    {duration(
                                                        log.duration_minutes,
                                                    )}
                                                </strong>
                                            </div>
                                            <h3>{log.summary}</h3>
                                            {log.details && (
                                                <p className="preserve-lines">
                                                    {log.details}
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="empty-inline">
                                    Nessun intervento registrato. Il prossimo
                                    passo parte da qui.
                                </div>
                            )}
                        </div>
                    </section>
                    {desk.canWrite && (
                        <form
                            className="panel form-panel no-print"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(`/tickets/${ticket.id}/worklogs`, {
                                    preserveScroll: true,
                                    onSuccess: () =>
                                        form.reset('summary', 'details'),
                                });
                            }}
                        >
                            <h2>Registra un intervento</h2>
                            <Field
                                label="Cosa hai fatto? *"
                                name="summary"
                                error={form.errors.summary}
                            >
                                <input
                                    id="summary"
                                    required
                                    maxLength={180}
                                    value={form.data.summary}
                                    placeholder="Es. Analisi del problema e primo test"
                                    onChange={(e) =>
                                        form.setData('summary', e.target.value)
                                    }
                                />
                            </Field>
                            <div className="form-grid">
                                <Field
                                    label="Durata in minuti *"
                                    name="duration_minutes"
                                    error={form.errors.duration_minutes}
                                >
                                    <input
                                        id="duration_minutes"
                                        type="number"
                                        min={1}
                                        max={1440}
                                        required
                                        value={form.data.duration_minutes}
                                        onChange={(e) =>
                                            form.setData(
                                                'duration_minutes',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Data *"
                                    name="performed_date"
                                    error={form.errors.performed_date}
                                >
                                    <input
                                        id="performed_date"
                                        type="date"
                                        required
                                        max={localToday()}
                                        value={form.data.performed_date}
                                        onChange={(e) =>
                                            form.setData(
                                                'performed_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                            <Field
                                label="Dettagli"
                                name="details"
                                error={form.errors.details}
                            >
                                <textarea
                                    id="details"
                                    rows={3}
                                    value={form.data.details}
                                    onChange={(e) =>
                                        form.setData('details', e.target.value)
                                    }
                                />
                            </Field>
                            <div className="form-actions">
                                <button
                                    className="button primary"
                                    disabled={form.processing}
                                >
                                    <Check size={16} />
                                    {form.processing
                                        ? 'Salvataggio…'
                                        : 'Salva intervento'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                <aside className="detail-aside">
                    <section className="panel detail-info">
                        <h2>Dettagli ticket</h2>
                        <dl>
                            <div>
                                <dt>Cliente</dt>
                                <dd>{ticket.client?.name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt>Fornitore</dt>
                                <dd>{ticket.supplier?.name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt>Creato il</dt>
                                <dd>
                                    {date(ticket.created_at, {
                                        year: 'numeric',
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt>Scadenza</dt>
                                <dd>
                                    {date(ticket.due_at, { year: 'numeric' })}
                                </dd>
                            </div>
                            {ticket.closed_at && (
                                <div>
                                    <dt>Risolto il</dt>
                                    <dd>
                                        {date(ticket.closed_at, {
                                            year: 'numeric',
                                        })}
                                    </dd>
                                </div>
                            )}
                        </dl>
                        {desk.canWrite && (
                            <form
                                className="status-form no-print"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    statusForm.patch(
                                        `/tickets/${ticket.id}/status`,
                                        { preserveScroll: true },
                                    );
                                }}
                            >
                                <Field
                                    label="Aggiorna stato"
                                    name="status"
                                    error={statusForm.errors.status}
                                >
                                    <select
                                        id="status"
                                        value={statusForm.data.status}
                                        onChange={(e) =>
                                            statusForm.setData(
                                                'status',
                                                e.target
                                                    .value as Ticket['status'],
                                            )
                                        }
                                    >
                                        {Object.entries(statuses).map(
                                            ([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </Field>
                                <button
                                    className="button ghost"
                                    disabled={statusForm.processing}
                                >
                                    Aggiorna stato
                                </button>
                            </form>
                        )}
                    </section>
                    <div className="detail-tip">
                        <span className="blue-dot" />
                        <p>
                            Registra gli interventi man mano. Il rapportino si
                            aggiorna insieme al tuo lavoro.
                        </p>
                    </div>
                </aside>
            </div>
        </>
    );
}
