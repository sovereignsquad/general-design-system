import type { CSSProperties, ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** Ordered ids of the default nine-fact detail schema (issue 711). */
export const GDS_DETAIL_FACT_IDS = [
  'ageRange',
  'activityType',
  'format',
  'location',
  'setting',
  'price',
  'booking',
  'source',
  'lastChecked',
] as const;

/** A built-in id from the default nine-fact schema — one of {@link GDS_DETAIL_FACT_IDS}. */
export type GdsDetailFactId = (typeof GDS_DETAIL_FACT_IDS)[number];

/** One rendered fact row. */
export interface DetailFact {
  /** Stable identity for the row; used to derive the React key. Not required to be unique in a custom `facts` schema. */
  id: string;
  /** Row label; the default schema resolves labels from the locale packs. */
  label: ReactNode;
  /**
   * Row value. `undefined`, `null`, or an empty/whitespace-only string renders the
   * explicit localized unknown phrase — the row itself is never dropped.
   */
  value?: ReactNode;
}

/**
 * Fixed width, in pixels, of {@link DetailFactsTable}'s label column. Exported so
 * documentation surfaces can read the real value instead of restating it (Rule 14).
 */
export const GDS_DETAIL_FACTS_LABEL_COLUMN_PX = 130;

/** Props for {@link DetailFactsTable}. */
export interface DetailFactsTableProps {
  /**
   * Values for the default nine-fact schema, keyed by fact id. Every schema row
   * renders whether or not a value is present for its id.
   */
  values?: Partial<Record<GdsDetailFactId, ReactNode>>;
  /**
   * Full custom schema replacing the default one. When supplied, the consumer owns
   * schema completeness; rows with a missing value still render the unknown phrase,
   * but the source/last-checked guarantee only applies to the default nine-fact
   * schema. An empty array renders the bordered card with no rows — almost never
   * what a consumer wants; omit both `facts` and `values` for the governed default
   * schema unless a genuinely different fact set is required.
   */
  facts?: DetailFact[];
}

const GDS_DETAIL_FACT_DEFAULT_LABELS: Record<GdsDetailFactId, string> = {
  ageRange: 'Age range',
  activityType: 'Activity type',
  format: 'Format',
  location: 'Location',
  setting: 'Indoor/outdoor',
  price: 'Price',
  booking: 'Booking',
  source: 'Source',
  lastChecked: 'Last checked',
};

function isBlankDetailFactValue(value: ReactNode): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

interface ResolvedDetailFactRow {
  key: string;
  label: ReactNode;
  displayValue: ReactNode;
  /** `false` when the row's value was blank and the localized unknown phrase is being shown instead. */
  known: boolean;
}

function resolveDetailFactRows(
  { values, facts }: DetailFactsTableProps,
  t: (id: string, defaultMessage: string) => string,
): ResolvedDetailFactRow[] {
  const schema: DetailFact[] =
    facts ??
    GDS_DETAIL_FACT_IDS.map((id) => ({
      id,
      label: t(`gds.detailFacts.${id}`, GDS_DETAIL_FACT_DEFAULT_LABELS[id]),
      value: values?.[id],
    }));

  const unknownPhrase = t('gds.detailFacts.unknown', 'Not confirmed — ask the provider');

  // Rows are never filtered and always render in schema order; only the displayed
  // value changes when a value is blank.
  return schema.map((row, index) => {
    const known = !isBlankDetailFactValue(row.value);
    return {
      key: `${row.id}-${index}`,
      label: row.label,
      displayValue: known ? row.value : unknownPhrase,
      known,
    };
  });
}

const containerStyle: CSSProperties = {
  background: 'var(--gds-bg-card, var(--gds-vibe-surface, var(--mantine-color-body)))',
  border: '1px solid var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-default-border)))',
  borderRadius: 'var(--gds-radius-card)',
  boxShadow: 'var(--gds-elevation-card)',
  overflow: 'hidden',
  margin: 0,
};

/**
 * Governed detail-page key-facts block: a fixed nine-row label/value schema (age
 * range, activity type, format, location, indoor/outdoor, price, booking, source,
 * last checked) rendered with real `<dl>`/`<dt>`/`<dd>` semantics. Every schema row
 * always renders — a missing or blank value shows the localized unknown phrase
 * rather than an empty cell or a dropped row, so a reader can always see a
 * listing's source and freshness. Pass `values` to fill the default schema, or
 * `facts` to replace the schema entirely. Server-safe: no client-only behavior.
 */
export function DetailFactsTable({ values, facts }: DetailFactsTableProps) {
  const { t } = useGdsTranslation();
  const rows = resolveDetailFactRows({ values, facts }, t);

  return (
    <dl style={containerStyle}>
      {rows.map((row, index) => (
        <div
          key={row.key}
          style={{
            display: 'flex',
            gap: 'var(--mantine-spacing-sm)',
            padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
            borderTop: index > 0 ? '1px solid var(--gds-border-card, var(--mantine-color-gray-3))' : undefined,
          }}
        >
          <dt
            style={{
              flex: `0 0 ${GDS_DETAIL_FACTS_LABEL_COLUMN_PX}px`,
              margin: 0,
              color: 'var(--gds-text-secondary, var(--mantine-color-gray-6))',
            }}
          >
            {row.label}
          </dt>
          <dd
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              margin: 0,
              overflowWrap: 'anywhere',
              color: row.known
                ? 'var(--gds-text-primary, var(--mantine-color-dark-7))'
                : 'var(--gds-text-secondary, var(--mantine-color-gray-6))',
              fontWeight: row.known ? 500 : undefined,
            }}
          >
            {row.displayValue}
          </dd>
        </div>
      ))}
    </dl>
  );
}
