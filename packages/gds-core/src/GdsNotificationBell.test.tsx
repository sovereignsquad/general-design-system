import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { GdsNotificationBell } from './GdsNotificationBell';
import { GdsNotificationProvider, useGdsNotifications } from './Notifications.client';
import { createGdsNotificationId } from './Notifications';

function BellWiredToProvider() {
  const { notifications, notify, clear } = useGdsNotifications();
  const unread = notifications.length > 0;
  return (
    <GdsNotificationBell
      unread={unread}
      onClick={() => {
        if (unread) {
          clear();
        } else {
          notify({ id: createGdsNotificationId('wiring-test'), title: 'Something happened' });
        }
      }}
    />
  );
}

describe('GdsNotificationBell (issue 713)', () => {
  it('is a real button with the read accessible name and no visible dot by default', () => {
    renderWithGds(<GdsNotificationBell />);
    const button = screen.getByRole('button', { name: 'Notifications' });
    expect(button).toHaveAttribute('data-gds-notification-bell', 'read');
    expect(button.querySelector('[data-gds-notification-bell-dot]')).not.toBeInTheDocument();
  });

  it('switches to the unread accessible name and renders the dot when unread', () => {
    renderWithGds(<GdsNotificationBell unread />);
    const button = screen.getByRole('button', { name: 'Notifications (unread)' });
    expect(button).toHaveAttribute('data-gds-notification-bell', 'unread');
    const dot = button.querySelector('[data-gds-notification-bell-dot]');
    expect(dot).toBeInTheDocument();
  });

  it('the unread dot is decorative — state is never carried by color/dot alone', () => {
    renderWithGds(<GdsNotificationBell unread />);
    const dot = screen.getByRole('button').querySelector('[data-gds-notification-bell-dot]');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('fires onClick on activation', async () => {
    const onClick = vi.fn();
    renderWithGds(<GdsNotificationBell onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stays inert but keeps the unread dot when disabled and unread simultaneously', async () => {
    const onClick = vi.fn();
    renderWithGds(<GdsNotificationBell unread disabled onClick={onClick} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('[data-gds-notification-bell-dot]')).toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('accepts label overrides for both states', () => {
    renderWithGds(<GdsNotificationBell label="Alerts" unreadLabel="Alerts (new)" unread />);
    expect(screen.getByRole('button', { name: 'Alerts (new)' })).toBeInTheDocument();
  });

  it('takes its size from the control scale, never a literal', () => {
    renderWithGds(<GdsNotificationBell />);
    const button = screen.getByRole('button');
    expect(button.style.width).toBe('var(--gds-control-height-md)');
    expect(button.style.height).toBe('var(--gds-control-height-md)');
  });

  describe('wired to GdsNotificationProvider', () => {
    it('flips the dot when a notification arrives, and clears it when the queue clears', async () => {
      renderWithGds(
        <GdsNotificationProvider>
          <BellWiredToProvider />
        </GdsNotificationProvider>,
      );

      expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Notifications (unread)' })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('button', { name: 'Notifications (unread)' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    });
  });
});
