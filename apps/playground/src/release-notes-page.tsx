import { useEffect, useState } from 'react';
import { Button, DocsPageShell, GdsReleaseNotes, GdsStack, MetadataText, StateBlock, type GdsRelease } from '@sovereignsquad/gds-core';
import { releaseGroups } from './generated-release-notes';

const ISSUES_URL = 'https://github.com/sovereignsquad/general-design-system/issues/';

function groupLabel(id: string) {
  return id === 'unreleased' ? 'Unreleased' : `${id}.x`;
}

export function ReleaseNotesPage() {
  // The unreleased changes and the current major load first; older majors load on request.
  const [loaded, setLoaded] = useState<Record<string, GdsRelease[]>>({});
  const [requested, setRequested] = useState<string[]>(releaseGroups.slice(0, 2).map((group) => group.id));
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    for (const id of requested) {
      if (loaded[id]) continue;
      const group = releaseGroups.find((entry) => entry.id === id);
      group?.load()
        .then((releases) => setLoaded((current) => ({ ...current, [id]: releases })))
        .catch(() => setFailed(id));
    }
  }, [requested, loaded]);

  const next = releaseGroups.find((group) => !requested.includes(group.id));
  const releases = requested.flatMap((id) => loaded[id] ?? []);
  const pending = requested.some((id) => !loaded[id]);

  return (
    <DocsPageShell
      eyebrow="Changelog"
      title="Release notes"
      lead="What each GDS release changed, built from CHANGELOG.md at build time. Issue numbers link to the issue that tracked the change."
    >
      <GdsStack gap="lg">
        <MetadataText>
          {`${releaseGroups.reduce((sum, group) => sum + group.count, 0)} entries across ${releaseGroups.length} groups: ${releaseGroups.map((group) => `${groupLabel(group.id)} (${group.count})`).join(', ')}.`}
        </MetadataText>
        <GdsReleaseNotes releases={releases} issueHref={(issue) => `${ISSUES_URL}${issue}`} />
        {failed ? (
          <StateBlock variant="error" title="Release notes did not load" description={`The ${groupLabel(failed)} releases could not be loaded. Reload the page to try again.`} />
        ) : null}
        {pending ? <MetadataText>Loading release notes…</MetadataText> : null}
        {next && !pending ? (
          <Button variant="default" onClick={() => setRequested((current) => [...current, next.id])}>
            {`Show ${groupLabel(next.id)} releases (${next.count})`}
          </Button>
        ) : null}
      </GdsStack>
    </DocsPageShell>
  );
}
