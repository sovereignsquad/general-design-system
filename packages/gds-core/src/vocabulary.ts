import { GdsIcons } from './icons';

/** Canonical registry of built-in semantic actions, keyed by action name, each with a stable message `id`, `defaultMessage`, `icon`, and success `feedback`. */
export const GdsVocabulary = {
  settings: { id: 'gds.action.settings', defaultMessage: 'Settings', icon: GdsIcons.Settings, feedback: { icon: GdsIcons.Settings, color: 'teal', messageId: 'gds.feedback.saved' }, motion: { press: 'turn' } },
  analytics: { id: 'gds.action.analytics', defaultMessage: 'Analytics', icon: GdsIcons.Analytics, feedback: { icon: GdsIcons.Analytics, color: 'teal', messageId: 'gds.feedback.loaded' }, motion: { press: 'bars' } },
  dashboard: { id: 'gds.action.dashboard', defaultMessage: 'Dashboard', icon: GdsIcons.Dashboard, feedback: { icon: GdsIcons.Dashboard, color: 'teal', messageId: 'gds.feedback.loaded' }, motion: { press: 'needle' } },
  play: { id: 'gds.action.play', defaultMessage: 'Play', icon: GdsIcons.Play, feedback: { icon: GdsIcons.Play, color: 'teal', messageId: 'gds.feedback.started' }, motion: { press: 'nudge-right' } },
  start: { id: 'gds.action.start', defaultMessage: 'Start', icon: GdsIcons.Start, feedback: { icon: GdsIcons.Start, color: 'teal', messageId: 'gds.feedback.started' }, motion: { press: 'launch' } },
  users: { id: 'gds.action.users', defaultMessage: 'Users', icon: GdsIcons.Users, feedback: { icon: GdsIcons.Users, color: 'teal', messageId: 'gds.feedback.loaded' }, motion: { press: 'join' } },
  add: { id: 'gds.action.add', defaultMessage: 'Add', icon: GdsIcons.Add, feedback: { icon: GdsIcons.Success, color: 'teal', messageId: 'gds.feedback.added' }, motion: { press: 'quarter', pending: 'spinner', success: 'turn' } },
  edit: { id: 'gds.action.edit', defaultMessage: 'Edit', icon: GdsIcons.Edit, feedback: { icon: GdsIcons.Edit, color: 'teal', messageId: 'gds.feedback.edited' }, motion: { press: 'scribble' } },
  delete: { id: 'gds.action.delete', defaultMessage: 'Delete', icon: GdsIcons.Delete, feedback: { icon: GdsIcons.Success, color: 'red', messageId: 'gds.feedback.deleted' }, motion: { press: 'lid', pending: 'spinner', success: 'check-pop', confirm: true } },
  save: { id: 'gds.action.save', defaultMessage: 'Save', icon: GdsIcons.Save, feedback: { icon: GdsIcons.Success, color: 'teal', messageId: 'gds.feedback.saved' }, motion: { press: 'pop', pending: 'spinner', success: 'check-draw' } },
  cancel: { id: 'gds.action.cancel', defaultMessage: 'Cancel', icon: GdsIcons.Cancel, feedback: { icon: GdsIcons.Cancel, color: 'red', messageId: 'gds.feedback.canceled' }, motion: { press: 'quarter' } },
  confirm: { id: 'gds.action.confirm', defaultMessage: 'Confirm', icon: GdsIcons.Confirm, feedback: { icon: GdsIcons.Confirm, color: 'teal', messageId: 'gds.feedback.confirmed' }, motion: { press: 'bounce' } },
  close: { id: 'gds.action.close', defaultMessage: 'Close', icon: GdsIcons.Close, feedback: { icon: GdsIcons.Close, color: 'gray', messageId: 'gds.feedback.closed' }, motion: { press: 'draw' } },
  language: { id: 'gds.action.language', defaultMessage: 'Language', icon: GdsIcons.Language, feedback: { icon: GdsIcons.Language, color: 'teal', messageId: 'gds.feedback.changed' }, motion: { press: 'draw-stagger' } },
  theme: { id: 'gds.action.theme', defaultMessage: 'Theme', icon: GdsIcons.Theme, feedback: { icon: GdsIcons.Theme, color: 'teal', messageId: 'gds.feedback.changed' }, motion: { press: 'rock' } },
  home: { id: 'gds.action.home', defaultMessage: 'Home', icon: GdsIcons.Home, feedback: { icon: GdsIcons.Home, color: 'teal', messageId: 'gds.feedback.opened' }, motion: { press: 'draw' } },
  inbox: { id: 'gds.action.inbox', defaultMessage: 'Inbox', icon: GdsIcons.Inbox, feedback: { icon: GdsIcons.Inbox, color: 'teal', messageId: 'gds.feedback.opened' }, motion: { press: 'drop' } },
  calendar: { id: 'gds.action.calendar', defaultMessage: 'Calendar', icon: GdsIcons.Calendar, feedback: { icon: GdsIcons.Calendar, color: 'teal', messageId: 'gds.feedback.opened' }, motion: { press: 'date' } },
  gallery: { id: 'gds.action.gallery', defaultMessage: 'Gallery', icon: GdsIcons.Gallery, feedback: { icon: GdsIcons.Gallery, color: 'teal', messageId: 'gds.feedback.opened' }, motion: { press: 'pop' } },
  history: { id: 'gds.action.history', defaultMessage: 'History', icon: GdsIcons.History, feedback: { icon: GdsIcons.History, color: 'teal', messageId: 'gds.feedback.opened' }, motion: { press: 'rewind' } },
  profile: { id: 'gds.action.profile', defaultMessage: 'Profile', icon: GdsIcons.Profile, feedback: { icon: GdsIcons.Profile, color: 'teal', messageId: 'gds.feedback.opened' }, motion: { press: 'draw' } },
  send: { id: 'gds.action.send', defaultMessage: 'Send', icon: GdsIcons.Send, feedback: { icon: GdsIcons.Success, color: 'blue', messageId: 'gds.feedback.sent' }, motion: { press: 'launch', pending: 'spinner', success: 'fly-off' } },
  reply: { id: 'gds.action.reply', defaultMessage: 'Reply', icon: GdsIcons.Reply, feedback: { icon: GdsIcons.Reply, color: 'blue', messageId: 'gds.feedback.replied' }, motion: { press: 'nudge-left' } },
  forward: { id: 'gds.action.forward', defaultMessage: 'Forward', icon: GdsIcons.Forward, feedback: { icon: GdsIcons.Forward, color: 'blue', messageId: 'gds.feedback.forwarded' }, motion: { press: 'nudge-right' } },
  attach: { id: 'gds.action.attach', defaultMessage: 'Attach', icon: GdsIcons.Attach, feedback: { icon: GdsIcons.Attach, color: 'teal', messageId: 'gds.feedback.attached' }, motion: { press: 'swing' } },
  upload: { id: 'gds.action.upload', defaultMessage: 'Upload', icon: GdsIcons.Upload, feedback: { icon: GdsIcons.Success, color: 'teal', messageId: 'gds.feedback.uploaded' }, motion: { press: 'nudge-up-right', pending: 'bob-up', success: 'check-draw' } },
  download: { id: 'gds.action.download', defaultMessage: 'Download', icon: GdsIcons.Download, feedback: { icon: GdsIcons.Success, color: 'teal', messageId: 'gds.feedback.downloaded' }, motion: { press: 'drop', pending: 'bob-down', success: 'check-draw' } },
  print: { id: 'gds.action.print', defaultMessage: 'Print', icon: GdsIcons.Print, feedback: { icon: GdsIcons.Print, color: 'teal', messageId: 'gds.feedback.printed' }, motion: { press: 'feed', pending: 'feed' } },
  copy: { id: 'gds.action.copy', defaultMessage: 'Copy', icon: GdsIcons.Copy, feedback: { icon: GdsIcons.Success, color: 'teal', messageId: 'gds.feedback.copied' }, motion: { press: 'separate', pending: 'spinner', success: 'check-pop' } },
  duplicate: { id: 'gds.action.duplicate', defaultMessage: 'Duplicate', icon: GdsIcons.Duplicate, feedback: { icon: GdsIcons.Duplicate, color: 'teal', messageId: 'gds.feedback.duplicated' }, motion: { press: 'separate' } },
  check: { id: 'gds.action.check', defaultMessage: 'Check', icon: GdsIcons.Check, feedback: { icon: GdsIcons.Check, color: 'teal', messageId: 'gds.feedback.checked' }, motion: { press: 'draw-last' } },
  uncheck: { id: 'gds.action.uncheck', defaultMessage: 'Uncheck', icon: GdsIcons.Uncheck, feedback: { icon: GdsIcons.Uncheck, color: 'red', messageId: 'gds.feedback.unchecked' }, motion: { press: 'draw-last' } },
  complete: { id: 'gds.action.complete', defaultMessage: 'Complete', icon: GdsIcons.Complete, feedback: { icon: GdsIcons.Complete, color: 'teal', messageId: 'gds.feedback.completed' }, motion: { press: 'draw-stagger', pending: 'spinner', success: 'draw' } },
  clear: { id: 'gds.action.clear', defaultMessage: 'Clear', icon: GdsIcons.Clear, feedback: { icon: GdsIcons.Clear, color: 'red', messageId: 'gds.feedback.cleared' }, motion: { press: 'sweep' } },
  capture: { id: 'gds.action.capture', defaultMessage: 'Capture', icon: GdsIcons.Capture, feedback: { icon: GdsIcons.Capture, color: 'teal', messageId: 'gds.feedback.captured' }, motion: { press: 'shutter' } },
  record: { id: 'gds.action.record', defaultMessage: 'Record', icon: GdsIcons.Record, feedback: { icon: GdsIcons.Record, color: 'teal', messageId: 'gds.feedback.recorded' }, motion: { press: 'pop', pending: 'breathe' } },
  flip: { id: 'gds.action.flip', defaultMessage: 'Flip', icon: GdsIcons.Flip, feedback: { icon: GdsIcons.Flip, color: 'teal', messageId: 'gds.feedback.flipped' }, motion: { press: 'flip' } },
  flash: { id: 'gds.action.flash', defaultMessage: 'Flash', icon: GdsIcons.Flash, feedback: { icon: GdsIcons.Flash, color: 'teal', messageId: 'gds.feedback.flashed' }, motion: { press: 'flicker' } },
  course: { id: 'gds.action.course', defaultMessage: 'Course', icon: GdsIcons.Course, feedback: { icon: GdsIcons.Course, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'page' } },
  lesson: { id: 'gds.action.lesson', defaultMessage: 'Lesson', icon: GdsIcons.Lesson, feedback: { icon: GdsIcons.Lesson, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'page' } },
  certificate: { id: 'gds.action.certificate', defaultMessage: 'Certificate', icon: GdsIcons.Certificate, feedback: { icon: GdsIcons.Certificate, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'celebrate' } },
  student: { id: 'gds.action.student', defaultMessage: 'Student', icon: GdsIcons.Student, feedback: { icon: GdsIcons.Student, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'bounce' } },
  class: { id: 'gds.action.class', defaultMessage: 'Class', icon: GdsIcons.Class, feedback: { icon: GdsIcons.Class, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'page' } },
  grade: { id: 'gds.action.grade', defaultMessage: 'Grade', icon: GdsIcons.Grade, feedback: { icon: GdsIcons.Grade, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'celebrate' } },
  child: { id: 'gds.action.child', defaultMessage: 'Child', icon: GdsIcons.Child, feedback: { icon: GdsIcons.Child, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'bounce' } },
  family: { id: 'gds.action.family', defaultMessage: 'Family', icon: GdsIcons.Family, feedback: { icon: GdsIcons.Family, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'bounce' } },
  habit: { id: 'gds.action.habit', defaultMessage: 'Habit', icon: GdsIcons.Habit, feedback: { icon: GdsIcons.Habit, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'rings', pending: 'rings' } },
  goal: { id: 'gds.action.goal', defaultMessage: 'Goal', icon: GdsIcons.Goal, feedback: { icon: GdsIcons.Goal, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'wave' } },
  streak: { id: 'gds.action.streak', defaultMessage: 'Streak', icon: GdsIcons.Streak, feedback: { icon: GdsIcons.Streak, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'draw' } },
  reward: { id: 'gds.action.reward', defaultMessage: 'Reward', icon: GdsIcons.Reward, feedback: { icon: GdsIcons.Reward, color: 'yellow', messageId: 'gds.feedback.rewarded' }, motion: { press: 'pop', pending: 'spinner', success: 'pop' } },
  trophy: { id: 'gds.action.trophy', defaultMessage: 'Trophy', icon: GdsIcons.Trophy, feedback: { icon: GdsIcons.Trophy, color: 'yellow', messageId: 'gds.feedback.rewarded' }, motion: { press: 'celebrate' } },
  crown: { id: 'gds.action.crown', defaultMessage: 'Crown', icon: GdsIcons.Crown, feedback: { icon: GdsIcons.Crown, color: 'yellow', messageId: 'gds.feedback.rewarded' }, motion: { press: 'celebrate' } },
  pause: { id: 'gds.action.pause', defaultMessage: 'Pause', icon: GdsIcons.Pause, feedback: { icon: GdsIcons.Pause, color: 'teal', messageId: 'gds.feedback.paused' }, motion: { press: 'dip' } },
  message: { id: 'gds.action.message', defaultMessage: 'Message', icon: GdsIcons.Message, feedback: { icon: GdsIcons.Message, color: 'blue', messageId: 'gds.feedback.sent' }, motion: { press: 'bounce' } },
  mail: { id: 'gds.action.mail', defaultMessage: 'Mail', icon: GdsIcons.Mail, feedback: { icon: GdsIcons.Mail, color: 'blue', messageId: 'gds.feedback.mailed' }, motion: { press: 'flap' } },
  refresh: { id: 'gds.action.refresh', defaultMessage: 'Refresh', icon: GdsIcons.Refresh, feedback: { icon: GdsIcons.Success, color: 'teal', messageId: 'gds.feedback.refreshed' }, motion: { press: 'rewind', pending: 'spin', success: 'check-pop' } },
  trendingUp: { id: 'gds.action.trendingUp', defaultMessage: 'Trending Up', icon: GdsIcons.TrendingUp, feedback: { icon: GdsIcons.TrendingUp, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'nudge-up-right' } },
  trendingDown: { id: 'gds.action.trendingDown', defaultMessage: 'Trending Down', icon: GdsIcons.TrendingDown, feedback: { icon: GdsIcons.TrendingDown, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'nudge-down-right' } },
  currency: { id: 'gds.action.currency', defaultMessage: 'Currency', icon: GdsIcons.Currency, feedback: { icon: GdsIcons.Currency, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'flip' } },
  grid: { id: 'gds.action.grid', defaultMessage: 'Grid', icon: GdsIcons.Grid, feedback: { icon: GdsIcons.Grid, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'cells' } },
  list: { id: 'gds.action.list', defaultMessage: 'List', icon: GdsIcons.List, feedback: { icon: GdsIcons.List, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'rows' } },
  logout: { id: 'gds.action.logout', defaultMessage: 'Logout', icon: GdsIcons.Logout, feedback: { icon: GdsIcons.Logout, color: 'teal', messageId: 'gds.feedback.loggedOut' }, motion: { press: 'arrow-out' } },
  notifications: { id: 'gds.action.notifications', defaultMessage: 'Notifications', icon: GdsIcons.Notifications, feedback: { icon: GdsIcons.Notifications, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'ring' } },
  back: { id: 'gds.action.back', defaultMessage: 'Back', icon: GdsIcons.Back, feedback: { icon: GdsIcons.Back, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'nudge-left' } },
  eye: { id: 'gds.action.eye', defaultMessage: 'View', icon: GdsIcons.Eye, feedback: { icon: GdsIcons.Eye, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'blink' } },
  eyeOff: { id: 'gds.action.eyeOff', defaultMessage: 'Hide', icon: GdsIcons.EyeOff, feedback: { icon: GdsIcons.EyeOff, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'draw-last' } },
  help: { id: 'gds.action.help', defaultMessage: 'Help', icon: GdsIcons.Help, feedback: { icon: GdsIcons.Help, color: 'teal', messageId: 'gds.feedback.done' }, motion: { press: 'rock' } },
  filter: { id: 'gds.action.filter', defaultMessage: 'Filter', icon: GdsIcons.Filter, feedback: { icon: GdsIcons.Filter, color: 'teal', messageId: 'gds.feedback.filtered' }, motion: { press: 'squeeze' } },
  sort: { id: 'gds.action.sort', defaultMessage: 'Sort', icon: GdsIcons.Sort, feedback: { icon: GdsIcons.Sort, color: 'teal', messageId: 'gds.feedback.sorted' }, motion: { press: 'swap' } },
  export: { id: 'gds.action.export', defaultMessage: 'Export', icon: GdsIcons.Export, feedback: { icon: GdsIcons.Export, color: 'teal', messageId: 'gds.feedback.exported' }, motion: { press: 'nudge-up-right', pending: 'bob-up' } },
  import: { id: 'gds.action.import', defaultMessage: 'Import', icon: GdsIcons.Import, feedback: { icon: GdsIcons.Import, color: 'teal', messageId: 'gds.feedback.imported' }, motion: { press: 'drop', pending: 'bob-down' } },
  preview: { id: 'gds.action.preview', defaultMessage: 'Preview', icon: GdsIcons.Preview, feedback: { icon: GdsIcons.Preview, color: 'teal', messageId: 'gds.feedback.previewed' }, motion: { press: 'blink' } },
  clone: { id: 'gds.action.clone', defaultMessage: 'Clone', icon: GdsIcons.Clone, feedback: { icon: GdsIcons.Clone, color: 'teal', messageId: 'gds.feedback.cloned' }, motion: { press: 'separate' } },
  restore: { id: 'gds.action.restore', defaultMessage: 'Restore', icon: GdsIcons.Restore, feedback: { icon: GdsIcons.Restore, color: 'teal', messageId: 'gds.feedback.restored' }, motion: { press: 'rewind', pending: 'rewind' } },
  toggle: { id: 'gds.action.toggle', defaultMessage: 'Toggle', icon: GdsIcons.Toggle, feedback: { icon: GdsIcons.Toggle, color: 'teal', messageId: 'gds.feedback.toggled' }, motion: { press: 'knob' } },
  search: { id: 'gds.action.search', defaultMessage: 'Search', icon: GdsIcons.Search, feedback: { icon: GdsIcons.Search, color: 'teal', messageId: 'gds.feedback.searched' }, motion: { press: 'orbit', pending: 'orbit' } },
  submit: { id: 'gds.action.submit', defaultMessage: 'Submit', icon: GdsIcons.Submit, feedback: { icon: GdsIcons.Submit, color: 'teal', messageId: 'gds.feedback.submitted' }, motion: { press: 'draw' } },
  reset: { id: 'gds.action.reset', defaultMessage: 'Reset', icon: GdsIcons.Reset, feedback: { icon: GdsIcons.Reset, color: 'red', messageId: 'gds.feedback.reset' }, motion: { press: 'rewind', pending: 'rewind' } },
  login: { id: 'gds.action.login', defaultMessage: 'Login', icon: GdsIcons.Login, feedback: { icon: GdsIcons.Login, color: 'teal', messageId: 'gds.feedback.loggedIn' }, motion: { press: 'arrow-in' } },
  register: { id: 'gds.action.register', defaultMessage: 'Register', icon: GdsIcons.Register, feedback: { icon: GdsIcons.Register, color: 'teal', messageId: 'gds.feedback.registered' }, motion: { press: 'plus' } },
  verify: { id: 'gds.action.verify', defaultMessage: 'Verify', icon: GdsIcons.Verify, feedback: { icon: GdsIcons.Verify, color: 'teal', messageId: 'gds.feedback.verified' }, motion: { press: 'draw-last' } },
  launch: { id: 'gds.action.launch', defaultMessage: 'Launch', icon: GdsIcons.Launch, feedback: { icon: GdsIcons.Launch, color: 'purple', messageId: 'gds.feedback.launched' }, motion: { press: 'launch' } },
  draft: { id: 'gds.action.draft', defaultMessage: 'Draft', icon: GdsIcons.Draft, feedback: { icon: GdsIcons.Draft, color: 'teal', messageId: 'gds.feedback.drafted' }, motion: { press: 'scribble' } },
  refer: { id: 'gds.action.refer', defaultMessage: 'Refer', icon: GdsIcons.Refer, feedback: { icon: GdsIcons.Refer, color: 'teal', messageId: 'gds.feedback.referred' }, motion: { press: 'share' } },
  evidence: { id: 'gds.action.evidence', defaultMessage: 'Evidence', icon: GdsIcons.Evidence, feedback: { icon: GdsIcons.Evidence, color: 'teal', messageId: 'gds.feedback.added' }, motion: { press: 'swing' } },
} as const;

