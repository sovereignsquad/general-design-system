import { DocsPageShell, ReferenceLinkGrid, ReferenceSection } from '@sovereignsquad/gds-core';
import { getFamilyEntries } from './pattern-registry';
import { FamilyEntryBrowser } from './pattern-pages';

/** Deep dives plus resources demoted from primary navigation; each keeps one canonical link here. */
export function SystemsPage() {
  const systemsFamilyEntries = getFamilyEntries('systems');
  return (
    <DocsPageShell
      title="Systems"
      lead="The capabilities that make GDS more than a component list — each one documentation with live proofs, governed end to end, and available to any consumer of the packages."
    >
      <ReferenceSection title="The systems" description="Deep dives, each proven on the pages it links.">
        <ReferenceLinkGrid
          columns={3}
          items={[
            { id: 'theming', title: 'Theming & the Theme Lab', description: '25 presets, both schemes, the axes that drive every token, and the live lab to try them.', href: '/general-design-system/themes' },
            { id: 'badge-system', title: 'Badge system', description: 'Accents, shapes, counts, tags, meaning — one governed vocabulary with contrast measured live.', href: '#entry-badges' },
            { id: 'generated-imagery', title: 'Generated imagery', description: 'Thumbnails, heroes, avatars and marks — deterministic, theme-aware, no photo pipeline.', href: '#entry-generated-imagery' },
            { id: 'motion-system', title: 'Motion tokens', description: 'Six durations, five easings, seven presets, and the reaction axis — live on hover. For interactive button feedback, see Semantic Actions.', href: '/general-design-system/foundations#entry-motion-system' },
            { id: 'map-system', title: 'Map system', description: 'Real OpenStreetMap tiles, governed pins with states, on-map previews, honest degradation.', href: '/general-design-system/patterns/public#entry-gds-map' },
            { id: 'i18n', title: 'Internationalisation', description: 'Twelve locale packs, the DOM translation engine, and the runtime formatting bridge.', href: '/general-design-system/api' },
          ]}
        />
      </ReferenceSection>
      <FamilyEntryBrowser entries={systemsFamilyEntries} />
      <ReferenceSection title="Resources" description="Adoption, evidence, and intake — everything that used to crowd the primary navigation, one click away.">
        <ReferenceLinkGrid
          columns={3}
          items={[
            { id: 'live-proofs', title: 'Live proofs', description: 'The runtime proof routes: surfaces, layouts, semantics, food, playback, analytics.', href: '/general-design-system/live-proofs' },
            { id: 'coverage', title: 'Coverage', description: 'Route-level parity of documented patterns versus live runtime representation.', href: '/general-design-system/coverage' },
            { id: 'maturity', title: 'Maturity', description: 'The recommended high-value capability groups with delivery value per group.', href: '/general-design-system/maturity' },
            { id: 'use-cases', title: 'Use cases', description: 'Product-owner adoption guide for choosing GDS package lanes.', href: '/general-design-system/use-cases' },
            { id: 'request-feature', title: 'Request a feature', description: 'Canonical intake for capability requests, governance questions, and missing contracts.', href: '/general-design-system/request-feature' },
            { id: 'use-with-ai', title: 'Use with AI', description: 'How AI coding agents consume GDS: the machine-readable entry points and the drop-in rules.', href: '/general-design-system/ai' },
          ]}
        />
      </ReferenceSection>
    </DocsPageShell>
  );
}
