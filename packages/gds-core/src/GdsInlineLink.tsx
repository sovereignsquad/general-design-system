import type { ReactNode } from 'react';
import { Anchor } from '@mantine/core';

/**
 * Issue 626 — the governed inline text link.
 *
 * The reference site is barred from raw Mantine imports (correctly), and until this primitive
 * existed it had NO way to render an inline link in body content or a table cell — the
 * component index's first draft was refused by the compliance gate partly for exactly that.
 * Rule 15: the missing capability is the finding; this is the capability. Same-origin SPA
 * navigation with hash targets is the primary use (deep-linking a component's home).
 */
export interface GdsInlineLinkProps {
  /** Destination — an internal path (hash targets included) or an external URL with `external`. */
  href: string;
  /** The link text. */
  children: ReactNode;
  /** Open in a new tab (external references). Adds the safe rel automatically. */
  external?: boolean;
}

/** Governed inline anchor — see the module docs for why this exists. */
export function GdsInlineLink({ href, children, external }: GdsInlineLinkProps) {
  return (
    <Anchor
      href={href}
      data-gds-inline-link=""
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
    >
      {children}
    </Anchor>
  );
}
