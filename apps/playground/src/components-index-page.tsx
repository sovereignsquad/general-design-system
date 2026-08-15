import { useMemo, useState } from 'react';
import { AdminTextInput } from '@sovereignsquad/gds-admin';
import {
  BodyText,
  DocsPageShell,
  GdsInlineLink,
  InlineText,
  MetadataText,
  ReferenceLinkGrid,
  ReferenceSection,
  SimpleDataTable,
} from '@sovereignsquad/gds-core';
import { gdsComponentIndex } from './generated-component-index';
import type { GdsComponentIndexRow } from './generated-component-index';

/**
 * Issue 626 Phase 2 — the complete element list, on one page, composed exclusively from GDS
 * exports (the strict compliance gate refused this page's first draft for a raw Mantine table
 * and imports — correctly; the reference site takes no styling authority of its own).
 *
 * Every public component the packages export appears here, DERIVED from the census the parity
 * gate reads (Rule 14): a registered component names its canonical home (the grid below links
 * every home); an exempt one states its reviewed reason in full view. Nothing shipped is
 * invisible — including the decision that a helper does not get a page of its own.
 */
export function ComponentsIndexPage() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return gdsComponentIndex;
    return gdsComponentIndex.filter((row) =>
      row.name.toLowerCase().includes(needle)
      || row.home?.section.toLowerCase().includes(needle)
      || row.reason?.toLowerCase().includes(needle));
  }, [query]);

  const registered = gdsComponentIndex.filter((row) => row.status === 'registered').length;
  const exempt = gdsComponentIndex.length - registered;

  const homes = useMemo(() => {
    const seen = new Map<string, { family: string; section: string; count: number }>();
    for (const row of gdsComponentIndex) {
      if (!row.home) continue;
      const key = `${row.home.family}|${row.home.section}`;
      const current = seen.get(key);
      if (current) current.count += 1;
      else seen.set(key, { family: row.home.family, section: row.home.section, count: 1 });
    }
    return [...seen.values()].sort((a, b) => b.count - a.count);
  }, []);

  return (
    <DocsPageShell
      title="Components — the complete element list"
      lead={`Every public component the packages export, derived from the same census the release gates read — ${gdsComponentIndex.length} components: ${registered} with a canonical catalog home, ${exempt} reviewed helpers that compose into them. A hand-maintained list hides its first omission; this one cannot omit.`}
    >
      <ReferenceSection title="Browse by home" description="Every canonical home a component links to, largest first.">
        <ReferenceLinkGrid
          columns={3}
          items={homes.map((home) => ({
            id: `${home.family}-${home.section}`,
            title: home.section,
            description: `${home.count} component${home.count === 1 ? '' : 's'} live here.`,
            href: `/patterns/${home.family}`,
            meta: home.family,
          }))}
        />
      </ReferenceSection>
      <ReferenceSection title="All components, A to Z" description="Derived at build time; drift fails the release chain.">
        <AdminTextInput
          name="component-filter"
          label="Filter"
          placeholder="e.g. Badge, Motion, avatar…"
          value={query}
          onChange={setQuery}
        />
        <BodyText>
          Showing {rows.length} of {gdsComponentIndex.length}. Registered components name their
          canonical home (linked in the grid above); exempt ones state the reviewed reason they
          have no page of their own.
        </BodyText>
        <SimpleDataTable<GdsComponentIndexRow & Record<string, unknown>>
          columns={[
            { key: 'name', header: 'Component', render: (row) => <InlineText>{row.name}</InlineText> },
            {
              key: 'home',
              header: 'Home',
              render: (row) => (row.home
                ? (
                  <GdsInlineLink href={`/general-design-system/patterns/${row.home.family}#entry-${row.home.id}`}>
                    {`${row.home.section} (${row.home.family})`}
                  </GdsInlineLink>
                )
                : <MetadataText>composition helper</MetadataText>),
            },
            {
              key: 'notes',
              header: 'Notes',
              render: (row) => (
                <MetadataText>
                  {row.reason
                    ?? (row.alsoAppearsIn && row.alsoAppearsIn.length > 0
                      ? `Also exercised by: ${row.alsoAppearsIn.join(', ')}`
                      : '')}
                </MetadataText>
              ),
            },
          ]}
          rows={rows as (GdsComponentIndexRow & Record<string, unknown>)[]}
          getRowKey={(row) => row.name}
        />
      </ReferenceSection>
    </DocsPageShell>
  );
}
