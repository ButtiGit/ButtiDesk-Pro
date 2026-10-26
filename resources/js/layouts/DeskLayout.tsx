import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    Check,
    ChevronDown,
    ChevronsUpDown,
    ClipboardList,
    FlaskConical,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    Mail,
    Menu,
    Moon,
    Plus,
    Search,
    Settings,
    Sun,
    Users,
    X,
    ChartNoAxesCombined,
} from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';
import { initials, configureTimezone } from '../lib/format';
import ProductSwitch from '../components/ProductSwitch';
import type { SharedProps } from '../lib/types';

export default function DeskLayout({ children }: { children: ReactNode }) {
    const { desk, flash, errors } = usePage<SharedProps>().props;
    configureTimezone(desk.timezone);
    const url = usePage().url;
    const menu = useRef<HTMLDialogElement>(null);
    const [light, setLight] = useState(
        () => !document.documentElement.classList.contains('dark'),
    );
    const [toast, setToast] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    useEffect(() => {
        setToast(flash.success);
        if (flash.success) {
            const timer = setTimeout(() => setToast(null), 6500);
            return () => clearTimeout(timer);
        }
    }, [flash]);
    useEffect(() => {
        menu.current?.close();
    }, [url]);
    function toggleTheme() {
        const next = !light;
        setLight(next);
        document.documentElement.classList.toggle('dark', !next);
        try {
            localStorage.setItem('desk.theme', next ? 'light' : 'dark');
        } catch {
            /* Storage may be unavailable. */
        }
    }
    function submitSearch(event: FormEvent) {
        event.preventDefault();
        router.get('/tickets', { q: search });
    }
    const nav = [
        { href: '/', label: 'Panoramica', icon: LayoutDashboard },
        { href: '/tickets', label: 'Ticket', icon: ClipboardList },
        { href: '/contacts', label: 'Rubrica', icon: Users },
        { href: '/calendar', label: 'Calendario', icon: CalendarDays },
        {
            href: '/reports',
            label: 'Interventi e report',
            icon: ChartNoAxesCombined,
        },
    ];
    const sidebar = (
        <>
            <Link
                className="brand"
                href="/"
                aria-label="ButtiDesk-Pro, panoramica"
            >
                <span className="brand-mark">
                    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                        <path
                            d="M7 7h12a5 5 0 0 1 3 9 5 5 0 0 1-3 9H7V7Z"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            d="M8 16h10M14 8v16"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                    </svg>
                </span>
                <span>
                    ButtiDesk<span className="brand-pro">PRO</span>
                </span>
            </Link>
            {desk.links.pitmetric && (
                <ProductSwitch href={desk.links.pitmetric} />
            )}
            <div className="workspace-switch">
                <span className="workspace-avatar">
                    {initials(desk.workspace.name)}
                </span>
                {desk.demo ? (
                    <label>
                        <span>Workspace demo</span>
                        <select
                            aria-label="Workspace demo"
                            value={desk.workspace.id}
                            onChange={(event) =>
                                router.post('/demo/context', {
                                    workspace_id: Number(event.target.value),
                                })
                            }
                        >
                            {desk.workspaces.map((workspace) => (
                                <option key={workspace.id} value={workspace.id}>
                                    {workspace.name}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <div className="workspace-context">
                        <span>Workspace PitMetric</span>
                        <strong>{desk.workspace.name}</strong>
                    </div>
                )}
                {desk.demo && <ChevronsUpDown size={14} />}
            </div>
            <div className="nav-label">OPERATIVITÀ</div>
            <nav aria-label="Navigazione principale">
                {nav.map(({ href, label, icon: Icon }) => {
                    const active =
                        href === '/'
                            ? url.split('?')[0] === '/'
                            : url.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`nav-item ${active ? 'active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                            {active && <span className="nav-indicator" />}
                        </Link>
                    );
                })}
                <div className="nav-item unavailable" aria-disabled="true">
                    <Mail size={18} />
                    <span>Posta</span>
                    <span className="soon">Presto</span>
                </div>
            </nav>
            <div className="sidebar-bottom">
                <div className="demo-note">
                    <div>
                        {desk.demo ? (
                            <FlaskConical size={16} />
                        ) : (
                            <ShieldCheck size={16} />
                        )}
                        <strong>
                            {desk.demo ? 'Spazio di prova' : 'Il tuo workspace'}
                        </strong>
                        <span className="live-dot" />
                    </div>
                    <p>
                        {desk.demo ? (
                            <>
                                Esplora liberamente.
                                <br />
                                Qui tutti i dati sono di esempio.
                            </>
                        ) : (
                            <>
                                Accesso autorizzato da PitMetric.
                                <br />
                                Attività visibili solo al tuo team.
                            </>
                        )}
                    </p>
                    <Link href="/settings">
                        {desk.demo
                            ? 'Scopri l’ambiente'
                            : 'Account e connessione'}{' '}
                        <ArrowUpRight size={14} />
                    </Link>
                </div>
                {!desk.demo && (
                    <button
                        className="nav-item logout-button"
                        onClick={() => router.post('/auth/pitmetric/logout')}
                    >
                        <LogOut size={17} />
                        <span>Esci da ButtiDesk</span>
                    </button>
                )}
                <Link
                    className={`nav-item ${url.startsWith('/settings') ? 'active' : ''}`}
                    href="/settings"
                >
                    <Settings size={18} />
                    <span>Impostazioni</span>
                </Link>
                <div className="profile">
                    <span className="avatar">{initials(desk.user.name)}</span>
                    <div>
                        <strong>{desk.user.name}</strong>
                        <span>
                            {desk.canWrite
                                ? desk.demo
                                    ? 'Amministratore demo'
                                    : 'Accesso operativo'
                                : desk.demo
                                  ? 'Sola lettura demo'
                                  : 'Sola lettura'}
                        </span>
                    </div>
                    <ChevronDown size={14} />
                </div>
            </div>
        </>
    );
    return (
        <div className="app-shell">
            <a className="skip-link" href="#main">
                Vai al contenuto
            </a>
            <aside className="sidebar desktop-sidebar">{sidebar}</aside>
            <dialog
                className="mobile-drawer"
                ref={menu}
                onClick={(event) => {
                    if (event.target === menu.current) menu.current.close();
                }}
            >
                <div className="sidebar">
                    <button
                        className="icon-button drawer-close"
                        onClick={() => menu.current?.close()}
                        aria-label="Chiudi menu"
                    >
                        <X size={19} />
                    </button>
                    {sidebar}
                </div>
            </dialog>
            <div className="app-main">
                <header className="topbar">
                    <div className="topbar-left">
                        <button
                            className="icon-button mobile-menu"
                            aria-label="Apri menu"
                            onClick={() => menu.current?.showModal()}
                        >
                            <Menu size={21} />
                        </button>
                        <span className="breadcrumb">
                            Workspace <span>/</span>{' '}
                            <strong>{desk.workspace.name}</strong>
                        </span>
                    </div>
                    <div className="topbar-right">
                        <form className="global-search" onSubmit={submitSearch}>
                            <Search size={16} />
                            <input
                                aria-label="Cerca nei ticket"
                                placeholder="Cerca un ticket…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" aria-label="Cerca">
                                <ArrowUpRight size={15} />
                            </button>
                        </form>
                        <span className="demo-badge">
                            <span />
                            {desk.demo ? 'Demo locale' : 'PitMetric connesso'}
                        </span>
                        <button
                            className="icon-button theme-toggle"
                            onClick={toggleTheme}
                            aria-label={
                                light
                                    ? 'Attiva tema scuro'
                                    : 'Attiva tema chiaro'
                            }
                        >
                            {light ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <span className="topbar-divider" />
                        <span className="avatar small">
                            {initials(desk.user.name)}
                        </span>
                    </div>
                </header>
                <main id="main" tabIndex={-1}>
                    <div className="content">
                        {!desk.canWrite && (
                            <div className="info-banner">
                                {desk.demo ? (
                                    <>
                                        Stai esplorando come osservatore. Puoi
                                        cambiare profilo nelle{' '}
                                        <Link href="/settings">
                                            impostazioni demo
                                        </Link>
                                        .
                                    </>
                                ) : (
                                    <>
                                        Il tuo ruolo in questo workspace
                                        consente la sola lettura.
                                    </>
                                )}
                            </div>
                        )}
                        {(errors.workspace_id || errors.profile) && (
                            <div className="info-banner" role="alert">
                                {errors.workspace_id || errors.profile}
                            </div>
                        )}
                        {children}
                    </div>
                    <footer className="app-footer">
                        <span>
                            ButtiDesk-Pro <span className="footer-dot">/</span>{' '}
                            Il lavoro, sotto controllo.
                        </span>
                        <span>
                            <span className="live-dot" />{' '}
                            {desk.demo
                                ? 'Ambiente indipendente'
                                : 'Accesso tramite PitMetric'}
                        </span>
                    </footer>
                </main>
            </div>
            {toast && (
                <div className="toast" role="status">
                    <span className="toast-icon">
                        <Check size={18} />
                    </span>
                    {toast}
                    <button
                        aria-label="Chiudi notifica"
                        className="icon-button"
                        onClick={() => setToast(null)}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
            <Link
                href="/tickets/create"
                className={`mobile-create ${desk.canWrite ? '' : 'hidden'}`}
                aria-label="Nuovo ticket"
            >
                <Plus size={24} />
            </Link>
        </div>
    );
}
