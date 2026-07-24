import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GdsI18nContext, useGdsTranslation } from './i18n';
import { resetGdsDevWarnings } from './dev-warnings';

function TranslationConsumer() {
  const { t } = useGdsTranslation();
  return <span>{t('demo.key', 'Fallback copy')}</span>;
}

describe('useGdsTranslation missing-provider diagnostics', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetGdsDevWarnings();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns once, and still returns the English fallback, when there is no GdsProvider', () => {
    render(<TranslationConsumer />);

    // Behaviour is unchanged: the fallback string still renders.
    expect(screen.getByText('Fallback copy')).toBeInTheDocument();
    // ...but the developer now gets one actionable signal about the missing provider.
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('GdsProvider');
  });

  it('does not warn when a provider (even one with empty messages) supplies a value', () => {
    render(
      <GdsI18nContext.Provider value={{ locale: 'en', messages: {} }}>
        <TranslationConsumer />
      </GdsI18nContext.Provider>,
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
