'use client';

import type { ReactNode } from 'react';
import { ActionIcon, Badge, Box, Group, Menu, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import type { MantineBreakpoint } from '@mantine/core';
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

export interface KanbanCardProps {
  item: KanbanItem;
  column: KanbanColumnData;
  columns: KanbanColumnData[];
  onMoveItem?: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  renderItem?: (item: KanbanItem, column: KanbanColumnData) => ReactNode;
}

export function KanbanCard({ item, column, columns, onMoveItem, renderItem }: KanbanCardProps) {
  const { t } = useGdsTranslation();
  const moveTargets = columns.filter((candidate) => candidate.id !== column.id);
  const accessibleName = item.ariaLabel ?? (typeof item.title === 'string' ? item.title : undefined);
  const moveLabel = accessibleName
    ? `${t('gds.kanban.moveItem', 'Move')}: ${accessibleName}`
    : t('gds.kanban.moveItem', 'Move');

  return (
    <Paper withBorder radius="md" p="sm" data-gds-kanban-card={item.id}>
      <Stack gap={6}>
        <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
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
  onMoveItem?: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  renderItem?: (item: KanbanItem, column: KanbanColumnData) => ReactNode;
  emptyLabel?: ReactNode;
  width?: number | string;
}

export function KanbanColumn({ column, columns, onMoveItem, renderItem, emptyLabel, width }: KanbanColumnProps) {
  const { t } = useGdsTranslation();

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
        {column.items.length ? (
          <Stack gap="xs">
            {column.items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                column={column}
                columns={columns}
                onMoveItem={onMoveItem}
                renderItem={renderItem}
              />
            ))}
          </Stack>
        ) : (
          <Text size="xs" c="dimmed">
            {emptyLabel ?? t('gds.kanban.emptyColumn', 'No items')}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

export interface KanbanBoardProps {
  title?: ReactNode;
  columns: KanbanColumnData[];
  /** Called when a card's move menu selects a target column. Omit to render a read-only board. */
  onMoveItem?: (itemId: string, fromColumnId: string, toColumnId: string) => void;
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
}

/**
 * Governed responsive kanban board. Portrait mobile viewports render one stacked column
 * per row; landscape, tablet, and desktop viewports render multi-column with horizontal
 * scroll — resolved automatically via `useGdsKanbanOrientation`, no consumer CSS required.
 * Reordering uses a keyboard-accessible "move to column" menu per card instead of native
 * HTML5 drag-and-drop, which cannot be operated by keyboard or screen-reader users.
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
}: KanbanBoardProps) {
  const { t } = useGdsTranslation();
  const autoOrientation = useGdsKanbanOrientation();
  const resolvedOrientation = orientation === 'auto' ? autoOrientation : orientation;
  const regionLabel = boardLabel ?? (typeof title === 'string' ? title : t('gds.kanban.boardLabel', 'Kanban board'));

  return (
    <Stack gap="md" role="region" aria-label={regionLabel} data-gds-kanban-orientation={resolvedOrientation}>
      {title ? typeof title === 'string' ? <Title order={3}>{title}</Title> : title : null}
      {resolvedOrientation === 'stacked' ? (
        <Stack gap="lg">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              columns={columns}
              onMoveItem={onMoveItem}
              renderItem={renderItem}
              emptyLabel={emptyColumnLabel}
            />
          ))}
        </Stack>
      ) : (
        <ScrollArea type="auto" scrollbarSize={8} offsetScrollbars>
          <Group gap="md" wrap="nowrap" align="flex-start">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columns={columns}
                onMoveItem={onMoveItem}
                renderItem={renderItem}
                emptyLabel={emptyColumnLabel}
                width={columnWidth}
              />
            ))}
          </Group>
        </ScrollArea>
      )}
    </Stack>
  );
}
