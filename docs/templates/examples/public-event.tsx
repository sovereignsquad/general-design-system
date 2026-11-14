import { BodyText, Button, GdsPublicEventTemplate } from '@sovereignsquad/gds-core';

export default function PublicEventExample() {
  return (
    <GdsPublicEventTemplate
      title="Spring meetup"
      state="ready"
      when="12 April, 18:00"
      location="Main hall"
      details={<BodyText>Talks and open discussion.</BodyText>}
      registration={<Button>Register</Button>}
    />
  );
}
