import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import {
  GDS_BUTTON_CONFIRM_WINDOW_MS,
  GDS_BUTTON_FEEDBACK_DURATION_MS,
  GDS_BUTTON_PENDING_DELAY_MS,
  GDS_BUTTON_PENDING_MIN_MS,
  SemanticButton,
} from './SemanticButton';
import { GdsVocabulary } from './vocabulary';
import type { SemanticActionDefinition } from './vocabulary';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function renderButton(ui: React.ReactElement) {
  return renderWithGds(ui);
}

const button = () => screen.getAllByRole('button')[0];
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

describe('SemanticButton onAction micro-interactions (#995)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('a fast action never shows pending: straight to success, then back to rest', async () => {
    renderButton(<SemanticButton action="save" onAction={() => Promise.resolve()} />);
    fireEvent.click(button());
    await advance(0);
    expect(button()).toHaveAttribute('data-gds-button-phase', 'success');
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
    expect(button().querySelector('[data-gds-button-motion="draw"]')).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    await advance(GDS_BUTTON_FEEDBACK_DURATION_MS);
    expect(button()).not.toHaveAttribute('data-gds-button-phase');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('a slow action shows pending after the delay, blocks clicks, and keeps focusability', async () => {
    const work = deferred();
    const onAction = vi.fn(() => work.promise);
    renderButton(<SemanticButton action="save" onAction={onAction} />);
    fireEvent.click(button());
    expect(button()).toHaveAttribute('data-gds-button-phase', 'busy');
    expect(button()).toHaveAttribute('aria-disabled', 'true');
    expect(button()).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await advance(GDS_BUTTON_PENDING_DELAY_MS);
    expect(button()).toHaveAttribute('data-gds-button-phase', 'pending');
    expect(button()).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeInTheDocument();
    expect(button().querySelector('[data-gds-button-motion="spin"]')).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');

    fireEvent.click(button());
    fireEvent.click(button());
    expect(onAction).toHaveBeenCalledTimes(1);

    work.resolve();
    await advance(GDS_BUTTON_PENDING_MIN_MS);
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
    expect(button()).not.toHaveAttribute('aria-disabled');
  });

  it('holds pending for the minimum time once shown', async () => {
    const work = deferred();
    renderButton(<SemanticButton action="save" onAction={() => work.promise} />);
    fireEvent.click(button());
    await advance(GDS_BUTTON_PENDING_DELAY_MS + 10);
    work.resolve();
    await advance(GDS_BUTTON_PENDING_MIN_MS - 50);
    expect(button()).toHaveAttribute('data-gds-button-phase', 'pending');
    await advance(50);
    expect(button()).toHaveAttribute('data-gds-button-phase', 'success');
  });

  it('a rejected action shows the short error label and announces the full message', async () => {
    renderButton(<SemanticButton action="send" onAction={() => Promise.reject(new Error('offline'))} />);
    fireEvent.click(button());
    await advance(0);
    expect(button()).toHaveAttribute('data-gds-button-phase', 'error');
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Something went wrong');
  });

  it('send flies its icon off when it succeeds from rest, and pops the check after pending', async () => {
    const { unmount } = renderButton(<SemanticButton action="send" onAction={() => Promise.resolve()} />);
    fireEvent.click(button());
    await advance(0);
    expect(button().querySelector('[data-gds-button-motion="fly-off"]')).toBeTruthy();
    expect(button().querySelector('[data-gds-button-motion="pop-in"][data-gds-button-motion-after="exit"]')).toBeTruthy();
    unmount();

    const work = deferred();
    renderButton(<SemanticButton action="send" onAction={() => work.promise} />);
    fireEvent.click(button());
    await advance(GDS_BUTTON_PENDING_DELAY_MS);
    work.resolve();
    await advance(GDS_BUTTON_PENDING_MIN_MS);
    expect(button().querySelector('[data-gds-button-motion="fly-off"]')).toBeNull();
    expect(button().querySelector('[data-gds-button-motion="pop-in"]')).toBeTruthy();
  });

  it('delete asks for a second click, and disarms after the confirm window', async () => {
    const onAction = vi.fn(() => Promise.resolve());
    renderButton(<SemanticButton action="delete" onAction={onAction} />);
    fireEvent.click(button());
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Click again to confirm' })).toBeInTheDocument();
    await advance(GDS_BUTTON_CONFIRM_WINDOW_MS);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();

    fireEvent.click(button());
    fireEvent.click(button());
    await advance(0);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Deleted' })).toBeInTheDocument();
  });

  it('fires onClick when the action starts', async () => {
    const onClick = vi.fn();
    renderButton(<SemanticButton action="copy" onClick={onClick} onAction={() => Promise.resolve()} />);
    fireEvent.click(button());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('reserves the width of every state with hidden labels that are not part of the accessible name', () => {
    renderButton(<SemanticButton action="save" onAction={() => Promise.resolve()} />);
    const ghosts = [...button().querySelectorAll('[data-gds-button-label-ghost]')];
    expect(ghosts.map((ghost) => ghost.textContent)).toEqual(['Save', 'Saved', 'Failed', 'Saving…']);
    for (const ghost of ghosts) expect(ghost).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('leaves a plain button unchanged: no reserved labels and no live region', () => {
    renderButton(<SemanticButton action="save" />);
    expect(button().querySelector('[data-gds-button-label-stack]')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('gives every vocabulary action a click motion, and declares only known motions', () => {
    const pending = ['spinner', 'spin', 'bob-down', 'bob-up', 'orbit', 'breathe', 'rewind', 'feed', 'rings'];
    const success = ['fly-off', 'check-draw', 'check-pop', 'turn', 'pop', 'draw'];
    const entries = Object.entries(GdsVocabulary as Record<string, SemanticActionDefinition>);
    for (const [name, config] of entries) {
      expect(config.motion?.press, `${name} has no click motion`).toBeTruthy();
      if (config.motion!.pending) expect(pending, name).toContain(config.motion!.pending);
      if (config.motion!.success) expect(success, name).toContain(config.motion!.success);
    }
    expect(entries.filter(([, config]) => config.motion?.success).map(([name]) => name).sort())
      .toEqual(['add', 'complete', 'copy', 'delete', 'download', 'refresh', 'reward', 'save', 'send', 'upload']);
  });

  it('plays the click motion on a plain click, retriggers it, and keeps the label (#1000)', () => {
    renderButton(<SemanticButton action="notifications" />);
    expect(button().querySelector('[data-gds-button-press]')).toBeNull();
    fireEvent.click(button());
    const first = button().querySelector('[data-gds-button-press="ring"]');
    expect(first).toBeTruthy();
    fireEvent.click(button());
    const second = button().querySelector('[data-gds-button-press="ring"]');
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('plays the click motion when an action starts, and not again when the button returns to rest', async () => {
    renderButton(<SemanticButton action="settings" onAction={() => Promise.resolve()} />);
    fireEvent.click(button());
    expect(button().querySelector('[data-gds-button-press="turn"]')).toBeTruthy();
    await advance(0);
    await advance(GDS_BUTTON_FEEDBACK_DURATION_MS);
    expect(button()).not.toHaveAttribute('data-gds-button-phase');
    expect(button().querySelector('[data-gds-button-press]')).toBeNull();
  });
});
