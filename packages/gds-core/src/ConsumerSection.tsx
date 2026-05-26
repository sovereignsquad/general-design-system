import type { ReactNode } from 'react';
import { SectionPanel } from './SectionPanel';

export interface ConsumerSectionProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'supporting' | 'warning';
}

export function ConsumerSection({
  title,
  description,
  action,
  children,
  tone = 'default',
}: ConsumerSectionProps) {
  return (
    <SectionPanel title={title} description={description} action={action} tone={tone}>
      {children}
    </SectionPanel>
  );
}
