import Link from 'next/link';
import { SimpleDataTable } from '@sovereignsquad/gds-core/server';
export default function TablePage() {
  return (
    <main>
      <Link href="/" data-probe="to-home">Home</Link>
      <div data-probe="table">
        <SimpleDataTable columns={[{ key: 'a', header: 'A' }]} rows={[{ a: 'one' }, { a: 'two' }] as never} />
      </div>
    </main>
  );
}
