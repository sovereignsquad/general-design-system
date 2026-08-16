import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { resetGdsDevWarnings } from '@sovereignsquad/gds-theme';
import { pickGdsAutoForeground, getGdsContrastRatio } from '../../gds-theme/src/contrast';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';
import { GdsBadge, gdsBadgeAccentColors, gdsBadgeAccentShades } from './GdsBadge';
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

  it('every accent shade (#502) clears WCAG AA (4.5:1) against white, and each accent\'s four shades are all distinct', () => {
    for (const [accentName, shades] of Object.entries(gdsBadgeAccentShades)) {
      const seen = new Set<string>();
      for (const [shadeName, hex] of Object.entries(shades)) {
        expect(pickGdsAutoForeground(hex), `${accentName}/${shadeName}`).toBe('#ffffff');
        expect(getGdsContrastRatio('#ffffff', hex), `${accentName}/${shadeName}`).toBeGreaterThanOrEqual(4.5);
        expect(seen.has(hex), `${accentName}/${shadeName} duplicates an earlier shade of the same accent`).toBe(false);
        seen.add(hex);
      }
      expect(shades.base).toBe(gdsBadgeAccentColors[accentName as keyof typeof gdsBadgeAccentColors]);
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

  describe('emoji glyph mode (#525)', () => {
    it('defaults to tabler with no GdsProvider mode set', () => {
      renderWithGds(<GdsBadge accent="teal" icon="Habit" emoji="🏊" label="Swimming" />);
      const badge = screen.getByText('Swimming').closest('[data-gds-badge]') as HTMLElement;
      expect(badge.querySelector('[data-gds-icon="Habit"]')).not.toBeNull();
      expect(badge.textContent).not.toContain('🏊');
    });

    it('renders the emoji, aria-hidden, when the ambient GdsProvider mode is emoji and the badge has one', () => {
      renderWithGds(<GdsBadge accent="terracotta" icon="Location" emoji="🏀" label="Basketball" />, {
        defaultBadgeIconStyle: 'emoji',
      });
      const badge = screen.getByText('Basketball').closest('[data-gds-badge]') as HTMLElement;
      expect(badge.textContent).toContain('🏀');
      expect(badge.querySelector('[data-gds-icon]')).toBeNull();
      const emojiEl = badge.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(emojiEl.textContent).toBe('🏀');
    });

    it('failsafe: falls back to the Tabler icon in emoji mode when the badge has no emoji', () => {
      renderWithGds(<GdsBadge accent="forest" icon="Location" label="Trailhead" />, {
        defaultBadgeIconStyle: 'emoji',
      });
      const badge = screen.getByText('Trailhead').closest('[data-gds-badge]') as HTMLElement;
      expect(badge.querySelector('[data-gds-icon="Location"]')).not.toBeNull();
    });

    it('a per-instance iconStyle override wins over the ambient GdsProvider default', () => {
      renderWithGds(<GdsBadge accent="terracotta" icon="Location" emoji="🏀" iconStyle="tabler" label="Basketball" />, {
        defaultBadgeIconStyle: 'emoji',
      });
      const badge = screen.getByText('Basketball').closest('[data-gds-badge]') as HTMLElement;
      expect(badge.querySelector('[data-gds-icon="Location"]')).not.toBeNull();
      expect(badge.textContent).not.toContain('🏀');
    });

    describe('shape + emoji combination', () => {
      let warnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        resetGdsDevWarnings();
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        warnSpy.mockRestore();
      });

      it('ignores shape and renders the emoji disc, with a dev-mode warning', () => {
        renderWithGds(
          <GdsBadge accent="terracotta" shape="hexagon" icon="Location" emoji="🏀" label="Basketball" />,
          { defaultBadgeIconStyle: 'emoji' },
        );
        const badge = screen.getByText('Basketball').closest('[data-gds-badge]') as HTMLElement;
        expect(badge.textContent).toContain('🏀');
        expect(badge.querySelector('[data-gds-badge-stack]')).toBeNull();
        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls.some((call) => /shape.*emoji|emoji.*shape/i.test(String(call[0])))).toBe(true);
      });
    });
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
    // Pin references the accent token so it follows the theme; the axis-derived value is
    // the CSS var() fallback.
    expect(outlinePin.getAttribute('stroke')).toBe(`var(--gds-accent-teal-base, ${gdsBadgeAccentColors.teal})`);

    const { container: filledContainer } = renderWithGds(
      <GdsMapPinBadge accent="teal" icon="Habit" label="Swimming" filled />,
    );
    const filledPin = filledContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    expect(filledPin.getAttribute('fill')).toBe(`var(--gds-accent-teal-base, ${gdsBadgeAccentColors.teal})`);
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
    expect(outlineIconLayer.style.color).toBe(`var(--gds-accent-teal-base, ${gdsBadgeAccentColors.teal})`);

    const { container: filledContainer } = renderWithGds(
      <GdsMapPinBadge accent="teal" icon="Habit" label="Swimming" filled />,
    );
    const filledPin = filledContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    const filledIconLayer = Array.from(filledContainer.querySelectorAll('[data-gds-badge-stack-layer]')).at(-1) as HTMLElement;
    expect(filledIconLayer.style.color).not.toBe(filledPin.getAttribute('fill'));
    expect(filledIconLayer.style.color).not.toBe(`var(--gds-accent-teal-base, ${gdsBadgeAccentColors.teal})`);
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

  it('shade (#502) darkens accent for both the pin and outline-mode icon; defaults to base (unchanged from omitting the prop)', () => {
    const { container: baseContainer } = renderWithGds(<GdsMapPinBadge accent="forest" icon="Location" label="Trailhead" />);
    const basePin = baseContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    expect(basePin.getAttribute('stroke')).toBe(`var(--gds-accent-forest-base, ${gdsBadgeAccentShades.forest.base})`);
    expect(basePin.getAttribute('stroke')).toBe(`var(--gds-accent-forest-base, ${gdsBadgeAccentColors.forest})`);

    const { container: deeperContainer } = renderWithGds(<GdsMapPinBadge accent="forest" shade="deeper" icon="Location" label="Trailhead" />);
    const deeperPin = deeperContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    expect(deeperPin.getAttribute('stroke')).toBe(`var(--gds-accent-forest-deeper, ${gdsBadgeAccentShades.forest.deeper})`);
    expect(deeperPin.getAttribute('stroke')).not.toBe(`var(--gds-accent-forest-base, ${gdsBadgeAccentColors.forest})`);

    const { container: filledContainer } = renderWithGds(<GdsMapPinBadge accent="forest" shade="deepest" icon="Location" label="Trailhead" filled />);
    const filledPin = filledContainer.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
    expect(filledPin.getAttribute('fill')).toBe(`var(--gds-accent-forest-deepest, ${gdsBadgeAccentShades.forest.deepest})`);
  });

  describe('emoji glyph mode (#525)', () => {
    it('defaults to tabler with no GdsProvider mode set', () => {
      const { container } = renderWithGds(
        <GdsMapPinBadge accent="terracotta" icon="Location" emoji="🏀" label="Pivot Point Basketball" />,
      );
      expect(container.querySelector('svg[data-gds-icon="Location"]')).not.toBeNull();
      expect(container.textContent).not.toContain('🏀');
    });

    it('fills the pin with the fixed dark-neutral disc and keeps the ring in accent, while the emoji renders centered', () => {
      const { container } = renderWithGds(
        <GdsMapPinBadge accent="terracotta" icon="Location" emoji="🏀" label="Pivot Point Basketball" />,
        { defaultBadgeIconStyle: 'emoji' },
      );
      const pin = container.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
      expect(pin.getAttribute('fill')).toBe('var(--mantine-color-dark-7, #1f2937)');
      expect(pin.getAttribute('stroke')).toBe(`var(--gds-accent-terracotta-base, ${gdsBadgeAccentColors.terracotta})`);
      expect(container.querySelector('svg[data-gds-icon]')).toBeNull();
      const glyphLayer = Array.from(container.querySelectorAll('[data-gds-badge-stack-layer]')).at(-1) as HTMLElement;
      expect(glyphLayer.textContent).toBe('🏀');
    });

    it('failsafe: falls back to the Tabler icon in emoji mode when the marker has no emoji', () => {
      const { container } = renderWithGds(<GdsMapPinBadge accent="forest" icon="Location" label="Trailhead" />, {
        defaultBadgeIconStyle: 'emoji',
      });
      expect(container.querySelector('svg[data-gds-icon="Location"]')).not.toBeNull();
    });

    it('is exactly two layers in emoji mode too — the pin and the glyph, no extra disc element', () => {
      const { container } = renderWithGds(
        <GdsMapPinBadge accent="ocean" icon="Location" emoji="🏊" label="Pool" />,
        { defaultBadgeIconStyle: 'emoji' },
      );
      expect(container.querySelectorAll('[data-gds-badge-stack-layer]')).toHaveLength(2);
    });

    describe('filled + emoji combination', () => {
      let warnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        resetGdsDevWarnings();
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        warnSpy.mockRestore();
      });

      it('ignores filled/fillOpacity in emoji mode, with a dev-mode warning', () => {
        const { container } = renderWithGds(
          <GdsMapPinBadge accent="terracotta" icon="Location" emoji="🏀" label="Basketball" filled fillOpacity={0.5} />,
          { defaultBadgeIconStyle: 'emoji' },
        );
        const pin = container.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGElement;
        expect(pin.getAttribute('fill')).toBe('var(--mantine-color-dark-7, #1f2937)');
        expect(pin.getAttribute('fill-opacity')).toBe('1');
        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls.some((call) => /emoji.*filled|filled.*emoji/i.test(String(call[0])))).toBe(true);
      });
    });
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

  it('disabled suppresses onRemove and renders an inert, aria-disabled button', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithGds(
      <GdsRemovableTag label="Music" removeLabel="Remove filter: Music" onRemove={onRemove} disabled />,
    );
    const button = screen.getByRole('button', { name: 'Remove filter: Music' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.click(button);
    expect(onRemove).not.toHaveBeenCalled();
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

describe('emoji-mode pin disc is never the accent', () => {
  // An OS-rendered emoji has colors GDS cannot control, so its legibility must not depend
  // on the active accent: the disc behind it is a fixed dark-neutral, never the accent.
  it('fills the disc with the fixed neutral, not the category accent', () => {
    const { container } = renderWithGds(
      <GdsMapPinBadge accent="terracotta" icon="Location" emoji="🏀" label="Basketball" iconStyle="emoji" />,
    );
    const filled = [...container.querySelectorAll('*')]
      .map((el) => el.getAttribute('fill') ?? '')
      .filter(Boolean);
    expect(filled.some((f) => /dark-7|#1f2937/.test(f))).toBe(true);
    expect(filled.some((f) => /--gds-accent-terracotta/.test(f))).toBe(false);
  });

  it('keeps the ring on the accent, so the category is still readable', () => {
    const { container } = renderWithGds(
      <GdsMapPinBadge accent="terracotta" icon="Location" emoji="🏀" label="Basketball" iconStyle="emoji" />,
    );
    const strokes = [...container.querySelectorAll('*')].map((el) => el.getAttribute('stroke') ?? '').filter(Boolean);
    expect(strokes.some((s) => /--gds-accent-terracotta/.test(s))).toBe(true);
  });
});
