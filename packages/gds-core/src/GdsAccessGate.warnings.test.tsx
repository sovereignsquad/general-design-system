import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGdsDevWarnings } from '@sovereignsquad/gds-theme';
import { renderWithGds } from '../../../test-utils/render';
import { GdsAccessGate } from './GdsAccessGate';

// Regression coverage for #404: an invalid GdsAccessGate contract must surface to
// developers even when no `onEvent` handler is wired (previously it was silent).
describe('GdsAccessGate contract diagnostics', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetGdsDevWarnings();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns when the contract is invalid and no onEvent is supplied', () => {
    renderWithGds(
      <GdsAccessGate
        id=""
        state="locked"
        title=""
        description=""
        preview={<p>Teaser</p>}
        protectedContent={<p>Protected</p>}
      />,
    );

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls.some((call) => /invalid contract/.test(String(call[0])))).toBe(true);
  });

  it('does not warn for a valid contract', () => {
    renderWithGds(
      <GdsAccessGate
        id="members-gate"
        state="locked"
        reason="subscription-required"
        title="Members only"
        description="Sign in to read the full article."
        actions={[{ kind: 'sign-in' }]}
        preview={<p>Teaser</p>}
        protectedContent={<p>Protected</p>}
      />,
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
