import { GdsAdminDashboardTemplate } from '@sovereignsquad/gds-core';

export default function AdminDashboardExample() {
  return (
    <GdsAdminDashboardTemplate
      title="Operations"
      description="Open work across the team."
      state="ready"
      metrics={[
        { label: 'Open requests', value: 42 },
        { label: 'Median response', value: '3 h' },
      ]}
      sections={[{ id: 'queue', title: 'Review queue', content: 'Requests awaiting review appear here.' }]}
      onRetry={() => undefined}
    />
  );
}
