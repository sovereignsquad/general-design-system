import { describe, expect, it } from 'vitest';
import {
  applyGdsA11ySuppressions,
  createGdsA11yReport,
  createGdsA11yTest,
  expectGdsFocusTrap,
  expectGdsTabOrder,
  formatGdsA11yReport,
  runGdsAxeScan,
  type GdsPlaywrightLikePage,
} from './index';

function createPage(evaluate: GdsPlaywrightLikePage['evaluate']): GdsPlaywrightLikePage {
  return {
    url: () => '/demo',
    evaluate,
  };
}

describe('@sovereignsquad/gds-a11y', () => {
  it('formats pass and failure reports deterministically', () => {
    const pass = createGdsA11yReport({ route: '/demo' });
    expect(pass.status).toBe('pass');
    expect(formatGdsA11yReport(pass)).toContain('GDS accessibility report: pass');

    const failure = createGdsA11yReport({
      route: '/demo',
      findings: [{
        id: 'label',
        route: '/demo',
        severity: 'serious',
        status: 'failure',
        message: 'Button is missing a label.',
      }],
    });
    expect(failure.status).toBe('failure');
    expect(formatGdsA11yReport(failure)).toContain('[failure/serious] label');
  });

  it('requires suppression metadata and ignores expired suppressions', () => {
    const findings = [{
      id: 'color-contrast',
      route: '/demo',
      selector: 'button',
      severity: 'serious' as const,
      status: 'failure' as const,
      message: 'Low contrast.',
    }];

    const suppressed = applyGdsA11ySuppressions(findings, [{
      id: 'color-contrast',
      selector: 'button',
      reason: 'Temporary vendor issue.',
      owner: 'GDS',
      expiresAt: '2026-12-31',
      replacementPath: 'Use GDS owned contrast controls.',
    }], new Date('2026-06-14T00:00:00Z'));
    expect(suppressed[0].status).toBe('suppressed');

    const expired = applyGdsA11ySuppressions(findings, [{
      id: 'color-contrast',
      reason: 'Old issue.',
      owner: 'GDS',
      expiresAt: '2025-01-01',
      replacementPath: 'Use GDS owned contrast controls.',
    }], new Date('2026-06-14T00:00:00Z'));
    expect(expired[0].status).toBe('failure');
    expect(expired[0].message).toContain('Suppression expired');
  });

  it('maps axe violations into actionable GDS findings', async () => {
    const page = createPage(async () => ({
      violations: [{
        id: 'button-name',
        impact: 'critical',
        help: 'Buttons must have discernible text.',
        helpUrl: 'https://dequeuniversity.com/rules/axe/button-name',
        nodes: [{ target: ['button.icon-only'] }],
      }],
    }));

    const findings = await runGdsAxeScan(page, { route: '/demo' });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      id: 'button-name',
      selector: 'button.icon-only',
      severity: 'critical',
      status: 'failure',
    });
    expect(findings[0].suggestedGdsReplacement).toContain('GDS primitive');
  });

  it('fails when axe-core is not loaded instead of reporting a pass (#944)', async () => {
    const page = createPage(async () => ({ missing: true }));
    const findings = await runGdsAxeScan(page, { route: '/demo' });
    expect(findings).toEqual([expect.objectContaining({ id: 'gds-axe-missing', severity: 'critical', status: 'failure' })]);
    expect(findings[0].message).toContain('addInitScript');

    let call = 0;
    const report = await createGdsA11yTest(createPage(async () => {
      call += 1;
      return call === 1 ? { missing: true } : [];
    }), { route: '/demo' });
    expect(report.status).toBe('failure');
  });

  it('asserts tab order through a supplied page adapter', async () => {
    const page = createPage(async (_fn, expected) => expected);
    const result = await expectGdsTabOrder(page, ['button.primary', 'a.secondary'], { route: '/demo' });
    expect(result.status).toBe('pass');

    const failingPage = createPage(async () => ['a.secondary', 'button.primary']);
    const failure = await expectGdsTabOrder(failingPage, ['button.primary', 'a.secondary'], { route: '/demo' });
    expect(failure.status).toBe('failure');
    expect(failure.findings[0].id).toBe('gds-tab-order');
  });

  it('asserts focus-trap containment through a supplied page adapter', async () => {
    const page = createPage(async () => ({ found: true, escaped: false, active: 'button' }));
    const result = await expectGdsFocusTrap(page, '[role="dialog"]', { route: '/demo' });
    expect(result.status).toBe('pass');

    const failurePage = createPage(async () => ({ found: true, escaped: true, active: 'a' }));
    const failure = await expectGdsFocusTrap(failurePage, '[role="dialog"]', { route: '/demo' });
    expect(failure.status).toBe('failure');
    expect(failure.findings[0].suggestedGdsReplacement).toContain('overlay manager');
  });

  it('creates a complete accessibility report from axe, keyboard, and contrast gates', async () => {
    let call = 0;
    const page = createPage(async (_fn, arg) => {
      call += 1;
      if (call === 1) return { violations: [] };
      if (Array.isArray(arg)) return arg;
      return [];
    });

    const report = await createGdsA11yTest(page, {
      route: '/demo',
      expectedTabOrder: ['button.primary'],
    });

    expect(report.status).toBe('pass');
    expect(report.keyboard?.status).toBe('pass');
    expect(report.contrast?.status).toBe('pass');
  });
});