/** A built-in action name — any key of `GdsVocabulary`. */
export type SemanticAction = keyof typeof GdsVocabulary;
/** Either a built-in `SemanticAction` or a namespaced pack action of the form `"namespace:key"`. */
export type SemanticActionId = SemanticAction | `${string}:${string}`;
/** Translator function that maps a message id and default message to a localized string. */
export type VocabularyResolver = (id: string, defaultMessage: string) => string;

type BaseSemanticActionDefinition = (typeof GdsVocabulary)[SemanticAction];

/**
 * Icon motion while an action's promise is pending. `spinner` replaces the icon with a loader;
 * `spin`, `bob-down` and `bob-up` move the action's own icon.
 */
export type GdsButtonPendingMotion = 'spinner' | 'spin' | 'bob-down' | 'bob-up' | 'orbit' | 'breathe' | 'rewind' | 'feed' | 'rings';

/**
 * Icon motion played once on every click, chosen from what the action's icon depicts: the bell
 * rings, the gear turns, the eye blinks, the trash lid lifts. Part-level motions (`lid`,
 * `separate`, `join`, `flap`, …) move individual paths of the action's Tabler icon.
 */
export type GdsButtonPressMotion =
  | 'arrow-in' | 'arrow-out' | 'bars' | 'blink' | 'bounce' | 'celebrate' | 'cells' | 'date' | 'dip' | 'draw'
  | 'draw-last' | 'draw-stagger' | 'drop' | 'feed' | 'flap' | 'flicker' | 'flip' | 'join' | 'knob' | 'launch'
  | 'lid' | 'needle' | 'nudge-down-right' | 'nudge-left' | 'nudge-right' | 'nudge-up-right' | 'orbit' | 'page'
  | 'plus' | 'pop' | 'quarter' | 'rewind' | 'ring' | 'rings' | 'rock' | 'rows' | 'scribble' | 'separate'
  | 'share' | 'shutter' | 'squeeze' | 'swap' | 'sweep' | 'swing' | 'turn' | 'wave';

