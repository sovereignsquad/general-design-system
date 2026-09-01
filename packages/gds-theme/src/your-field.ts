/**
 * Your Field — brand preset (v3 re-base of the ClassScout brand).
 *
 * Source of truth is the `classscout_final (Copy).fig` v3 redesign, cross-checked against three
 * iterations of an exported design-system handoff bundle (colour anchors, ten-step ramp tables,
 * component specs, and a GDS-format token spec: `gds/new-your-field-token-spec.md` in the most
 * recent handoff). Every anchor colour below is the brand's own value, never sampled or estimated.
 *
 * ## A new lane, not a rename of class-usa
 *
 * The handoff spec's own "Decisions taken" section instructs re-basing `class-usa` into this
 * brand and renaming the lane. That instruction is overruled by owner decision (2026-08-31):
 * `class-usa` remains a supported lane, unchanged — its colours, Playfair Display typography, and
 * every token stay exactly as shipped. Your Field registers as an independent preset instead,
 * following the same pattern as {@link padelAfricaThemePreset}.
 *
 * ## Why the ramps are copied verbatim, not regenerated
 *
 * The handoff bundle ships full ten-step ramp tables (not single anchor values), so — unlike
 * {@link buildPadelAfricaRamp}, which exists because a *single* anchor was interpolated into an
 * off-brand colour — there is nothing to regenerate here. The six ramps below are the handoff's
 * `yourFieldDefaultColorRamps` table, copied verbatim. The handoff itself flags every step outside
 * the brand's own anchor index as a *proposal* awaiting a Theme Lab review — see the per-ramp
 * comments for exactly which index is fig-verified and which are proposed.
 *
 * ## The radius decision: literal values, never a redefined Mantine step
 *
 * A live incident on classscout.ai (2026-09-01) traced a broken layout — several page regions
 * rendering as full ellipses — to exactly this mistake made in the `class-usa` lane: issue 551
 * repointed Mantine's `xl` radius *step name* to mean "pill" (`624.9375rem`) instead of Mantine's
 * own ~32px convention. Every consumer call site that passes `radius="xl"` expecting a rounded
 * *rectangle* silently became a blob the moment that lane's theme applied. The correct place for
 * "pill" is a literal value passed to the specific components that need it — never a redefinition
 * of what a shared step name means for every consumer. Every `radius` reference in this preset is
 * therefore a literal CSS length (e.g. `'20px'`, `'9999px'`) at the exact component that needs it;
 * the shared Mantine radius scale (`xs`…`xl`) is left untouched.
 *
 * ## Accessibility, stated rather than hidden
 *
 * Playground Peach (`#CA8570`) is an *outline-only* accent throughout the source material — it
 * never appears as a fill behind white or navy text, and never as running body text. Measured
 * this session: white text on peach is 2.96:1 (fails even the 3:1 large-text floor); peach text
 * on the Warm Cream canvas is 2.77:1 (fails the 3:1 non-text floor a functional accent needs).
 * Peach-deep (`#C9684A`, the handoff's own "stronger peach text" shade) clears 3.53:1 on cream and
 * carries the functional accent role instead — see {@link YOUR_FIELD_ROLES.accentText}. Neither
 * shade is ever used as running text colour; both stay scoped to outlines, strokes, and bold
 * short-form UI labels, matching the handoff's own documented limitation.
 */
import type { MantineThemeOverride } from '@mantine/core';

/** Ink, primary button fill, default map-pin stroke. Fig-verified anchor. */
export const YOUR_FIELD_NAVY = '#0B223E';
/** Hero display text and shadow base — treated as an alias of navy, not a separate ramp step. */
export const YOUR_FIELD_NAVY_DEEP = '#0D2340';
/** Outline-accent CTAs, avatars, selected map-pin fill, featured-card border. Fig-verified anchor. */
export const YOUR_FIELD_PEACH = '#CA8570';
/** The AA-safer, stronger peach: notification dot, pressed-state accent text/stroke, functional accent carrier. */
export const YOUR_FIELD_PEACH_DEEP = '#C9684A';
/** Availability and map "unavailable" fill. Fig-verified anchor. */
export const YOUR_FIELD_SAGE = '#90A287';
/** Sage-dark: trust/success text on light grounds. */
export const YOUR_FIELD_SAGE_TEXT = '#566151';
/** Page canvas, active-nav pill, chip background. Fig-verified anchor. */
export const YOUR_FIELD_CREAM = '#FAF7F1';
/** Secondary/meta text, inactive nav item. Fig-verified anchor. */
export const YOUR_FIELD_CHARCOAL = '#434C59';
/** Scout AI identity gradient start + system focus ring. Reserved exclusively for AI surfaces and focus — never a general action colour. */
export const YOUR_FIELD_SCOUT = '#FF6B35';
/** Scout AI identity gradient end. */
export const YOUR_FIELD_SCOUT_2 = '#FF9055';
/** Rating-star fill. */
export const YOUR_FIELD_STAR = '#FFB900';

