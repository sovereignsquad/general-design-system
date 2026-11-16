// Generated from CHANGELOG.md by scripts/generate-release-notes.mjs. Do not edit by hand.
import type { GdsRelease } from '@sovereignsquad/gds-core';

/** Release groups in changelog order: id, release count, and a loader for its releases. */
export const releaseGroups: Array<{ id: string; count: number; load: () => Promise<GdsRelease[]> }> = [
  { id: "unreleased", count: 1, load: () => import('./vunreleased').then((module) => module.default) },
  { id: "6", count: 10, load: () => import('./v6').then((module) => module.default) },
  { id: "5", count: 3, load: () => import('./v5').then((module) => module.default) },
  { id: "4", count: 17, load: () => import('./v4').then((module) => module.default) },
  { id: "3", count: 49, load: () => import('./v3').then((module) => module.default) },
  { id: "2", count: 22, load: () => import('./v2').then((module) => module.default) },
  { id: "1", count: 10, load: () => import('./v1').then((module) => module.default) },
];
