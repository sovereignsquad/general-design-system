import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const localeDir = resolve(root, 'packages/gds-core/src/locales');
const localeFiles = readdirSync(localeDir).filter((file) => /^[a-z]{2}\.ts$/.test(file)).sort();
const failures = [];
const localeKeys = new Map();

for (const file of localeFiles) {
  const source = readFileSync(resolve(localeDir, file), 'utf8');
  const keys = [...source.matchAll(/'([^']+)'\s*:/g)].map((match) => match[1]).sort();
  const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicateKeys.length) {
    failures.push(`${file} contains duplicate message keys: ${[...new Set(duplicateKeys)].join(', ')}`);
  }
  localeKeys.set(file.replace('.ts', ''), new Set(keys));
}

const baselineLocale = 'en';
const baseline = localeKeys.get(baselineLocale);
if (!baseline) {
  failures.push('Missing baseline locale file packages/gds-core/src/locales/en.ts.');
} else {
  for (const [locale, keys] of localeKeys) {
    if (locale === baselineLocale) {
      continue;
    }
    for (const key of baseline) {
      if (!keys.has(key)) {
        failures.push(`${locale} is missing package message key ${key}.`);
      }
    }
    for (const key of keys) {
      if (!baseline.has(key)) {
        failures.push(`${locale} contains non-baseline package message key ${key}.`);
      }
    }
  }
}

if (failures.length) {
  console.error('i18n message parity verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`i18n message parity verification passed for ${localeKeys.size} locale packs.`);
