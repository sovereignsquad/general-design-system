'use client';

// Issue 566 — the governed map surface.
//
// Leaflet is an implementation detail and is never exposed. The reason that matters here more
// than usual: Leaflet holds imperative DOM and reads resolved colours at construction, so a
// map is exactly the "third-party surface initialised with a theme snapshot" that issue 561
// identified — the CSS cascade cannot fix it, and without an explicit destroy/re-init keyed on
// theme identity a theme switch leaves the map rendering the previous theme.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { computeGdsThemeIdentity, resolveGdsAccentTokens, type GdsAccentName, type GdsThemePresetId } from '@sovereignsquad/gds-theme';
import type { GdsBadgeAccentShade } from './GdsBadge';
import { GDS_OSM_TILE_SOURCE, assertGdsTileSource, type GdsMapTileSource } from './map-tile-policy';

/** A geographic point. */
export interface GdsLatLng { lat: number; lng: number }

/** A geographic rectangle. */
export interface GdsLatLngBounds { north: number; south: number; east: number; west: number }

/** What the map is centred on and how far it is zoomed. */
export interface GdsMapViewport { center: GdsLatLng; zoom: number }

/** One placed marker. */
export interface GdsMapMarker {
  id: string;
  position: GdsLatLng;
  accent: GdsAccentName;
  /**
   * Accessible name. REQUIRED, and consumer-supplied.
   *
   * Never derived from an icon's import name: "IconMapPin2" is not what a screen-reader user
   * needs to hear, and a marker whose only identity is its colour is invisible to them.
   */
  label: string;
  shade?: GdsBadgeAccentShade;
  /** The position is approximate; rendered distinctly rather than implying false precision. */
  approximate?: boolean;
  selected?: boolean;
}

/** Lifecycle state, surfaced so a consumer can render its own loading and error affordances. */
export type GdsMapState = 'initializing' | 'ready' | 'error';

/** Props for {@link GdsMap}. */
export interface GdsMapProps {
  /** Markers to place. Re-placed imperatively when this changes, because Leaflet owns their DOM. */
  markers: GdsMapMarker[];
  /** Controlled viewport. When supplied the map does not self-manage its view. */
  viewport?: GdsMapViewport;
  /** Initial viewport when uncontrolled. Ignored once `viewport` is supplied. */
  defaultViewport?: GdsMapViewport;
  /** Fit to these bounds on mount. Mutually exclusive with `defaultViewport`. */
  fitBounds?: GdsLatLngBounds;
  /** Closest-out zoom the user may reach. Defaults to 3 — far enough out to show a continent. */
  minZoom?: number;
  /** Closest-in zoom. Clamped to what the tile source actually serves, so tiles never 404. */
  maxZoom?: number;
  /** Restricts panning, so a user cannot lose the map entirely. */
  maxBounds?: GdsLatLngBounds;
  /**
   * Fired after the view settles. `reason` distinguishes a user gesture from a programmatic
   * move, so a consumer syncing URL state does not fight its own updates.
   */
  onViewportChange?: (viewport: GdsMapViewport, reason: 'user' | 'programmatic') => void;
  /** Fired when a marker is activated. Receives the marker id, never the engine's object. */
  onMarkerSelect?: (markerId: string) => void;
  /** Currently selected marker id, for a consumer driving selection from outside the map. */
  selectedMarkerId?: string;
  /** `false` renders a non-interactive map. */
  interactive?: boolean;
  /** Preset and scheme the map is themed by; drives the destroy/re-init on a theme switch. */
  preset?: GdsThemePresetId | string;
  /** Colour scheme the map is themed by; part of the identity that triggers re-initialisation. */
  colorScheme?: 'light' | 'dark';
  /** Accessible name for the map region. Required, for the same reason marker labels are. */
  label: string;
  /** Reports lifecycle transitions, so a consumer can render its own loading or error affordance. */
  onStateChange?: (state: GdsMapState) => void;
  /** Height of the map surface. Defaults to a governed token. */
  height?: string;
  /** Tile source. Defaults to OpenStreetMap; any replacement must carry its own attribution. */
  tileSource?: GdsMapTileSource;
  /**
   * Where the text-equivalent marker list sits relative to the map (issue 568).
   *
   * PLACEMENT is configurable; PRESENCE is not. There is deliberately no value that removes
   * the list: a prop that hid it would make conformance a consumer choice, and the list is the
   * conformance path for a raster map — tile imagery is decorative by nature and cannot be
   * described.
   */
  listPlacement?: 'below' | 'above';
}

