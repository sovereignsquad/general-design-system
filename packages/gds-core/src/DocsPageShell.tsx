import type { ReactNode } from 'react';
import { Anchor, Container, Group, Stack, Text, Title } from '@mantine/core';
import { GdsBreadcrumbs, type GdsBreadcrumbItem } from './GdsBreadcrumbs';

/** Breadcrumb item for the docs shell; alias of {@link GdsBreadcrumbItem}. */
export type BreadcrumbItem = GdsBreadcrumbItem;

/** Props for {@link DocsPageShell}. */
export interface DocsPageShellProps {
  /** Breadcrumb trail rendered above the title. */
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  /** Lead paragraph shown under the title. */
  lead?: ReactNode;
  /** Small kicker label above the title. */
  eyebrow?: string;
  /** Meta row (dates, tags, etc.) under the lead. */
  meta?: ReactNode;
  /** Optional right-hand rail, shown from the `lg` breakpoint up. */
  sideRail?: ReactNode;
  /** "Next" link rendered at the foot of the article. */
  footerNext?: { label: string; href: string };
  children: ReactNode;
}

/**
 * Documentation page layout: a breadcrumb trail, title block (eyebrow/lead/meta),
 * the article body, an optional "next" footer link, and an optional right side rail
 * that appears only on wide viewports.
 */
export function DocsPageShell({
  breadcrumbs = [],
  title,
  lead,
  eyebrow,
  meta,
  sideRail,
  footerNext,
  children,
}: DocsPageShellProps) {
  return (
    <Container fluid py="xl" px={{ base: 'md', md: 'lg', lg: 'xl' }} w="100%" maw="100%">
      <Group align="flex-start" gap="xl" wrap="nowrap">
        <Stack component="article" gap="lg" flex={1} miw={0}>
          <GdsBreadcrumbs items={breadcrumbs} />
          <Stack gap="sm">
            {eyebrow ? (
              <Text size="sm" fw={700} c="dimmed">
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
          {footerNext ? (
            <Anchor href={footerNext.href} fw={600}>
              {footerNext.label}
            </Anchor>
          ) : null}
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
