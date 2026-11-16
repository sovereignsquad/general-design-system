// Parses CHANGELOG.md into GdsRelease data for the reference site's release notes page, one
// module per major version so each loads on its own.
//
// Strict: a construct the parser does not model (a level-4 heading, a blockquote, raw HTML)
// fails the run instead of being dropped.
//
// Run: node scripts/generate-release-notes.mjs [--check]
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'apps/playground/src/generated-release-notes');
const REPO_BLOB = 'https://github.com/sovereignsquad/general-design-system/blob/main/';
const check = process.argv.includes('--check');

export function parseInline(text) {
  const out = [];
  let rest = text;
  const pushText = (value) => {
    if (!value) return;
    const last = out[out.length - 1];
    if (last && last.kind === 'text') last.text += value;
    else out.push({ kind: 'text', text: value });
  };
  while (rest.length > 0) {
    const code = rest.indexOf('`');
    const strong = rest.indexOf('**');
    const link = rest.search(/\[[^\]]+\]\([^)\s]+\)/);
    const candidates = [code, strong, link].filter((index) => index >= 0);
    if (candidates.length === 0) { pushText(rest); break; }
    const next = Math.min(...candidates);
    pushText(rest.slice(0, next));
    rest = rest.slice(next);
    if (next === code) {
      const end = rest.indexOf('`', 1);
      if (end < 0) { pushText(rest); break; }
      out.push({ kind: 'code', text: rest.slice(1, end) });
      rest = rest.slice(end + 1);
    } else if (next === strong) {
      const end = rest.indexOf('**', 2);
      if (end < 0) { pushText(rest); break; }
      out.push({ kind: 'strong', children: parseInline(rest.slice(2, end)) });
      rest = rest.slice(end + 2);
    } else {
      const match = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
      const href = match[2];
      const resolved = /^(https?:|mailto:|#)/.test(href) ? href : `${REPO_BLOB}${href.replace(/^\.\//, '')}`;
      out.push({ kind: 'link', href: resolved, children: parseInline(match[1]) });
      rest = rest.slice(match[0].length);
    }
  }
  return out;
}

const LIST_MARKER = /^(\s*)(?:[-*]|(\d+)\.)\s+(.*)$/;

function parseList(lines, start, indent) {
  const items = [];
  const first = LIST_MARKER.exec(lines[start]);
  const ordered = Boolean(first[2]);
  let i = start;
  while (i < lines.length) {
    const marker = LIST_MARKER.exec(lines[i]);
    if (!marker || marker[1].length !== indent) break;
    const item = { content: [], text: marker[3] };
    i += 1;
    const children = [];
    while (i < lines.length && lines[i].trim() !== '') {
      const nested = LIST_MARKER.exec(lines[i]);
      if (nested && nested[1].length > indent) {
        const sub = parseList(lines, i, nested[1].length);
        children.push(sub.block);
        i = sub.next;
        continue;
      }
      if (nested) break;
      item.text += ` ${lines[i].trim()}`;
      i += 1;
    }
    item.content = parseInline(item.text);
    delete item.text;
    if (children.length) item.children = children;
    items.push(item);
    if (i < lines.length && lines[i].trim() === '' && LIST_MARKER.exec(lines[i + 1] ?? '')?.[1].length === indent) i += 1;
  }
  return { block: { kind: 'list', ordered, items }, next: i };
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => parseInline(cell.trim()));
}

export function parseBlocks(lines, where) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i += 1; continue; }
    if (/^#{4,}\s/.test(line) || /^>\s?/.test(line) || /^\s*<[a-zA-Z]/.test(line)) {
      throw new Error(`${where}: unsupported construct "${line.slice(0, 60)}"`);
    }
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const end = lines.indexOf('```', i + 1);
      if (end < 0) throw new Error(`${where}: unclosed code fence`);
      blocks.push({ kind: 'code', code: lines.slice(i + 1, end).join('\n'), ...(fence[1] ? { language: fence[1] } : {}) });
      i = end + 1;
      continue;
    }
    if (line.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i += 1; }
      const body = rows.filter((row) => !/^\|\s*:?-{3,}/.test(row.trim()));
      blocks.push({ kind: 'table', header: splitRow(body[0]), rows: body.slice(1).map(splitRow) });
      continue;
    }
    const marker = LIST_MARKER.exec(line);
    if (marker) {
      const { block, next } = parseList(lines, i, marker[1].length);
      blocks.push(block);
      i = next;
      continue;
    }
    const paragraph = [];
    while (i < lines.length && lines[i].trim() !== '' && !LIST_MARKER.test(lines[i]) && !lines[i].trim().startsWith('|') && !lines[i].startsWith('```')) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: 'paragraph', content: parseInline(paragraph.join(' ')) });
  }
  return blocks;
}

