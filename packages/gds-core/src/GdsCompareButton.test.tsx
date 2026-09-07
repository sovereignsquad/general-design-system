import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { GdsCompareButton } from './GdsCompareButton';

describe('GdsCompareButton (issue 713)', () => {
  it('renders the off state with the default label and aria-pressed=false', () => {
    renderWithGds(<GdsCompareButton added={false} />);
    const button = screen.getByRole('button', { name: 'Compare' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-gds-compare-button', 'off');
  });

  it('renders the added state with the default label and aria-pressed=true', () => {
    renderWithGds(<GdsCompareButton added />);
    const button = screen.getByRole('button', { name: 'Added to compare' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-gds-compare-button', 'added');
  });

  it('reports the NEXT state exactly once per activation', async () => {
    const onAddedChange = vi.fn();
    renderWithGds(<GdsCompareButton added={false} onAddedChange={onAddedChange} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onAddedChange).toHaveBeenCalledTimes(1);
    expect(onAddedChange).toHaveBeenCalledWith(true);
  });

  it('re-renders correctly on an external prop change, never mirroring it into internal state', () => {
    // The bundle defect this component exists to not repeat: mirroring `added` into
    // useState means a later prop change is silently ignored.
    const { rerender } = renderWithGds(<GdsCompareButton added={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

    rerender(<GdsCompareButton added />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Added to compare' })).toBeInTheDocument();

    rerender(<GdsCompareButton added={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Compare' })).toBeInTheDocument();
  });

  it('does not fire when disabled, but keeps aria-pressed reflecting the real state', async () => {
    const onAddedChange = vi.fn();
    renderWithGds(<GdsCompareButton added disabled onAddedChange={onAddedChange} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(onAddedChange).not.toHaveBeenCalled();
  });

  it('accepts label overrides, and never clips a long label', () => {
    const longLabel = 'Added to your comparison shortlist for the fall program search';
    renderWithGds(<GdsCompareButton added addedLabel={longLabel} />);
    const button = screen.getByRole('button', { name: longLabel });
    expect(button).toBeInTheDocument();
  });

  it('takes its minimum height from the control scale, never a literal', () => {
    renderWithGds(<GdsCompareButton added={false} />);
    const button = screen.getByRole('button');
    expect(button.style.minHeight).toBe('var(--gds-control-height-md)');
  });
});
