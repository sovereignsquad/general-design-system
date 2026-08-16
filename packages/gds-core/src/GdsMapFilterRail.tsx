import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Box, Group } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { PillBar } from './ChoiceChip';
import type { GdsSelectionOption } from './ChoiceChip';
import { GdsIcon } from './icons';

/**
 * Filter rail: horizontally scrolling pills above the map. "All" always renders first; counts
 * are part of the label and reflect the current map bounds; the selected pill fills with the
 * primary colour and a check; the rail reports its height so the map can inset its viewport.
 *
 * Composed on `PillBar`. Counts are consumer-supplied and dynamic — recomputing them per
 * map-bounds change is data logic this component does not own.
 */

/** One filter in the rail. `count` is optional — a rail before data arrives renders labels alone. */
export interface GdsMapFilterOption {
  id: string;
  label: ReactNode;
  /** Count within the current map bounds. Rendered as part of the label when present. */
  count?: number;
}

/** Props for {@link GdsMapFilterRail}. */
export interface GdsMapFilterRailProps {
  /** The filters after "All". May be empty — the rail then renders "All" alone. */
  options: GdsMapFilterOption[];
  /** Selected filter id, or `null` for "All". */
  value: string | null;
  /** Called with the selected filter id, or `null` when "All" is chosen. */
  onChange: (id: string | null) => void;
  /** Accessible name for the rail. */
  ariaLabel: string;
  /** Label for the always-first "All" option. Defaults through the message catalogue. */
  allLabel?: string;
  /** Reports rendered height in px (ResizeObserver), so the consumer insets the map viewport. Fires on mount and on height changes. */
  onHeightChange?: (heightPx: number) => void;
}

/** Internal sentinel for "All" in the radiogroup; consumers use `null`. */
const ALL_VALUE = '__gds-map-filter-all__';

const withCount = (label: ReactNode, count: number | undefined) =>
  count === undefined ? label : <>{label} · {count}</>;

/**
 * Horizontally scrolling filter pills for a map surface — see the module docs for the
 * contract and `docs/MAP_SYSTEM.md` §9 for where it sits in the map system.
 *
 * @example
 * ```tsx
 * <GdsMapFilterRail
 *   ariaLabel="Filter places by activity"
 *   options={[{ id: 'soccer', label: 'Soccer', count: 12 }, { id: 'swim', label: 'Swimming', count: 4 }]}
 *   value={filter}
 *   onChange={setFilter}
 *   onHeightChange={(px) => setMapInset(px)}
 * />
 * ```
 */
export function GdsMapFilterRail({
  options,
  value,
  onChange,
  ariaLabel,
  allLabel: allLabelProp,
  onHeightChange,
}: GdsMapFilterRailProps) {
  const { t } = useGdsTranslation();
  const allLabel = allLabelProp ?? t('gds.gdsMapFilterRail.allLabel', 'All');
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onHeightChange || !hostRef.current) return undefined;
    const host = hostRef.current;
    onHeightChange(host.getBoundingClientRect().height);
    const observer = new ResizeObserver(() => onHeightChange(host.getBoundingClientRect().height));
    observer.observe(host);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const selectedValue = value ?? ALL_VALUE;
  // Counts sum only when every option carries one — a partial sum on "All" would be a number
  // that looks total and is not.
  const total = options.length > 0 && options.every((o) => o.count !== undefined)
    ? options.reduce((sum, o) => sum + (o.count ?? 0), 0)
    : undefined;

  const check = <GdsIcon icon="Success" size="xs" tone="default" />;
  const decorated = (id: string, label: ReactNode): ReactNode =>
    selectedValue === id ? <Group gap={4} wrap="nowrap" component="span">{check}{label}</Group> : label;

  const railOptions: GdsSelectionOption<string>[] = [
    // "All" always renders first, even with zero options.
    { value: ALL_VALUE, label: decorated(ALL_VALUE, withCount(allLabel, total)) },
    ...options.map((option) => ({
      value: option.id,
      label: decorated(option.id, withCount(option.label, option.count)),
    })),
  ];

  return (
    <Box ref={hostRef} data-gds-map-filter-rail>
      <PillBar
        ariaLabel={ariaLabel}
        options={railOptions}
        value={selectedValue}
        onChange={(next) => onChange(next === ALL_VALUE ? null : next)}
      />
    </Box>
  );
}
