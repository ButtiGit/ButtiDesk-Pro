import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    CheckCheck,
    ChevronRight,
    CircleAlert,
    ClipboardList,
    Clock3,
    Plus,
    Users,
} from 'lucide-react';
import { date, duration, time, localDate, localToday } from '../lib/format';
import type { Appointment, SharedProps, Ticket } from '../lib/types';
import TicketTable from '../components/TicketTable';
import { EmptyState, NewTicketButton, PageHeader } from '../components/ui';

interface Props {
    stats: {
        active: number;
        urgent: number;
        minutes: number;
        contacts: number;
        done: number;
        total: number;
    };
    tickets: Ticket[];
    appointments: Appointment[];
    activity: { date: string; minutes: number }[];
}
export default function Dashboard({
    stats,
    tickets,
    appointments,
    activity,
}: Props) {
    const { desk } = usePage<SharedProps>().props;
    const max = Math.max(...activity.map((day) => day.minutes), 60);
    const percentage = stats.total
        ? Math.round((stats.done / stats.total) * 100)
        : 0;
    const cards = [
        {
            label: 'Ticket attivi',
            value: stats.active,
            note: 'Richieste da seguire',
            icon: ClipboardList,
            href: '/tickets',
            tone: 'blue',
        },
        {
            label: 'Priorità urgente',
            value: stats.urgent,
            note: 'Da prendere in carico',
            icon: CircleAlert,
            href: '/tickets?priority=urgent',
            tone: 'amber',
        },
        {
            label: 'Tempo registrato',
            value: duration(stats.minutes),
            note: 'Nel mese in corso',
            icon: Clock3,
            href: '/reports',
            tone: 'purple',
        },
        {
            label: 'La tua rubrica',
            value: stats.contacts,
            note: 'Clienti e fornitori',
            icon: Users,
            href: '/contacts',
            tone: 'green',
        },
    ];
    return (
        <>
            <Head title="Panoramica" />
            <PageHeader
                eyebrow="IL TUO CENTRO OPERATIVO"
                title={`Tutto sotto controllo, ${desk.user.name.split(' ')[0]}.`}
                description="Richieste, persone e attività. Il tuo lavoro parte da qui."
                action={desk.canWrite && <NewTicketButton />}
            />
            <div className="overview-strip">
                <span>
                    <span className="live-dot" />
                    {desk.workspace.name}
                </span>
                <span>
                    {date(new Date().toISOString(), {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </span>
            </div>
            <div className="stat-grid">
                {cards.map(({ label, value, note, icon: Icon, href, tone }) => (
                    <Link href={href} key={label} className="stat-card">
                        <div className="stat-top">
                            <span>{label}</span>
                            <span className={`stat-icon ${tone}`}>
                                <Icon size={18} />
                            </span>
                        </div>
                        <strong className="stat-value">{value}</strong>
                        <div className="stat-bottom">
                            <span>{note}</span>
                            <ArrowUpRight size={15} />
                        </div>
                    </Link>
                ))}
            </div>
            <div className="dashboard-grid">
                <section className="panel priority-panel">
                    <div className="panel-heading">
                        <div>
                            <span className="eyebrow">FOCUS DI OGGI</span>
                            <h2>
                                Da tenere d’occhio{' '}
                                <span className="count-pill">
                                    {stats.active}
                                </span>
                            </h2>
                        </div>
                        <Link href="/tickets" className="text-link">
                            Tutti i ticket <ArrowRight size={15} />
                        </Link>
                    </div>
                    <TicketTable tickets={tickets} />
                    <div className="panel-bottom">
                        <span>
                            <span className="blue-dot" /> Prima le richieste più
                            importanti.
                        </span>
                        <Link href="/tickets?status=open">
                            Vedi gli aperti <ChevronRight size={14} />
                        </Link>
                    </div>
                </section>
                <section className="panel agenda-panel">
                    <div className="panel-heading">
                        <div>
                            <span className="eyebrow">IN PROGRAMMA</span>
                            <h2>Prossimi impegni</h2>
                        </div>
                        <CalendarDays size={19} className="secondary" />
                    </div>
                    <div className="agenda-list">
                        {appointments.length ? (
                            appointments.map((appointment) => (
                                <Link
                                    key={appointment.id}
                                    href={`/calendar?week=${localDate(appointment.starts_at)}`}
                                    className="agenda-item"
                                >
                                    <div className="agenda-date">
                                        <strong>
                                            {date(appointment.starts_at, {
                                                day: '2-digit',
                                                month: undefined,
                                            })}
                                        </strong>
                                        <span>
                                            {date(appointment.starts_at, {
                                                day: undefined,
                                                month: 'short',
                                            }).replace('.', '')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="agenda-time">
                                            {time(appointment.starts_at)} —{' '}
                                            {time(appointment.ends_at)}
                                        </span>
                                        <h3>{appointment.title}</h3>
                                        <p>
                                            {appointment.contact?.name ??
                                                appointment.location}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <EmptyState
                                title="Agenda libera"
                                description="Non ci sono appuntamenti in programma."
                            />
                        )}
                    </div>
                    <Link href="/calendar" className="agenda-link">
                        Apri il calendario <ArrowRight size={15} />
                    </Link>
                </section>
                <section className="panel activity-panel">
                    <div className="panel-heading">
                        <div>
                            <span className="eyebrow">PASSO DOPO PASSO</span>
                            <h2>Il ritmo della settimana</h2>
                        </div>
                        <span className="subtle-chip">Lun — Dom</span>
                    </div>
                    <div className="activity-content">
                        <div className="activity-summary">
                            <strong>
                                {duration(
                                    activity.reduce(
                                        (total, day) =>
                                            total + Number(day.minutes),
                                        0,
                                    ),
                                )}
                            </strong>
                            <p>
                                di lavoro registrato
                                <br />
                                questa settimana
                            </p>
                            <Link href="/reports" className="text-link">
                                Esplora gli interventi{' '}
                                <ArrowUpRight size={15} />
                            </Link>
                        </div>
                        <div
                            className="bar-chart"
                            role="img"
                            aria-label="Minuti di lavoro registrati per giorno della settimana"
                        >
                            {activity.map((day) => (
                                <div className="bar-column" key={day.date}>
                                    <span className="bar-value">
                                        {day.minutes > 0
                                            ? `${day.minutes}m`
                                            : '—'}
                                    </span>
                                    <div className="bar-track">
                                        <div
                                            className={
                                                day.date === localToday()
                                                    ? 'bar today'
                                                    : 'bar'
                                            }
                                            style={{
                                                height: `${Math.max((day.minutes / max) * 100, 3)}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="bar-label">
                                        {date(`${day.date}T12:00:00Z`, {
                                            weekday: 'short',
                                            day: undefined,
                                            month: undefined,
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="panel progress-panel">
                    <div className="progress-icon">
                        <CheckCheck size={24} />
                    </div>
                    <span className="eyebrow">UN PASSO AVANTI</span>
                    <h2>
                        Ogni richiesta,
                        <br />
                        una soluzione.
                    </h2>
                    <p>
                        {stats.done} ticket risolti su {stats.total} totali nel
                        workspace.
                    </p>
                    <div className="progress-caption">
                        <span>Ticket risolti</span>
                        <strong>{percentage}%</strong>
                    </div>
                    <div className="progress-track">
                        <div style={{ width: `${percentage}%` }} />
                    </div>
                    <Link href="/tickets?status=done" className="text-link">
                        Guarda il lavoro fatto <ArrowRight size={15} />
                    </Link>
                </section>
            </div>
            <div className="quick-links">
                <span>Da dove iniziamo?</span>
                {desk.canWrite && (
                    <Link href="/tickets/create">
                        <Plus size={16} />
                        Apri una richiesta <ArrowUpRight size={14} />
                    </Link>
                )}
                <Link href="/contacts">
                    <Users size={16} />
                    Trova un contatto <ArrowUpRight size={14} />
                </Link>
                <Link href="/reports">
                    <Clock3 size={16} />
                    Rivedi gli interventi <ArrowUpRight size={14} />
                </Link>
            </div>
        </>
    );
}
