import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Inbox, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Pagination, TicketPriority, TicketStatus } from '../lib/types';
import { priorities, statuses } from '../lib/format';

export function PageHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="page-heading">
            <div>
                {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                <h1>{title}</h1>
                {description && (
                    <p className="page-description">{description}</p>
                )}
            </div>
            {action && <div className="heading-actions">{action}</div>}
        </div>
    );
}
export function NewTicketButton() {
    return (
        <Link href="/tickets/create" className="button primary">
            <Plus size={17} />
            Nuovo ticket
        </Link>
    );
}
export function StatusBadge({ status }: { status: TicketStatus }) {
    return (
        <span className={`badge status-${status}`}>
            <span className="badge-dot" />
            {statuses[status]}
        </span>
    );
}
export function Priority({ value }: { value: TicketPriority }) {
    return (
        <span className={`priority priority-${value}`}>
            <span className="priority-bars">
                <i />
                <i />
                <i />
            </span>
            {priorities[value]}
        </span>
    );
}
export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="empty-state">
            <span className="empty-icon">
                <Inbox size={25} />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    );
}
export function Pager<T>({ page }: { page: Pagination<T> }) {
    if (!page.total) return null;
    return (
        <div className="pagination">
            <span>
                {page.from}–{page.to} di {page.total}
            </span>
            <div>
                {page.prev_page_url ? (
                    <Link
                        className="button ghost compact"
                        href={page.prev_page_url}
                        aria-label="Pagina precedente"
                    >
                        <ArrowLeft size={15} />
                    </Link>
                ) : (
                    <button
                        className="button ghost compact"
                        disabled
                        aria-label="Pagina precedente"
                    >
                        <ArrowLeft size={15} />
                    </button>
                )}
                <span>
                    {page.current_page} / {page.last_page}
                </span>
                {page.next_page_url ? (
                    <Link
                        className="button ghost compact"
                        href={page.next_page_url}
                        aria-label="Pagina successiva"
                    >
                        <ArrowRight size={15} />
                    </Link>
                ) : (
                    <button
                        className="button ghost compact"
                        disabled
                        aria-label="Pagina successiva"
                    >
                        <ArrowRight size={15} />
                    </button>
                )}
            </div>
        </div>
    );
}
export function Field({
    label,
    name,
    error,
    children,
    hint,
}: {
    label: string;
    name: string;
    error?: string;
    children: ReactNode;
    hint?: string;
}) {
    return (
        <div className="field">
            <label htmlFor={name}>{label}</label>
            {children}
            {hint && <small id={`${name}-hint`}>{hint}</small>}
            {error && (
                <span className="field-error" id={`${name}-error`} role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}
