'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Accordion } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { DocsCodeBlock } from './DocsCodeBlock';
import { MetadataText } from './Typography';

/** Props for {@link DocsCodeDisclosure}. */
export interface DocsCodeDisclosureProps {
  /** The code, when it is already available. */
  code?: string;
  /** Loads the code the first time the panel opens; used when `code` is not given. */
  loadCode?: () => Promise<string>;
  /** Language label shown above the code. */
  language?: string;
  /** Disclosure label. Defaults to the localized "Show code". */
  label?: string;
  /** Open on first render. Defaults to `false`. */
  defaultOpened?: boolean;
}

type LoadState = { status: 'idle' } | { status: 'loading' } | { status: 'ready'; code: string } | { status: 'error' };

/**
 * A collapsed code block. The code is either passed in or loaded on first open, so long
 * examples cost nothing until a reader asks for them. Loading and failure are announced.
 */
export function DocsCodeDisclosure({ code, loadCode, language, label, defaultOpened = false }: DocsCodeDisclosureProps) {
  const { t } = useGdsTranslation();
  const [opened, setOpened] = useState(defaultOpened);
  const [state, setState] = useState<LoadState>(code !== undefined ? { status: 'ready', code } : { status: 'idle' });

  const load = useCallback(() => {
    if (!loadCode) return;
    setState({ status: 'loading' });
    loadCode()
      .then((loaded) => setState({ status: 'ready', code: loaded }))
      .catch(() => setState({ status: 'error' }));
  }, [loadCode]);

  // Opening with nothing loaded, or after a failure, starts a load.
  const setOpen = (next: boolean) => {
    setOpened(next);
    if (next && code === undefined && (state.status === 'idle' || state.status === 'error')) load();
  };

  // A panel that starts open loads once on mount.
  const loadedOnMount = useRef(false);
  useEffect(() => {
    if (defaultOpened && code === undefined && !loadedOnMount.current) {
      loadedOnMount.current = true;
      load();
    }
  }, [defaultOpened, code, load]);

  const shown = code !== undefined ? code : state.status === 'ready' ? state.code : undefined;

  return (
    <Accordion
      variant="contained"
      radius="lg"
      value={opened ? 'code' : null}
      onChange={(value) => setOpen(value === 'code')}
      data-gds-code-disclosure=""
    >
      <Accordion.Item value="code">
        <Accordion.Control>{label ?? t('gds.docsCodeDisclosure.show', 'Show code')}</Accordion.Control>
        <Accordion.Panel>
          {shown !== undefined ? <DocsCodeBlock code={shown} language={language} /> : null}
          {shown === undefined && state.status === 'loading' ? (
            <MetadataText role="status">{t('gds.docsCodeDisclosure.loading', 'Loading code…')}</MetadataText>
          ) : null}
          {shown === undefined && state.status === 'error' ? (
            <MetadataText role="alert">{t('gds.docsCodeDisclosure.error', 'The code could not be loaded. Close and reopen to try again.')}</MetadataText>
          ) : null}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
