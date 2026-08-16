import { describe, expect, it } from 'vitest';
import { computeDeltas } from '../report-budgets.mjs';

// A `max` budget rising is a regression; a `min` budget rising is an improvement. Getting
// the direction backwards reports the opposite of the truth about a change.
describe('budget delta classification', () => {
  const row = (over) => ({ key: 'k', measured: 0, value: 100, direction: 'max', unit: 'count', finding: 'F1', advisory: false, status: 'OK', ...over });

  it('flags a max budget rising as REGRESSED and falling as improved', () => {
    expect(computeDeltas([row({ measured: 12 })], [row({ measured: 10 })])[0]).toMatchObject({ delta: 2, status: 'REGRESSED' });
    expect(computeDeltas([row({ measured: 8 })], [row({ measured: 10 })])[0]).toMatchObject({ delta: -2, status: 'improved' });
  });

  it('inverts the rule for a min budget', () => {
    const min = (m) => row({ direction: 'min', measured: m });
    expect(computeDeltas([min(80)], [min(90)])[0]).toMatchObject({ status: 'REGRESSED' });
    expect(computeDeltas([min(95)], [min(90)])[0]).toMatchObject({ status: 'improved' });
  });

  it('reports no change as unchanged rather than as an improvement', () => {
    expect(computeDeltas([row({ measured: 10 })], [row({ measured: 10 })])[0]).toMatchObject({ delta: 0, status: 'unchanged' });
  });

  it('never treats a missing measurement as a pass', () => {
    // An absent artifact must not silently disable a budget by rendering a blank as "fine".
    expect(computeDeltas([row({ measured: null })], [row({ measured: 10 })])[0].status).toBe('head-unavailable');
    expect(computeDeltas([row({ measured: 10 })], [row({ measured: null })])[0].status).toBe('base-unavailable');
    expect(computeDeltas([row({ measured: 10 })], null)[0].status).toBe('no-base');
  });

  it('rounds the delta without letting float noise read as movement', () => {
    expect(computeDeltas([row({ measured: 18.4 })], [row({ measured: 18.4 })])[0].delta).toBe(0);
  });
});
