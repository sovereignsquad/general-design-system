import type { ElementType, ReactElement, ReactNode } from 'react';
import { Text, Title } from '@mantine/core';
import type { TitleProps } from '@mantine/core';

const TextRole = Text as unknown as (props: Record<string, unknown>) => ReactElement;

/** Shared props for every GDS typography role: content plus optional `id` and `className`. */
export interface GdsTypographyProps {
  children: ReactNode;
  id?: string;
  className?: string;
}

/** Props for the heading roles, adding `order` to set the semantic heading level while keeping the role's visual size. */
export interface GdsTitleRoleProps extends GdsTypographyProps {
  order?: TitleProps['order'];
}

/**
 * The page's primary heading, rendered at `h1` visual size. Use exactly one
 * `PageTitle` per route so the document outline and assistive-tech landmark tree
 * have a single top-level heading; use {@link SectionTitle} / {@link CardTitle}
 * for the nested levels beneath it. `order` defaults to a semantic `<h1>` — set
 * it only to correct the heading level while keeping the h1 appearance.
 */
export function PageTitle({ children, id, className, order = 1 }: GdsTitleRoleProps) {
  return (
    <Title id={id} className={className} order={order} size="h1" lh={1.1}>
      {children}
    </Title>
  );
}

/** Section-level heading rendered at `h2` visual size; defaults to a semantic `<h2>`. Use beneath {@link PageTitle}. */
export function SectionTitle({ children, id, className, order = 2 }: GdsTitleRoleProps) {
  return (
    <Title id={id} className={className} order={order} size="h2" lh={1.2}>
      {children}
    </Title>
  );
}

/** Card or subsection heading rendered at `h4` visual size; defaults to a semantic `<h3>`. */
export function CardTitle({ children, id, className, order = 3 }: GdsTitleRoleProps) {
  return (
    <Title id={id} className={className} order={order} size="h4" lh={1.25}>
      {children}
    </Title>
  );
}

/** Props for the body/inline text roles, adding `component` to override the rendered element. */
export interface GdsTextRoleProps extends GdsTypographyProps {
  component?: ElementType;
}

/** Default body copy: small size with comfortable line height, rendered as a `<p>` by default. */
export function BodyText({ children, id, className, component = 'p' }: GdsTextRoleProps) {
  return (
    <TextRole id={id} className={className} component={component} size="sm" lh={1.55}>
      {children}
    </TextRole>
  );
}

/** Secondary metadata text: extra-small and dimmed, rendered as a `<span>` by default. */
export function MetadataText({ children, id, className, component = 'span' }: GdsTextRoleProps) {
  return (
    <TextRole id={id} className={className} component={component} size="xs" c="dimmed">
      {children}
    </TextRole>
  );
}

/** Inline label text: small and semibold, rendered as a `<span>` by default. */
export function LabelText({ children, id, className, component = 'span' }: GdsTextRoleProps) {
  return (
    <TextRole id={id} className={className} component={component} size="sm" fw={600}>
      {children}
    </TextRole>
  );
}

/** Inline span that inherits the surrounding type styles, for wrapping a run of text without changing its appearance. */
export function InlineText({ children, id, className, component = 'span' }: GdsTextRoleProps) {
  return (
    <TextRole id={id} className={className} component={component} span inherit>
      {children}
    </TextRole>
  );
}

/** Inline emphasis that inherits surrounding styles but bolds the text, rendered as `<strong>` by default. */
export function InlineEmphasis({ children, id, className, component = 'strong' }: GdsTextRoleProps) {
  return (
    <TextRole id={id} className={className} component={component} span inherit fw={700}>
      {children}
    </TextRole>
  );
}
