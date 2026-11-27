'use client';

import { createElement } from 'react';
import { gdsDevWarnOnce, useGdsTranslation } from '@sovereignsquad/gds-theme';
import { resolveGdsActivityPictogramLabel, gdsActivityPictograms, type GdsPictogramFamily, type GdsPictogramDefinition, type GdsPictogramTreatment, GDS_PICTOGRAM_DISABLED_OPACITY, GDS_PICTOGRAM_HERO_LAYERS, GDS_PICTOGRAM_TREATMENT_SCALE, type GdsPictogramScale, GDS_PICTOGRAM_STROKE_BY_SCALE, GDS_PICTOGRAM_SCALE_PX, GDS_PICTOGRAM_GRID } from './pictograms.shared';

/** Interaction/emphasis state, expressed only through existing color tokens — never a new hue. */
export type GdsPictogramState = 'default' | 'hover' | 'selected' | 'disabled';

/**
 * `selected`-state stroke color: the semantic, un-specialised accent role (`--gds-accent`),
 * which resolves per theme preset (terracotta in the Linen lane, that lane's own accent
 * elsewhere) — never a curated per-category accent like `GdsBadge`'s `accent` prop. The
 * fallback chain ends at Mantine's own primary-color token, mirroring `gdsIconToneColor.primary`
 * in `icons.ts`, so a pictogram never renders colorless before a GDS theme mounts.
 */
const GDS_PICTOGRAM_SELECTED_STROKE = 'var(--gds-accent, var(--mantine-primary-color-filled))';

interface GdsPictogramRenderOptions {
  sizePx: number;
  strokeWidth: number;
  state: GdsPictogramState;
  treatment: GdsPictogramTreatment;
  isDecorative: boolean;
  ariaLabel: string | undefined;
}

/** Renders a layout-stable empty slot for an unresolvable lookup with no `fallbackKey` — same box size, no `<path>`, always decorative. */
function renderGdsPictogramEmptySlot(sizePx: number) {
  return createElement('svg', {
    viewBox: `0 0 ${GDS_PICTOGRAM_GRID} ${GDS_PICTOGRAM_GRID}`,
    width: sizePx,
    height: sizePx,
    'aria-hidden': true,
    'data-gds-pictogram-fallback': 'empty',
  });
}

