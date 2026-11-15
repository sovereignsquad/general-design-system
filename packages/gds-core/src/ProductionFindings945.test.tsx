import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { resetGdsDevWarnings } from '@sovereignsquad/gds-theme';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { ConfirmDialog } from './ConfirmDialog';
import { GdsDialog } from './OverlayManager.client';
import { SearchableSelect } from './SearchableSelect';
import { SemanticButton } from './SemanticButton';

const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

describe('production UI findings (#945)', () => {
  it('ConfirmDialog names its close button and takes button labels', async () => {
    renderWithGds(
      <ConfirmDialog opened onClose={() => undefined} onConfirm={() => undefined} title="Delete project" confirmLabel="Delete project" cancelLabel="Keep project">
        This cannot be undone.
      </ConfirmDialog>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Delete project/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Keep project/ })).toBeInTheDocument();
    await expectNoAxeViolations(dialog);
  });

  it('a non-danger ConfirmDialog confirm uses the theme primary colour, not a fixed violet', async () => {
    renderWithGds(<ConfirmDialog opened isDanger={false} onClose={() => undefined} onConfirm={() => undefined} title="Publish">Publish now?</ConfirmDialog>);
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /Confirm/ });
    expect(confirm.getAttribute('style') ?? '').not.toMatch(/violet/);
  });

  it('GdsDialog renders and closes without an OverlayManagerProvider', async () => {
    resetGdsDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onClose = vi.fn();
    renderWithGds(<GdsDialog id="standalone" opened onClose={onClose} title="Standalone">Body</GdsDialog>);
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls.some(([message]) => String(message).includes('OverlayManagerProvider'))).toBe(true);
    warn.mockRestore();
  });

  it('SearchableSelect: visible label, name that contains the visible text, and a keyboard-operable clear button', async () => {
    const { container } = renderWithGds(
      <>
        <SearchableSelect label="Country" value="a" onChange={() => undefined} options={options} clearable />
        <SearchableSelect ariaLabel="Owner" value={null} onChange={() => undefined} options={options} placeholder="Pick one" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Country' })).toBeInTheDocument();
    const named = screen.getByRole('button', { name: 'Owner Pick one' });
    expect(named).toBeInTheDocument();
    const clear = screen.getByRole('button', { name: 'Clear selection' });
    expect(clear.tagName).toBe('BUTTON');
    expect(clear.parentElement?.closest('button')).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('SemanticButton warns when given children, which it does not render', () => {
    resetGdsDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Untyped = SemanticButton as unknown as (props: Record<string, unknown>) => JSX.Element;
    renderWithGds(<Untyped action="save">Store it</Untyped>);
    expect(screen.queryByText('Store it')).toBeNull();
    expect(warn.mock.calls.some(([message]) => String(message).includes('SemanticButton ignores children'))).toBe(true);
    warn.mockRestore();
  });
});
