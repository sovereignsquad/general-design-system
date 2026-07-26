import type { ReactNode } from 'react';
import { SectionPanel } from './SectionPanel';

/** Props for {@link ConsumerSection}. */
export interface ConsumerSectionProps {
  title: ReactNode;
  description?: ReactNode;
  /** Optional action element rendered in the section header. */
  action?: ReactNode;
  children: ReactNode;
  /** Visual tone of the underlying `SectionPanel`. Defaults to `'default'`. */
  tone?: 'default' | 'supporting' | 'warning';
}

/** Consumer-facing section wrapper over {@link SectionPanel}, forwarding title, description, action, and tone. */
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
