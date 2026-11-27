import type { ComponentType, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsAdminDashboardTemplate, GdsAnalyticsTemplate, GdsCrudEditorTemplate, GdsEmptyStateTemplate, GdsErrorPageTemplate, GdsPublicEventTemplate, GdsResourceManagerTemplate, GdsSettingsTemplate, type GdsEmptyStateTemplateProps, type GdsErrorPageTemplateProps } from './GdsPageTemplates';
import { getGdsPageTemplates, type GdsPageTemplateState } from './GdsPageTemplates.shared';
import { GdsAssetManagerTemplate, GdsWorkspaceInboxTemplate } from './GdsPageTemplates.client';
import { GdsThreadList } from './GdsThreadList';
import { TextInput } from './GdsPrimitives';

const examples = import.meta.glob<{ default: ComponentType }>('../../../docs/templates/examples/*.tsx', { eager: true });
const exampleFor = (id: string) => examples[`../../../docs/templates/examples/${id}.tsx`]?.default;

describe('page template spec examples (#950)', () => {
  const templates = getGdsPageTemplates();

  it('has one example per template and no example without a template', () => {
    const ids = templates.map((template) => template.id).sort();
    const files = Object.keys(examples).map((path) => path.replace(/^.*\/([^/]+)\.tsx$/, '$1')).sort();
    expect(files).toEqual(ids);
  });

  it('gives every template do and don\'t guidance', () => {
    for (const template of templates) {
      expect(template.guidance?.do.length, template.id).toBeGreaterThan(0);
      expect(template.guidance?.dont.length, template.id).toBeGreaterThan(0);
    }
  });

  for (const template of getGdsPageTemplates()) {
    it(`renders the ${template.id} example as that template, without axe violations`, async () => {
      const Example = exampleFor(template.id);
      expect(Example).toBeTypeOf('function');
      if (!Example) return;
      const { container } = renderWithGds(<Example />);
      expect(container.querySelector(`[data-gds-page-template="${template.id}"]`)).not.toBeNull();
      await expectNoAxeViolations(container);
    });
  }
});

const renderers: Record<string, (state: GdsPageTemplateState) => ReactElement> = {
  'admin-dashboard': (state) => <GdsAdminDashboardTemplate title="Operations" state={state} />,
  settings: (state) => <GdsSettingsTemplate title="Settings" state={state} />,
  'resource-manager': (state) => <GdsResourceManagerTemplate title="Rooms" state={state} rows={[]} columns={[{ key: 'name', header: 'Name' }]} />,
  'crud-editor': (state) => <GdsCrudEditorTemplate title="Edit room" state={state} form={<TextInput label="Room name" />} />,
  analytics: (state) => <GdsAnalyticsTemplate title="Traffic" state={state} rows={[]} columns={[{ key: 'month', header: 'Month' }]} />,
  'public-event': (state) => <GdsPublicEventTemplate title="Spring meetup" state={state} when="12 April" />,
  'error-page': (state) => <GdsErrorPageTemplate title="" state={state as GdsErrorPageTemplateProps['state']} />,
  'empty-state-page': (state) => <GdsEmptyStateTemplate title="No projects yet" state={state as GdsEmptyStateTemplateProps['state']} />,
  'asset-manager': (state) => <GdsAssetManagerTemplate title="Files" state={state} />,
  'workspace-inbox': (state) => <GdsWorkspaceInboxTemplate title="Inbox" state={state} threadList={<GdsThreadList ariaLabel="Conversations" threads={[]} stateTitleOrder={2} />} />,
};

describe('page templates in every declared state (#950)', () => {
  for (const template of getGdsPageTemplates()) {
    const states = template.id === 'error-page'
      ? (['error', 'not-found', 'permission-denied'] as const)
      : template.id === 'empty-state-page'
        ? (['empty', 'not-found', 'permission-denied'] as const)
        : template.requiredStates;
    for (const state of states) {
      it(`${template.id} in ${state} with no data has a valid heading outline and no axe violations`, async () => {
        const render = renderers[template.id];
        expect(render, template.id).toBeTypeOf('function');
        const { container } = renderWithGds(render(state));
        await expectNoAxeViolations(container);
      });
    }
  }
});
