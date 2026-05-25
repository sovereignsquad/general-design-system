import type { ReactNode } from 'react';
import { ColorSchemeScript } from '@mantine/core';
import './globals.css';
import ProviderHost from './provider-host';

export const metadata = {
  title: 'GDS Next.js Reference',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <ProviderHost>{children}</ProviderHost>
      </body>
    </html>
  );
}
