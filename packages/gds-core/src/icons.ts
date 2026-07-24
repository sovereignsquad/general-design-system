import {
  IconDashboard,
  IconSettings,
  IconUsers,
  IconPlus,
  IconMinus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconDeviceFloppy,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconSquareCheck,
  IconSquareX,
  IconMenu2,
  IconMoon,
  IconSun,
  IconChartBar,
  IconPlayerPlay,
  IconRocket,
  IconBan,
  IconThumbUp,
  // New domain icons
  IconHome,
  IconInbox,
  IconCalendar,
  IconPhoto,
  IconHistory,
  IconUser,
  IconSend,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconPaperclip,
  IconUpload,
  IconDownload,
  IconPrinter,
  IconCopy,
  IconCopyPlus,
  IconChecks,
  IconClearAll,
  IconCamera,
  IconVideo,
  IconCameraRotate,
  IconBolt,
  IconBook,
  IconNotebook,
  IconCertificate,
  IconSchool,
  IconBooks,
  IconAward,
  IconMoodKid,
  IconUsersGroup,
  IconTarget,
  IconFlag,
  IconFlame,
  IconGift,
  IconLanguage,
  IconPalette,
  IconTrophy,
  IconCrown,
  IconPlayerPause,
  IconMessage,
  IconMail,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconLayoutGrid,
  IconList,
  IconDoorExit,
  IconBell,
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconHelpCircle,
  IconFilter,
  IconArrowsSort,
  // New specific icons
  IconFileExport,
  IconFileImport,
  IconTrashOff,
  IconToggleLeft,
  IconLogin,
  IconUserPlus,
  IconShieldCheck,
  IconFileText,
  IconShare,
  IconStar,
  IconArrowsMove,
  IconDotsVertical,
  IconLayoutKanban,
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconBlockquote,
  IconListNumbers,
  IconCode,
  IconH1,
  IconH2,
  // Broader catalog expansion (issue #397)
  IconChevronLeft,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconExternalLink,
  IconLink,
  IconShoppingCart,
  IconPackage,
  IconCreditCard,
  IconWallet,
  IconPercentage,
  IconTag,
  IconHeart,
  IconBookmark,
  IconLock,
  IconLockOpen,
  IconKey,
  IconFingerprint,
  IconClock,
  IconWorld,
  IconMapPin,
  IconBuilding,
  IconFolder,
  IconArchive,
  IconWifi,
  IconQrcode,
  IconTool,
  IconPhone,
  IconGripVertical,
} from '@tabler/icons-react';
import { createElement } from 'react';


/**
 * GdsIcons is the centralized semantic icon dictionary.
 * Applications MUST use these exported icons instead of importing
 * raw icons from tabler/icons-react directly. This ensures complete
 * visual consistency across the platform.
 */
