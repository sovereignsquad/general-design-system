import type { ReactNode } from 'react';
import { StateBlock } from './StateBlock';
import type { StateBlockVariant } from './StateBlock';
import type { SurfacePresentationProps } from './SurfacePresentation';

export type AsyncSurfaceState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'
  | 'refreshing';

export interface AsyncSurfaceProps extends SurfacePresentationProps {
  state: AsyncSurfaceState;
  successContent?: ReactNode;
  idleContent?: ReactNode;
  loadingTitle?: string;
  loadingDescription?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  errorTitle?: string;
  errorDescription?: ReactNode;
  refreshingTitle?: string;
  refreshingDescription?: ReactNode;
  onRetry?: () => void;
  retryAction?: ReactNode;
  compact?: boolean;
}

function getRetryAction(onRetry?: () => void) {
  if (!onRetry) {
    return undefined;
  }
  return <button type="button" onClick={onRetry}>Retry</button>;
}

function renderStateBlock({
  variant,
  title,
  description,
  compact,
  presentation,
  minHeight,
  contentAlign,
  contentJustify,
  action,
}: {
  variant: StateBlockVariant;
  title: string;
  description?: ReactNode;
  compact: boolean;
  presentation?: SurfacePresentationProps['presentation'];
  minHeight?: SurfacePresentationProps['minHeight'];
  contentAlign?: SurfacePresentationProps['contentAlign'];
  contentJustify?: SurfacePresentationProps['contentJustify'];
  action?: ReactNode;
}) {
  return (
    <StateBlock
      variant={variant}
      title={title}
      description={description}
      action={action}
      compact={compact}
      presentation={presentation}
      minHeight={minHeight}
      contentAlign={contentAlign}
      contentJustify={contentJustify}
    />
  );
}

export function AsyncSurface({
  state,
  successContent,
  idleContent,
  loadingTitle = 'Loading',
  loadingDescription = 'This surface is still synchronizing.',
  emptyTitle = 'No results',
  emptyDescription = 'No data is available for this surface yet.',
  errorTitle = 'Unable to load',
  errorDescription = 'Something went wrong while preparing this surface.',
  refreshingTitle = 'Refreshing',
  refreshingDescription = 'The latest data is being fetched.',
  onRetry,
  retryAction,
  compact = false,
  presentation = 'inline',
  minHeight,
  contentAlign,
  contentJustify,
}: AsyncSurfaceProps) {
  const fallbackRetryAction = retryAction ?? getRetryAction(onRetry);

  if (state === 'success') {
    return <>{successContent}</>;
  }

  if (state === 'idle') {
    return <>{idleContent ?? successContent ?? null}</>;
  }

  if (state === 'loading') {
    return renderStateBlock({
      variant: 'loading',
      title: loadingTitle,
      description: loadingDescription,
      compact,
      presentation,
      minHeight,
      contentAlign,
      contentJustify,
    });
  }

  if (state === 'empty') {
    return renderStateBlock({
      variant: 'empty',
      title: emptyTitle,
      description: emptyDescription,
      compact,
      presentation,
      minHeight,
      contentAlign,
      contentJustify,
      action: fallbackRetryAction,
    });
  }

  if (state === 'error') {
    return renderStateBlock({
      variant: 'error',
      title: errorTitle,
      description: errorDescription,
      compact,
      presentation,
      minHeight,
      contentAlign,
      contentJustify,
      action: fallbackRetryAction,
    });
  }

  return renderStateBlock({
    variant: 'info',
    title: refreshingTitle,
    description: refreshingDescription,
    compact,
    presentation,
    minHeight,
    contentAlign,
    contentJustify,
  });
}

