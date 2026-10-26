import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Mail, Search, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { EmptyState, PageHeader, Pager } from '../components/ui';
import { contactTypes, initials } from '../lib/format';
import type { Contact, Pagination, SharedProps } from '../lib/types';

export default function Contacts({
    contacts,
    filters,
}: {
    contacts: Pagination<Contact>;
    filters: { q?: string; type?: string };
}) {
    const [q, setQ] = useState(filters.q ?? '');
    const { errors } = usePage<SharedProps>().props;
    function submit(e: FormEvent) {
        e.preventDefault();
        router.get('/contacts', { ...filters, q }, { preserveState: true });
    }
    return (
        <>
            <Head title="Rubrica" />
            <PageHeader
                eyebrow="LE PERSONE, AL CENTRO"
                title="La tua rete di lavoro."
                description="Clienti e fornitori, riuniti nella rubrica del workspace."
                action={
                    <span className="subtle-chip">
                        <Users size={15} />
                        {contacts.total} contatti
                    </span>
                }
            />
            <div className="panel contact-toolbar">
                <form className="search-field" onSubmit={submit}>
                    <Search size={17} />
                    <input
                        aria-label="Cerca contatti"
                        value={q}
                        maxLength={120}
                        placeholder="Cerca un nome o un’azienda…"
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <button className="text-link">Cerca</button>
                </form>
                <select
                    aria-label="Tipo di contatto"
                    value={filters.type ?? ''}
                    onChange={(e) =>
                        router.get('/contacts', {
                            ...filters,
                            type: e.target.value,
                        })
                    }
                >
                    <option value="">Clienti e fornitori</option>
                    {Object.entries(contactTypes).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
            {errors.q && (
                <p className="field-error" role="alert">
                    {errors.q}
                </p>
            )}
            {contacts.data.length ? (
                <div className="contact-grid">
                    {contacts.data.map((contact, index) => (
                        <article
                            className="panel contact-card"
                            key={contact.id}
                        >
                            <div className="contact-card-top">
                                <span
                                    className={`contact-avatar tone-${index % 4}`}
                                >
                                    {initials(contact.name)}
                                </span>
                                <span className="subtle-chip">
                                    {contactTypes[contact.type]}
                                </span>
                            </div>
                            <h2>{contact.name}</h2>
                            <p className="contact-company">
                                <Building2 size={14} />
                                {contact.company ?? 'Nessuna azienda'}
                            </p>
                            <div className="contact-email">
                                <Mail size={15} />
                                <span>{contact.email ?? 'Nessuna email'}</span>
                            </div>
                            <p className="contact-notes">{contact.notes}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <section className="panel">
                    <EmptyState
                        title="Nessun contatto trovato"
                        description="Prova un nome diverso o rimuovi il filtro."
                    />
                </section>
            )}
            <Pager page={contacts} />
            <p className="page-footnote">
                Rubrica di esempio in sola lettura. La gestione completa dei
                contatti è prevista nella prossima fase.
            </p>
        </>
    );
}
