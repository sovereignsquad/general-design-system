// Fails when a locale pack ships English where a translation belongs — other i18n gates
// check key parity only, not values.
//
// Detection rule lives in scripts/lib/i18n-leakage.mjs, shared with the generator.
//
// Output: audit/i18n-leakage.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { measureCorpusLeakage } from './lib/i18n-leakage.mjs';
import { LEAKAGE_BUDGETS, DEFAULT_BUDGET } from './i18n-leakage.config.mjs';

const root = process.cwd();

const corpora = [
  { id: 'site', dir: resolve(root, 'apps/playground/src/generated-site-phrases'), referenceIsKey: true },
  { id: 'package', dir: resolve(root, 'packages/gds-core/src/locales'), referenceIsKey: false },
];

const failures = [];
// No timestamp: the artifact must be a pure function of the packs it measured, or the tree
// stays dirty after every run.
const report = { corpora: {} };

for (const corpus of corpora) {
  const { rows } = measureCorpusLeakage(corpus.dir, { referenceIsKey: corpus.referenceIsKey });

  // Refuse to pass vacuously: a parse that matched nothing would report every pack clean.
  if (rows.length === 0) {
    failures.push(`${corpus.id}: parsed 0 locale packs — refusing to pass vacuously.`);
    continue;
  }
  if (rows.every((row) => row.total === 0)) {
    failures.push(`${corpus.id}: every pack parsed as empty — refusing to pass vacuously.`);
    continue;
  }

  const budgets = LEAKAGE_BUDGETS[corpus.id] ?? {};
  report.corpora[corpus.id] = rows.map(({ locale, total, leaked, rate, leakedKeys }) => ({
    locale, total, leaked, rate, budget: budgets[locale] ?? DEFAULT_BUDGET, leakedKeys,
  }));

  // Ranked worst-first, so remediation effort goes where it matters.
  console.log(`\n${corpus.id} corpus — untranslated English, worst first:`);
  for (const row of rows) {
    const budget = budgets[row.locale] ?? DEFAULT_BUDGET;
    const mark = row.leaked > budget ? 'FAIL' : row.leaked < budget ? 'under' : 'ok';
    console.log(`  ${row.locale.padEnd(4)} ${String(row.leaked).padStart(3)}/${row.total}  ${String(row.rate).padStart(5)}%  budget ${budget}  ${mark}`);

    if (row.leaked > budget) {
      failures.push(
        `${corpus.id}/${row.locale}: ${row.leaked} untranslated value(s), budget ${budget}. `
        + `Examples: ${row.leakedKeys.slice(0, 4).map((key) => JSON.stringify(key)).join(', ')}`,
      );
    } else if (row.leaked < budget) {
      // Unclaimed slack: without this the budget silently becomes a number nobody has to meet.
      failures.push(
        `${corpus.id}/${row.locale}: ${row.leaked} untranslated, better than its budget of ${budget}. `
        + 'Lower the budget in scripts/i18n-leakage.config.mjs to claim the improvement.',
      );
    }
  }
}

mkdirSync(join(root, 'audit'), { recursive: true });
writeFileSync(join(root, 'audit/i18n-leakage.json'), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length > 0) {
  console.error('\nUntranslated-English verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nEvery locale pack is within its untranslated-English budget.');
