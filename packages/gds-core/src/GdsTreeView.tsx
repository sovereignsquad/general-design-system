'use client';

import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Box, Button, Group, Loader, Paper, Text } from '@mantine/core';
import { useUncontrolled } from '@mantine/hooks';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** One node of a {@link GdsTreeView}. */
export interface GdsTreeNode {
  /** Unique, stable id; used for expanded and selected state. */
  id: string;
  /** Visible label; also the type-ahead match text. */
  label: string;
  /** Decorative leading icon. */
  icon?: ReactNode;
  /** Loaded children. Leave undefined and set `hasChildren` to load them on first expand. */
  children?: GdsTreeNode[];
  /** The node has children that `loadChildren` fetches on first expand. */
  hasChildren?: boolean;
}

/** Props for {@link GdsTreeView}. */
export interface GdsTreeViewProps {
  /** Top-level nodes. */
  nodes: GdsTreeNode[];
  /** Accessible name of the tree. */
  ariaLabel: string;
  /** Expanded node ids (controlled). */
  expandedIds?: string[];
  /** Initially expanded node ids when uncontrolled. */
  defaultExpandedIds?: string[];
  /** Called with the new expanded ids when a node expands or collapses. */
  onExpandedChange?: (ids: string[]) => void;
  /** Selected node id (controlled). */
  selectedId?: string | null;
  /** Initially selected node id when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called when a node is selected by click, Enter or Space. */
  onSelect?: (id: string, node: GdsTreeNode) => void;
  /** Loads the children of a node with `hasChildren` and no `children`. */
  loadChildren?: (node: GdsTreeNode) => Promise<GdsTreeNode[]>;
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; children: GdsTreeNode[] };

interface VisibleItem {
  node: GdsTreeNode;
  level: number;
  parentId: string | null;
  expandable: boolean;
  expanded: boolean;
  children: GdsTreeNode[] | undefined;
}

/**
 * Hierarchical list following the WAI-ARIA tree pattern: `role="tree"`/`treeitem` with
 * `aria-level`, `aria-expanded` and `aria-selected`, one tab stop (roving tabindex), and
 * Up/Down, Left/Right, Home/End, Enter/Space and first-character type-ahead. Children can be
 * loaded on first expand through `loadChildren`, with loading and error states. Levels indent by
 * `--gds-space-md`; the selected item paints the navigation active roles.
 */
