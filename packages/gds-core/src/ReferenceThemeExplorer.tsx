'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Code,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { MantineThemeOverride } from '@mantine/core';
import { ActionBar } from './ActionBar';
import { FormField } from './FormField';
import { ListingCard } from './ListingCard';
import { ReferenceSection } from './ReferenceSection';
import { StateBlock } from './StateBlock';
import { ThemeToggle } from './ThemeToggle';
import {
  GdsProvider,
  applyGdsFontLane,
  getGdsFontLanes,
  getGdsThemePresets,
  getGdsVibeThemes,
  resolveGdsThemePreset,
  useGdsTranslation,
  type GdsFontLaneId,
  type GdsThemePresetId,
} from '@doneisbetter/gds-theme';

export type ThemePresetId = GdsThemePresetId;
export type ThemeSchemeId = 'light' | 'dark' | 'auto';
export interface ThemeExplorerSelection {
  preset: ThemePresetId;
  colorScheme: ThemeSchemeId;
  theme: MantineThemeOverride;
  fontLane?: GdsFontLaneId;
  runtimeKey?: string;
  brandPrimary?: string;
  brandFlatSurfaces?: boolean;
  brandEditorialSerif?: boolean;
}

function resolvePreviewColorScheme(presetId: ThemePresetId, requestedScheme: ThemeSchemeId): ThemeSchemeId {
  if (presetId === 'dark-public' || presetId === 'neon-night' || presetId === 'cosmic') {
    return 'dark';
  }

  return requestedScheme;
}

const presetCatalog = getGdsThemePresets();
const vibeCatalog = getGdsVibeThemes();
const vibeCatalogById = Object.fromEntries(vibeCatalog.map((vibe) => [vibe.id, vibe]));
const themePresetCatalog = Object.fromEntries(
  presetCatalog.map((preset) => [
    preset.id,
    {
      label: preset.label,
      bestFor: `Apps aligned with ${preset.label.toLowerCase()}.`,
      summary: preset.description,
      themeKey: preset.runtimeLane,
      supportedUse: `General product adoption with ${preset.label}.`,
      avoidFor: 'Avoid creating a local non-canonical theme authority.',
    },
  ]),
) as Record<ThemePresetId, { label: string; bestFor: string; summary: string; themeKey: string; supportedUse: string; avoidFor?: string }>;

const colorSchemeProof = [
  {
    id: 'light',
    label: 'Light',
    description: 'Validates readable default surfaces, controls, badges, and focus states against light backgrounds.',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Validates contrast for public, operational, and feedback surfaces when dark mode is active.',
  },
  {
    id: 'auto',
    label: 'Auto',
    description: 'Documents the adopter path for OS-controlled schemes while keeping the provider contract unchanged.',
  },
] as const;

