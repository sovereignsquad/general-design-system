import Link from 'next/link';
import { GdsIcon, PublicShell } from '@sovereignsquad/gds-core/server';

export default function Home() {
  return (
    <PublicShell
      brand={<span>GDS</span>}
      navItems={[{ id: 'home', label: 'Home', href: '/' }, { id: 'map', label: 'Map', href: '/map' }]}
      activeNavId="home"
    >
      <p data-probe="server-icon"><GdsIcon icon="Search" label="Search" /> server icon</p>
      <Link href="/map" data-probe="to-map">Go to map</Link>{' '}
      <Link href="/table" data-probe="to-table">Go to table</Link>
    </PublicShell>
  );
}
