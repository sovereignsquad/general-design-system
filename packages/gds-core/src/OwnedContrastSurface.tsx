import type { CSSProperties } from 'react';
import type { GdsVibeTheme } from '@sovereignsquad/gds-theme';

// Owned-contrast roles are the intentional *vibe swatch* surfaces that preview a
// specific theme atmosphere rather than matching the surrounding page. The
// retired `theme-lab-controls` role (issue #461) forced the Theme Lab's primary
// control/result cards onto a dark `surfaceDark` surface, which painted dark
// boxes on a light page; those cards now re-theme globally like any `.gds-paper`.
export type GdsOwnedContrastRole = 'vibe-gallery-card' | 'vibe-contract' | 'athlete-gold-reference';

export interface GdsOwnedContrastTokens {
  text: string;
  muted: string;
  background: string;
  radius: string;
  primary: string;
  accent: string;
  surface: string;
  border: string;
  link: string;
  control: string;
  controlText: string;
  backgroundColor?: string;
  borderColor?: string;
  boxShadow?: CSSProperties['boxShadow'];
}

export interface GdsOwnedContrastPropsInput {
  role: GdsOwnedContrastRole;
  tokens: GdsOwnedContrastTokens;
}

export function createGdsOwnedContrastTokens(
  vibe: GdsVibeTheme,
  options: {
    background: string;
    radius: string;
    surface?: string;
    border?: string;
    text?: string;
    muted?: string;
    link?: string;
    control?: string;
    controlText?: string;
    backgroundColor?: string;
    borderColor?: string;
    boxShadow?: CSSProperties['boxShadow'];
  },
): GdsOwnedContrastTokens {
  const text = options.text ?? vibe.textLight;
  const muted = options.muted ?? vibe.mutedLight;
  const surface = options.surface ?? vibe.surfaceLight;
  const border = options.border ?? vibe.borderLight;

  return {
    text,
    muted,
    background: options.background,
    radius: options.radius,
    primary: vibe.primary,
    accent: vibe.accent,
    surface,
    border,
    link: options.link ?? `color-mix(in srgb, ${vibe.primary} 64%, ${text})`,
    control: options.control ?? `color-mix(in srgb, ${surface} 88%, ${vibe.primary} 8%)`,
    controlText: options.controlText ?? text,
    backgroundColor: options.backgroundColor ?? surface,
    borderColor: options.borderColor ?? border,
    boxShadow: options.boxShadow,
  };
}

export function getGdsOwnedContrastProps({ role, tokens }: GdsOwnedContrastPropsInput) {
  const style: CSSProperties = {
    '--mantine-color-text': tokens.text,
    '--mantine-color-dimmed': tokens.muted,
    '--gds-local-background': tokens.background,
    '--gds-local-radius': tokens.radius,
    '--gds-vibe-primary': tokens.primary,
    '--gds-vibe-accent': tokens.accent,
    '--gds-vibe-surface': tokens.surface,
    '--gds-vibe-border': tokens.border,
    '--gds-vibe-text': tokens.text,
    '--gds-vibe-muted': tokens.muted,
    '--gds-vibe-link': tokens.link,
    '--gds-vibe-control': tokens.control,
    '--gds-vibe-control-text': tokens.controlText,
    color: tokens.text,
    backgroundColor: tokens.backgroundColor,
    backgroundImage: 'var(--gds-local-background)',
    borderColor: tokens.borderColor,
    boxShadow: tokens.boxShadow,
  } as CSSProperties;

  return {
    'data-gds-owned-contrast': role,
    'data-gds-local-contrast': role,
    style,
  } as const;
}
