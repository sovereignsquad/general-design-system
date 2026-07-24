import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsDateInput, GdsDateRangeInput, GdsDateTimeInput } from './GdsDateInput.client';

describe('GdsDateInput', () => {
  it('renders with a label and parses typed text into a Date onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithGds(<GdsDateInput label="Start date" value={null} onChange={onChange} />);

    const input = screen.getByLabelText('Start date');
    await user.type(input, 'July 23, 2026');
    await user.tab();

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const received = onChange.mock.calls.at(-1)?.[0] as Date;
    expect(received.getFullYear()).toBe(2026);
    expect(received.getMonth()).toBe(6);
    expect(received.getDate()).toBe(23);
  });

  it('accepts an ISO date string as its value', () => {
    renderWithGds(<GdsDateInput label="Start date" value="2026-07-23" onChange={() => {}} />);
    const input = screen.getByLabelText('Start date') as HTMLInputElement;
    expect(input.value).toContain('2026');
  });
});

describe('GdsDateTimeInput', () => {
  it('renders with a label', () => {
    renderWithGds(<GdsDateTimeInput label="Appointment" value={null} onChange={() => {}} />);
    expect(screen.getByLabelText('Appointment')).toBeInTheDocument();
  });
});

describe('GdsDateRangeInput', () => {
  it('renders with a label', () => {
    renderWithGds(<GdsDateRangeInput label="Coverage window" value={[null, null]} onChange={() => {}} />);
    expect(screen.getByLabelText('Coverage window')).toBeInTheDocument();
  });
});
