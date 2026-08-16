'use client';

// Leaflet is never exposed. It reads resolved colours at DOM construction, so a theme switch
// requires an explicit destroy/re-init keyed on theme identity — the CSS cascade cannot fix it.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useGdsTranslation, useGdsAmbientTheme, computeGdsThemeIdentity, resolveGdsAccentTokens, type GdsAccentName, type GdsThemePresetId } from '@sovereignsquad/gds-theme';
import type { GdsBadgeAccentShade } from './GdsBadge';
import { GDS_OSM_TILE_SOURCE, assertGdsTileSource, type GdsMapTileSource } from './map-tile-policy';
import { StateBlock } from './StateBlock';
import { GdsInlineLink } from './GdsInlineLink';
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
  /** Accessible name. Required; never derive from an icon's import name. */
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
  /** Placement of the text-equivalent marker list. No value removes it; presence isn't configurable. */
  listPlacement?: 'below' | 'above';
  /** On-map preview for a selected marker. Renders inside a Leaflet popup via a React portal. */
  renderMarkerPreview?: (markerId: string) => ReactNode;
  /** No tile access expected (air-gapped/restricted network). Renders markers/list without tiles, as the intended state. */
  offline?: boolean;
}

/** A tile <img> error carries no status; the browser only exposes offline vs not — other causes (network, CSP, host down) are indistinguishable. */
export function classifyGdsTileFailure(onLine: boolean): 'offline' | 'indeterminate' {
  return onLine ? 'indeterminate' : 'offline';
}

/** Consecutive errors with zero successful loads before tiles are treated as failed; partial errors don't degrade the surface. */
export const GDS_TILE_FAILURE_THRESHOLD = 4;

/** Bounded auto-retry delays (ms), jittered ±25% at use. Two attempts, then only manual retry. */
export const GDS_TILE_RETRY_DELAYS_MS = [4000, 12000];

const DEFAULT_VIEWPORT: GdsMapViewport = { center: { lat: 51.505, lng: -0.09 }, zoom: 13 };

/**
 * Map surface backed by Leaflet and OpenStreetMap raster tiles.
 *
 * Exported from a dedicated subpath, not the main barrel, since Leaflet is browser-only.
 * Renders a placeholder on the server and during initialisation.
 */