/**
 * Icon motion when an action succeeds. `fly-off` sends the icon away and pops a check in;
 * `check-draw` and `check-pop` show a check; `turn` rotates the icon a quarter into a check;
 * `pop` and `draw` animate the success icon itself.
 */
export type GdsButtonSuccessMotion = 'fly-off' | 'check-draw' | 'check-pop' | 'turn' | 'pop' | 'draw';

/** How a `SemanticButton` animates this action. Every motion is disabled under reduced motion. */
export interface GdsButtonMotion {
  /** Played once on every click, with or without `onAction`. */
  press?: GdsButtonPressMotion;
  pending?: GdsButtonPendingMotion;
  success?: GdsButtonSuccessMotion;
  /** The first click asks for confirmation; a second click within the confirm window runs the action. */
  confirm?: boolean;
}

/** Full definition of a semantic action: message id/default, icon, and optional aria label, destructive flag, feedback and motion. */
export interface SemanticActionDefinition {
  id: string;
  defaultMessage: string;
  icon: BaseSemanticActionDefinition['icon'];
  ariaLabel?: string;
  destructive?: boolean;
  feedback?: BaseSemanticActionDefinition['feedback'];
  motion?: GdsButtonMotion;
}

/** A namespaced bundle of custom semantic actions that can be merged into the vocabulary. */
export interface GdsVocabularyPack {
  namespace: string;
  actions: Record<string, SemanticActionDefinition>;
}

