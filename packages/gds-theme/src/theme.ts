import {
  DEFAULT_THEME, createTheme, defaultVariantColorsResolver, mergeMantineTheme, mergeThemeOverrides,
  type MantineTheme, type MantineThemeOverride, type VariantColorsResolver,
} from '@mantine/core';
import { getGdsMotionPreset } from './motion';
import { GDS_DEFAULT_DENSITY_AXIS, GDS_DEFAULT_SHAPE_AXIS } from './axes';

const baseTheme: MantineTheme = mergeMantineTheme(DEFAULT_THEME, createTheme({
  primaryColor: 'violet',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontSmoothing: true,
  defaultRadius: 'md',
  /**
   * Mantine's `light` variant pairs pastel text with a low-alpha tint of the same hue. A
   * translucent background makes contrast uncomputable, so this governs the pair at the
   * theme level rather than per call site.
   *
   * The tint is composed with `color-mix` against a real surface, producing an opaque colour
   * whose contrast can be measured. The foreground is the governed body text rather than a
   * shade of the hue, since a fixed shade fails on some hues (below 4.5:1 on orange/green).
   * The neutral pairing measures 9.14:1 at worst across all 25 presets x 2 schemes x 14
   * Mantine colours.
   *
   * Visible change: light-variant badge text is neutral instead of hue-tinted. The tint
   * itself still carries the colour.
   */
  variantColorResolver: ((input) => {
    const base = defaultVariantColorsResolver(input);
    if (input.variant !== 'light' || !input.color) return base;
    const tint = (shade: number, weight: string) =>
      `color-mix(in srgb, var(--mantine-color-${input.color}-${shade}) ${weight}, var(--gds-bg-card))`;
    return {
      ...base,
      background: `light-dark(${tint(6, '10%')}, ${tint(8, '15%')})`,
      hover: `light-dark(${tint(6, '16%')}, ${tint(8, '22%')})`,
      color: 'var(--gds-text-body)',
      border: base.border,
    };
  }) satisfies VariantColorsResolver,
  // Mantine's radius scale is fed from the shape axis, so `radius="md"` on any component
  // (146 such references) and every `var(--mantine-radius-*)` resolve through the same
  // declaration as `--gds-radius-*`. Without this the axis would be a parallel scale only
  // new code consults.
  //
  // `none` and `pill` are intentionally absent: Mantine's scale has no such keys.
  //
  // Mantine's spacing scale is fed from the density axis for the same reason: otherwise
  // `p="md"` and `--mantine-spacing-md` would resolve through a different declaration than
  // `--gds-space-md`.
  spacing: {
    xs: GDS_DEFAULT_DENSITY_AXIS.scale.xs,
    sm: GDS_DEFAULT_DENSITY_AXIS.scale.sm,
    md: GDS_DEFAULT_DENSITY_AXIS.scale.md,
    lg: GDS_DEFAULT_DENSITY_AXIS.scale.lg,
    xl: GDS_DEFAULT_DENSITY_AXIS.scale.xl,
  },
  radius: {
    xs: GDS_DEFAULT_SHAPE_AXIS.scale.xs,
    sm: GDS_DEFAULT_SHAPE_AXIS.scale.sm,
    md: GDS_DEFAULT_SHAPE_AXIS.scale.md,
    lg: GDS_DEFAULT_SHAPE_AXIS.scale.lg,
    xl: GDS_DEFAULT_SHAPE_AXIS.scale.xl,
  },
  black: '#111827',
  white: '#ffffff',
  headings: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    sizes: {
      h1: { fontSize: '2.5rem', fontWeight: '800' },
      h2: { fontSize: '1.75rem', fontWeight: '700' },
      h3: { fontSize: '1.25rem', fontWeight: '600' },
    },
  },
  // Overlay elevation scale. GDS's "no decorative shadow layering" policy applies to
  // cards/surfaces, not overlays — FOUNDATION.md: "Overlays may use elevation."
  // `xs`/`sm` stay unset (falling through to Mantine's defaults; `sm` is left alone since
  // Card's own `shadow: 'sm'` default depends on it). `md`/`lg` give overlay-tier
  // components (Popover, Menu, HoverCard, Select/Combobox/MultiSelect/Autocomplete
  // dropdowns) an explicit, documented elevation.
  shadows: {
    md: '0 8px 24px rgba(15, 23, 42, 0.08)',
    lg: '0 16px 40px rgba(15, 23, 42, 0.12)',
  },
  components: {
    Popover: {
      defaultProps: {
        shadow: 'md',
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
        fw: 600,
      },
    },
    Card: {
      // GDS-owned styling hook: theme classNames land `gds-card` on every Card root, so
      // the theme CSS keys on a GDS class instead of the vendor-internal
      // `.mantine-Card-root`. Survives preset theme merging.
      classNames: { root: 'gds-card' },
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: true,
      },
      styles: {
        root: {
          background: 'var(--mantine-color-body)',
        }
      }
    },
    Paper: {
      classNames: { root: 'gds-paper' },
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
    Alert: {
      classNames: { root: 'gds-alert' },
    },
    Code: {
      classNames: { root: 'gds-code' },
    },
    // Mobile input-focus auto-zoom guard: iOS Safari/Chrome force-zoom the page when a
    // focused input's computed font-size is under 16px. Mantine's `xs`/`sm` sizes render at
    // 12-14px. `Input.vars` is the same CSS-custom-property channel Mantine's built-in
    // resolver uses to set `--input-fz`, so this wins with no specificity contest — a bare
    // `input, select, textarea { font-size: 16px }` rule always loses to Mantine's generated
    // class selector. `md`/`lg`/`xl` already render >=16px and are left untouched. Applies to
    // every Input-based control since they all resolve `--input-fz` through this shared key.
    Input: {
      vars: (_theme: unknown, props: { size?: string }) => ({
        wrapper: {
          '--input-fz':
            props.size === undefined || props.size === 'xs' || props.size === 'sm'
              ? 'max(1rem, var(--mantine-font-size-sm))'
              : undefined,
        },
      }),
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Table: {
      defaultProps: {
        highlightOnHover: true,
        verticalSpacing: 'md',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    // NavLink exposes no size step that reaches the 44px touch-target floor; its default row
    // resolves to 41px. `--gds-control-height-md` is the governed control height, and
    // `resolveGdsDensityTokens` already clamps it to GDS_MIN_TARGET_PX under every density
    // mode, so consuming it here keeps the floor true rather than restating the number.
    NavLink: {
      classNames: { root: 'gds-navlink' },
      styles: {
        root: {
          minHeight: 'var(--gds-control-height-md)',
        },
      },
    },
  },
}));

/** The baseline GDS Mantine theme: neutral defaults, governed shadows, and GDS component styling. */
export const gdsTheme = baseTheme;

/** Dark-public lane: `gdsTheme` with explicit light/dark surfaces for shell, cards, paper, and tables. */
export const gdsDarkPublicTheme = extendGdsTheme({
  primaryColor: 'violet',
  components: {
    AppShell: {
      styles: {
        main: {
          background: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))',
        },
      },
    },
    Card: {
      styles: {
        root: {
          background: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
          borderColor: 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        },
      },
    },
    Paper: {
      styles: {
        root: {
          background: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
          borderColor: 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        },
      },
    },
    Table: {
      styles: {
        table: {
          color: 'light-dark(var(--mantine-color-dark-7), var(--mantine-color-gray-0))',
        },
      },
    },
  },
});