export const GdsIcons = {
  // Navigation
  Dashboard: IconDashboard,
  Settings: IconSettings,
  Users: IconUsers,
  Analytics: IconChartBar,
  Home: IconHome,
  Inbox: IconInbox,
  Calendar: IconCalendar,
  Gallery: IconPhoto,
  History: IconHistory,
  Profile: IconUser,

  // Actions
  Add: IconPlus,
  Remove: IconMinus,
  Edit: IconEdit,
  Delete: IconTrash,
  Search: IconSearch,
  Save: IconDeviceFloppy,
  Play: IconPlayerPlay,
  Start: IconRocket,
  Send: IconSend,
  Reply: IconArrowBackUp,
  Forward: IconArrowForwardUp,
  Attach: IconPaperclip,
  Upload: IconUpload,
  Download: IconDownload,
  Print: IconPrinter,
  Copy: IconCopy,
  Duplicate: IconCopyPlus,
  Check: IconSquareCheck,
  Uncheck: IconSquareX,
  Complete: IconChecks,
  Clear: IconClearAll,
  Cancel: IconBan,
  Confirm: IconThumbUp,
  Close: IconX,

  // Preferences & System
  Language: IconLanguage,
  Theme: IconPalette,

  // Media
  Capture: IconCamera,
  Record: IconVideo,
  Flip: IconCameraRotate,
  Flash: IconBolt,

  // Domain specific
  Course: IconBook,
  Lesson: IconNotebook,
  Certificate: IconCertificate,
  Student: IconSchool,
  Class: IconBooks,
  Grade: IconAward,
  Child: IconMoodKid,
  Family: IconUsersGroup,
  Habit: IconTarget,
  Goal: IconFlag,
  Streak: IconFlame,
  Reward: IconGift,

  // Feedback
  Success: IconCheck,
  Warning: IconAlertTriangle,
  Danger: IconAlertCircle,
  Info: IconInfoCircle,

  // Analysis additions
  Trophy: IconTrophy,
  Crown: IconCrown,
  Star: IconStar,
  Pause: IconPlayerPause,
  Message: IconMessage,
  Mail: IconMail,
  Refresh: IconRefresh,
  TrendingUp: IconTrendingUp,
  TrendingDown: IconTrendingDown,
  Currency: IconCurrencyDollar,
  Grid: IconLayoutGrid,
  List: IconList,
  Logout: IconDoorExit,
  Notifications: IconBell,
  Back: IconArrowLeft,
  Eye: IconEye,
  EyeOff: IconEyeOff,
  Help: IconHelpCircle,
  Filter: IconFilter,
  Sort: IconArrowsSort,

  // New Audit-driven additions
  Export: IconFileExport,
  Import: IconFileImport,
  Preview: IconEye,
  Clone: IconCopy,
  Restore: IconTrashOff,
  Toggle: IconToggleLeft,
  Submit: IconCheck,
  Reset: IconRefresh,
  Login: IconLogin,
  Register: IconUserPlus,
  Verify: IconShieldCheck,
  Launch: IconRocket,
  Draft: IconFileText,
  Refer: IconShare,
  Evidence: IconPaperclip,

  // System
  ChevronDown: IconChevronDown,
  ChevronUp: IconChevronUp,
  Menu: IconMenu2,
  Moon: IconMoon,
  Sun: IconSun,
  Move: IconArrowsMove,
  More: IconDotsVertical,
  Kanban: IconLayoutKanban,

  // Rich text editor (issue #392)
  Bold: IconBold,
  Italic: IconItalic,
  Underline: IconUnderline,
  Strikethrough: IconStrikethrough,
  Quote: IconBlockquote,
  OrderedList: IconListNumbers,
  InlineCode: IconCode,
  Heading1: IconH1,
  Heading2: IconH2,
  Undo: IconArrowBackUp,
  Redo: IconArrowForwardUp,

  // Broader catalog expansion (issue #397)
  ChevronLeft: IconChevronLeft,
  ChevronRight: IconChevronRight,
  ArrowUp: IconArrowUp,
  ArrowDown: IconArrowDown,
  ExternalLink: IconExternalLink,
  Link: IconLink,
  Cart: IconShoppingCart,
  Package: IconPackage,
  Payment: IconCreditCard,
  Wallet: IconWallet,
  Discount: IconPercentage,
  Tag: IconTag,
  Favorite: IconHeart,
  Bookmark: IconBookmark,
  Lock: IconLock,
  Unlock: IconLockOpen,
  Key: IconKey,
  Biometric: IconFingerprint,
  Time: IconClock,
  Globe: IconWorld,
  Location: IconMapPin,
  Building: IconBuilding,
  Folder: IconFolder,
  Archive: IconArchive,
  Connectivity: IconWifi,
  QrCode: IconQrcode,
  Flag: IconFlag,
  Tool: IconTool,
  Phone: IconPhone,
  DragHandle: IconGripVertical,
};

export type GdsIconKey = keyof typeof GdsIcons;
export type GdsIconName = GdsIconKey | Lowercase<GdsIconKey> | keyof typeof gdsIconNameAliases;
export type GdsIconCategory = 'action' | 'status' | 'resource' | 'navigation' | 'media' | 'feedback' | 'system' | 'content' | 'commerce' | 'security';
export type GdsIconA11yMode = 'decorative' | 'informative';

export interface GdsIconMetadata {
  name: GdsIconKey;
  category: GdsIconCategory;
  defaultLabel: string;
  a11yMode: GdsIconA11yMode;
  directImportReplacement: string;
}

const gdsIconNameAliases = {
  add: 'Add',
  analytics: 'Analytics',
  attach: 'Attach',
  back: 'Back',
  calendar: 'Calendar',
  cancel: 'Cancel',
  capture: 'Capture',
  check: 'Check',
  clear: 'Clear',
  clone: 'Clone',
  close: 'Close',
  confirm: 'Confirm',
  copy: 'Copy',
  danger: 'Danger',
  dashboard: 'Dashboard',
  delete: 'Delete',
  download: 'Download',
  edit: 'Edit',
  error: 'Danger',
  evidence: 'Evidence',
  export: 'Export',
  filter: 'Filter',
  gallery: 'Gallery',
  help: 'Help',
  home: 'Home',
  import: 'Import',
  info: 'Info',
  language: 'Language',
  launch: 'Launch',
  login: 'Login',
  logout: 'Logout',
  menu: 'Menu',
  notifications: 'Notifications',
  preview: 'Preview',
  print: 'Print',
  refresh: 'Refresh',
  remove: 'Remove',
  reset: 'Reset',
  restore: 'Restore',
  save: 'Save',
  search: 'Search',
  settings: 'Settings',
  sort: 'Sort',
  submit: 'Submit',
  success: 'Success',
  theme: 'Theme',
  upload: 'Upload',
  users: 'Users',
  verify: 'Verify',
  warning: 'Warning',
} as const satisfies Record<string, GdsIconKey>;

