'use client';
import { GdsProvider } from '@sovereignsquad/gds/client';
export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}
