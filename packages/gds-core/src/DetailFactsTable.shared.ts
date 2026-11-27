

/** Ordered ids of the default nine-fact detail schema (issue 711). */
export const GDS_DETAIL_FACT_IDS = [
  'audience',
  'category',
  'format',
  'location',
  'setting',
  'price',
  'booking',
  'source',
  'lastChecked',
] as const;

/**
 * Fixed width, in pixels, of {@link DetailFactsTable}'s label column. Exported so
 * documentation surfaces can read the real value instead of restating it.
 */
export const GDS_DETAIL_FACTS_LABEL_COLUMN_PX = 130;
