import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import TicketTable from '../components/TicketTable';
import { NewTicketButton, PageHeader, Pager } from '../components/ui';
import { priorities, statuses } from '../lib/format';
import type {
    Pagination,
    SharedProps,
    Ticket,
    TicketPriority,
    TicketStatus,
} from '../lib/types';

interface Props {
    tickets: Pagination<Ticket>;
    filters: { q?: string; status?: TicketStatus; priority?: TicketPriority };
    counts: Partial<Record<TicketStatus, number>>;
}
export default function Tickets({ tickets, filters, counts }: Props) {
    const { desk, errors } = usePage<SharedProps>().props;
    const [q, setQ] = useState(filters.q ?? '');
    function search(event: FormEvent) {
        event.preventDefault();
        router.get('/tickets', { ...filters, q }, { preserveState: true });
    }
    return (
        <>
            <Head title="Ticket" />
            <PageHeader
                eyebrow="IL LAVORO, ORGANIZZATO"
                title="Le tue richieste."
                description="Dal primo contatto alla soluzione. Una vista chiara su ogni ticket."
                action={desk.canWrite && <NewTicketButton />}
            />
            <div className="tabs" aria-label="Filtra per stato">
                <Link
                    href="/tickets"
                    className={!filters.status ? 'selected' : ''}
                >
                    Tutti{' '}
                    <span>
                        {Object.values(counts).reduce(
                            (sum, count) => sum + Number(count),
                            0,
                        )}
                    </span>
                </Link>
                {Object.entries(statuses)
                    .filter(([key]) => key !== 'cancelled')
                    .map(([key, label]) => (
                        <Link
                            key={key}
                            href={`/tickets?status=${key}`}
                            className={filters.status === key ? 'selected' : ''}
                        >
                            {label}
                            <span>{counts[key as TicketStatus] ?? 0}</span>
                        </Link>
                    ))}
            </div>
            <section className="panel">
                <div className="filter-toolbar">
                    <form className="search-field" onSubmit={search}>
                        <Search size={17} />
                        <input
                            aria-label="Cerca titolo o categoria"
                            placeholder="Cerca per titolo o categoria…"
                            value={q}
                            maxLength={120}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <button type="submit" className="text-link">
                            Cerca
                        </button>
                    </form>
                    <div className="filter-select">
                        <SlidersHorizontal size={16} />
                        <select
                            aria-label="Filtra per priorità"
                            value={filters.priority ?? ''}
                            onChange={(e) =>
                                router.get('/tickets', {
                                    ...filters,
                                    priority: e.target.value,
                                })
                            }
                        >
                            <option value="">Tutte le priorità</option>
                            {Object.entries(priorities).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {(filters.q || filters.status || filters.priority) && (
                        <Link
                            href="/tickets"
                            className="icon-button"
                            aria-label="Azzera filtri"
                        >
                            <X size={17} />
                        </Link>
                    )}
                </div>
                {errors.q && (
                    <p className="field-error toolbar-error" role="alert">
                        {errors.q}
                    </p>
                )}
                <TicketTable tickets={tickets.data} />
                <Pager page={tickets} />
            </section>
        </>
    );
}
