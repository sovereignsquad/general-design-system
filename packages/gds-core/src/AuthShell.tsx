import type { ReactNode } from 'react';
import { Box, Card, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';

export interface AuthShellProps {
  title: string;
  description?: ReactNode;
  brand?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  helper?: ReactNode;
  socialAuth?: ReactNode;
  dividerLabel?: ReactNode;
  children: ReactNode;
}

export function AuthShell({
  title,
  description,
  brand,
  headerActions,
  footer,
  helper,
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
                <Title order={2}>{title}</Title>
                {description ? (
                  <Text c="dimmed" size="sm">
                    {description}
                  </Text>
                ) : null}
              </Stack>
              {socialAuth ? <Box>{socialAuth}</Box> : null}
              {socialAuth ? <Divider label={dividerLabel} labelPosition="center" /> : null}
              {children}
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
