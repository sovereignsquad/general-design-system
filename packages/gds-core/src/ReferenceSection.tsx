import type { ReactNode } from 'react';
import { Anchor } from '@mantine/core';
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
  /** Optional anchor id, forwarded to `SectionPanel`, so in-page links can jump straight here. */
  id?: string;
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
  id,
  children,
}: ReferenceSectionProps) {
  const { t } = useGdsTranslation();

  return (
    <SectionPanel
      id={id}
      tone={tone}
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={
        action ?? (href ? (
          <Anchor href={href} fw={600}>
            {linkLabel ?? t('gds.reference.openSection', 'Open section')}
          </Anchor>
        ) : null)
      }
      divided={false}
    >
      {children}
    </SectionPanel>
  );
}
