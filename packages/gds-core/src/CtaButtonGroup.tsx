import type { ReactNode } from 'react';
import { Group, Stack } from '@mantine/core';

export interface CtaButtonGroupProps {
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
}

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
