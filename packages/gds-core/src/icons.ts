import {
  IconDashboard,
  IconSettings,
  IconUsers,
  IconPlus,
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
  IconShare
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
};

export type GdsIconKey = keyof typeof GdsIcons;

export function isGdsIconKey(value: string): value is GdsIconKey {
  return value in GdsIcons;
}

export function getGdsIconKeys(): GdsIconKey[] {
  return Object.keys(GdsIcons) as GdsIconKey[];
}

export interface GdsIconProps {
  icon: GdsIconKey;
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
  size = 'md',
  label,
  decorative = !label,
  stroke = 1.75,
  tone = 'default',
}: GdsIconProps) {
  const Icon = GdsIcons[icon] ?? GdsIcons.Help;
  return createElement(Icon, {
    size: typeof size === 'number' ? `${size}px` : iconSizes[size as keyof typeof iconSizes] ?? size,
    stroke,
    color: getGdsIconToneColor(tone),
    'aria-hidden': decorative || undefined,
    'aria-label': !decorative ? label : undefined,
    role: !decorative ? 'img' : undefined,
  });
}
