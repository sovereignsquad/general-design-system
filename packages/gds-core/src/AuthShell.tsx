import type { ReactNode } from 'react';
import { Alert, Badge, Box, Card, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';

/** Props for {@link AuthShell}. */
export interface AuthShellProps {
  title: string;
  description?: ReactNode;
  /** Auth flow the shell frames; drives the intent badge. Defaults to `'sign-in'`. */
  intent?: 'sign-in' | 'sign-up' | 'account-linking' | 'guest-entry';
  /** Brand mark shown in the header. */
  brand?: ReactNode;
  /** Header-level actions (e.g. a locale switcher). */
  headerActions?: ReactNode;
  /** Footer copy shown below the card. */
  footer?: ReactNode;
  /** Helper copy shown inside the card, below the form. */
  helper?: ReactNode;
  /** Error banner shown above the form. */
  error?: ReactNode;
  /** Guest-entry action shown in the card's action row. */
  guestAction?: ReactNode;
  /** Support/help action shown in the card's action row. */
  supportAction?: ReactNode;
  /** Social/identity sign-in block; when present a divider separates it from the form. */
  socialAuth?: ReactNode;
  /** Label for the divider between social auth and the form. */
  dividerLabel?: ReactNode;
  /** The form (or other primary content) rendered inside the card. */
  children: ReactNode;
}

/**
 * Centered authentication scaffold for sign-in/sign-up/linking/guest flows: an
 * optional brand + header actions, a card holding an intent badge, title, error
 * banner, optional social-auth block with divider, the form (`children`), and
 * guest/support actions plus helper and footer copy.
 */
export function AuthShell({
  title,
  description,
  intent = 'sign-in',
  brand,
  headerActions,
  footer,
  helper,
  error,
  guestAction,
  supportAction,
  socialAuth,
  dividerLabel = 'Or continue with your account',
  children,
}: AuthShellProps) {
  return (
    <Box py={{ base: 'xl', md: '4rem' }}>
      <Container size="xs">
        <Stack gap="xl">
          {brand || headerActions ? (
            <Group justify={brand && headerActions ? 'space-between' : 'center'} align="center">
              {brand ? <Box>{brand}</Box> : <Box />}
              {headerActions ? <Group gap="sm">{headerActions}</Group> : null}
            </Group>
          ) : null}
          <Card withBorder radius="lg" padding="xl">
            <Stack gap="lg">
              <Stack gap="xs" ta="center">
                <Group justify="center">
                  <Badge variant="light" color={intent === 'account-linking' ? 'blue' : intent === 'guest-entry' ? 'gray' : 'teal'}>
                    {intent.replace('-', ' ')}
                  </Badge>
                </Group>
                <Title order={2}>{title}</Title>
                {description ? (
                  <Text c="dimmed" size="sm">
                    {description}
                  </Text>
                ) : null}
              </Stack>
              {error ? (
                <Alert color="red" variant="light" role="alert">
                  {error}
                </Alert>
              ) : null}
              {socialAuth ? <Box>{socialAuth}</Box> : null}
              {socialAuth ? <Divider label={dividerLabel} labelPosition="center" /> : null}
              {children}
              {(guestAction || supportAction) ? (
                <Group justify="center" gap="sm">
                  {guestAction}
                  {supportAction}
                </Group>
              ) : null}
              {helper ? (
                <Text size="sm" c="dimmed" ta="center">
                  {helper}
                </Text>
              ) : null}
            </Stack>
          </Card>
          {footer ? (
            <Text size="sm" c="dimmed" ta="center">
              {footer}
            </Text>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
