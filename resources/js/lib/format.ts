import type { TicketPriority, TicketStatus } from './types';

export const statuses: Record<TicketStatus, string> = {
    open: 'Aperto',
    progress: 'In lavorazione',
    waiting: 'In attesa',
    done: 'Risolto',
    cancelled: 'Annullato',
};
export const priorities: Record<TicketPriority, string> = {
    low: 'Bassa',
    normal: 'Normale',
    high: 'Alta',
    urgent: 'Urgente',
};
export const contactTypes = {
    client: 'Cliente',
    supplier: 'Fornitore',
    both: 'Cliente e fornitore',
};
let displayTimezone = 'Europe/Rome';
export function configureTimezone(timezone: string) {
    displayTimezone = timezone;
}
export function date(
    value: string | null,
    options: Intl.DateTimeFormatOptions = {},
    timezone = displayTimezone,
) {
    return value
        ? new Intl.DateTimeFormat('it-IT', {
              day: '2-digit',
              month: 'short',
              timeZone: timezone,
              ...options,
          }).format(new Date(value))
        : 'Nessuna scadenza';
}
export function time(value: string, timezone = displayTimezone) {
    return date(
        value,
        {
            day: undefined,
            month: undefined,
            hour: '2-digit',
            minute: '2-digit',
        },
        timezone,
    );
}
export function duration(minutes: number | string | null) {
    const value = Number(minutes || 0);
    return `${Math.floor(value / 60)}h ${String(value % 60).padStart(2, '0')}m`;
}
export function ticketCode(id: number) {
    return `BD-${String(id).padStart(4, '0')}`;
}
export function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('');
}
export function localDate(value: string | Date) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: displayTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(value));
}
export function localToday() {
    return localDate(new Date());
}