/** Every core colour, for tooling that enumerates the palette (docs, tests, pickers). */
export const YOUR_FIELD_CORE_PALETTE = {
  navy: YOUR_FIELD_NAVY,
  peach: YOUR_FIELD_PEACH,
  sage: YOUR_FIELD_SAGE,
  cream: YOUR_FIELD_CREAM,
  charcoal: YOUR_FIELD_CHARCOAL,
  scout: YOUR_FIELD_SCOUT,
} as const;

/** The index each anchor colour occupies within its own ramp (fig-verified position). */
export const YOUR_FIELD_RAMP_ANCHOR_INDEX = {
  navy: 6,
  peach: 5,
  sage: 5,
  cream: 0,
  charcoal: 6,
  scout: 5,
} as const;

export type YourFieldColorRampName = keyof typeof YOUR_FIELD_CORE_PALETTE;
export type YourFieldRamp = readonly [string, string, string, string, string, string, string, string, string, string];

/** Ramp keys this preset registers. Prefixed so they cannot collide with another brand's ramps. */
export const YOUR_FIELD_RAMPS = {
  navy: 'yourFieldNavy',
  peach: 'yourFieldPeach',
  sage: 'yourFieldSage',
  cream: 'yourFieldCream',
  charcoal: 'yourFieldCharcoal',
  scout: 'yourFieldScout',
} as const;

/**
 * Ten-step ramps, copied verbatim from the handoff's `yourFieldDefaultColorRamps` table. Only the
 * anchor index per ramp (see {@link YOUR_FIELD_RAMP_ANCHOR_INDEX}) is fig-verified; every other
 * step is the handoff's own proposal, owed the Theme Lab review its own spec asks for before this
 * preset leaves the current milestone.
 */
const yourFieldColors: Record<string, YourFieldRamp> = {
  [YOUR_FIELD_RAMPS.navy]: ['#E8EDF4', '#C9D4E2', '#9FB2C8', '#7290AB', '#4A6A8C', '#26456A', '#0B223E', '#091D34', '#07182B', '#051221'],
  [YOUR_FIELD_RAMPS.peach]: ['#F9F0EC', '#F0DCD3', '#E4C2B3', '#D8A892', '#D1957F', '#CA8570', '#B26E59', '#985A47', '#7D4936', '#623827'],
  [YOUR_FIELD_RAMPS.sage]: ['#F1F4EF', '#DDE4DA', '#C4CFBF', '#ABBAA3', '#9DAE93', '#90A287', '#7A8C71', '#66755E', '#566151', '#414A3E'],
  [YOUR_FIELD_RAMPS.cream]: ['#FAF7F1', '#F4EEE2', '#ECE3D1', '#E3D6BD', '#D9C9A8', '#CDBA92', '#BFAD80', '#A8946A', '#8A7A57', '#6B5E44'],
  [YOUR_FIELD_RAMPS.charcoal]: ['#F5F6F8', '#E7E9ED', '#D2D6DC', '#B6BCC6', '#959DAA', '#6F7989', '#434C59', '#373E49', '#2B303A', '#20242B'],
  [YOUR_FIELD_RAMPS.scout]: ['#FFF1EA', '#FFD9C7', '#FFBD9E', '#FFA172', '#FF9055', '#FF6B35', '#F57028', '#D4581C', '#A84414', '#7C300C'],
};

/**
 * Named roles the source material's own vocabulary uses, so consumers read intent ("outline CTA
 * accent") rather than a raw hex. Field names not covered by GDS's generic semantic-role schema
 * (the Scout AI gradient lane, map-pin states, the featured-card ring, the sidebar section label)
 * are documented here rather than invented into the shared schema — they are specific to this
 * brand's Scout AI sub-lane and light shell, matching the handoff's own "ai.*" / "pin.*" naming.
 */
