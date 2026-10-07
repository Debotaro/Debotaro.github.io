import Link from 'next/link';
import { MarketingShell } from '../components/marketing';
export default function NotFound(){return <MarketingShell><section className="marketing-section not-found"><div className="section-kicker">A LITTLE OFF THE MAP</div><h1>Let’s find<br/><em>your way back.</em></h1><p>This page doesn’t exist. Your workspace is right here.</p><Link href="/app" className="button button-primary">Open workspace ↗</Link></section></MarketingShell>;}
