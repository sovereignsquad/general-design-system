import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { ar } from './locales';
import { ProviderCTA } from './ProviderCTA';

describe('ProviderCTA (issue 711)', () => {
  it('renders the localized default headline, body, and action label with no overrides', () => {
    renderWithGds(<ProviderCTA onAction={() => {}} />);
    expect(screen.getByText('Are you the provider?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Claim this listing to confirm ages, prices, and schedules. Claimed listings show a "Provider claimed" label.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim listing' })).toBeInTheDocument();
  });

  it('renders overridden headline, body, and action label', () => {
    renderWithGds(
      <ProviderCTA
        headline="Own this program?"
        body="Confirm the details so parents can trust them."
        actionLabel="Yes, this is mine"
        onAction={() => {}}
      />,
    );
    expect(screen.getByText('Own this program?')).toBeInTheDocument();
    expect(screen.getByText('Confirm the details so parents can trust them.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, this is mine' })).toBeInTheDocument();
  });

  it('renders a non-string ReactNode actionLabel/secondaryLabel verbatim, not dropped to an empty label', () => {
    renderWithGds(
      <ProviderCTA
        actionLabel={<span data-testid="claim-label">Claim <strong>now</strong></span>}
        secondaryLabel={<span data-testid="secondary-label">Not yet</span>}
        onAction={() => {}}
      />,
    );
    const primaryButton = screen.getByTestId('claim-label').closest('button');
    expect(primaryButton).not.toBeNull();
    expect(primaryButton).toHaveTextContent('Claim now');
    const secondaryButton = screen.getByTestId('secondary-label').closest('button');
    expect(secondaryButton).not.toBeNull();
    expect(secondaryButton).toHaveTextContent('Not yet');
  });

  it('renders no ghost button when secondaryLabel is omitted', () => {
    renderWithGds(<ProviderCTA onAction={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('renders the ghost button only when secondaryLabel is given, and it is a real button', () => {
    renderWithGds(<ProviderCTA onAction={() => {}} secondaryLabel="Not the provider" onSecondary={() => {}} />);
    const secondary = screen.getByRole('button', { name: 'Not the provider' });
    expect(secondary.tagName).toBe('BUTTON');
  });

  it('fires onAction on click and on keyboard activation', async () => {
    const onAction = vi.fn();
    renderWithGds(<ProviderCTA onAction={onAction} />);
    const primary = screen.getByRole('button', { name: 'Claim listing' });

    await userEvent.click(primary);
    expect(onAction).toHaveBeenCalledTimes(1);

    primary.focus();
    await userEvent.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('fires onSecondary on click, independently of onAction', async () => {
    const onAction = vi.fn();
    const onSecondary = vi.fn();
    renderWithGds(<ProviderCTA onAction={onAction} secondaryLabel="Not the provider" onSecondary={onSecondary} />);

    await userEvent.click(screen.getByRole('button', { name: 'Not the provider' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('renders the ghost button as a no-op click when secondaryLabel is given without onSecondary', async () => {
    renderWithGds(<ProviderCTA onAction={() => {}} secondaryLabel="Not the provider" />);
    await expect(userEvent.click(screen.getByRole('button', { name: 'Not the provider' }))).resolves.not.toThrow();
  });

  it('primary action precedes the ghost action in DOM order', () => {
    renderWithGds(<ProviderCTA onAction={() => {}} secondaryLabel="Not the provider" onSecondary={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Claim listing', 'Not the provider']);
  });

  it('resolves the default copy through a non-English locale', () => {
    renderWithGds(<ProviderCTA onAction={() => {}} />, { locale: 'ar', messages: ar });
    expect(screen.getByText('هل أنت مزود الخدمة؟')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'المطالبة بالقائمة' })).toBeInTheDocument();
  });
});
