'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const Providers = dynamic(() => import('./providers'), { ssr: false });

export default function ProviderHost({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
