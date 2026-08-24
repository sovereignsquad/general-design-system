'use client';

import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { ActionIcon, Badge, Box, Group, Menu, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import type { MantineBreakpoint } from '@mantine/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GdsIcon } from './icons';
import { gdsBreakpointByAlias } from './breakpoints';

/** A single card on the kanban board. */
export interface KanbanItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  /** Accessible name for the move action when `title` is not plain text. */
  ariaLabel?: string;
}

/** A column and the items it holds. */
export interface KanbanColumnData<TItem extends KanbanItem = KanbanItem> {
  id: string;
  /**
   * Column heading. A plain string renders as a governed `<Title>`; a
   * `ReactNode` (icon + label, a colored dot, a custom count pill, …) renders
   * verbatim. When `title` is not a plain string, set `ariaLabel` so move-menu
   * targets and drag announcements still have a meaningful accessible name.
   */
  title: ReactNode;
  items: TItem[];
  /**
   * Real total for server-paginated columns, where `items` holds only the
   * currently-loaded page. The header count badge prefers this when present and
   * falls back to `items.length` when omitted — so existing consumers see zero
   * behavior change on upgrade.
   */
  totalCount?: number;
  /** Accessible name for move-menu targets and drag announcements when `title` is not plain text. */
  ariaLabel?: string;
}

/** Board layout: a single `'stacked'` column per row, or side-by-side `'columns'`. */
export type KanbanOrientation = 'stacked' | 'columns';

/** Options for {@link useGdsKanbanOrientation}. */
export interface UseGdsKanbanOrientationOptions {
  /**
   * Width, at or below which a portrait viewport is treated as "mobile" (1-column stacked).
   * Portrait viewports wider than this (tablets) and any landscape viewport render multi-column.
   * Defaults to the `xs` alias (36em / ~576px).
   */
  stackedBreakpoint?: MantineBreakpoint;
}

/**
 * Resolves the governed kanban layout: portrait mobile renders a single stacked
 * column per row, everything else (landscape phones, tablets, desktop) renders
 * multi-column. Consumers never need custom CSS or local breakpoint logic.
 */
export function useGdsKanbanOrientation({
  stackedBreakpoint = 'xs',
}: UseGdsKanbanOrientationOptions = {}): KanbanOrientation {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isNarrow = useMediaQuery(`(max-width: ${gdsBreakpointByAlias[stackedBreakpoint as keyof typeof gdsBreakpointByAlias]})`);
  return isPortrait && isNarrow ? 'stacked' : 'columns';
}

type OnMoveItem = (itemId: string, fromColumnId: string, toColumnId: string, toIndex?: number) => void;

/** Column-level footer renderer (pagination / "load more" / per-column actions). */
type RenderColumnFooter<TColumn> = (column: TColumn) => ReactNode;

/** Small decorative six-dot grip glyph for the drag handle. Not a semantic GDS icon —
 * this is a structural micro-affordance specific to the drag gesture, not a general
 * action, so it doesn't go through the `GdsIcon`/`GdsIcons` registry. */
function DragGripGlyph() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true" focusable="false">
      {[2, 8].flatMap((x) =>
        [2, 8, 14].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill="currentColor" />),
      )}
    </svg>
  );
}

/** Decorative chevron for the collapse/expand toggle — points down when expanded,
 * right when collapsed. Structural affordance specific to the disclosure control,
 * so (like the drag grip) it is not a registry `GdsIcon`. */
function ColumnDisclosureGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
      style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform var(--gds-motion-duration-fast, 120ms) var(--gds-motion-ease-standard, ease)' }}
    >
      <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Resolves a plain-text accessible name for a column whose `title` may be a ReactNode. */
function columnTitleText(column: KanbanColumnData | undefined): string {
  if (!column) return '';
  return column.ariaLabel ?? (typeof column.title === 'string' ? column.title : column.id);
}

/** Props for {@link KanbanCard}. */
export interface KanbanCardProps<
  TItem extends KanbanItem = KanbanItem,
  TColumn extends KanbanColumnData<TItem> = KanbanColumnData<TItem>,