const explorerCopy = {
  en: {
    themeLabTitle: 'Theme Lab',
    themeLabDescription: 'Test the actual shipped GDS theme presets, color-scheme behavior, and the governed brand-theme generator. This page is part of the live demo, not a separate styling experiment.',
    themePresetTitle: 'Theme preset',
    presetLabel: 'Preset',
    previewColorSchemeLabel: 'Preview color scheme',
    webfontLaneLabel: 'Webfont lane',
    resetThemeLab: 'Reset theme lab',
    shellBehavior: 'Theme changes apply to the official site shell so visitors can validate real whole-page runtime behavior.',
    brandOptionsTitle: 'Brand builder options',
    brandPrimaryColorLabel: 'Brand primary color',
    useFlatSurfaces: 'Use flat surfaces',
    useEditorialSerif: 'Use editorial serif headings',
    generatorDescription: 'The generator composes shipped helpers instead of creating a second theme authority inside the website.',
    currentSelectionTitle: 'Current selection summary',
    bestFor: 'Best for:',
    runtimeLane: 'Runtime lane:',
    colorScheme: 'Color scheme:',
    darkForwardNotice: 'This dark-forward preset always renders in dark mode inside the live preview.',
    compareToggle: 'Compare against a second shipped preset',
    comparisonPresetLabel: 'Comparison preset',
    shippedLanesTitle: 'Shipped theme lanes',
    shippedLanesDescription: 'Every lane below is a supported runtime preset. Colourful lanes ship as full CSS-based VibeThemes: canvas, shell, surface, control, focus, and accent tokens, not bitmap backgrounds.',
    selected: 'Selected',
    cssVibeTheme: 'CSS VibeTheme',
    previewVibe: 'Preview this vibe',
    avoidFor: 'Avoid for:',
    noSpecialExclusion: 'No special exclusion noted for this lane.',
    vibeContractTitle: 'Current VibeTheme contract',
    vibeContractDescription: 'The selected preset exports these package-owned CSS tokens. Consumers can render expressive product surfaces while staying inside GDS theme ownership.',
    tokenLabels: ['Primary', 'Accent', 'Light canvas', 'Dark canvas', 'Light surface', 'Dark surface'],
    proofTitle: 'Light, dark, and auto proof',
    proofDescription: 'Every official lane must remain usable across explicit light, explicit dark, and OS-controlled auto modes. The dark-public lane is intentionally forced to dark in preview to preserve its contrast contract.',
    requiredProof: 'Required proof: semantic text, visible focus, and contrast-safe state treatment.',
    livePreviewTitle: 'Live Theme Preview',
    livePreviewDescription: 'Visitors can test the shipped presets, compare lanes, and inspect actual GDS surfaces under each theme.',
    comparisonPreviewTitle: 'Comparison Preview Surface',
    comparisonPreviewDescription: 'Compare another shipped theme against the current selection before adopting it downstream.',
    unsupportedTitle: 'Unsupported lane boundary',
    unsupportedDescription: 'Unsupported local theme lanes are blocked by policy and compliance because they create parallel design-system authority.',
    doNotCreateTitle: 'Do not create local branding-layer helpers',
    doNotCreateDescription: 'If a consumer needs brand expression, use createPublicBrandTheme(...). If a lane is missing, request it for GDS instead of building extendGdsTheme(...), createTheme(...), or mergeMantineTheme(...) ownership locally.',
    approvedRemediation: 'Approved remediation',
    prohibitedOwnership: 'Prohibited ownership',
    previewBestFor: 'Best for:',
    previewColorScheme: 'Color scheme:',
    previewA11yProof: 'Accessibility proof:',
    previewA11yDescription: 'status uses text, badge label, and placement, not color alone.',
    forcedDarkPreview: 'This lane always previews in dark mode so the runtime stays inside its sanctioned contrast contract.',
    tokenControls: 'Token-backed controls',
    referenceInput: 'Reference input',
    referenceInputDescription: 'Inputs stay inside the theme lane instead of drifting into route-local styling.',
    referenceInputPlaceholder: 'Search or type a route name',
    success: 'Success',
    warning: 'Warning',
    critical: 'Critical',
    proofSurfaceTitle: 'Reference site proof surface',
    proofSurfaceDescription: 'This preview uses the real shipped design-system runtime rather than a docs-only styling lane.',
    inspectRoute: 'Inspect route',
    metadataRuntimeLane: 'Runtime lane',
    metadataColorScheme: 'Color scheme',
    metadataA11yProof: 'A11y proof',
    metadataA11yValue: 'Keyboard + readable states',
    appsAlignedWith: 'Apps aligned with',
    generalAdoptionWith: 'General product adoption with',
    avoidLocalTheme: 'Avoid creating a local non-canonical theme authority.',
    schemes: { light: 'Light', dark: 'Dark', auto: 'Auto' },
    schemeDescriptions: {
      light: 'Validates readable default surfaces, controls, badges, and focus states against light backgrounds.',
      dark: 'Validates contrast for public, operational, and feedback surfaces when dark mode is active.',
      auto: 'Documents the adopter path for OS-controlled schemes while keeping the provider contract unchanged.',
    },
    presetLabels: {
      default: 'Default runtime theme',
      'dark-public': 'Dark public theme',
      'flat-surface': 'Flat surface theme',
      editorial: 'Editorial serif theme',
      brand: 'Brand theme generator',
      sunset: 'Sunset pulse',
      oceanic: 'Oceanic wave',
      forest: 'Forest signal',
      ruby: 'Ruby spark',
      amber: 'Amber glow',
      'neon-night': 'Neon night',
      skyline: 'Skyline indigo',
      aurora: 'Aurora teal',
      coral: 'Coral bloom',
      mint: 'Mint circuit',
      orchid: 'Orchid signal',
      royal: 'Royal violet',
      cosmic: 'Cosmic burst',
    },
    presetSummaries: {
      default: 'Balanced neutral baseline lane.',
      'dark-public': 'Dark-first public presentation lane.',
      'flat-surface': 'Lower-elevation operational lane.',
      editorial: 'Reading-focused lane with serif headlines.',
      brand: 'Governed brand composition lane.',
      sunset: 'Warm orange-magenta vibrant lane.',
      oceanic: 'Cool cyan-blue vibrant lane.',
      forest: 'Natural emerald-led vibrant lane.',
      ruby: 'Strong red high-contrast lane.',
      amber: 'Golden energetic lane.',
      'neon-night': 'Lime-accented dark-forward lane.',
      skyline: 'Indigo technology-forward lane.',
      aurora: 'Fresh teal-cyan app lane for optimistic product surfaces.',
      coral: 'Expressive pink-coral lane for creator, commerce, and social products.',
      mint: 'Clean green-mint lane for health, learning, and growth products.',
      orchid: 'Purple-grape lane for editorial, culture, and premium tools.',
      royal: 'Confident violet lane for SaaS dashboards and professional apps.',
      cosmic: 'Highly saturated blue-violet-cyan-magenta showcase lane for bold public apps and launch surfaces.',
    },
  },
  de: {
    themeLabTitle: 'Theme-Labor',
    themeLabDescription: 'Teste die ausgelieferten GDS-Theme-Presets, das Farbschema-Verhalten und den gesteuerten Brand-Theme-Generator. Diese Seite ist Teil der Live-Demo, kein separates Styling-Experiment.',
    themePresetTitle: 'Theme-Preset',
    presetLabel: 'Preset',
    previewColorSchemeLabel: 'Vorschau-Farbschema',
    webfontLaneLabel: 'Webfont-Lane',
    resetThemeLab: 'Theme-Labor zurücksetzen',
    shellBehavior: 'Theme-Änderungen wirken auf die offizielle Site-Shell, damit Besucher echtes Ganzseitenverhalten prüfen können.',
    brandOptionsTitle: 'Optionen des Brand-Builders',
    brandPrimaryColorLabel: 'Primäre Markenfarbe',
    useFlatSurfaces: 'Flache Oberflächen verwenden',
    useEditorialSerif: 'Editoriale Serif-Überschriften verwenden',
    generatorDescription: 'Der Generator kombiniert ausgelieferte Helfer, statt im Website-Code eine zweite Theme-Autorität aufzubauen.',
    currentSelectionTitle: 'Zusammenfassung der Auswahl',
    bestFor: 'Geeignet für:',
    runtimeLane: 'Runtime-Lane:',
    colorScheme: 'Farbschema:',
    darkForwardNotice: 'Dieses Dark-Forward-Preset rendert in der Live-Vorschau immer im Dunkelmodus.',
    compareToggle: 'Mit einem zweiten ausgelieferten Preset vergleichen',
    comparisonPresetLabel: 'Vergleichs-Preset',
    shippedLanesTitle: 'Ausgelieferte Theme-Lanes',
    shippedLanesDescription: 'Jede Lane unten ist ein unterstütztes Runtime-Preset. Farbige Lanes werden als vollständige CSS-basierte VibeThemes ausgeliefert: Canvas, Shell, Surface, Controls, Focus und Accent-Tokens, keine Bitmap-Hintergründe.',
    selected: 'Ausgewählt',
    cssVibeTheme: 'CSS VibeTheme',
    previewVibe: 'Diesen Vibe ansehen',
    avoidFor: 'Vermeiden für:',
    noSpecialExclusion: 'Für diese Lane ist kein besonderer Ausschluss vermerkt.',
    vibeContractTitle: 'Aktueller VibeTheme-Vertrag',
    vibeContractDescription: 'Das ausgewählte Preset exportiert diese package-eigenen CSS-Tokens. Consumer können expressive Produktflächen rendern und bleiben in der GDS-Theme-Ownership.',
    tokenLabels: ['Primär', 'Akzent', 'Heller Canvas', 'Dunkler Canvas', 'Helle Oberfläche', 'Dunkle Oberfläche'],
    proofTitle: 'Proof für Hell, Dunkel und Auto',
    proofDescription: 'Jede offizielle Lane muss in explizitem Hellmodus, explizitem Dunkelmodus und OS-gesteuertem Auto-Modus nutzbar bleiben. Die Dark-Public-Lane wird in der Vorschau bewusst dunkel erzwungen.',
    requiredProof: 'Erforderlicher Proof: semantischer Text, sichtbarer Fokus und kontrastsichere Statusbehandlung.',
    livePreviewTitle: 'Live-Theme-Vorschau',
    livePreviewDescription: 'Besucher können ausgelieferte Presets testen, Lanes vergleichen und echte GDS-Flächen unter jedem Theme prüfen.',
    comparisonPreviewTitle: 'Vergleichs-Vorschaufläche',
    comparisonPreviewDescription: 'Vergleiche ein weiteres ausgeliefertes Theme mit der aktuellen Auswahl, bevor es downstream übernommen wird.',
    unsupportedTitle: 'Grenze nicht unterstützter Lanes',
    unsupportedDescription: 'Nicht unterstützte lokale Theme-Lanes werden durch Policy und Compliance blockiert, weil sie parallele Design-System-Autorität schaffen.',
    doNotCreateTitle: 'Keine lokalen Branding-Layer-Helfer erstellen',
    doNotCreateDescription: 'Wenn ein Consumer Markenausdruck braucht, verwende createPublicBrandTheme(...). Fehlt eine Lane, fordere sie für GDS an, statt lokal extendGdsTheme(...), createTheme(...) oder mergeMantineTheme(...) aufzubauen.',
    approvedRemediation: 'Genehmigte Abhilfe',
    prohibitedOwnership: 'Verbotene Ownership',
    previewBestFor: 'Geeignet für:',
    previewColorScheme: 'Farbschema:',
    previewA11yProof: 'Accessibility-Proof:',
    previewA11yDescription: 'Status nutzt Text, Badge-Label und Platzierung, nicht nur Farbe.',
    forcedDarkPreview: 'Diese Lane wird immer dunkel dargestellt, damit die Runtime im genehmigten Kontrastvertrag bleibt.',
    tokenControls: 'Token-gestützte Controls',
    referenceInput: 'Referenzeingabe',
    referenceInputDescription: 'Eingaben bleiben in der Theme-Lane, statt in routenlokales Styling abzudriften.',
    referenceInputPlaceholder: 'Route suchen oder Namen eingeben',
    success: 'Erfolg',
    warning: 'Warnung',
    critical: 'Kritisch',
    proofSurfaceTitle: 'Proof-Fläche der Referenzseite',
    proofSurfaceDescription: 'Diese Vorschau nutzt die echte ausgelieferte Design-System-Runtime statt einer docs-only Styling-Lane.',
    inspectRoute: 'Route prüfen',
    metadataRuntimeLane: 'Runtime-Lane',
    metadataColorScheme: 'Farbschema',
    metadataA11yProof: 'A11y-Proof',
    metadataA11yValue: 'Tastatur + lesbare Zustände',
    appsAlignedWith: 'Apps ausgerichtet auf',
    generalAdoptionWith: 'Allgemeine Produktadoption mit',
    avoidLocalTheme: 'Keine lokale nicht-kanonische Theme-Autorität erstellen.',
    schemes: { light: 'Hell', dark: 'Dunkel', auto: 'Auto' },
    schemeDescriptions: {
      light: 'Prüft lesbare Standardflächen, Controls, Badges und Fokuszustände auf hellen Hintergründen.',
      dark: 'Prüft Kontrast für Public-, Operations- und Feedback-Flächen im Dunkelmodus.',
      auto: 'Dokumentiert den Adopter-Pfad für OS-gesteuerte Schemes bei unverändertem Provider-Vertrag.',
    },
    presetLabels: {
      default: 'Standard-Runtime-Theme',
      'dark-public': 'Dunkles Public-Theme',
      'flat-surface': 'Flat-Surface-Theme',
      editorial: 'Editoriales Serif-Theme',
      brand: 'Brand-Theme-Generator',
      sunset: 'Sunset Pulse',
      oceanic: 'Oceanic Wave',
      forest: 'Forest Signal',
      ruby: 'Ruby Spark',
      amber: 'Amber Glow',
      'neon-night': 'Neon Night',
      skyline: 'Skyline Indigo',
      aurora: 'Aurora Teal',
      coral: 'Coral Bloom',
      mint: 'Mint Circuit',
      orchid: 'Orchid Signal',
      royal: 'Royal Violet',
      cosmic: 'Cosmic Burst',
    },
    presetSummaries: {
      default: 'Ausgewogene, neutrale Basis-Lane.',
      'dark-public': 'Dunkel-first Public-Lane.',
      'flat-surface': 'Operative Lane mit geringerer Elevation.',
      editorial: 'Lesefokussierte Lane mit Serif-Headlines.',
      brand: 'Gesteuerte Brand-Composition-Lane.',
      sunset: 'Warme orange-magenta Vibrant-Lane.',
      oceanic: 'Kühle cyan-blaue Vibrant-Lane.',
      forest: 'Natürliche smaragdgetriebene Vibrant-Lane.',
      ruby: 'Kräftige rote High-Contrast-Lane.',
      amber: 'Goldgelbe energetische Lane.',
      'neon-night': 'Lime-akzentuierte Dark-Forward-Lane.',
      skyline: 'Indigo Technology-Forward-Lane.',
      aurora: 'Frische teal-cyan App-Lane für optimistische Produktflächen.',
      coral: 'Expressive pink-coral Lane für Creator-, Commerce- und Social-Produkte.',
      mint: 'Saubere grün-mint Lane für Health, Learning und Growth.',
      orchid: 'Purple-grape Lane für Editorial, Kultur und Premium-Tools.',
      royal: 'Selbstbewusste violette Lane für SaaS-Dashboards und professionelle Apps.',
      cosmic: 'Hochgesättigte blue-violet-cyan-magenta Showcase-Lane für mutige Public Apps und Launch-Flächen.',
    },
  },
  hu: {
    themeLabTitle: 'Témalabor',
    themeLabDescription: 'Teszteld a szállított GDS téma preseteket, a színséma működését és a szabályozott brand-theme generátort. Ez az oldal a live demó része, nem külön styling-kísérlet.',
    themePresetTitle: 'Téma preset',
    presetLabel: 'Téma preset',
    previewColorSchemeLabel: 'Előnézeti színséma',
    webfontLaneLabel: 'Webfont sáv',
    resetThemeLab: 'Témalabor visszaállítása',
    shellBehavior: 'A témaváltások az official site shellre is érvényesek, így a látogatók valódi teljes oldalas runtime viselkedést ellenőrizhetnek.',
    brandOptionsTitle: 'Brand builder opciók',
    brandPrimaryColorLabel: 'Elsődleges brand szín',
    useFlatSurfaces: 'Lapos felületek használata',
    useEditorialSerif: 'Editorial serif címsorok használata',
    generatorDescription: 'A generátor szállított helpereket komponál, nem hoz létre második téma-autoritást a website-ban.',
    currentSelectionTitle: 'Aktuális választás összefoglalója',
    bestFor: 'Legjobb erre:',
    runtimeLane: 'Runtime lane:',
    colorScheme: 'Színséma:',
    darkForwardNotice: 'Ez a dark-forward preset a live előnézetben mindig dark módban jelenik meg.',
    compareToggle: 'Összehasonlítás második szállított presettel',
    comparisonPresetLabel: 'Összehasonlító preset',
    shippedLanesTitle: 'Szállított téma lane-ek',
    shippedLanesDescription: 'Minden lenti lane támogatott runtime preset. A színes lane-ek teljes CSS-alapú VibeTheme-ként érkeznek: canvas, shell, surface, control, focus és accent tokenekkel, nem bitmap hátterekkel.',
    selected: 'Kiválasztva',
    cssVibeTheme: 'CSS VibeTheme',
    previewVibe: 'Vibe előnézete',
    avoidFor: 'Kerüld erre:',
    noSpecialExclusion: 'Ehhez a lane-hez nincs külön kizárás megadva.',
    vibeContractTitle: 'Aktuális VibeTheme szerződés',
    vibeContractDescription: 'A kiválasztott preset ezeket a package-owned CSS tokeneket exportálja. A consumerek kifejező product surface-eket renderelhetnek GDS theme ownership-en belül.',
    tokenLabels: ['Elsődleges', 'Akcentus', 'Világos canvas', 'Sötét canvas', 'Világos felület', 'Sötét felület'],
    proofTitle: 'Light, dark és auto proof',
    proofDescription: 'Minden official lane-nek használhatónak kell maradnia explicit light, explicit dark és OS-controlled auto módban. A dark-public lane előnézetben szándékosan dark módra van kényszerítve.',
    requiredProof: 'Kötelező proof: szemantikus szöveg, látható fókusz és kontrasztbiztos állapotkezelés.',
    livePreviewTitle: 'Live téma előnézet',
    livePreviewDescription: 'A látogatók tesztelhetik a szállított preseteket, összehasonlíthatják a lane-eket és ellenőrizhetik a valódi GDS felületeket minden témában.',
    comparisonPreviewTitle: 'Összehasonlító előnézeti felület',
    comparisonPreviewDescription: 'Hasonlíts össze egy másik szállított témát az aktuális választással, mielőtt downstream adoptálod.',
    unsupportedTitle: 'Nem támogatott lane határa',
    unsupportedDescription: 'A nem támogatott lokális téma lane-eket policy és compliance blokkolja, mert párhuzamos design-system autoritást hoznak létre.',
    doNotCreateTitle: 'Ne hozz létre lokális branding-layer helpereket',
    doNotCreateDescription: 'Ha egy consumer brand kifejezést igényel, használd a createPublicBrandTheme(...)-et. Ha hiányzik egy lane, GDS-ben kérd, ne lokálisan építs extendGdsTheme(...), createTheme(...) vagy mergeMantineTheme(...) ownership-et.',
    approvedRemediation: 'Jóváhagyott javítás',
    prohibitedOwnership: 'Tiltott ownership',
    previewBestFor: 'Legjobb erre:',
    previewColorScheme: 'Színséma:',
    previewA11yProof: 'Accessibility proof:',
    previewA11yDescription: 'az állapot szöveget, badge labelt és elhelyezést használ, nem csak színt.',
    forcedDarkPreview: 'Ez a lane mindig dark módban látszik, hogy a runtime a jóváhagyott kontraszt contracton belül maradjon.',
    tokenControls: 'Token-backed controlok',
    referenceInput: 'Referencia input',
    referenceInputDescription: 'Az inputok a téma lane-en belül maradnak, nem csúsznak route-local stylingba.',
    referenceInputPlaceholder: 'Keress vagy írj be route nevet',
    success: 'Siker',
    warning: 'Figyelmeztetés',
    critical: 'Kritikus',
    proofSurfaceTitle: 'Reference site proof surface',
    proofSurfaceDescription: 'Ez az előnézet a valódi szállított design-system runtime-ot használja, nem docs-only styling lane-t.',
    inspectRoute: 'Route vizsgálata',
    metadataRuntimeLane: 'Runtime lane',
    metadataColorScheme: 'Színséma',
    metadataA11yProof: 'A11y proof',
    metadataA11yValue: 'Billentyűzet + olvasható állapotok',
    appsAlignedWith: 'Alkalmazások ehhez igazítva:',
    generalAdoptionWith: 'Általános product adoption ezzel:',
    avoidLocalTheme: 'Ne hozz létre lokális, nem kanonikus téma-autoritást.',
    schemes: { light: 'Világos', dark: 'Sötét', auto: 'Auto' },
    schemeDescriptions: {
      light: 'Ellenőrzi az olvasható alapfelületeket, controlokat, badge-eket és fókuszállapotokat világos háttéren.',
      dark: 'Ellenőrzi a public, operational és feedback felületek kontrasztját aktív dark módban.',
      auto: 'Dokumentálja az OS-controlled scheme adopter útját változatlan provider contract mellett.',
    },
    presetLabels: {
      default: 'Alap runtime téma',
      'dark-public': 'Sötét public téma',
      'flat-surface': 'Lapos felület téma',
      editorial: 'Editorial serif téma',
      brand: 'Brand téma generátor',
      sunset: 'Sunset pulse',
      oceanic: 'Oceanic wave',
      forest: 'Forest signal',
      ruby: 'Ruby spark',
      amber: 'Amber glow',
      'neon-night': 'Neon night',
      skyline: 'Skyline indigo',
      aurora: 'Aurora teal',
      coral: 'Coral bloom',
      mint: 'Mint circuit',
      orchid: 'Orchid signal',
      royal: 'Royal violet',
      cosmic: 'Cosmic burst',
    },
    presetSummaries: {
      default: 'Kiegyensúlyozott, neutrális baseline lane.',
      'dark-public': 'Dark-first public lane.',
      'flat-surface': 'Alacsonyabb elevation operációs lane.',
      editorial: 'Olvasásközpontú lane serif headline-okkal.',
      brand: 'Szabályozott brand composition lane.',
      sunset: 'Meleg narancs-magenta vibrant lane.',
      oceanic: 'Hűvös cyan-kék vibrant lane.',
      forest: 'Természetes emerald-központú vibrant lane.',
      ruby: 'Erős piros, magas kontrasztú lane.',
      amber: 'Aranysárga, energikus lane.',
      'neon-night': 'Lime-akcentusú dark-forward lane.',
      skyline: 'Indigo, technology-forward lane.',
      aurora: 'Friss teal-cyan app lane optimista product surface-ekhez.',
      coral: 'Kifejező pink-coral lane creator, commerce és social productokhoz.',
      mint: 'Tiszta zöld-mint lane health, learning és growth productokhoz.',
      orchid: 'Purple-grape lane editorial, culture és premium toolokhoz.',
      royal: 'Magabiztos violet lane SaaS dashboardokhoz és professzionális appokhoz.',
      cosmic: 'Erősen telített blue-violet-cyan-magenta showcase lane merész public appokhoz és launch surface-ekhez.',
    },
  },
};

