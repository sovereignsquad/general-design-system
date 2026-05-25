'use client';

import { Button } from '@mantine/core';
import { StateBlock } from '@gds/core/client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StateBlock
      variant="error"
      title="Reference route failed"
      description={error.message}
      action={
        <Button onClick={reset} variant="light">
          Retry route
        </Button>
      }
    />
  );
}
