import type { ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { Divider, Group, Stack, Text } from '@mantine/core';
import { GdsIcons } from './icons';
import {
  type ProviderIdentityButtonProps,
  type ProviderIdentityVariant,
  ProviderIdentityButtonGroup,
} from './ProviderIdentityButtons';

/** Identifier of a known social/identity provider; any other string is also accepted for custom providers. */
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

/** A single provider entry in the social-auth button set. */
export interface SocialAuthProviderOption {
  id: SocialAuthProviderId | (string & {});
  href?: string;
  onClick?: () => void;
  /** Overrides the default provider label. */
  label?: ReactNode;
  /** Policy/consent note shown with the button. */
  policyNote?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  /** Explanation shown when the provider is disabled for the current tenant. */
  tenantDisabledReason?: ReactNode;
  description?: ReactNode;
  variant?: ProviderIdentityVariant;
  size?: ProviderIdentityButtonProps['size'];
}

/** Props for the `SocialAuthButtons` component. */
export interface SocialAuthButtonsProps {
  providers: SocialAuthProviderOption[];
  /** Heading above the buttons. Defaults to "Continue with a trusted provider". */
  title?: ReactNode;
  description?: ReactNode;
  /** Button arrangement. Defaults to `stack`. */
  layout?: 'stack' | 'grid';
  /** Tighter default button size (`sm` instead of `md`). Defaults to `false`. */
  compact?: boolean;
}

/** Governed provider sign-in block: a titled, divider-separated set of identity-provider buttons built on `ProviderIdentityButtonGroup`. Renders nothing when `providers` is empty. */
export function SocialAuthButtons({
  providers,
  title: titleProp,
  description,
  layout = 'stack',
  compact = false,
}: SocialAuthButtonsProps) {
  const { t } = useGdsTranslation();
  const title = titleProp ?? t('gds.socialAuthButtons.title', "Continue with a trusted provider");

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