export const YOUR_FIELD_ROLES = {
  primaryCta: YOUR_FIELD_NAVY,
  primaryCtaHover: '#091D34',
  primaryCtaPressed: '#071626',
  /** Outline-only accent (never a fill behind text, never running text — see the module doc). */
  accentOutline: YOUR_FIELD_PEACH,
  accentOutlineHoverGround: 'rgba(202, 133, 112, 0.10)',
  /** The functional, AA-clearing (3.53:1 on cream) carrier for the peach family. */
  accentText: YOUR_FIELD_PEACH_DEEP,
  heading: YOUR_FIELD_NAVY_DEEP,
  cardBackground: '#FFFFFF',
  surfaceBackground: YOUR_FIELD_CREAM,
  price: YOUR_FIELD_NAVY,
  star: YOUR_FIELD_STAR,
  successHighlight: YOUR_FIELD_SAGE_TEXT,
  warningAccent: YOUR_FIELD_PEACH_DEEP,
  dangerAccent: '#B3261E',
  infoAccent: '#1A3A6A',
  /** The shell is light — white sidebar/topbar on the cream canvas, never a dark nav background. */
  navBackground: '#FFFFFF',
  navInactiveText: YOUR_FIELD_CHARCOAL,
  navActiveBg: YOUR_FIELD_CREAM,
  navSectionLabel: 'rgba(11, 34, 62, 0.35)',
  chipHoverGround: 'rgba(11, 34, 62, 0.06)',
  disabledBg: '#F1EFEA',
  disabledText: '#7A746B',
  /** Focus ring and the featured-card ring both use the Scout identity colour, per the source spec. */
  focusRing: YOUR_FIELD_SCOUT,
  ringFeatured: '0 0 0 3px rgba(255, 107, 53, 0.14)',
  /**
   * Scout AI sub-lane. Reserved exclusively for AI surfaces (search entry, chat, the sidebar
   * promo panel, an emphasized tab-bar disc) plus the focus/featured rings above — never a
   * general action colour. Full component wiring is tracked separately; the tokens are
   * registered here so the reservation is enforceable from day one.
   */
  aiAccent: YOUR_FIELD_SCOUT,
  aiGradient: `linear-gradient(135deg, ${YOUR_FIELD_SCOUT} 0%, ${YOUR_FIELD_SCOUT_2} 100%)`,
  aiPanelGradient: `linear-gradient(124deg, ${YOUR_FIELD_NAVY_DEEP} 0%, #1A3A6A 100%)`,
  /** Map-pin state fills, per the source's five-state pin system. */
  pinDefaultStroke: YOUR_FIELD_NAVY,
  pinSelectedFill: YOUR_FIELD_PEACH,
  pinUnavailableFill: YOUR_FIELD_SAGE,
  pinClusterFill: YOUR_FIELD_NAVY,
  mapAreaLabel: 'rgba(67, 76, 89, 0.6)',
  /** Photo-overlay badge scrim (e.g. a "Pick" ribbon on a media tile). */
  badgeOverlayScrim: 'rgba(11, 34, 62, 0.6)',
} as const;

/**
 * The preset. Colour, typography, and the brand's own literal radii are re-pointed; every other
 * GDS token, spacing, and elevation decision is inherited from the governed base theme.
 */
export const yourFieldThemePreset: MantineThemeOverride = {
  colors: yourFieldColors,
  primaryColor: YOUR_FIELD_RAMPS.navy,
  // Both schemes sit at the fig-verified anchor index. Mantine's dark default (8) would paint a
  // darkened navy the brand never specified.
  primaryShade: { light: YOUR_FIELD_RAMP_ANCHOR_INDEX.navy, dark: YOUR_FIELD_RAMP_ANCHOR_INDEX.navy },
  fontFamily: `"Plus Jakarta Sans", system-ui, sans-serif`,
  headings: {
    fontFamily: `"DM Serif Display", Georgia, serif`,
    fontWeight: '400',
  },
  other: {
    yourField: YOUR_FIELD_ROLES,
  },
  components: {
    Button: {
      defaultProps: {
        // Pill-like rounded rect, per the source's button/nav-item radius — a literal value, not
        // a redefined Mantine step (see the module doc's radius-collision incident).
        radius: '20px',
        fw: 600,
      },
      styles: {
        root: {
          minHeight: 38,
        },
      },
    },
    Card: {
      defaultProps: {
        radius: '16px',
        withBorder: true,
        shadow: 'sm',
      },
      styles: {
        root: {
          borderColor: 'rgba(11, 34, 62, 0.09)',
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: '16px',
      },
    },
    Modal: {
      defaultProps: {
        radius: '24px',
      },
    },
    Drawer: {
      defaultProps: {
        radius: '24px',
      },
    },
    Chip: {
      defaultProps: {
        radius: '9999px',
        size: 'lg',
      },
      styles: {
        label: { textTransform: 'none' },
      },
    },
    Badge: {
      defaultProps: {
        radius: '9999px',
      },
      styles: {
        root: { textTransform: 'none' },
      },
    },
  },
};
