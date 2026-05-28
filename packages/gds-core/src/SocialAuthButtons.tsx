import type { ReactNode } from 'react';
import { Button, Divider, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { GdsIcons } from './icons';

export type SocialAuthProviderId =
  | 'google'
  | 'apple'
  | 'github'
  | 'facebook'
  | 'microsoft'
  | 'linkedin'
  | 'discord'
  | 'x'
  | 'email';

export interface SocialAuthProviderOption {
  id: SocialAuthProviderId | (string & {});
  href?: string;
  onClick?: () => void;
  label?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  description?: ReactNode;
}

export interface SocialAuthButtonsProps {
  providers: SocialAuthProviderOption[];
  title?: ReactNode;
  description?: ReactNode;
  layout?: 'stack' | 'grid';
  compact?: boolean;
}

const providerConfig: Record<string, { label: string; mark: string; color: string }> = {
  google: { label: 'Google', mark: 'G', color: 'red' },
  apple: { label: 'Apple', mark: 'A', color: 'dark' },
  github: { label: 'GitHub', mark: 'GH', color: 'gray' },
  facebook: { label: 'Facebook', mark: 'F', color: 'blue' },
  microsoft: { label: 'Microsoft', mark: 'M', color: 'cyan' },
  linkedin: { label: 'LinkedIn', mark: 'in', color: 'blue' },
  discord: { label: 'Discord', mark: 'D', color: 'indigo' },
  x: { label: 'X', mark: 'X', color: 'dark' },
  email: { label: 'Email', mark: '@', color: 'gray' },
};

function ProviderMark({ id }: { id: string }) {
  const config = providerConfig[id] ?? { label: id, mark: id.slice(0, 2).toUpperCase(), color: 'gray' };

  return (
    <ThemeIcon variant="light" color={config.color} radius="xl" size="md" aria-hidden="true">
      <Text size="xs" fw={700}>
        {config.mark}
      </Text>
    </ThemeIcon>
  );
}

function SocialAuthButton({ provider, compact = false }: { provider: SocialAuthProviderOption; compact?: boolean }) {
  const config = providerConfig[provider.id] ?? { label: provider.id, mark: provider.id.slice(0, 2).toUpperCase(), color: 'gray' };
  const label = provider.label ?? `Continue with ${config.label}`;
  const buttonProps = provider.href
    ? { component: 'a' as const, href: provider.href }
    : { onClick: provider.onClick };

  return (
    <Button
      variant="default"
      justify="space-between"
      fullWidth
      size={compact ? 'sm' : 'md'}
      leftSection={<ProviderMark id={provider.id} />}
      disabled={provider.disabled}
      loading={provider.loading}
      {...buttonProps}
    >
      <Stack gap={0} align="flex-start">
        <Text inherit>{label}</Text>
        {provider.description ? (
          <Text size="xs" c="dimmed" lh={1.2}>
            {provider.description}
          </Text>
        ) : null}
      </Stack>
    </Button>
  );
}

export function SocialAuthButtons({
  providers,
  title = 'Continue with a trusted provider',
  description,
  layout = 'stack',
  compact = false,
}: SocialAuthButtonsProps) {
  if (!providers.length) {
    return null;
  }

  const content = providers.map((provider) => (
    <SocialAuthButton key={provider.id} provider={provider} compact={compact} />
  ));

  return (
    <Stack gap="md">
      <Stack gap={4} ta="center">
        <Group justify="center" gap="xs">
          <GdsIcons.Login size="1rem" />
          <Text fw={600}>{title}</Text>
        </Group>
        {description ? (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}
      </Stack>
      <Divider />
      {layout === 'grid' ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {content}
        </SimpleGrid>
      ) : (
        <Stack gap="sm">{content}</Stack>
      )}
    </Stack>
  );
}
