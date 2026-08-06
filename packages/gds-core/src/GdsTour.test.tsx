import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, fireEvent, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import {
  GdsTourProvider,
  GdsGuidedTour,
  GdsTourButton,
  useGdsTour,
  useHasSeenTour,
  type GdsTourStep,
} from './GdsTour.client';

// jsdom has no layout engine (getBoundingClientRect returns 0-rects) and does not
// implement scrollIntoView; the real spotlight geometry + scroll-into-view is
// covered by the headless-Chrome runtime gate. These tests cover the state
// machine, rendering, i18n step text, keyboard, and the missing-target guard.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

const steps: GdsTourStep[] = [
  { id: 'one', target: 'a', title: 'First stop', body: 'About the first thing.' },
  { id: 'two', target: 'b', title: 'Second stop', body: 'About the second thing.' },
];

function Harness({ onFinish, onSkip }: { onFinish?: () => void; onSkip?: () => void }) {
  const tour = useGdsTour();
  return (
    <div>
      <button type="button" data-gds-tour-target="a" onClick={() => tour.start('demo', steps, { onFinish, onSkip })}>
        Alpha
      </button>
      <button type="button" data-gds-tour-target="b">
        Beta
      </button>
    </div>
  );
}

describe('GdsTour', () => {
  it('throws when useGdsTour is used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useGdsTour())).toThrow(/GdsTourProvider/);
    spy.mockRestore();
  });

  it('runs a tour: shows the step card, advances, and finishes', async () => {
    const onFinish = vi.fn();
    renderWithGds(
      <GdsTourProvider>
        <Harness onFinish={onFinish} />
      </GdsTourProvider>,
    );

    await userEvent.click(screen.getByText('Alpha'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(screen.getByText('First stop')).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();

    await userEvent.click(screen.getByText('Next'));
    expect(await screen.findByText('Second stop')).toBeTruthy();
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();

    // Last step shows "Done"; clicking it ends the tour.
    await userEvent.click(screen.getByText('Done'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('renders the step card as a portal sibling of the spotlight, never inside its stacking context (#495)', async () => {
    renderWithGds(
      <GdsTourProvider>
        <Harness />
      </GdsTourProvider>,
    );
    await userEvent.click(screen.getByText('Alpha'));
    const dialog = await screen.findByRole('dialog');
    // Inside .gds-tour-spotlight (a fixed, overlay-level stacking context) the
    // card's own z-index can never rise above the elevated tour target, which
    // buries the dialog under the spotlighted content on small viewports.
    expect(dialog.closest('.gds-tour-spotlight')).toBeNull();
    expect(document.querySelector('[data-gds-tour-overlay]')).toBeTruthy();
  });

  it('skips the tour via the Skip control', async () => {
    const onSkip = vi.fn();
    renderWithGds(
      <GdsTourProvider>
        <Harness onSkip={onSkip} />
      </GdsTourProvider>,
    );
    await userEvent.click(screen.getByText('Alpha'));
    await screen.findByRole('dialog');
    await userEvent.click(screen.getByText('Skip'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    renderWithGds(
      <GdsTourProvider>
        <Harness />
      </GdsTourProvider>,
    );
    await userEvent.click(screen.getByText('Alpha'));
    await screen.findByRole('dialog');
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('skips a step whose target is missing (dev warning, no crash)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function MissingHarness() {
      const tour = useGdsTour();
      const missingSteps: GdsTourStep[] = [
        { id: 'gone', target: 'does-not-exist', title: 'Missing', body: 'x' },
        { id: 'here', target: 'present', title: 'Present stop', body: 'y' },
      ];
      return (
        <div>
          <button type="button" onClick={() => tour.start('m', missingSteps)}>
            Go
          </button>
          <span data-gds-tour-target="present">present</span>
        </div>
      );
    }
    renderWithGds(
      <GdsTourProvider>
        <MissingHarness />
      </GdsTourProvider>,
    );
    await userEvent.click(screen.getByText('Go'));
    // It should skip past the missing target and land on the present one.
    expect(await screen.findByText('Present stop')).toBeTruthy();
    warn.mockRestore();
  });

  it('GdsGuidedTour auto-starts when open and respects persistence', async () => {
    function DeclarativeHarness() {
      return (
        <div>
          <span data-gds-tour-target="a">a</span>
          <span data-gds-tour-target="b">b</span>
          <GdsGuidedTour id="auto" steps={steps} open persist="localStorage" />
        </div>
      );
    }
    const { unmount } = renderWithGds(
      <GdsTourProvider>
        <DeclarativeHarness />
      </GdsTourProvider>,
    );
    // Auto-runs the first time.
    expect(await screen.findByRole('dialog')).toBeTruthy();
    await userEvent.click(screen.getByText('Skip'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    unmount();

    // Second mount: already "seen", so it must not auto-run.
    renderWithGds(
      <GdsTourProvider>
        <DeclarativeHarness />
      </GdsTourProvider>,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('GdsTourButton renders the localized launch label and starts the tour on click', async () => {
    renderWithGds(
      <GdsTourProvider>
        <span data-gds-tour-target="a">a</span>
        <span data-gds-tour-target="b">b</span>
        <GdsTourButton tourId="launcher" steps={steps} />
      </GdsTourProvider>,
    );
    // Default label reads the localized gds.tour.launch key.
    const launcher = screen.getByRole('button', { name: 'Take the guided tour' });
    expect(launcher).toBeTruthy();
    expect(launcher.className).toContain('gds-tour-launch');

    await userEvent.click(launcher);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText('First stop')).toBeTruthy();
  });

  it('GdsTourButton accepts an explicit label override', () => {
    renderWithGds(
      <GdsTourProvider>
        <GdsTourButton tourId="launcher" steps={steps} label="Show me around" />
      </GdsTourProvider>,
    );
    expect(screen.getByRole('button', { name: 'Show me around' })).toBeTruthy();
  });

  it('useHasSeenTour reflects persisted state at mount', async () => {
    const unseen = renderHook(() => useHasSeenTour('never-seen'));
    await waitFor(() => expect(unseen.result.current).toBe(false));

    window.localStorage.setItem('gds-tour-seen:already-seen', '1');
    const seen = renderHook(() => useHasSeenTour('already-seen'));
    await waitFor(() => expect(seen.result.current).toBe(true));
  });
});