export function GdsMap({
  markers, viewport, defaultViewport, fitBounds, minZoom = 3, maxZoom = 18, maxBounds,
  onViewportChange, onMarkerSelect, selectedMarkerId, interactive = true,
  // rem-based via --mantine-scale, not a fixed pixel count.
  preset, colorScheme, label, onStateChange, height = 'calc(26.25rem * var(--mantine-scale, 1))',
  tileSource = GDS_OSM_TILE_SOURCE, listPlacement = 'below', offline = false,
  renderMarkerPreview,
}: GdsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<unknown>(null);
  const [state, setState] = useState<GdsMapState>('initializing');
  const regionId = useId();
  const { t } = useGdsTranslation();

  // Ambient theme by default (props still override); needed because Leaflet bakes resolved
  // colours into engine-injected markup.
  const ambient = useGdsAmbientTheme();
  const activePreset = preset ?? ambient.preset;
  const activeScheme = colorScheme ?? ambient.colorScheme;

  // Counters live in a ref to avoid state thrash per tile; the failed flag is state because it renders.
  const [tilesFailed, setTilesFailed] = useState(false);
  const tileHealthRef = useRef({ loads: 0, errors: 0, autoRetries: 0 });
  const tileLayerRef = useRef<{ redraw: () => void } | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Leaflet owns the popup DOM lifecycle; React portals content into a per-marker host div.
  const popupHostsRef = useRef(new Map<string, HTMLElement>());
  const [openPopupMarkerId, setOpenPopupMarkerId] = useState<string | null>(null);
  // Below 480px width the preview docks full-width to the map instead of a pin-anchored
  // balloon, which clips on phone-sized containers.
  const [dockPreview, setDockPreview] = useState(false);

  const retryTiles = useCallback(() => {
    tileHealthRef.current.loads = 0;
    tileHealthRef.current.errors = 0;
    setTilesFailed(false);
    tileLayerRef.current?.redraw();
  }, []);
  useEffect(() => () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); }, []);

  // themeIdentity forces a full re-init; Leaflet reads resolved values at pane construction,
  // not via CSS variables.
  const themeIdentity = computeGdsThemeIdentity({ preset: activePreset, colorScheme: activeScheme });

  useEffect(() => {
    let disposed = false;
    let map: { remove: () => void } | null = null;
    popupHostsRef.current.clear();
    setOpenPopupMarkerId(null);

    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      try {
        // Dynamic import: Leaflet throws at import time under SSR (no window).
        const L = (await import('leaflet')).default ?? (await import('leaflet'));
        if (disposed || !containerRef.current) return;

        const initial = viewport ?? defaultViewport ?? DEFAULT_VIEWPORT;
        map = (L as typeof import('leaflet')).map(containerRef.current, {
          center: [initial.center.lat, initial.center.lng],
          zoom: initial.zoom,
          minZoom,
          maxZoom,
          // Leaflet's default chrome is suppressed, not restyled; GDS controls replace it.
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

        // Tile source validated before use; attribution is an ODbL licence condition.
        const source = assertGdsTileSource(tileSource);
        // Offline mode skips the tile layer entirely rather than requesting tiles that will
        // never arrive.
        if (!offline) {
          const tiles = (L as typeof import('leaflet')).tileLayer(source.url, {
            maxZoom: Math.min(maxZoom, source.maxZoom),
            // Leaflet's attribution control is disabled; credit renders as GDS UI below instead.
            attribution: '',
          }).addTo(map as never);
          tileLayerRef.current = tiles as unknown as { redraw: () => void };
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
              // Jittered so multiple clients don't retry a struggling host in lockstep.
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

        // Marker SVG built from GDS_PIN_SILHOUETTE_PATH (same path GdsBadgeShapePin renders)
        // with live var() colour refs, so a theme switch re-resolves them via the cascade.
        // Pin box is 2.5× the sm space step (30px at default density), anchored at the tail tip.
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
            // Glyph is aria-hidden; the marker's accessible name carries the meaning.
            html: `<svg aria-hidden="true" viewBox="0 0 24 24" style="display:block;width:calc(var(--gds-space-sm, 0.75rem) * 2.5);height:calc(var(--gds-space-sm, 0.75rem) * 2.5);filter:drop-shadow(var(--gds-elevation-1, 0 1px 2px rgba(0,0,0,0.2)));${scale}"><path d="${GDS_PIN_SILHOUETTE_PATH}" fill="${accentVar}" stroke="${strokeColour}" stroke-width="${stroke}"${dash} stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="11" r="3" fill="var(--gds-text-on-inverse, var(--mantine-color-white, #ffffff))"/></svg>`,
            iconSize: [30, 30],
            // Tail tip (12, 21.4 of 24) is the geographic point; anchoring at box centre would
            // offset ~9px north.
            iconAnchor: [15, 27],
            popupAnchor: [0, -28],
          });
          const placed = (L as typeof import('leaflet'))
            .marker([marker.position.lat, marker.position.lng], { icon, title: marker.label, alt: marker.label, keyboard: interactive })
            .addTo(layer);
          if (onMarkerSelect) placed.on('click', () => onMarkerSelect(marker.id));
          // When renderMarkerPreview is supplied, selection opens a Leaflet popup with a portalled host.
          if (renderMarkerPreview) {
            const host = document.createElement('div');
            host.setAttribute('data-gds-map-popup-host', marker.id);
            // Leaflet measures popup width before React portals content in, so the width is
            // set up front (18rem floor, 76vw cap for phone viewports).
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

        // Leaflet measures the container once at init and lays tiles out against that
        // measurement. invalidateSize() re-measures and re-lays.
        const engine = map as unknown as { invalidateSize: (opts?: { animate?: boolean }) => void };
        const revalidate = () => { try { engine.invalidateSize({ animate: false }); } catch { /* torn down */ } };
        revalidate();
        // Re-run a frame later too: a freshly-mounted flex/grid parent may still be zero-height.
        requestAnimationFrame(revalidate);

        // Popup reopened a frame after size revalidation; opening against pre-measure geometry
        // breaks Leaflet's autoPan on phone viewports.
        if (selectedMarkerId && renderMarkerPreview) {
          requestAnimationFrame(() => {
            if (disposed) return;
            const width = containerRef.current?.getBoundingClientRect().width ?? 0;
            // Docked containers never open the balloon; the docked overlay renders instead.
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
        // Reports error state rather than failing silently into an empty box.
        if (!disposed) {
          setState('error');
          onStateChange?.('error');
        }
      }
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      // Explicit destroy: without it Leaflet leaks document-level listeners and its tile cache.
      try { map?.remove(); } catch { /* already torn down */ }
      engineRef.current = null;
    };
    // themeIdentity dependency forces rebuild on theme switch.
    // markers included because Leaflet places them imperatively, not via re-render.
  // renderMarkerPreview intentionally excluded: inline closures change identity every render;
  // the portal reads the latest closure at render time regardless.
  }, [themeIdentity, interactive, minZoom, maxZoom, markers, selectedMarkerId, activeScheme, activePreset, offline]);

  // Sorted by label (not insertion order) so the list is predictably navigable.
  const orderedMarkers = useMemo(
    () => [...markers].sort((a, b) => a.label.localeCompare(b.label)),
    [markers],
  );

  // Throttled: unthrottled would spam the live region during continuous panning (moveend fires repeatedly).
  const [announcement, setAnnouncement] = useState('');
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announce = useCallback((message: string) => {
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(message), 600);
  }, []);
  useEffect(() => () => { if (announceTimer.current) clearTimeout(announceTimer.current); }, []);

  useEffect(() => {
    // "N places in view" rather than a coordinate readout.
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
                  // Visible border, not just background tint: under forced-colors mode a
                  // background alone would vanish.
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
      {/* Banner beside the map, not a replacement: markers/list stay functional without tiles. */}
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
      {/* State is announced via role=status, not just styled. */}
      <Text id={`${regionId}-state`} size="sm" c="dimmed" role="status" aria-live="polite">
        {state === 'ready'
          ? `${label}: ${markers.length} ${markers.length === 1 ? 'marker' : 'markers'}.`
          : state === 'error'
            ? `${label} could not be loaded.`
            : `${label} is loading.`}
      </Text>
      {/* ODbL attribution, required whenever a map renders; not configurable away. */}
      {listPlacement === 'below' ? list : null}
      {/* Single live region for both selection and count changes. */}
      <Text
        data-gds-map-announcer=""
        role="status"
        aria-live="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        {announcement}
      </Text>
      {/* Popup content portalled into Leaflet's popup DOM. */}
      {renderMarkerPreview && openPopupMarkerId && popupHostsRef.current.get(openPopupMarkerId)
        ? createPortal(renderMarkerPreview(openPopupMarkerId), popupHostsRef.current.get(openPopupMarkerId) as HTMLElement)
        : null}
      <Text size="xs" c="dimmed" data-gds-map-attribution="">
        <GdsInlineLink href={tileSource.attributionHref} external>{tileSource.attributionText}</GdsInlineLink>
      </Text>
    </Stack>
  );
}
