'use client';

import { Button } from '@mantine/core';
import { DocsPageShell } from '@gds/core/client';

export default function NotFound() {
  return (
    <DocsPageShell
      breadcrumbs={[{ label: 'Reference', href: '/' }, { label: 'Not found' }]}
      title="Page not found"
      lead="This App Router consumer keeps special routes inside the canonical GDS shell."
    >
      <Button component="a" href="/" variant="light">
        Back to home
      </Button>
    </DocsPageShell>
  );
}
