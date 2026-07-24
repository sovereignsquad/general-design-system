'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@mantine/core';
import type { ButtonProps } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { IconCheck, IconX } from '@tabler/icons-react';
import { getSemanticActionLabel, resolveSemanticActionConfig } from './vocabulary';
import type { GdsVocabularyPack, SemanticActionId } from './vocabulary';

export interface SemanticButtonProps extends ButtonProps, Omit<React.ComponentPropsWithoutRef<'button'>, keyof ButtonProps | 'leftSection' | 'children'> {
  action: SemanticActionId;
  brandVariant?: 'primary' | 'secondary' | 'accent' | 'disabled';
  loading?: boolean;
  feedbackState?: 'success' | 'error' | null;
  feedbackText?: string;
  prerenderLabelOnly?: boolean;
  vocabularyPacks?: GdsVocabularyPack[];
}

const brandButtonStyles: Record<NonNullable<SemanticButtonProps['brandVariant']>, React.CSSProperties> = {
  primary: {
    background: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
    borderColor: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
    color: 'var(--gds-text-on-inverse, var(--mantine-color-white))',
  },
  secondary: {
    background: 'var(--gds-bg-card, var(--gds-vibe-surface, var(--mantine-color-white)))',
    borderColor: 'var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-gray-3)))',
    color: 'var(--gds-brand-primary, var(--gds-vibe-text, var(--mantine-color-dark-7)))',
  },
  accent: {
    background: 'var(--gds-brand-accent-action, var(--gds-brand-accent, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
    borderColor: 'var(--gds-brand-accent-action, var(--gds-brand-accent, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
    color: 'var(--gds-text-on-inverse, var(--mantine-color-white))',
  },
  disabled: {
    background: 'var(--gds-control-disabledBg, var(--mantine-color-gray-2))',
    borderColor: 'var(--gds-control-disabledBg, var(--mantine-color-gray-2))',
    color: 'var(--gds-control-disabledText, var(--mantine-color-gray-6))',
  },
};

/**
 * Button whose label is resolved from a governed semantic `action` id (via the GDS
 * vocabulary) rather than a hardcoded string, so the same action reads and
 * localizes consistently everywhere it appears. Supports brand variants, a
 * `loading` busy state, and transient success/error feedback. Use it for any
 * action tied to a known semantic verb; fall back to Mantine's raw `Button` only
 * for one-off actions with no vocabulary entry.
 */
export function SemanticButton({
  action,
  brandVariant,
  loading,
  feedbackState,
  feedbackText,
  prerenderLabelOnly = true,
  vocabularyPacks = [],
  ...props
}: SemanticButtonProps) {
  const { t } = useGdsTranslation();
  const config = resolveSemanticActionConfig(action, vocabularyPacks);

  const [mounted, setMounted] = useState(!prerenderLabelOnly);
  const [internalFeedback, setInternalFeedback] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (prerenderLabelOnly) {
      setMounted(true);
    }
  }, [prerenderLabelOnly]);

  useEffect(() => {
    if (feedbackState) {
      setInternalFeedback(feedbackState);
      const timer = setTimeout(() => setInternalFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedbackState]);

  let Icon = config.icon;
  let label = getSemanticActionLabel(action, t, vocabularyPacks);
  let color = props.color;
  const brandStyle = brandVariant ? brandButtonStyles[brandVariant] : undefined;
  const disabled = props.disabled || brandVariant === 'disabled';

  if (!mounted) {
    const { leftSection, style, ...buttonProps } = props;
    return (
      <Button {...buttonProps} loading={loading} color={color} data-gds-brand-button={brandVariant} disabled={disabled} style={{ ...brandStyle, ...style }}>
        {getSemanticActionLabel(action, undefined, vocabularyPacks)}
      </Button>
    );
  }

  if (internalFeedback === 'success') {
    const defaultFeedback = config.feedback ?? { icon: IconCheck, color: 'teal', messageId: 'gds.feedback.saved' };
    Icon = defaultFeedback.icon;
    label = feedbackText || t(defaultFeedback.messageId, 'Success');
    color = defaultFeedback.color;
  } else if (internalFeedback === 'error') {
    Icon = IconX;
    label = feedbackText || t('gds.feedback.error', 'Something went wrong');
    color = 'red';
  }

  return (
    <Button
      {...props}
      leftSection={<Icon size="1rem" />}
      loading={loading}
      color={color}
      data-gds-brand-button={brandVariant}
      disabled={disabled}
      style={{ ...brandStyle, ...props.style }}
    >
      {label}
    </Button>
  );
}
