'use client';

import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

export interface ListingQueryState {
  search: string;
  sort: string;
  filters: string[];
  page: number;
  pageSize: number;
  selection: string[];
}

export interface ListingStateConfig {
  defaultSort?: string;
  defaultPageSize?: number;
}

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

export function useListingState() {
  const context = useContext(ListingStateContext);
  if (!context) {
    throw new Error('useListingState must be used within ListingProvider.');
  }
  return context;
}

