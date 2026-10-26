import { Head, Link, useForm } from '@inertiajs/react';
import { Clock3, Printer } from 'lucide-react';
import { EmptyState, Field, PageHeader, Pager } from '../components/ui';
import { date, duration, ticketCode } from '../lib/format';
import type { Pagination, Worklog } from '../lib/types';

export default function Reports({
    logs,
    minutes,
    filters,
}: {
    logs: Pagination<Worklog>;
    minutes: number;
    filters: { from: string; to: string };
}) {
    const form = useForm(filters);
    return (
        <>
            <Head title="Interventi e report" />
            <PageHeader
                eyebrow="QUELLO CHE HAI COSTRUITO"
                title="Il lavoro prende forma."
                description="Un riepilogo semplice delle attività e del tempo dedicato."
                action={
                    <button
                        className="button ghost no-print"
                        onClick={() => window.print()}
                    >
                        <Printer size={16} />
                        Stampa riepilogo
                    </button>
                }
            />
            <section className="panel report-summary">
                <div>
                    <span className="stat-icon blue">
                        <Clock3 size={19} />
                    </span>
                    <div>
                        <span className="secondary">Tempo nel periodo</span>
                        <strong>{duration(minutes)}</strong>
                    </div>
                </div>
                <div className="report-count">
                    <strong>{logs.total}</strong>
                    <span>interventi registrati</span>
                </div>
                <form
                    className="date-filters no-print"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.get('/reports', { preserveState: true });
                    }}
                >
                    <Field label="Dal" name="from" error={form.errors.from}>
                        <input
                            id="from"
                            type="date"
                            required
                            value={form.data.from}
                            onChange={(e) =>
                                form.setData('from', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="Al" name="to" error={form.errors.to}>
                        <input
                            id="to"
                            type="date"
                            required
                            min={form.data.from}
                            value={form.data.to}
                            onChange={(e) => form.setData('to', e.target.value)}
                        />
                    </Field>
                    <button className="button ghost" disabled={form.processing}>
                        Applica
                    </button>
                </form>
            </section>
            <section className="panel">
                <div className="panel-heading">
                    <h2>Registro interventi</h2>
                    <span className="secondary">
                        {date(`${filters.from}T12:00:00Z`)} —{' '}
                        {date(`${filters.to}T12:00:00Z`, { year: 'numeric' })}
                    </span>
                </div>
                {logs.data.length ? (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Attività / ticket</th>
                                    <th>Cliente</th>
                                    <th className="align-right">Durata</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((log) => (
                                    <tr key={log.id}>
                                        <td className="nowrap secondary">
                                            {date(log.performed_at, {
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td>
                                            <strong>{log.summary}</strong>
                                            {log.ticket && (
                                                <Link
                                                    href={`/tickets/${log.ticket.id}`}
                                                    className="cell-secondary"
                                                >
                                                    {ticketCode(log.ticket.id)}{' '}
                                                    · {log.ticket.title}
                                                </Link>
                                            )}
                                        </td>
                                        <td className="secondary">
                                            {log.ticket?.client?.name ?? '—'}
                                        </td>
                                        <td className="align-right duration-cell">
                                            {duration(log.duration_minutes)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="Nessun intervento nel periodo"
                        description="Prova un intervallo diverso o registra il primo intervento da un ticket."
                    />
                )}
                <Pager page={logs} />
            </section>
            <p className="page-footnote print-note">
                Il riepilogo stampa la pagina corrente del registro. Per un
                rapportino completo del singolo ticket usa “Stampa rapportino”
                nel dettaglio.
            </p>
        </>
    );
}
