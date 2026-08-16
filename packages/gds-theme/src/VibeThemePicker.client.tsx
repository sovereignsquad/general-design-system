'use client';

import { useMantineColorScheme } from '@mantine/core';
import { getGdsVibeThemes, getGdsVibeThemeCssVariables } from './vibe-themes';
import type { GdsThemePresetId } from './theme-presets';

/** Props for `VibeThemePicker`. */
export interface VibeThemePickerProps {
  /** Currently selected preset id. */
  value: GdsThemePresetId;
  /** Called with the newly selected preset id. */
  onChange: (id: GdsThemePresetId) => void;
  /** Accessible label and legend for the picker. Defaults to `'Choose theme'`. */
  label?: string;
}

/** Accessible radiogroup of vibe-theme swatches; each swatch previews a preset via its `--gds-vibe-*` variables and selects it on click. */
export function VibeThemePicker({ value, onChange, label = 'Choose theme' }: VibeThemePickerProps) {
  const { colorScheme } = useMantineColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const vibes = getGdsVibeThemes();

  return (
    <fieldset
      style={{ border: 'none', padding: 0, margin: 0 }}
      aria-label={label}
    >
      <legend
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: 'var(--mantine-color-text)',
        }}
      >
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
      >
        {vibes.map((vibe) => {
          const vars = getGdsVibeThemeCssVariables(vibe.id, scheme);
          const selected = vibe.id === value;
          return (
            <button
              key={vibe.id}
              type="button"
              role="radio"
              className="gds-touch-target-pad-swatch"
              data-gds-target-exception="compact-swatch-grid"
              aria-checked={selected}
              aria-label={vibe.label}
              title={vibe.label}
              onClick={() => onChange(vibe.id)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: selected
                  ? `3px solid ${vars['--gds-vibe-text']}`
                  : `2px solid ${vars['--gds-vibe-border']}`,
                // Issue 618: the small-surface atmosphere token, not the page-scale hero wash.
                // A 32px circle filled with a 135deg hero ramp shows a hard diagonal instead of
                // the atmosphere -- the swatch stopped previewing the thing it names.
                background: vars['--gds-vibe-swatch'],
                cursor: 'pointer',
                outline: 'none',
                boxShadow: selected ? `0 0 0 3px ${vars['--gds-vibe-glow']}` : undefined,
                transition: 'box-shadow var(--gds-motion-duration-fast) var(--gds-motion-ease-standard), border-width var(--gds-motion-duration-fast) var(--gds-motion-ease-standard)',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLButtonElement).style.outline = `2px solid ${vars['--gds-vibe-primary']}`;
                (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLButtonElement).style.outline = 'none';
              }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
