import { BodyText, GdsAssetManagerTemplate, GdsTreeView } from '@sovereignsquad/gds-core';

export default function AssetManagerExample() {
  return (
    <GdsAssetManagerTemplate
      title="Files"
      state="ready"
      tree={<GdsTreeView ariaLabel="Folders" nodes={[{ id: 'brand', label: 'Brand' }, { id: 'press', label: 'Press' }]} />}
      bulkActions={{ selectedCount: 0, actions: [], onClearSelection: () => undefined }}
      table={<BodyText>Items as a table.</BodyText>}
      grid={<BodyText>Items as a grid.</BodyText>}
    />
  );
}
