import type { CSSProperties, ReactNode } from 'react';
import { Box, type BoxProps } from '@mantine/core';
import { GDS_RADIUS_ROLES, GDS_SHAPE_PROFILES, type GdsShapeProfile } from '@sovereignsquad/gds-theme';

/**
 * The `--gds-radius-<role>` declarations a {@link GdsShapeScope} sets for a profile: only the
 * profile's own entries, each pointing at a step token (`var(--gds-radius-sm)`) so it follows
 * the active theme's scale. Every other role, and every role under `default`, stays the theme's.
 */
export function getGdsShapeScopeStyle(profile: GdsShapeProfile): Record<string, string> {
  const roles = profile === 'default' ? {} : GDS_SHAPE_PROFILES[profile];
  const style: Record<string, string> = {};
  for (const role of GDS_RADIUS_ROLES) {
    const step = roles[role];
    if (step) style[`--gds-radius-${role}`] = `var(--gds-radius-${step})`;
  }
  return style;
}

/** Props for {@link GdsShapeScope}. */
export interface GdsShapeScopeProps extends Omit<BoxProps, 'style'> {
  /** Shape profile for the subtree: `operations` (tight), `workspace` (soft) or `default` (the theme's own roles). */
  profile: GdsShapeProfile;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Applies a shape profile to a subtree by setting the radius-role variables on its own
 * element, never on the document root. GDS components inside (Card, Paper, Button, TextInput,
 * Badge, Chip) read those roles. Modals and drawers render in a portal outside the subtree:
 * give them `withinPortal={false}` or spread {@link getGdsShapeScopeStyle} into their `styles`.
 */
export function GdsShapeScope({ profile, style, children, ...others }: GdsShapeScopeProps) {
  return (
    <Box {...others} data-gds-shape-profile={profile} style={{ ...getGdsShapeScopeStyle(profile), ...style } as CSSProperties}>
      {children}
    </Box>
  );
}
