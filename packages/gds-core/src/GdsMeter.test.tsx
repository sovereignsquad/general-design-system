import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsMeter } from './GdsMeter';

describe('GdsMeter (#638)', () => {
  it('renders a real role="meter", not role="progressbar"', () => {
    renderWithGds(<GdsMeter value={72} label="Fit score" />);
    const meter = document.querySelector('[role="meter"]');
    expect(meter).not.toBeNull();
    expect(document.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('announces the real value range via aria-value*, defaulting valuetext to "value of max"', () => {
    renderWithGds(<GdsMeter value={72} min={0} max={100} label="Fit score" />);
    const meter = document.querySelector('[role="meter"]') as HTMLElement;
    expect(meter).toHaveAttribute('aria-label', 'Fit score');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuetext', '72 of 100');
  });

  it('supports a non-percent range and a custom valueText', () => {
    renderWithGds(<GdsMeter value={3} min={1} max={5} label="Rating" valueText="3 out of 5 stars" />);
    const meter = document.querySelector('[role="meter"]') as HTMLElement;
    expect(meter).toHaveAttribute('aria-valuemin', '1');
    expect(meter).toHaveAttribute('aria-valuemax', '5');
    expect(meter).toHaveAttribute('aria-valuetext', '3 out of 5 stars');
  });
});
