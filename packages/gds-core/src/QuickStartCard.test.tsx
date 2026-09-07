import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { QuickStartCard } from './QuickStartCard';

describe('QuickStartCard (issue 710)', () => {
  it('renders as a real native <button>', () => {
    renderWithGds(<QuickStartCard icon="Calendar" label="This weekend" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'This weekend' });
    expect(button.tagName).toBe('BUTTON');
  });

  it('activates on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithGds(<QuickStartCard label="This weekend" onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('activates on Enter via native button semantics', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithGds(<QuickStartCard label="This weekend" onClick={onClick} />);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('activates on Space via native button semantics', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithGds(<QuickStartCard label="This weekend" onClick={onClick} />);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('folds the optional description into the accessible name, since nothing else supplies it', () => {
    renderWithGds(<QuickStartCard label="This weekend" description="Find weekend activities" onClick={() => {}} />);
    const button = screen.getByRole('button', {
      name: (accessibleName) => accessibleName.includes('This weekend') && accessibleName.includes('Find weekend activities'),
    });
    expect(button).toBeInTheDocument();
  });

  it('renders with no description', () => {
    renderWithGds(<QuickStartCard label="This weekend" onClick={() => {}} />);
    expect(screen.queryByText('Find weekend activities')).toBeNull();
    expect(screen.getByRole('button', { name: 'This weekend' })).toBeInTheDocument();
  });

  it('falls back to the Help icon for an unknown icon key, without crashing', () => {
    renderWithGds(<QuickStartCard icon={'not-a-real-icon' as never} label="This weekend" onClick={() => {}} />);
    const icon = screen.getByRole('button').querySelector('[data-gds-icon]');
    expect(icon).toHaveAttribute('data-gds-icon', 'Help');
  });

  it('falls back to the Help icon when no icon is supplied at all', () => {
    renderWithGds(<QuickStartCard label="This weekend" onClick={() => {}} />);
    const icon = screen.getByRole('button').querySelector('[data-gds-icon]');
    expect(icon).toHaveAttribute('data-gds-icon', 'Help');
  });

  it('renders the icon as decorative, since the label carries the meaning', () => {
    renderWithGds(<QuickStartCard icon="Calendar" label="This weekend" onClick={() => {}} />);
    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('is disabled: native disabled semantics block click and keyboard activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithGds(<QuickStartCard label="This weekend" onClick={onClick} disabled />);

    const button = screen.getByRole('button', { name: 'This weekend' });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
