import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';
import { GDS_DEFAULT_DESIGN_RULE_PROFILE } from '../axes';
import { YOUR_FIELD_NAVY_DEEP, YOUR_FIELD_SCOUT, YOUR_FIELD_SCOUT_2, yourFieldThemePreset } from '../your-field';
import { ensureContrast, mixCssColors } from '../color-math';

// Your Field's Scout AI sub-brand accent lane (issue 697). Light values are the handoff's own
// anchors, reused verbatim from your-field.ts (YOUR_FIELD_SCOUT/YOUR_FIELD_SCOUT_2/
// YOUR_FIELD_NAVY_DEEP) rather than retyped, so there is exactly one place each hex lives.
// `#1A3A6A` (the second ai.panel stop) mirrors that same literal, cased identically, already
// carried by your-field.ts's own `YOUR_FIELD_ROLES.aiPanelGradient` — not a fresh invention.
//
// The handoff ships no dark scheme at all, so every dark value below is authored here, never
// copied from light (incidents 533/534): each is nudged toward white with the same
// ensureContrast/mixCssColors recipe `deriveVibeSemanticCssVariables` already uses for this
// preset's own generic accent's dark sibling — mix 75% toward white, then push further only
// if still under the WCAG non-text floor — run against the your-field vibe's own
// canvasDark/surfaceDark. `ai.accent` and both `ai.gradient` stops clear >= 3:1 (WCAG 1.4.11)
// against canvasDark, the ring/gradient's actual dark ground; both `ai.panel` stops clear
// >= 3:1 against surfaceDark, the surface the panel sits on top of — a straight navy-on-navy
// repaint would otherwise let the panel disappear into an equally dark shell instead of
// reading as an elevated surface. Gradient angle and stop offsets stay unchanged between
// schemes: geometry is brand identity, not a contrast decision.
const YOUR_FIELD_AI_CANVAS_DARK = '#0a1626';
const YOUR_FIELD_AI_SURFACE_DARK = 'rgba(17, 36, 58, 0.9)';
const YOUR_FIELD_AI_ACCENT_DARK = ensureContrast(
  mixCssColors(YOUR_FIELD_SCOUT, '#ffffff', 0.75, YOUR_FIELD_AI_CANVAS_DARK),
  YOUR_FIELD_AI_CANVAS_DARK, 3, true, YOUR_FIELD_AI_CANVAS_DARK,
);
const YOUR_FIELD_AI_GRADIENT_STOP_2_DARK = ensureContrast(
  mixCssColors(YOUR_FIELD_SCOUT_2, '#ffffff', 0.75, YOUR_FIELD_AI_CANVAS_DARK),
  YOUR_FIELD_AI_CANVAS_DARK, 3, true, YOUR_FIELD_AI_CANVAS_DARK,
);
const YOUR_FIELD_AI_PANEL_STOP_1_DARK = ensureContrast(
  mixCssColors(YOUR_FIELD_NAVY_DEEP, '#ffffff', 0.75, YOUR_FIELD_AI_SURFACE_DARK),
  YOUR_FIELD_AI_SURFACE_DARK, 3, true, YOUR_FIELD_AI_SURFACE_DARK,
);
const YOUR_FIELD_AI_PANEL_STOP_2_DARK = ensureContrast(
  mixCssColors('#1A3A6A', '#ffffff', 0.75, YOUR_FIELD_AI_SURFACE_DARK),
  YOUR_FIELD_AI_SURFACE_DARK, 3, true, YOUR_FIELD_AI_SURFACE_DARK,
);
// ai.gradient's first stop is Scout itself, the same hue ai.accent derives from, so its dark
// sibling reuses the identical derived value rather than recomputing the same thing twice.
const YOUR_FIELD_AI_GRADIENT_DARK = `linear-gradient(135deg, ${YOUR_FIELD_AI_ACCENT_DARK} 0%, ${YOUR_FIELD_AI_GRADIENT_STOP_2_DARK} 100%)`;
const YOUR_FIELD_AI_PANEL_DARK = `linear-gradient(124deg, ${YOUR_FIELD_AI_PANEL_STOP_1_DARK} 0%, ${YOUR_FIELD_AI_PANEL_STOP_2_DARK} 100%)`;

