/** Lifecycle state of an access gate, from checking auth through locked/unlocking to unlocked, denied, expired, or errored. */
export type GdsAccessGateState =
  | 'loading-auth'
  | 'preview'
  | 'locked'
  | 'unlocking'
  | 'unlocked'
  | 'permission-denied'
  | 'expired'
  | 'error';

/** Why a gate is locked or denied — used to select the right message and recovery actions. */
export type GdsAccessGateReason =
  | 'login-required'
  | 'subscription-required'
  | 'role-required'
  | 'session-expired'
  | 'entitlement-missing'
  | 'network-timeout'
  | 'unknown-error';

/** Recovery actions a gate can offer. */
export type GdsAccessGateActionKind =
  | 'sign-in'
  | 'sign-up'
  | 'subscribe'
  | 'request-access'
  | 'retry'
  | 'back';

/** A single recovery action rendered on a gate. */
export interface GdsAccessGateAction {
  kind: GdsAccessGateActionKind;
  /** Overrides the action's default label. */
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<void>;
}

/** Fully resolved description of a gate's current state: what to show, why, and how to recover. */
export interface GdsAccessGateContract {
  /** Stable gate identifier. */
  id: string;
  state: GdsAccessGateState;
  reason?: GdsAccessGateReason;
  /** Visible heading. */
  title: string;
  /** Visible body copy. */
  description: string;
  /** Recovery actions, in caller order. */
  actions?: GdsAccessGateAction[];
  /** Label of the entitlement required to unlock. */
  entitlementLabel?: string;
  /** Label for the teaser/preview affordance. */
  teaserLabel?: string;
  /** Rendering policy for protected content; must be declared for any non-unlocked state. */
  protectedContentPolicy?: 'never-render-while-locked' | 'render-degraded-while-locked';
}

/** Result of an auth-session check. */
export interface GdsAccessSession {
  status: 'loading' | 'anonymous' | 'authenticated' | 'expired';
  /** Authenticated subject identifier, when known. */
  subjectId?: string;
}

/** Result of an entitlement check for an authenticated session. */
export interface GdsAccessEntitlement {
  allowed: boolean;
  /** Denial reason when `allowed` is false. */
  reason?: GdsAccessGateReason;
  /** Human-readable entitlement name (e.g. the plan) for messaging. */
  label?: string;
}

/** Host-provided source of truth for a gate: resolves the session and, optionally, the entitlement. */
export interface GdsAccessAdapter {
  /** Resolves the current session, honoring an optional abort signal. */
  getSession: (signal?: AbortSignal) => Promise<GdsAccessSession> | GdsAccessSession;
  /** Resolves the entitlement for a session, when access is gated beyond sign-in. */
  getEntitlement?: (session: GdsAccessSession, signal?: AbortSignal) => Promise<GdsAccessEntitlement> | GdsAccessEntitlement;
}

/** Options for {@link resolveGdsAccessAdapterState}. */
export interface GdsAccessAdapterOptions {
  gateId: string;
  /** Timeout budget (ms) for the adapter calls; defaults to 3500. */
  timeoutMs?: number;
}

/** Analytics-safe event describing a gate view, action, or outcome; carries only redacted metadata. */
export interface GdsAccessGateEvent {
  type:
    | 'gds.access_gate.view'
    | 'gds.access_gate.action'
    | 'gds.access_gate.unlocked'
    | 'gds.access_gate.denied'
    | 'gds.access_gate.timeout'
    | 'gds.access_gate.error';
  gateId: string;
  state: GdsAccessGateState;
  reason?: GdsAccessGateReason;
  /** Action taken, for `action` events. */
  actionKind?: GdsAccessGateActionKind;
  /** Redacted metadata (see {@link redactGdsAccessGateMetadata}). */
  metadata?: Record<string, string | number | boolean>;
}

const states: GdsAccessGateState[] = [
  'loading-auth',
  'preview',
  'locked',
  'unlocking',
  'unlocked',
  'permission-denied',
  'expired',
  'error',
];