const categoryByIcon = {
  action: ['Add', 'Remove', 'Edit', 'Delete', 'Search', 'Save', 'Play', 'Start', 'Send', 'Reply', 'Forward', 'Attach', 'Upload', 'Download', 'Print', 'Copy', 'Duplicate', 'Check', 'Uncheck', 'Complete', 'Clear', 'Cancel', 'Confirm', 'Close', 'Export', 'Import', 'Preview', 'Clone', 'Restore', 'Toggle', 'Submit', 'Reset', 'Login', 'Register', 'Verify', 'Launch', 'Draft', 'Refer'],
  status: ['Success', 'Warning', 'Danger', 'Info'],
  resource: ['Users', 'Gallery', 'Profile', 'Course', 'Lesson', 'Certificate', 'Student', 'Class', 'Grade', 'Child', 'Family', 'Habit', 'Goal', 'Streak', 'Reward', 'Trophy', 'Crown', 'Star', 'Currency', 'Evidence'],
  navigation: ['Dashboard', 'Analytics', 'Home', 'Inbox', 'Calendar', 'History', 'Grid', 'List', 'Back', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'ArrowUp', 'ArrowDown', 'ExternalLink', 'Link', 'Menu', 'Kanban', 'Location'],
  media: ['Capture', 'Record', 'Flip', 'Flash', 'Eye', 'EyeOff'],
  feedback: ['Message', 'Mail', 'Refresh', 'TrendingUp', 'TrendingDown', 'Notifications', 'Help'],
  system: ['Settings', 'Language', 'Theme', 'Logout', 'Moon', 'Sun', 'Filter', 'Sort', 'Move', 'More', 'Connectivity', 'Tool'],
  content: ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Quote', 'OrderedList', 'InlineCode', 'Heading1', 'Heading2', 'Undo', 'Redo'],
  commerce: ['Cart', 'Package', 'Payment', 'Wallet', 'Discount', 'Tag'],
  security: ['Lock', 'Unlock', 'Key', 'Biometric'],
} as const satisfies Record<GdsIconCategory, readonly GdsIconKey[]>;

function startCase(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function categoryForIcon(name: GdsIconKey): GdsIconCategory {
  for (const [category, keys] of Object.entries(categoryByIcon) as Array<[GdsIconCategory, readonly GdsIconKey[]]>) {
    if (keys.includes(name)) {
      return category;
    }
  }
  return 'system';
}

function resolveGdsIconKey(value: GdsIconName | string | undefined): GdsIconKey {
  if (!value) {
    return 'Help';
  }
  if (isGdsIconKey(value)) {
    return value;
  }
  const alias = gdsIconNameAliases[value as keyof typeof gdsIconNameAliases];
  if (alias) {
    return alias;
  }
  const normalized = value.slice(0, 1).toUpperCase() + value.slice(1);
  return isGdsIconKey(normalized) ? normalized : 'Help';
}

export const gdsIconRegistry = Object.fromEntries(
  (Object.keys(GdsIcons) as GdsIconKey[]).map((name) => [
    name,
    {
      name,
      category: categoryForIcon(name),
      defaultLabel: startCase(name),
      a11yMode: 'decorative',
      directImportReplacement: `<GdsIcon name="${name}" label="${startCase(name)}" />`,
    } satisfies GdsIconMetadata,
  ]),
) as Record<GdsIconKey, GdsIconMetadata>;

export function isGdsIconKey(value: string): value is GdsIconKey {
  return value in GdsIcons;
}

export function getGdsIconKeys(): GdsIconKey[] {
  return Object.keys(GdsIcons) as GdsIconKey[];
}

export function getGdsIconMetadata(name: GdsIconName | string): GdsIconMetadata {
  return gdsIconRegistry[resolveGdsIconKey(name)];
}

export interface GdsIconProps {
  icon?: GdsIconName;
  name?: GdsIconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number | string;
  label?: string;
  decorative?: boolean;
  stroke?: number;
  tone?: GdsIconTone;
}

export type GdsIconTone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export const gdsIconToneColor: Record<GdsIconTone, string | undefined> = {
  default: undefined,
  primary: 'var(--mantine-primary-color-filled)',
  success: 'var(--mantine-color-green-7)',
  warning: 'var(--mantine-color-yellow-8)',
  danger: 'var(--mantine-color-red-7)',
  info: 'var(--mantine-color-blue-7)',
  muted: 'var(--mantine-color-dimmed)',
};

export function getGdsIconToneColor(tone: GdsIconTone = 'default') {
  return gdsIconToneColor[tone];
}

const iconSizes: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: '0.875rem',
  sm: '1rem',
  md: '1.125rem',
  lg: '1.35rem',
};

export function GdsIcon({
  icon,
  name,
  size = 'md',
  label,
  decorative = !label,
  stroke = 1.75,
  tone = 'default',
}: GdsIconProps) {
  const iconKey = resolveGdsIconKey(icon ?? name);
  const metadata = getGdsIconMetadata(iconKey);
  const Icon = GdsIcons[iconKey] ?? GdsIcons.Help;
  const isDecorative = decorative ?? !label;
  return createElement(Icon, {
    size: typeof size === 'number' ? `${size}px` : iconSizes[size as keyof typeof iconSizes] ?? size,
    stroke,
    color: getGdsIconToneColor(tone),
    'data-gds-icon': iconKey,
    'data-gds-icon-category': metadata.category,
    'aria-hidden': isDecorative || undefined,
    'aria-label': !isDecorative ? label ?? metadata.defaultLabel : undefined,
    role: !isDecorative ? 'img' : undefined,
  } as Record<string, unknown>);
}
