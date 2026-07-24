import type { ReactNode } from 'react';
import { Anchor, Container, Group, Stack, Text, Title } from '@mantine/core';
import { GdsBreadcrumbs, type GdsBreadcrumbItem } from './GdsBreadcrumbs';

export type BreadcrumbItem = GdsBreadcrumbItem;

export interface DocsPageShellProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  lead?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  sideRail?: ReactNode;
  footerNext?: { label: string; href: string };
  children: ReactNode;
}

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
