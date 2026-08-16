import type { ReactNode } from 'react';
import { Anchor } from '@mantine/core';

/** Governed inline text link: internal paths (hash targets included) or external URLs via `external`. */
export interface GdsInlineLinkProps {
  /** Destination — an internal path (hash targets included) or an external URL with `external`. */
  href: string;
  /** The link text. */
  children: ReactNode;
  /** Open in a new tab (external references). Adds the safe rel automatically. */
  external?: boolean;
  /** Accessible name, when the visible text alone doesn't describe the destination. */
  ariaLabel?: string;
}

/** Inline anchor; adds the safe rel automatically for external links. */
export function GdsInlineLink({ href, children, external, ariaLabel }: GdsInlineLinkProps) {
  return (
    <Anchor
      href={href}
      data-gds-inline-link=""
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </Anchor>
  );
}
