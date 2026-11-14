import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsMessageThread, type GdsThreadMessage } from './GdsMessageThread';

const messages: GdsThreadMessage[] = [
  { id: '1', senderId: 'ada', senderName: 'Ada', content: 'Morning', createdAt: '2026-01-01T09:00:00' },
  { id: '2', senderId: 'ada', senderName: 'Ada', content: 'Ready?', createdAt: '2026-01-01T09:01:00' },
  { id: '3', senderId: 'me', senderName: 'Me', content: 'Yes', createdAt: '2026-01-01T09:02:00' },
  { id: '4', senderId: 'ada', senderName: 'Ada', content: 'Next day', createdAt: '2026-01-02T09:00:00' },
];

describe('GdsMessageThread (#957)', () => {
  it('is a labelled log with self and other sides on the message roles', async () => {
    const { container } = renderWithGds(<GdsMessageThread ariaLabel="Chat with Ada" selfId="me" messages={messages} />);
    expect(screen.getByRole('log', { name: 'Chat with Ada' })).toBeTruthy();
    const self = container.querySelectorAll('[data-gds-message="self"]');
    const other = container.querySelectorAll('[data-gds-message="other"]');
    expect(self).toHaveLength(1);
    expect(other).toHaveLength(3);
    expect(self[0].querySelector('[style*="--gds-message-self-bg"]')).not.toBeNull();
    expect(other[0].querySelector('div[style*="message-other"]')).not.toBeNull();
    await expectNoAxeViolations(container);
  });

  it('groups consecutive messages from one sender and separates days', () => {
    const { container } = renderWithGds(<GdsMessageThread ariaLabel="Chat" selfId="me" messages={messages} />);
    expect(container.querySelectorAll('[data-gds-message-day]')).toHaveLength(2);
    const headers = [...container.querySelectorAll('[data-gds-message] > [aria-hidden="true"] p')].map((el) => el.textContent);
    // Ada (day 1), You, Ada again after the day separator: the second Ada message shares the first header.
    expect(headers).toEqual(['Ada', 'You', 'Ada']);
  });

  it('gives every message its sender and time for assistive technology', () => {
    renderWithGds(<GdsMessageThread ariaLabel="Chat" selfId="me" messages={messages} />);
    expect(screen.getByText(/^You, .+:$/)).toBeTruthy();
    expect(screen.getAllByText(/^Ada, .+:$/)).toHaveLength(3);
  });
});
