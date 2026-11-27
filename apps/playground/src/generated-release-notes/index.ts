// Generated from CHANGELOG.md by scripts/generate-release-notes.mjs. Do not edit by hand.
import type { GdsRelease } from '@sovereignsquad/gds-core';

async function load(file: string): Promise<GdsRelease[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}release-notes/${file}`);
  if (!response.ok) throw new Error(`release-notes/${file}: HTTP ${response.status}`);
  return response.json() as Promise<GdsRelease[]>;
}

/** Release groups in changelog order: id, release count, and a loader for its releases. */
export const releaseGroups: Array<{ id: string; count: number; load: () => Promise<GdsRelease[]> }> = [
  { id: "unreleased", count: 1, load: () => load('vunreleased.json') },
  { id: "6", count: 12, load: () => load('v6.json') },
  { id: "5", count: 3, load: () => load('v5.json') },
  { id: "4", count: 17, load: () => load('v4.json') },
  { id: "3", count: 49, load: () => load('v3.json') },
  { id: "2", count: 22, load: () => load('v2.json') },
  { id: "1", count: 10, load: () => load('v1.json') },
];
