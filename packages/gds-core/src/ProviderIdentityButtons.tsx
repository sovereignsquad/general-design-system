import type { ReactNode } from 'react';
import { Button, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';

/** Registry of built-in identity providers, mapping each id to its display label, short mark, and brand color. */
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

/** A known provider id from the registry, or any other provider string. */
export type ProviderIdentity = keyof typeof PROVIDER_IDENTITY_REGISTRY | (string & {});

/** Visual variant for a provider button: brand-colored `solid`, `outline`, or GDS-`neutral`. */
export type ProviderIdentityVariant = 'solid' | 'outline' | 'neutral';

/** Props for {@link ProviderIdentityButton}. */
export interface ProviderIdentityButtonProps {
  provider: ProviderIdentity;
  /** Overrides the default "Continue with <provider>" label. */
  label?: ReactNode;
  description?: ReactNode;
  /** Policy/consent note shown under the label. */
  policyNote?: ReactNode;
  error?: ReactNode;
  /** Renders the button as a link to this URL instead of firing `onClick`. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** When set, disables the button and explains why the tenant blocked this provider. */
  tenantDisabledReason?: ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: ProviderIdentityVariant;
  ariaLabel?: string;
  describedBy?: string;
  /** Minimum touch-target height in px; defaults to 44. */
  minTouchTargetPx?: number;
}

/** Props for {@link ProviderIdentityButtonGroup}. */
export interface ProviderIdentityButtonGroupProps {
  providers: ProviderIdentityButtonProps[];
  /** Vertical `stack` (default) or two-column responsive `grid` layout. */
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

/** Returns a provider's button label — the custom override if given, otherwise "Continue with <providerLabel>". */
export function getProviderIdentityLabel(provider: string, fallbackOverride?: ReactNode) {
  return resolveProviderLabel(provider, fallbackOverride);
}

/** Returns the ids of all built-in providers in {@link PROVIDER_IDENTITY_REGISTRY}. */
export function getSupportedProviderIdentityIds() {
  return Object.keys(PROVIDER_IDENTITY_REGISTRY);
}

/**
 * Returns the governance policy for a provider: its normalized id, whether it is
 * registry-supported, the provider label, who owns the color (`'provider'` for
 * supported, `'gds-neutral'` otherwise), the 44px minimum touch target, and the
 * allowed variants.
 */
export function getProviderIdentityPolicy(provider: string) {
  const meta = getProviderIdentityMeta(provider);

  return {
    id: meta.id,
    supported: meta.supported,
    providerLabel: meta.providerLabel,
    colorAuthority: meta.supported ? 'provider' : 'gds-neutral',
    minTouchTargetPx: 44,
    allowedVariants: ['solid', 'outline', 'neutral'] as ProviderIdentityVariant[],
  };
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

/**
 * Governed social/identity sign-in button. Renders the provider mark and a
 * "Continue with <provider>" label (or a custom one), maps `variant` to a Mantine
 * button variant, enforces the minimum touch target, and stacks optional
 * description, policy, tenant-disabled, and error copy. Renders as a link when
 * `href` is set; disabled when `disabled` or `tenantDisabledReason` is present.
 */
export function ProviderIdentityButton({
  provider,
  label,
  description,
  policyNote,
  error,
  href,
  onClick,
  disabled,
  loading,
  tenantDisabledReason,
  fullWidth = true,
  size = 'md',
  variant = 'neutral',
  ariaLabel,
  describedBy,
  minTouchTargetPx = 44,
}: ProviderIdentityButtonProps) {
  const meta = getProviderIdentityMeta(provider);
  const buttonLabel = resolveProviderLabel(provider, label);
  const resolvedDisabled = disabled || Boolean(tenantDisabledReason);
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
      disabled={resolvedDisabled}
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
        {policyNote ? (
          <Text size="xs" c="dimmed" lh={1.2}>
            {policyNote}
          </Text>
        ) : null}
        {tenantDisabledReason ? (
          <Text size="xs" c="orange.7" lh={1.2}>
            {tenantDisabledReason}
          </Text>
        ) : null}
        {error ? (
          <Text size="xs" c="red.7" lh={1.2} role="alert">
            {error}
          </Text>
        ) : null}
      </Stack>
    </Button>
  );
}

/** Renders a set of {@link ProviderIdentityButton}s in a vertical stack or two-column grid; returns `null` when `providers` is empty. */
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
