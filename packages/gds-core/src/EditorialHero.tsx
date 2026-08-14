import type { ReactNode } from 'react';
import { Anchor, AspectRatio, Box, Grid, Group, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { AccentPanel } from './AccentPanel';
import { CtaButtonGroup } from './CtaButtonGroup';
import { GdsGeneratedThumbnail } from './GdsGeneratedThumbnail';

/** A call-to-action rendered in the hero; links when `href` is set, otherwise a button. First action defaults to primary. */
export type EditorialHeroAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'subtle';
  disabled?: boolean;
  loading?: boolean;
};

/** A supporting metadata chip shown beneath the hero actions. */
export type EditorialHeroMetaItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};

/** Props for the `EditorialHero` component. */
export interface EditorialHeroProps {
  /** Small overline text above the title. */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** CTAs; only the first three render, with at most one promoted to primary. */
  actions?: EditorialHeroAction[];
  /** Supporting detail chips. */
  meta?: EditorialHeroMetaItem[];
  /** Media node; a placeholder is shown when omitted. */
  media?: ReactNode;
  /** Accessible label for the media figure. */
  mediaAlt?: string;
  /** Which side the media sits on at `md`+. Defaults to `right`. */
  mediaPosition?: 'right' | 'left';
  /** Overlay fade applied over the media. Defaults to `soft-start`. */
  mediaFade?: 'none' | 'soft-start' | 'background-blend' | 'background-match' | 'mask-soft-edge';
  /** Text/content alignment. Defaults to `start`. */
  align?: 'start' | 'center';
  /** Tighter spacing/padding. Defaults to `false`. */
  compact?: boolean;
  /** Render the skeleton loading state. Defaults to `false`. */
  loading?: boolean;
  /** Error content shown in place of the media when it fails to load. */
  error?: ReactNode;
  /** `flat-public` removes the surface shadow. Defaults to `default`. */
  surfaceVariant?: 'default' | 'flat-public';
  /** Per-slot class name overrides. */
  classNames?: {
    root?: string;
    content?: string;
    media?: string;
    actions?: string;
    meta?: string;
  };
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
        padding: 'var(--gds-space-xs) var(--gds-space-md)',
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
          padding: 'var(--gds-space-xs) var(--gds-space-md)',
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
      <Grid style={{ gap: compact ? 'var(--mantine-spacing-lg)' : 'var(--mantine-spacing-xl)', alignItems: 'center' }}>
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

/**
 * Owner directive, 2026-08-14: GDS uses the generated thumbnail everywhere. A grey box with a
 * generic photo glyph reads as a failure; generated art reads as a hero without a photo yet.
 * `badges="none"` because the hero prints its own title beside this.
 */
function MediaFallback({ seed, label }: { seed: string; label: string }) {
  return (
    <GdsGeneratedThumbnail
      seed={seed}
      categories={[{ key: 'hero', label, icon: 'Gallery' }]}
      aspectRatio="16:9"
      badges="none"
    />
  );
}

function MediaFrame({
  media,
  mediaAlt,
  mediaFade,
  className,
}: {
  media?: ReactNode;
  mediaAlt?: string;
  mediaFade: EditorialHeroProps['mediaFade'];
  className?: string;
}) {
  let overlayBackground: string | null = null;

  if (mediaFade === 'background-blend') {
    overlayBackground =
      'linear-gradient(135deg, light-dark(rgba(255,255,255,0), rgba(17,24,39,0.08)) 0%, light-dark(rgba(255,255,255,0.42), rgba(17,24,39,0.54)) 100%)';
  } else if (mediaFade === 'background-match') {
    overlayBackground =
      'linear-gradient(180deg, rgba(255,255,255,0) 0%, light-dark(rgba(248,250,252,0.75), rgba(17,24,39,0.56)) 100%)';
  } else if (mediaFade === 'mask-soft-edge') {
    overlayBackground =
      'linear-gradient(90deg, light-dark(rgba(255,255,255,0.78), rgba(17,24,39,0.68)) 0%, rgba(255,255,255,0.18) 18%, rgba(255,255,255,0) 42%)';
  } else if (mediaFade === 'soft-start') {
    overlayBackground =
      'linear-gradient(90deg, light-dark(rgba(255,255,255,0.9), rgba(17,24,39,0.72)) 0%, rgba(255,255,255,0) 28%)';
  }

  return (
    <Box
      component="figure"
      m={0}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--mantine-radius-xl)',
        minHeight: '100%',
      }}
      aria-label={mediaAlt}
    >
      {media ?? <MediaFallback seed={mediaAlt ?? 'gds-hero'} label={mediaAlt ?? 'Hero'} />}
      {media && overlayBackground ? (
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: overlayBackground,
          }}
        />
      ) : null}
    </Box>
  );
}

/**
 * Two-column editorial hero pairing eyebrow/title/description and up to three
 * CTAs with a media figure, on a bordered surface. Renders a skeleton while
 * `loading`, and an error panel in place of the media when `error` is set.
 */
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
  surfaceVariant = 'default',
  classNames,
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
    <Stack gap={compact ? 'md' : 'lg'} justify="center" h="100%" className={classNames?.content}>
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
        <Box className={classNames?.actions}>
          <CtaButtonGroup
            primary={renderedActions[0]}
            secondary={renderedActions[1]}
            tertiary={renderedActions[2]}
          />
        </Box>
      ) : null}

      {meta.length ? (
        <Group gap="sm" wrap="wrap" aria-label="Supporting details" className={classNames?.meta}>
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
    <MediaFrame media={media} mediaAlt={mediaAlt} mediaFade={mediaFade} className={classNames?.media} />
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
    <Paper
      component="section"
      withBorder
      radius="xl"
      p={compact ? 'lg' : 'xl'}
      className={classNames?.root}
      style={surfaceVariant === 'flat-public' ? { boxShadow: 'none' } : undefined}
    >
      <Grid style={{ gap: compact ? 'var(--mantine-spacing-lg)' : 'var(--mantine-spacing-xl)', alignItems: 'center' }}>
        {textCol}
        {mediaCol}
      </Grid>
    </Paper>
  );
}