/** Renders one pictogram definition to a single inline `<svg>` (or, for `hero`, the bounded layered recipe of the same drawing). */
function renderGdsPictogramSvg(definition: GdsPictogramDefinition, options: GdsPictogramRenderOptions) {
  const { sizePx, strokeWidth, state, treatment, isDecorative, ariaLabel } = options;
  const iconColor = state === 'selected' ? GDS_PICTOGRAM_SELECTED_STROKE : 'currentColor';
  const opacity = state === 'disabled' ? GDS_PICTOGRAM_DISABLED_OPACITY : undefined;
  const isFill = definition.fillMode === 'fill';

  const svgProps: Record<string, unknown> = {
    viewBox: `0 0 ${GDS_PICTOGRAM_GRID} ${GDS_PICTOGRAM_GRID}`,
    width: sizePx,
    height: sizePx,
    fill: isFill ? iconColor : 'none',
    stroke: isFill ? 'none' : iconColor,
    ...(isFill ? {} : { strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    'aria-hidden': isDecorative || undefined,
    role: !isDecorative ? 'img' : undefined,
    'aria-label': !isDecorative ? ariaLabel : undefined,
    'data-gds-pictogram': definition.key,
    'data-gds-pictogram-treatment': treatment,
    'data-gds-pictogram-state': state,
    'data-gds-pictogram-fill-mode': definition.fillMode ?? 'stroke',
  };

  if (treatment !== 'hero') {
    return createElement(
      'svg',
      { ...svgProps, style: opacity !== undefined ? { opacity } : undefined },
      createElement('path', { d: definition.path }),
    );
  }

  // Hero: the bounded layer recipe, each a transform (translate + scale, recentered on the
  // grid midpoint) of the identical drawing — never a second color or a second path shape.
  return createElement(
    'svg',
    { ...svgProps, style: { overflow: 'visible', ...(opacity !== undefined ? { opacity } : {}) } },
    GDS_PICTOGRAM_HERO_LAYERS.map((layer, index) => {
      const center = GDS_PICTOGRAM_GRID / 2;
      return createElement(
        'g',
        {
          key: index,
          opacity: layer.opacity,
          transform: `translate(${center + layer.offsetX} ${center + layer.offsetY}) scale(${layer.scale}) translate(${-center} ${-center})`,
        },
        createElement('path', { d: definition.path }),
      );
    }),
  );
}

/** Props for {@link GdsPictogram}. */
export interface GdsPictogramProps {
  /** Family to draw from. Defaults to the shipped activity family. */
  family?: GdsPictogramFamily;
  /** Pictogram key within the family (typed to `GdsActivityPictogramKey` for the default family). */
  pictogram: string;
  /** Contextual treatment. Defaults to 'list'. */
  treatment?: GdsPictogramTreatment;
  /** Explicit scale override; defaults to the treatment's default scale. */
  scale?: GdsPictogramScale;
  /** Interaction state expressed through existing tokens. Defaults to 'default'. */
  state?: GdsPictogramState;
  /** Accessible label; supplying it makes the pictogram informative (role img). */
  label?: string;
  /** Forces decorative (aria-hidden) rendering. Defaults to true when no label is given. */
  decorative?: boolean;
}

/**
 * Renders a governed activity pictogram: a deterministic, synchronous, SSR-safe inline SVG
 * resolved from a validated {@link GdsPictogramFamily} by key, contextual treatment, scale, and
 * interaction state. One drawing per pictogram — treatment and scale never swap geometry, only
 * size, stroke weight, and (for `hero`) layered scale/opacity copies of the same path. An
 * unresolvable key renders the family's `fallbackKey` if set, otherwise a layout-stable empty
 * slot, and warns once in development — it never throws at render time.
 *
 * Accessibility mirrors `GdsIcon` exactly: no `label` renders `aria-hidden`; supplying `label`
 * (or `decorative={false}`) renders `role="img"` with an `aria-label`, using the shipped
 * family's localized default label when the caller supplies none.
 */
export function GdsPictogram(props: GdsPictogramProps) {
  const { t } = useGdsTranslation();
  const family: GdsPictogramFamily<string> = props.family ?? gdsActivityPictograms;
  const definition = family.pictograms[props.pictogram];
  const treatment = props.treatment ?? 'list';
  const scale = props.scale ?? GDS_PICTOGRAM_TREATMENT_SCALE[treatment];
  const sizePx = GDS_PICTOGRAM_SCALE_PX[scale];
  const strokeWidth = GDS_PICTOGRAM_STROKE_BY_SCALE[scale];
  const state = props.state ?? 'default';
  const isDecorative = props.decorative ?? !props.label;

  if (!definition) {
    gdsDevWarnOnce(
      `GdsPictogram:unknown-key:${family.id}`,
      `GdsPictogram received pictogram key "${props.pictogram}" not present in family "${family.id}". `
      + 'Rendering the family\'s fallbackKey if set, otherwise a layout-stable empty slot.',
    );
    const fallbackDefinition = family.fallbackKey ? family.pictograms[family.fallbackKey] : undefined;
    if (!fallbackDefinition) {
      return renderGdsPictogramEmptySlot(sizePx);
    }
    const fallbackAriaLabel = isDecorative ? undefined : (props.label ?? fallbackDefinition.label);
    return renderGdsPictogramSvg(fallbackDefinition, { sizePx, strokeWidth, state, treatment, isDecorative, ariaLabel: fallbackAriaLabel });
  }

  const isDefaultFamily = family === gdsActivityPictograms;
  const defaultLabel = isDefaultFamily
    ? resolveGdsActivityPictogramLabel(props.pictogram, t, definition.label)
    : definition.label;
  const ariaLabel = isDecorative ? undefined : (props.label ?? defaultLabel);

  return renderGdsPictogramSvg(definition, { sizePx, strokeWidth, state, treatment, isDecorative, ariaLabel });
}
