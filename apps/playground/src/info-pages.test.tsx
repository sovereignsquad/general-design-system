import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { ApiReferencePage, CoveragePage, InstallPage, MaturityPage, OverviewPage, RequestFeaturePage, RulebookPage, TokensPage, UseCasesPage } from './info-pages';

describe('playground overview page', () => {
  it('frames the site as the official reference and live demo', () => {
    renderWithGds(<OverviewPage />);

    expect(screen.getAllByRole('heading', { name: 'General Design System' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Official reference and live demo')).toBeTruthy();
    expect(screen.getByText(/One place to understand, install, test, and trust GDS/i)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Browse patterns' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Open coverage matrix' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Explore themes' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Open live demos' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Read governance' }).length).toBeGreaterThan(0);
  });

  it('provides the feature-request intake experience', () => {
    renderWithGds(<RequestFeaturePage />);

    expect(screen.getByRole('heading', { name: 'Request a Feature' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Organization (optional)')).toBeTruthy();
    expect(screen.getByLabelText('Request type')).toBeTruthy();
    expect(screen.getByLabelText('What capability is missing?')).toBeTruthy();
    expect(screen.getByLabelText('How will this help your product?')).toBeTruthy();
    expect(screen.getByText('Triage and repository hygiene')).toBeTruthy();
    expect(screen.getByText('Mail-client fallback')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open prefilled feature request email/i }).getAttribute('href')).toContain(
      'mailto:moldovancsaba+general.design.system@gmail.com',
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
  });

  it('renders fully localized install copy for de and fr locales', () => {
    const { unmount } = renderWithGds(<InstallPage />, { locale: 'de' });

    expect(screen.getByRole('heading', { name: 'GDS installieren' })).toBeTruthy();
    expect(screen.getByText('Öffentlicher 3.15.0-Installationspfad')).toBeTruthy();
    expect(screen.getAllByText(/@sovereignsquad\/gds@3.15.0/).length).toBeGreaterThan(0);

    unmount();

    renderWithGds(<InstallPage />, { locale: 'fr' });

    expect(screen.getByRole('heading', { name: 'Installer GDS' })).toBeTruthy();
    expect(screen.getByText('Parcours d’installation public 3.15.0')).toBeTruthy();
  });

  it('renders parity matrix route with coverage summary', () => {
    renderWithGds(<CoveragePage />);
    expect(screen.getByRole('heading', { name: 'Coverage Matrix' })).toBeTruthy();
    expect(screen.getByText('Pattern parity status')).toBeTruthy();
    expect(screen.getByText('Accessibility evidence')).toBeTruthy();
  });

  it('renders API reference, maturity, and product-owner use-case routes', () => {
    const { unmount } = renderWithGds(<ApiReferencePage />);
    expect(screen.getByRole('heading', { name: 'API Reference' })).toBeTruthy();
    expect(screen.getByText('Published package contracts')).toBeTruthy();
    expect(screen.getByText('Accessibility evidence contract')).toBeTruthy();
    expect(screen.getAllByText('@sovereignsquad/gds-core').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Import path').length).toBeGreaterThan(0);
    unmount();

    const maturity = renderWithGds(<MaturityPage />);
    expect(screen.getByRole('heading', { name: 'Maturity Roadmap Delivered' })).toBeTruthy();
    expect(screen.getByText('Seven recommended capability groups')).toBeTruthy();
    expect(screen.getAllByText('Admin delivery contracts').length).toBeGreaterThan(0);
    maturity.unmount();

    renderWithGds(<UseCasesPage />);
    expect(screen.getByRole('heading', { name: 'Use Cases' })).toBeTruthy();
    expect(screen.getByText('Product-owner adoption guide')).toBeTruthy();
    expect(screen.getAllByText('Admin resource manager').length).toBeGreaterThan(0);
  });

  it('keeps localized headings for themes and governance in de/fr', () => {
    const { unmount } = renderWithGds(<RulebookPage />, { locale: 'fr' });
    expect(screen.getByText('Comment appliquer correctement les règles')).toBeTruthy();
    expect(screen.getByText('Accessibility evidence rules')).toBeTruthy();
    unmount();

    renderWithGds(<TokensPage />, { locale: 'de' });
    expect(screen.getByText('Offizieller Theme-Explorer')).toBeTruthy();
  });

  it('renders additional fully-covered locales for install and overview', () => {
    const { unmount } = renderWithGds(<InstallPage />, { locale: 'it' });
    expect(screen.getByRole('heading', { name: 'Installare GDS' })).toBeTruthy();
    unmount();

    renderWithGds(<OverviewPage />, { locale: 'hu' });
    expect(screen.getByText('Hivatalos referencia és élő demó')).toBeTruthy();
  });

  it('does not show English overview card copy when Russian is selected', () => {
    renderWithGds(<OverviewPage />, { locale: 'ru' });

    expect(screen.getByText('Операционная ясность')).toBeTruthy();
    expect(screen.getByText('Публичное доверие')).toBeTruthy();
    expect(screen.getAllByText('Открыть паттерны').length).toBeGreaterThan(0);
    expect(screen.queryByText('Operational clarity')).toBeNull();
    expect(screen.queryByText('Public trust')).toBeNull();
    expect(screen.queryByText('Browse patterns')).toBeNull();
  });
});
