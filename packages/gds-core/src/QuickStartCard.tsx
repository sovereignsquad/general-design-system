import { GDS_MIN_TARGET_PX } from '@sovereignsquad/gds-theme';
import { GdsIcon } from './icons';
import type { GdsIconName } from './icons';
import { CardTitle, MetadataText } from './Typography';

/**
 * QuickStartCard (issue 710).
 *
 * Clickable scenario card for homepage quick-start grids: an icon square, a bold
 * label, and an optional one-line description, rendered as a real `<button>` so
 * click, Enter, and Space all activate it through native semantics. Hover raises
 * the card via the `.gds-quick-start-card` package stylesheet class
 * (`packages/gds-theme/styles.css`), which disappears under reduced motion because
 * its transition binds exclusively to the shared `--gds-motion-*` tokens. Hook-free
 * and server-safe: nothing here needs client-side state.
 */

/** Edge length of the QuickStartCard icon square. */
export const GDS_QUICK_START_ICON_BOX_PX = 34;

/** Props for {@link QuickStartCard}. */
export interface QuickStartCardProps {
  /** Semantic icon key from the GdsIcons registry (unknown keys fall back to Help). */
  icon?: GdsIconName;
  /** Card label. Required; consumer copy. */
  label: string;
  /** Optional one-line description. */
  description?: string;
  /** Activation handler (click / Enter / Space via native button semantics). */
  onClick: () => void;
  /** Disables the native button; defaults to false. */
  disabled?: boolean;
}

/**
 * Governed clickable scenario card (see file overview): icon square + bold label +
 * optional description, rendered as a native `<button>` with a token-bound hover
 * lift. Renders no fetched data, so the loading/empty/error/success states
 * contract does not apply internally.
 */
export function QuickStartCard({ icon, label, description, onClick, disabled = false }: QuickStartCardProps) {
  return (
    <button
      type="button"
      className="gds-quick-start-card"
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: 'none',
        font: 'inherit',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        minHeight: `${GDS_MIN_TARGET_PX}px`,
        gap: 'var(--mantine-spacing-xs)',
        padding: 'var(--mantine-spacing-md)',
        borderRadius: 'var(--gds-radius-card)',
        border: '1px solid var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-default-border)))',
        background: disabled
          ? 'var(--gds-control-disabledBg, var(--mantine-color-gray-2))'
          : 'var(--gds-bg-card, var(--gds-vibe-surface, var(--mantine-color-body)))',
        color: disabled ? 'var(--gds-control-disabledText, var(--mantine-color-gray-6))' : undefined,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: `${GDS_QUICK_START_ICON_BOX_PX}px`,
          height: `${GDS_QUICK_START_ICON_BOX_PX}px`,
          borderRadius: 'var(--gds-radius-md)',
          background: 'var(--gds-bg-page, var(--gds-vibe-surface, var(--mantine-color-gray-0)))',
          color: disabled
            ? 'var(--gds-control-disabledText, var(--mantine-color-gray-6))'
            : 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
        }}
      >
        <GdsIcon icon={icon} />
      </span>
      <div style={{ overflowWrap: 'anywhere' }}>
        <CardTitle>{label}</CardTitle>
        {description ? <MetadataText>{description}</MetadataText> : null}
      </div>
    </button>
  );
}
