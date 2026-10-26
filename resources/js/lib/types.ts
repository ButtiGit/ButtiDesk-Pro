export type TicketStatus =
    'open' | 'progress' | 'waiting' | 'done' | 'cancelled';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export interface Contact {
    id: number;
    name: string;
    company: string | null;
    type: 'client' | 'supplier' | 'both';
    email: string | null;
    phone: string | null;
    notes: string | null;
}
export interface Ticket {
    id: number;
    title: string;
    description: string | null;
    category: string;
    status: TicketStatus;
    priority: TicketPriority;
    due_at: string | null;
    closed_at: string | null;
    created_at: string;
    client: Contact | null;
    supplier?: Contact | null;
    worklogs_sum_duration_minutes: number | string | null;
    worklogs?: Worklog[];
}
export interface Worklog {
    id: number;
    summary: string;
    details: string | null;
    duration_minutes: number;
    performed_at: string;
    ticket?: Ticket;
}
export interface Appointment {
    id: number;
    title: string;
    location: string | null;
    starts_at: string;
    ends_at: string;
    contact: Contact | null;
    ticket?: Ticket | null;
}
export interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}
export interface SharedProps {
    [key: string]: unknown;
    desk: {
        user: { name: string; role: string };
        workspace: { id: number; name: string };
        workspaces: { id: number; name: string }[];
        canWrite: boolean;
        demo: boolean;
        links: { pitmetric: string | null };
        timezone: string;
    };
    flash: { success: string | null };
    errors: Record<string, string>;
}
