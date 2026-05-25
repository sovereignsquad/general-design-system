'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@mantine/core';
import type { ButtonProps } from '@mantine/core';
import { useGdsTranslation } from '@gds/theme';
import { IconCheck, IconX } from '@tabler/icons-react';
import { GdsVocabulary } from './vocabulary';
import type { SemanticAction } from './vocabulary';

export interface SemanticButtonProps extends ButtonProps, Omit<React.ComponentPropsWithoutRef<'button'>, keyof ButtonProps | 'leftSection' | 'children'> {
  action: SemanticAction;
  loading?: boolean;
  feedbackState?: 'success' | 'error' | null;
  feedbackText?: string;
}

/**
 * SemanticButton strictly enforces ubiquitous language and standardized iconography.
 * Developers cannot pass arbitrary text or icons; they must use a semantic action key.
 */
export function SemanticButton({ action, loading, feedbackState, feedbackText, ...props }: SemanticButtonProps) {
  const { t } = useGdsTranslation();
  const config = GdsVocabulary[action];
  
  const [internalFeedback, setInternalFeedback] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (feedbackState) {
      setInternalFeedback(feedbackState);
      const timer = setTimeout(() => setInternalFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedbackState]);

  let Icon = config.icon;
  let label = t(config.id, config.defaultMessage);
  let color = props.color;

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
