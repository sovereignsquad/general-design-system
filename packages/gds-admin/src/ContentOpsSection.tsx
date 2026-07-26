import type { ReactNode } from 'react';
import { SectionPanel } from '@sovereignsquad/gds-core';

/** Props for {@link ContentOpsSection}. */
export interface ContentOpsSectionProps {
  /** Stable section id (anchor / heading association). */
  id: string;
  /** Section heading. */
  title: ReactNode;
  /** Supporting description under the heading. */
  description?: ReactNode;
  /** Action element rendered in the section header. */
  action?: ReactNode;
  /** Section content. */
  children: ReactNode;
  /** Semantic tone of the section; defaults to `default`. */
  tone?: 'default' | 'warning' | 'critical';
}

/** Thin governed pass-through over the GDS `SectionPanel` for content-ops editor sections. */
export function ContentOpsSection({
  id,
  title,
  description,
  action,
  children,
  tone = 'default',
}: ContentOpsSectionProps) {
  return (
    <SectionPanel id={id} title={title} description={description} action={action} tone={tone}>
      {children}
    </SectionPanel>
  );
}
