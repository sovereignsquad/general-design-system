import { describe, expect, it } from 'vitest';
import { buildLabelIndex, isShortLabel, parsePackageLocale, readLabelIndexes } from './package-label-precedence.mjs';

describe('isShortLabel (issue 996)', () => {
  it('accepts capitalised labels of up to three words', () => {
    expect(isShortLabel('Save')).toBe(true);
    expect(isShortLabel('Row added')).toBe(true);
    expect(isShortLabel('Take it now')).toBe(true);
  });

  it('rejects longer phrases', () => {
    expect(isShortLabel('Take the guided tour')).toBe(false);
  });

  it('rejects lower-case fragments the package composes with a field name', () => {
    expect(isShortLabel('requires at least')).toBe(false);
    expect(isShortLabel('allows at most')).toBe(false);
  });

  it('rejects punctuation, placeholders and padded text', () => {
    expect(isShortLabel('Is required.')).toBe(false);
    expect(isShortLabel('Step {n}')).toBe(false);
    expect(isShortLabel('Loading…')).toBe(false);
    expect(isShortLabel(' Save')).toBe(false);
    expect(isShortLabel('')).toBe(false);
    expect(isShortLabel(undefined)).toBe(false);
  });
});

describe('buildLabelIndex (issue 996)', () => {
  const en = {
    'gds.action.save': 'Save',
    'gds.overlay.close': 'Close',
    'gds.action.close': 'Close',
    'gds.tour.back': 'Back',
    'gds.action.back': 'Back',
    'gds.form.required': 'is required.',
    'gds.action.explore': 'Explore',
  };

  it('maps a short label to the translation its message ids agree on', () => {
    const { labels } = buildLabelIndex(en, {
      'gds.action.save': '保存',
      'gds.overlay.close': '关闭',
      'gds.action.close': '关闭',
    });
    expect(labels.get('Save')).toBe('保存');
    expect(labels.get('Close')).toBe('关闭');
  });

  it('reports a label whose ids disagree as ambiguous and gives it no value', () => {
    const { labels, ambiguous } = buildLabelIndex(en, {
      'gds.tour.back': '上一步',
      'gds.action.back': '后退',
    });
    expect(labels.has('Back')).toBe(false);
    expect(ambiguous.get('Back')).toEqual(['上一步', '后退']);
  });

  it('skips fragments and ids missing or blank in the locale pack', () => {
    const { labels } = buildLabelIndex(en, {
      'gds.form.required': '为必填项。',
      'gds.action.explore': '  ',
    });
    expect(labels.has('is required.')).toBe(false);
    expect(labels.has('Explore')).toBe(false);
    expect(labels.has('Save')).toBe(false);
  });
});

describe('parsePackageLocale', () => {
  it('reads a pack written with mixed quote styles', () => {
    const source = "/** doc */\nexport const zh = {\n  'a': '一',\n  'b': \"二\",\n};\n";
    expect(parsePackageLocale(source)).toEqual({ a: '一', b: '二' });
  });

  it('throws on a file that is not a pack', () => {
    expect(() => parsePackageLocale('export default 1;')).toThrow();
  });
});

describe('shipped zh and ko packs', () => {
  const { zh, ko } = readLabelIndexes(process.cwd(), ['zh', 'ko']);

  it('translate Save in the UI sense', () => {
    expect(zh.labels.get('Save')).toBe('保存');
    expect(ko.labels.get('Save')).toBe('저장');
  });

  it('translate Explore as a call to action, not a dictionary-form verb', () => {
    expect(ko.labels.get('Explore')).toBe('탐색');
  });
});
