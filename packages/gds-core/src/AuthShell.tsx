import type { ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { Alert, Badge, Box, Card, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';

/** Props for {@link AuthShell}. */
export interface AuthShellProps {
  /** Card heading, rendered as an `h2`. Name the flow here; the intent badge is not a sufficient cue on its own. */
  title: string;
  /**
   * Supporting copy under the title. Rendered inside a paragraph (`<p>`), so it accepts phrasing
   * content only: text, inline elements, an `Anchor` with `href`, a `Button`. Never `Text` (it
   * renders `<p>`), `Title`, `Stack`, `Group` or another block element.
   */
  description?: ReactNode;
  /**
   * Auth flow the shell frames; drives the intent badge. Defaults to `'sign-in'`.
   *
   * - sign-in: `'sign-in'`
   * - account creation: `'sign-up'`
   * - linking an identity provider to an existing account: `'account-linking'`
   * - continuing without an account: `'guest-entry'`
   *
   * No intent exists for password recovery, sign-out, verification or access denied, and the badge
   * always renders: it cannot be hidden, and an omitted `intent` shows the sign-in badge. For
   * access denied and an expired session, render `AccessRecoveryPanel` (`forbidden`,
   * `expired-session`) instead. The badge label is the intent id with its first hyphen replaced by
   * a space, and is not translated.
   */
  intent?: 'sign-in' | 'sign-up' | 'account-linking' | 'guest-entry';
  /** Brand mark shown in the header. */
  brand?: ReactNode;
  /** Header-level actions (e.g. a locale switcher). */
  headerActions?: ReactNode;
  /**
   * Footer copy shown below the card. Rendered inside a paragraph (`<p>`); phrasing content only,
   * as for `description`. A sign-in/sign-up switch here is a `Button variant="subtle"
   * type="button"` or an `Anchor` with `href`, never an `Anchor` with only `onClick`, which is not
   * keyboard-focusable.
   */
  footer?: ReactNode;
  /** Helper copy shown inside the card, below the form. Rendered inside a paragraph (`<p>`); phrasing content only, as for `description`. */
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
 *
 * The shell renders no `<form>`. Put one in `children` so Enter in a field submits: wire it to
 * `useGdsForm`, give each field an `id` equal to its form field name (the `FormErrorSummary`
 * links target `#<field>`), and give the submit button `type="submit"`, because `SemanticButton`
 * and Mantine `Button` default to `type="button"`. `useGdsForm` keeps the `validate` and
 * `onSubmit` from the render in which its snapshot last changed, so key the form component by any
 * value those callbacks read, such as the sign-in/sign-up mode. A flow with only provider buttons
 * needs no `<form>`; pass them as `socialAuth`. A multi-step flow uses one `<form>` per step. Full
 * example with field errors: COMPONENTS_AND_PATTERNS.md, "AuthShell form composition".
 *
 * @example
 * ```tsx
 * <AuthShell
 *   intent={mode}
 *   title={mode === 'sign-in' ? copy.signInTitle : copy.signUpTitle}
 *   footer={(
 *     <Button variant="subtle" type="button" onClick={toggleMode}>
 *       {mode === 'sign-in' ? copy.toSignUp : copy.toSignIn}
 *     </Button>
 *   )}
 * >
 *   <CredentialsForm key={mode} mode={mode} onSubmit={submitCredentials} />
 * </AuthShell>
 *
 * // Inside CredentialsForm:
 * const form = useGdsForm({ initialValues: { identity: '', password: '' }, validate, onSubmit });
 * const { submitState } = form.snapshot;
 *
 * <form noValidate onSubmit={(event) => { event.preventDefault(); void form.submit(); }}>
 *   <GdsFormProvider snapshot={form.snapshot}>
 *     <Stack gap="md">
 *       <FormErrorSummary />
 *       <TextInput
 *         id="identity"
 *         autoComplete="username"
 *         label={copy.identity}
 *         value={String(form.snapshot.fields.identity?.value ?? '')}
 *         onChange={(event) => form.setFieldValue('identity', event.currentTarget.value)}
 *         onBlur={() => form.touchField('identity')}
 *       />
 *       <PasswordInput
 *         id="password"
 *         autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
 *         label={copy.password}
 *         value={String(form.snapshot.fields.password?.value ?? '')}
 *         onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
 *         onBlur={() => form.touchField('password')}
 *       />
 *       <SemanticButton
 *         type="submit"
 *         action={mode === 'sign-in' ? 'login' : 'register'}
 *         loading={submitState === 'validating' || submitState === 'submitting'}
 *       />
 *     </Stack>
 *   </GdsFormProvider>
 * </form>
 * ```
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
  dividerLabel: dividerLabelProp,
  children,
}: AuthShellProps) {
  const { t } = useGdsTranslation();
  const dividerLabel = dividerLabelProp ?? t('gds.authShell.dividerLabel', "Or continue with your account");

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
