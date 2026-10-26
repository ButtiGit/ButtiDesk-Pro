import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { date, ticketCode } from '../lib/format';
import type { Ticket } from '../lib/types';
import { EmptyState, Priority, StatusBadge } from './ui';

export default function TicketTable({ tickets }: { tickets: Ticket[] }) {
    if (!tickets.length)
        return (
            <EmptyState
                title="Nessun ticket qui"
                description="Prova a cambiare i filtri oppure crea la prima richiesta."
            />
        );
    return (
        <div className="table-scroll">
            <table className="ticket-table">
                <thead>
                    <tr>
                        <th>Ticket / cliente</th>
                        <th>Stato</th>
                        <th>Priorità</th>
                        <th>Scadenza</th>
                        <th>
                            <span className="sr-only">Apri</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map((ticket) => (
                        <tr key={ticket.id}>
                            <td>
                                <span className="code">
                                    {ticketCode(ticket.id)}
                                </span>
                                <Link
                                    className="ticket-title"
                                    href={`/tickets/${ticket.id}`}
                                >
                                    {ticket.title}
                                </Link>
                                <span className="cell-secondary">
                                    {ticket.client?.name ?? 'Nessun cliente'}
                                    <span className="separator">·</span>
                                    {ticket.category}
                                </span>
                            </td>
                            <td>
                                <StatusBadge status={ticket.status} />
                            </td>
                            <td>
                                <Priority value={ticket.priority} />
                            </td>
                            <td className="nowrap">
                                <span
                                    className={
                                        ticket.due_at &&
                                        new Date(ticket.due_at) < new Date() &&
                                        !['done', 'cancelled'].includes(
                                            ticket.status,
                                        )
                                            ? 'overdue'
                                            : 'secondary'
                                    }
                                >
                                    {date(ticket.due_at)}
                                </span>
                            </td>
                            <td>
                                <Link
                                    className="table-open"
                                    href={`/tickets/${ticket.id}`}
                                    aria-label={`Apri ${ticketCode(ticket.id)}`}
                                >
                                    <ArrowUpRight size={17} />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
