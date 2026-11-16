'use client';

import { Fragment, type ReactNode } from 'react';
import { Table } from '@mantine/core';
import { DocsCodeBlock } from './DocsCodeBlock';
import { GdsInlineLink } from './GdsInlineLink';
import { GdsBox, GdsStack } from './LayoutPrimitives';
import { SectionPanel } from './SectionPanel';
import { BodyText, CardTitle, InlineEmphasis, InlineText, MetadataText } from './Typography';

/** A run of inline release-note text. */
export type GdsReleaseNoteInline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: GdsReleaseNoteInline[] }
  | { kind: 'link'; href: string; children: GdsReleaseNoteInline[] };

/** One list item: its own text and any nested blocks. */
export interface GdsReleaseNoteListItem {
  content: GdsReleaseNoteInline[];
  children?: GdsReleaseNoteBlock[];
}

/** A block of release-note content. */
export type GdsReleaseNoteBlock =
  | { kind: 'paragraph'; content: GdsReleaseNoteInline[] }
  | { kind: 'list'; ordered: boolean; items: GdsReleaseNoteListItem[] }
  | { kind: 'code'; code: string; language?: string }
  | { kind: 'table'; header: GdsReleaseNoteInline[][]; rows: GdsReleaseNoteInline[][][] };

/** A headed section within a release. */
export interface GdsReleaseNoteSection {
  heading: GdsReleaseNoteInline[];
  blocks: GdsReleaseNoteBlock[];
}

/** One release: its version, optional date and title, any text before the first section, and its sections. */
export interface GdsRelease {
  version: string;
  date?: string;
  title?: string;
  intro?: GdsReleaseNoteBlock[];
  sections: GdsReleaseNoteSection[];
}

/** Props for {@link GdsReleaseNotes}. */
export interface GdsReleaseNotesProps {
  /** Releases in display order, newest first. */
  releases: GdsRelease[];
  /** Link target for an issue reference such as `#123` in the text. Without it, references stay plain text. */
  issueHref?: (issue: number) => string;
  /** Heading level of each release title, so the list fits the page outline. Defaults to `2`. */
  headingLevel?: 2 | 3;
}

const ISSUE_REFERENCE = /#(\d+)/g;

function renderText(text: string, issueHref: GdsReleaseNotesProps['issueHref'], key: string): ReactNode {
  if (!issueHref) return text;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(ISSUE_REFERENCE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(<GdsInlineLink key={`${key}-${index}`} href={issueHref(Number(match[1]))}>{match[0]}</GdsInlineLink>);
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : parts;
}

function renderInline(content: GdsReleaseNoteInline[], issueHref: GdsReleaseNotesProps['issueHref'], key: string): ReactNode {
  return content.map((part, index) => {
    const partKey = `${key}-${index}`;
    switch (part.kind) {
      case 'text': return <Fragment key={partKey}>{renderText(part.text, issueHref, partKey)}</Fragment>;
      case 'code': return <InlineText key={partKey} component="code">{part.text}</InlineText>;
      case 'strong': return <InlineEmphasis key={partKey}>{renderInline(part.children, issueHref, partKey)}</InlineEmphasis>;
      case 'link': return <GdsInlineLink key={partKey} href={part.href} external={/^https?:/.test(part.href)}>{renderInline(part.children, issueHref, partKey)}</GdsInlineLink>;
    }
  });
}

function renderBlocks(blocks: GdsReleaseNoteBlock[], issueHref: GdsReleaseNotesProps['issueHref'], key: string): ReactNode {
  return blocks.map((block, index) => {
    const blockKey = `${key}-${index}`;
    switch (block.kind) {
      case 'paragraph':
        return <BodyText key={blockKey}>{renderInline(block.content, issueHref, blockKey)}</BodyText>;
      case 'list':
        return (
          <GdsStack key={blockKey} role="list" gap="xs" data-gds-release-list={block.ordered ? 'ordered' : 'unordered'}>
            {block.items.map((item, itemIndex) => (
              <GdsStack key={`${blockKey}-${itemIndex}`} role="listitem" gap="xs">
                <BodyText>
                  <span aria-hidden="true" data-gds-release-marker="">{block.ordered ? `${itemIndex + 1}. ` : '• '}</span>
                  {renderInline(item.content, issueHref, `${blockKey}-${itemIndex}`)}
                </BodyText>
                {item.children?.length ? (
                  <GdsBox padding={{ base: 'md' }} data-gds-release-nested="">
                    {renderBlocks(item.children, issueHref, `${blockKey}-${itemIndex}-c`)}
                  </GdsBox>
                ) : null}
              </GdsStack>
            ))}
          </GdsStack>
        );
      case 'code':
        return <DocsCodeBlock key={blockKey} code={block.code} language={block.language} withCopy={false} />;
      case 'table':
        return (
          <Table.ScrollContainer key={blockKey} minWidth={0} type="native">
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>{block.header.map((cell, c) => <Table.Th key={c}>{renderInline(cell, issueHref, `${blockKey}-h${c}`)}</Table.Th>)}</Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {block.rows.map((row, r) => (
                  <Table.Tr key={r}>{row.map((cell, c) => <Table.Td key={c}>{renderInline(cell, issueHref, `${blockKey}-${r}-${c}`)}</Table.Td>)}</Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        );
    }
  });
}

// Anchor from the version; a version listed more than once (a release shipped in parts) gets
// its position among those entries as a suffix.
function releaseAnchor(releases: GdsRelease[], index: number): string {
  const base = `release-${releases[index].version.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const earlier = releases.slice(0, index).filter((release) => release.version === releases[index].version).length;
  return earlier === 0 ? base : `${base}-${earlier + 1}`;
}

/**
 * Release notes as a list of releases, newest first. Each release is a panel headed by its
 * version and title, with its date as metadata and each section as a sub-heading. Issue
 * references such as `#123` link through `issueHref`. The content model is plain data, so a
 * changelog can be parsed at build time and rendered without a Markdown runtime.
 */
export function GdsReleaseNotes({ releases, issueHref, headingLevel = 2 }: GdsReleaseNotesProps) {
  const sectionLevel = (headingLevel + 1) as 3 | 4;
  return (
    <GdsStack gap="lg" data-gds-release-notes="">
      {releases.map((release, index) => (
        <SectionPanel
          key={`${release.version}-${index}`}
          id={releaseAnchor(releases, index)}
          titleOrder={headingLevel}
          title={release.title ? `${release.version} — ${release.title}` : release.version}
          description={release.date ? <MetadataText>{release.date}</MetadataText> : undefined}
        >
          <GdsStack gap="md">
            {release.intro?.length ? renderBlocks(release.intro, issueHref, `${release.version}-intro`) : null}
            {release.sections.map((section, index) => (
              <GdsStack key={`${release.version}-${index}`} gap="sm" component="section">
                <CardTitle order={sectionLevel}>{renderInline(section.heading, issueHref, `${release.version}-${index}-h`)}</CardTitle>
                {renderBlocks(section.blocks, issueHref, `${release.version}-${index}`)}
              </GdsStack>
            ))}
          </GdsStack>
        </SectionPanel>
      ))}
    </GdsStack>
  );
}
