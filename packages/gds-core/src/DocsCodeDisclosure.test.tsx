import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { DocsCodeDisclosure } from './DocsCodeDisclosure';

describe('DocsCodeDisclosure', () => {
  it('starts collapsed and shows passed-in code when opened, without loading', async () => {
    const loadCode = vi.fn(() => Promise.resolve('unused'));
    const { container } = renderWithGds(<DocsCodeDisclosure code="<Button />" language="tsx" loadCode={loadCode} />);
    const control = screen.getByRole('button', { name: 'Show code' });
    expect(control).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('<Button />')).toBeInTheDocument();
    expect(loadCode).not.toHaveBeenCalled();
    await expectNoAxeViolations(container);
  });

  it('loads code on first open only', async () => {
    const loadCode = vi.fn(() => Promise.resolve('const a = 1;'));
    renderWithGds(<DocsCodeDisclosure loadCode={loadCode} label="Usage" />);
    expect(loadCode).not.toHaveBeenCalled();
    const control = screen.getByRole('button', { name: 'Usage' });
    fireEvent.click(control);
    expect(await screen.findByText('const a = 1;')).toBeInTheDocument();
    fireEvent.click(control);
    fireEvent.click(control);
    expect(loadCode).toHaveBeenCalledTimes(1);
  });

  it('announces a failed load and retries when reopened', async () => {
    const loadCode = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error('offline')))
      .mockImplementationOnce(() => Promise.resolve('retried'));
    renderWithGds(<DocsCodeDisclosure loadCode={loadCode} />);
    const control = screen.getByRole('button', { name: 'Show code' });
    fireEvent.click(control);
    expect(await screen.findByRole('alert')).toHaveTextContent('The code could not be loaded.');
    fireEvent.click(control);
    fireEvent.click(control);
    expect(await screen.findByText('retried')).toBeInTheDocument();
    expect(loadCode).toHaveBeenCalledTimes(2);
  });

  it('loads once on mount when it starts open', async () => {
    const loadCode = vi.fn(() => Promise.resolve('opened'));
    renderWithGds(<DocsCodeDisclosure loadCode={loadCode} defaultOpened />);
    await waitFor(() => expect(screen.getByText('opened')).toBeInTheDocument());
    expect(loadCode).toHaveBeenCalledTimes(1);
  });
});
