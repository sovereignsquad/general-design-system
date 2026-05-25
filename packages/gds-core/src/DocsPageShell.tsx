import type { ReactNode } from 'react';
import { Anchor, Breadcrumbs, Container, Group, Stack, Text, Title } from '@mantine/core';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

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
    <Container size="lg" py="xl">
      <Group align="flex-start" gap="xl" wrap="nowrap">
        <Stack component="article" gap="lg" maw={760} flex={1}>
          {breadcrumbs.length ? (
            <Breadcrumbs>
              {breadcrumbs.map((crumb) =>
                crumb.href ? (
                  <Anchor key={`${crumb.label}-${crumb.href}`} href={crumb.href}>
                    {crumb.label}
                  </Anchor>
                ) : (
                  <Text key={crumb.label}>{crumb.label}</Text>
                ),
              )}
            </Breadcrumbs>
          ) : null}
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
