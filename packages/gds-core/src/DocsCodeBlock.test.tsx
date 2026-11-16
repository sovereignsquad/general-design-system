import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { DocsCodeBlock } from './DocsCodeBlock';

describe('DocsCodeBlock', () => {
  it('renders the code in a focusable group named by the title, so a scrolled block is keyboard-reachable', async () => {
    const { container } = renderWithGds(<DocsCodeBlock title="Install" language="bash" code="npm install @sovereignsquad/gds" />);
    const region = screen.getByRole('group', { name: 'Install' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveTextContent('npm install @sovereignsquad/gds');
    expect(screen.getByRole('button', { name: 'Copy code block' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('names the group "Code" without a title and uses translated labels', () => {
    renderWithGds(<DocsCodeBlock code="a" />, {
      messages: { 'gds.docsCodeBlock.region': 'Kód', 'gds.docsCodeBlock.copy': 'Kód másolása' },
    });
    expect(screen.getByRole('group', { name: 'Kód' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kód másolása' })).toBeInTheDocument();
  });
});
