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
import { useGdsTranslation, useGdsAmbientTheme, computeGdsThemeIdentity, resolveGdsAccentTokens, type GdsAccentName, type GdsThemePresetId } from '@sovereignsquad/gds-theme';
import type { GdsBadgeAccentShade } from './GdsBadge';
import { GDS_OSM_TILE_SOURCE, assertGdsTileSource, type GdsMapTileSource } from './map-tile-policy';
import { StateBlock } from './StateBlock';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { GDS_PIN_SILHOUETTE_PATH } from './badge-shapes';
import { GDS_PIN_EMPHASIS_STROKE, GDS_PIN_APPROXIMATE_DASH, GDS_PIN_SELECTED_SCALE } from './GdsMapPinBadge';

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
  /**
   * On-map preview content for a selected marker (issue 620). When supplied, activating a
   * marker opens a Leaflet popup anchored at the pin, and this renders the popup's content —
   * typically a `GdsMapPinPreviewCard`. Rendered through a React portal, so it is real GDS
   * UI with live tokens, not engine markup.
   */
  renderMarkerPreview?: (markerId: string) => ReactNode;
  /**
   * The consumer will never have tile access (air-gapped or restricted network, issue 570).
   * The map renders markers, fills and the text-equivalent list on a plain governed surface
   * with a matter-of-fact notice — the degraded presentation as the INTENDED state, not a
   * permanent error message about a fetch that was never going to happen.
   */
  offline?: boolean;
}

/**
 * Issue 570 — classify a total tile failure, HONESTLY.
 *
 * A tile is an <img> from another origin: the error event carries no status, so the browser
 * hides whether the cause was the network, a content-security policy, a missing identification
 * header, or the host being down. The only cause the browser does expose is the machine being
 * offline. Everything else is reported as exactly what it is — indistinguishable — rather than
 * a plausible guess (Rule 11; the issue's own constraint).
 */
export function classifyGdsTileFailure(onLine: boolean): 'offline' | 'indeterminate' {
  return onLine ? 'indeterminate' : 'offline';
}

/**
 * Total failure means NOTHING loaded: this many consecutive errors with zero successful tile
 * loads. Partial tile errors (a flaky host dropping some tiles) do not degrade the surface —
 * the map still shows imagery, and replacing a mostly-working map with an error would be worse
 * than the failure.
 */
export const GDS_TILE_FAILURE_THRESHOLD = 4;

