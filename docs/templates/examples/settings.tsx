import { GdsSettingsTemplate, TextInput } from '@sovereignsquad/gds-core';

export default function SettingsExample() {
  return (
    <GdsSettingsTemplate
      title="Settings"
      state="ready"
      actions={[{ id: 'save', label: 'Save changes', kind: 'primary', onClick: () => undefined }]}
      groups={[
        { id: 'profile', title: 'Profile', description: 'Shown to other members.', fields: <TextInput label="Display name" defaultValue="Ada" /> },
      ]}
    />
  );
}
