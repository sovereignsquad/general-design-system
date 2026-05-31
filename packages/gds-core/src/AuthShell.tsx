import type { ReactNode } from 'react';
import { Alert, Badge, Box, Card, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';

export interface AuthShellProps {
  title: string;
  description?: ReactNode;
  intent?: 'sign-in' | 'sign-up' | 'account-linking' | 'guest-entry';
  brand?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  guestAction?: ReactNode;
  supportAction?: ReactNode;
  socialAuth?: ReactNode;
  dividerLabel?: ReactNode;
  children: ReactNode;
}

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