type ExplorerCopy = Omit<typeof explorerCopy.en, 'presetLabels' | 'presetSummaries'> & {
  presetLabels: Partial<Record<ThemePresetId, string>>;
  presetSummaries: Partial<Record<ThemePresetId, string>>;
};
const fallbackExplorerCopy: ExplorerCopy = explorerCopy.en;
const explorerCopyOverrides: Record<string, Partial<ExplorerCopy>> = {
  fr: {
    themeLabTitle: 'Laboratoire de thèmes',
    themeLabDescription: 'Testez les presets de thème GDS livrés, le comportement des modes couleur et le générateur de thème de marque gouverné. Cette page fait partie de la démo live, pas d’une expérimentation de style séparée.',
    themePresetTitle: 'Preset de thème',
    presetLabel: 'Preset de thème',
    previewColorSchemeLabel: 'Mode couleur de prévisualisation',
    webfontLaneLabel: 'Lane de police web',
    resetThemeLab: 'Réinitialiser le laboratoire',
    shellBehavior: 'Les changements de thème s’appliquent au shell officiel du site pour vérifier le comportement réel de toute la page.',
    brandOptionsTitle: 'Options du générateur de marque',
    brandPrimaryColorLabel: 'Couleur principale de marque',
    useFlatSurfaces: 'Utiliser des surfaces plates',
    useEditorialSerif: 'Utiliser des titres éditoriaux avec empattement',
    generatorDescription: 'Le générateur compose les helpers livrés au lieu de créer une seconde autorité de thème dans le site.',
    currentSelectionTitle: 'Résumé de la sélection',
    bestFor: 'Idéal pour :',
    runtimeLane: 'Lane runtime :',
    colorScheme: 'Mode couleur :',
    darkForwardNotice: 'Ce preset dark-forward s’affiche toujours en mode sombre dans la prévisualisation live.',
    compareToggle: 'Comparer avec un second preset livré',
    comparisonPresetLabel: 'Preset de comparaison',
    shippedLanesTitle: 'Lanes de thème livrées',
    selected: 'Sélectionné',
    previewVibe: 'Prévisualiser ce vibe',
    avoidFor: 'À éviter pour :',
    vibeContractTitle: 'Contrat VibeTheme actuel',
    proofTitle: 'Preuve clair, sombre et auto',
    livePreviewTitle: 'Prévisualisation live du thème',
    comparisonPreviewTitle: 'Surface de prévisualisation comparative',
    unsupportedTitle: 'Limite des lanes non prises en charge',
    doNotCreateTitle: 'Ne créez pas de helpers locaux de branding',
    approvedRemediation: 'Correction approuvée',
    prohibitedOwnership: 'Ownership interdite',
    tokenControls: 'Contrôles basés sur les tokens',
    referenceInput: 'Champ de référence',
    referenceInputPlaceholder: 'Rechercher ou saisir un nom de route',
    success: 'Succès',
    warning: 'Avertissement',
    critical: 'Critique',
    inspectRoute: 'Inspecter la route',
    appsAlignedWith: 'Applications alignées avec',
    generalAdoptionWith: 'Adoption produit générale avec',
    avoidLocalTheme: 'Évitez de créer une autorité de thème locale non canonique.',
    schemes: { light: 'Clair', dark: 'Sombre', auto: 'Auto' },
    tokenLabels: ['Primaire', 'Accent', 'Canvas clair', 'Canvas sombre', 'Surface claire', 'Surface sombre'],
    presetLabels: {
      default: 'Thème runtime par défaut',
      'dark-public': 'Thème public sombre',
      'flat-surface': 'Thème de surface plate',
      editorial: 'Thème éditorial avec empattement',
      brand: 'Générateur de thème de marque',
    },
  },
  it: {
    themeLabTitle: 'Laboratorio temi',
    themeLabDescription: 'Testa i preset tema GDS rilasciati, il comportamento degli schemi colore e il generatore brand-theme governato. Questa pagina fa parte della demo live, non è un esperimento di stile separato.',
    themePresetTitle: 'Preset tema',
    presetLabel: 'Preset tema',
    previewColorSchemeLabel: 'Schema colore anteprima',
    webfontLaneLabel: 'Lane webfont',
    resetThemeLab: 'Reimposta laboratorio temi',
    brandOptionsTitle: 'Opzioni brand builder',
    brandPrimaryColorLabel: 'Colore primario brand',
    useFlatSurfaces: 'Usa superfici flat',
    useEditorialSerif: 'Usa titoli serif editoriali',
    currentSelectionTitle: 'Riepilogo selezione corrente',
    bestFor: 'Ideale per:',
    runtimeLane: 'Lane runtime:',
    colorScheme: 'Schema colore:',
    compareToggle: 'Confronta con un secondo preset rilasciato',
    comparisonPresetLabel: 'Preset di confronto',
    shippedLanesTitle: 'Theme lane rilasciate',
    selected: 'Selezionato',
    previewVibe: 'Anteprima vibe',
    avoidFor: 'Evita per:',
    vibeContractTitle: 'Contratto VibeTheme corrente',
    proofTitle: 'Verifica light, dark e auto',
    livePreviewTitle: 'Anteprima tema live',
    comparisonPreviewTitle: 'Superficie anteprima confronto',
    unsupportedTitle: 'Confine lane non supportate',
    doNotCreateTitle: 'Non creare helper locali per il branding layer',
    approvedRemediation: 'Rimedio approvato',
    prohibitedOwnership: 'Ownership vietata',
    referenceInput: 'Input di riferimento',
    success: 'Successo',
    warning: 'Avviso',
    critical: 'Critico',
    inspectRoute: 'Ispeziona route',
    appsAlignedWith: 'App allineate a',
    generalAdoptionWith: 'Adozione prodotto generale con',
    avoidLocalTheme: 'Evita di creare una autorità tema locale non canonica.',
    schemes: { light: 'Chiaro', dark: 'Scuro', auto: 'Auto' },
    tokenLabels: ['Primario', 'Accento', 'Canvas chiaro', 'Canvas scuro', 'Superficie chiara', 'Superficie scura'],
    presetLabels: {
      default: 'Tema runtime predefinito',
      'dark-public': 'Tema pubblico scuro',
      'flat-surface': 'Tema superficie flat',
      editorial: 'Tema editoriale serif',
      brand: 'Generatore tema brand',
    },
  },
  ru: {
    themeLabTitle: 'Лаборатория тем',
    themePresetTitle: 'Пресет темы',
    presetLabel: 'Пресет темы',
    previewColorSchemeLabel: 'Цветовая схема предпросмотра',
    webfontLaneLabel: 'Линия веб-шрифта',
    resetThemeLab: 'Сбросить лабораторию тем',
    brandOptionsTitle: 'Настройки бренд-билдера',
    brandPrimaryColorLabel: 'Основной цвет бренда',
    useFlatSurfaces: 'Использовать плоские поверхности',
    useEditorialSerif: 'Использовать редакционные serif-заголовки',
    currentSelectionTitle: 'Сводка текущего выбора',
    bestFor: 'Лучше всего для:',
    runtimeLane: 'Runtime-линия:',
    colorScheme: 'Цветовая схема:',
    compareToggle: 'Сравнить со вторым поставляемым пресетом',
    comparisonPresetLabel: 'Пресет сравнения',
    shippedLanesTitle: 'Поставляемые линии тем',
    selected: 'Выбрано',
    previewVibe: 'Предпросмотр vibe',
    avoidFor: 'Избегать для:',
    vibeContractTitle: 'Текущий контракт VibeTheme',
    proofTitle: 'Проверка light, dark и auto',
    livePreviewTitle: 'Живой предпросмотр темы',
    comparisonPreviewTitle: 'Поверхность сравнения',
    unsupportedTitle: 'Граница неподдерживаемых линий',
    doNotCreateTitle: 'Не создавайте локальные helper-слои брендинга',
    approvedRemediation: 'Одобренное исправление',
    prohibitedOwnership: 'Запрещённая ownership',
    referenceInput: 'Контрольный ввод',
    success: 'Успех',
    warning: 'Предупреждение',
    critical: 'Критично',
    inspectRoute: 'Проверить маршрут',
    appsAlignedWith: 'Приложения, согласованные с',
    generalAdoptionWith: 'Общее внедрение продукта с',
    avoidLocalTheme: 'Не создавайте локальную неканоническую авторитетность темы.',
    schemes: { light: 'Светлая', dark: 'Тёмная', auto: 'Авто' },
    tokenLabels: ['Основной', 'Акцент', 'Светлый canvas', 'Тёмный canvas', 'Светлая поверхность', 'Тёмная поверхность'],
    presetLabels: {
      default: 'Стандартная runtime-тема',
      'dark-public': 'Тёмная публичная тема',
      'flat-surface': 'Тема плоских поверхностей',
      editorial: 'Редакционная serif-тема',
      brand: 'Генератор бренд-темы',
    },
  },
  he: {
    themeLabTitle: 'מעבדת ערכות נושא',
    themePresetTitle: 'Preset של ערכת נושא',
    presetLabel: 'Preset של ערכת נושא',
    previewColorSchemeLabel: 'מצב צבע לתצוגה מקדימה',
    webfontLaneLabel: 'נתיב פונט רשת',
    resetThemeLab: 'איפוס מעבדת התמות',
    brandOptionsTitle: 'אפשרויות בונה המותג',
    brandPrimaryColorLabel: 'צבע מותג ראשי',
    useFlatSurfaces: 'שימוש במשטחים שטוחים',
    useEditorialSerif: 'שימוש בכותרות serif עריכתיות',
    currentSelectionTitle: 'סיכום הבחירה הנוכחית',
    bestFor: 'מתאים ביותר ל:',
    runtimeLane: 'נתיב runtime:',
    colorScheme: 'מצב צבע:',
    compareToggle: 'השוואה מול preset מסופק נוסף',
    comparisonPresetLabel: 'Preset להשוואה',
    shippedLanesTitle: 'נתיבי תמה שסופקו',
    selected: 'נבחר',
    previewVibe: 'תצוגת vibe',
    avoidFor: 'להימנע עבור:',
    vibeContractTitle: 'חוזה VibeTheme נוכחי',
    proofTitle: 'הוכחת בהיר, כהה ואוטומטי',
    livePreviewTitle: 'תצוגה מקדימה חיה של תמה',
    comparisonPreviewTitle: 'משטח תצוגת השוואה',
    unsupportedTitle: 'גבול נתיבים לא נתמכים',
    doNotCreateTitle: 'לא ליצור helpers מקומיים לשכבת מותג',
    approvedRemediation: 'תיקון מאושר',
    prohibitedOwnership: 'Ownership אסור',
    referenceInput: 'שדה ייחוס',
    success: 'הצלחה',
    warning: 'אזהרה',
    critical: 'קריטי',
    inspectRoute: 'בדיקת route',
    appsAlignedWith: 'אפליקציות המיושרות עם',
    generalAdoptionWith: 'אימוץ מוצר כללי עם',
    avoidLocalTheme: 'אין ליצור סמכות תמה מקומית שאינה קנונית.',
    schemes: { light: 'בהיר', dark: 'כהה', auto: 'אוטומטי' },
    tokenLabels: ['ראשי', 'הדגשה', 'Canvas בהיר', 'Canvas כהה', 'משטח בהיר', 'משטח כהה'],
    presetLabels: {
      default: 'תמת runtime ברירת מחדל',
      'dark-public': 'תמה ציבורית כהה',
      'flat-surface': 'תמת משטח שטוח',
      editorial: 'תמה עריכתית serif',
      brand: 'מחולל תמת מותג',
    },
  },
  ar: {
    themeLabTitle: 'مختبر الثيمات',
    themePresetTitle: 'إعداد الثيم',
    presetLabel: 'إعداد الثيم',
    previewColorSchemeLabel: 'نظام ألوان المعاينة',
    webfontLaneLabel: 'مسار خط الويب',
    resetThemeLab: 'إعادة ضبط مختبر الثيمات',
    brandOptionsTitle: 'خيارات منشئ العلامة',
    brandPrimaryColorLabel: 'لون العلامة الأساسي',
    useFlatSurfaces: 'استخدام أسطح مسطحة',
    useEditorialSerif: 'استخدام عناوين serif تحريرية',
    currentSelectionTitle: 'ملخص الاختيار الحالي',
    bestFor: 'الأفضل لـ:',
    runtimeLane: 'مسار runtime:',
    colorScheme: 'نظام الألوان:',
    compareToggle: 'المقارنة مع إعداد ثانٍ مسلّم',
    comparisonPresetLabel: 'إعداد المقارنة',
    shippedLanesTitle: 'مسارات الثيم المسلّمة',
    selected: 'محدد',
    previewVibe: 'معاينة هذا vibe',
    avoidFor: 'تجنب لـ:',
    vibeContractTitle: 'عقد VibeTheme الحالي',
    proofTitle: 'إثبات الفاتح والداكن والتلقائي',
    livePreviewTitle: 'معاينة الثيم الحية',
    comparisonPreviewTitle: 'سطح معاينة المقارنة',
    unsupportedTitle: 'حدود المسارات غير المدعومة',
    doNotCreateTitle: 'لا تنشئ helpers محلية لطبقة العلامة',
    approvedRemediation: 'معالجة معتمدة',
    prohibitedOwnership: 'ملكية محظورة',
    referenceInput: 'حقل مرجعي',
    success: 'نجاح',
    warning: 'تحذير',
    critical: 'حرج',
    inspectRoute: 'فحص المسار',
    appsAlignedWith: 'تطبيقات متوافقة مع',
    generalAdoptionWith: 'اعتماد منتج عام مع',
    avoidLocalTheme: 'تجنب إنشاء سلطة ثيم محلية غير معيارية.',
    schemes: { light: 'فاتح', dark: 'داكن', auto: 'تلقائي' },
    tokenLabels: ['أساسي', 'تمييز', 'Canvas فاتح', 'Canvas داكن', 'سطح فاتح', 'سطح داكن'],
    presetLabels: {
      default: 'ثيم runtime الافتراضي',
      'dark-public': 'ثيم عام داكن',
      'flat-surface': 'ثيم سطح مسطح',
      editorial: 'ثيم تحريري serif',
      brand: 'مولّد ثيم العلامة',
    },
  },
};

