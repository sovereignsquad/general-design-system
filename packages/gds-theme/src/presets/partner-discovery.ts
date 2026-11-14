import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';
import { extendGdsTheme } from '../theme';

/** Compact, family-friendly teal/lime map-and-list discovery theme with explicit dark-mode tokens. */
const partnerDiscoveryMantineTheme = extendGdsTheme({
  primaryColor: 'teal',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Jost, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    sizes: {
      h1: { fontSize: '2rem', fontWeight: '500', lineHeight: '1.2' },
      h2: { fontSize: '1.5rem', fontWeight: '500', lineHeight: '1.25' },
      h3: { fontSize: '1.0625rem', fontWeight: '500', lineHeight: '1.2' },
    },
  },
  colors: {
    teal: ['#e8f5f2', '#cfe7e1', '#9bcfc3', '#67b5a5', '#3f9d8a', '#23816f', '#126858', '#08463b', '#06392f', '#03251f'],
    lime: ['#ecffe4', '#d4ffc2', '#a4f58c', '#75e653', '#4fd51f', '#2fc800', '#28a900', '#208700', '#196900', '#104500'],
  },
  defaultRadius: 'md',
  black: '#010800',
  white: '#ffffff',
  components: {
    AppShell: {
      styles: {
        main: {
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(linear-gradient(#ffffffcc, #ffffffcc), #071411)',
        },
        header: {
          color: 'light-dark(#08463b, #d4ffc2)',
          background: 'light-dark(#ffffffd9, #071411)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    Button: {
      defaultProps: {
        radius: 'xl',
        size: 'sm',
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
        radius: 'md',
        withBorder: true,
        shadow: undefined,
      },
      styles: {
        root: {
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(#ffffff, #0d211c)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
      },
      styles: {
        root: {
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(#ffffff, #0d211c)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        input: {
          minHeight: 38,
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(#ffffff, #0d211c)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
  other: {
    gdsPartnerDiscoveryTokens: {
      teal: '#08463b',
      lime: '#2fc800',
      dark: '#010800',
      gray: '#dddddd',
      warm: '#eedad0',
      cardRadius: 8,
      mapRadius: 16,
      pillRadius: 24,
    },
  },
});

export default defineGdsThemePreset({
  id: 'partner-discovery',
  catalog: {
    label: 'Partner discovery theme',
    description: 'Compact family-friendly map/list discovery lane with teal/lime semantics and explicit dark-mode tokens.',
    runtimeLane: 'partnerDiscoveryThemePreset',
  },
  mantine: partnerDiscoveryMantineTheme,
  vibe: {
    ...neutralVibe,
    id: 'partner-discovery',
    label: 'Partner discovery theme',
    primary: '#08463b',
    accent: '#2fc800',
    glow: 'rgba(47, 200, 0, 0.2)',
    canvasLight: '#ffffff',
    canvasDark: '#071411',
    shellLight: 'rgba(255, 255, 255, 0.88)',
    shellDark: 'rgba(7, 20, 17, 0.9)',
    surfaceLight: 'rgba(255, 255, 255, 0.94)',
    surfaceDark: 'rgba(13, 33, 28, 0.88)',
    borderLight: 'rgba(8, 70, 59, 0.18)',
    borderDark: 'rgba(212, 255, 194, 0.26)',
    textLight: '#010800',
    textDark: '#f4f7fb',
    mutedLight: '#333333',
    mutedDark: '#c9d8d3',
    gradient: 'linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.78)), radial-gradient(circle at 20% 10%, rgba(47,200,0,0.14), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(8, 70, 59, 0.12), rgba(47, 200, 0, 0.16))',
  },
});
