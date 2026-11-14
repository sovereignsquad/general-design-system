'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Box, Button, Grid, Title } from '@mantine/core';
import { useMediaQuery, useUncontrolled } from '@mantine/hooks';
import { useGdsTranslation, type GdsShapeProfile } from '@sovereignsquad/gds-theme';
import { GdsBulkActionBar, type GdsBulkActionBarProps } from './GdsBulkActionBar';
import { GdsShapeScope } from './GdsShapeScope';
import { GdsViewToggle, type GdsCollectionView } from './GdsViewToggle';
import { GdsStack } from './LayoutPrimitives';
import { SectionPanel } from './SectionPanel';
import { StateBlock } from './StateBlock';
import { PageTemplateFrame, TemplateStateGate } from './GdsPageTemplateFrame';
import type { GdsPageTemplateBaseProps } from './GdsPageTemplates';

/** Props for the asset-manager template: folder tree, toolbar, bulk actions, table/grid items, upload and detail. */
export interface GdsAssetManagerTemplateProps extends GdsPageTemplateBaseProps {
  /** Folder navigation, normally a `GdsTreeView`. */
  tree?: ReactNode;
  /** Toolbar above the items: search, filters, sort, upload trigger (`DataToolbar`, `ActionBar`). */
  toolbar?: ReactNode;
  /** Bulk actions for the current selection; the bar shows when `selectedCount` is above zero. */
  bulkActions?: GdsBulkActionBarProps;
  /** Items as a table, normally an `AdvancedDataTable` with row selection. */
  table?: ReactNode;
  /** Items as a grid of cards, e.g. `GdsAssetPreviewCard`. */
  grid?: ReactNode;
  /** Item layout (controlled) when both `table` and `grid` are given. */
  view?: GdsCollectionView;
  /** Initial item layout when uncontrolled; defaults to `'table'`. */
  defaultView?: GdsCollectionView;
  /** Called when the user switches the item layout. */
  onViewChange?: (view: GdsCollectionView) => void;
  /** Upload flow, normally `GdsAssetManager`. */
  upload?: ReactNode;
  /** Details of the selected item. */
  detail?: ReactNode;
  /** Shape profile for the page; defaults to `'operations'` for dense screens. */
  shapeProfile?: GdsShapeProfile;
}

/** Props for the workspace-inbox template: navigation, thread list and conversation pane. */
export interface GdsWorkspaceInboxTemplateProps extends GdsPageTemplateBaseProps {
  /** Workspace navigation, e.g. a `SidebarNav`. */
  navigation?: ReactNode;
  /** The conversation list, normally a `GdsThreadList`. */
  threadList: ReactNode;
  /** The open conversation, normally a `GdsMessageThread`. */
  detail?: ReactNode;
  /** Heading of the open conversation; focused when it opens on a narrow viewport. */
  detailTitle?: string;
  /** A conversation is open. On a narrow viewport the detail pane replaces the list. */
  hasSelection?: boolean;
  /** The open conversation is loading. */
  detailLoading?: boolean;
  /** Returns from the detail pane to the list on a narrow viewport; clear the selection here. */
  onBack?: () => void;
  /** Height of each region; when set, the regions scroll independently. */
  regionHeight?: string;
}

/**
 * Asset-manager page template: a folder tree beside the items, with a toolbar, a bulk-action
 * bar for the selection, a labelled table/grid toggle when both layouts are given, an upload
 * slot and item detail. The page uses the `operations` shape profile unless `shapeProfile`
 * says otherwise. Focus order follows the layout: tree, toolbar, bulk actions, layout toggle,
 * items.
 */
