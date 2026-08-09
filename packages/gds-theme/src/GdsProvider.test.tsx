import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notifications } from '@mantine/notifications';
import { openConfirmModal } from '@mantine/modals';
import { Button } from '@mantine/core';
import { renderWithGds } from '../../../test-utils/render';
import { createGdsThemeAccessibilityReport, validateGdsThemeAccessibility } from './accessibility-report';
import { GdsProvider } from './GdsProvider';
import { applyGdsFontLane, getGdsFontLaneStylesheetUrls, getGdsFontLanes, isGdsFontLaneId, resolveGdsFontLane } from './font-lanes';
import { createGdsMotionCssVariables, getGdsMotionPreset, gdsMotionDurations, gdsMotionPresets } from './motion';
import { showGdsNotification } from './notifications';
import { createGdsTokenDiff, createGdsTokenGraph, createGdsThemeCompatibilityReport, validateGdsTokenGraph } from './token-operations';
import { createPublicBrandTheme, gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme, withGdsMotion } from './theme';
import { getGdsThemePresets, partnerDiscoveryThemePreset, resolveGdsThemePreset } from './theme-presets';
import { useGdsThemePresetState } from './theme-runtime';
import { getGdsVibeThemes, resolveGdsVibeTheme } from './vibe-themes';
import { createBrandTheme } from './brand-tokens';

function ProviderConsumer() {
  return (
    <>
      <Button onClick={() => notifications.show({ message: 'Shared notification' })}>
        Show notification
      </Button>
      <Button onClick={() => openConfirmModal({ title: 'Shared modal', labels: { confirm: 'Yes', cancel: 'No' } })}>
        Show modal
      </Button>
    </>
  );
}

function ThemeRuntimeConsumer() {
  const { selection, setPreset, setScheme, setFontLane, reset } = useGdsThemePresetState({
    storageKey: 'gds-test-theme-runtime',
  });

  return (
    <>
      <div data-testid="runtime-key">{selection.runtimeKey}</div>
      <Button onClick={() => setPreset('coral')}>Set coral</Button>
      <Button onClick={() => setScheme('dark')}>Set dark</Button>
      <Button onClick={() => setFontLane('space-grotesk')}>Set Space Grotesk</Button>
      <Button onClick={reset}>Reset runtime</Button>
    </>
  );
}

