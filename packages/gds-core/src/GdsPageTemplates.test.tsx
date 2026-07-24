import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGdsDevWarnings } from '@sovereignsquad/gds-theme';
import { renderWithGds } from '../../../test-utils/render';
import { GdsAdminDashboardTemplate, type GdsPageTemplateAction } from './GdsPageTemplates';

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
