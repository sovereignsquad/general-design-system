import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { pickGdsAutoForeground, getGdsContrastRatio } from '../../gds-theme/src/contrast';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';
import { GdsBadge, gdsBadgeAccentColors } from './GdsBadge';
import { GdsCountBadge } from './GdsCountBadge';
import { GdsMapPinBadge } from './GdsMapPinBadge';
import { GdsRemovableTag } from './GdsRemovableTag';
import { MeaningBadge } from './MeaningBadge';
import { FitScoreChip } from './FitScoreChip';
import { PillBar } from './ChoiceChip';
import { DataToolbar } from './DataToolbar';

describe('GdsBadgeStack (#488)', () => {
  it('renders role="img" with the label naming the whole mark, layers positioned by corner', () => {
    const { container } = renderWithGds(
      <GdsBadgeStack size={40} label="Certified mark">
        <GdsBadgeStackLayer cutout="top-end">
          <svg viewBox="0 0 24 24" />
        </GdsBadgeStackLayer>
        <GdsBadgeStackLayer corner="top-end" scale={0.4}>
          <svg viewBox="0 0 24 24" />
        </GdsBadgeStackLayer>
      </GdsBadgeStack>,
    );
    const stack = screen.getByRole('img', { name: 'Certified mark' });
    expect(stack).toHaveAttribute('data-gds-badge-stack');
    const layers = container.querySelectorAll('[data-gds-badge-stack-layer]');
    expect(layers).toHaveLength(2);
    expect(layers[0]).toHaveAttribute('data-gds-badge-stack-layer', 'center');
    expect(layers[0]).toHaveAttribute('data-gds-badge-stack-cutout', 'top-end');
    expect(layers[1]).toHaveAttribute('data-gds-badge-stack-layer', 'top-end');
  });

  it('is decorative (aria-hidden) when no label is given', () => {
    const { container } = renderWithGds(
      <GdsBadgeStack>
        <GdsBadgeStackLayer>
          <svg viewBox="0 0 24 24" />
        </GdsBadgeStackLayer>
      </GdsBadgeStack>,
    );
    expect(container.querySelector('[data-gds-badge-stack]')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('GdsBadge (#489)', () => {
  it('renders the label with fixed-tone marking and the canonical governed icon', () => {
    renderWithGds(<GdsBadge tone="success" icon="Success" label="Published" />);
    const badge = screen.getByText('Published').closest('[data-gds-badge]') as HTMLElement;
    expect(badge).toHaveAttribute('data-gds-badge-fixed-tone');
    expect(badge.querySelector('[data-gds-icon="Success"]')).not.toBeNull();
  });

  it('renders a shape mark composed through GdsBadgeStack when shape is given', () => {
    renderWithGds(<GdsBadge accent="teal" shape="hexagon" icon="Habit" label="Swimming" />);
    const badge = screen.getByText('Swimming').closest('[data-gds-badge]') as HTMLElement;
    expect(badge.querySelector('[data-gds-badge-stack]')).not.toBeNull();
    expect(badge.querySelector('svg[data-gds-icon]')).not.toBeNull();
  });

  it('renders null on an empty label — color is never the only signal', () => {
    const { container } = renderWithGds(<GdsBadge tone="danger" label="" />);
    expect(container.querySelector('[data-gds-badge]')).toBeNull();
  });

  it('keeps its token colors when a caller passes a style prop', () => {
    renderWithGds(<GdsBadge accent="plum" label="Styled" style={{ marginTop: 4 }} />);
    const badge = screen.getByText('Styled').closest('[data-gds-badge]') as HTMLElement;
    expect(badge.style.backgroundColor).not.toBe('');
    expect(badge.style.marginTop).toBe('4px');
  });

  it('every curated accent clears WCAG AA (4.5:1) against its white foreground', () => {
    for (const [name, hex] of Object.entries(gdsBadgeAccentColors)) {
      expect(pickGdsAutoForeground(hex), `accent ${name}`).toBe('#ffffff');
      expect(getGdsContrastRatio('#ffffff', hex), `accent ${name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('shape="pin" actually scales its icon down (regression: a custom style.transform on GdsBadgeStackLayer silently drops the scale prop\'s CSS class, so the scale must be baked into the same transform string)', () => {
    const { container } = renderWithGds(<GdsBadge accent="terracotta" shape="pin" icon="Location" label="Nearby" />);
    const badge = screen.getByText('Nearby').closest('[data-gds-badge]') as HTMLElement;
    const iconLayers = Array.from(badge.querySelectorAll('[data-gds-badge-stack-layer]'));
    const iconLayer = iconLayers[iconLayers.length - 1] as HTMLElement;
    expect(iconLayer.style.transform).toContain('scale(0.42)');
    expect(iconLayer.style.transform).toContain('translateY(-4.1667%)');
  });
});

describe('GdsCountBadge (#490)', () => {
  it('caps the display and announces "{count} {label}" in that order', () => {
    const { container } = renderWithGds(<GdsCountBadge value={126} cap={99} label="notifications" />);
    expect(screen.getByText('99+')).toBeInTheDocument();
    const live = container.querySelector('[role="status"]') as HTMLElement;
    expect(live.textContent).toBe('99+ notifications');
  });

  it('keeps the role="status" live region mounted at zero so later changes announce', () => {
    const { container } = renderWithGds(<GdsCountBadge value={0} label="notifications" />);
    expect(container.querySelector('[data-gds-count-badge]')).toBeNull();
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });

  it('anchors to an element as a corner layer with a cutout on the anchor layer', () => {
    const { container } = renderWithGds(
      <GdsCountBadge dot label="new activity" anchor={<span data-testid="anchor-el" />} />,
    );
    expect(screen.getByTestId('anchor-el')).toBeInTheDocument();
    expect(container.querySelector('[data-gds-badge-stack-layer="top-end"]')).not.toBeNull();
    expect(container.querySelector('[data-gds-badge-stack-cutout="top-end"]')).not.toBeNull();
  });
});

describe('GdsMapPinBadge (#501)', () => {
  it('renders role="img" named by the consumer-supplied label, never an icon library display name', () => {
    renderWithGds(<GdsMapPinBadge accent="ocean" icon="Location" label="Community pool" />);
    expect(screen.getByRole('img', { name: 'Community pool' })).toBeInTheDocument();
  });

  it('renders a canonical GdsIcons key through GdsIcon', () => {
    const { container } = renderWithGds(<GdsMapPinBadge accent="forest" icon="Location" label="Trailhead" />);
    expect(container.querySelector('svg[data-gds-icon="Location"]')).not.toBeNull();
  });

  it('forces stroke=1.75 onto an externally-sourced icon element, regardless of what it was given', () => {
    function FakeExternalIcon(props: { stroke?: number }) {
      return <svg data-testid="external-icon" data-stroke={props.stroke} />;
    }
    renderWithGds(<GdsMapPinBadge accent="grape" icon={<FakeExternalIcon stroke={2} />} label="Choir" />);
    expect(screen.getByTestId('external-icon')).toHaveAttribute('data-stroke', '1.75');
  });

  it('is exactly two layers — the pin shape and the icon, no ring/capsule', () => {
    const { container } = renderWithGds(<GdsMapPinBadge accent="ocean" icon="Location" label="Trailhead" />);
    expect(container.querySelector('svg.tabler-icon-gds-badge-shape-circle')).toBeNull();
    expect(container.querySelectorAll('[data-gds-badge-stack-layer]')).toHaveLength(2);
  });

  it('outline mode draws the pin unfilled; filled mode fills the pin in the accent color', () => {
    const { container: outlineContainer } = renderWithGds(
      <GdsMapPinBadge accent="teal" icon="Habit" label="Swimming" />,
    );
    const outlinePin = outlineContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    expect(outlinePin.getAttribute('fill')).toBe('none');
    expect(outlinePin.getAttribute('stroke')).toBe(gdsBadgeAccentColors.teal);

    const { container: filledContainer } = renderWithGds(
      <GdsMapPinBadge accent="teal" icon="Habit" label="Swimming" filled />,
    );
    const filledPin = filledContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    expect(filledPin.getAttribute('fill')).toBe(gdsBadgeAccentColors.teal);
  });

  it('the icon is never the same color as the pin fill: accent color in outline mode, inverse color once filled', () => {
    // jsdom normalizes an inline style.color to rgb(...); round-trip the
    // expected hex through the same normalization instead of comparing
    // formats that never match syntactically.
    const cssColor = (hex: string) => {
      const probe = document.createElement('div');
      probe.style.color = hex;
      return probe.style.color;
    };

    const { container: outlineContainer } = renderWithGds(
      <GdsMapPinBadge accent="teal" icon="Habit" label="Swimming" />,
    );
    const outlineIconLayer = Array.from(outlineContainer.querySelectorAll('[data-gds-badge-stack-layer]')).at(-1) as HTMLElement;
    expect(outlineIconLayer.style.color).toBe(cssColor(gdsBadgeAccentColors.teal));

    const { container: filledContainer } = renderWithGds(
      <GdsMapPinBadge accent="teal" icon="Habit" label="Swimming" filled />,
    );
    const filledPin = filledContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    const filledIconLayer = Array.from(filledContainer.querySelectorAll('[data-gds-badge-stack-layer]')).at(-1) as HTMLElement;
    expect(filledIconLayer.style.color).not.toBe(filledPin.getAttribute('fill'));
    expect(filledIconLayer.style.color).not.toBe(cssColor(gdsBadgeAccentColors.teal));
  });

  it('fillOpacity applies to the pin fill only, in filled mode; the icon layer never carries fill-opacity', () => {
    const { container } = renderWithGds(
      <GdsMapPinBadge accent="ocean" icon="Location" label="Trailhead" filled fillOpacity={0.85} />,
    );
    const pin = container.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    expect(pin.getAttribute('fill-opacity')).toBe('0.85');
    const iconLayer = Array.from(container.querySelectorAll('[data-gds-badge-stack-layer]')).at(-1) as HTMLElement;
    const iconSvg = iconLayer.querySelector('svg') as SVGElement;
    expect(iconSvg.getAttribute('fill-opacity')).toBeNull();

    const { container: outlineContainer } = renderWithGds(
      <GdsMapPinBadge accent="ocean" icon="Location" label="Trailhead" fillOpacity={0.85} />,
    );
    expect(outlineContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin')).not.toHaveAttribute('fill-opacity');
  });

  it('centers the icon on the pin head circle\'s own solved center (-4.1667%), scaled to 0.46 — bigger than a ring-era icon needed, but kept inside the pin head circle for wide icons (masks, bike)', () => {
    const { container } = renderWithGds(<GdsMapPinBadge accent="ocean" icon="Location" label="Trailhead" />);
    const iconLayers = Array.from(container.querySelectorAll('[data-gds-badge-stack-layer]'));
    const iconLayer = iconLayers[iconLayers.length - 1] as HTMLElement;
    expect(iconLayer.style.transform).toContain('translateY(-4.1667%)');
    expect(iconLayer.style.transform).toContain('scale(0.46)');
  });
});

describe('GdsRemovableTag (#491)', () => {
  it('is a real button with the consumer-supplied accessible name, operable by keyboard', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithGds(<GdsRemovableTag label="Music" removeLabel="Remove filter: Music" onRemove={onRemove} />);
    const button = screen.getByRole('button', { name: 'Remove filter: Music' });
    expect(button.tagName).toBe('BUTTON');
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it('is adopted by DataToolbar for removable active filters (consolidation)', () => {
    renderWithGds(
      <DataToolbar searchLabel="Search" activeFilters={[{ label: 'Music', onRemove: () => {} }, { label: 'Static' }]} />,
    );
    const tag = screen.getByRole('button', { name: 'Remove Music filter' });
    expect(tag.closest('[data-gds-removable-tag]') ?? tag).toHaveAttribute('data-gds-removable-tag');
    expect(screen.getByText('Static').closest('[data-gds-removable-tag]')).toBeNull();
  });
});

describe('#493 regressions', () => {
  it('MeaningBadge keeps its token colors when a caller passes style', () => {
    renderWithGds(<MeaningBadge variant="validation" label="Verified" style={{ marginTop: 2 }} />);
    const badge = screen.getByText('Verified').closest('.mantine-Badge-root') as HTMLElement;
    expect(badge.style.backgroundColor).not.toBe('');
    expect(badge.style.marginTop).toBe('2px');
  });

  it('FitScoreChip keeps its band color when a caller passes style', () => {
    renderWithGds(<FitScoreChip value={92} style={{ marginTop: 2 }} />);
    const chip = screen.getByLabelText(/score 92 of 100/i).closest('.mantine-Badge-root') as HTMLElement;
    expect(chip.style.backgroundColor).not.toBe('');
    expect(chip.style.marginTop).toBe('2px');
  });

  it('selection radiogroups rove tabindex and move selection with arrow keys', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = (require('react') as typeof import('react')).useState<'a' | 'b' | 'c'>('a');
      return (
        <PillBar
          ariaLabel="Modes"
          value={value}
          onChange={setValue}
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
            { value: 'c', label: 'Gamma' },
          ]}
        />
      );
    }
    renderWithGds(<Harness />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1]);

    await user.tab();
    expect(radios[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'true');
  });
});
