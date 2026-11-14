import { GdsErrorPageTemplate } from '@sovereignsquad/gds-core';

export default function ErrorPageExample() {
  return (
    <GdsErrorPageTemplate
      state="not-found"
      code={404}
      title="Page not found"
      description="The page may have moved."
      actions={[{ id: 'home', label: 'Go to home', kind: 'primary', onClick: () => undefined }]}
    />
  );
}
