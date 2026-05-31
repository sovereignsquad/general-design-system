import type { ReactNode } from 'react';
import { Divider, Group, Stack, Text } from '@mantine/core';
import { GdsIcons } from './icons';
import {
  type ProviderIdentityButtonProps,
  type ProviderIdentityVariant,
  ProviderIdentityButtonGroup,
} from './ProviderIdentityButtons';

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
  policyNote?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  tenantDisabledReason?: ReactNode;
  description?: ReactNode;
  variant?: ProviderIdentityVariant;
  size?: ProviderIdentityButtonProps['size'];
}

export interface SocialAuthButtonsProps {
  providers: SocialAuthProviderOption[];
  title?: ReactNode;
  description?: ReactNode;
  layout?: 'stack' | 'grid';
  compact?: boolean;
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

  const buttons = providers.map((provider) => ({
    provider: provider.id,
    label: provider.label,
    description: provider.description,
    policyNote: provider.policyNote,
    error: provider.error,
    href: provider.href,
    onClick: provider.onClick,
    disabled: provider.disabled,
    loading: provider.loading,
    tenantDisabledReason: provider.tenantDisabledReason,
    size: (provider.size ?? (compact ? 'sm' : 'md')) as ProviderIdentityButtonProps['size'],
    variant: provider.variant,
  }));

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
      <ProviderIdentityButtonGroup providers={buttons} layout={layout} />
    </Stack>
  );
}
