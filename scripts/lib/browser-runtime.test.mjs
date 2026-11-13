import { describe, expect, it } from 'vitest';
import { pickDevToolsPort } from './browser-runtime.mjs';

describe('pickDevToolsPort (#967)', () => {
  it('never returns a port Node fetch() refuses', () => {
    const picked = new Set();
    for (let i = 0; i < 300; i += 1) picked.add(pickDevToolsPort(9800, 300, () => i / 300));
    expect(picked.has(10080)).toBe(false);
    expect(Math.min(...picked)).toBe(9800);
    expect(Math.max(...picked)).toBe(10099);
  });

  it('fails clearly when the whole range is blocked', () => {
    expect(() => pickDevToolsPort(10080, 1)).toThrow('No fetch-reachable port in 10080-10080.');
  });

  it('Node fetch() rejects port 10080, the reason it is excluded', async () => {
    const response = await fetch('http://127.0.0.1:10080/').catch((error) => error);
    expect(String(response.cause?.message ?? response.message)).toContain('bad port');
  });
});