/** Flat-surface lane: `gdsTheme` with all shadows removed and bordered Card/Paper. */
export const gdsFlatSurfaceTheme = extendGdsTheme({
  shadows: {
    xs: 'none',
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
  },
  components: {
    Card: {
      defaultProps: {
        shadow: undefined,
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        withBorder: true,
      },
    },
  },
});

/** Editorial lane: `gdsTheme` with a serif heading family, larger heading sizes, and flat surfaces. */
export const gdsEditorialPublicTheme = extendGdsTheme({
  headings: {
    fontFamily: '"Instrument Serif", Georgia, "Times New Roman", serif',
    sizes: {
      h1: { fontSize: '2.75rem', fontWeight: '700' },
      h2: { fontSize: '2rem', fontWeight: '700' },
      h3: { fontSize: '1.375rem', fontWeight: '600' },
    },
  },
  shadows: {
    xs: 'none',
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
  },
  components: {
    Card: {
      defaultProps: {
        shadow: undefined,
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        withBorder: true,
      },
    },
  },
});

/** Options for `createPublicBrandTheme`: which lanes to layer over the base theme, plus extra overrides. */
export interface PublicBrandThemeOptions {
  /** Layer the editorial serif lane. */
  editorialSerif?: boolean;
  /** Layer the flat-surface (no-shadow) lane. */
  flatSurfaces?: boolean;
  /** Additional Mantine overrides merged last (win over the layered lanes). */
  overrides?: MantineThemeOverride;
}

