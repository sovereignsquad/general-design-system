import type { ReactNode } from 'react';
import { Container, Group, Stack, Text, Title } from '@mantine/core';

/** Props for the `ArticleShell` component. */
export interface ArticleShellProps {
  /** Uppercase overline above the title. */
  eyebrow?: string;
  title: string;
  /** Lead/intro paragraph shown beneath the title. */
  lead?: ReactNode;
  /** Byline/metadata row shown below the lead. */
  meta?: ReactNode;
  /**
   * Optional right-hand rail, shown only from the `lg` breakpoint up. For secondary, on-page
   * content: a table of contents for this article, related links, metadata. It renders after the
   * article column in DOM order, in a plain stack with no landmark, and is hidden below `lg`, so
   * its content must be non-essential or repeated inline. Section and site navigation goes in a
   * shell navigation slot (`DocsShell` `primaryNavigation`), not here.
   */
  sideRail?: ReactNode;
  children: ReactNode;
}

/** Long-form article layout: a centered content column with eyebrow/title/lead/meta header and an optional right side rail on large screens. */
export function ArticleShell({ eyebrow, title, lead, meta, sideRail, children }: ArticleShellProps) {
  return (
    <Container size="lg" py="xl">
      <Group align="flex-start" gap="xl" wrap="nowrap">
        <Stack gap="lg" maw={760} flex={1}>
          <Stack gap="sm">
            {eyebrow ? (
              <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                {eyebrow}
              </Text>
            ) : null}
            <Title order={1}>{title}</Title>
            {lead ? (
              <Text size="lg" c="dimmed">
                {lead}
              </Text>
            ) : null}
            {meta ? <Group gap="md">{meta}</Group> : null}
          </Stack>
          <Stack gap="md">{children}</Stack>
        </Stack>
        {sideRail ? (
          <Stack visibleFrom="lg" gap="md" w={240}>
            {sideRail}
          </Stack>
        ) : null}
      </Group>
    </Container>
  );
}
