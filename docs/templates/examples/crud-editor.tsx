import { Button, GdsCrudEditorTemplate, TextInput } from '@sovereignsquad/gds-core';

export default function CrudEditorExample() {
  return (
    <GdsCrudEditorTemplate
      title="Edit room"
      state="ready"
      summary="Main hall, capacity 120."
      form={<TextInput label="Room name" defaultValue="Main hall" />}
      destructiveZone={<Button color="red" variant="light">Delete room</Button>}
      actions={[{ id: 'save', label: 'Save', kind: 'primary', onClick: () => undefined }]}
    />
  );
}