const DEFAULT_VIEWPORT: GdsMapViewport = { center: { lat: 51.505, lng: -0.09 }, zoom: 13 };

/**
 * Governed map surface backed by Leaflet and OpenStreetMap raster tiles.
 *
 * Rendered from a dedicated subpath rather than the main barrel: Leaflet is browser-only, and
 * pulling it into the main entry would make every consumer pay for it whether or not they show
 * a map.
 *
 * The component renders a deterministic placeholder on the server and during initialisation.
 * That is not a nicety — a map that renders nothing until tiles arrive looks broken, and on a
 * slow connection it looks broken for a long time.
 */
export function GdsMap({
  markers, viewport, defaultViewport, fitBounds, minZoom = 3, maxZoom = 18, maxBounds,
  onViewportChange, onMarkerSelect, selectedMarkerId, interactive = true,
  preset = 'default', colorScheme = 'light', label, onStateChange, height = '420px',
  tileSource = GDS_OSM_TILE_SOURCE, listPlacement = 'below',
}: GdsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<unknown>(null);
  const [state, setState] = useState<GdsMapState>('initializing');
  const regionId = useId();

  // The theme identity is what forces a full re-init. Leaflet reads resolved values when it
  // constructs its panes; nothing about a CSS variable change reaches back into them.
  const themeIdentity = computeGdsThemeIdentity({ preset, colorScheme });

  useEffect(() => {
    let disposed = false;
    let map: { remove: () => void } | null = null;

    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      try {
        // Imported dynamically so the module never loads during SSR, where `window` is absent
        // and Leaflet throws at import time rather than at use.
        const L = (await import('leaflet')).default ?? (await import('leaflet'));
        if (disposed || !containerRef.current) return;

        const initial = viewport ?? defaultViewport ?? DEFAULT_VIEWPORT;
        map = (L as typeof import('leaflet')).map(containerRef.current, {
          center: [initial.center.lat, initial.center.lng],
          zoom: initial.zoom,
          minZoom,
          maxZoom,
          // Leaflet's own chrome is replaced by GDS controls, so its defaults are suppressed
          // rather than restyled — restyling third-party chrome is how a design system ends up
          // maintaining someone else's markup.
          zoomControl: false,
          attributionControl: false,
          dragging: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          keyboard: interactive,
          ...(maxBounds
            ? { maxBounds: [[maxBounds.south, maxBounds.west], [maxBounds.north, maxBounds.east]] as [[number, number], [number, number]] }
            : {}),
        }) as unknown as { remove: () => void };
        engineRef.current = map;

        // Tiles. The source is validated before use: a source without attribution cannot be
        // rendered at all, because the credit is an ODbL licence condition rather than a
        // design choice.
        const source = assertGdsTileSource(tileSource);
        (L as typeof import('leaflet')).tileLayer(source.url, {
          maxZoom: Math.min(maxZoom, source.maxZoom),
          // Leaflet's own attribution control is disabled; the credit is rendered as GDS UI
          // below so it cannot be hidden by a consumer restyling Leaflet's chrome.
          attribution: '',
        }).addTo(map as never);

        // Markers, viewport reporting and selection — wired, not declared. A prop that
        // silently does nothing is worse than an absent one: a consumer wires a handler, sees
        // no calls, and has no way to tell a broken map from an inert API.
        const accentTokens = resolveGdsAccentTokens(undefined, colorScheme, preset);
        const layer = (L as typeof import('leaflet')).layerGroup().addTo(map as never);
        for (const marker of orderedMarkers) {
          const shade = marker.shade ?? 'base';
          const colour = accentTokens[`--gds-accent-${marker.accent}-${shade}`] ?? 'currentColor';
          const icon = (L as typeof import('leaflet')).divIcon({
            className: 'gds-map-pin',
            // `aria-hidden` on the glyph and the accessible name on the marker itself: the
            // shape carries no meaning a screen reader can use, the label does.
            html: `<span aria-hidden="true" style="display:block;width:18px;height:18px;border-radius:var(--gds-radius-pin, 50%);background:${colour};border:2px solid var(--gds-bg-card);box-shadow:var(--gds-elevation-1);${marker.approximate ? 'opacity:0.65;border-style:dashed;' : ''}"></span>`,
            iconSize: [18, 18],
          });
          const placed = (L as typeof import('leaflet'))
            .marker([marker.position.lat, marker.position.lng], { icon, title: marker.label, alt: marker.label, keyboard: interactive })
            .addTo(layer);
          if (onMarkerSelect) placed.on('click', () => onMarkerSelect(marker.id));
        }

        if (onViewportChange) {
          (map as unknown as { on: (e: string, f: () => void) => void }).on('moveend', () => {
            const m = map as unknown as { getCenter: () => { lat: number; lng: number }; getZoom: () => number };
            const c = m.getCenter();
            onViewportChange({ center: { lat: c.lat, lng: c.lng }, zoom: m.getZoom() }, 'user');
          });
        }

        if (fitBounds) {
          (map as unknown as { fitBounds: (b: [[number, number], [number, number]]) => void })
            .fitBounds([[fitBounds.south, fitBounds.west], [fitBounds.north, fitBounds.east]]);
        }

        // Leaflet measures the container ONCE, at init, and lays tiles out against that
        // measurement. Anything that changes the container afterwards — a lazily-rendered
        // route settling, a webfont landing, a card reflowing, an accordion opening — leaves
        // the tiles positioned for a size the container no longer has. The symptom is exactly
        // what was reported: tiles in disjoint fragments with blank gaps, on a map that never
        // "loads properly" no matter how long you wait, because nothing is still loading.
        //
        // `invalidateSize()` re-measures and re-lays. Once immediately after init for the case
        // where the container was still settling, then on every subsequent resize.
        const engine = map as unknown as { invalidateSize: (opts?: { animate?: boolean }) => void };
        const revalidate = () => { try { engine.invalidateSize({ animate: false }); } catch { /* torn down */ } };
        revalidate();
        // A frame later as well: a container inside a freshly-mounted flex/grid parent is
        // frequently still zero-height on the tick the map is created.
        requestAnimationFrame(revalidate);

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          resizeObserver = new ResizeObserver(revalidate);
          resizeObserver.observe(containerRef.current);
        }

        if (!disposed) {
          setState('ready');
          onStateChange?.('ready');
        }
      } catch {
        // A map that fails to load must SAY so. Failing silently leaves an empty box the user
        // reads as "nothing here" rather than "this did not load".
        if (!disposed) {
          setState('error');
          onStateChange?.('error');
        }
      }
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      // Explicit destroy: Leaflet keeps document-level listeners and a tile cache, and a
      // remount without this leaks both. The re-init on theme identity depends on it running.
      try { map?.remove(); } catch { /* already torn down */ }
      engineRef.current = null;
    };
    // themeIdentity is a dependency ON PURPOSE — it is what makes a theme switch rebuild the
    // map rather than leave it painted in the previous theme.
    // markers/handlers are intentionally in the dependency list: Leaflet places them
    // imperatively, so a changed marker set has to be re-placed rather than re-rendered.
  }, [themeIdentity, interactive, minZoom, maxZoom, markers, selectedMarkerId, colorScheme, preset]);

  // ONE ordering, used by the map and the list alike. Sorted by label rather than left in
  // insertion order: a list whose sequence is "whatever the API returned" is not navigable,
  // and a keyboard user traversing it has no way to know where they are.
  const orderedMarkers = useMemo(
    () => [...markers].sort((a, b) => a.label.localeCompare(b.label)),
    [markers],
  );

  // Announcements are throttled and coalesced. Continuous panning fires `moveend` repeatedly,
  // and an unthrottled live region turns that into a screen reader reading coordinates over
  // and over — which is worse than silence, because the user cannot escape it.
  const [announcement, setAnnouncement] = useState('');
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announce = useCallback((message: string) => {
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(message), 600);
  }, []);
  useEffect(() => () => { if (announceTimer.current) clearTimeout(announceTimer.current); }, []);

  useEffect(() => {
    // Informative rather than a coordinate readout: "12 places in view" is what a user needs.
    announce(`${orderedMarkers.length} ${orderedMarkers.length === 1 ? 'place' : 'places'} in view.`);
  }, [orderedMarkers.length, announce]);

  const list = (
    <Stack gap="4xs" component="section" aria-label={`${label} — list view`}>
      <Text size="sm" fw={600}>{label} — list view</Text>
      {orderedMarkers.length === 0 ? (
        <Text size="sm" c="dimmed">No places in view.</Text>
      ) : (
        <Stack gap={2} component="ul" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {orderedMarkers.map((marker) => (
            <li key={marker.id}>
              <UnstyledButton
                onClick={() => {
                  onMarkerSelect?.(marker.id);
                  announce(`${marker.label} selected.`);
                }}
                aria-pressed={selectedMarkerId === marker.id}
                data-gds-map-list-item={marker.id}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 'var(--gds-space-2xs) var(--gds-space-xs)',
                  borderRadius: 'var(--gds-radius-chip)',
                  // A visible border rather than only a background tint: under forced colors a
                  // background is replaced by the system palette and selection would vanish,
                  // which is exactly the state a keyboard user most needs to see.
                  border: `var(--gds-focus-ring-width) ${selectedMarkerId === marker.id ? 'solid' : 'dashed'} ${selectedMarkerId === marker.id ? 'var(--gds-focus-ring-color)' : 'transparent'}`,
                  background: selectedMarkerId === marker.id ? 'var(--gds-badge-soft-info)' : 'transparent',
                  color: selectedMarkerId === marker.id ? 'var(--gds-badge-soft-info-fg)' : 'var(--gds-text-body)',
                }}
              >
                <Group gap="2xs" wrap="nowrap">
                  <Text size="sm">{marker.label}</Text>
                  {marker.approximate ? <Text size="xs" c="dimmed">(approximate location)</Text> : null}
                  {selectedMarkerId === marker.id ? <Text size="xs" c="dimmed">— selected</Text> : null}
                </Group>
              </UnstyledButton>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  );

  return (
    <Stack gap="xs">
      {listPlacement === 'above' ? list : null}
      <Box
        ref={containerRef}
        role="region"
        aria-label={label}
        aria-describedby={`${regionId}-state`}
        data-gds-map=""
        data-gds-map-state={state}
        data-gds-theme-identity={themeIdentity}
        style={{
          height,
          borderRadius: 'var(--gds-radius-panel)',
          overflow: 'hidden',
          background: 'var(--gds-bg-surface)',
          border: '1px solid var(--gds-border-card)',
        }}
      />
      {/* The state is announced, not merely styled: a sighted user sees an empty box while a
          screen-reader user gets nothing at all unless it is said. */}
      <Text id={`${regionId}-state`} size="sm" c="dimmed" role="status" aria-live="polite">
        {state === 'ready'
          ? `${label}: ${markers.length} ${markers.length === 1 ? 'marker' : 'markers'}.`
          : state === 'error'
            ? `${label} could not be loaded.`
            : `${label} is loading.`}
      </Text>
      {/*
        The ODbL credit, rendered as GDS UI rather than through Leaflet's attributionControl.
        It is not optional and not configurable away: OpenStreetMap data is licensed on the
        condition that it is credited, so this renders whenever a map does. Leaflet's own
        control was disabled precisely so the credit does not live inside third-party chrome a
        consumer might restyle or remove.
      */}
      {listPlacement === 'below' ? list : null}
      {/*
        A single polite live region. Selection and count changes both route through it, so a
        screen reader gets one coherent stream rather than two competing ones.
      */}
      <Text
        data-gds-map-announcer=""
        role="status"
        aria-live="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        {announcement}
      </Text>
      <Text size="xs" c="dimmed" data-gds-map-attribution="">
        <a href={tileSource.attributionHref} target="_blank" rel="noreferrer noopener">{tileSource.attributionText}</a>
      </Text>
    </Stack>
  );
}
