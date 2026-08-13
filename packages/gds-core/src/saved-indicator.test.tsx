import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { GdsSavedIndicator } from './GdsSavedIndicator';

const labels = {
  saveLabel: 'Save Riverside Swim Club',
  unsaveLabel: 'Remove Riverside Swim Club from saved',
};

describe('GdsSavedIndicator (issue 546)', () => {
  it('is a real toggle button, not a decorative icon', () => {
    renderWithGds(<GdsSavedIndicator saved={false} {...labels} />);
    const button = screen.getByRole('button', { name: labels.saveLabel });
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('announces the ACTION available, while aria-pressed carries the state', () => {
    // Naming the state in the label as well would announce it twice and contradict itself the
    // moment the two disagree. The label says what pressing will do.
    const { rerender } = renderWithGds(<GdsSavedIndicator saved={false} {...labels} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe(labels.saveLabel);

    rerender(<GdsSavedIndicator saved {...labels} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe(labels.unsaveLabel);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('reports the NEXT state, so a controlled parent does not have to invert it', async () => {
    const onSaveChange = vi.fn();
    renderWithGds(<GdsSavedIndicator saved={false} onSaveChange={onSaveChange} {...labels} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSaveChange).toHaveBeenCalledWith(true);
  });

  it('stays a real tap target in corner mode', () => {
    // The corner form is a smaller STEP on the governed control scale, not an icon-sized hit
    // area — a control a user can see is a control a user will try to press.
    renderWithGds(<GdsSavedIndicator mode="corner" saved={false} {...labels} />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('data-gds-saved-indicator')).toBe('corner');
    expect(button.style.width).toBe('var(--gds-control-height-sm)');
  });

  it('takes its size from the control scale, never a literal', () => {
    // Rule 10: a hardcoded 48px would ignore the density axis, leaving one button that does
    // not move when the theme does.
    renderWithGds(<GdsSavedIndicator saved={false} {...labels} />);
    const button = screen.getByRole('button');
    expect(button.style.width).toBe('var(--gds-control-height-md)');
    expect(button.style.height).toBe('var(--gds-control-height-md)');
  });

  it('does not fire when disabled', async () => {
    const onSaveChange = vi.fn();
    renderWithGds(<GdsSavedIndicator saved={false} disabled onSaveChange={onSaveChange} {...labels} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSaveChange).not.toHaveBeenCalled();
  });
});
