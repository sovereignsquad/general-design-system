import type { ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { StateBlock } from './StateBlock';
import type { StateBlockVariant } from './StateBlock';
import type { SurfacePresentationProps } from './SurfacePresentation';

/** The async lifecycle state an {@link AsyncSurface} renders. */
export type AsyncSurfaceState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'
  | 'refreshing';

/** Props for {@link AsyncSurface}. */
export interface AsyncSurfaceProps extends SurfacePresentationProps {
  state: AsyncSurfaceState;
  /** Content shown once `state` is `success`. */
  successContent?: ReactNode;
  /** Content shown in the `idle` state; falls back to `successContent`. */
  idleContent?: ReactNode;
  loadingTitle?: string;
  loadingDescription?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  errorTitle?: string;
  errorDescription?: ReactNode;
  refreshingTitle?: string;
  refreshingDescription?: ReactNode;
  /** Builds the default retry button shown in the empty and error states. */
  onRetry?: () => void;
  /** Custom retry action; overrides the default button built from `onRetry`. */
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

/**
 * State gate for any data-backed surface: given an async `state`, it renders the
 * matching governed loading / empty / error / refreshing placeholder — each with
 * a title, description, and optional retry action — or the `successContent` once
 * ready. Use it to wrap list, detail, and report regions so every async state has
 * a consistent, accessible presentation instead of ad-hoc spinners and blank gaps.
 */
export function AsyncSurface({
  state,
  successContent,
  idleContent,
  loadingTitle: loadingTitleProp,
  loadingDescription: loadingDescriptionProp,
  emptyTitle: emptyTitleProp,
  emptyDescription: emptyDescriptionProp,
  errorTitle: errorTitleProp,
  errorDescription: errorDescriptionProp,
  refreshingTitle: refreshingTitleProp,
  refreshingDescription: refreshingDescriptionProp,
  onRetry,
  retryAction,
  compact = false,
  presentation = 'inline',
  minHeight,
  contentAlign,
  contentJustify,
}: AsyncSurfaceProps) {
  const { t } = useGdsTranslation();
  const loadingTitle = loadingTitleProp ?? t('gds.asyncSurface.loadingTitle', "Loading");
  const loadingDescription = loadingDescriptionProp ?? t('gds.asyncSurface.loadingDescription', "This surface is still synchronizing.");
  const emptyTitle = emptyTitleProp ?? t('gds.asyncSurface.emptyTitle', "No results");
  const emptyDescription = emptyDescriptionProp ?? t('gds.asyncSurface.emptyDescription', "No data is available for this surface yet.");
  const errorTitle = errorTitleProp ?? t('gds.asyncSurface.errorTitle', "Unable to load");
  const errorDescription = errorDescriptionProp ?? t('gds.asyncSurface.errorDescription', "Something went wrong while preparing this surface.");
  const refreshingTitle = refreshingTitleProp ?? t('gds.asyncSurface.refreshingTitle', "Refreshing");
  const refreshingDescription = refreshingDescriptionProp ?? t('gds.asyncSurface.refreshingDescription', "The latest data is being fetched.");

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

