'use client';

import { useState } from 'react';
import { ActionIcon, Code, Group, Paper, Stack, Text } from '@mantine/core';
import { GdsIcons } from './icons';

export interface DocsCodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  withCopy?: boolean;
}

export function DocsCodeBlock({ code, language, title, withCopy = true }: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator?.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="sm">
        {(title || withCopy) ? (
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              {title ? <Text fw={600}>{title}</Text> : null}
              {language ? (
                <Text size="xs" c="dimmed">
                  {language}
                </Text>
              ) : null}
            </Stack>
            {withCopy ? (
              <ActionIcon
                variant="subtle"
                aria-label={copied ? 'Copied code block' : 'Copy code block'}
                onClick={() => {
                  void handleCopy();
                }}
              >
                <GdsIcons.Copy size="1rem" />
              </ActionIcon>
            ) : null}
          </Group>
        ) : null}
        <Code block>{code}</Code>
      </Stack>
    </Paper>
  );
}
