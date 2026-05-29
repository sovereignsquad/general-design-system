import type { ReactNode } from 'react';
import { Button, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';

export const PROVIDER_IDENTITY_REGISTRY = {
  google: {
    providerLabel: 'Google',
    markLabel: 'G',
    brandColor: 'red',
  },
  apple: {
    providerLabel: 'Apple',
    markLabel: 'A',
    brandColor: 'dark',
  },
  github: {
    providerLabel: 'GitHub',
    markLabel: 'GH',
    brandColor: 'gray',
  },
  facebook: {
    providerLabel: 'Facebook',
    markLabel: 'F',
    brandColor: 'blue',
  },
  microsoft: {
    providerLabel: 'Microsoft',
    markLabel: 'M',
    brandColor: 'cyan',
  },
  linkedin: {
    providerLabel: 'LinkedIn',
    markLabel: 'in',
    brandColor: 'blue',
  },
  discord: {
    providerLabel: 'Discord',
    markLabel: 'D',
    brandColor: 'indigo',
  },
  x: {
    providerLabel: 'X',
    markLabel: 'X',
    brandColor: 'dark',
  },
  email: {
    providerLabel: 'Email',
    markLabel: '@',
    brandColor: 'gray',
  },
} as const;

export type ProviderIdentity = keyof typeof PROVIDER_IDENTITY_REGISTRY | (string & {});

export type ProviderIdentityVariant = 'solid' | 'outline' | 'neutral';

export interface ProviderIdentityButtonProps {
  provider: ProviderIdentity;
  label?: ReactNode;
  description?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: ProviderIdentityVariant;
  ariaLabel?: string;
  describedBy?: string;
  minTouchTargetPx?: number;
}

export interface ProviderIdentityButtonGroupProps {
  providers: ProviderIdentityButtonProps[];
  layout?: 'stack' | 'grid';
}

function normalizeProviderId(provider: string): string {
  return (provider ?? '').trim().toLowerCase();
}

function isSupportedProviderId(provider: string): provider is keyof typeof PROVIDER_IDENTITY_REGISTRY {
  return provider in PROVIDER_IDENTITY_REGISTRY;
}

function getProviderIdentityMeta(provider: string) {
  const normalized = normalizeProviderId(provider);

  if (isSupportedProviderId(normalized)) {
    return {
      id: normalized,
      supported: true as const,
      ...PROVIDER_IDENTITY_REGISTRY[normalized],
    };
  }

  return {
    id: normalized || 'provider',
    supported: false as const,
    providerLabel: provider ? provider : 'Provider',
    markLabel: (provider ?? 'PR').slice(0, 2).toUpperCase(),
    brandColor: 'gray',
  };
}

function resolveProviderLabel(provider: string, customLabel?: ReactNode) {
  const meta = getProviderIdentityMeta(provider);

  if (customLabel != null) {
    return customLabel;
  }

  return `Continue with ${meta.providerLabel}`;
}

function mapVariant(variant: ProviderIdentityVariant = 'neutral'): 'filled' | 'outline' | 'default' {
  if (variant === 'solid') {
    return 'filled';
  }

  if (variant === 'outline') {
    return 'outline';
  }

  return 'default';
}

export function getProviderIdentityLabel(provider: string, fallbackOverride?: ReactNode) {
  return resolveProviderLabel(provider, fallbackOverride);
}

function ProviderIdentityMark({ provider }: { provider: string }) {
  const meta = getProviderIdentityMeta(provider);

  return (
    <ThemeIcon
      variant="light"
      color={meta.brandColor}
      radius="xl"
      size="md"
      aria-hidden="true"
    >
      <Text size="xs" fw={700} c="inherit">
        {meta.markLabel}
      </Text>
    </ThemeIcon>
  );
}

export function ProviderIdentityButton({
  provider,
  label,
  description,
  href,
  onClick,
  disabled,
  loading,
  fullWidth = true,
  size = 'md',
  variant = 'neutral',
  ariaLabel,
  describedBy,
  minTouchTargetPx = 44,
}: ProviderIdentityButtonProps) {
  const meta = getProviderIdentityMeta(provider);
  const buttonLabel = resolveProviderLabel(provider, label);
  const buttonProps = href
    ? {
      component: 'a' as const,
      href,
    }
    : {
      onClick,
    };

  return (
    <Button
      variant={mapVariant(variant)}
      color={variant === 'solid' ? meta.brandColor : undefined}
      justify="space-between"
      fullWidth={fullWidth}
      size={size}
      aria-label={ariaLabel ?? (typeof buttonLabel === 'string' ? buttonLabel : undefined)}
      aria-describedby={describedBy}
      leftSection={<ProviderIdentityMark provider={provider} />}
      disabled={disabled}
      loading={loading}
      styles={{ root: { minHeight: minTouchTargetPx } }}
      {...buttonProps}
    >
      <Stack gap={0} align="flex-start">
        <Text inherit>{buttonLabel}</Text>
        {description ? (
          <Text size="xs" c="dimmed" lh={1.2}>
            {description}
          </Text>
        ) : null}
      </Stack>
    </Button>
  );
}

export function ProviderIdentityButtonGroup({ providers, layout = 'stack' }: ProviderIdentityButtonGroupProps) {
  if (!providers.length) {
    return null;
  }

  const content = providers.map((entry, index) => {
    const key = `${normalizeProviderId(String(entry.provider)) || 'provider'}-${index}`;

    return <ProviderIdentityButton key={key} {...entry} />;
  });

  if (layout === 'grid') {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {content}
      </SimpleGrid>
    );
  }

  return <Stack gap="sm">{content}</Stack>;
}
