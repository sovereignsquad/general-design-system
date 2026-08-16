import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsIconBadge } from './GdsIconBadge';

describe('GdsIconBadge (#638)', () => {
  it('is decorative by default and a named image only when a label is given', () => {
    const decorative = renderWithGds(<GdsIconBadge accent="teal" icon="Habit" />);
    const decorativeMark = decorative.container.querySelector('[data-gds-icon-badge]') as HTMLElement;
    expect(decorativeMark).toHaveAttribute('aria-hidden', 'true');
    expect(decorativeMark).not.toHaveAttribute('role');

    const labelled = renderWithGds(<GdsIconBadge accent="teal" icon="Habit" label="Fitness" />);
    const labelledMark = labelled.container.querySelector('[data-gds-icon-badge]') as HTMLElement;
    expect(labelledMark).toHaveAttribute('role', 'img');
    expect(labelledMark).toHaveAttribute('aria-label', 'Fitness');
  });

  it('renders a flat circular disc in the given accent color', () => {
    const { container } = renderWithGds(<GdsIconBadge accent="ocean" shade="deep" icon="Location" label="Nearby" />);
    const mark = container.querySelector('[data-gds-icon-badge]') as HTMLElement;
    expect(mark.style.borderRadius).toBe('50%');
    expect(mark.style.background).toContain('--gds-accent-ocean-deep');
  });
});
