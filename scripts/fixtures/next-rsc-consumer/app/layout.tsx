import '@sovereignsquad/gds-theme/styles.css';
import '@sovereignsquad/gds-core/map.css';
import { ColorSchemeScript } from '@mantine/core';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><ColorSchemeScript defaultColorScheme="light" /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