export function parseChangelog(source) {
  const releases = [];
  let current = null;
  let section = null;
  let buffer = [];
  const flush = () => {
    if (!current) return;
    const blocks = parseBlocks(buffer, `${current.version}${section ? ` / ${section.raw}` : ''}`);
    if (section) current.sections.push({ heading: parseInline(section.raw), blocks });
    else if (blocks.length) current.intro = blocks;
    buffer = [];
  };
  for (const line of source.split('\n')) {
    const release = /^## (.+)$/.exec(line);
    const heading = /^### (.+)$/.exec(line);
    if (release) {
      flush();
      section = null;
      const match = /^(\S+)(?: - (\d{4}-\d{2}-\d{2}))?(?: — (.+)| \(([^)]+)\))?$/.exec(release[1].trim());
      if (!match) throw new Error(`Unrecognised release heading "${release[1]}"`);
      const title = match[3] ?? match[4];
      current = { version: match[1], ...(match[2] ? { date: match[2] } : {}), ...(title ? { title } : {}), sections: [] };
      releases.push(current);
    } else if (heading) {
      flush();
      section = { raw: heading[1] };
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();
  return releases;
}

function majorOf(release) {
  return /^\d+/.exec(release.version)?.[0] ?? 'unreleased';
}

function render(releases) {
  const groups = new Map();
  for (const release of releases) {
    const major = release.version === 'Unreleased' ? 'unreleased' : majorOf(release);
    if (!groups.has(major)) groups.set(major, []);
    groups.get(major).push(release);
  }
  const files = new Map();
  const header = '// Generated from CHANGELOG.md by scripts/generate-release-notes.mjs. Do not edit by hand.\n';
  for (const [major, list] of groups) {
    files.set(`v${major}.ts`, `${header}import type { GdsRelease } from '@sovereignsquad/gds-core';\n\nconst releases: GdsRelease[] = ${JSON.stringify(list)};\n\nexport default releases;\n`);
  }
  const index = [...groups.keys()];
  files.set('index.ts', `${header}import type { GdsRelease } from '@sovereignsquad/gds-core';\n\n/** Release groups in changelog order: id, release count, and a loader for its releases. */\nexport const releaseGroups: Array<{ id: string; count: number; load: () => Promise<GdsRelease[]> }> = [\n${index.map((major) => `  { id: ${JSON.stringify(major)}, count: ${groups.get(major).length}, load: () => import('./v${major}').then((module) => module.default) },`).join('\n')}\n];\n`);
  return files;
}

const releases = parseChangelog(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'));
if (releases.length === 0) {
  console.error('FAIL no releases parsed from CHANGELOG.md.');
  process.exit(1);
}
const files = render(releases);

if (check) {
  const stale = [];
  for (const [name, content] of files) {
    const path = join(OUT_DIR, name);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) stale.push(name);
  }
  const extra = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter((name) => !files.has(name)) : [];
  if (stale.length || extra.length) {
    console.error(`FAIL apps/playground/src/generated-release-notes is stale (${[...stale, ...extra].join(', ')}). Run node scripts/generate-release-notes.mjs and commit the result.`);
    process.exit(1);
  }
  console.log(`Release notes are current: ${releases.length} releases in ${files.size - 1} groups.`);
} else {
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, content] of files) writeFileSync(join(OUT_DIR, name), content);
  console.log(`Wrote ${releases.length} releases in ${files.size - 1} groups to apps/playground/src/generated-release-notes.`);
}