function composeGdsTheme(overrides: MantineThemeOverride = {}) {
  return mergeMantineTheme(baseTheme, overrides);
}

/** Composes a public brand theme by layering the flat-surface and/or editorial lanes and the given overrides over the base GDS theme. */
export function createPublicBrandTheme({
  editorialSerif = false,
  flatSurfaces = false,
  overrides = {},
}: PublicBrandThemeOptions = {}) {
  const layeredOverrides: MantineThemeOverride[] = [];

  if (flatSurfaces) {
    layeredOverrides.push(gdsFlatSurfaceTheme);
  }

  if (editorialSerif) {
    layeredOverrides.push(gdsEditorialPublicTheme);
  }

  layeredOverrides.push(overrides);

  const mergedOverrides = layeredOverrides.reduce<MantineThemeOverride>(
    (theme, layer) => mergeThemeOverrides(theme, layer),
    {},
  );

  return composeGdsTheme(mergedOverrides);
}

/**
 * @deprecated Consumer repositories should use `gdsTheme`, `gdsDarkPublicTheme`,
 * `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, or `createPublicBrandTheme(...)`
 * instead of building a custom branding layer with `extendGdsTheme(...)`.
 * This helper remains temporarily exported for bounded internal/runtime composition only.
 */
export function extendGdsTheme(overrides: MantineThemeOverride = {}) {
  return composeGdsTheme(overrides);
}

/** Extends the GDS theme with governed hover/press Button and Card motion (feedback and list presets), then merges `overrides` on top. */
export function withGdsMotion(overrides: MantineThemeOverride = {}) {
  const feedbackMotion = getGdsMotionPreset('feedback');
  const listMotion = getGdsMotionPreset('list');
  return extendGdsTheme(
    mergeThemeOverrides(
      {
        components: {
          Button: {
            styles: {
              root: {
                transition: `transform ${feedbackMotion.durationMs}ms ${feedbackMotion.easingValue}, filter var(--gds-motion-duration-fast) var(--gds-motion-ease-standard)`,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  filter: 'brightness(1.05)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  filter: 'brightness(0.95)',
                },
              },
            },
          },
          Card: {
            styles: {
              root: {
                transition: `transform ${listMotion.durationMs}ms ${listMotion.easingValue}, box-shadow ${listMotion.durationMs}ms ${listMotion.easingValue}`,
              },
            },
          },
        },
      },
      overrides,
    ),
  );
}

/**
 * Wraps a theme so its `light` variant is governed, whatever the theme is.
 *
 * Putting the resolver on `gdsTheme` alone is not enough: `GdsProvider` accepts any
 * `MantineThemeOverride`, and a preset built by `resolveGdsThemePreset` does not descend
 * from `gdsTheme`, so the governed lane would be dropped on any route using a preset.
 * Applied inside the provider so no theme can opt out of it by accident.
 *
 * A consumer's own resolver is still honoured for every other variant; only `light` is
 * forced, since that is the lane with no measurable contrast.
 */
export function withGdsGovernedVariants(theme: MantineThemeOverride): MantineThemeOverride {
  const inherited = theme.variantColorResolver;
  return {
    ...theme,
    variantColorResolver: (input) => (
      input.variant === 'light'
        ? gdsTheme.variantColorResolver(input)
        : (inherited ?? defaultVariantColorsResolver)(input)
    ),
  };
}
