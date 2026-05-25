import type { ReactNode } from 'react';
import { ColorSchemeScript } from '@mantine/core';
import './globals.css';
import Providers from './providers';

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
