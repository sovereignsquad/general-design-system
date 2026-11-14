import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGdsDevWarnings } from '@sovereignsquad/gds-theme';
import { renderWithGds } from '../../../test-utils/render';
import { GdsAdminDashboardTemplate, GdsAnalyticsTemplate, GdsSettingsTemplate, type GdsPageTemplateAction } from './GdsPageTemplates';
import { de } from './locales/de';

function renderAction(action: GdsPageTemplateAction): HTMLButtonElement {
  renderWithGds(
    <GdsAdminDashboardTemplate title="Ops" description="Overview" state="ready" actions={[action]} />,
  );
  return document.querySelector(`[data-gds-template-action="${action.id}"]`) as HTMLButtonElement;
}

describe('GdsPageTemplateAction busy state (loading vs. deprecated pending)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetGdsDevWarnings();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('renders the busy state from `loading`, with no deprecation warning', () => {
    const button = renderAction({ id: 'save', label: 'Save', loading: true });
    expect(button).toBeDisabled();
    expect(button.textContent).toBe('Save...');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('still honors the deprecated `pending` alias, but warns once', () => {
    const button = renderAction({ id: 'save', label: 'Save', pending: true });
    expect(button).toBeDisabled();
    expect(button.textContent).toBe('Save...');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toMatch(/pending is deprecated/);
  });

  it('lets `loading` take precedence over `pending` when both are set', () => {
    const button = renderAction({ id: 'save', label: 'Save', loading: false, pending: true });
    expect(button).not.toBeDisabled();
    expect(button.textContent).toBe('Save');
    // `loading` was explicitly provided, so the legacy alias is not consulted or warned about.
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders a non-busy action normally, with no warning', () => {
    const button = renderAction({ id: 'save', label: 'Save' });
    expect(button).not.toBeDisabled();
    expect(button.textContent).toBe('Save');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('page template copy is localized (#972)', () => {
  it('renders template headings, empty states, state copy and retry from the active locale pack', () => {
    const { container } = renderWithGds(
      <>
        <GdsAdminDashboardTemplate title="Betrieb" landmark="none" />
        <GdsAnalyticsTemplate title="Verkehr" landmark="none" rows={[]} columns={[{ key: 'month', header: 'Monat' }]} />
        <GdsSettingsTemplate title="Einstellungen" landmark="none" state="error" onRetry={() => undefined} />
      </>,
      { locale: 'de', messages: de },
    );
    const text = container.textContent ?? '';
    expect(text).toContain(de['gds.gdsPageTemplates.noMetrics.title']);
    expect(text).toContain(de['gds.gdsPageTemplates.analytics.chartsTitle']);
    expect(text).toContain(de['gds.gdsPageTemplates.analytics.emptyTitle']);
    expect(text).toContain(de['gds.gdsPageTemplates.state.error.title']);
    expect(text).not.toContain('No metrics yet');
    expect(text).not.toContain('Charts');
    expect(text).not.toContain('Unable to load');
    const retry = [...container.querySelectorAll('button')].find((button) => button.textContent === de['gds.gdsPageTemplates.retryLabel']);
    expect(retry).toBeDefined();
    expect(retry?.className).toMatch(/mantine-Button-root/);
  });

  it('renders actions with the governed button', () => {
    const button = renderAction({ id: 'save', label: 'Save', kind: 'primary' });
    expect(button.className).toMatch(/mantine-Button-root/);
    expect(button.getAttribute('style') ?? '').not.toMatch(/min-height/);
  });
});