function ThemePreviewSurface({
  preset,
  colorScheme,
  requestedColorScheme,
  copy,
}: {
  preset: { label: string; summary: string; bestFor: string; themeKey: string };
  colorScheme: ThemeSchemeId;
  requestedColorScheme?: ThemeSchemeId;
  copy: ExplorerCopy;
}) {
  const forcedScheme = requestedColorScheme && requestedColorScheme !== colorScheme;

  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Text fw={700}>{preset.label}</Text>
            <Text size="sm" c="dimmed">
              {preset.summary}
            </Text>
            <Text size="sm">
              <strong>{copy.previewBestFor}</strong> {preset.bestFor}
            </Text>
            <Text size="sm">
              <strong>{copy.previewColorScheme}</strong> {colorScheme} ({copy.schemes[colorScheme]})
            </Text>
            <Text size="sm">
              <strong>{copy.previewA11yProof}</strong> {copy.previewA11yDescription}
            </Text>
            {forcedScheme ? (
              <Text size="sm" c="dimmed">
                {copy.forcedDarkPreview}
              </Text>
            ) : null}
          </Stack>
          <ThemeToggle />
        </Group>

        <ActionBar
          primary={{ action: 'save', size: 'sm' }}
          secondary={[{ action: 'cancel', size: 'sm' }]}
          tertiary={[{ action: 'preview', size: 'sm' }]}
        />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper withBorder radius="lg" p="md">
            <Stack gap="sm">
              <Text fw={700} size="sm">
                {copy.tokenControls}
              </Text>
              <FormField label={copy.referenceInput} description={copy.referenceInputDescription}>
                <TextInput placeholder={copy.referenceInputPlaceholder} />
              </FormField>
              <Group gap="xs" wrap="wrap">
                <Badge color="teal" variant="light">
                  {copy.success}
                </Badge>
                <Badge color="orange" variant="light">
                  {copy.warning}
                </Badge>
                <Badge color="red" variant="light">
                  {copy.critical}
                </Badge>
              </Group>
            </Stack>
          </Paper>
          <ListingCard
            title={copy.proofSurfaceTitle}
            description={copy.proofSurfaceDescription}
            metadata={[
              { id: 'runtime', label: copy.metadataRuntimeLane, value: preset.themeKey },
              { id: 'scheme', label: copy.metadataColorScheme, value: copy.schemes[colorScheme] },
              { id: 'focus', label: copy.metadataA11yProof, value: copy.metadataA11yValue },
            ]}
            primaryAction={<Button size="sm">{copy.inspectRoute}</Button>}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export function ReferenceThemeExplorer({
  initialSelection,
  onSelectionChange,
}: {
  initialSelection?: ThemeExplorerSelection;
  onSelectionChange?: (selection: ThemeExplorerSelection) => void;
}) {
  const { locale } = useGdsTranslation();
  const localeBaseCopy = (explorerCopy[locale as keyof typeof explorerCopy] ?? {}) as Partial<ExplorerCopy>;
  const localeOverrideCopy = explorerCopyOverrides[locale] ?? {};
  const copy = {
    ...fallbackExplorerCopy,
    ...localeBaseCopy,
    ...localeOverrideCopy,
    schemes: {
      ...fallbackExplorerCopy.schemes,
      ...localeBaseCopy.schemes,
      ...localeOverrideCopy.schemes,
    },
    schemeDescriptions: {
      ...fallbackExplorerCopy.schemeDescriptions,
      ...localeBaseCopy.schemeDescriptions,
      ...localeOverrideCopy.schemeDescriptions,
    },
    presetLabels: {
      ...fallbackExplorerCopy.presetLabels,
      ...localeBaseCopy.presetLabels,
      ...localeOverrideCopy.presetLabels,
    },
    presetSummaries: {
      ...fallbackExplorerCopy.presetSummaries,
      ...localeBaseCopy.presetSummaries,
      ...localeOverrideCopy.presetSummaries,
    },
  } as ExplorerCopy;
  const [preset, setPreset] = useState<ThemePresetId>(initialSelection?.preset ?? 'default');
  const [colorScheme, setColorScheme] = useState<ThemeSchemeId>(initialSelection?.colorScheme ?? 'light');
  const [brandPrimary, setBrandPrimary] = useState(initialSelection?.brandPrimary ?? 'blue');
  const [brandFlatSurfaces, setBrandFlatSurfaces] = useState(initialSelection?.brandFlatSurfaces ?? true);
  const [brandEditorialSerif, setBrandEditorialSerif] = useState(initialSelection?.brandEditorialSerif ?? false);
  const [fontLane, setFontLane] = useState<GdsFontLaneId>(initialSelection?.fontLane ?? 'inter');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonPreset, setComparisonPreset] = useState<ThemePresetId>('editorial');
  const availableComparisonPresets = presetCatalog.filter((item) => item.id !== preset).map((item) => item.id);

  const resolveTheme = (presetId: ThemePresetId) =>
    applyGdsFontLane(resolveGdsThemePreset(presetId, {
      brandPrimary,
      brandFlatSurfaces,
      brandEditorialSerif,
    }), fontLane);

  const localizedThemeCatalog = useMemo(() => {
    const presetLabels = copy.presetLabels as Partial<Record<ThemePresetId, string>>;
    const presetSummaries = copy.presetSummaries as Partial<Record<ThemePresetId, string>>;

    return Object.fromEntries(Object.entries(themePresetCatalog).map(([id, item]) => {
      const presetId = id as ThemePresetId;
      const label = presetLabels[presetId] ?? item.label;
      const summary = presetSummaries[presetId] ?? item.summary;

      return [presetId, {
        ...item,
        label,
        summary,
        bestFor: `${copy.appsAlignedWith} ${label}.`,
        supportedUse: `${copy.generalAdoptionWith} ${label}.`,
        avoidFor: copy.avoidLocalTheme,
      }];
    })) as Record<ThemePresetId, { label: string; bestFor: string; summary: string; themeKey: string; supportedUse: string; avoidFor?: string }>;
  }, [copy]);
  const selectionSummary = localizedThemeCatalog[preset];
  const comparisonSummary = localizedThemeCatalog[comparisonPreset];
  const selectedTheme = useMemo(() => resolveTheme(preset), [preset, brandPrimary, brandFlatSurfaces, brandEditorialSerif, fontLane]);
  const comparedTheme = useMemo(() => resolveTheme(comparisonPreset), [comparisonPreset, brandPrimary, brandFlatSurfaces, brandEditorialSerif, fontLane]);
  const effectiveColorScheme = resolvePreviewColorScheme(preset, colorScheme);
  const effectiveComparisonScheme = resolvePreviewColorScheme(comparisonPreset, colorScheme);

  const previewKey = `${preset}-${effectiveColorScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;
  const comparisonPreviewKey = `${comparisonPreset}-${effectiveComparisonScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;
  const selectedVibe = vibeCatalogById[preset];

  useEffect(() => {
    onSelectionChange?.({
      preset,
      colorScheme: effectiveColorScheme,
      theme: selectedTheme,
      fontLane,
      runtimeKey: previewKey,
      brandPrimary,
      brandFlatSurfaces,
      brandEditorialSerif,
    });
  }, [onSelectionChange, preset, effectiveColorScheme, selectedTheme, fontLane, previewKey, brandPrimary, brandFlatSurfaces, brandEditorialSerif]);

  useEffect(() => {
    if (comparisonPreset !== preset) {
      return;
    }

    setComparisonPreset(availableComparisonPresets[0] ?? 'editorial');
  }, [comparisonPreset, preset, availableComparisonPresets]);

  const reset = () => {
    setPreset('default');
    setColorScheme('light');
    setBrandPrimary('blue');
    setBrandFlatSurfaces(true);
    setBrandEditorialSerif(false);
    setComparisonEnabled(false);
    setComparisonPreset('editorial');
    setFontLane('inter');
  };

  return (
    <Stack gap="xl">
      <ReferenceSection
        title={copy.themeLabTitle}
        description={copy.themeLabDescription}
      >
        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md">
              <Title order={4}>{copy.themePresetTitle}</Title>
              <FormField label={copy.presetLabel}>
                <NativeSelect
                  aria-label={copy.presetLabel}
                  value={preset}
                  onChange={(event) => setPreset((event.currentTarget.value as ThemePresetId) || 'default')}
                  data={Object.entries(localizedThemeCatalog).map(([value, item]) => ({ value, label: item.label }))}
                />
              </FormField>
              <FormField label={copy.previewColorSchemeLabel}>
                <NativeSelect
                  aria-label={copy.previewColorSchemeLabel}
                  value={colorScheme}
                  onChange={(event) => setColorScheme((event.currentTarget.value as ThemeSchemeId) || 'light')}
                  data={[
                    { value: 'light', label: copy.schemes.light },
                    { value: 'dark', label: copy.schemes.dark },
                    { value: 'auto', label: copy.schemes.auto },
                  ]}
                />
              </FormField>
              <FormField label={copy.webfontLaneLabel}>
                <NativeSelect
                  aria-label={copy.webfontLaneLabel}
                  value={fontLane}
                  onChange={(event) => setFontLane((event.currentTarget.value as GdsFontLaneId) || 'inter')}
                  data={getGdsFontLanes().map((lane) => ({ value: lane.id, label: lane.label }))}
                />
              </FormField>
              <Button variant="default" size="sm" onClick={reset}>
                {copy.resetThemeLab}
              </Button>
              <Text size="sm" c="dimmed">
                {copy.shellBehavior}
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md">
              <Title order={4}>{copy.brandOptionsTitle}</Title>
              <FormField label={copy.brandPrimaryColorLabel}>
                <NativeSelect
                  aria-label={copy.brandPrimaryColorLabel}
                  value={brandPrimary}
                  onChange={(event) => setBrandPrimary(event.currentTarget.value || 'blue')}
                  data={['blue', 'violet', 'teal', 'grape', 'indigo', 'orange']}
                  disabled={preset !== 'brand'}
                />
              </FormField>
              <Checkbox
                label={copy.useFlatSurfaces}
                checked={brandFlatSurfaces}
                onChange={(event) => setBrandFlatSurfaces(event.currentTarget.checked)}
                disabled={preset !== 'brand'}
              />
              <Checkbox
                label={copy.useEditorialSerif}
                checked={brandEditorialSerif}
                onChange={(event) => setBrandEditorialSerif(event.currentTarget.checked)}
                disabled={preset !== 'brand'}
              />
              <Text size="sm" c="dimmed">
                {copy.generatorDescription}
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md" role="status" aria-live="polite">
              <Title order={4}>{copy.currentSelectionTitle}</Title>
              <Stack gap={6}>
                <Text fw={700}>{selectionSummary.label}</Text>
                <Text size="sm" c="dimmed">
                  {selectionSummary.summary}
                </Text>
                <Text size="sm">
                  <strong>{copy.bestFor}</strong> {selectionSummary.bestFor}
                </Text>
                <Text size="sm">
                  <strong>{copy.runtimeLane}</strong> <Code>{selectionSummary.themeKey}</Code>
                </Text>
                <Text size="sm">
                  <strong>{copy.colorScheme}</strong> {colorScheme} ({copy.schemes[colorScheme]})
                </Text>
                {(preset === 'dark-public' || preset === 'neon-night' || preset === 'cosmic') && colorScheme !== effectiveColorScheme ? (
                  <Text size="sm" c="dimmed">
                    {copy.darkForwardNotice}
                  </Text>
                ) : null}
              </Stack>
              <Checkbox
                aria-label={copy.compareToggle}
                label={copy.compareToggle}
                checked={comparisonEnabled}
                onChange={(event) => setComparisonEnabled(event.currentTarget.checked)}
              />
              <FormField label={copy.comparisonPresetLabel}>
                <NativeSelect
                  aria-label={copy.comparisonPresetLabel}
                  value={comparisonPreset}
                  onChange={(event) => setComparisonPreset((event.currentTarget.value as ThemePresetId) || 'editorial')}
                  disabled={!comparisonEnabled}
                  data={availableComparisonPresets.map((value) => ({ value, label: localizedThemeCatalog[value].label }))}
                />
              </FormField>
            </Stack>
          </Paper>
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.shippedLanesTitle}
        description={copy.shippedLanesDescription}
      >
        <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }} spacing="md">
          {vibeCatalog.map((vibe) => {
            const lane = localizedThemeCatalog[vibe.id];
            const isSelected = vibe.id === preset;

            return (
            <Paper
              key={lane.themeKey}
              withBorder
              radius="lg"
              p="md"
              role="group"
              aria-label={`${lane.label} ${copy.cssVibeTheme}`}
              style={{
                background: `linear-gradient(135deg, ${vibe.surfaceLight}, color-mix(in srgb, ${vibe.primary} 12%, ${vibe.surfaceLight})), ${vibe.gradient}`,
                borderColor: isSelected ? vibe.primary : vibe.borderLight,
                boxShadow: isSelected ? `0 0 0 2px ${vibe.primary}, 0 18px 46px ${vibe.glow}` : undefined,
              }}
            >
              <Stack gap={6}>
                <Group gap="xs" justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <Box
                      aria-hidden="true"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${vibe.primary}, ${vibe.accent})`,
                        boxShadow: `0 10px 28px ${vibe.glow}`,
                        border: `1px solid ${vibe.borderLight}`,
                      }}
                    />
                    <Text fw={700} size="sm">
                      {lane.label}
                    </Text>
                  </Group>
                  {isSelected ? (
                    <Badge variant="light">{copy.selected}</Badge>
                  ) : null}
                </Group>
                <Box
                  aria-hidden="true"
                  style={{
                    height: 56,
                    borderRadius: 16,
                    background: vibe.hero,
                    border: `1px solid ${vibe.borderLight}`,
                  }}
                />
                <Text fw={700} size="sm">
                  {copy.cssVibeTheme}
                </Text>
                <Text size="sm" c="dimmed">
                  {lane.summary}
                </Text>
                <Text size="xs">
                  <strong>{copy.bestFor}</strong> {lane.supportedUse}
                </Text>
                <Code block fz="10px">
                  {lane.themeKey}
                </Code>
                <Button
                  size="xs"
                  variant={isSelected ? 'filled' : 'default'}
                  onClick={() => setPreset(vibe.id)}
                >
                  {copy.previewVibe}
                </Button>
                <Text size="xs" c="dimmed">
                  <strong>{copy.avoidFor}</strong> {lane.avoidFor ?? copy.noSpecialExclusion}
                </Text>
              </Stack>
            </Paper>
            );
          })}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.vibeContractTitle}
        description={copy.vibeContractDescription}
      >
        <Paper withBorder radius="xl" p="lg" style={{ background: selectedVibe?.hero }}>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {selectedVibe ? [
              [copy.tokenLabels[0], selectedVibe.primary],
              [copy.tokenLabels[1], selectedVibe.accent],
              [copy.tokenLabels[2], selectedVibe.canvasLight],
              [copy.tokenLabels[3], selectedVibe.canvasDark],
              [copy.tokenLabels[4], selectedVibe.surfaceLight],
              [copy.tokenLabels[5], selectedVibe.surfaceDark],
            ].map(([label, value]) => (
              <Paper key={label} withBorder radius="lg" p="md">
                <Stack gap={8}>
                  <Box
                    aria-hidden="true"
                    style={{
                      height: 38,
                      borderRadius: 12,
                      background: value,
                      border: `1px solid ${selectedVibe.borderLight}`,
                    }}
                  />
                  <Text fw={700} size="sm">{label}</Text>
                  <Code fz="11px">{value}</Code>
                </Stack>
              </Paper>
            )) : null}
          </SimpleGrid>
        </Paper>
      </ReferenceSection>

      <ReferenceSection
        title={copy.proofTitle}
        description={copy.proofDescription}
      >
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {colorSchemeProof.map((item) => (
            <Paper key={item.id} withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Badge variant="light" color={item.id === 'dark' ? 'violet' : item.id === 'auto' ? 'teal' : 'blue'} w="fit-content">
                  {copy.schemes[item.id]}
                </Badge>
                <Text size="sm">{copy.schemeDescriptions[item.id]}</Text>
                <Text size="xs" c="dimmed">
                  {copy.requiredProof}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.livePreviewTitle}
        description={copy.livePreviewDescription}
      >
        <SimpleGrid cols={{ base: 1, xl: comparisonEnabled ? 2 : 1 }} spacing="lg">
          <GdsProvider key={previewKey} theme={selectedTheme} defaultColorScheme={effectiveColorScheme}>
            <ThemePreviewSurface
              preset={selectionSummary}
              colorScheme={effectiveColorScheme}
              requestedColorScheme={colorScheme}
              copy={copy}
            />
          </GdsProvider>
          {comparisonEnabled ? (
            <GdsProvider key={comparisonPreviewKey} theme={comparedTheme} defaultColorScheme={effectiveComparisonScheme}>
              <Paper withBorder radius="xl" p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap={4}>
                      <Text fw={700}>{copy.comparisonPreviewTitle}</Text>
                      <Text size="sm" c="dimmed">
                        {copy.comparisonPreviewDescription}
                      </Text>
                    </Stack>
                    <Badge color="violet" variant="light">
                      {comparisonSummary.label}
                    </Badge>
                  </Group>
                  <ThemePreviewSurface
                    preset={comparisonSummary}
                    colorScheme={effectiveComparisonScheme}
                    requestedColorScheme={colorScheme}
                    copy={copy}
                  />
                </Stack>
              </Paper>
            </GdsProvider>
          ) : null}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.unsupportedTitle}
        description={copy.unsupportedDescription}
        tone="supporting"
      >
        <Stack gap="md">
          <StateBlock
            variant="permission"
            title={copy.doNotCreateTitle}
            description={copy.doNotCreateDescription}
            compact
          />
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Text fw={700} size="sm">
                  {copy.approvedRemediation}
                </Text>
                <Code block>createPublicBrandTheme({`{ flatSurfaces: true, overrides: { primaryColor: 'blue' } }`})</Code>
              </Stack>
            </Paper>
            <Paper withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Text fw={700} size="sm">
                  {copy.prohibitedOwnership}
                </Text>
                <Code block>extendGdsTheme(...) / createTheme(...) / mergeMantineTheme(...)</Code>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </ReferenceSection>
    </Stack>
  );
}
