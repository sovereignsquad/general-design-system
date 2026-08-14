import { Anchor, Breadcrumbs, Text } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** A single breadcrumb entry: a label and an optional link target. */
export interface GdsBreadcrumbItem {
  label: string;
  href?: string;
}

/** Props for {@link GdsBreadcrumbs}. */
export interface GdsBreadcrumbsProps {
  items: GdsBreadcrumbItem[];
  /**
   * Accessible label for the containing <nav>, following the standard
   * breadcrumb-trail landmark pattern. Defaults to "Breadcrumb".
   */
  ariaLabel?: string;
}

/**
 * Standalone, governed breadcrumb trail (previously only embedded inside
 * `PageHeader`/`WorkspaceHeader`/`DocsPageShell` with no independently
 * reusable primitive — see DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md P0
 * item 2). The last item always renders as the non-link current page,
 * regardless of whether it carries an `href`, matching standard breadcrumb
 * accessibility practice (the current page is never a link to itself).
 */
export function GdsBreadcrumbs({ items, ariaLabel: ariaLabelProp }: GdsBreadcrumbsProps) {
  const { t } = useGdsTranslation();
  const ariaLabel = ariaLabelProp ?? t('gds.gdsBreadcrumbs.ariaLabel', "Breadcrumb");

  if (items.length === 0) {
    return null;
  }

  const lastIndex = items.length - 1;

  return (
    <nav aria-label={ariaLabel}>
      <Breadcrumbs>
        {items.map((item, index) =>
          item.href && index !== lastIndex ? (
            <Anchor key={`${index}-${item.label}`} href={item.href}>
              {item.label}
            </Anchor>
          ) : (
            <Text key={`${index}-${item.label}`} aria-current={index === lastIndex ? 'page' : undefined}>
              {item.label}
            </Text>
          ),
        )}
      </Breadcrumbs>
    </nav>
  );
}
