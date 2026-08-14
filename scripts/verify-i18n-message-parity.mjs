import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { collectMessageDefaults } from './generate-component-message-packs.mjs';

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
const baselineSource = readFileSync(resolve(localeDir, 'en.ts'), 'utf8');
const baselineText = new Map(
  Object.entries(Function(`return (${/export const en = (\{[\s\S]*\n\});/.exec(baselineSource)[1]});`)()),
);
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

// SOURCE -> PACK. The checks above compare the packs to EACH OTHER, which says nothing about
// whether they cover the components. A `t('gds.x.y', 'Default')` whose id is in no pack renders
// its English fallback in every locale, forever, and passes a pack-vs-pack check silently. That
// is not hypothetical: four ids (`gds.navigation.openMobile` and three `gds.featureBand.*`) were
// in exactly that state when this check was added, and had been serving English to all twelve
// locales. Regenerate with `node scripts/generate-component-message-packs.mjs`.
const { defaults, conflicts } = collectMessageDefaults();
for (const conflict of conflicts) {
  failures.push(`one message id carries two different English texts — ${conflict}`);
}
if (baseline) {
  for (const id of defaults.keys()) {
    if (!baseline.has(id)) {
      failures.push(`component source calls t('${id}', …) but no locale pack defines it, so every locale renders the English fallback.`);
    }
  }
  // The English text in the pack must equal the fallback at the call site. When they disagree,
  // English readers see one string and every other locale is translated from the other.
  for (const [id, text] of defaults) {
    const packText = baselineText.get(id);
    if (packText !== undefined && packText !== text) {
      failures.push(`t('${id}', ${JSON.stringify(text)}) disagrees with en.ts ${JSON.stringify(packText)}.`);
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

console.log(
  `i18n message parity verification passed for ${localeKeys.size} locale packs `
  + `(${baseline?.size ?? 0} keys each, ${defaults.size} resolved from component t() call sites).`,
);