describe('GdsProvider', () => {
  it('provides notifications and modals as part of the shared root composition', async () => {
    const user = userEvent.setup();

    renderWithGds(<ProviderConsumer />);

    await user.click(screen.getByRole('button', { name: 'Show notification' }));
    expect(await screen.findByText('Shared notification')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show modal' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Shared modal')).toBeInTheDocument();
  });

  it('exposes a shared semantic notification helper', async () => {
    const user = userEvent.setup();

    renderWithGds(<Button onClick={() => showGdsNotification({ message: 'Saved through helper', tone: 'success' })}>Helper notification</Button>);

    await user.click(screen.getByRole('button', { name: 'Helper notification' }));
    expect(await screen.findByText('Saved through helper')).toBeInTheDocument();
  });

  it('sets rtl direction for rtl locales', () => {
    const { container } = renderWithGds(<div>RTL child</div>, { locale: 'ar' });

    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it('keeps the canonical base theme motion-safe and exposes opt-in motion overrides', () => {
    expect(gdsTheme.components.Button?.styles).toBeUndefined();
    expect(gdsTheme.components.Card?.styles?.root).toEqual({
      background: 'var(--mantine-color-body)',
    });

    const motionTheme = withGdsMotion();
    expect(motionTheme.components.Button?.styles?.root).toMatchObject({
      transition: 'transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1), filter var(--gds-motion-duration-fast) var(--gds-motion-ease-standard)',
    });
    expect(motionTheme.components.Card?.styles?.root).toMatchObject({
      transition: 'transform 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 180ms cubic-bezier(0.2, 0, 0, 1)',
    });
  });

  it('resolves governed motion presets with reduced and no-motion fallbacks', () => {
    expect(Object.keys(gdsMotionPresets)).toEqual(expect.arrayContaining(['overlay', 'drawer', 'command', 'list', 'feedback', 'skeleton', 'state']));
    expect(gdsMotionDurations.base).toBe(180);

    const overlay = getGdsMotionPreset('overlay');
    expect(overlay.durationMs).toBe(180);
    expect(overlay.shouldAnimate).toBe(true);
    expect(overlay.transition).toContain('var(--gds-motion-duration-base)');

    const reducedOverlay = getGdsMotionPreset('overlay', 'reduce');
    expect(reducedOverlay.transition).toBe('opacity var(--gds-motion-duration-fast) linear');
    expect(reducedOverlay.enterTransform).toBe('none');

    const noMotionOverlay = getGdsMotionPreset('overlay', 'no-motion');
    expect(noMotionOverlay.durationMs).toBe(0);
    expect(noMotionOverlay.transition).toBe('none');
    expect(noMotionOverlay.shouldAnimate).toBe(false);

    expect(createGdsMotionCssVariables('no-motion')).toMatchObject({
      '--gds-motion-duration-base': '0ms',
      '--gds-motion-ease-standard': 'linear',
    });
  });

  it('accepts theme and defaultColorScheme overrides for direct package consumers', () => {
    const brandedTheme = createPublicBrandTheme({
      editorialSerif: true,
      flatSurfaces: true,
      overrides: {
        primaryColor: 'blue',
      },
    });

    renderWithGds(
      <GdsProvider theme={gdsDarkPublicTheme} defaultColorScheme="dark">
        <div>Dark shell</div>
      </GdsProvider>,
    );

    expect(screen.getByText('Dark shell')).toBeInTheDocument();
    expect(gdsFlatSurfaceTheme.shadows.md).toBe('none');
    expect(gdsEditorialPublicTheme.headings.fontFamily).toContain('Instrument Serif');
    expect(brandedTheme.primaryColor).toBe('blue');
    expect(brandedTheme.shadows.md).toBe('none');
    expect(brandedTheme.headings.fontFamily).toContain('Instrument Serif');
  });

  it('exposes a governed colorful theme registry beyond light and dark', () => {
    const presets = getGdsThemePresets();
    const vibes = getGdsVibeThemes();
    const colorfulPresetIds = [
      'sunset',
      'oceanic',
      'forest',
      'ruby',
      'amber',
      'neon-night',
      'skyline',
      'aurora',
      'coral',
      'mint',
      'orchid',
      'royal',
      'cosmic',
      'athlete-gold',
      'class-usa',
      'gold-athlete',
    ];

    expect(presets.length).toBeGreaterThanOrEqual(19);
    expect(presets.some((item) => item.id === 'default')).toBe(true);
    expect(presets.some((item) => item.id === 'brand')).toBe(true);
    expect(presets.some((item) => item.id === 'partner-discovery')).toBe(true);
    expect(colorfulPresetIds.every((id) => presets.some((item) => item.id === id))).toBe(true);
    expect(colorfulPresetIds.every((id) => vibes.some((item) => item.id === id))).toBe(true);
    expect(presets.find((item) => item.id === 'coral')?.runtimeLane).toBe('resolveGdsThemePreset(coral)');
    expect(presets.find((item) => item.id === 'partner-discovery')?.runtimeLane).toBe('partnerDiscoveryThemePreset');

    const resolved = resolveGdsThemePreset('sunset');
    expect(resolved.primaryColor).toBe('orange');
    expect(resolveGdsThemePreset('partner-discovery')).toBe(partnerDiscoveryThemePreset);
    expect(partnerDiscoveryThemePreset.primaryColor).toBe('teal');
    expect(partnerDiscoveryThemePreset.other?.gdsPartnerDiscoveryTokens).toMatchObject({
      teal: '#08463b',
      lime: '#2fc800',
      mapRadius: 16,
    });

    const coral = resolveGdsThemePreset('coral');
    expect(coral.primaryColor).toBe('pink');

    const royalVibe = resolveGdsVibeTheme('royal');
    expect(royalVibe.primary).toBe('#7c3aed');
    expect(royalVibe.accent).toBe('#06b6d4');
    expect(royalVibe.hero).toContain('linear-gradient');

    const cosmicVibe = resolveGdsVibeTheme('cosmic');
    expect(cosmicVibe.label).toBe('Cosmic burst');
    expect(cosmicVibe.gradient).toContain('#f7f3ff');

    const athleteGoldVibe = resolveGdsVibeTheme('athlete-gold');
    expect(athleteGoldVibe.label).toBe('Athlete Gold');
    expect(athleteGoldVibe.primary).toBe('#e4a623');
    expect(athleteGoldVibe.canvasDark).toBe('#03080f');
    expect(athleteGoldVibe.hero).toContain('rgba(5, 11, 20, 0.92)');

    const classUsaVibe = resolveGdsVibeTheme('class-usa');
    expect(classUsaVibe.label).toBe('Class USA');
    expect(classUsaVibe.primary).toBe('#0b223e');
    expect(resolveGdsThemePreset('class-usa').primaryColor).toBe('classUsaNavy');

    const goldAthleteVibe = resolveGdsVibeTheme('gold-athlete');
    expect(goldAthleteVibe.label).toBe('Gold Athlete');
    expect(goldAthleteVibe.primary).toBe('#8a5a00');
    expect(goldAthleteVibe.canvasDark).toBe('#0a0d12');
    expect(resolveGdsThemePreset('gold-athlete').primaryColor).toBe('goldAthleteCharcoal');

    const partnerVibe = resolveGdsVibeTheme('partner-discovery');
    expect(partnerVibe.primary).toBe('#08463b');
    expect(partnerVibe.accent).toBe('#2fc800');
  });

  it('applies theme-owned CSS variables at the provider root for portalled overlays', () => {
    const classUsaTheme = createBrandTheme('class-usa').mantineTheme;

    const { unmount } = renderWithGds(
      <GdsProvider theme={classUsaTheme}>
        <div>Class USA shell</div>
      </GdsProvider>,
    );

    expect(screen.getByText('Class USA shell')).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--gds-brand-primary')).toBe('#0b223e');
    expect(document.documentElement.style.getPropertyValue('--gds-brand-accent-action')).toBe('#d63900');

    unmount();
    expect(document.documentElement.style.getPropertyValue('--gds-brand-primary')).toBe('');
  });

  it('applies Gold Athlete theme-owned CSS variables at the provider root for portalled overlays', () => {
    const goldAthleteTheme = createBrandTheme('gold-athlete').mantineTheme;

    const { unmount } = renderWithGds(
      <GdsProvider theme={goldAthleteTheme}>
        <div>Gold Athlete shell</div>
      </GdsProvider>,
    );

    expect(screen.getByText('Gold Athlete shell')).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--gds-brand-primary')).toBe('#12161c');
    expect(document.documentElement.style.getPropertyValue('--gds-brand-accent-action')).toBe('#8a5a00');

    unmount();
    expect(document.documentElement.style.getPropertyValue('--gds-brand-primary')).toBe('');
  });

  it('ships blocking-free theme accessibility checks for all public vibe lanes', () => {
    const validation = validateGdsThemeAccessibility();
    const report = createGdsThemeAccessibilityReport();

    expect(validation.ok).toBe(true);
    expect(report.blockingCount).toBe(0);
    expect(report.themeCount).toBe(getGdsVibeThemes().length);
    expect(report.checks.length).toBeGreaterThanOrEqual(report.themeCount * 2 * 6);
    expect(report.forcedColorRoles.map((role) => role.cssSystemColor)).toEqual(expect.arrayContaining([
      'Canvas',
      'CanvasText',
      'ButtonFace',
      'ButtonText',
      'LinkText',
      'Highlight',
      'GrayText',
    ]));
    expect(report.recommendedRuntimeChecks).toEqual(expect.arrayContaining([
      'Run npm run verify:forced-colors-runtime against the docs site before publishing.',
    ]));
  });

  it('exposes governed token graph, compatibility, and diff reports for theme operations', () => {
    const graph = createGdsTokenGraph();
    const validation = validateGdsTokenGraph(graph);
    const compatibility = createGdsThemeCompatibilityReport(graph);

    expect(validation.ok).toBe(true);
    expect(validation.errorCount).toBe(0);
    expect(graph.themeCount).toBe(getGdsVibeThemes().length);
    expect(graph.tokenCount).toBe(graph.themeCount * 17);
    expect(graph.nodes.some((node) => node.id === 'default.canvas-light')).toBe(true);
    expect(compatibility.compatibleThemeCount).toBe(compatibility.themeCount);
    expect(compatibility.themes.find((theme) => theme.themeId === 'dark-public')?.surfaces).toHaveLength(12);

    const modifiedGraph = {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === 'coral.primary' ? { ...node, value: '#ff00aa' } : node),
    };
    const diff = createGdsTokenDiff(graph, modifiedGraph);

    expect(diff.changedCount).toBe(1);
    expect(diff.entries[0]).toMatchObject({
      type: 'changed',
      tokenId: 'coral.primary',
      before: graph.nodes.find((node) => node.id === 'coral.primary')?.value,
      after: '#ff00aa',
    });
  });

  it('exposes approved font lanes and applies them to theme contracts', () => {
    const lanes = getGdsFontLanes();
    expect(lanes.length).toBeGreaterThanOrEqual(11);
    expect(lanes.every((lane) => lane.fontDisplay === 'swap')).toBe(true);
    expect(lanes.every((lane) => lane.fallbackStack.length > 0)).toBe(true);
    expect(lanes.every((lane) => lane.localeCoverage.includes('en'))).toBe(true);
    expect(lanes.every((lane) => lane.source === 'google-fonts-compatible' || lane.source === 'system')).toBe(true);
    expect(getGdsFontLaneStylesheetUrls().length).toBeGreaterThanOrEqual(10);
    expect(isGdsFontLaneId('space-grotesk')).toBe(true);
    expect(isGdsFontLaneId('partner-discovery')).toBe(true);
    expect(isGdsFontLaneId('local-product-font')).toBe(false);
    expect(resolveGdsFontLane('local-product-font').id).toBe('inter');

    const themed = applyGdsFontLane(gdsTheme, 'instrument-serif');
    expect(themed.headings?.fontFamily).toContain('Instrument Serif');
    expect(themed.other?.gdsFontLane).toBe('instrument-serif');
    expect(applyGdsFontLane(gdsTheme, 'partner-discovery').headings?.fontFamily).toContain('Jost');
    expect(applyGdsFontLane(gdsTheme, 'local-product-font').other?.gdsFontLane).toBe('inter');
  });

  it('exposes a persistent runtime preset hook for global theme switching', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('gds-test-theme-runtime', '{broken json');

    renderWithGds(<ThemeRuntimeConsumer />);

    expect(screen.getByTestId('runtime-key')).toHaveTextContent('default-light-blue-true-false-inter');

    await user.click(screen.getByRole('button', { name: 'Set coral' }));
    await user.click(screen.getByRole('button', { name: 'Set dark' }));
    await user.click(screen.getByRole('button', { name: 'Set Space Grotesk' }));

    expect(screen.getByTestId('runtime-key')).toHaveTextContent('coral-dark-blue-true-false-space-grotesk');
    expect(document.documentElement.getAttribute('data-gds-theme-runtime')).toBe('coral-dark-blue-true-false-space-grotesk');
    expect(document.documentElement.getAttribute('data-gds-theme-preset')).toBe('coral');
    expect(document.documentElement.getAttribute('data-gds-font-lane')).toBe('space-grotesk');
    expect(document.documentElement.style.getPropertyValue('--gds-vibe-primary')).toBe('#db2777');
    expect(document.documentElement.style.getPropertyValue('--gds-vibe-accent')).toBe('#fb7185');
    expect(window.localStorage.getItem('gds-test-theme-runtime')).toContain('coral');

    // Switching to a non-default font lane (#529) loads it via a governed,
    // non-blocking <link> instead of the site-wide blocking @import that used
    // to pull in every lane's fonts regardless of which one was selected.
    const fontLink = document.getElementById('gds-font-lane-stylesheet');
    expect(fontLink).toBeInstanceOf(HTMLLinkElement);
    expect(fontLink).toHaveAttribute('rel', 'stylesheet');
    expect(fontLink).toHaveAttribute('href', resolveGdsFontLane('space-grotesk').cssImportUrl);
    expect(fontLink).toHaveAttribute('data-gds-font-lane', 'space-grotesk');

    await user.click(screen.getByRole('button', { name: 'Reset runtime' }));

    expect(screen.getByTestId('runtime-key')).toHaveTextContent('default-light-blue-true-false-inter');
    // The default 'inter' lane is already loaded statically by the package
    // stylesheet, so resetting back to it removes the dynamic link rather
    // than swapping in a second, redundant one.
    expect(document.getElementById('gds-font-lane-stylesheet')).toBeNull();
  });
});
