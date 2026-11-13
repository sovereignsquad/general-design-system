// Every published package carries a README that npmjs.com renders, the umbrella README's
// bootstrap code equals llms.txt's, each README names every subpath and bin the package
// exposes, no README sends installs to the authenticated mirror, and the umbrella tarball
// ships llms.txt.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];
const packagesDir = resolve(root, 'packages');

function codeBlocks(text) {
  return [...text.matchAll(/```[a-z]*\n[\s\S]*?\n```/g)].map((match) => match[0]);
}

const llms = readFileSync(resolve(root, 'llms.txt'), 'utf8');
const bootstrapStart = llms.indexOf('Bootstrap is two steps.');
const bootstrapEnd = llms.indexOf('What each step supplies:');
if (bootstrapStart === -1 || bootstrapEnd <= bootstrapStart) {
  failures.push('llms.txt: cannot find the bootstrap section ("Bootstrap is two steps." … "What each step supplies:").');
}
const bootstrapBlocks = codeBlocks(llms.slice(bootstrapStart, bootstrapEnd));
if (bootstrapBlocks.length < 2) {
  failures.push(`llms.txt: expected at least 2 bootstrap code blocks, found ${bootstrapBlocks.length}.`);
}

const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(packagesDir, entry.name, 'package.json')))
  .map((entry) => entry.name)
  .sort();
if (packageDirs.length === 0) failures.push('No packages found under packages/ — refusing to pass vacuously.');

for (const dir of packageDirs) {
  const manifest = JSON.parse(readFileSync(resolve(packagesDir, dir, 'package.json'), 'utf8'));
  if (manifest.private) continue;
  const label = `packages/${dir}/README.md`;
  const readmePath = resolve(packagesDir, dir, 'README.md');
  if (!existsSync(readmePath)) {
    failures.push(`${label} is missing; npmjs.com shows no README for ${manifest.name}.`);
    continue;
  }
  const readme = readFileSync(readmePath, 'utf8');
  if (!readme.startsWith(`# ${manifest.name}\n`) && !readme.startsWith(`# \`${manifest.name}\`\n`)) {
    failures.push(`${label} must start with "# ${manifest.name}".`);
  }
  if (!manifest.description) failures.push(`packages/${dir}/package.json has no "description".`);

  for (const key of Object.keys(manifest.exports ?? {})) {
    if (key === '.' || key === './package.json') continue;
    const specifier = `${manifest.name}/${key.slice(2)}`;
    const relative = `./${key.slice(2)}`;
    if (!readme.includes(specifier) && !readme.includes(relative)) {
      failures.push(`${label} does not name the exported subpath ${specifier}.`);
    }
  }
  for (const bin of Object.keys(typeof manifest.bin === 'object' && manifest.bin ? manifest.bin : {})) {
    if (!readme.includes(`\`${bin}\``)) failures.push(`${label} does not name the \`${bin}\` command.`);
  }
  if (/npm\.pkg\.github\.com|_authToken/.test(readme)) {
    failures.push(`${label} must not route installs to the authenticated GitHub Packages mirror; npmjs.com installs need no .npmrc entry.`);
  }
  if (/\]\((?!https?:|#)/.test(readme)) {
    failures.push(`${label} has a relative link; npmjs.com cannot resolve it. Use an absolute URL.`);
  }
}

const umbrellaReadme = readFileSync(resolve(packagesDir, 'gds/README.md'), 'utf8');
for (const block of bootstrapBlocks) {
  if (!umbrellaReadme.includes(block)) {
    failures.push(`packages/gds/README.md bootstrap code differs from llms.txt:\n${block}`);
  }
}

try {
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--workspace', '@sovereignsquad/gds'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
  const files = new Set(packed[0].files.map((file) => file.path));
  for (const required of ['README.md', 'llms.txt']) {
    if (!files.has(required)) failures.push(`npm pack of @sovereignsquad/gds does not include ${required}.`);
  }
  const packedLlms = resolve(packagesDir, 'gds/llms.txt');
  if (existsSync(packedLlms) && readFileSync(packedLlms, 'utf8') !== llms) {
    failures.push('packages/gds/llms.txt differs from the root llms.txt after prepack.');
  }
} catch (error) {
  failures.push(`npm pack --dry-run of @sovereignsquad/gds failed: ${error.message}`);
}

if (failures.length > 0) {
  console.error(`Package README verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Package README verification passed for ${packageDirs.length} packages; @sovereignsquad/gds ships llms.txt.`);
