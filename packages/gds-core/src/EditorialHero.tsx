import type { ReactNode } from 'react';
import { Anchor, AspectRatio, Box, Grid, Group, Paper, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { AccentPanel } from './AccentPanel';
import { CtaButtonGroup } from './CtaButtonGroup';
import { GdsIcons } from './icons';

export type EditorialHeroAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'subtle';
  disabled?: boolean;
  loading?: boolean;
};

export type EditorialHeroMetaItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};

export interface EditorialHeroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: EditorialHeroAction[];
  meta?: EditorialHeroMetaItem[];
  media?: ReactNode;
  mediaAlt?: string;
  mediaPosition?: 'right' | 'left';
  mediaFade?: 'none' | 'soft-start' | 'background-blend';
  align?: 'start' | 'center';
  compact?: boolean;
  loading?: boolean;
  error?: ReactNode;
}

function resolveActionVariant(
  action: EditorialHeroAction,
  index: number,
  seenPrimary: boolean,
): { variant: 'filled' | 'default' | 'subtle'; seenPrimary: boolean } {
  const requested = action.variant ?? (index === 0 ? 'primary' : 'secondary');

  if (requested === 'primary' && !seenPrimary) {
    return { variant: 'filled', seenPrimary: true };
  }

  if (requested === 'subtle') {
    return { variant: 'subtle', seenPrimary };
  }

  return { variant: 'default', seenPrimary };
}

function HeroAction({ action, variant }: { action: EditorialHeroAction; variant: 'filled' | 'default' | 'subtle' }) {
  const content = (
    <Anchor
      href={action.href}
      onClick={action.onClick}
      aria-disabled={action.disabled || action.loading || undefined}
      underline="never"
      c={variant === 'filled' ? 'white' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.625rem 1rem',
        borderRadius: 'var(--mantine-radius-md)',
        fontWeight: 600,
        minHeight: '2.5rem',
        border: variant === 'default' ? '1px solid var(--mantine-color-default-border)' : '1px solid transparent',
        background:
          variant === 'filled'
            ? 'var(--mantine-color-violet-filled)'
            : variant === 'subtle'
              ? 'transparent'
              : 'var(--mantine-color-default)',
        opacity: action.disabled ? 0.6 : 1,
        pointerEvents: action.disabled ? 'none' : undefined,
      }}
    >
      {action.loading ? 'Loading…' : action.label}
    </Anchor>
  );

  if (!action.href) {
    return (
      <Box
        component="button"
        type="button"
        onClick={action.onClick}
        disabled={action.disabled || action.loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.625rem 1rem',
          borderRadius: 'var(--mantine-radius-md)',
          fontWeight: 600,
          minHeight: '2.5rem',
          border: variant === 'default' ? '1px solid var(--mantine-color-default-border)' : '1px solid transparent',
          background:
            variant === 'filled'
              ? 'var(--mantine-color-violet-filled)'
              : variant === 'subtle'
                ? 'transparent'
                : 'var(--mantine-color-default)',
          color: variant === 'filled' ? 'white' : 'inherit',
          cursor: action.disabled ? 'not-allowed' : 'pointer',
          opacity: action.disabled ? 0.6 : 1,
        }}
      >
        {action.loading ? 'Loading…' : action.label}
      </Box>
    );
  }

  return content;
}

