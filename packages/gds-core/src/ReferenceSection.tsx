import type { ReactNode } from 'react';
import { Anchor, Group, Stack, Text } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { SectionPanel, type SectionPanelTone } from './SectionPanel';

/** Props for {@link ReferenceSection}. */
export interface ReferenceSectionProps {
  /** Section heading. */
  title: ReactNode;
  /** Optional supporting copy shown under the title. */
  description?: ReactNode;
  /** Optional small label rendered above the title. */
  eyebrow?: ReactNode;
  /** Optional action element rendered in the section header. */
  action?: ReactNode;
  /** Optional link target; renders `linkLabel` as an anchor in the header. */
  href?: string;
  /** Label for the `href` link. */
  linkLabel?: ReactNode;
  /** Visual tone of the underlying `SectionPanel`. */
  tone?: SectionPanelTone;
  /** Section body content. */
  children: ReactNode;
}

/**
 * Governed reference/content section over {@link SectionPanel}: an optional
 * eyebrow, title, description, and header link, rendered without an internal
 * divider.
 */
export function ReferenceSection({
  title,
  description,
  eyebrow,
  action,
  href,
  linkLabel,
  tone = 'default',
  children,
}: ReferenceSectionProps) {
  const { t } = useGdsTranslation();

  return (
    <SectionPanel
      tone={tone}
      title={(
        <Stack gap={4}>
          {eyebrow ? (
            <Text size="xs" fw={700} c="dimmed">
              {eyebrow}
            </Text>
          ) : null}
          <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
            <Stack gap={4}>
              <Text component="span" fw={700} size="xl">
                {title}
              </Text>
              {description ? (
                <Text size="sm" c="dimmed">
                  {description}
                </Text>
              ) : null}
            </Stack>
            {href ? (
              <Anchor href={href} fw={600}>
                {linkLabel ?? t('gds.reference.openSection', 'Open section')}
              </Anchor>
            ) : null}
          </Group>
        </Stack>
      )}
      action={action}
      divided={false}
    >
      {children}
    </SectionPanel>
  );
}
