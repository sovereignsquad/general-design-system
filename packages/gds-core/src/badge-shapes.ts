import { createReactComponent } from '@tabler/icons-react';
import type { IconNode } from '@tabler/icons-react';

/**
 * Badge shape vocabulary (issue #487, part of epic #484).
 *
 * Six badge silhouettes authored with Tabler's public `createReactComponent`
 * from Tabler's own `iconNode` path data — the geometry is imported, never
 * hand-drawn, so corner language, stroke behavior, and the 24×24 coordinate
 * space match the `GdsIcons` registry by construction.
 *
 * These are deliberately *siblings* of `<GdsIcon />`, not registry entries:
 * they expose the full Tabler prop surface (`size`, `stroke`, `color`,
 * `className`, `style`, `ref`, rest-spread) that `<GdsIcon />` intentionally
 * withholds, because badge composition (`GdsBadgeStack`, #488) needs to layer
 * and position them. Rendered shapes default to `stroke="currentColor"`;
 * under forced-colors they inherit the system text color like every other
 * registry icon.
 */

const circleNode: IconNode = [
  ['path', { d: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', key: 'svg-0' }],
];

const squircleNode: IconNode = [
  ['path', { d: 'M12 3c7.2 0 9 1.8 9 9c0 7.2 -1.8 9 -9 9c-7.2 0 -9 -1.8 -9 -9c0 -7.2 1.8 -9 9 -9', key: 'svg-0' }],
];

const hexagonNode: IconNode = [
  ['path', { d: 'M19.875 6.27a2.225 2.225 0 0 1 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033', key: 'svg-0' }],
];

const shieldNode: IconNode = [
  ['path', { d: 'M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3', key: 'svg-0' }],
];

const rosetteNode: IconNode = [
  ['path', { d: 'M5 7.2a2.2 2.2 0 0 1 2.2 -2.2h1a2.2 2.2 0 0 0 1.55 -.64l.7 -.7a2.2 2.2 0 0 1 3.12 0l.7 .7c.412 .41 .97 .64 1.55 .64h1a2.2 2.2 0 0 1 2.2 2.2v1c0 .58 .23 1.138 .64 1.55l.7 .7a2.2 2.2 0 0 1 0 3.12l-.7 .7a2.2 2.2 0 0 0 -.64 1.55v1a2.2 2.2 0 0 1 -2.2 2.2h-1a2.2 2.2 0 0 0 -1.55 .64l-.7 .7a2.2 2.2 0 0 1 -3.12 0l-.7 -.7a2.2 2.2 0 0 0 -1.55 -.64h-1a2.2 2.2 0 0 1 -2.2 -2.2v-1a2.2 2.2 0 0 0 -.64 -1.55l-.7 -.7a2.2 2.2 0 0 1 0 -3.12l.7 -.7a2.2 2.2 0 0 0 .64 -1.55v-1', key: 'svg-0' }],
];

// IconMapPin's balloon silhouette only: Tabler's decorative inner dot is
// dropped so the balloon head can host a composed icon instead. When
// composing, center the inner icon in the head (around y≈10.3 of the 24-unit
// canvas), not the geometric middle — the tail stays clear.
/**
 * The pin balloon's path data, exported as the single source for every renderer that cannot
 * compose the React component — issue 620's map markers build an engine-injected SVG string
 * from exactly this path, so the marker on the map and `GdsBadgeShapePin` cannot drift apart.
 * 24-unit canvas, head is an arc of radius 8 centred at (12, 11).
 */
export const GDS_PIN_SILHOUETTE_PATH = 'M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0';

const pinNode: IconNode = [
  ['path', { d: GDS_PIN_SILHOUETTE_PATH, key: 'svg-0' }],
];

/** Circle badge silhouette (Tabler `IconCircle` geometry). The neutral member of the set — suggested default for count badges and generic interests. */
export const GdsBadgeShapeCircle = createReactComponent('outline', 'gds-badge-shape-circle', 'GdsBadgeShapeCircle', circleNode);

/** Squircle badge silhouette (Tabler `IconSquareRounded` geometry). Softer than the circle — suggested for persona badges. */
export const GdsBadgeShapeSquircle = createReactComponent('outline', 'gds-badge-shape-squircle', 'GdsBadgeShapeSquircle', squircleNode);

/** Hexagon badge silhouette (Tabler `IconHexagon` geometry). Reads "activity" before anyone reads the label — suggested for activity/interest badges. */
export const GdsBadgeShapeHexagon = createReactComponent('outline', 'gds-badge-shape-hexagon', 'GdsBadgeShapeHexagon', hexagonNode);

/** Shield badge silhouette (Tabler `IconShield` geometry). The claim-about-a-fact shape — suggested for verification badges, paired with the fixed success tone. */
export const GdsBadgeShapeShield = createReactComponent('outline', 'gds-badge-shape-shield', 'GdsBadgeShapeShield', shieldNode);

/** Rosette badge silhouette (Tabler `IconRosette` geometry). The scalloped seal — suggested for certification and award badges. */
export const GdsBadgeShapeRosette = createReactComponent('outline', 'gds-badge-shape-rosette', 'GdsBadgeShapeRosette', rosetteNode);

/** Map-pin badge silhouette (Tabler `IconMapPin` balloon geometry, inner dot dropped so the head can host a composed icon). For badges placed on maps and location-anchored chips. */
export const GdsBadgeShapePin = createReactComponent('outline', 'gds-badge-shape-pin', 'GdsBadgeShapePin', pinNode);

/**
 * Badge shape dictionary, mirroring the `GdsIcons` pattern: closed, typechecked
 * lookup from shape name to component, so consumers (and #489's `GdsBadge`
 * `shape` prop) select shapes from a governed union instead of importing
 * arbitrary silhouettes.
 */
export const GdsBadgeShapes = {
  circle: GdsBadgeShapeCircle,
  squircle: GdsBadgeShapeSquircle,
  hexagon: GdsBadgeShapeHexagon,
  shield: GdsBadgeShapeShield,
  rosette: GdsBadgeShapeRosette,
  pin: GdsBadgeShapePin,
};

/** Canonical name of a badge shape in the {@link GdsBadgeShapes} dictionary. */
export type GdsBadgeShapeName = keyof typeof GdsBadgeShapes;
