import type { ReactNode } from 'react';
import { SectionPanel } from '@doneisbetter/gds-core';

export interface ContentOpsSectionProps {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'warning' | 'critical';
}

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