export default defineGdsThemePreset({
  id: 'your-field',
  catalog: {
    label: 'Your Field',
    description: 'Light, editorial family-discovery brand lane: warm cream canvas, white sidebar and cards, navy ink and primary action, an outline-only Playground Peach accent, and a Scout AI orange-gradient sub-lane reserved for AI surfaces.',
    runtimeLane: 'resolveGdsThemePreset(your-field)',
  },
  mantine: yourFieldThemePreset,
  vibe: {
    ...neutralVibe,
    id: 'your-field',
    label: 'Your Field',
    // `primary` is what the governed Button rule paints with — navy, which is both ink and the
    // brand's primary action colour (the v3 redesign has no separate action colour).
    primary: '#0b223e',
    // `accent` is a functional GDS role requiring 3:1 non-text contrast. Raw Playground Peach
    // (#ca8570) measures 2.77:1 on the cream canvas and cannot carry it — this is peach-deep
    // (#c9684a, the source's own "stronger peach text" shade), which clears 3.53:1. Raw peach
    // remains addressable as an outline-only role on `theme.other.yourField.accentOutline`.
    accent: '#c9684a',
    // flatSurfaces neutralizes glow/gradient/hero to transparent/none in getGdsVibeThemeCssVariables regardless of the
    // literal values here; kept as honest, non-misleading placeholders rather than magic strings.
    glow: 'rgba(11, 34, 62, 0.10)',
    canvasLight: '#faf7f1',
    canvasDark: '#0a1626',
    shellLight: 'rgba(255, 255, 255, 0.92)',
    shellDark: 'rgba(10, 22, 38, 0.92)',
    surfaceLight: 'rgba(255, 255, 255, 0.96)',
    surfaceDark: 'rgba(17, 36, 58, 0.9)',
    borderLight: '#e4e4e1',
    borderDark: '#23374f',
    textLight: '#0b223e',
    textDark: '#f2ede5',
    mutedLight: '#434c59',
    mutedDark: '#c4bfb4',
    // The brand's general marketing/editorial surfaces are deliberately flat — no decorative
    // gradient outside the Scout AI sub-lane. The brand's only two gradients are carried
    // twice by design, not by drift: your-field.ts's YOUR_FIELD_ROLES.aiGradient/
    // aiPanelGradient expose them as Mantine theme.other values (the pre-issue-697 delivery
    // path, unscoped by colour scheme), and the `ai` field below (issue 697) is the same two
    // gradients plus the accent colour, as governed --gds-ai-* tokens with authored dark
    // siblings. Both read the same light-mode anchors; see the YOUR_FIELD_AI_* comment at the top
    // of this module for how the dark siblings were derived.
    gradient: 'none',
    hero: 'none',
    flatSurfaces: true,
    ai: {
      gradient: {
        light: `linear-gradient(135deg, ${YOUR_FIELD_SCOUT} 0%, ${YOUR_FIELD_SCOUT_2} 100%)`,
        dark: YOUR_FIELD_AI_GRADIENT_DARK,
      },
      panel: {
        light: `linear-gradient(124deg, ${YOUR_FIELD_NAVY_DEEP} 0%, #1A3A6A 100%)`,
        dark: YOUR_FIELD_AI_PANEL_DARK,
      },
      accent: {
        light: YOUR_FIELD_SCOUT,
        dark: YOUR_FIELD_AI_ACCENT_DARK,
      },
    },
    axes: {
      designRuleProfile: {
        ...GDS_DEFAULT_DESIGN_RULE_PROFILE,
        // Reserved-usage contract (issue 697, normative text in THEME_GOVERNANCE.md): the ai
        // lane is exclusive to Scout AI surfaces plus the focus ring and featured ring, and is
        // never a general action colour. Mechanically enforced by
        // `scripts/verify-ai-reserved-usage.mjs` (`verify:ai-reserved-usage`), not just declared
        // here as a claim.
        reservedAccents: [
          {
            role: 'ai.gradient',
            // 'SemanticButton' added by issue 700: its `gradient` brand intent is the one
            // SemanticButton treatment sanctioned to consume this lane, reserved for
            // AI-identity CTAs exclusively (e.g. "Ask Scout AI") -- every other brand intent
            // still keeps the preset's primary/accent roles (THEME_GOVERNANCE.md).
            surfaces: ['AISearchCard', 'ChatThread', 'ChatMessage', 'ChatInput', 'StreamingIndicator', 'AIPromoPanel', 'BottomTabBar', 'SemanticButton'],
          },
          { role: 'ai.panel', surfaces: ['AIPromoPanel'] },
          {
            role: 'ai.accent',
            surfaces: ['AISearchCard', 'ChatThread', 'ChatMessage', 'ChatInput', 'StreamingIndicator', 'AIPromoPanel', 'BottomTabBar', 'FocusRing', 'FeaturedRing'],
          },
        ],
      },
    },
  },
});
