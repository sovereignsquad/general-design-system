import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { ar } from './locales';
import {
  DetailFactsTable,
  GDS_DETAIL_FACT_IDS,
  GDS_DETAIL_FACTS_LABEL_COLUMN_PX,
} from './DetailFactsTable';

const UNKNOWN = 'Not confirmed — ask the provider';

describe('DetailFactsTable (issue 711)', () => {
  it('exports the nine-id schema in the documented order', () => {
    expect(GDS_DETAIL_FACT_IDS).toEqual([
      'ageRange',
      'activityType',
      'format',
      'location',
      'setting',
      'price',
      'booking',
      'source',
      'lastChecked',
    ]);
  });

  it('exports the label column width as 130', () => {
    expect(GDS_DETAIL_FACTS_LABEL_COLUMN_PX).toBe(130);
  });

  it('renders exactly nine rows with no values, each showing the unknown phrase', () => {
    const { container } = renderWithGds(<DetailFactsTable />);
    const terms = container.querySelectorAll('dt');
    const definitions = container.querySelectorAll('dd');
    expect(terms).toHaveLength(9);
    expect(definitions).toHaveLength(9);
    definitions.forEach((dd) => expect(dd).toHaveTextContent(UNKNOWN));
  });

  it('renders default labels in schema order', () => {
    const { container } = renderWithGds(<DetailFactsTable />);
    const labels = Array.from(container.querySelectorAll('dt')).map((el) => el.textContent);
    expect(labels).toEqual([
      'Age range',
      'Activity type',
      'Format',
      'Location',
      'Indoor/outdoor',
      'Price',
      'Booking',
      'Source',
      'Last checked',
    ]);
  });

  it('renders a supplied value in its row and leaves every other row unknown', () => {
    renderWithGds(<DetailFactsTable values={{ price: '$40/session' }} />);
    expect(screen.getByText('$40/session')).toBeInTheDocument();
    expect(screen.getAllByText(UNKNOWN)).toHaveLength(8);
  });

  it('renders all nine supplied values with no unknown rows', () => {
    renderWithGds(
      <DetailFactsTable
        values={{
          ageRange: '5-12',
          activityType: 'Soccer',
          format: 'Group',
          location: 'Prospect Park',
          setting: 'Outdoor',
          price: '$40/session',
          booking: 'Online',
          source: 'Provider website',
          lastChecked: '2026-09-01',
        }}
      />,
    );
    expect(screen.queryByText(UNKNOWN)).not.toBeInTheDocument();
    expect(screen.getByText('5-12')).toBeInTheDocument();
    expect(screen.getByText('2026-09-01')).toBeInTheDocument();
  });

  it('treats undefined, null, empty, and whitespace-only values as unknown', () => {
    renderWithGds(
      <DetailFactsTable
        facts={[
          { id: 'a', label: 'A', value: undefined },
          { id: 'b', label: 'B', value: null },
          { id: 'c', label: 'C', value: '' },
          { id: 'd', label: 'D', value: '   ' },
          { id: 'e', label: 'E', value: 'present' },
        ]}
      />,
    );
    expect(screen.getAllByText(UNKNOWN)).toHaveLength(4);
    expect(screen.getByText('present')).toBeInTheDocument();
  });

  it('renders a ReactNode value as-is, never treating an element as blank', () => {
    renderWithGds(
      <DetailFactsTable facts={[{ id: 'a', label: 'A', value: <span data-testid="node-value">Node</span> }]} />,
    );
    expect(screen.getByTestId('node-value')).toBeInTheDocument();
    expect(screen.queryByText(UNKNOWN)).not.toBeInTheDocument();
  });

  it('never filters rows: a custom schema renders every row it is given, in order', () => {
    const { container } = renderWithGds(
      <DetailFactsTable
        facts={[
          { id: 'x', label: 'First', value: '1' },
          { id: 'y', label: 'Second' },
          { id: 'z', label: 'Third', value: '3' },
        ]}
      />,
    );
    const labels = Array.from(container.querySelectorAll('dt')).map((el) => el.textContent);
    expect(labels).toEqual(['First', 'Second', 'Third']);
  });

  it('renders the bordered card with no rows for an empty custom schema', () => {
    const { container } = renderWithGds(<DetailFactsTable facts={[]} />);
    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(0);
  });

  it('renders duplicate custom ids without deduping, using index-scoped keys', () => {
    const { container } = renderWithGds(
      <DetailFactsTable
        facts={[
          { id: 'dup', label: 'One', value: '1' },
          { id: 'dup', label: 'Two', value: '2' },
        ]}
      />,
    );
    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('applies the label column width from the exported constant, not a restated literal', () => {
    const { container } = renderWithGds(<DetailFactsTable values={{ price: '$1' }} />);
    const dt = container.querySelector('dt') as HTMLElement;
    expect(dt.style.flexBasis).toBe(`${GDS_DETAIL_FACTS_LABEL_COLUMN_PX}px`);
  });

  it('gives every dt/dd pair definition-list association via a real <dl>', () => {
    const { container } = renderWithGds(<DetailFactsTable values={{ price: '$1' }} />);
    const dl = container.querySelector('dl');
    expect(dl).toBeInTheDocument();
    expect(dl?.querySelectorAll('dt').length).toBe(dl?.querySelectorAll('dd').length);
  });

  it('resolves the default schema through a non-English locale', () => {
    renderWithGds(<DetailFactsTable />, { locale: 'ar', messages: ar });
    expect(screen.getByText('الفئة العمرية')).toBeInTheDocument();
    expect(screen.getAllByText('غير مؤكد — يُرجى سؤال مزود الخدمة')).toHaveLength(9);
  });
});
