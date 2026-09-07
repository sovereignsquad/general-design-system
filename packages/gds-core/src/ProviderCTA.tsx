'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Text } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { CtaButtonGroup } from './CtaButtonGroup';
import { GdsStack } from './LayoutPrimitives';
import { SemanticButton } from './SemanticButton';
import { GdsIcons } from './icons';
import { createGdsVocabularyPack } from './vocabulary';

/** Props for {@link ProviderCTA}. */
export interface ProviderCTAProps {
  /** Panel headline. Defaults to the localized claim headline. */
  headline?: ReactNode;
  /** Panel body copy. Defaults to the localized claim body copy. */
  body?: ReactNode;
  /** Primary action's label. Defaults to the localized claim action label. */
  actionLabel?: ReactNode;
  /** Fires when the primary action is activated. */
  onAction: () => void;
  /** Ghost secondary action's label; the button renders only when this is given. */
  secondaryLabel?: ReactNode;
  /** Fires when the secondary action is activated. A no-op if `secondaryLabel` is given without this. */
  onSecondary?: () => void;
}

const containerStyle: CSSProperties = {
  background: 'var(--gds-bg-info-tag, var(--mantine-color-gray-1))',
  border: '1px solid var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-default-border)))',
  borderRadius: 'var(--gds-radius-card)',
  color: 'var(--gds-bg-info-tag-fg, var(--gds-text-primary, var(--mantine-color-dark-7)))',
  padding: 'var(--mantine-spacing-md)',
};

/**
 * Coerces a resolved label to the plain string the vocabulary pack's required `defaultMessage`
 * field needs. This is a fallback only, never the rendered content: `SemanticButton`'s own
 * `label` override (below) always renders the real `resolvedActionLabel`/`resolvedSecondaryLabel`
 * verbatim, string or otherwise, so a non-string `ReactNode` label is never silently dropped.
 */
function toButtonLabel(label: ReactNode): string {
  return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
}

/**
 * Governed provider-claim panel: a calm, factual card prompting "are you the
 * provider?" with a headline, body copy, and a primary + optional ghost action
 * pair, both rendered through the governed button lane (`SemanticButton`) so
 * their hover/press/focus treatment is never reimplemented locally. Fires only
 * the callbacks it is given — it never navigates, fetches, or mutates data
 * itself, and carries no claim workflow of its own. Every default is a
 * localized value from the gds-core locale packs.
 */
export function ProviderCTA({
  headline,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: ProviderCTAProps) {
  const { t } = useGdsTranslation();
  const resolvedHeadline = headline ?? t('gds.providerCta.headline', 'Are you the provider?');
  const resolvedBody =
    body ??
    t(
      'gds.providerCta.body',
      'Claim this listing to confirm ages, prices, and schedules. Claimed listings show a "Provider claimed" label.',
    );
  const resolvedActionLabel = actionLabel ?? t('gds.providerCta.action', 'Claim listing');
  const showSecondary = Boolean(secondaryLabel);

  const primaryVocabularyPacks = [
    createGdsVocabularyPack('providerCta', {
      claim: { defaultMessage: toButtonLabel(resolvedActionLabel), icon: GdsIcons.Building },
    }),
  ];
  const secondaryVocabularyPacks = showSecondary
    ? [
        createGdsVocabularyPack('providerCta', {
          secondary: { defaultMessage: toButtonLabel(secondaryLabel), icon: GdsIcons.Info },
        }),
      ]
    : undefined;

  return (
    <div style={containerStyle}>
      <GdsStack gap="xs">
        <Text fw={700} size="sm" c="inherit">
          {resolvedHeadline}
        </Text>
        <Text size="xs" c="inherit">
          {resolvedBody}
        </Text>
        <CtaButtonGroup
          primary={
            <SemanticButton
              action="providerCta:claim"
              type="button"
              brandVariant="primary"
              vocabularyPacks={primaryVocabularyPacks}
              label={resolvedActionLabel}
              onClick={onAction}
            />
          }
          secondary={
            showSecondary ? (
              <SemanticButton
                action="providerCta:secondary"
                type="button"
                variant="subtle"
                vocabularyPacks={secondaryVocabularyPacks}
                label={secondaryLabel}
                onClick={onSecondary}
              />
            ) : undefined
          }
        />
      </GdsStack>
    </div>
  );
}
