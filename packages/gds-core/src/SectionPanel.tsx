import type { ReactNode } from 'react';
import { Box, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { SurfacePresentationProps } from './SurfacePresentation';
import { resolveSurfacePresentationStyles } from './SurfacePresentation';

export type SectionPanelTone = 'default' | 'supporting' | 'warning' | 'critical';

export interface SectionPanelProps extends SurfacePresentationProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: SectionPanelTone;
  id?: string;
  divided?: boolean;
}

const toneBackgrounds: Record<SectionPanelTone, string> = {
  default: 'var(--mantine-color-body)',
  supporting: 'light-dark(var(--mantine-color-gray-0), color-mix(in srgb, var(--mantine-color-dark-7) 92%, black))',
  warning: 'light-dark(var(--mantine-color-yellow-0), color-mix(in srgb, var(--mantine-color-yellow-9) 18%, var(--mantine-color-body)))',
  critical: 'light-dark(var(--mantine-color-red-0), color-mix(in srgb, var(--mantine-color-red-9) 18%, var(--mantine-color-body)))',
};

/**
 * Titled content section with an optional description, header `action`, and tone.
 * Use it to group related content under a governed section heading — the standard
 * building block for the panels inside dashboards, detail pages, and settings
 * surfaces — instead of ad-hoc card-plus-title markup.
 */
export function SectionPanel({
  title,
  description,
  action,
  children,
  tone = 'default',
  id,
  divided = true,
  presentation = 'inline',
  minHeight,
  contentAlign,
  contentJustify,
}: SectionPanelProps) {
  const bodyLayout = resolveSurfacePresentationStyles({
    presentation,
    minHeight,
    contentAlign,
    contentJustify,
  });

  return (
    <Paper id={id} withBorder radius="xl" p="lg" style={{ background: toneBackgrounds[tone] }}>
      <Stack gap="md">
        {(title || description || action) ? (
          <>
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
              {(title || description) ? (
                <Stack gap={4}>
                  {title ? <Title order={3}>{title}</Title> : null}
                  {description ? (
                    <Text size="sm" c="dimmed">
                      {description}
                    </Text>
                  ) : null}
                </Stack>
              ) : null}
              {action}
            </Group>
            {divided ? <Divider /> : null}
          </>
        ) : null}
        <Box style={bodyLayout}>
          {children}
        </Box>
      </Stack>
    </Paper>
  );
}
