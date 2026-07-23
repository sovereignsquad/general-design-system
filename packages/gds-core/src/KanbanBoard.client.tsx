'use client';

import { type ReactNode, useState } from 'react';
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

export interface KanbanItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  /** Accessible name for the move action when `title` is not plain text. */
  ariaLabel?: string;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  items: KanbanItem[];
}

export type KanbanOrientation = 'stacked' | 'columns';

const breakpointByAlias: Record<MantineBreakpoint, string> = {
  xs: '36em',
  sm: '48em',
  md: '62em',
  lg: '75em',
  xl: '88em',
};

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
  const isNarrow = useMediaQuery(`(max-width: ${breakpointByAlias[stackedBreakpoint]})`);
  return isPortrait && isNarrow ? 'stacked' : 'columns';
}

type OnMoveItem = (itemId: string, fromColumnId: string, toColumnId: string, toIndex?: number) => void;

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

export interface KanbanCardProps {
  item: KanbanItem;
  column: KanbanColumnData;
  columns: KanbanColumnData[];
  /** Called on a menu-driven or drag-driven move. `toIndex` is only populated by drag. */
  onMoveItem?: OnMoveItem;
  renderItem?: (item: KanbanItem, column: KanbanColumnData) => ReactNode;
  /** Renders an additional pointer/touch/keyboard drag handle alongside the Move menu. */
  enableDrag?: boolean;
}

export function KanbanCard({ item, column, columns, onMoveItem, renderItem, enableDrag }: KanbanCardProps) {
  const { t } = useGdsTranslation();
  const moveTargets = columns.filter((candidate) => candidate.id !== column.id);
  const accessibleName = item.ariaLabel ?? (typeof item.title === 'string' ? item.title : undefined);
  const moveLabel = accessibleName
    ? `${t('gds.kanban.moveItem', 'Move')}: ${accessibleName}`
    : t('gds.kanban.moveItem', 'Move');
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
                <ActionIcon variant="subtle" color="gray" size="sm" aria-label={moveLabel}>
                  <GdsIcon icon="Move" decorative />
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

export interface KanbanColumnProps {
  column: KanbanColumnData;
  columns: KanbanColumnData[];
  onMoveItem?: OnMoveItem;
  renderItem?: (item: KanbanItem, column: KanbanColumnData) => ReactNode;
  emptyLabel?: ReactNode;
  width?: number | string;
  enableDrag?: boolean;
}

export function KanbanColumn({ column, columns, onMoveItem, renderItem, emptyLabel, width, enableDrag }: KanbanColumnProps) {
  const { t } = useGdsTranslation();
  // A droppable region keyed by the column id itself, so dropping on an empty column
  // (or in the empty space below the last card) resolves to this column even though
  // there's no sibling card to land "over".
  const droppable = useDroppable({ id: column.id, disabled: !enableDrag });

  const cards = column.items.length ? (
    <Stack gap="xs" ref={enableDrag ? droppable.setNodeRef : undefined} data-gds-kanban-drop-zone={column.id}>
      {column.items.map((item) => (
        <KanbanCard
          key={item.id}
          item={item}
          column={column}
          columns={columns}
          onMoveItem={onMoveItem}
          renderItem={renderItem}
          enableDrag={enableDrag}
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

  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      style={width ? { minWidth: width, flex: '0 0 auto' } : undefined}
      data-gds-kanban-column={column.id}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title order={4}>{column.title}</Title>
          <Badge variant="light">{column.items.length}</Badge>
        </Group>
        {enableDrag ? (
          <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {cards}
          </SortableContext>
        ) : (
          cards
        )}
      </Stack>
    </Paper>
  );
}

export interface KanbanBoardProps {
  title?: ReactNode;
  columns: KanbanColumnData[];
  /** Called when a card's move menu selects a target column, or (with `enableDrag`) when a
   * drag gesture completes. `toIndex` is only populated by drag; menu-driven moves append
   * to the end of the target column, matching existing behavior. Omit to render a read-only board. */
  onMoveItem?: OnMoveItem;
  /** Custom card body renderer. The card shell, border, and move action remain governed. */
  renderItem?: (item: KanbanItem, column: KanbanColumnData) => ReactNode;
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
}

function findColumnByItemId(columns: KanbanColumnData[], itemId: string) {
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
export function KanbanBoard({
  title,
  columns,
  onMoveItem,
  renderItem,
  emptyColumnLabel,
  orientation = 'auto',
  columnWidth = '17.5rem',
  boardLabel,
  enableDrag = false,
}: KanbanBoardProps) {
  const { t } = useGdsTranslation();
  const autoOrientation = useGdsKanbanOrientation();
  const resolvedOrientation = orientation === 'auto' ? autoOrientation : orientation;
  const regionLabel = boardLabel ?? (typeof title === 'string' ? title : t('gds.kanban.boardLabel', 'Kanban board'));
  const [activeItem, setActiveItem] = useState<{ item: KanbanItem; column: KanbanColumnData } | null>(null);

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
      return `${itemTitleText(item)} ${t('gds.kanban.announceOverColumn', 'is over')} ${column?.title ?? ''}`;
    },
    onDragEnd: ({ active, over }) => {
      const item = findColumnByItemId(columns, String(active.id))?.items.find((candidate) => candidate.id === active.id);
      if (!over) {
        return `${itemTitleText(item)} ${t('gds.kanban.announceDroppedNone', 'was returned to its original position')}`;
      }
      const overId = String(over.id);
      const column = columns.find((candidate) => candidate.id === overId) ?? findColumnByItemId(columns, overId);
      return `${itemTitleText(item)} ${t('gds.kanban.announceDropped', 'was moved to')} ${column?.title ?? ''}`;
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
      <KanbanColumn
        key={column.id}
        column={column}
        columns={columns}
        onMoveItem={onMoveItem}
        renderItem={renderItem}
        emptyLabel={emptyColumnLabel}
        enableDrag={dragActive}
        width={width}
      />
    ));

  const board = (
    <Stack gap="md" role="region" aria-label={regionLabel} data-gds-kanban-orientation={resolvedOrientation}>
      {title ? typeof title === 'string' ? <Title order={3}>{title}</Title> : title : null}
      {resolvedOrientation === 'stacked' ? (
        <Stack gap="lg">{columnList(undefined)}</Stack>
      ) : (
        <ScrollArea type="auto" scrollbarSize={8} offsetScrollbars>
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
