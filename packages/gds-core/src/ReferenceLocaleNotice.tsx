import { AccentPanel } from './AccentPanel';

export interface ReferenceLocaleNoticeProps {
  localeLabel: string;
  detail: string;
}

export function ReferenceLocaleNotice({ localeLabel, detail }: ReferenceLocaleNoticeProps) {
  return (
    <AccentPanel tone="amber" variant="soft-outline" title="Localization status" badge={localeLabel}>
      {detail}
    </AccentPanel>
  );
}
