import { GdsAnalyticsTemplate } from '@sovereignsquad/gds-core';

const rows = [
  { month: 'January', visits: 1200 },
  { month: 'February', visits: 1350 },
];

export default function AnalyticsExample() {
  return (
    <GdsAnalyticsTemplate
      title="Traffic"
      state="ready"
      metrics={[{ label: 'Visits', value: 2550 }]}
      rows={rows}
      columns={[
        { key: 'month', header: 'Month' },
        { key: 'visits', header: 'Visits' },
      ]}
    />
  );
}