/** Builds a `GdsVocabularyPack`, namespacing each action key to `"namespace:key"` and generating its `id` as `gds.action.<namespace>.<key>`. */
export function createGdsVocabularyPack(namespace: string, actions: Record<string, Omit<SemanticActionDefinition, 'id'>>) {
  return {
    namespace,
    actions: Object.fromEntries(
      Object.entries(actions).map(([key, definition]) => [
        `${namespace}:${key}`,
        {
          ...definition,
          id: `gds.action.${namespace}.${key}`,
        },
      ]),
    ),
  } satisfies GdsVocabularyPack;
}

/** Flattens an array of vocabulary packs into a single action map; later packs override earlier ones on key collision. */
export function mergeGdsVocabularyPacks(packs: GdsVocabularyPack[] = []) {
  return packs.reduce<Record<string, SemanticActionDefinition>>((acc, pack) => {
    for (const [key, definition] of Object.entries(pack.actions)) {
      acc[key] = definition;
    }
    return acc;
  }, {});
}

/** Looks up an action's definition, checking the built-in vocabulary first then the merged packs; throws if the action is unknown. */
export function resolveSemanticActionConfig(action: SemanticActionId, packs: GdsVocabularyPack[] = []) {
  const baseConfig = (GdsVocabulary as Record<string, SemanticActionDefinition>)[action];
  if (baseConfig) {
    return baseConfig;
  }

  const merged = mergeGdsVocabularyPacks(packs);
  const packConfig = merged[action];
  if (packConfig) {
    return packConfig;
  }

  throw new Error(`Unknown semantic action: ${action}`);
}

/** Convenience alias of {@link resolveSemanticActionConfig}. */
export function getSemanticActionConfig(action: SemanticActionId, packs: GdsVocabularyPack[] = []) {
  return resolveSemanticActionConfig(action, packs);
}

/** Returns an action's display label, running it through `translate` when provided, otherwise falling back to its `defaultMessage`. */
export function getSemanticActionLabel(action: SemanticActionId, translate?: VocabularyResolver, packs: GdsVocabularyPack[] = []) {
  const config = resolveSemanticActionConfig(action, packs);
  return translate ? translate(config.id, config.defaultMessage) : config.defaultMessage;
}