/** Bounded auto-retry delays (ms), jittered ±25% at use. Two attempts, then only manual retry. */
export const GDS_TILE_RETRY_DELAYS_MS = [4000, 12000];

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
  // Issue 569: rem-based via the same scale factor the axes use, never a fixed pixel count —
  // a consumer raising --mantine-scale raises the map with everything else.
  preset, colorScheme, label, onStateChange, height = 'calc(26.25rem * var(--mantine-scale, 1))',
  tileSource = GDS_OSM_TILE_SOURCE, listPlacement = 'below', offline = false,
  renderMarkerPreview,
}: GdsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<unknown>(null);
  const [state, setState] = useState<GdsMapState>('initializing');
  const regionId = useId();
  const { t } = useGdsTranslation();

  // Issue 621 — the map BAKES resolved values into engine-injected markup, so it must know the
  // active theme. Before this, `preset`/`colorScheme` defaulted to 'default'/'light' and every
  // consumer that did not thread the theme through — including the reference site — rendered
  // marker colours off-theme and never re-initialised on a switch. Ambient by default; the
  // props still override for deliberate composition (a per-preset reference table).
  const ambient = useGdsAmbientTheme();
  const activePreset = preset ?? ambient.preset;
  const activeScheme = colorScheme ?? ambient.colorScheme;

  // Issue 570 — tiles-unavailable degradation. Counters live in a ref (an error per tile per
  // pan would thrash state); the boolean is state because the degraded surface renders.
  const [tilesFailed, setTilesFailed] = useState(false);
  const tileHealthRef = useRef({ loads: 0, errors: 0, autoRetries: 0 });
  const tileLayerRef = useRef<{ redraw: () => void } | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Issue 620 — the popup portal. Leaflet owns the popup's DOM lifecycle; React owns its
  // content. The host div is created per marker at init and portalled into while open.
  const popupHostsRef = useRef(new Map<string, HTMLElement>());
  const [openPopupMarkerId, setOpenPopupMarkerId] = useState<string | null>(null);
  // Issue 620, mobile follow-up (owner screenshot): a preview card is TALLER than a phone-sized
  // map and wider than its column, so a pin-anchored balloon can never fit — Leaflet clips it
  // to a sliver. Below this container width the preview DOCKS to the map surface instead: the
  // standard mobile map pattern, full-width, height-capped, scrollable (the reachability rule —
  // content that may overflow must scroll). The balloon remains for containers that can hold it.
  const [dockPreview, setDockPreview] = useState(false);

  const retryTiles = useCallback(() => {
    tileHealthRef.current.loads = 0;
    tileHealthRef.current.errors = 0;
    setTilesFailed(false);
    tileLayerRef.current?.redraw();
  }, []);
  useEffect(() => () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); }, []);

  // The theme identity is what forces a full re-init. Leaflet reads resolved values when it
  // constructs its panes; nothing about a CSS variable change reaches back into them.
  const themeIdentity = computeGdsThemeIdentity({ preset: activePreset, colorScheme: activeScheme });

  useEffect(() => {
    let disposed = false;
    let map: { remove: () => void } | null = null;
    popupHostsRef.current.clear();
    setOpenPopupMarkerId(null);

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
        // Offline mode skips the tile layer entirely: the degraded presentation is the
        // intended state, and requesting tiles that can never arrive would make GDS a
        // load-generation problem for nothing (issue 570).
        if (!offline) {
          const tiles = (L as typeof import('leaflet')).tileLayer(source.url, {
            maxZoom: Math.min(maxZoom, source.maxZoom),
            // Leaflet's own attribution control is disabled; the credit is rendered as GDS UI
            // below so it cannot be hidden by a consumer restyling Leaflet's chrome.
            attribution: '',
          }).addTo(map as never);
          tileLayerRef.current = tiles as unknown as { redraw: () => void };
          // Total failure only: consecutive errors with zero loads. A host dropping some
          // tiles keeps its mostly-working map — see GDS_TILE_FAILURE_THRESHOLD's docs.
          tiles.on('tileload', () => {
            tileHealthRef.current.loads += 1;
            if (tileHealthRef.current.errors > 0) tileHealthRef.current.errors = 0;
            setTilesFailed(false);
          });
          tiles.on('tileerror', () => {
            const health = tileHealthRef.current;
            health.errors += 1;
            if (health.loads === 0 && health.errors >= GDS_TILE_FAILURE_THRESHOLD) {
              setTilesFailed(true);
              // Bounded, jittered auto-retry — two attempts, then only the manual control.
              // Jitter so a fleet of clients does not re-hit a struggling host in lockstep.
              if (health.autoRetries < GDS_TILE_RETRY_DELAYS_MS.length && !retryTimerRef.current) {
                const base = GDS_TILE_RETRY_DELAYS_MS[health.autoRetries];
                health.autoRetries += 1;
                retryTimerRef.current = setTimeout(() => {
                  retryTimerRef.current = null;
                  tileHealthRef.current.loads = 0;
                  tileHealthRef.current.errors = 0;
                  setTilesFailed(false);
                  tileLayerRef.current?.redraw();
                }, base + (Math.random() - 0.5) * base * 0.5);
              }
            }
          });
        }

        // Markers, viewport reporting and selection — wired, not declared. A prop that
        // silently does nothing is worse than an absent one: a consumer wires a handler, sees
        // no calls, and has no way to tell a broken map from an inert API.
        //
        // Issue 620 — the marker IS the governed pin. The map used to draw plain circles, so
        // the pin vocabulary (its silhouette, its #545 states) never reached the one surface
        // it was designed for. The marker is now an engine-injected SVG built from
        // GDS_PIN_SILHOUETTE_PATH — the same path GdsBadgeShapePin renders — with LIVE var()
        // colour references (this is DOM, so the cascade re-resolves them on a theme switch
        // without waiting for the identity remount), the accent-axis fallback resolved from
        // the ambient theme, and the #545 contract applied on-map: selected scales around the
        // TAIL TIP with the emphasis stroke, approximate renders the dashed neutral stroke.
        // Size stays density-scaled (issue 569): the pin box is 2.5× the sm space step —
        // 30px at default density — anchored at the tail tip, which is the geographic point.
        const accentTokens = resolveGdsAccentTokens(undefined, activeScheme, activePreset);
        const layer = (L as typeof import('leaflet')).layerGroup().addTo(map as never);
        const placedById = new Map<string, { openPopup: () => void }>();
        for (const marker of orderedMarkers) {
          const shade = marker.shade ?? 'base';
          const accentVar = `var(--gds-accent-${marker.accent}-${shade}, ${accentTokens[`--gds-accent-${marker.accent}-${shade}`] ?? 'currentColor'})`;
          const selected = marker.id === selectedMarkerId;
          const stroke = selected ? GDS_PIN_EMPHASIS_STROKE : 1.75;
          const dash = marker.approximate ? ` stroke-dasharray="${GDS_PIN_APPROXIMATE_DASH}"` : '';
          const strokeColour = marker.approximate ? 'var(--mantine-color-dark-7, #1f2937)' : accentVar;
          const scale = selected ? ` transform:scale(${GDS_PIN_SELECTED_SCALE}); transform-origin:50% 100%;` : '';
          const icon = (L as typeof import('leaflet')).divIcon({
            className: 'gds-map-pin',
            // `aria-hidden` on the glyph and the accessible name on the marker itself: the
            // shape carries no meaning a screen reader can use, the label does.
            html: `<svg aria-hidden="true" viewBox="0 0 24 24" style="display:block;width:calc(var(--gds-space-sm, 0.75rem) * 2.5);height:calc(var(--gds-space-sm, 0.75rem) * 2.5);filter:drop-shadow(var(--gds-elevation-1, 0 1px 2px rgba(0,0,0,0.2)));${scale}"><path d="${GDS_PIN_SILHOUETTE_PATH}" fill="${accentVar}" stroke="${strokeColour}" stroke-width="${stroke}"${dash} stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="11" r="3" fill="var(--gds-text-on-inverse, var(--mantine-color-white, #ffffff))"/></svg>`,
            iconSize: [30, 30],
            // The tail tip (12, 21.4 of 24) is the geographic point — anchoring at the box
            // centre would place every pin ~9px north of where it claims to be.
            iconAnchor: [15, 27],
            popupAnchor: [0, -28],
          });
          const placed = (L as typeof import('leaflet'))
            .marker([marker.position.lat, marker.position.lng], { icon, title: marker.label, alt: marker.label, keyboard: interactive })
            .addTo(layer);
          if (onMarkerSelect) placed.on('click', () => onMarkerSelect(marker.id));
          // Issue 620 — the on-map preview. When the consumer supplies renderMarkerPreview,
          // selection opens a Leaflet popup whose content is a GDS-rendered portal host.
          if (renderMarkerPreview) {
            const host = document.createElement('div');
            host.setAttribute('data-gds-map-popup-host', marker.id);
            // Leaflet measures the popup content the moment it opens — BEFORE React has
            // portalled the card in — and locks the measured width as an inline style. An
            // empty host measured 51px, and the card then rendered into a sliver (owner
            // screenshot, mobile). The host declares its width up front, viewport-capped, so
            // the measurement is of the real footprint. 18rem floor keeps the card readable;
            // 76vw cap keeps the popup inside a phone viewport with Leaflet's own padding.
            host.style.width = 'clamp(15rem, 18rem, 76vw)';
            placed.bindPopup(host, { closeButton: false, minWidth: 200, maxWidth: 380, maxHeight: 300, className: 'gds-map-popup' });
            placed.on('popupopen', () => setOpenPopupMarkerId(marker.id));
            placed.on('popupclose', () => setOpenPopupMarkerId((current) => (current === marker.id ? null : current)));
            popupHostsRef.current.set(marker.id, host);
            placedById.set(marker.id, placed as unknown as { openPopup: () => void });
          }
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

        // Selecting a marker re-initialises the map (selection is part of the identity — the
        // emphasis stroke is baked into the marker markup), which would destroy a popup the
        // click just opened. Re-opened AFTER the size revalidation, a frame later: opening
        // against the pre-measure geometry made Leaflet's auto-pan aim at a container size
        // the map no longer had, leaving the popup hanging off the phone viewport (owner
        // screenshot). autoPan needs true dimensions to bring the card fully into view.
        if (selectedMarkerId && renderMarkerPreview) {
          requestAnimationFrame(() => {
            if (disposed) return;
            const width = containerRef.current?.getBoundingClientRect().width ?? 0;
            // Docked containers never open the balloon — the docked overlay renders instead.
            if (width >= 480) placedById.get(selectedMarkerId)?.openPopup();
          });
        }

        const measureDock = () => {
          if (containerRef.current) setDockPreview(containerRef.current.getBoundingClientRect().width < 480);
        };
        measureDock();
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          resizeObserver = new ResizeObserver(() => { revalidate(); measureDock(); });
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
  // renderMarkerPreview is deliberately NOT a dependency: consumers pass inline closures whose
  // identity changes every render, and the map re-initialising per parent render would destroy
  // panning state constantly. The portal reads the latest closure at render time regardless.
  }, [themeIdentity, interactive, minZoom, maxZoom, markers, selectedMarkerId, activeScheme, activePreset, offline]);

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
      <Box style={{ position: 'relative' }}>
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
        {dockPreview && renderMarkerPreview && selectedMarkerId ? (
          <Box
            data-gds-map-preview-dock=""
            style={{
              position: 'absolute',
              left: 'var(--gds-space-2xs)',
              right: 'var(--gds-space-2xs)',
              bottom: 'var(--gds-space-2xs)',
              maxHeight: '85%',
              overflowY: 'auto',
              zIndex: 700,
              borderRadius: 'var(--gds-radius-panel)',
            }}
          >
            {renderMarkerPreview(selectedMarkerId)}
          </Box>
        ) : null}
      </Box>
      {/*
        Issue 570 — tiles unavailable. A banner BESIDE the map, never a replacement for it:
        markers, fills and the list need no tiles and stay fully functional, and "no tiles" must
        never read as "no places" — the message is about imagery, the count line right below
        keeps telling the truth about content. `offline` is the intended state and says so in
        empty-state voice; a detected failure is an error with a retry, and its copy names only
        what the browser actually exposes (offline vs indeterminate — see classifyGdsTileFailure).
      */}
      {offline ? (
        <StateBlock
          variant="empty"
          compact
          title={t('gds.gdsMap.offlineTitle', 'Map imagery is off')}
          description={t('gds.gdsMap.offlineDescription', 'This environment does not load map tiles. Every place still appears as a marker and in the list.')}
        />
      ) : tilesFailed ? (
        <StateBlock
          variant="error"
          compact
          title={t('gds.gdsMap.tilesFailedTitle', 'Map imagery could not be loaded')}
          description={
            classifyGdsTileFailure(typeof navigator === 'undefined' ? true : navigator.onLine) === 'offline'
              ? t('gds.gdsMap.tilesFailedOffline', 'You appear to be offline. Every place still appears as a marker and in the list.')
              : t('gds.gdsMap.tilesFailedIndeterminate', 'The tile host could not be reached — the browser cannot tell whether the cause is the network, a content security policy, or the host itself. Every place still appears as a marker and in the list.')
          }
          action={(
            <UnstyledButton
              type="button"
              data-gds-map-tile-retry
              onClick={retryTiles}
              style={{
                padding: 'var(--gds-space-2xs) var(--gds-space-sm)',
                borderRadius: 'var(--gds-radius-chip)',
                border: '1px solid var(--gds-border-card)',
                color: 'var(--gds-text-body)',
              }}
            >
              {t('gds.gdsMap.tilesRetryLabel', 'Try loading imagery again')}
            </UnstyledButton>
          )}
        />
      ) : null}
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
      {/* Issue 620 — the popup's content is real React, portalled into Leaflet's popup DOM. */}
      {renderMarkerPreview && openPopupMarkerId && popupHostsRef.current.get(openPopupMarkerId)
        ? createPortal(renderMarkerPreview(openPopupMarkerId), popupHostsRef.current.get(openPopupMarkerId) as HTMLElement)
        : null}
      <Text size="xs" c="dimmed" data-gds-map-attribution="">
        <a href={tileSource.attributionHref} target="_blank" rel="noreferrer noopener">{tileSource.attributionText}</a>
      </Text>
    </Stack>
  );
}
