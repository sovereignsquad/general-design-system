# Access Gate and Paywall Runtime

Status: Active SSOT
Last updated: 2026-06-15
Package lane: `@sovereignsquad/gds-core`

`GdsAccessGate` is the canonical GDS pattern for pages where a public teaser is visible and the rest of the page is available only after sign-in, entitlement, subscription, or role validation. Consumers must use this contract instead of CSS hiding, route-local paywall wrappers, or protected content rendered behind overlays.

## Architecture

- `GdsAccessGate` owns the visual boundary, teaser region, locked state, recovery actions, and unlocked protected region.
- `resolveGdsAccessState(...)` maps session and entitlement results into the render contract.
- `createGdsAccessAdapter(...)` and `resolveGdsAccessAdapterState(...)` define the provider-neutral auth/entitlement boundary.
- `validateGdsAccessGateContract(...)` blocks incomplete locked gates before release.
- `createGdsAccessGateEvent(...)` and `redactGdsAccessGateMetadata(...)` define metadata-only observability.

## Runtime Flow

1. Render public teaser content immediately.
2. Resolve session through the host-owned adapter.
3. Resolve entitlement only after an authenticated session exists.
4. Return `locked`, `permission-denied`, `expired`, `error`, or `unlocked`.
5. Render protected content only for `unlocked`.
6. Emit metadata-only events for view, action, unlocked, denied, timeout, and error states.

## Contract

Required locked-state contract:

```tsx
<GdsAccessGate
  id="article-paywall"
  state="locked"
  reason="subscription-required"
  title="Continue with membership"
  description="The teaser is public. The article body renders only after access is unlocked."
  actions={[{ kind: 'subscribe' }, { kind: 'sign-in' }]}
  protectedContentPolicy="never-render-while-locked"
  preview={<ArticleSummary />}
  protectedContent={() => <MemberOnlyArticle />}
/>
```

Protected content must be passed as a node or thunk. When the state is not `unlocked`, GDS does not evaluate the thunk and does not mount the protected subtree.

## States

- `loading-auth`: session or entitlement is being checked; protected content is not rendered.
- `preview`: teaser-only state for routes that delay the lock prompt.
- `locked`: anonymous visitor needs sign-in, sign-up, or subscription.
- `unlocking`: action is in progress; protected content is still not rendered.
- `unlocked`: protected content can render.
- `permission-denied`: signed-in visitor lacks role, scope, or entitlement.
- `expired`: session expired and must be refreshed.
- `error`: access check failed and must recover before rendering protected content.

## Accessibility

- The gate is a named `section` with a visible heading and status copy.
- Teaser content remains readable and reachable.
- Locked placeholders are `aria-hidden` because they are decorative substitutes, not actual content.
- Recovery actions use GDS semantic action buttons where possible.
- Do not rely on blur-only paywalls; blur can disclose content shape and is unreliable for assistive technology.
- Focus order must move from teaser to recovery action controls, then continue to the next page region.

## Observability

Events are metadata-only:

- `gds.access_gate.view`
- `gds.access_gate.action`
- `gds.access_gate.unlocked`
- `gds.access_gate.denied`
- `gds.access_gate.timeout`
- `gds.access_gate.error`

Metadata keys matching token, secret, password, email, content, body, html, markdown, cookie, or session are redacted. Event payloads must not include protected article text, user email, session token, checkout secret, or raw provider response bodies.

## Retries And Timeouts

`resolveGdsAccessAdapterState(...)` defaults to a 3500 ms timeout. Timed-out checks return `error` with reason `network-timeout` and keep protected content unmounted. Retry actions should re-run the adapter with fresh provider state.

## Rollback And Recovery

- If the adapter fails, show `error` or `expired` and keep the teaser visible.
- If entitlement logic changes, roll back the adapter or package version before rendering protected content manually.
- If a product requires a custom provider, keep it behind `createGdsAccessAdapter(...)` and preserve the GDS state contract.
- Never replace the gate with CSS-only hidden content during incident recovery.

## Testing

Required consumer tests:

- locked state does not render protected DOM
- protected content thunk is not called until `unlocked`
- expired and denied states show recovery actions
- timeout returns `network-timeout`
- telemetry redacts protected fields
- keyboard path reaches all recovery controls

Package verification:

- `npm run test:run -- packages/gds-core/src/core.test.tsx`
- `npm run verify:access-gate`
- `npm run verify:release`

## Documentation And Demo

- Live proof: `https://sovereignsquad.github.io/general-design-system/patterns/access#access-gates`
- The access-gate live proof now includes a built-in `Click to login` control for a quick locked/unlocked comparison on the same page.
- API coverage: `GdsAccessGate`, state/reason registries, action sorting, contract validation, access resolver, adapter resolver, and event helpers are covered by the pattern export registry.
- Related primitives: `AccessSummary`, `AccessRecoveryPanel`, `AuthShell`, `ProviderIdentityButtonGroup`, and `GdsTelemetryProvider`.
