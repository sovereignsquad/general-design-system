import { GdsGuidedTour, GdsTourButton, type GdsTourStep } from '@sovereignsquad/gds-core';

/**
 * Consistent "Take the guided tour" control used across every site destination
 * that ships a guided tour. Renders one governed launcher ({@link GdsTourButton},
 * always) and, when `autoStart` is set, a gate-safe first-run auto-start.
 *
 * Gate safety: auto-start fires only on a bare URL (no query string) in a real
 * browser (one that implements `scrollIntoView`). The headless runtime gates
 * either visit query-bearing routes (`/?locale=xx`) or run under jsdom in unit
 * tests, so the overlay never surfaces during verification — no automation
 * sniffing needed. Gate-visited pages should omit `autoStart` (manual only).
 */
export function SiteTourLauncher({
  tourId,
  steps,
  autoStart = false,
  label,
}: {
  tourId: string;
  steps: GdsTourStep[];
  autoStart?: boolean;
  label?: string;
}) {
  const canAutoStart =
    autoStart &&
    typeof window !== 'undefined' &&
    window.location.search === '' &&
    typeof Element !== 'undefined' &&
    typeof Element.prototype.scrollIntoView === 'function';

  return (
    <div>
      <GdsTourButton tourId={tourId} steps={steps} label={label} persist="none" />
      {autoStart ? <GdsGuidedTour id={tourId} steps={steps} open={canAutoStart} persist="localStorage" /> : null}
    </div>
  );
}
