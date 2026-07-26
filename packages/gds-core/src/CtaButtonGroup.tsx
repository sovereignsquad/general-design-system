import type { ReactNode } from 'react';
import { Group, Stack } from '@mantine/core';

/** Props for `CtaButtonGroup`. */
export interface CtaButtonGroupProps {
  primary: ReactNode;
  /** Secondary action rendered beside the primary one. */
  secondary?: ReactNode;
  /** Tertiary action rendered on its own row below. */
  tertiary?: ReactNode;
}

/** Call-to-action layout: primary and optional secondary actions in a row, with an optional tertiary action stacked below. */
export function CtaButtonGroup({ primary, secondary, tertiary }: CtaButtonGroupProps) {
  return (
    <Stack gap="sm">
      <Group gap="sm" align="stretch">
        <div>{primary}</div>
        {secondary ? <div>{secondary}</div> : null}
      </Group>
      {tertiary ? <div>{tertiary}</div> : null}
    </Stack>
  );
}