> {
  item: TItem;
  column: TColumn;
  columns: TColumn[];
  /** Called on a menu-driven or drag-driven move. `toIndex` is only populated by drag. */
  onMoveItem?: OnMoveItem;
  renderItem?: (item: TItem, column: TColumn) => ReactNode;
  /** Renders an additional pointer/touch/keyboard drag handle alongside the Move menu. */
  enableDrag?: boolean;
  /**
   * Icon for the "move to column" **menu** trigger. Defaults to a `More`
   * (vertical-dots) glyph — a "tap to open a menu" affordance that deliberately
   * does NOT imply free drag, since this control is a tap-to-open destination
   * picker, not a drag handle (the drag handle is separate and gated by
   * `enableDrag`). Override only if your icon set has a better "pick a
   * destination" glyph; avoid drag-implying icons here.
   */
  moveMenuIcon?: ReactNode;
  /** Overrides the verb in the move-menu trigger's accessible label (default `"Move"`); the item name is still appended when available. */
  moveMenuLabel?: string;
}

/**
 * A single governed kanban card: renders the item body, an always-available
 * "move to column" menu (the accessible-equivalent reorder path), and, when
 * `enableDrag` is set, an accessible drag handle built on `@dnd-kit`.
 */
export function KanbanCard<
  TItem extends KanbanItem = KanbanItem,
  TColumn extends KanbanColumnData<TItem> = KanbanColumnData<TItem>,