export function GdsTreeView({
  nodes,
  ariaLabel,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  selectedId,
  defaultSelectedId = null,
  onSelect,
  loadChildren,
}: GdsTreeViewProps) {
  const { t } = useGdsTranslation();
  const [expanded, setExpanded] = useUncontrolled<string[]>({ value: expandedIds, defaultValue: defaultExpandedIds, finalValue: [], onChange: onExpandedChange });
  const [selected, setSelected] = useUncontrolled<string | null>({ value: selectedId, defaultValue: defaultSelectedId, finalValue: null });
  const [loads, setLoads] = useState<Record<string, LoadState>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  const childrenOf = useCallback((node: GdsTreeNode): GdsTreeNode[] | undefined => {
    if (node.children) return node.children;
    const load = loads[node.id];
    return load?.status === 'loaded' ? load.children : undefined;
  }, [loads]);

  const visible = useMemo(() => {
    const out: VisibleItem[] = [];
    const walk = (list: GdsTreeNode[], level: number, parentId: string | null) => {
      for (const node of list) {
        const children = childrenOf(node);
        const expandable = Boolean(node.children?.length) || Boolean(node.hasChildren);
        const isExpanded = expandable && expanded.includes(node.id);
        out.push({ node, level, parentId, expandable, expanded: isExpanded, children });
        if (isExpanded && children) walk(children, level + 1, node.id);
      }
    };
    walk(nodes, 1, null);
    return out;
  }, [nodes, expanded, childrenOf]);

  const tabStop = focusedId && visible.some((item) => item.node.id === focusedId)
    ? focusedId
    : (selected && visible.some((item) => item.node.id === selected) ? selected : visible[0]?.node.id);

  const focus = (id: string | undefined) => {
    if (!id) return;
    setFocusedId(id);
    itemRefs.current.get(id)?.focus();
  };

  const load = async (node: GdsTreeNode) => {
    if (!loadChildren || node.children || loads[node.id]?.status === 'loading' || loads[node.id]?.status === 'loaded') return;
    setLoads((prev) => ({ ...prev, [node.id]: { status: 'loading' } }));
    try {
      const children = await loadChildren(node);
      setLoads((prev) => ({ ...prev, [node.id]: { status: 'loaded', children } }));
    } catch {
      setLoads((prev) => ({ ...prev, [node.id]: { status: 'error' } }));
    }
  };

  const setOpen = (item: VisibleItem, open: boolean) => {
    if (!item.expandable || item.expanded === open) return;
    setExpanded(open ? [...expanded, item.node.id] : expanded.filter((id) => id !== item.node.id));
    if (open) void load(item.node);
  };

  const select = (item: VisibleItem) => {
    setSelected(item.node.id);
    onSelect?.(item.node.id, item.node);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const item = visible[index];
    switch (event.key) {
      case 'ArrowDown': focus(visible[index + 1]?.node.id); break;
      case 'ArrowUp': focus(visible[index - 1]?.node.id); break;
      case 'Home': focus(visible[0]?.node.id); break;
      case 'End': focus(visible[visible.length - 1]?.node.id); break;
      case 'ArrowRight':
        if (item.expandable && !item.expanded) setOpen(item, true);
        else if (item.expanded && item.children?.length) focus(visible[index + 1]?.node.id);
        break;
      case 'ArrowLeft':
        if (item.expanded) setOpen(item, false);
        else focus(item.parentId ?? undefined);
        break;
      case 'Enter':
      case ' ':
        select(item);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const key = event.key.toLowerCase();
          const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
          focus(ordered.find((candidate) => candidate.node.label.toLowerCase().startsWith(key))?.node.id);
          break;
        }
        return;
    }
    event.preventDefault();
  };

  const renderLevel = (list: GdsTreeNode[], level: number): ReactNode => list.map((node) => {
    const index = visible.findIndex((item) => item.node.id === node.id);
    const item = visible[index];
    if (!item) return null;
    const loadState = loads[node.id];
    const isSelected = selected === node.id;
    return (
      <Box component="li" role="none" key={node.id} style={{ listStyle: 'none' }}>
        <Box
          ref={(el: HTMLDivElement | null) => { if (el) itemRefs.current.set(node.id, el); else itemRefs.current.delete(node.id); }}
          role="treeitem"
          aria-level={level}
          aria-expanded={item.expandable ? item.expanded : undefined}
          aria-selected={isSelected}
          aria-busy={loadState?.status === 'loading' || undefined}
          tabIndex={tabStop === node.id ? 0 : -1}
          data-gds-tree-item=""
          data-selected={isSelected || undefined}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => onKeyDown(event, index)}
          onFocus={() => setFocusedId(node.id)}
          onClick={() => { select(item); if (item.expandable) setOpen(item, !item.expanded); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--gds-space-xs)',
            minHeight: 'var(--gds-control-height-sm)',
            paddingInlineStart: `calc(var(--gds-space-xs) + ${level - 1} * var(--gds-space-md))`,
            paddingInlineEnd: 'var(--gds-space-xs)',
            borderRadius: 'var(--gds-radius-sm)',
            cursor: 'pointer',
            background: isSelected ? 'var(--gds-nav-active-bg)' : undefined,
            color: isSelected ? 'var(--gds-nav-active-fg)' : undefined,
          }}
        >
          <Box component="span" aria-hidden="true" style={{ inlineSize: 'var(--gds-space-md)', flex: 'none', textAlign: 'center' }}>
            {item.expandable ? (item.expanded ? '▾' : '▸') : ''}
          </Box>
          {node.icon ? <Box component="span" aria-hidden="true" style={{ display: 'inline-flex' }}>{node.icon}</Box> : null}
          <Text component="span" size="sm">{node.label}</Text>
        </Box>
        {item.expanded ? (
          <Box component="ul" role="group" style={{ margin: 0, padding: 0 }}>
            {loadState?.status === 'loading' ? (
              <Box component="li" role="none" style={{ listStyle: 'none', paddingInlineStart: `calc(var(--gds-space-xs) + ${level} * var(--gds-space-md))` }}>
                <Group gap="xs"><Loader size="xs" /><Text size="sm">{t('gds.treeView.loading', 'Loading…')}</Text></Group>
              </Box>
            ) : null}
            {loadState?.status === 'error' ? (
              <Box component="li" role="none" style={{ listStyle: 'none', paddingInlineStart: `calc(var(--gds-space-xs) + ${level} * var(--gds-space-md))` }}>
                <Group gap="xs">
                  <Text size="sm" role="alert">{t('gds.treeView.loadError', 'Could not load these items.')}</Text>
                  <Button size="compact-xs" variant="subtle" onClick={() => void load(node)}>
                    {t('gds.treeView.retry', 'Retry')}
                  </Button>
                </Group>
              </Box>
            ) : null}
            {item.children ? renderLevel(item.children, level + 1) : null}
          </Box>
        ) : null}
      </Box>
    );
  });

  return (
    <Paper withBorder p="xs" style={{ ['--paper-border-color' as string]: 'var(--gds-border-subtle)' }} data-gds-tree-view="">
      <Box component="ul" role="tree" aria-label={ariaLabel} style={{ margin: 0, padding: 0 }}>
        {renderLevel(nodes, 1)}
      </Box>
    </Paper>
  );
}
