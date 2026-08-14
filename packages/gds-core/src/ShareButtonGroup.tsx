'use client';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ActionIcon, Button, Group, Stack, Text } from '@mantine/core';
import { GdsIcons } from './icons';

/** A share destination: the Web Share API (`native`), clipboard (`copy`), or a specific network. */
export type ShareChannel =
  | 'native'
  | 'copy'
  | 'mail'
  | 'message'
  | 'x'
  | 'facebook'
  | 'linkedin'
  | 'whatsapp'
  | 'telegram';

/** Props for {@link ShareButtonGroup}. */
export interface ShareButtonGroupProps {
  /** URL to share. */
  url: string;
  title?: string;
  text?: string;
  /** Channels to render, in order. Defaults to `['native', 'copy', 'mail']`. */
  channels?: ShareChannel[];
  /** Render icon-only action buttons instead of labelled buttons. */
  compact?: boolean;
  /** Heading above the buttons. Defaults to `'Share this'`. */
  label?: ReactNode;
  description?: ReactNode;
}

const channelLabels: Record<ShareChannel, string> = {
  native: 'Share',
  copy: 'Copy link',
  mail: 'Email',
  message: 'Message',
  x: 'Share on X',
  facebook: 'Share on Facebook',
  linkedin: 'Share on LinkedIn',
  whatsapp: 'Share on WhatsApp',
  telegram: 'Share on Telegram',
};

function encodeShare(url: string, title?: string, text?: string) {
  const safeUrl = encodeURIComponent(url);
  const safeTitle = encodeURIComponent(title ?? '');
  const safeText = encodeURIComponent(text ?? title ?? '');

  return {
    mail: `mailto:?subject=${safeTitle}&body=${safeText ? `${safeText}%0A%0A` : ''}${safeUrl}`,
    message: `sms:?&body=${safeText ? `${safeText}%20` : ''}${safeUrl}`,
    x: `https://x.com/intent/tweet?text=${safeText ? `${safeText}%20` : ''}${safeUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${safeUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${safeUrl}`,
    whatsapp: `https://wa.me/?text=${safeText ? `${safeText}%20` : ''}${safeUrl}`,
    telegram: `https://t.me/share/url?url=${safeUrl}&text=${safeText}`,
  };
}

function ShareAction({
  channel,
  compact,
  href,
  onClick,
}: {
  channel: ShareChannel;
  compact: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const label = channelLabels[channel];
  const Icon = channel === 'copy' ? GdsIcons.Copy : channel === 'mail' ? GdsIcons.Mail : channel === 'message' ? GdsIcons.Message : GdsIcons.Refer;

  if (compact) {
    return href ? (
      <ActionIcon component="a" href={href} target="_blank" rel="noreferrer" variant="subtle" size="lg" aria-label={label}>
        <Icon size="1rem" stroke={1.75} />
      </ActionIcon>
    ) : (
      <ActionIcon variant="subtle" size="lg" aria-label={label} onClick={onClick}>
        <Icon size="1rem" stroke={1.75} />
      </ActionIcon>
    );
  }

  return href ? (
    <Button component="a" href={href} target="_blank" rel="noreferrer" variant="default" leftSection={<Icon size="1rem" stroke={1.75} />}>
      {label}
    </Button>
  ) : (
    <Button variant="default" leftSection={<Icon size="1rem" stroke={1.75} />} onClick={onClick}>
      {label}
    </Button>
  );
}

/**
 * Governed share affordance rendering a chosen set of {@link ShareChannel}s.
 * `native` uses the Web Share API (falling back to copy), `copy` writes the URL
 * to the clipboard, and network channels open pre-encoded share intents, each
 * with a transient confirmation message.
 */
export function ShareButtonGroup({
  url,
  title,
  text,
  channels = ['native', 'copy', 'mail'],
  compact = false,
  label: labelProp,
  description,
}: ShareButtonGroupProps) {
  const { t } = useGdsTranslation();
  const label = labelProp ?? t('gds.shareButtonGroup.label', "Share this");

  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const hrefs = encodeShare(url, title, text);

  async function handleCopy() {
    await navigator.clipboard?.writeText?.(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ url, title, text });
      setShared(true);
      setTimeout(() => setShared(false), 1800);
      return;
    }

    await handleCopy();
  }

  return (
    <Stack gap="sm">
      <Stack gap={2}>
        <Text fw={600}>{label}</Text>
        {description ? (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}
      </Stack>
      <Group gap="sm" wrap="wrap">
        {channels.map((channel) => {
          if (channel === 'copy') {
            return <ShareAction key={channel} channel={channel} compact={compact} onClick={() => void handleCopy()} />;
          }

          if (channel === 'native') {
            return <ShareAction key={channel} channel={channel} compact={compact} onClick={() => void handleNativeShare()} />;
          }

          return <ShareAction key={channel} channel={channel} compact={compact} href={hrefs[channel]} />;
        })}
      </Group>
      {copied ? (
        <Text size="sm" c="teal">
          Link copied.
        </Text>
      ) : null}
      {shared ? (
        <Text size="sm" c="teal">
          Share sheet opened.
        </Text>
      ) : null}
    </Stack>
  );
}