function LoadingHero({ compact }: { compact: boolean }) {
  return (
    <Paper withBorder radius="xl" p={compact ? 'lg' : 'xl'}>
      <Grid gutter={compact ? 'lg' : 'xl'} align="center">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Skeleton height={16} width={96} radius="xl" />
            <Skeleton height={48} width="90%" radius="md" />
            <Skeleton height={18} width="100%" radius="md" />
            <Skeleton height={18} width="82%" radius="md" />
            <Group>
              <Skeleton height={40} width={140} radius="md" />
              <Skeleton height={40} width={140} radius="md" />
            </Group>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <AspectRatio ratio={16 / 11}>
            <Skeleton radius="lg" />
          </AspectRatio>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}

function MediaFallback() {
  return (
    <AspectRatio ratio={16 / 11}>
      <ThemeIcon
        size="100%"
        radius="lg"
        color="gray"
        variant="light"
        aria-label="Hero media is unavailable"
      >
        <GdsIcons.Gallery size="2.5rem" />
      </ThemeIcon>
    </AspectRatio>
  );
}

function MediaFrame({
  media,
  mediaAlt,
  mediaFade,
}: {
  media?: ReactNode;
  mediaAlt?: string;
  mediaFade: EditorialHeroProps['mediaFade'];
}) {
  return (
    <Box
      component="figure"
      m={0}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--mantine-radius-xl)',
        minHeight: '100%',
      }}
      aria-label={mediaAlt}
    >
      {media ?? <MediaFallback />}
      {media && mediaFade !== 'none' ? (
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              mediaFade === 'background-blend'
                ? 'linear-gradient(135deg, light-dark(rgba(255,255,255,0), rgba(17,24,39,0.08)) 0%, light-dark(rgba(255,255,255,0.42), rgba(17,24,39,0.54)) 100%)'
                : 'linear-gradient(90deg, light-dark(rgba(255,255,255,0.9), rgba(17,24,39,0.72)) 0%, rgba(255,255,255,0) 28%)',
          }}
        />
      ) : null}
    </Box>
  );
}

export function EditorialHero({
  eyebrow,
  title,
  description,
  actions = [],
  meta = [],
  media,
  mediaAlt,
  mediaPosition = 'right',
  mediaFade = 'soft-start',
  align = 'start',
  compact = false,
  loading = false,
  error,
}: EditorialHeroProps) {
  if (loading) {
    return <LoadingHero compact={compact} />;
  }

  const stackAlign = align === 'center' ? 'center' : 'flex-start';
  const textAlign = align === 'center' ? 'center' : 'left';

  let seenPrimary = false;
  const renderedActions = actions.slice(0, 3).map((action, index) => {
    const resolved = resolveActionVariant(action, index, seenPrimary);
    seenPrimary = resolved.seenPrimary;

    return <HeroAction key={`${action.label}-${index}`} action={action} variant={resolved.variant} />;
  });

  const textSlot = (
    <Stack gap={compact ? 'md' : 'lg'} justify="center" h="100%">
      <Stack gap="sm" align={stackAlign}>
        {eyebrow ? (
          <Text size="sm" fw={700} c="dimmed" ta={textAlign}>
            {eyebrow}
          </Text>
        ) : null}
        <Title order={1} maw={760} ta={textAlign}>
          {title}
        </Title>
        {description ? (
          <Text size={compact ? 'md' : 'lg'} c="dimmed" maw={720} ta={textAlign}>
            {description}
          </Text>
        ) : null}
      </Stack>

      {renderedActions.length ? (
        <CtaButtonGroup
          primary={renderedActions[0]}
          secondary={renderedActions[1]}
          tertiary={renderedActions[2]}
        />
      ) : null}

      {meta.length ? (
        <Group gap="sm" wrap="wrap" aria-label="Supporting details">
          {meta.map((item) => (
            <Group
              key={item.id}
              gap={6}
              px="sm"
              py={6}
              style={{
                borderRadius: 'var(--mantine-radius-xl)',
                background: 'light-dark(var(--mantine-color-gray-0), color-mix(in srgb, var(--mantine-color-dark-7) 92%, black))',
              }}
            >
              {item.icon}
              <Text size="sm" c="dimmed">
                {item.label}
              </Text>
            </Group>
          ))}
        </Group>
      ) : null}
    </Stack>
  );

  const mediaSlot = error ? (
    <AccentPanel tone="red" variant="soft-outline" title="Media unavailable">
      {error}
    </AccentPanel>
  ) : (
    <MediaFrame media={media} mediaAlt={mediaAlt} mediaFade={mediaFade} />
  );

  const textCol = (
    <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: mediaPosition === 'left' ? 2 : 1 }}>
      {textSlot}
    </Grid.Col>
  );

  const mediaCol = (
    <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: mediaPosition === 'left' ? 1 : 2 }}>
      {mediaSlot}
    </Grid.Col>
  );

  return (
    <Paper component="section" withBorder radius="xl" p={compact ? 'lg' : 'xl'}>
      <Grid gutter={compact ? 'lg' : 'xl'} align="center">
        {textCol}
        {mediaCol}
      </Grid>
    </Paper>
  );
}
