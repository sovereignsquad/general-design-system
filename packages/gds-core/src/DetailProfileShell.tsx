import type { ReactNode } from 'react';
import { Divider, Paper, Stack } from '@mantine/core';

export interface DetailProfileShellProps {
  mode?: 'page' | 'drawer';
  hero?: ReactNode;
  actions?: ReactNode;
  sections: ReactNode[];
  related?: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  showDividers?: boolean;
}

export function DetailProfileShell({
  mode = 'page',
  hero,
  actions,
  sections,
  related,
  padding = 'lg',
  showDividers = true,
}: DetailProfileShellProps) {
  const content = sections.filter(Boolean);

  return (
    <Paper withBorder={mode === 'drawer'} radius={mode === 'drawer' ? 'xl' : 'md'} p={padding}>
      <Stack gap="lg">
        {hero}
        {actions}
        {content.map((section, index) => (
          <Stack key={index} gap="lg">
            {index > 0 && showDividers ? <Divider /> : null}
            {section}
          </Stack>
        ))}
        {related ? (
          <>
            {content.length && showDividers ? <Divider /> : null}
            {related}
          </>
        ) : null}
      </Stack>
    </Paper>
  );
}
