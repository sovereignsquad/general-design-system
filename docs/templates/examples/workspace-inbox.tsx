import { GdsThreadList, GdsWorkspaceInboxTemplate } from '@sovereignsquad/gds-core';

export default function WorkspaceInboxExample() {
  return (
    <GdsWorkspaceInboxTemplate
      title="Inbox"
      state="ready"
      threadList={<GdsThreadList ariaLabel="Conversations" threads={[{ id: 't1', title: 'Venue booking', preview: 'Is Friday still free?' }]} stateTitleOrder={2} />}
      hasSelection={false}
    />
  );
}
