import type { ReactNode } from 'react';
import { Box, Card, Container, Group, Stack, Text, Title } from '@mantine/core';

export interface AuthShellProps {
  title: string;
  description?: ReactNode;
  brand?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  helper?: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, description, brand, headerActions, footer, helper, children }: AuthShellProps) {
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
