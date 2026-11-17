import { useState, type ReactNode } from 'react';
import { BoundedPreviewSurface, DocsPageShell, GdsGrid, GdsStack, MetadataText, PillBar, SectionPanel } from '@sovereignsquad/gds-core';
import { GDS_STYLE_PROFILE_IDS, GdsVibeThemeScope, type GdsStyleProfile } from '@sovereignsquad/gds-theme';
import { AnalyticsTemplateDemo, AssetManagerTemplateDemo, WorkspaceInboxTemplateDemo } from './pattern-pages';

type TemplateId = 'inbox' | 'files' | 'analytics';

const templates: Record<TemplateId, { label: string; render: () => ReactNode }> = {
  inbox: { label: 'Workspace inbox', render: () => <WorkspaceInboxTemplateDemo /> },
  files: { label: 'Asset manager', render: () => <AssetManagerTemplateDemo /> },
  analytics: { label: 'Analytics', render: () => <AnalyticsTemplateDemo /> },
};

const profileLabels: Record<GdsStyleProfile, string> = {
  default: 'Preset default',
  minimal: 'Minimal',
  soft: 'Soft',
  structured: 'Structured',
};

export function StyleProfilesPage() {
  const [template, setTemplate] = useState<TemplateId>('inbox');
  return (
    <DocsPageShell
      eyebrow="Theming"
      title="Style profiles side by side"
      lead="The same shipped template under every style profile, in light and dark. A profile changes corner radius, density, resting elevation and the area-chart gradient; the colours come from the preset."
    >
      <GdsStack gap="lg">
        <PillBar<TemplateId>
          ariaLabel="Template"
          value={template}
          onChange={setTemplate}
          options={(Object.keys(templates) as TemplateId[]).map((id) => ({ value: id, label: templates[id].label }))}
        />
        <MetadataText>Default colour preset. Every cell renders the template from the package with that profile and scheme applied to its own subtree.</MetadataText>
        <GdsGrid columns="auto-fit" minColumnWidth="content" gap="lg">
          {GDS_STYLE_PROFILE_IDS.flatMap((profile) => (['light', 'dark'] as const).map((scheme) => (
            <SectionPanel key={`${profile}-${scheme}`} title={`${profileLabels[profile]} · ${scheme === 'light' ? 'Light' : 'Dark'}`}>
              <GdsVibeThemeScope presetId="default" scheme={scheme} styleProfile={profile}>
                <BoundedPreviewSurface minHeight="32rem">{templates[template].render()}</BoundedPreviewSurface>
              </GdsVibeThemeScope>
            </SectionPanel>
          )))}
        </GdsGrid>
      </GdsStack>
    </DocsPageShell>
  );
}
