import { DEFAULT_THEME, createTheme, mergeMantineTheme, mergeThemeOverrides, type MantineTheme, type MantineThemeOverride } from '@mantine/core';
import { getGdsMotionPreset } from './motion';

const baseTheme: MantineTheme = mergeMantineTheme(DEFAULT_THEME, createTheme({
  primaryColor: 'violet',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontSmoothing: true,
  defaultRadius: 'md',
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
  shadows: {
    md: '0 8px 24px rgba(15, 23, 42, 0.08)',
    lg: '0 16px 40px rgba(15, 23, 42, 0.12)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
        fw: 600,
      },
    },
    Card: {
      // GDS-owned styling hook (issue #345): theme classNames land `gds-card` on
      // every Card root, so the theme CSS keys on a GDS class instead of the
      // vendor-internal `.mantine-Card-root`. Survives preset theme merging.
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
  },
}));

export const gdsTheme = baseTheme;

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

export interface PublicBrandThemeOptions {
  editorialSerif?: boolean;
  flatSurfaces?: boolean;
  overrides?: MantineThemeOverride;
}

function composeGdsTheme(overrides: MantineThemeOverride = {}) {
  return mergeMantineTheme(baseTheme, overrides);
}

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
