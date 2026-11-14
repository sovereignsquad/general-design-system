import type { ReactNode } from 'react';
import { Card, Group } from '@mantine/core';
import { gdsDevWarnOnce, useGdsTranslation } from '@sovereignsquad/gds-theme';
import { AsyncSurface, type AsyncSurfaceState } from './AsyncSurface';
import { GdsBox, GdsStack } from './LayoutPrimitives';
import { PageHeader } from './PageHeader';
import { StatusBadge, type StatusVariant } from './StatusBadge';
import type { GdsPageTemplateState, GdsPageTemplateAction, GdsPageTemplateBaseProps, GdsPageTemplateId } from './GdsPageTemplates';

function stateToAsyncState(state: GdsPageTemplateState): AsyncSurfaceState {
  if (state === 'ready' || state === 'saving') return 'success';
  if (state === 'retrying') return 'refreshing';
  if (state === 'permission-denied' || state === 'not-found') return 'error';
  return state;
}

export function stateTitle(state: GdsPageTemplateState) {
  const titles: Record<GdsPageTemplateState, string> = {
    loading: 'Loading',
    empty: 'Nothing here yet',
    ready: 'Ready',
    error: 'Unable to load',
    retrying: 'Retrying',
    saving: 'Saving',
    'permission-denied': 'Permission denied',
    'not-found': 'Not found',
  };
  return titles[state];
}

export function stateDescription(state: GdsPageTemplateState) {
  const descriptions: Record<GdsPageTemplateState, string> = {
    loading: 'The page is preparing the latest governed data.',
    empty: 'There is no data available for this page yet.',
    ready: 'The page is ready.',
    error: 'The page could not be prepared. Retry when the upstream service recovers.',
    retrying: 'The recovery action is running.',
    saving: 'Your changes are being saved.',
    'permission-denied': 'Your current role cannot access this page.',
    'not-found': 'The requested resource could not be found.',
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
  return 'outline';
}

function actionColor(action: GdsPageTemplateAction) {
  if (action.kind === 'danger' || action.destructive) return 'red';
  if (action.kind === 'primary') return 'violet';
  return 'gray';
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
          <button
            key={action.id}
            type="button"
            aria-disabled={action.disabled || busy || undefined}
            disabled={action.disabled || busy}
            onClick={action.onClick}
            data-gds-template-action={action.id}
            data-gds-template-action-kind={action.kind ?? 'secondary'}
            style={{
              minHeight: 40,
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-default-border)',
              padding: '0 var(--mantine-spacing-md)',
              fontWeight: 700,
              color: `var(--mantine-color-${actionColor(action)}-7)`,
              background: actionVariant(action) === 'filled' ? `var(--mantine-color-${actionColor(action)}-1)` : 'var(--mantine-color-body)',
            }}
          >
            {busy ? `${action.label}...` : action.label}
          </button>
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
  return (
    <GdsBox component={landmark === 'main' ? 'main' : 'div'} padding={{ base: 'md', md: 'xl' }} data-gds-page-template={id}>
      <GdsStack gap="lg">
        <PageHeader
          title={title}
          description={description}
          eyebrow={eyebrow}
          actions={(
            <Group gap="sm" wrap="wrap">
              <StatusBadge status={statusVariantForState(state)}>{statusLabel ?? stateTitle(state)}</StatusBadge>
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

  const retryAction = onRetry ? <button type="button" onClick={onRetry}>{retryLabel}</button> : undefined;
  return (
    <AsyncSurface
      state={stateToAsyncState(state)}
      successContent={successContent}
      loadingTitle={stateTitle('loading')}
      loadingDescription={stateDescription('loading')}
      emptyTitle={stateTitle('empty')}
      emptyDescription={stateDescription('empty')}
      errorTitle={stateTitle(state === 'permission-denied' || state === 'not-found' ? state : 'error')}
      errorDescription={stateDescription(state === 'permission-denied' || state === 'not-found' ? state : 'error')}
      refreshingTitle={stateTitle('retrying')}
      refreshingDescription={stateDescription('retrying')}
      retryAction={retryAction}
      compact={false}
      titleOrder={2}
    />
  );
}
