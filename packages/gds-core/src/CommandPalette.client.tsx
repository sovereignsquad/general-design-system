'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ActionIcon, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { GdsIcons } from './icons';

export interface CommandDef {
  id: string;
  label: string;
  group?: string;
  keywords?: string[];
  shortcut?: string;
  run: () => Promise<void> | void;
  enabledWhen?: () => boolean;
}

interface CommandPaletteContextValue {
  commands: CommandDef[];
  registerCommands: (next: CommandDef[]) => void;
  open: () => void;
  close: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function scoreCommand(command: CommandDef, query: string, recentUse: Record<string, number>) {
  const q = normalize(query);
  if (!q) {
    return 0;
  }
  const label = normalize(command.label);
  const keywords = command.keywords?.map(normalize) ?? [];
  const prefix = label.startsWith(q) ? 1 : 0;
  const keyword = keywords.some((item) => item.includes(q)) ? 1 : 0;
  const recent = recentUse[command.id] ? 1 : 0;
  return (0.6 * prefix) + (0.3 * keyword) + (0.1 * recent);
}

export function CommandRegistryProvider({ children }: { children: ReactNode }) {
  const [commands, setCommands] = useState<CommandDef[]>([]);
  const [opened, setOpened] = useState(false);

  const value = useMemo<CommandPaletteContextValue>(() => ({
    commands,
    registerCommands: (next) => setCommands(next),
    open: () => setOpened(true),
    close: () => setOpened(false),
  }), [commands]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette opened={opened} onClose={() => setOpened(false)} />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandLauncher() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandLauncher must be used within CommandRegistryProvider.');
  }
  return {
    open: context.open,
    close: context.close,
    registerCommands: context.registerCommands,
  };
}

export function CommandPalette({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const contextValue = useContext(CommandPaletteContext);
  if (!contextValue) {
    throw new Error('CommandPalette must be used within CommandRegistryProvider.');
  }
  const registry = contextValue;

  const [query, setQuery] = useState('');
  const [recentUse, setRecentUse] = useState<Record<string, number>>({});
  const enabledCommands = registry.commands.filter((command) => (command.enabledWhen ? command.enabledWhen() : true));
  const filteredCommands = [...enabledCommands]
    .map((command) => ({ command, score: scoreCommand(command, query, recentUse) }))
    .filter(({ command, score }) => normalize(query) === '' || score > 0 || normalize(command.label).includes(normalize(query)))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.command);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        registry.open();
      }
      if (event.key === 'Escape' && opened) {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [registry, opened, onClose]);

  return (
    <Modal opened={opened} onClose={onClose} title="Quick actions" centered>
      <Stack gap="sm">
        <TextInput
          aria-label="Command search"
          placeholder="Search commands"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        {filteredCommands.length === 0 ? (
          <Text size="sm" c="dimmed">No matching commands.</Text>
        ) : (
          filteredCommands.map((command) => (
            <Group key={command.id} justify="space-between" wrap="nowrap">
              <button
                type="button"
                onClick={async () => {
                  await command.run();
                  setRecentUse((current) => ({ ...current, [command.id]: Date.now() }));
                  onClose();
                }}
                aria-label={command.label}
              >
                {command.label}
              </button>
              {command.shortcut ? <Text size="xs" c="dimmed">{command.shortcut}</Text> : null}
            </Group>
          ))
        )}
        <Group justify="flex-end">
          <ActionIcon variant="subtle" aria-label="Close command palette" onClick={onClose}>
            <GdsIcons.Close size="1rem" />
          </ActionIcon>
        </Group>
      </Stack>
    </Modal>
  );
}
