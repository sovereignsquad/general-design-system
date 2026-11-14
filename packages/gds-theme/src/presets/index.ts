import defaultPreset from './default';
import highContrastPreset from './high-contrast';
import colorblindSafePreset from './colorblind-safe';
import darkPublicPreset from './dark-public';
import flatSurfacePreset from './flat-surface';
import editorialPreset from './editorial';
import brandPreset from './brand';
import partnerDiscoveryPreset from './partner-discovery';
import classUsaPreset from './class-usa';
import goldAthletePreset from './gold-athlete';
import padelAfricaPreset from './padel-africa';
import yourFieldPreset from './your-field';
import sunsetPreset from './sunset';
import oceanicPreset from './oceanic';
import forestPreset from './forest';
import rubyPreset from './ruby';
import amberPreset from './amber';
import neonNightPreset from './neon-night';
import skylinePreset from './skyline';
import auroraPreset from './aurora';
import coralPreset from './coral';
import mintPreset from './mint';
import orchidPreset from './orchid';
import royalPreset from './royal';
import warmPreset from './warm';
import athleteGoldPreset from './athlete-gold';
import cosmicPreset from './cosmic';

/**
 * Every built-in theme preset, in catalog order. The preset id union, the catalog, the
 * Mantine lane map and the vibe map are all derived from this list.
 */
export const gdsThemePresetRegistry = [
  defaultPreset,
  highContrastPreset,
  colorblindSafePreset,
  darkPublicPreset,
  flatSurfacePreset,
  editorialPreset,
  brandPreset,
  partnerDiscoveryPreset,
  classUsaPreset,
  goldAthletePreset,
  padelAfricaPreset,
  yourFieldPreset,
  sunsetPreset,
  oceanicPreset,
  forestPreset,
  rubyPreset,
  amberPreset,
  neonNightPreset,
  skylinePreset,
  auroraPreset,
  coralPreset,
  mintPreset,
  orchidPreset,
  royalPreset,
  warmPreset,
  athleteGoldPreset,
  cosmicPreset,
] as const;
