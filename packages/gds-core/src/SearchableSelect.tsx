import { useEffect, useMemo, useRef, useState } from 'react';
import { Combobox, Group, InputBase, Loader, Text, useCombobox } from '@mantine/core';
import { GdsIcons } from './icons';

/**
 * SearchableSelect / Combobox (gap B6 / issue #318).
 *
 * Canonical searchable single-select with typeahead filtering, async option
 * loading (debounced, with stale-response cancellation), option grouping, and
 * full keyboard accessibility via Mantine's low-level Combobox. No Mantine types
 * are exposed in the public API. Also closes the standing KIDEX combobox gap.
 */

/** A single option for {@link SearchableSelect}. */
export interface ComboboxOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional group heading this option is listed under. */
  group?: string;
  disabled?: boolean;
}

/** Props for {@link SearchableSelect}. */
export interface SearchableSelectProps<T extends string = string> {
  /** Currently selected value, or `null` when nothing is selected. */
  value: T | null;
  /** Called with the new value, or `null` when the selection is cleared. */
  onChange: (value: T | null) => void;
  /** Synchronous options. Ignored when `loadOptions` is provided. */
  options?: ComboboxOption<T>[];
  /** Async option source. Rejection surfaces the error state with retry. */
  loadOptions?: (query: string) => Promise<ComboboxOption<T>[]>;
  placeholder?: string;
  /** Shows a clear button when a value is selected. Defaults to false. */
  clearable?: boolean;
  disabled?: boolean;
  /** Debounce in milliseconds before running an async search. Defaults to 250. */
  debounceMs?: number;
  /** Empty-results message. Defaults to "No results found". */
  noResultsLabel?: string;
  /** Async error message. Defaults to "Could not load options". */
  errorLabel?: string;
  /** Retry-link label shown in the async error state. Defaults to "Retry". */
  retryLabel?: string;
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

function rankSync<T extends string>(options: ComboboxOption<T>[], query: string): ComboboxOption<T>[] {
  if (!query.trim()) return options;
  const q = query.trim().toLowerCase();
  return options
    .map((option) => {
      const label = option.label.toLowerCase();
      const score = label.startsWith(q) ? 2 : label.includes(q) ? 1 : 0;
      return { option, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.option);
}

function groupOptions<T extends string>(options: ComboboxOption<T>[]): [string | undefined, ComboboxOption<T>[]][] {
  const groups = new Map<string | undefined, ComboboxOption<T>[]>();
  for (const option of options) {
    const list = groups.get(option.group) ?? [];
    list.push(option);
    groups.set(option.group, list);
  }
  return [...groups.entries()];
}

/**
 * Canonical searchable single-select (combobox): typeahead filtering over sync or
 * debounced async options (with stale-response cancellation), option grouping, and
 * full keyboard accessibility. Exposes no Mantine types in its public API.
 */
export function SearchableSelect<T extends string = string>({
  value,
  onChange,
  options,
  loadOptions,
  placeholder,
  clearable = false,
  disabled = false,
  debounceMs = 250,
  noResultsLabel = 'No results found',
  errorLabel = 'Could not load options',
  retryLabel = 'Retry',
  ariaLabel,
}: SearchableSelectProps<T>) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
  const [query, setQuery] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<ComboboxOption<T>[]>([]);
  const [state, setState] = useState<LoadState>('idle');
  const requestToken = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runAsyncSearch = (nextQuery: string) => {
    if (!loadOptions) return;
    const token = ++requestToken.current;
    setState('loading');
    loadOptions(nextQuery)
      .then((result) => {
        if (token !== requestToken.current) return; // discard stale response
        setAsyncOptions(result);
        setState(result.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (token !== requestToken.current) return;
        setState('error');
      });
  };

  useEffect(() => {
    if (!loadOptions) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runAsyncSearch(query), debounceMs);
    return () => clearTimeout(debounceTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, loadOptions, debounceMs]);

  const resolvedOptions = useMemo(() => {
    if (loadOptions) return asyncOptions;
    return rankSync(options ?? [], query);
  }, [loadOptions, asyncOptions, options, query]);

  const selectedLabel = useMemo(() => {
    const all = loadOptions ? asyncOptions : options ?? [];
    return all.find((option) => option.value === value)?.label ?? (value as string | null) ?? '';
  }, [value, asyncOptions, options, loadOptions]);

  const grouped = groupOptions(resolvedOptions);

  const renderDropdownBody = () => {
    if (loadOptions && state === 'loading') {
      return (
        <Combobox.Empty>
          <Group gap="xs" justify="center">
            <Loader size="xs" /> <Text size="sm">Loading…</Text>
          </Group>
        </Combobox.Empty>
      );
    }
    if (loadOptions && state === 'error') {
      return (
        <Combobox.Empty>
          <Group gap="xs" justify="space-between">
            <Text size="sm" c="red">
              {errorLabel}
            </Text>
            <Text
              size="sm"
              fw={600}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onClick={() => runAsyncSearch(query)}
            >
              {retryLabel}
            </Text>
          </Group>
        </Combobox.Empty>
      );
    }
    if (resolvedOptions.length === 0) {
      return <Combobox.Empty>{noResultsLabel}</Combobox.Empty>;
    }
    return grouped.map(([group, groupItems]) => {
      const items = groupItems.map((option) => (
        <Combobox.Option value={option.value} key={option.value} disabled={option.disabled} active={option.value === value}>
          {option.label}
        </Combobox.Option>
      ));
      return group ? (
        <Combobox.Group label={group} key={group}>
          {items}
        </Combobox.Group>
      ) : (
        items
      );
    });
  };

  return (
    <Combobox
      store={combobox}
      disabled={disabled}
      onOptionSubmit={(optionValue) => {
        onChange(optionValue as T);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          aria-label={ariaLabel}
          disabled={disabled}
          rightSection={
            clearable && value ? (
              <GdsIcons.Close
                size="0.9rem"
                role="button"
                aria-label="Clear selection"
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  onChange(null);
                }}
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          onClick={() => combobox.toggleDropdown()}
        >
          {selectedLabel || <Text component="span" c="dimmed">{placeholder}</Text>}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Search
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={placeholder}
        />
        <Combobox.Options>{renderDropdownBody()}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
