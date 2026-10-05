/**
 * Sanctioned Mantine passthroughs. Each name below, and its `*Props` type, is a GDS export,
 * re-exported unchanged from `@mantine/core` by every `@sovereignsquad/gds-core` entry and the
 * `@sovereignsquad/gds` umbrella. Consumers import these names from `@sovereignsquad/gds` or
 * `@sovereignsquad/gds-core` (root or `/client`), never from `@mantine/core`. A passthrough has
 * Mantine's behaviour only; prefer the GDS component that carries a contract for the same job,
 * such as `SemanticButton`, `FormField`, `SearchableSelect` or `SidebarNavItem`.
 *
 * This file is the list. Removing a name is a breaking change that needs a
 * DEPRECATIONS_AND_MIGRATIONS.md entry. Policy and replacements for Mantine names not listed
 * here: DEPENDENCY_GOVERNANCE.md, "Mantine boundary".
 */
export {
  Accordion,
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Group,
  Loader,
  Modal,
  MultiSelect,
  NumberInput,
  PasswordInput,
  Progress,
  Radio,
  ScrollArea,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Table,
  Tabs,
  Textarea,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
export type {
  AccordionProps,
  ActionIconProps,
  AnchorProps,
  BadgeProps,
  BoxProps,
  ButtonProps,
  CenterProps,
  CheckboxProps,
  ContainerProps,
  GroupProps,
  LoaderProps,
  ModalProps,
  MultiSelectProps,
  NumberInputProps,
  PasswordInputProps,
  ProgressProps,
  RadioProps,
  ScrollAreaProps,
  SelectProps,
  SimpleGridProps,
  SliderProps,
  StackProps,
  SwitchProps,
  TableProps,
  TabsProps,
  TextareaProps,
  TextInputProps,
  ThemeIconProps,
  TooltipProps,
} from '@mantine/core';