export function GdsAssetManagerTemplate({
  state = 'ready',
  tree,
  toolbar,
  bulkActions,
  table,
  grid,
  view: viewProp,
  defaultView = 'table',
  onViewChange,
  upload,
  detail,
  shapeProfile = 'operations',
  onRetry,
  retryLabel,
  ...props
}: GdsAssetManagerTemplateProps) {
  const { t } = useGdsTranslation();
  const [view, setView] = useUncontrolled<GdsCollectionView>({ value: viewProp, defaultValue: defaultView, finalValue: 'table', onChange: onViewChange });
  const items = table && grid ? (view === 'grid' ? grid : table) : (table ?? grid);
  return (
    <GdsShapeScope profile={shapeProfile}>
      <PageTemplateFrame id="asset-manager" state={state} {...props}>
        <TemplateStateGate
          state={state}
          onRetry={onRetry}
          retryLabel={retryLabel}
          successContent={(
            <Grid gutter="md">
              {tree ? (
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Box component="nav" aria-label={t('gds.assetManagerTemplate.folders', 'Folders')} data-gds-asset-tree="">{tree}</Box>
                </Grid.Col>
              ) : null}
              <Grid.Col span={{ base: 12, md: tree ? 9 : 12 }}>
                <GdsStack gap="md">
                  {toolbar}
                  {bulkActions ? <GdsBulkActionBar {...bulkActions} /> : null}
                  {table && grid ? <GdsViewToggle value={view} onChange={setView} /> : null}
                  {items ?? <StateBlock variant="empty" compact titleOrder={2} title={t('gds.assetManagerTemplate.emptyTitle', 'This folder is empty')} />}
                  {upload}
                  {detail ? <SectionPanel titleOrder={2} title={t('gds.assetManagerTemplate.detailTitle', 'Selected item')}>{detail}</SectionPanel> : null}
                </GdsStack>
              </Grid.Col>
            </Grid>
          )}
        />
      </PageTemplateFrame>
    </GdsShapeScope>
  );
}

/**
 * Workspace-inbox page template: workspace navigation, a conversation list and the open
 * conversation, each a labelled region that scrolls on its own when `regionHeight` is set. On a
 * narrow viewport it shows the list, or the open conversation with a back action; opening one
 * moves focus to its heading.
 */
export function GdsWorkspaceInboxTemplate({
  state = 'ready',
  navigation,
  threadList,
  detail,
  detailTitle,
  hasSelection = false,
  detailLoading = false,
  onBack,
  regionHeight,
  onRetry,
  retryLabel,
  ...props
}: GdsWorkspaceInboxTemplateProps) {
  const { t } = useGdsTranslation();
  const narrow = useMediaQuery('(max-width: 48em)');
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (narrow && hasSelection) headingRef.current?.focus();
  }, [narrow, hasSelection]);

  const scroll = regionHeight ? { maxBlockSize: regionHeight, overflowY: 'auto' as const } : undefined;
  const conversationsLabel = t('gds.workspaceInboxTemplate.conversations', 'Conversations');
  const title = detailTitle ?? t('gds.workspaceInboxTemplate.conversation', 'Conversation');

  const listRegion = (
    <Box component="section" aria-label={conversationsLabel} style={scroll} data-gds-inbox-list="">{threadList}</Box>
  );
  const detailRegion = (
    <Box component="section" aria-labelledby={headingId} style={scroll} data-gds-inbox-detail="">
      <GdsStack gap="sm">
        {narrow && hasSelection && onBack ? (
          <Button variant="subtle" size="xs" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
            {t('gds.workspaceInboxTemplate.back', 'Back to conversations')}
          </Button>
        ) : null}
        <Title order={2} size="h4" id={headingId} ref={headingRef} tabIndex={-1}>
          {title}
        </Title>
        {detailLoading
          ? <StateBlock variant="loading" compact titleOrder={3} title={t('gds.workspaceInboxTemplate.loading', 'Loading conversation')} />
          : hasSelection
            ? detail
            : <StateBlock variant="empty" compact titleOrder={3} title={t('gds.workspaceInboxTemplate.noSelection', 'Select a conversation')} />}
      </GdsStack>
    </Box>
  );

  return (
    <PageTemplateFrame id="workspace-inbox" state={state} {...props}>
      <TemplateStateGate
        state={state}
        onRetry={onRetry}
        retryLabel={retryLabel}
        successContent={narrow ? (
          hasSelection ? detailRegion : (
            <GdsStack gap="md">
              {navigation ? <Box component="nav" aria-label={t('gds.workspaceInboxTemplate.navigation', 'Workspace')}>{navigation}</Box> : null}
              {listRegion}
            </GdsStack>
          )
        ) : (
          <Grid gutter="md">
            {navigation ? (
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Box component="nav" aria-label={t('gds.workspaceInboxTemplate.navigation', 'Workspace')} style={scroll}>{navigation}</Box>
              </Grid.Col>
            ) : null}
            <Grid.Col span={{ base: 12, md: navigation ? 4 : 5 }}>{listRegion}</Grid.Col>
            <Grid.Col span={{ base: 12, md: navigation ? 6 : 7 }}>{detailRegion}</Grid.Col>
          </Grid>
        )}
      />
    </PageTemplateFrame>
  );
}
