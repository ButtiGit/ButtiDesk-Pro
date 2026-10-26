import '../css/app.css';
import '@fontsource/instrument-sans/latin-400.css';
import '@fontsource/instrument-sans/latin-500.css';
import '@fontsource/instrument-sans/latin-600.css';
import '@fontsource/instrument-sans/latin-700.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ComponentType, ReactNode } from 'react';
import DeskLayout from './layouts/DeskLayout';

type PageComponent = ComponentType & {
    layout?: (page: ReactNode) => ReactNode;
};
const pages = import.meta.glob<{ default: PageComponent }>('./pages/*.tsx');

createInertiaApp({
    title: (title) => `${title} · ButtiDesk-Pro`,
    resolve: async (name) => {
        const load = pages[`./pages/${name}.tsx`];
        if (!load) throw new Error(`Pagina sconosciuta: ${name}`);
        const page = await load();
        page.default.layout = (content) => <DeskLayout>{content}</DeskLayout>;
        return page.default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#3b82f6', showSpinner: false },
});
