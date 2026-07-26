import type { ReactNode } from 'react';
import { Divider, Paper, Stack } from '@mantine/core';

/** Props for the `DetailProfileShell` component. */
export interface DetailProfileShellProps {
  /** `drawer` adds a border and larger radius; `page` is flat. Defaults to `page`. */
  mode?: 'page' | 'drawer';
  hero?: ReactNode;
  actions?: ReactNode;
  /** Ordered detail sections; falsy entries are skipped. */
  sections: ReactNode[];
  /** Optional related-content block appended after the sections. */
  related?: ReactNode;
  /** Surface padding. Defaults to `lg`. */
  padding?: 'sm' | 'md' | 'lg';
  /** Insert dividers between sections. Defaults to `true`. */
  showDividers?: boolean;
}

/** Governed detail/profile layout for a page or drawer: an optional hero and action row followed by ordered, optionally divider-separated sections and a related-content block. */
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
