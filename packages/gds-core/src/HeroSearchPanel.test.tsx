import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { HeroSearchPanel } from './HeroSearchPanel.client';

const fields = [
  { key: 'childAge', label: 'Child age' },
  { key: 'neighbourhood', label: 'Neighbourhood' },
];

const fiveFields = [
  ...fields,
  { key: 'date', label: 'Date' },
  { key: 'activityType', label: 'Activity type' },
  { key: 'budget', label: 'Budget' },
];

const tenFields = Array.from({ length: 10 }, (_, index) => ({ key: `field-${index}`, label: `Field ${index}` }));

describe('HeroSearchPanel (issue 710)', () => {
  it('renders as a labelled search landmark, defaulting to the governed "Search" name', () => {
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={() => {}} />);
    expect(screen.getByRole('search', { name: 'Search' })).toBeInTheDocument();
  });

  it('overrides the accessible name via ariaLabel', () => {
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={() => {}} ariaLabel="Find activities" />);
    expect(screen.getByRole('search', { name: 'Find activities' })).toBeInTheDocument();
  });

  it('renders a CTA-only panel with zero fields, and says something true at zero', () => {
    renderWithGds(<HeroSearchPanel fields={[]} onSubmit={() => {}} />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('renders one field', () => {
    renderWithGds(<HeroSearchPanel fields={[{ key: 'query', label: 'Query' }]} onSubmit={() => {}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('renders the five-field example set', () => {
    renderWithGds(<HeroSearchPanel fields={fiveFields} onSubmit={() => {}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(5);
  });

  it('renders ten fields without dropping any', () => {
    renderWithGds(<HeroSearchPanel fields={tenFields} onSubmit={() => {}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(10);
  });

  it('is uncontrolled by default: typing updates the input and fires onChange with the full record', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={() => {}} onChange={onChange} />);

    await user.type(screen.getByLabelText('Child age'), '6');

    expect(onChange).toHaveBeenLastCalledWith({ childAge: '6' });
    expect(screen.getByLabelText('Child age')).toHaveValue('6');
  });

  it('is controlled once values is provided: the DOM value follows the prop, not local keystrokes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithGds(<HeroSearchPanel fields={fields} values={{ childAge: '' }} onSubmit={() => {}} onChange={onChange} />);

    await user.type(screen.getByLabelText('Child age'), '6');

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Child age')).toHaveValue('');
  });

  it('renders a controlled values record missing some keys as empty, with no crash', () => {
    renderWithGds(<HeroSearchPanel fields={fields} values={{ childAge: 'six' }} onSubmit={() => {}} />);
    expect(screen.getByLabelText('Child age')).toHaveValue('six');
    expect(screen.getByLabelText('Neighbourhood')).toHaveValue('');
  });

  it('submits the current values verbatim on the primary CTA, with untouched keys absent from the payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={onSubmit} defaultValues={{ childAge: '6' }} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSubmit).toHaveBeenCalledWith({ childAge: '6' });
  });

  it('submits on Enter in any field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={onSubmit} defaultValues={{ childAge: '6' }} />);

    await user.type(screen.getByLabelText('Neighbourhood'), '{Enter}');

    // Only `childAge` was ever edited (via defaultValues); `neighbourhood` was never touched,
    // so it stays absent from the payload rather than appearing as an empty string.
    expect(onSubmit).toHaveBeenCalledWith({ childAge: '6' });
  });

  it('does not trim, coerce, or filter the submitted values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Child age'), '  6  ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSubmit).toHaveBeenCalledWith({ childAge: '  6  ' });
  });

  it('overrides the primary CTA label via primaryActionLabel', () => {
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={() => {}} primaryActionLabel="Find activities" />);
    expect(screen.getByRole('button', { name: 'Find activities' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
  });

  it('renders the secondary CTA only when both secondaryActionLabel and onSecondaryAction are provided', () => {
    const { rerender } = renderWithGds(
      <HeroSearchPanel fields={fields} onSubmit={() => {}} secondaryActionLabel="Browse all" />,
    );
    expect(screen.queryByRole('button', { name: 'Browse all' })).toBeNull();

    rerender(<HeroSearchPanel fields={fields} onSubmit={() => {}} onSecondaryAction={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Browse all' })).toBeNull();

    rerender(
      <HeroSearchPanel fields={fields} onSubmit={() => {}} secondaryActionLabel="Browse all" onSecondaryAction={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Browse all' })).toBeInTheDocument();
  });

  it('the secondary CTA never submits the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onSecondaryAction = vi.fn();
    renderWithGds(
      <HeroSearchPanel
        fields={fields}
        onSubmit={onSubmit}
        secondaryActionLabel="Browse all"
        onSecondaryAction={onSecondaryAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Browse all' }));

    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders the trust line when provided and omits it when not', () => {
    const { rerender } = renderWithGds(
      <HeroSearchPanel fields={fields} onSubmit={() => {}} trustLine="Source-backed listings" />,
    );
    expect(screen.getByText('Source-backed listings')).toBeInTheDocument();

    rerender(<HeroSearchPanel fields={fields} onSubmit={() => {}} />);
    expect(screen.queryByText('Source-backed listings')).toBeNull();
  });

  it('duplicate field keys: the last definition wins for rendering and one value slot backs both', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithGds(
      <HeroSearchPanel
        fields={[
          { key: 'query', label: 'First label' },
          { key: 'query', label: 'Second label' },
        ]}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.queryByLabelText('First label')).toBeNull();

    await user.type(screen.getByLabelText('Second label'), 'x');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSubmit).toHaveBeenCalledWith({ query: 'x' });
  });

  it('renders very long labels and placeholders without overflowing the label association', () => {
    const longText = 'A very long field label that a consumer might realistically supply in production copy'.repeat(3);
    renderWithGds(<HeroSearchPanel fields={[{ key: 'q', label: longText, placeholder: longText }]} onSubmit={() => {}} />);
    expect(screen.getByLabelText(longText)).toBeInTheDocument();
  });

  it('every input is label-associated through FormField, never relying on placeholder alone', () => {
    renderWithGds(
      <HeroSearchPanel fields={[{ key: 'q', label: 'Search term', placeholder: 'e.g. swimming' }]} onSubmit={() => {}} />,
    );
    expect(screen.getByLabelText('Search term')).toBeInTheDocument();
  });

  it('disabled: every field and CTA is disabled, and typed values persist without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithGds(<HeroSearchPanel fields={fields} onSubmit={onSubmit} disabled defaultValues={{ childAge: '6' }} />);

    const input = screen.getByLabelText('Child age');
    const submitButton = screen.getByRole('button', { name: 'Search' });

    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(input).toHaveValue('6');

    await user.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
