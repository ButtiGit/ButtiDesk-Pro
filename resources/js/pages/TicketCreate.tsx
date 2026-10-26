import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Field, PageHeader } from '../components/ui';
import { priorities } from '../lib/format';
import type { Contact } from '../lib/types';

export default function TicketCreate({ contacts }: { contacts: Contact[] }) {
    const form = useForm({
        title: '',
        description: '',
        category: 'Assistenza',
        priority: 'normal',
        client_id: '',
        supplier_id: '',
        due_date: '',
    });
    return (
        <>
            <Head title="Nuovo ticket" />
            <Link href="/tickets" className="back-link">
                <ArrowLeft size={16} />
                Torna ai ticket
            </Link>
            <PageHeader
                eyebrow="UNA RICHIESTA, UN PUNTO DI PARTENZA"
                title="Di cosa ci occupiamo?"
                description="Bastano le informazioni essenziali. Il resto si costruisce lavorando."
            />
            <div className="form-layout">
                <form
                    className="panel form-panel"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/tickets');
                    }}
                >
                    <h2>Nuovo ticket</h2>
                    <Field
                        label="Titolo *"
                        name="title"
                        error={form.errors.title}
                    >
                        <input
                            id="title"
                            autoFocus
                            required
                            maxLength={180}
                            placeholder="Es. Ripristinare l’accesso al portale clienti"
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            aria-invalid={!!form.errors.title}
                            aria-describedby={
                                form.errors.title ? 'title-error' : undefined
                            }
                        />
                    </Field>
                    <Field
                        label="Descrizione"
                        name="description"
                        error={form.errors.description}
                    >
                        <textarea
                            id="description"
                            rows={5}
                            maxLength={10000}
                            placeholder="Cosa serve, cosa succede e qual è il risultato atteso?"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                    </Field>
                    <div className="form-grid">
                        <Field
                            label="Categoria"
                            name="category"
                            error={form.errors.category}
                        >
                            <select
                                id="category"
                                value={form.data.category}
                                onChange={(e) =>
                                    form.setData('category', e.target.value)
                                }
                            >
                                {[
                                    'Assistenza',
                                    'Sviluppo',
                                    'Manutenzione',
                                    'Consulenza',
                                ].map((v) => (
                                    <option key={v}>{v}</option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Priorità"
                            name="priority"
                            error={form.errors.priority}
                        >
                            <select
                                id="priority"
                                value={form.data.priority}
                                onChange={(e) =>
                                    form.setData('priority', e.target.value)
                                }
                            >
                                {Object.entries(priorities).map(
                                    ([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </Field>
                        <Field
                            label="Cliente"
                            name="client_id"
                            error={form.errors.client_id}
                        >
                            <select
                                id="client_id"
                                value={form.data.client_id}
                                onChange={(e) =>
                                    form.setData('client_id', e.target.value)
                                }
                            >
                                <option value="">Nessun cliente</option>
                                {contacts
                                    .filter((c) => c.type !== 'supplier')
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                            </select>
                        </Field>
                        <Field
                            label="Fornitore"
                            name="supplier_id"
                            error={form.errors.supplier_id}
                        >
                            <select
                                id="supplier_id"
                                value={form.data.supplier_id}
                                onChange={(e) =>
                                    form.setData('supplier_id', e.target.value)
                                }
                            >
                                <option value="">Nessun fornitore</option>
                                {contacts
                                    .filter((c) => c.type !== 'client')
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                            </select>
                        </Field>
                        <Field
                            label="Scadenza"
                            name="due_date"
                            error={form.errors.due_date}
                            hint="La giornata termina nel fuso Europe/Rome."
                        >
                            <input
                                id="due_date"
                                type="date"
                                value={form.data.due_date}
                                onChange={(e) =>
                                    form.setData('due_date', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <div className="form-actions">
                        <Link className="button ghost" href="/tickets">
                            Annulla
                        </Link>
                        <button
                            className="button primary"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Creazione…' : 'Crea ticket'}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </form>
                <aside className="form-aside">
                    <span className="aside-icon">
                        <ShieldCheck size={23} />
                    </span>
                    <h2>Il contesto giusto.</h2>
                    <p>
                        Il ticket sarà visibile solo in questo workspace.
                        Cliente e fornitore devono appartenere alla stessa
                        rubrica.
                    </p>
                    <div className="aside-divider" />
                    <h3>Stai usando dati di prova</h3>
                    <p>
                        Puoi creare ticket e registrare interventi liberamente.
                        Non partiranno email o notifiche esterne.
                    </p>
                </aside>
            </div>
        </>
    );
}
