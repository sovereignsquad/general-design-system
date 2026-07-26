import { AccentPanel } from './AccentPanel';

/** Props for `ReferenceLocaleNotice`. */
export interface ReferenceLocaleNoticeProps {
  /** Locale name shown as the panel badge. */
  localeLabel: string;
  /** Localization status detail rendered as the panel body. */
  detail: string;
}

/** Amber accent panel announcing the localization status for a given locale. */
export function ReferenceLocaleNotice({ localeLabel, detail }: ReferenceLocaleNoticeProps) {
  return (
    <AccentPanel tone="amber" variant="soft-outline" title="Localization status" badge={localeLabel}>
      {detail}
    </AccentPanel>
  );
}
