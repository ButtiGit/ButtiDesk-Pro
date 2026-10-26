import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { EmptyState, PageHeader } from '../components/ui';
import { date, time, ticketCode, localDate, localToday } from '../lib/format';
import type { Appointment, SharedProps } from '../lib/types';

export default function Calendar({
    weekStart,
    appointments,
}: {
    weekStart: string;
    appointments: Appointment[];
}) {
    const { desk } = usePage<SharedProps>().props;
    const start = new Date(`${weekStart}T12:00:00Z`);
    function offset(days: number) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    }
    return (
        <>
            <Head title="Calendario" />
            <PageHeader
                eyebrow="IL TEMPO, BEN SPESO"
                title="Spazio ai prossimi passi."
                description="Una settimana alla volta, con tutti gli impegni del workspace."
            />
            <section className="panel calendar-panel">
                <div className="panel-heading">
                    <h2>
                        {date(start.toISOString(), {
                            day: 'numeric',
                            month: 'long',
                        })}{' '}
                        —{' '}
                        {date(`${offset(6)}T12:00:00Z`, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </h2>
                    <div className="calendar-controls">
                        <Link
                            className="button ghost compact"
                            href={`/calendar?week=${offset(-7)}`}
                            aria-label="Settimana precedente"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <Link className="button ghost compact" href="/calendar">
                            Oggi
                        </Link>
                        <Link
                            className="button ghost compact"
                            href={`/calendar?week=${offset(7)}`}
                            aria-label="Settimana successiva"
                        >
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
                <div className="calendar-days">
                    {Array.from({ length: 7 }, (_, day) => {
                        const key = offset(day);
                        const events = appointments.filter(
                            (a) =>
                                localDate(a.starts_at) <= key &&
                                localDate(a.ends_at) >= key,
                        );
                        const today = key === localToday();
                        return (
                            <div
                                className={`calendar-day ${today ? 'is-today' : ''}`}
                                key={key}
                            >
                                <div className="day-heading">
                                    <span>
                                        {date(`${key}T12:00:00Z`, {
                                            weekday: 'short',
                                            day: undefined,
                                            month: undefined,
                                        })}
                                    </span>
                                    <strong>{Number(key.slice(-2))}</strong>
                                </div>
                                <div className="day-events">
                                    {events.map((event) => (
                                        <article
                                            className="calendar-event"
                                            key={event.id}
                                        >
                                            <span>
                                                {time(event.starts_at)} —{' '}
                                                {time(event.ends_at)}
                                            </span>
                                            <h3>{event.title}</h3>
                                            <p>{event.contact?.name}</p>
                                            {event.location && (
                                                <small>
                                                    <MapPin size={12} />
                                                    {event.location}
                                                </small>
                                            )}
                                            {event.ticket && (
                                                <Link
                                                    href={`/tickets/${event.ticket.id}`}
                                                >
                                                    {ticketCode(
                                                        event.ticket.id,
                                                    )}{' '}
                                                    <ArrowRight size={12} />
                                                </Link>
                                            )}
                                        </article>
                                    ))}
                                    {!events.length && (
                                        <span className="free-day">
                                            Nessun impegno
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {!appointments.length && (
                    <EmptyState
                        title="Una settimana libera"
                        description="Non ci sono appuntamenti di esempio in questo periodo."
                    />
                )}
            </section>
            <p className="page-footnote">
                Orari {desk.timezone}. Gli appuntamenti sono dimostrativi;
                sincronizzazione e modifica arriveranno in una fase successiva.
            </p>
        </>
    );
}
