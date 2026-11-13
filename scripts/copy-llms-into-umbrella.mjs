// Runs as the `prepack` script of @sovereignsquad/gds: the root llms.txt is the single
// source, and the packed copy (gitignored) is what consumers read from node_modules.
import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
copyFileSync(resolve(root, 'llms.txt'), resolve(root, 'packages/gds/llms.txt'));