>({ item, column, columns, onMoveItem, renderItem, enableDrag, moveMenuIcon, moveMenuLabel }: KanbanCardProps<TItem, TColumn>) {
  const { t } = useGdsTranslation();
  const moveTargets = columns.filter((candidate) => candidate.id !== column.id);
  const accessibleName = item.ariaLabel ?? (typeof item.title === 'string' ? item.title : undefined);
  const moveVerb = moveMenuLabel ?? t('gds.kanban.moveItem', 'Move');
  const moveLabel = accessibleName ? `${moveVerb}: ${accessibleName}` : moveVerb;
  const dragHandleLabel = accessibleName
    ? `${t('gds.kanban.dragHandle', 'Drag to reorder')}: ${accessibleName}`
    : t('gds.kanban.dragHandle', 'Drag to reorder');

  const sortable = useSortable({ id: item.id, disabled: !enableDrag });
  const dragStyle = enableDrag
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.4 : 1,
      }
    : undefined;

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      data-gds-kanban-card={item.id}
      ref={enableDrag ? sortable.setNodeRef : undefined}
      style={dragStyle}
    >
      <Stack gap={6}>
        <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
          {enableDrag ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              data-gds-target-exception="dense-toolbar"
              aria-label={dragHandleLabel}
              ref={sortable.setActivatorNodeRef}
              style={{ cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
              {...sortable.listeners}
              {...sortable.attributes}
            >
              <DragGripGlyph />
            </ActionIcon>
          ) : null}
          <Box style={{ minWidth: 0, flex: 1 }}>
            {renderItem ? (
              renderItem(item, column)
            ) : (
              <Stack gap={2}>
                {typeof item.title === 'string' ? (
                  <Text fw={600} size="sm">
                    {item.title}
                  </Text>
                ) : (
                  item.title
                )}
                {item.description ? (
                  <Text size="xs" c="dimmed">
                    {item.description}
                  </Text>
                ) : null}
              </Stack>
            )}
          </Box>
          {onMoveItem && moveTargets.length > 0 ? (
            <Menu withinPortal position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm" data-gds-target-exception="dense-toolbar" aria-label={moveLabel}>
                  {moveMenuIcon ?? <GdsIcon icon="More" decorative />}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {moveTargets.map((target) => (
                  <Menu.Item key={target.id} onClick={() => onMoveItem(item.id, column.id, target.id)}>
                    {t('gds.kanban.moveTo', 'Move to')} {target.title}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          ) : null}
        </Group>
        {item.status ? (
          <Badge variant="light" size="sm">
            {item.status}
          </Badge>
        ) : null}
      </Stack>
    </Paper>
  );
}

/** Props for {@link KanbanColumn}. */
export interface KanbanColumnProps<
  TItem extends KanbanItem = KanbanItem,
  TColumn extends KanbanColumnData<TItem> = KanbanColumnData<TItem>,
> {
  column: TColumn;
  columns: TColumn[];
  onMoveItem?: OnMoveItem;
  renderItem?: (item: TItem, column: TColumn) => ReactNode;
  emptyLabel?: ReactNode;
  width?: number | string;
  enableDrag?: boolean;
  moveMenuIcon?: ReactNode;
  moveMenuLabel?: string;
  /** Static element rendered below the card list, inside the column (pagination / "load more" / per-column actions). */
  footer?: ReactNode;
  /** Function form of `footer`, receiving the column; takes precedence over `footer` when both are set. */
  renderFooter?: RenderColumnFooter<TColumn>;
  /**
   * Renders a header disclosure toggle that collapses the column body (cards +
   * footer) to just its title and count. Off by default — existing consumers
   * see no toggle. A collapsed column is not a drag drop target.
   */
  collapsible?: boolean;
  /** Controlled collapsed state. Omit for uncontrolled (the column manages its own state). */
  collapsed?: boolean;
  /** Notified when the disclosure toggle changes the collapsed state. */
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * A single kanban column: header with title and count badge, the card list (a
 * droppable region when drag is enabled), an optional footer, and an optional
 * collapse/expand disclosure toggle.
 */
export function KanbanColumn<
  TItem extends KanbanItem = KanbanItem,
  TColumn extends KanbanColumnData<TItem> = KanbanColumnData<TItem>,
>({
  column,
  columns,
  onMoveItem,
  renderItem,
  emptyLabel,
  width,
  enableDrag,
  moveMenuIcon,
  moveMenuLabel,
  footer,
  renderFooter,
  collapsible = false,
  collapsed,
  onCollapsedChange,
}: KanbanColumnProps<TItem, TColumn>) {
  const { t } = useGdsTranslation();
  // A droppable region keyed by the column id itself, so dropping on an empty column
  // (or in the empty space below the last card) resolves to this column even though
  // there's no sibling card to land "over".
  const droppable = useDroppable({ id: column.id, disabled: !enableDrag });

  const isControlledCollapse = collapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const resolvedCollapsed = collapsible ? (isControlledCollapse ? Boolean(collapsed) : internalCollapsed) : false;
  const bodyId = useId();

  function handleToggleCollapsed() {
    const next = !resolvedCollapsed;
    if (!isControlledCollapse) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  }

  const columnName = columnTitleText(column);
  const toggleVerb = resolvedCollapsed
    ? t('gds.kanban.expandColumn', 'Expand column')
    : t('gds.kanban.collapseColumn', 'Collapse column');
  const toggleLabel = columnName ? `${toggleVerb}: ${columnName}` : toggleVerb;

  const count = column.totalCount ?? column.items.length;

  const cards = column.items.length ? (
    <Stack gap="xs" ref={enableDrag ? droppable.setNodeRef : undefined} data-gds-kanban-drop-zone={column.id}>
      {column.items.map((item) => (
        <KanbanCard<TItem, TColumn>
          key={item.id}
          item={item}
          column={column}
          columns={columns}
          onMoveItem={onMoveItem}
          renderItem={renderItem}
          enableDrag={enableDrag}
          moveMenuIcon={moveMenuIcon}
          moveMenuLabel={moveMenuLabel}
        />
      ))}
    </Stack>
  ) : (
    <Text
      size="xs"
      c="dimmed"
      ref={enableDrag ? droppable.setNodeRef : undefined}
      data-gds-kanban-drop-zone={column.id}
    >
      {emptyLabel ?? t('gds.kanban.emptyColumn', 'No items')}
    </Text>
  );

  const footerNode = renderFooter ? renderFooter(column) : footer;

  const body = (
    <>
      {enableDrag ? (
        <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {cards}
        </SortableContext>
      ) : (
        cards
      )}
      {footerNode != null && footerNode !== false ? (
        <Box data-gds-kanban-footer={column.id}>{footerNode}</Box>
      ) : null}
    </>
  );

  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      style={width ? { minWidth: width, flex: '0 0 auto' } : undefined}
      data-gds-kanban-column={column.id}
      data-gds-kanban-column-collapsed={collapsible && resolvedCollapsed ? 'true' : undefined}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="nowrap" data-gds-kanban-column-header={column.id}>
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            {collapsible ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                data-gds-target-exception="dense-toolbar"
                aria-label={toggleLabel}
                aria-expanded={!resolvedCollapsed}
                aria-controls={bodyId}
                onClick={handleToggleCollapsed}
                style={{ flexShrink: 0 }}
              >
                <ColumnDisclosureGlyph collapsed={resolvedCollapsed} />
              </ActionIcon>
            ) : null}
            <Title order={4}>{column.title}</Title>
          </Group>
          <Badge variant="light">{count}</Badge>
        </Group>
        {collapsible ? (
          <div id={bodyId} hidden={resolvedCollapsed} data-gds-kanban-column-body={column.id}>
            {resolvedCollapsed ? null : <Stack gap="sm">{body}</Stack>}
          </div>
        ) : (
          body
        )}
      </Stack>
    </Paper>
  );
}

/** Props for {@link KanbanBoard}. */
export interface KanbanBoardProps<
  TItem extends KanbanItem = KanbanItem,
  TColumn extends KanbanColumnData<TItem> = KanbanColumnData<TItem>,
> {
  title?: ReactNode;
  columns: TColumn[];
  /** Called when a card's move menu selects a target column, or (with `enableDrag`) when a
   * drag gesture completes. `toIndex` is only populated by drag; menu-driven moves append
   * to the end of the target column, matching existing behavior. Omit to render a read-only board. */
  onMoveItem?: OnMoveItem;
  /** Custom card body renderer. The card shell, border, and move action remain governed. */
  renderItem?: (item: TItem, column: TColumn) => ReactNode;
  emptyColumnLabel?: ReactNode;
  /**
   * `'auto'` (default) resolves the governed responsive rule via `useGdsKanbanOrientation`:
   * portrait mobile stacks columns vertically; landscape, tablet, and desktop render
   * multi-column with horizontal scroll. Force `'stacked'`/`'columns'` only for fixed layouts
   * (e.g. a dedicated mobile-only or desktop-only route).
   */
  orientation?: 'auto' | KanbanOrientation;
  /** Minimum column width in multi-column layout. Defaults to `'17.5rem'` (scales with root font size). */
  columnWidth?: number | string;
  /**
   * Wheel-gesture routing over the multi-column horizontal scroll area (issue 464).
   * Defaults to `'none'`: no interception — a wheel/trackpad gesture behaves natively
   * (a vertical gesture chains to the page), fully backward compatible.
   *
   * `'header'` opts into Linear-style zone routing on **fine-pointer (desktop)** only:
   * a wheel gesture whose target is a column **header** (`data-gds-kanban-column-header`)
   * pans the columns horizontally regardless of gesture shape, while a gesture anywhere
   * else (a card, empty space) is never captured and scrolls the page as usual. Inert in
   * `'stacked'` orientation (there is no horizontal scroll area). RTL-aware.
   */
  columnPanZone?: 'header' | 'none';
  /** Accessible name for the board region. Defaults to `title` (if a string) or a governed fallback. */
  boardLabel?: string;
  /**
   * Opt-in pointer/touch/keyboard drag-and-drop, in addition to (never instead of) the
   * "Move to column" menu, which stays rendered and fully functional either way — it is
   * the guaranteed accessible-equivalent fallback, not a mode that disappears when drag is
   * enabled. Defaults to `false`: existing consumers see zero behavior change on upgrade.
   * No native HTML5 `draggable`/`dragstart` is used (that remains prohibited — it cannot be
   * operated by keyboard or screen-reader users); this is built on `@dnd-kit`'s pointer and
   * keyboard sensors, which ship their own accessible keyboard-drag path independent of the
   * Move menu. Requires `onMoveItem`; has no effect on a read-only board.
   */
  enableDrag?: boolean;
  /**
   * Icon for each card's "move to column" **menu** trigger. Defaults to a `More`
   * (vertical-dots) glyph — a "tap to open a menu" affordance that intentionally
   * does not imply free drag. The move menu is a tap-to-open destination picker
   * (always available, the accessible-equivalent fallback), distinct from the
   * `enableDrag` drag **handle**, which is the only control that implies physical
   * dragging — so this icon stays the same whether `enableDrag` is on or off.
   * Override only with another non-drag "pick a destination" glyph.
   */
  moveMenuIcon?: ReactNode;
  /** Overrides the verb in each move-menu trigger's accessible label (default `"Move"`); the item name is still appended when available. */
  moveMenuLabel?: string;
  /** Per-column footer renderer, applied to every column (pagination / "load more" / per-column actions). */
  renderColumnFooter?: RenderColumnFooter<TColumn>;
  /**
   * Enables the per-column collapse/expand disclosure toggle on every column.
   * Off by default. Pair with `collapsedColumnIds` + `onCollapsedChange` to control
   * collapsed state, or leave those unset for uncontrolled per-column state.
   */
  collapsible?: boolean;
  /** Controlled set of collapsed column ids. Omit for uncontrolled (the board manages its own state). */
  collapsedColumnIds?: string[];
  /** Notified with the column id and its new collapsed state whenever a column's toggle changes. */
  onCollapsedChange?: (columnId: string, collapsed: boolean) => void;
}

function findColumnByItemId<TColumn extends KanbanColumnData>(
  columns: TColumn[],
  itemId: string,
): TColumn | undefined {
  return columns.find((column) => column.items.some((item) => item.id === itemId));
}

function itemTitleText(item: KanbanItem | undefined) {
  if (!item) return '';
  return item.ariaLabel ?? (typeof item.title === 'string' ? item.title : item.id);
}

/**
 * Governed responsive kanban board. Portrait mobile viewports render one stacked column
 * per row; landscape, tablet, and desktop viewports render multi-column with horizontal
 * scroll — resolved automatically via `useGdsKanbanOrientation`, no consumer CSS required.
 * Reordering always offers a keyboard-accessible "move to column" menu per card. Native
 * HTML5 drag-and-drop is never used (it cannot be operated by keyboard or screen-reader
 * users); an opt-in pointer/touch/keyboard drag affordance (`enableDrag`) is available
 * alongside it, built on `@dnd-kit`'s accessible sensors rather than native `draggable`.
 */
export function KanbanBoard<
  TItem extends KanbanItem = KanbanItem,
  TColumn extends KanbanColumnData<TItem> = KanbanColumnData<TItem>,
>({
  title,
  columns,
  onMoveItem,
  renderItem,
  emptyColumnLabel,
  orientation = 'auto',
  columnWidth = '17.5rem',
  columnPanZone = 'none',
  boardLabel,
  enableDrag = false,
  moveMenuIcon,
  moveMenuLabel,
  renderColumnFooter,
  collapsible = false,
  collapsedColumnIds,
  onCollapsedChange,
}: KanbanBoardProps<TItem, TColumn>) {
  const { t } = useGdsTranslation();
  const autoOrientation = useGdsKanbanOrientation();
  const resolvedOrientation = orientation === 'auto' ? autoOrientation : orientation;
  const regionLabel = boardLabel ?? (typeof title === 'string' ? title : t('gds.kanban.boardLabel', 'Kanban board'));
  const [activeItem, setActiveItem] = useState<{ item: TItem; column: TColumn } | null>(null);
  const [internalCollapsedIds, setInternalCollapsedIds] = useState<string[]>([]);
  const isCollapseControlled = collapsedColumnIds !== undefined;
  const collapsedIds = isCollapseControlled ? collapsedColumnIds : internalCollapsedIds;

  // Zone-based wheel routing (#464): when `columnPanZone === 'header'`, a wheel gesture
  // originating over a column header pans the horizontal scroll area, while gestures over
  // cards/empty space fall through to native scroll chaining. One non-passive listener on
  // the viewport (so it can `preventDefault`), fine-pointer only, columns orientation only.
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || columnPanZone !== 'header' || resolvedOrientation === 'stacked') {
      return undefined;
    }
    if (typeof window === 'undefined' || !window.matchMedia?.('(pointer: fine)').matches) {
      return undefined;
    }
    const onWheel = (event: WheelEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.('[data-gds-kanban-column-header]')) {
        return; // Not the header zone — leave native scroll chaining untouched.
      }
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      if (delta === 0) return;
      const rtl = getComputedStyle(viewport).direction === 'rtl';
      viewport.scrollLeft += rtl ? -delta : delta;
      event.preventDefault();
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [columnPanZone, resolvedOrientation]);

  function handleColumnCollapsedChange(columnId: string, next: boolean) {
    if (!isCollapseControlled) {
      setInternalCollapsedIds((prev) =>
        next ? (prev.includes(columnId) ? prev : [...prev, columnId]) : prev.filter((id) => id !== columnId),
      );
    }
    onCollapsedChange?.(columnId, next);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const dragActive = enableDrag && Boolean(onMoveItem);

  function handleDragStart(event: DragStartEvent) {
    const fromColumn = findColumnByItemId(columns, String(event.active.id));
    const item = fromColumn?.items.find((candidate) => candidate.id === event.active.id);
    if (fromColumn && item) {
      setActiveItem({ item, column: fromColumn });
    }
  }

  function handleDragCancel() {
    setActiveItem(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || !onMoveItem) return;

    const itemId = String(active.id);
    const fromColumn = findColumnByItemId(columns, itemId);
    if (!fromColumn) return;

    const overId = String(over.id);
    const overIsColumn = columns.some((column) => column.id === overId);
    const toColumn = overIsColumn ? columns.find((column) => column.id === overId) : findColumnByItemId(columns, overId);
    if (!toColumn) return;

    const toIndex = overIsColumn
      ? toColumn.items.length
      : toColumn.items.findIndex((candidate) => candidate.id === overId);

    if (fromColumn.id === toColumn.id && toIndex === fromColumn.items.findIndex((candidate) => candidate.id === itemId)) {
      return;
    }

    onMoveItem(itemId, fromColumn.id, toColumn.id, toIndex < 0 ? toColumn.items.length : toIndex);
  }

  // Localized live-region announcements for the dnd-kit keyboard/pointer drag path,
  // read from title/column names instead of raw ids so they're actually meaningful to
  // screen-reader users (dnd-kit's own defaults announce "item {id}" verbatim).
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const item = findColumnByItemId(columns, String(active.id))?.items.find((candidate) => candidate.id === active.id);
      return `${t('gds.kanban.announcePickedUp', 'Picked up')} ${itemTitleText(item)}`;
    },
    onDragOver: ({ active, over }) => {
      const item = findColumnByItemId(columns, String(active.id))?.items.find((candidate) => candidate.id === active.id);
      if (!over) {
        return `${itemTitleText(item)} ${t('gds.kanban.announceOverNone', 'is no longer over a column')}`;
      }
      const overId = String(over.id);
      const column = columns.find((candidate) => candidate.id === overId) ?? findColumnByItemId(columns, overId);
      return `${itemTitleText(item)} ${t('gds.kanban.announceOverColumn', 'is over')} ${columnTitleText(column)}`;
    },
    onDragEnd: ({ active, over }) => {
      const item = findColumnByItemId(columns, String(active.id))?.items.find((candidate) => candidate.id === active.id);
      if (!over) {
        return `${itemTitleText(item)} ${t('gds.kanban.announceDroppedNone', 'was returned to its original position')}`;
      }
      const overId = String(over.id);
      const column = columns.find((candidate) => candidate.id === overId) ?? findColumnByItemId(columns, overId);
      return `${itemTitleText(item)} ${t('gds.kanban.announceDropped', 'was moved to')} ${columnTitleText(column)}`;
    },
    onDragCancel: ({ active }) => {
      const item = findColumnByItemId(columns, String(active.id))?.items.find((candidate) => candidate.id === active.id);
      return `${t('gds.kanban.announceCancelled', 'Reordering cancelled for')} ${itemTitleText(item)}`;
    },
  };
  const screenReaderInstructions = {
    draggable: t(
      'gds.kanban.dragInstructions',
      'To pick up a card, press the space bar. While dragging, use the arrow keys to move the card between and within columns. Press space again to drop the card, or press escape to cancel.',
    ),
  };

  const columnList = (width: number | string | undefined) =>
    columns.map((column) => (
      <KanbanColumn<TItem, TColumn>
        key={column.id}
        column={column}
        columns={columns}
        onMoveItem={onMoveItem}
        renderItem={renderItem}
        emptyLabel={emptyColumnLabel}
        enableDrag={dragActive}
        width={width}
        moveMenuIcon={moveMenuIcon}
        moveMenuLabel={moveMenuLabel}
        renderFooter={renderColumnFooter}
        collapsible={collapsible}
        collapsed={collapsible ? collapsedIds.includes(column.id) : undefined}
        onCollapsedChange={(next) => handleColumnCollapsedChange(column.id, next)}
      />
    ));

  const board = (
    <Stack gap="md" role="region" aria-label={regionLabel} data-gds-kanban-orientation={resolvedOrientation}>
      {title ? typeof title === 'string' ? <Title order={3}>{title}</Title> : title : null}
      {resolvedOrientation === 'stacked' ? (
        <Stack gap="lg">{columnList(undefined)}</Stack>
      ) : (
        <ScrollArea type="auto" scrollbarSize={8} offsetScrollbars viewportRef={viewportRef}>
          <Group gap="md" wrap="nowrap" align="flex-start">
            {columnList(columnWidth)}
          </Group>
        </ScrollArea>
      )}
    </Stack>
  );

  if (!dragActive) {
    return board;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      {board}
      <DragOverlay>
        {activeItem ? (
          <Paper withBorder radius="md" p="sm" shadow="md">
            <Stack gap={2}>
              {typeof activeItem.item.title === 'string' ? (
                <Text fw={600} size="sm">
                  {activeItem.item.title}
                </Text>
              ) : (
                activeItem.item.title
              )}
            </Stack>
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
