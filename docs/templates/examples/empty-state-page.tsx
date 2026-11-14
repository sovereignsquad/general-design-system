import { GdsEmptyStateTemplate } from '@sovereignsquad/gds-core';

export default function EmptyStatePageExample() {
  return (
    <GdsEmptyStateTemplate
      title="No projects yet"
      description="Create a project to start tracking work."
      actions={[{ id: 'create', label: 'Create project', kind: 'primary', onClick: () => undefined }]}
    />
  );
}