const reasons: GdsAccessGateReason[] = [
  'login-required',
  'subscription-required',
  'role-required',
  'session-expired',
  'entitlement-missing',
  'network-timeout',
  'unknown-error',
];

const actionPriority: Record<GdsAccessGateActionKind, number> = {
  'sign-in': 10,
  subscribe: 20,
  'sign-up': 30,
  'request-access': 40,
  retry: 50,
  back: 60,
};

const sensitiveMetadataPattern = /token|secret|password|email|content|body|html|markdown|cookie|session/i;

/** Returns a copy of every supported access-gate state. */
export function getGdsAccessGateStates() {
  return [...states];
}

/** Returns a copy of every supported access-gate reason. */
export function getGdsAccessGateReasons() {
  return [...reasons];
}

/** Returns the sort weight for an action kind (lower sorts first). */
export function getGdsAccessGateActionPriority(kind: GdsAccessGateActionKind) {
  return actionPriority[kind];
}

/** Returns a new array of actions ordered by their governed priority. */
export function sortGdsAccessGateActions(actions: GdsAccessGateAction[]) {
  return [...actions].sort((first, second) => actionPriority[first.kind] - actionPriority[second.kind]);
}

/**
 * Validates a gate contract, returning human-readable failure messages (empty when
 * valid). Checks for a stable id, a supported state/reason, a visible title and
 * description, a declared `protectedContentPolicy` on any non-unlocked state, and a
 * recovery action on locked/denied states.
 */
export function validateGdsAccessGateContract(contract: GdsAccessGateContract) {
  const failures: string[] = [];

  if (!contract.id.trim()) {
    failures.push('Access gate requires a stable id.');
  }
  if (!states.includes(contract.state)) {
    failures.push(`Unsupported access gate state: ${contract.state}.`);
  }
  if (contract.reason && !reasons.includes(contract.reason)) {
    failures.push(`Unsupported access gate reason: ${contract.reason}.`);
  }
  if (!contract.title.trim()) {
    failures.push('Access gate requires a visible title.');
  }
  if (!contract.description.trim()) {
    failures.push('Access gate requires a visible description.');
  }
  const validPolicies = ['never-render-while-locked', 'render-degraded-while-locked'] as const;
  if (contract.state !== 'unlocked' && contract.protectedContentPolicy != null && !validPolicies.includes(contract.protectedContentPolicy)) {
    failures.push('Locked access gates must declare protectedContentPolicy: never-render-while-locked or render-degraded-while-locked.');
  }
  if (contract.state !== 'unlocked' && contract.protectedContentPolicy == null) {
    failures.push('Locked access gates must declare protectedContentPolicy: never-render-while-locked.');
  }
  if ((contract.state === 'locked' || contract.state === 'permission-denied') && (!contract.actions || contract.actions.length === 0)) {
    failures.push('Locked and denied access gates require at least one recovery action.');
  }

  return failures;
}

/** Returns a copy of metadata with sensitive keys (token, secret, password, email, content, etc.) replaced by `[redacted]` and any non-scalar values dropped. */
export function redactGdsAccessGateMetadata(metadata: Record<string, unknown> = {}) {
  const safe: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveMetadataPattern.test(key)) {
      safe[key] = '[redacted]';
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    }
  }

  return safe;
}

/** Builds a {@link GdsAccessGateEvent} from a contract, redacting the supplied metadata. */
export function createGdsAccessGateEvent(
  type: GdsAccessGateEvent['type'],
  contract: Pick<GdsAccessGateContract, 'id' | 'state' | 'reason'>,
  metadata?: Record<string, unknown>,
  actionKind?: GdsAccessGateActionKind,
): GdsAccessGateEvent {
  return {
    type,
    gateId: contract.id,
    state: contract.state,
    reason: contract.reason,
    actionKind,
    metadata: redactGdsAccessGateMetadata(metadata),
  };
}

/**
 * Derives the {@link GdsAccessGateContract} to render from a session, entitlement,
 * and/or error. Precedence: error → loading → anonymous (locked) → expired →
 * entitlement denied (permission-denied) → unlocked, each with governed title, copy,
 * recovery actions, and a fail-closed `protectedContentPolicy`.
 */
