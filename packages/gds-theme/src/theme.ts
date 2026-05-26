import { DEFAULT_THEME, createTheme, mergeMantineTheme, mergeThemeOverrides, type MantineTheme, type MantineThemeOverride } from '@mantine/core';

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
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-body)',
        }
      }
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
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
          backgroundColor: 'var(--mantine-color-dark-8)',
        },
      },
    },
    Card: {
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-dark-7)',
          borderColor: 'var(--mantine-color-dark-4)',
        },
      },
    },
    Paper: {
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-dark-7)',
          borderColor: 'var(--mantine-color-dark-4)',
        },
      },
    },
    Table: {
      styles: {
        table: {
          color: 'var(--mantine-color-gray-0)',
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

  return extendGdsTheme(mergedOverrides);
}

export function extendGdsTheme(overrides: MantineThemeOverride = {}) {
  return mergeMantineTheme(baseTheme, overrides);
}

export function withGdsMotion(overrides: MantineThemeOverride = {}) {
  return extendGdsTheme(
    mergeThemeOverrides(
      {
        components: {
          Button: {
            styles: {
              root: {
                transition: 'transform 150ms ease, filter 120ms ease',
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
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              },
            },
          },
        },
      },
      overrides,
    ),
  );
}
