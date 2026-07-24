import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gdsDevWarnOnce, resetGdsDevWarnings } from './dev-warnings';

describe('gdsDevWarnOnce', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetGdsDevWarnings();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns exactly once per key no matter how many times it is called', () => {
    gdsDevWarnOnce('dupe', 'first message');
    gdsDevWarnOnce('dupe', 'second message');
    gdsDevWarnOnce('dupe', 'third message');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('[GDS] first message');
  });

  it('warns independently for distinct keys', () => {
    gdsDevWarnOnce('key-a', 'message a');
    gdsDevWarnOnce('key-b', 'message b');

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('is a no-op in production builds', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      gdsDevWarnOnce('prod-key', 'should never surface in production');
    } finally {
      process.env.NODE_ENV = previous;
    }

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('lets the same key warn again after resetGdsDevWarnings', () => {
    gdsDevWarnOnce('reset-key', 'before reset');
    resetGdsDevWarnings();
    gdsDevWarnOnce('reset-key', 'after reset');

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
