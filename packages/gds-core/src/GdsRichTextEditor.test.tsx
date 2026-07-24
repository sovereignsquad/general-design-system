import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsRichTextEditor } from './GdsRichTextEditor.client';

// jsdom has no layout engine, so ProseMirror's click-to-position-cursor logic
// (which calls document.elementFromPoint) needs a stub to avoid throwing.
beforeAll(() => {
  document.elementFromPoint = () => null;
});

describe('GdsRichTextEditor', () => {
  it('renders a labeled editable region and a formatting toolbar', async () => {
    renderWithGds(<GdsRichTextEditor label="Notes" value="<p>Hello</p>" onChange={() => {}} />);

    const editable = await screen.findByRole('textbox', { name: 'Notes' });
    expect(editable).toHaveAttribute('contenteditable', 'true');
    expect(screen.getByText('Hello')).toBeInTheDocument();

    expect(screen.getByRole('toolbar', { name: 'Text formatting' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeInTheDocument();
  });

  it('applies bold to newly typed text after the Bold toolbar button is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithGds(<GdsRichTextEditor label="Notes" value="<p></p>" onChange={onChange} />);

    const editable = await screen.findByRole('textbox', { name: 'Notes' });
    editable.focus();
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true'));

    await user.type(editable, 'Hi');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.stringContaining('<strong>')));
  });

  it('omits the toolbar and disables editing in read-only mode', async () => {
    renderWithGds(<GdsRichTextEditor label="Notes" value="<p>Locked</p>" readOnly />);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    const editable = await screen.findByText('Locked');
    expect(editable.closest('[contenteditable]')).toHaveAttribute('contenteditable', 'false');
  });
});
