import { ArrowUpRight } from 'lucide-react';

export default function ProductSwitch({ href }: { href: string }) {
    return (
        <a
            className="product-switch"
            href={href}
            data-product-switch="pitmetric"
        >
            <span className="product-mark">PM</span>
            <span>
                <strong>PitMetric</strong>
                <small>Torna al tuo gestionale</small>
            </span>
            <ArrowUpRight size={16} />
        </a>
    );
}
