import Link from 'next/link';
import MapClient from './map-client';
export default function MapPage() {
  return (
    <main>
      <Link href="/" data-probe="to-home">Home</Link>
      <MapClient />
    </main>
  );
}
