'use client';

import { Button } from '@mantine/core';
import { CtaButtonGroup, DocsCodeBlock, ThemeToggle } from '@gds/core/client';

export function ClientPanel() {
  return (
    <>
      <ThemeToggle />
      <DocsCodeBlock code="npm install @gds/theme @gds/core" language="bash" title="Install" />
      <CtaButtonGroup
        primary={<Button>Adopt provider</Button>}
        secondary={<Button variant="default">Review exports</Button>}
      />
    </>
  );
}
