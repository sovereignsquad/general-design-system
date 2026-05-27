'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@mantine/core';
import type { ButtonProps } from '@mantine/core';
import { useGdsTranslation } from '@doneisbetter/gds-theme';
import { IconCheck, IconX } from '@tabler/icons-react';
import { GdsVocabulary, getSemanticActionLabel } from './vocabulary';
import type { SemanticAction } from './vocabulary';

export interface SemanticButtonProps extends ButtonProps, Omit<React.ComponentPropsWithoutRef<'button'>, keyof ButtonProps | 'leftSection' | 'children'> {
  action: SemanticAction;
  loading?: boolean;
  feedbackState?: 'success' | 'error' | null;
  feedbackText?: string;
  prerenderLabelOnly?: boolean;
}

/**
 * SemanticButton strictly enforces ubiquitous language and standardized iconography.
 * Developers cannot pass arbitrary text or icons; they must use a semantic action key.
 */
export function SemanticButton({ action, loading, feedbackState, feedbackText, prerenderLabelOnly = true, ...props }: SemanticButtonProps) {
  const { t } = useGdsTranslation();
  const config = GdsVocabulary[action];

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
  let label = getSemanticActionLabel(action, t);
  let color = props.color;

  if (!mounted) {
    const { leftSection, ...buttonProps } = props;
    return (
      <Button loading={loading} color={color} {...buttonProps}>
        {getSemanticActionLabel(action)}
      </Button>
    );
  }

  if (internalFeedback === 'success') {
    const defaultFeedback = ('feedback' in config && config.feedback) 
      ? config.feedback 
      : { icon: IconCheck, color: 'teal', messageId: 'gds.feedback.saved' };
      
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
      leftSection={<Icon size="1rem" />} 
      loading={loading}
      color={color}
      {...props}
    >
      {label}
    </Button>
  );
}
