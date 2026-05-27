import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function listFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'coverage', '.next'].includes(entry.name)) {
        continue;
      }
      listFiles(join(dir, entry.name), files);
      continue;
    }

    if ([...SUPPORTED_EXTENSIONS].some((extension) => entry.name.endsWith(extension))) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function ensureImport(content, importStatement) {
  return content.includes(importStatement) ? content : `${importStatement}\n${content}`;
}

function transformDiscoveryShell(content) {
  if (!content.includes("from '@doneisbetter/gds-admin'") || !content.includes('AppShell')) {
    return null;
  }

  if (!/header\s*=|sidebar\s*=/.test(content)) {
    return { changed: false, reason: 'unsupported AppShell usage shape' };
  }

  let next = content
    .replace(/AppShell/g, 'DiscoveryShell')
    .replace(/from '@doneisbetter\/gds-admin'/g, "from '@doneisbetter/gds-core'");

  next = ensureImport(next, "import { DiscoveryShell } from '@doneisbetter/gds-core';");
  return { changed: next !== content, content: next, reason: next !== content ? undefined : 'no-op' };
}

function transformListingCard(content) {
  if (!content.includes('PublicProductCard')) {
    return null;
  }

  let next = content
    .replace(/PublicProductCard/g, 'ListingCard')
    .replace(/from '@doneisbetter\/gds-core'/g, "from '@doneisbetter/gds-core'");

  next = ensureImport(next, "import { ListingCard } from '@doneisbetter/gds-core';");
  return { changed: next !== content, content: next, reason: next !== content ? undefined : 'no-op' };
}

function transformActionBar(content) {
  if (!content.includes('CtaButtonGroup')) {
    return null;
  }

  const tagPattern = /<CtaButtonGroup\s+primary=\{<SemanticButton action="([^"]+)" \/>\}\s*(secondary=\{<SemanticButton action="([^"]+)" \/>\})?\s*(tertiary=\{<SemanticButton action="([^"]+)" \/>\})?\s*\/>/g;
  if (!tagPattern.test(content)) {
    return { changed: false, reason: 'unsupported CtaButtonGroup usage shape' };
  }

  const next = content
    .replace(/import\s*\{\s*CtaButtonGroup\s*\}\s*from\s*'@doneisbetter\/gds-core';?/g, "import { ActionBar } from '@doneisbetter/gds-core';")
    .replace(tagPattern, (_, primaryAction, _secondaryGroup, secondaryAction, _tertiaryGroup, tertiaryAction) => {
      const fields = [`primary={{ action: '${primaryAction}' }}`];
      if (secondaryAction) {
        fields.push(`secondary={[{ action: '${secondaryAction}' }]}`);
      }
      if (tertiaryAction) {
        fields.push(`tertiary={[{ action: '${tertiaryAction}' }]}`);
      }
      return `<ActionBar ${fields.join(' ')} />`;
    });

  return { changed: next !== content, content: next, reason: next !== content ? undefined : 'no-op' };
}

const transforms = {
  'discovery-shell': transformDiscoveryShell,
  'listing-card': transformListingCard,
  'action-bar': transformActionBar,
};

function main() {
  const transformName = process.argv[2];
  const target = process.argv[3] ? resolve(process.argv[3]) : process.cwd();
  const write = process.argv.includes('--write');

  if (!transformName || !transforms[transformName]) {
    console.error('Usage: node scripts/codemods/run-codemod.mjs <discovery-shell|listing-card|action-bar> [path] [--write]');
    process.exit(1);
  }

  const files = statSync(target).isDirectory() ? listFiles(target) : [target];
  const changedFiles = [];
  const skippedFiles = [];

  for (const file of files) {
    const original = readFileSync(file, 'utf8');
    const result = transforms[transformName](original);
    if (!result) {
      continue;
    }
    if (!result.changed) {
      skippedFiles.push({ file, reason: result.reason ?? 'unsupported pattern' });
      continue;
    }
    changedFiles.push(file);
    if (write) {
      writeFileSync(file, result.content);
    }
  }

  process.stdout.write(JSON.stringify({ transform: transformName, write, changedFiles, skippedFiles }, null, 2));
}

main();
