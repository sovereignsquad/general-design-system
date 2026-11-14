import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { ResponsiveDataView } from './ResponsiveDataView';

const data = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
const columns = [{ key: 'name' as const, label: 'Name' }];
const renderCard = (item: { name: string }) => <div data-testid="card">{item.name}</div>;

describe('ResponsiveDataView table/grid toggle (#956)', () => {
  it('shows no toggle unless asked and renders the table by default', () => {
    renderWithGds(<ResponsiveDataView data={data} columns={columns as never} renderCard={renderCard} />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('switches between table and grid with a labelled control and reports the change', () => {
    const onViewChange = vi.fn();
    renderWithGds(<ResponsiveDataView data={data} columns={columns as never} renderCard={renderCard} showViewToggle onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));
    expect(onViewChange).toHaveBeenCalledWith('grid');
    expect(screen.getAllByTestId('card')).toHaveLength(2);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('honours a controlled view', () => {
    renderWithGds(<ResponsiveDataView data={data} columns={columns as never} renderCard={renderCard} view="grid" />);
    expect(screen.getAllByTestId('card')).toHaveLength(2);
  });
});
