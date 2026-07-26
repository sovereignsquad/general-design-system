'use client';

import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

/** Serializable query state for a listing surface: search, sort, active filters, pagination, and row selection. */
export interface ListingQueryState {
  search: string;
  sort: string;
  filters: string[];
  page: number;
  pageSize: number;
  /** Ids of currently selected rows. */
  selection: string[];
}

/** Initial defaults for a listing's query state. */
export interface ListingStateConfig {
  /** Initial sort; defaults to `'newest'`. */
  defaultSort?: string;
  /** Initial page size; defaults to 25. */
  defaultPageSize?: number;
}

/**
 * Reducer actions for {@link ListingQueryState}. Search/sort/filter/page-size
 * changes reset to page 1 and clear the selection; `reset-query` restores defaults.
 */
export type ListingAction =
  | { type: 'set-search'; value: string }
  | { type: 'set-sort'; value: string }
  | { type: 'toggle-filter'; value: string }
  | { type: 'clear-filters' }
  | { type: 'set-page'; value: number }
  | { type: 'set-page-size'; value: number }
  | { type: 'toggle-selection'; value: string }
  | { type: 'clear-selection' }
  | { type: 'reset-query' };

/** Context value exposed by {@link ListingProvider}: the current query state and its dispatch. */
export interface ListingStateValue {
  state: ListingQueryState;
  dispatch: (action: ListingAction) => void;
}

function createInitialState(config: ListingStateConfig = {}): ListingQueryState {
  return {
    search: '',
    sort: config.defaultSort ?? 'newest',
    filters: [],
    page: 1,
    pageSize: config.defaultPageSize ?? 25,
    selection: [],
  };
}

/**
 * Reducer for {@link ListingQueryState}. Search/sort/filter/page-size changes reset
 * the page to 1 and clear the selection; page numbers are clamped to at least 1;
 * filter and selection toggles add/remove the value; `reset-query` restores the
 * initial state while preserving the current sort and page size.
 */
export function listingQueryReducer(state: ListingQueryState, action: ListingAction): ListingQueryState {
  if (action.type === 'set-search') {
    return { ...state, search: action.value, page: 1, selection: [] };
  }
  if (action.type === 'set-sort') {
    return { ...state, sort: action.value, page: 1, selection: [] };
  }
  if (action.type === 'toggle-filter') {
    const exists = state.filters.includes(action.value);
    return {
      ...state,
      filters: exists ? state.filters.filter((item) => item !== action.value) : [...state.filters, action.value],
      page: 1,
      selection: [],
    };
  }
  if (action.type === 'clear-filters') {
    return { ...state, filters: [], page: 1, selection: [] };
  }
  if (action.type === 'set-page') {
    return { ...state, page: Math.max(1, Math.floor(action.value)) };
  }
  if (action.type === 'set-page-size') {
    const nextPageSize = Math.max(1, Math.floor(action.value));
    return { ...state, pageSize: nextPageSize, page: 1, selection: [] };
  }
  if (action.type === 'toggle-selection') {
    const exists = state.selection.includes(action.value);
    return {
      ...state,
      selection: exists ? state.selection.filter((item) => item !== action.value) : [...state.selection, action.value],
    };
  }
  if (action.type === 'clear-selection') {
    return { ...state, selection: [] };
  }
  return createInitialState({ defaultSort: state.sort, defaultPageSize: state.pageSize });
}

const ListingStateContext = createContext<ListingStateValue | null>(null);

/** Provides {@link ListingQueryState} and its dispatch to descendants via context, seeded from `config`. */
export function ListingProvider({
  children,
  config,
}: {
  children: ReactNode;
  config?: ListingStateConfig;
}) {
  const [state, dispatch] = useReducer(listingQueryReducer, config, createInitialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <ListingStateContext.Provider value={value}>{children}</ListingStateContext.Provider>;
}

/** Returns the nearest {@link ListingStateValue}; throws when used outside a {@link ListingProvider}. */
export function useListingState() {
  const context = useContext(ListingStateContext);
  if (!context) {
    throw new Error('useListingState must be used within ListingProvider.');
  }
  return context;
}