export function resolveGdsAccessState({
  gateId,
  session,
  entitlement,
  error,
}: {
  gateId: string;
  session?: GdsAccessSession;
  entitlement?: GdsAccessEntitlement;
  error?: unknown;
}): GdsAccessGateContract {
  if (error) {
    return {
      id: gateId,
      state: 'error',
      reason: 'unknown-error',
      title: 'Access check failed',
      description: 'We could not verify access. Retry before showing protected content.',
      actions: [{ kind: 'retry' }],
      protectedContentPolicy: 'never-render-while-locked',
    };
  }

  if (!session || session.status === 'loading') {
    return {
      id: gateId,
      state: 'loading-auth',
      title: 'Checking access',
      description: 'We are verifying the session before protected content is considered.',
      protectedContentPolicy: 'never-render-while-locked',
    };
  }

  if (session.status === 'anonymous') {
    return {
      id: gateId,
      state: 'locked',
      reason: 'login-required',
      title: 'Sign in to continue',
      description: 'Preview is available. The rest is only rendered after sign in.',
      actions: [{ kind: 'sign-in' }, { kind: 'sign-up' }],
      protectedContentPolicy: 'never-render-while-locked',
    };
  }

  if (session.status === 'expired') {
    return {
      id: gateId,
      state: 'expired',
      reason: 'session-expired',
      title: 'Session expired',
      description: 'Sign in again to unlock this content.',
      actions: [{ kind: 'sign-in' }, { kind: 'retry' }],
      protectedContentPolicy: 'never-render-while-locked',
    };
  }

  if (entitlement && !entitlement.allowed) {
    const reason = entitlement.reason ?? 'entitlement-missing';
    return {
      id: gateId,
      state: 'permission-denied',
      reason,
      title: reason === 'subscription-required' ? 'Subscription required' : 'Access unavailable',
      description: entitlement.label
        ? `${entitlement.label} is required before this content can be rendered.`
        : 'Your account is signed in but does not have access to this content.',
      actions: reason === 'subscription-required' ? [{ kind: 'subscribe' }, { kind: 'back' }] : [{ kind: 'request-access' }, { kind: 'back' }],
      entitlementLabel: entitlement.label,
      protectedContentPolicy: 'never-render-while-locked',
    };
  }

  return {
    id: gateId,
    state: 'unlocked',
    title: 'Content unlocked',
    description: 'The current session and entitlement allow this content to render.',
  };
}

/** Identity helper that returns the adapter unchanged, for type-checked inline definition. */
export function createGdsAccessAdapter(adapter: GdsAccessAdapter) {
  return adapter;
}

/**
 * Runs an adapter's session and (optional) entitlement checks under a timeout and
 * returns the resolved {@link GdsAccessGateContract}. On timeout it maps to a
 * `network-timeout` retry state; on other failures, a generic error state.
 */
export async function resolveGdsAccessAdapterState(
  adapter: GdsAccessAdapter,
  options: GdsAccessAdapterOptions,
) {
  const timeoutMs = options.timeoutMs ?? 3500;
  const controller = typeof AbortController === 'undefined' ? undefined : new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller?.abort();
      reject(new Error('gds-access-gate-timeout'));
    }, timeoutMs);
  });

  try {
    const session = await Promise.race([Promise.resolve(adapter.getSession(controller?.signal)), timeout]);
    const entitlement = adapter.getEntitlement
      ? await Promise.race([Promise.resolve(adapter.getEntitlement(session, controller?.signal)), timeout])
      : undefined;

    return resolveGdsAccessState({ gateId: options.gateId, session, entitlement });
  } catch (error) {
    const timeoutError = error instanceof Error && error.message === 'gds-access-gate-timeout';
    return {
      ...resolveGdsAccessState({ gateId: options.gateId, error }),
      reason: timeoutError ? 'network-timeout' as const : 'unknown-error' as const,
      title: timeoutError ? 'Access check timed out' : 'Access check failed',
      description: timeoutError
        ? 'The access service did not respond in time. Retry before showing protected content.'
        : 'We could not verify access. Retry before showing protected content.',
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
