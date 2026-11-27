'use client';

import type { ReactNode } from 'react';
import { Button, Card, Group } from '@mantine/core';
import { gdsDevWarnOnce, useGdsTranslation } from '@sovereignsquad/gds-theme';
import { AsyncSurface, type AsyncSurfaceState } from './AsyncSurface';
import { GdsBox, GdsStack } from './LayoutPrimitives';
import { PageHeader } from './PageHeader';
import { StatusBadge, type StatusVariant } from './StatusBadge';
import type { GdsPageTemplateAction, GdsPageTemplateBaseProps } from './GdsPageTemplates';
import type { GdsPageTemplateState, GdsPageTemplateId } from './GdsPageTemplates.shared';

function stateToAsyncState(state: GdsPageTemplateState): AsyncSurfaceState {
  if (state === 'ready' || state === 'saving') return 'success';
  if (state === 'retrying') return 'refreshing';
  if (state === 'permission-denied' || state === 'not-found') return 'error';
  return state;
}

/** Translate function returned by `useGdsTranslation()`. */
export type GdsTemplateTranslate = ReturnType<typeof useGdsTranslation>['t'];

export function stateTitle(state: GdsPageTemplateState, t: GdsTemplateTranslate) {
  const titles: Record<GdsPageTemplateState, string> = {
    loading: t('gds.gdsPageTemplates.state.loading.title', 'Loading'),
    empty: t('gds.gdsPageTemplates.state.empty.title', 'Nothing here yet'),
    ready: t('gds.gdsPageTemplates.state.ready.title', 'Ready'),
    error: t('gds.gdsPageTemplates.state.error.title', 'Unable to load'),
    retrying: t('gds.gdsPageTemplates.state.retrying.title', 'Retrying'),
    saving: t('gds.gdsPageTemplates.state.saving.title', 'Saving'),
    'permission-denied': t('gds.gdsPageTemplates.state.permissionDenied.title', 'Permission denied'),
    'not-found': t('gds.gdsPageTemplates.state.notFound.title', 'Not found'),
  };
  return titles[state];
}

export function stateDescription(state: GdsPageTemplateState, t: GdsTemplateTranslate) {
  const descriptions: Record<GdsPageTemplateState, string> = {
    loading: t('gds.gdsPageTemplates.state.loading.description', 'Loading the latest data.'),
    empty: t('gds.gdsPageTemplates.state.empty.description', 'There is no data available for this page yet.'),
    ready: t('gds.gdsPageTemplates.state.ready.description', 'The page is ready.'),
    error: t('gds.gdsPageTemplates.state.error.description', 'The page could not be loaded. Try again in a moment.'),
    retrying: t('gds.gdsPageTemplates.state.retrying.description', 'Trying again.'),
    saving: t('gds.gdsPageTemplates.state.saving.description', 'Your changes are being saved.'),
    'permission-denied': t('gds.gdsPageTemplates.state.permissionDenied.description', 'Your current role cannot access this page.'),
    'not-found': t('gds.gdsPageTemplates.state.notFound.description', 'The requested resource could not be found.'),
  };
  return descriptions[state];
}

function statusVariantForState(state: GdsPageTemplateState): StatusVariant {
  if (state === 'ready') return 'success';
  if (state === 'saving' || state === 'retrying' || state === 'loading') return 'info';
  if (state === 'error' || state === 'not-found') return 'danger';
  if (state === 'permission-denied') return 'warning';
  return 'neutral';
}

function actionVariant(action: GdsPageTemplateAction) {
  if (action.kind === 'primary') return 'filled';
  if (action.kind === 'danger') return 'light';
  if (action.kind === 'link') return 'subtle';
  return 'default';
}

function actionColor(action: GdsPageTemplateAction) {
  if (action.kind === 'danger' || action.destructive) return 'red';
  return undefined;
}

/**
 * Resolves an action's busy state, honoring the deprecated `pending` alias.
 * `loading` takes precedence; if only the legacy `pending` is set, it is used and
 * a one-time dev warning points the caller at `loading`.
 */
function actionIsBusy(action: GdsPageTemplateAction): boolean {
  if (action.pending !== undefined && action.loading === undefined) {
    gdsDevWarnOnce(
      'GdsPageTemplateAction:pending-deprecated',
      'GdsPageTemplateAction.pending is deprecated; rename it to `loading` for consistency with every other GDS action API. `pending` is still honored for now and will be removed in a future major version.',
    );
  }
  return action.loading ?? action.pending ?? false;
}

export function renderActions(actions: GdsPageTemplateAction[] = []) {
  if (!actions.length) return null;
  return (
    <Group gap="sm" wrap="wrap">
      {actions.map((action) => {
        const busy = actionIsBusy(action);
        return (
          <Button
            key={action.id}
            variant={actionVariant(action)}
            color={actionColor(action)}
            disabled={action.disabled || busy}
            onClick={action.onClick}
            data-gds-template-action={action.id}
            data-gds-template-action-kind={action.kind ?? 'secondary'}
          >
            {busy ? `${action.label}...` : action.label}
          </Button>
        );
      })}
    </Group>
  );
}

export function PageTemplateFrame({
  id,
  title,
  description,
  eyebrow,
  state = 'ready',
  actions,
  statusLabel,
  metadata,
  landmark = 'main',
  children,
}: GdsPageTemplateBaseProps & { id: GdsPageTemplateId }) {
  const { t } = useGdsTranslation();
  return (
    <GdsBox component={landmark === 'main' ? 'main' : 'div'} padding={{ base: 'md', md: 'xl' }} data-gds-page-template={id}>
      <GdsStack gap="lg">
        <PageHeader
          title={title}
          description={description}
          eyebrow={eyebrow}
          actions={(
            <Group gap="sm" wrap="wrap">
              <StatusBadge status={statusVariantForState(state)}>{statusLabel ?? stateTitle(state, t)}</StatusBadge>
              {renderActions(actions)}
            </Group>
          )}
        />
        {metadata ? <Card withBorder radius="lg" padding="md">{metadata}</Card> : null}
        {children}
      </GdsStack>
    </GdsBox>
  );
}

export function TemplateStateGate({
  state = 'ready',
  successContent,
  onRetry,
  retryLabel: retryLabelProp,
}: {
  state?: GdsPageTemplateState;
  successContent: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const { t } = useGdsTranslation();
  const retryLabel = retryLabelProp ?? t('gds.gdsPageTemplates.retryLabel', "Retry");

  const retryAction = onRetry ? <Button variant="light" onClick={onRetry}>{retryLabel}</Button> : undefined;
  return (
    <AsyncSurface
      state={stateToAsyncState(state)}
      successContent={successContent}
      loadingTitle={stateTitle('loading', t)}
      loadingDescription={stateDescription('loading', t)}
      emptyTitle={stateTitle('empty', t)}
      emptyDescription={stateDescription('empty', t)}
      errorTitle={stateTitle(state === 'permission-denied' || state === 'not-found' ? state : 'error', t)}
      errorDescription={stateDescription(state === 'permission-denied' || state === 'not-found' ? state : 'error', t)}
      refreshingTitle={stateTitle('retrying', t)}
      refreshingDescription={stateDescription('retrying', t)}
      retryAction={retryAction}
      compact={false}
      titleOrder={2}
    />
  );
}
