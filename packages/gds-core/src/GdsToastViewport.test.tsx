import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsToastProvider, useGdsToasts } from './FeedbackRuntime.client';
import { GdsNotificationProvider, NotificationCenter, useGdsNotifications } from './Notifications.client';
import { de } from './locales/de';

function ToastTrigger({ onRetry }: { onRetry?: () => Promise<void> }) {
  const toasts = useGdsToasts();
  return (
    <>
      <button type="button" onClick={() => toasts.notifySuccess({ title: 'Saved', message: 'Your changes are saved.' })}>success</button>
      <button type="button" onClick={() => toasts.notifyError({ title: 'Upload failed', retry: onRetry })}>error</button>
    </>
  );
}

// Elements that are live regions and contain the text: each notification must be announced once.
function liveRegionsContaining(text: string) {
  return [...document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')].filter((el) => (el.textContent ?? '').includes(text));
}

describe('GdsToastViewport (#973)', () => {
  it('shows a toast visibly and announces it exactly once', async () => {
    const { container } = renderWithGds(<GdsToastProvider><ToastTrigger /></GdsToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    const region = screen.getByRole('region', { name: 'Recent notifications' });
    expect(within(region).getByText('Saved')).toBeInTheDocument();
    expect(liveRegionsContaining('Saved')).toHaveLength(1);
    await expectNoAxeViolations(container);
  });

  it('dismisses and retries', async () => {
    const onRetry = vi.fn(async () => undefined);
    renderWithGds(<GdsToastProvider><ToastTrigger onRetry={onRetry} /></GdsToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    const region = screen.getByRole('region', { name: 'Recent notifications' });
    await act(async () => {
      fireEvent.click(within(region).getByRole('button', { name: 'Retry' }));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(within(region).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('region', { name: 'Recent notifications' })).toBeNull();
  });

  it('caps the stack and counts the rest', () => {
    function Many() {
      const { notify } = useGdsNotifications();
      return <button type="button" onClick={() => [1, 2, 3, 4, 5].forEach((n) => notify({ id: `n${n}`, title: `Item ${n}`, persistence: 'persistent' }, { dedupe: 'append' }))}>many</button>;
    }
    renderWithGds(<GdsToastProvider viewport={{ maxVisible: 2 }}><Many /></GdsToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'many' }));
    const region = screen.getByRole('region', { name: 'Recent notifications' });
    expect(within(region).getByText('Item 5')).toBeInTheDocument();
    expect(within(region).getByText('Item 4')).toBeInTheDocument();
    expect(within(region).queryByText('Item 3')).toBeNull();
    expect(within(region).getByText('3 more')).toBeInTheDocument();
  });

  it('renders no viewport with viewport={false}, and NotificationCenter then carries the visible list without a second announcement', () => {
    function Center() {
      return <NotificationCenter />;
    }
    renderWithGds(
      <GdsToastProvider viewport={false}>
        <ToastTrigger />
        <Center />
      </GdsToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    expect(document.querySelector('[data-gds-toast-viewport]')).toBeNull();
    expect(screen.getAllByText('Saved').length).toBeGreaterThan(0);
    expect(liveRegionsContaining('Saved')).toHaveLength(1);
  });

  it('translates its controls', () => {
    function Trigger() {
      const { notify } = useGdsNotifications();
      return <button type="button" onClick={() => notify({ id: 'x', title: 'Hinweis', persistence: 'persistent' })}>go</button>;
    }
    renderWithGds(
      <GdsNotificationProvider>
        <Trigger />
        <GdsToastViewportProbe />
      </GdsNotificationProvider>,
      { locale: 'de', messages: de },
    );
    fireEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(screen.getByRole('button', { name: de['gds.notifications.dismiss'] })).toBeInTheDocument();
  });
});

import { GdsToastViewport } from './Notifications.client';
function GdsToastViewportProbe() {
  return <GdsToastViewport />;
}
