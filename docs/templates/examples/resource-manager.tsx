import { GdsResourceManagerTemplate } from '@sovereignsquad/gds-core';

const rows = [
  { id: 'r1', name: 'Main hall', status: 'Available' },
  { id: 'r2', name: 'Studio B', status: 'Booked' },
];

export default function ResourceManagerExample() {
  return (
    <GdsResourceManagerTemplate
      title="Rooms"
      state="ready"
      rows={rows}
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
      ]}
      getRowKey={(row) => row.id}
      detail="Select a room to see its details."
    />
  );
}
