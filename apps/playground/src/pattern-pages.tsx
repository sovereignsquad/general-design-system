import { useEffect, useState } from 'react';
import {
  AccessSummary,
  AccessRecoveryPanel,
  ActionBar,
  AccentPanel,
  AdvancedDataTable,
  ArticleShell,
  AuthShell,
  BrowseSurface,
  ChartTokenPanel,
  CtaButtonGroup,
  ChoiceChip,
  PillBar,
  SoftChipGroup,
  FilterChipGroup,
  type GdsSelectionOption,
  ConfirmDialog,
  ConsumerDashboardGrid,
  ConsumerSection,
  type GdsAccessGateAction,
  resolveGdsAccessState,
  createGdsVocabularyPack,
  DataToolbar,
  GdsAreaChart,
  GdsSparkline,
  GdsLongitudinalChart,
  GdsBenchmarkBarChart,
  GdsRadarChart,
  GdsMaturityRadarChart,
  GdsGaugeChart,
  getGdsSeriesColor,
  GdsDialog,
  GdsSidePanel,
  GdsSegmentedControl,
  GdsSlider,
  GdsRatingScale,
  GdsWizardStepper,
  GdsDateInput,
  GdsDateTimeInput,
  GdsDateRangeInput,
  MissingDataPrompt,
  ListingProvider,
  useListingState,
  ActiveFilterChips,
  ResultSummary,
  BulkActionsBar,
  SortMenu,
  DetailProfileShell,
  DiscoveryShell,
  DocsCodeBlock,
  DocsShell,
  DocsPageShell,
  EditorialCard,
  EditorialHero,
  EmptyState,
  EvidencePanel,
  FeatureBand,
  FilterDrawer,
  FoodMenuSection,
  FormField,
  FormErrorSummary,
  GdsAccessGate,
  GdsFormProvider,
  useGdsForm,
  ValidatedFieldMessage,
  GameBoardTile,
  GdsIcons,
  ListingCard,
  MapPanel,
  MediaCard,
  MediaField,
  MetricCard,
  NotificationCenter,
  OverlayManagerProvider,
  useOverlayManager,
  PartnerDiscoveryFilters,
  PartnerDiscoveryShell,
  PartnerListIndex,
  PartnerMapListShell,
  PartnerNewsletterForm,
  PartnerPlaceDetailTemplate,
  partnerDiscoveryDefaultAmenities,
  GdsNotificationProvider,
  BannerNotice,
  BoundedPreviewSurface,
  InlineAlert,
  PlaybackSurface,
  PeriodSelector,
  PlaceholderPanel,
  ProgressCard,
  ProductCard,
  PublicBrandFooter,
  PublicFlowShell,
  PublicFoodCard,
  PublicNav,
  PublicProductCard,
  PublicShell,
  PublicSiteFooter,
  ReferenceLinkGrid,
  ReferenceLocaleNotice,
  ReferenceSection,
  ReportingSection,
  SectionPanel,
  SectionTitle,
  SemanticButton,
  ShareButtonGroup,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
  SocialAuthButtons,
  StateBlock,
  StatusBadge,
  CountBadge,
  LabelTag,
  GdsBadgeShapeCircle,
  GdsBadgeShapeSquircle,
  GdsBadgeShapeHexagon,
  GdsBadgeShapeShield,
  GdsBadgeShapeRosette,
  GdsBadgeShapePin,
  GdsBadge,
  GdsBadgeStack,
  GdsBadgeStackLayer,
  GdsCountBadge,
  GdsRemovableTag,
  GdsIcon,
  MeaningBadge,
  FitScoreChip,
  BodyText,
  SimpleDataTable,
  UploadDropzone,
  CommandRegistryProvider,
  useCommandLauncher,
  GdsTelemetryProvider,
  useGdsTelemetry,
  ProviderIdentityButtonGroup,
  StatsSection,
  ThemeToggle,
  KanbanBoard,
  type KanbanColumnData,
  GdsSchemaForm,
  type GdsFormSchema,
} from '@sovereignsquad/gds-core';
// Dedicated subpath import: GdsRichTextEditor's Tiptap/ProseMirror engine is
// deliberately excluded from the main '@sovereignsquad/gds-core' barrel so
// consumers who don't use it never bundle it (see the comment in
// packages/gds-core/src/rich-text-editor.ts).
import { GdsRichTextEditor } from '@sovereignsquad/gds-core/rich-text-editor';
import {
  AdminSelect,
  AdminTextarea,
  AdminTextInput,
  AppShell,
  ContentOpsActionBar,
  ContentOpsEditor,
  ContentOpsSection,
  DataTable,
  EditorScaffold,
  FormSection,
  InfoCard,
  PageHeader,
  ReferenceSiteShell,
  ResponsiveDataView,
  SemanticNavLink,
  StatsStrip,
  WorkspaceHeader,
} from '@sovereignsquad/gds-admin';
import {
  getFamilyEntries,
  patternRegistry,
  type PatternFamily,
  type PatternRegistryEntry,
} from './pattern-registry';
import { SiteTourLauncher } from './SiteTourLauncher';

const catalogEntryCount = patternRegistry.length;

function ListingFrameworkDemo() {
  const { state, dispatch } = useListingState();
  const resultCount = state.search ? 4 : 12;

  return (
    <div>
      <DataToolbar
        searchSlot={(
          <input
            aria-label="Search dataset"
            value={state.search}
            onChange={(event) => dispatch({ type: 'set-search', value: event.currentTarget.value })}
          />
        )}
        filterSlot={<button type="button" onClick={() => dispatch({ type: 'toggle-filter', value: 'Published' })}>Toggle published</button>}
        sortSlot={(
          <SortMenu
            value={state.sort}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'a-z', label: 'A-Z' },
            ]}
            onChange={(value) => dispatch({ type: 'set-sort', value })}
            label="Sort by"
          />
        )}
        resetAction={<button type="button" onClick={() => dispatch({ type: 'reset-query' })}>Reset</button>}
        createAction={<button type="button">Create</button>}
        activeFilters={state.filters.map((filter) => ({
          label: filter,
          onRemove: () => dispatch({ type: 'toggle-filter', value: filter }),
        }))}
      />
      <br />
      <ResultSummary
        resultCount={resultCount}
        noun="records"
        description={`Sort: ${state.sort}. Active filters: ${state.filters.length}.`}
      />
      <br />
      <ActiveFilterChips
        filters={state.filters.map((filter) => ({
          id: filter,
          label: filter,
          onRemove: () => dispatch({ type: 'toggle-filter', value: filter }),
        }))}
      />
      <br />
      <BulkActionsBar
        selectedCount={state.selection.length}
        actions={<button type="button" onClick={() => dispatch({ type: 'toggle-selection', value: 'row-1' })}>Toggle row-1</button>}
        clearAction={<button type="button" onClick={() => dispatch({ type: 'clear-selection' })}>Clear selection</button>}
      />
      <button type="button" onClick={() => dispatch({ type: 'toggle-selection', value: 'row-1' })}>
        {state.selection.includes('row-1') ? 'Unselect row-1' : 'Select row-1'}
      </button>
    </div>
  );
}

function ChoiceChipFamilyDemo() {
  const options: GdsSelectionOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'legacy', label: 'Legacy', disabled: true },
  ];
  const [pill, setPill] = useState<string | null>('all');
  const [soft, setSoft] = useState<string | null>('active');
  const [filter, setFilter] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(['Published']);
  const toggleTag = (tag: string) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));

  return (
    <div>
      <div>
        <ChoiceChip label="Draft" active />
        <ChoiceChip label="Published" onClick={() => {}} />
        <ChoiceChip label="Archived" />
      </div>
      <br />
      <PillBar options={options} value={pill} onChange={setPill} ariaLabel="Filter by lifecycle (pill)" />
      <br />
      <SoftChipGroup options={options} value={soft} onChange={setSoft} ariaLabel="Filter by lifecycle (soft)" />
      <br />
      <FilterChipGroup options={options} value={filter} onChange={setFilter} ariaLabel="Filter by lifecycle (filter)" />
      <br />
      <div>
        {['Published', 'Draft', 'Archived'].map((tag) => (
          <ChoiceChip key={tag} label={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)} />
        ))}
      </div>
    </div>
  );
}

function FormControlFamilyDemo() {
  const [assessment, setAssessment] = useState<string>('readiness');
  const [rating, setRating] = useState<number>(4);
  const [effort, setEffort] = useState<number>(3);
  const [boundary, setBoundary] = useState<number>(5);
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [sessionDate, setSessionDate] = useState<Date | null>(new Date('2026-07-24'));
  const [checkInTime, setCheckInTime] = useState<Date | null>(new Date('2026-07-24T09:00:00'));
  const [coverageWindow, setCoverageWindow] = useState<[Date | null, Date | null]>([
    new Date('2026-07-24'),
    new Date('2026-08-07'),
  ]);

  const wizardSteps = [
    { id: 'profile', title: 'Profile', description: 'Confirm athlete identity and cohort.' },
    { id: 'metrics', title: 'Metrics', description: 'Capture readiness and recovery scores.', optional: true },
    { id: 'review', title: 'Review', description: 'Confirm and save the assessment.', completed: wizardStep > 2 },
  ];

  return (
    <div>
      <SectionPanel title="Segmented control" description="Overflow-safe assessment tabs, including a many-item scroll case.">
        <GdsSegmentedControl
          ariaLabel="Assessment focus"
          value={assessment}
          onChange={setAssessment}
          options={[
            { value: 'readiness', label: 'Readiness' },
            { value: 'recovery', label: 'Recovery' },
            { value: 'load', label: 'Load' },
            { value: 'archived', label: 'Archived', disabled: true },
          ]}
        />
        <br />
        <GdsSegmentedControl
          ariaLabel="Weekly focus (overflow)"
          value={assessment}
          onChange={setAssessment}
          options={[
            { value: 'readiness', label: 'Readiness' },
            { value: 'recovery', label: 'Recovery' },
            { value: 'load', label: 'Load' },
            { value: 'sleep', label: 'Sleep' },
            { value: 'nutrition', label: 'Nutrition' },
            { value: 'mobility', label: 'Mobility' },
            { value: 'mental', label: 'Mental' },
          ]}
        />
        <br />
        <GdsSegmentedControl
          ariaLabel="Disabled assessment focus"
          value={assessment}
          onChange={setAssessment}
          disabled
          options={[
            { value: 'readiness', label: 'Readiness' },
            { value: 'recovery', label: 'Recovery' },
          ]}
        />
      </SectionPanel>
      <SectionPanel title="Slider and rating" description="1-10 effort slider, a boundary case where min equals max, and a 1-5 rating scale.">
        <GdsSlider
          label="Perceived effort"
          description="Rate the session load from 1 to 10."
          value={effort}
          onChange={setEffort}
          min={1}
          max={10}
        />
        <br />
        <GdsSlider
          label="Single fixed checkpoint"
          description="Boundary case where the minimum equals the maximum."
          value={boundary}
          onChange={setBoundary}
          min={5}
          max={5}
          disabled
        />
        <br />
        <GdsRatingScale
          label="Session satisfaction"
          description="Five-point rating scale."
          value={rating}
          onChange={setRating}
          scale={5}
        />
      </SectionPanel>
      <SectionPanel title="Wizard stepper" description="Save-and-next progression across first, middle, and last steps.">
        <GdsWizardStepper
          steps={wizardSteps}
          activeStep={wizardStep}
          onStepChange={setWizardStep}
          onBack={() => setWizardStep((current) => Math.max(0, current - 1))}
          onSaveNext={() => setWizardStep((current) => Math.min(wizardSteps.length - 1, current + 1))}
        />
      </SectionPanel>
      <SectionPanel title="Date and time inputs" description="Governed date/time/date-range pickers wrapping @mantine/dates behind a GDS-owned contract.">
        <GdsDateInput label="Session date" value={sessionDate} onChange={setSessionDate} />
        <br />
        <GdsDateTimeInput label="Check-in time" value={checkInTime} onChange={setCheckInTime} />
        <br />
        <GdsDateRangeInput label="Coverage window" value={coverageWindow} onChange={setCoverageWindow} />
      </SectionPanel>
    </div>
  );
}

function AdminEditorFlowsDemo() {
  const [visibility, setVisibility] = useState<string | null>('public');
  const [slug, setSlug] = useState('catalog-admin-shell');
  const [notes, setNotes] = useState('');
  const [body, setBody] = useState('<p>Describe the catalog item here.</p>');

  return (
    <ContentOpsEditor
      header={<PageHeader title="Catalog admin shell" description="Canonical content operations workflow." />}
      status={(
        <ContentOpsActionBar
          dirty
          status="Editing in shared governance mode."
          actions={{
            primary: { action: 'save' },
            secondary: [{ action: 'cancel' }],
            tertiary: [{ action: 'preview' }],
          }}
        />
      )}
      sections={(
        <>
        <ContentOpsSection id="visibility" title="Visibility" description="Use shared sections and form contracts.">
          {/*
           * size="xs"/"sm" (and the implicit default) all exercise the mobile
           * input-focus auto-zoom guard (gdsTheme's Input.vars) — these are the
           * exact AdminForms wrapper components a consuming app reported the
           * gap against, not just raw Mantine controls.
           */}
          <AdminSelect
            name="visibility"
            label="Visibility"
            description="Governed control and descriptive labels."
            size="xs"
            value={visibility}
            onChange={setVisibility}
            data={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]}
          />
          <AdminTextInput
            name="slug"
            label="Slug"
            size="sm"
            value={slug}
            onChange={setSlug}
          />
          <AdminTextarea
            name="notes"
            label="Internal notes"
            value={notes}
            onChange={setNotes}
          />
        </ContentOpsSection>
        <ContentOpsSection id="body" title="Description" description="Content Ops Editor composes GdsRichTextEditor for the actual text-editing surface, closing the previous gap where this shell owned only the surrounding layout.">
          <GdsRichTextEditor label="Description" value={body} onChange={setBody} />
        </ContentOpsSection>
        </>
      )}
      preview={
        <SectionPanel title="Live preview" description="Shared preview rail for editor contexts.">
          <p>Keep previews close to the current editing state.</p>
        </SectionPanel>
      }
      settings={
        <SectionPanel title="Settings" description="Operations settings stay in the same contract.">
          <p>Settings remain grouped and stable for team-wide governance.</p>
        </SectionPanel>
      }
      actionBar={<ContentOpsActionBar actions={{ primary: { action: 'save' }, secondary: [{ action: 'refresh' }] }} />}
    />
  );
}

function ChartWrapperFamilyDemo() {
  const trend = [
    { label: 'Wk 1', value: 42 },
    { label: 'Wk 2', value: 55 },
    { label: 'Wk 3', value: 61 },
    { label: 'Wk 4', value: 78 },
  ];
  const radar = [
    { label: 'Sprint', value: 4 },
    { label: 'Endurance', value: 5 },
    { label: 'Recovery', value: 3 },
    { label: 'Mobility', value: 4 },
  ];
  const gauge = [{ label: 'Readiness', value: 72 }];

  return (
    <div>
      <SectionPanel title="Populated chart wrappers" description="Every wrapper renders its visual plus the mandatory accessible table fallback.">
        <GdsAreaChart title="Load trend" summary="Weekly training load trend for the athlete." data={trend} />
        <br />
        <GdsSparkline title="Readiness sparkline" summary="Compact readiness trend across recent sessions." data={trend} />
        <br />
        <GdsLongitudinalChart title="Longitudinal progression" summary="Longitudinal progression across the mesocycle." data={trend} />
        <br />
        <GdsBenchmarkBarChart title="Benchmark comparison" summary="Athlete metrics compared against the squad benchmark." data={trend} seriesTone="info" />
        <br />
        <GdsRadarChart title="Capability profile" summary="Multi-dimension capability profile." data={radar} />
        <br />
        <GdsMaturityRadarChart title="Maturity profile" summary="Maturity coverage across capability dimensions." data={radar} />
        <br />
        <GdsGaugeChart title="Readiness gauge" summary="Current readiness index against target." data={gauge} />
      </SectionPanel>
      <SectionPanel title="Empty and loading states" description="Empty data and loading states surface the accessible fallback instead of a blank chart.">
        <GdsAreaChart title="Empty load trend" summary="No sessions recorded for this period yet." data={[]} />
        <br />
        <GdsBenchmarkBarChart title="Loading benchmark" summary="Benchmark data is loading." data={trend} state="loading" />
      </SectionPanel>
    </div>
  );
}

function MissingDataPromptDemo() {
  return (
    <div>
      <StateBlock
        variant="info"
        title="Shared feedback surface"
        description="State content can now use contract-driven centered presentation directly."
        minHeight={320}
        presentation="centered"
        contentAlign="center"
        contentJustify="center"
        compact
      />
      <br />
      <SectionPanel title="Missing data prompt" description="Default i18n-resolved recovery copy with a required-fields list and call to action.">
        <MissingDataPrompt
          missingFields={['Readiness score', 'Recovery notes']}
          action={<SemanticButton action="add">Add required data</SemanticButton>}
        />
      </SectionPanel>
      <div role="status">
        <SectionPanel title="Missing data status region" description="Same prompt announced through a status region for assistive technology.">
          <MissingDataPrompt
            title="Assessment incomplete"
            description="Provide the outstanding inputs before the readiness view can be trusted."
          />
        </SectionPanel>
      </div>
    </div>
  );
}

function OverlayAliasDemo() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <OverlayManagerProvider>
      <SectionPanel title="Dialog and side panel aliases" description="Product-vocabulary overlay wrappers over the governed modal and drawer primitives.">
        <button id="open-alias-dialog" type="button" onClick={() => setDialogOpen(true)}>Open dialog</button>
        {' '}
        <button id="open-alias-panel" type="button" onClick={() => setPanelOpen(true)}>Open side panel</button>
        <GdsDialog
          id="alias-dialog"
          opened={dialogOpen}
          onClose={() => setDialogOpen(false)}
          invokerId="open-alias-dialog"
          title="Assessment dialog"
          description="Focus is trapped, Escape closes, and focus returns to the trigger."
        >
          <p>Dialog body content stays on an opaque governed overlay surface.</p>
          <SemanticButton action="confirm" onClick={() => setDialogOpen(false)}>Confirm</SemanticButton>
        </GdsDialog>
        <GdsSidePanel
          id="alias-side-panel"
          opened={panelOpen}
          onClose={() => setPanelOpen(false)}
          invokerId="open-alias-panel"
          title="Details side panel"
          description="Side panel wrapper with scroll lock and focus return."
        >
          <p>Side panel body content for extended context.</p>
          <SemanticButton action="close" onClick={() => setPanelOpen(false)}>Close panel</SemanticButton>
        </GdsSidePanel>
      </SectionPanel>
    </OverlayManagerProvider>
  );
}

function FormArchitectureDemo() {
  const form = useGdsForm({
    initialValues: { title: '', status: 'Draft' },
    validate: (snapshot) => {
      const titleValue = String(snapshot.fields.title?.value ?? '').trim();
      return titleValue.length < 3
        ? [{ field: 'title', message: 'Title must contain at least 3 characters.', severity: 'blocking' as const }]
        : [];
    },
    onSubmit: async () => {},
  });

  return (
    <GdsFormProvider snapshot={form.snapshot}>
      <SectionPanel title="Shared form guidance" description="GDS governs labels, descriptions, validation, and submit-state behavior.">
        <div>
          <FormErrorSummary />
          <FormField label="Title" description="Use shared form fields for all labels and errors.">
            <input
              id="title"
              aria-label="Title"
              aria-describedby="title-error"
              value={String(form.snapshot.fields.title?.value ?? '')}
              onChange={(event) => form.setFieldValue('title', event.currentTarget.value)}
              onBlur={() => form.touchField('title')}
            />
          </FormField>
          <ValidatedFieldMessage field="title" />
          <FormField label="Status" description="Use shared select semantics for branch choices.">
            <select aria-label="Status" value={String(form.snapshot.fields.status?.value ?? 'Draft')} onChange={(event) => form.setFieldValue('status', event.currentTarget.value)}>
              <option>Draft</option>
              <option>Published</option>
            </select>
          </FormField>
        </div>
        <ActionBar
          primary={{ action: 'submit', onClick: () => { void form.submit(); }, loading: form.snapshot.submitState === 'submitting' || form.snapshot.submitState === 'validating' }}
          secondary={[{ action: 'cancel' }]}
        />
      </SectionPanel>
    </GdsFormProvider>
  );
}

function OverlayProbe() {
  const overlay = useOverlayManager();
  const topOverlay = overlay.stack[overlay.stack.length - 1];

  return (
    <SectionPanel title="Overlay stack governance" description={`Top overlay: ${topOverlay?.id ?? 'none'}.`}>
      <button type="button" onClick={() => overlay.registerOverlay({ id: 'dialog-a', kind: 'dialog', invokerId: 'open-dialog' })}>Register dialog</button>
      <button type="button" onClick={() => overlay.registerOverlay({ id: 'drawer-a', kind: 'drawer', invokerId: 'open-drawer' })}>Register drawer</button>
      <button type="button" onClick={() => overlay.unregisterOverlay('drawer-a')}>Unregister drawer</button>
      <p>Escape close reason for top entry: {overlay.requestClose('drawer-a', 'escape') ?? 'blocked'}</p>
    </SectionPanel>
  );
}

function OverlayContractDemo() {
  return (
    <OverlayManagerProvider>
      <OverlayProbe />
    </OverlayManagerProvider>
  );
}

function CommandProbe() {
  const launcher = useCommandLauncher();

  return (
    <SectionPanel title="Command palette" description="Cmd/Ctrl+K opens the shared command surface.">
      <button
        type="button"
        onClick={() => launcher.registerCommands([
          { id: 'open-patterns', label: 'Open patterns', keywords: ['patterns', 'catalog'], shortcut: 'Cmd+1', run: () => {} },
          { id: 'open-governance', label: 'Open governance', keywords: ['rules'], shortcut: 'Cmd+2', run: () => {} },
        ])}
      >
        Register commands
      </button>
      <button type="button" onClick={() => launcher.open()}>Open command palette</button>
    </SectionPanel>
  );
}

function CommandPaletteDemo() {
  return (
    <CommandRegistryProvider>
      <CommandProbe />
    </CommandRegistryProvider>
  );
}

function TelemetryProbe({ events }: { events: string[] }) {
  const telemetry = useGdsTelemetry();

  return (
    <SectionPanel title="Telemetry contract" description="Cross-primitive event contract with privacy-safe defaults.">
      <button
        type="button"
        onClick={() => telemetry.emit({
          component: 'TelemetryDemo',
          eventType: 'action-click',
          correlationId: 'telemetry-demo',
          outcome: 'info',
          context: { route: 'patterns/alerts', locale: 'en', email: 'redacted@example.com' },
        })}
      >
        Emit event
      </button>
      <DemoList items={events.length > 0 ? events : ['No events captured yet.']} />
    </SectionPanel>
  );
}

function TelemetryDemo() {
  const [events, setEvents] = useState<string[]>([]);

  return (
    <GdsTelemetryProvider sink={(event) => setEvents((current) => [...current, `${event.component}:${event.eventType}`])}>
      <TelemetryProbe events={events} />
    </GdsTelemetryProvider>
  );
}

function AccessGatePlaygroundDemo() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isSigningIn) {
      return;
    }

    const timer = setTimeout(() => {
      setIsAuthenticated(true);
      setIsSigningIn(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isSigningIn]);

  const baseContract = resolveGdsAccessState({
    gateId: 'article-paywall-demo',
    session: isSigningIn
      ? { status: 'loading' }
      : isAuthenticated
        ? { status: 'authenticated', subjectId: 'demo-user' }
        : { status: 'anonymous' },
    entitlement: isAuthenticated ? { allowed: true, label: 'Member' } : undefined,
  });

  const contract = isSigningIn
    ? {
        ...baseContract,
        state: 'unlocking' as const,
        reason: baseContract.reason ?? 'login-required',
        title: 'Signing in',
        description: 'Authenticating your demo identity and role to unlock premium content.',
      }
    : baseContract;

  const previewTitle = isAuthenticated ? 'Member unlocked' : 'Article preview';

  const beginSignIn = () => {
    if (isSigningIn || isAuthenticated) {
      return;
    }

    setIsSigningIn(true);
  };

  const beginSignOut = () => {
    setIsSigningIn(false);
    setIsAuthenticated(false);
  };

  const handleAction = (action: GdsAccessGateAction) => {
    if (action.kind === 'sign-in' || action.kind === 'sign-up') {
      beginSignIn();
    }
  };

  return (
    <div>
      <GdsAccessGate
        {...contract}
        protectedContentPolicy="never-render-while-locked"
        teaserLabel="Article preview"
        entitlementLabel="Member"
        preview={
          <div>
            <h4>{previewTitle}</h4>
            <p>
              Use this boundary when a page can show summary content while protecting premium or private detail.
              The protected member section is never mounted until unlocked.
            </p>
          </div>
        }
        protectedContent={() => (
          <div>
            <h4>Protected member-only article body</h4>
            <p>This content only mounts after the access state is unlocked.</p>
          </div>
        )}
        onAction={handleAction}
      />
      <div>
        <button type="button" onClick={beginSignIn} disabled={isSigningIn || isAuthenticated}>
          Click to login
        </button>
        {isAuthenticated ? (
          <>
            {' '}
            <button type="button" onClick={beginSignOut}>
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

const familyMeta: Record<PatternFamily, { title: string; description: string }> = {
  foundations: {
    title: 'Foundations',
    description: 'Shells, controls, cards, and baseline workflow rules used across every adopting product.',
  },
  public: {
    title: 'Public, Editorial, & Docs',
    description: 'Public navigation, discovery, storytelling, docs, and branded outward-facing composition.',
  },
  operations: {
    title: 'Operations',
    description: 'Dashboard, editing, section, and operational workflow patterns for day-to-day platform work.',
  },
  data: {
    title: 'Data & Search',
    description: 'Search, filters, tables, analytics rhythm, and responsive data views.',
  },
  access: {
    title: 'Access & Recovery',
    description: 'Auth, access summaries, recovery, sharing, and bounded hardware-adjacent flows.',
  },
  feedback: {
    title: 'Feedback & Messaging',
    description: 'State communication, confirmations, placeholders, and threshold-aware response patterns.',
  },
};

// Governed "Load more" verb for the per-column footer, registered as a
// vocabulary pack so the footer button is a themed, contrast-checked
// SemanticButton (not a raw control) — see issue 441 / renderColumnFooter.
const KANBAN_LOAD_MORE_VOCAB = createGdsVocabularyPack('board', {
  loadMore: { defaultMessage: 'Load more', icon: GdsIcons.List },
});

// The demo columns carry a client-side `backlog` (the not-yet-loaded page) so
// the "Load more" footer has real rows to reveal; `totalCount` is the server
// total the header badge reports, independent of how many are currently loaded.
type KanbanDemoColumn = KanbanColumnData & { backlog: KanbanColumnData['items'] };

function KanbanBoardDemo() {
  const [columns, setColumns] = useState<KanbanDemoColumn[]>([
    {
      id: 'todo',
      title: 'To do',
      totalCount: 6,
      items: [
        { id: 'draft-proposal', title: 'Draft proposal', description: 'Due Friday' },
        { id: 'schedule-review', title: 'Schedule review' },
      ],
      backlog: [
        { id: 'sync-stakeholders', title: 'Sync stakeholders' },
        { id: 'estimate-effort', title: 'Estimate effort' },
        { id: 'define-scope', title: 'Define scope' },
        { id: 'assign-owners', title: 'Assign owners' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In progress',
      totalCount: 3,
      items: [{ id: 'design-review', title: 'Design review', status: 'Blocked' }],
      backlog: [
        { id: 'api-contract', title: 'API contract' },
        { id: 'copy-pass', title: 'Copy pass' },
      ],
    },
    { id: 'done', title: 'Done', totalCount: 0, items: [], backlog: [] },
  ]);
  // Controlled per-column collapse: the empty "Done" column starts collapsed.
  const [collapsedColumnIds, setCollapsedColumnIds] = useState<string[]>(['done']);

  function handleMoveItem(itemId: string, fromColumnId: string, toColumnId: string, toIndex?: number) {
    setColumns((current) => {
      const source = current.find((column) => column.id === fromColumnId);
      const item = source?.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        return current;
      }
      return current.map((column) => {
        if (column.id === fromColumnId && column.id === toColumnId) {
          const withoutItem = column.items.filter((candidate) => candidate.id !== itemId);
          const insertAt = toIndex ?? withoutItem.length;
          return { ...column, items: [...withoutItem.slice(0, insertAt), item, ...withoutItem.slice(insertAt)] };
        }
        if (column.id === fromColumnId) {
          return { ...column, items: column.items.filter((candidate) => candidate.id !== itemId) };
        }
        if (column.id === toColumnId) {
          const insertAt = toIndex ?? column.items.length;
          return { ...column, items: [...column.items.slice(0, insertAt), item, ...column.items.slice(insertAt)] };
        }
        return column;
      });
    });
  }

  function loadMoreItems(columnId: string) {
    setColumns((current) =>
      current.map((column) => {
        if (column.id !== columnId || column.backlog.length === 0) {
          return column;
        }
        const nextPage = column.backlog.slice(0, 2);
        return { ...column, items: [...column.items, ...nextPage], backlog: column.backlog.slice(2) };
      }),
    );
  }

  function handleCollapsedChange(columnId: string, collapsed: boolean) {
    setCollapsedColumnIds((current) =>
      collapsed ? [...current, columnId] : current.filter((id) => id !== columnId),
    );
  }

  return (
    <BoundedPreviewSurface minHeight="26rem">
      <KanbanBoard
        title={
          <span>
            <GdsIcons.Grid size="1rem" /> Sprint board
          </span>
        }
        boardLabel="Sprint board"
        columns={columns}
        onMoveItem={handleMoveItem}
        enableDrag
        collapsible
        columnPanZone="header"
        collapsedColumnIds={collapsedColumnIds}
        onCollapsedChange={handleCollapsedChange}
        renderColumnFooter={(column) => {
          const total = column.totalCount ?? column.items.length;
          const remaining = total - column.items.length;
          if (remaining <= 0) {
            return null;
          }
          return (
            <>
              <BodyText component="span">
                Showing {column.items.length} of {total}
              </BodyText>{' '}
              <SemanticButton
                action="board:loadMore"
                vocabularyPacks={[KANBAN_LOAD_MORE_VOCAB]}
                variant="subtle"
                size="xs"
                onClick={() => loadMoreItems(column.id)}
              />
            </>
          );
        }}
      />
    </BoundedPreviewSurface>
  );
}

// Live GdsSchemaForm demo (issue 442): a schema-generated form that mounts the new
// `checkbox-group` (grouped multi-select) and `repeatable` (add-another-row)
// field types in the public catalog, so they fall under the catalog-driven
// contrast/forced-colors/a11y gates instead of escaping all of them.
const schemaFormDemoSchema: GdsFormSchema = {
  id: 'demo-intake',
  title: 'Project intake',
  description: 'Schema-generated form: a themed grouped multi-select and a repeatable row group.',
  fields: [
    {
      name: 'projectName',
      type: 'text',
      label: 'Project name',
      i18nKey: 'gds.form.demo-intake.projectName',
      required: true,
    },
    {
      name: 'channels',
      type: 'checkbox-group',
      label: 'Notification channels',
      i18nKey: 'gds.form.demo-intake.channels',
      required: true,
      options: [
        { label: 'Email', value: 'email' },
        { label: 'SMS', value: 'sms' },
        { label: 'In-app', value: 'in-app' },
      ],
    },
    {
      name: 'members',
      type: 'repeatable',
      label: 'Team members',
      i18nKey: 'gds.form.demo-intake.members',
      minRows: 1,
      maxRows: 4,
      addRowLabel: 'Add member',
      removeRowLabel: 'Remove member',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          label: 'Full name',
          i18nKey: 'gds.form.demo-intake.members.fullName',
          required: true,
        },
        {
          name: 'role',
          type: 'select',
          label: 'Role',
          i18nKey: 'gds.form.demo-intake.members.role',
          options: [
            { label: 'Owner', value: 'owner' },
            { label: 'Editor', value: 'editor' },
            { label: 'Viewer', value: 'viewer' },
          ],
        },
      ],
    },
  ],
};

function SchemaFormDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  return (
    <BoundedPreviewSurface minHeight="30rem">
      <GdsSchemaForm
        schema={schemaFormDemoSchema}
        submitLabel="Submit intake"
        onSubmit={(values) => {
          setSubmitted(JSON.stringify(values));
        }}
      />
      {submitted ? <BodyText>Submitted (demo only — no data leaves the page).</BodyText> : null}
    </BoundedPreviewSurface>
  );
}

function groupEntries(entries: PatternRegistryEntry[]) {
  return entries.reduce<Record<string, PatternRegistryEntry[]>>((acc, entry) => {
    acc[entry.section] ??= [];
    acc[entry.section].push(entry);
    return acc;
  }, {});
}

function DemoList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function CoverageText({ entry }: { entry: PatternRegistryEntry }) {
  return (
    <p>
      {entry.docSection}
      {entry.sourceComponent ? ` • ${entry.sourceComponent}` : ''}
      {entry.importPath ? ` • ${entry.importPath}` : ''}
    </p>
  );
}

function renderEntryDemo(entry: PatternRegistryEntry) {
  const vocab = createGdsVocabularyPack('camera', {
    urgent: {
      defaultMessage: 'Urgent',
      icon: GdsIcons.Danger,
    },
  });

  switch (entry.id) {
    case 'stable-shell':
    case 'shell-contracts':
    case 'discovery-shell':
      return (
        <BoundedPreviewSurface minHeight="32rem">
          <DiscoveryShell
            header={<BodyText>Catalog workspace</BodyText>}
            sidebar={(
              <SidebarNav ariaLabel="Reference navigation">
                <SidebarNavSection label="Primary">
                  <SidebarNavItem action="dashboard" href="/general-design-system/live-demos/surfaces" active />
                  <SidebarNavItem action="settings" href="/general-design-system/patterns" />
                </SidebarNavSection>
              </SidebarNav>
            )}
          >
            <PageHeader title="Stable discovery surface" description="Canonical sidebar-first shell for authenticated apps." />
            <ActionBar primary={{ action: 'save', size: 'sm' }} secondary={[{ action: 'cancel', size: 'sm' }]} />
          </DiscoveryShell>
        </BoundedPreviewSurface>
      );
    case 'primary-navigation':
      return (
        <PublicNav
          activeId="patterns"
          items={[
            { id: 'overview', label: 'Overview', href: '#overview' },
            { id: 'patterns', label: 'Patterns', href: '#patterns' },
            { id: 'install', label: 'Install', href: '#install' },
          ]}
        />
      );
    case 'mobile-navigation':
      return (
        <FeatureBand
          columns={2}
          variant="compact"
          items={[
            {
              id: 'visible',
              title: 'Always-visible destinations',
              description: 'Keep routine destinations reachable without hiding everything in a drawer.',
            },
            {
              id: 'overflow',
              title: 'Overflow secondary controls',
              description: 'Move secondary actions into a compact mobile section.',
            },
          ]}
        />
      );
    case 'page-headers':
      return (
        <PageHeader
          title="Governed header"
          description="Headers answer where the user is and what the surface is for."
          primaryAction={<ActionBar primary={{ action: 'save' }} />}
        />
      );
    case 'theme-toggle':
      return (
        <SectionPanel title="Theme toggle" description="Use the package-owned color-scheme control instead of local switches.">
          <ThemeToggle />
        </SectionPanel>
      );
    case 'partner-discovery-system':
      return (
        <PartnerDiscoveryShell
          logo={<strong>Partner Baby</strong>}
          navItems={[
            { id: 'add', label: 'Add to Map', href: '#submit-place' },
            { id: 'lists', label: 'Lists', href: '#lists', current: true },
            { id: 'about', label: 'About', href: '#about' },
          ]}
          footer={{
            copyright: 'Partner LLC ©2026',
            legalLinks: [{ id: 'privacy', label: 'Privacy Policy', href: '#privacy' }],
          }}
        >
          <>
            <SectionTitle>Partner discovery reference</SectionTitle>
            <BodyText>Fake data only. Consumers supply copy, assets, data, map adapters, and submission endpoints.</BodyText>
            <PartnerDiscoveryFilters
              value={{ query: '', amenities: ['high-chairs'], prices: ['$$'] }}
              labels={{
                search: 'Search places',
                searchPlaceholder: 'Search by amenity, cuisine, or neighborhood',
                filters: 'Filters',
                reset: 'Reset',
                close: 'Close',
                apply: 'Apply',
                amenities: 'Amenities',
                price: 'Price',
                selected: 'Selected filters',
              }}
              amenities={partnerDiscoveryDefaultAmenities}
            />
            <PartnerMapListShell
              places={[
                { id: 'green-cafe', title: 'Green Cafe', category: 'Cafe', neighborhood: 'Downtown', amenities: ['high-chairs', 'changing-table'], price: '$$', href: '#green-cafe' },
                { id: 'park-tacos', title: 'Park Tacos', category: 'Mexican', neighborhood: 'Parkside', amenities: ['outdoor-seating'], price: '$', href: '#park-tacos' },
              ]}
              filters={{ query: '', amenities: [], prices: [] }}
              activePlaceId="green-cafe"
            />
            <PartnerPlaceDetailTemplate
              backHref="#back"
              labels={{ back: 'Back', photos: 'Photos', website: 'Website', menu: 'Menu', share: 'Share', parentTip: 'Parent tip', copied: 'Copied', shareFailed: 'Share failed' }}
              place={{
                id: 'green-cafe',
                title: 'Green Cafe',
                address: '1 Main St',
                neighborhood: 'Downtown',
                category: 'Cafe',
                parentTip: 'Room for strollers.',
                amenities: [{ id: 'high-chairs', label: 'High chairs' }, { id: 'changing-table', label: 'Changing table' }],
                links: { website: '#website', menu: '#menu', shareUrl: '#share' },
              }}
            />
            <PartnerNewsletterForm
              email=""
              state="idle"
              labels={{ title: 'Your city got family-friendly', description: 'Get the weekly list.', emailLabel: 'Email', submitLabel: 'Join', dismissLabel: 'Close', successMessage: 'Subscribed', errorMessage: 'Retry signup' }}
            />
            <PartnerListIndex title="Partner lists" items={[{ id: 'cafes', title: 'Best family-friendly cafes', href: '#cafes' }]} />
          </>
        </PartnerDiscoveryShell>
      );
    case 'form-field':
      return (
        <div>
          <FormField label="Canonical field" description="Visible label, helper text, and error placement are owned by GDS." error="Example validation message">
            <input aria-label="Canonical field" defaultValue="Reference value" />
          </FormField>
          <br />
          <FormControlFamilyDemo />
        </div>
      );
    case 'game-board-tile':
      return (
        <div>
          <GameBoardTile face="GDS" revealed matched={false} disabled={false} onPress={() => {}} />
        </div>
      );
    case 'sidebar-navigation':
      return (
        <SidebarNav ariaLabel="Pattern reference sidebar">
          <SidebarNavSection label="Primary">
            <SidebarNavItem action="dashboard" href="/general-design-system/patterns/foundations" active />
            <SidebarNavItem action="profile" href="/general-design-system/patterns/operations" />
          </SidebarNavSection>
          <SidebarNavSection label="More">
            <SidebarNavItem action="list" href="/general-design-system/patterns/data" />
            <SidebarNavItem action="notifications" href="/general-design-system/patterns/feedback" />
          </SidebarNavSection>
        </SidebarNav>
      );
    case 'dashboards':
      return (
        <ConsumerDashboardGrid columns={3}>
          <MetricCard label="Next action" value="Publish docs" description="Prioritize next action first." />
          <ProgressCard label="Coverage" value={`${catalogEntryCount} entries`} progress={100} progressLabel="Pattern-site coverage" />
          <MetricCard label="Critical exceptions" value="0" description="Urgent errors should stay visible above broad analytics." />
        </ConsumerDashboardGrid>
      );
    case 'forms':
      return (
        <div>
          <FormArchitectureDemo />
          <br />
          <FormControlFamilyDemo />
          <br />
          <SchemaFormDemo />
        </div>
      );
    case 'inputs':
    case 'selects-combobox':
    case 'checkboxes-radios':
      return <FormArchitectureDemo />;
    case 'admin-editor-flows':
      return <AdminEditorFlowsDemo />;
    case 'search-filters-lists':
      return (
        <ResponsiveDataView
          data={[
            { id: '1', surface: 'DiscoveryShell', status: 'Ready' },
            { id: '2', surface: 'ListingCard', status: 'Ready' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'status', label: 'Status' },
          ]}
          renderCard={(item) => (
            <SectionPanel title={item.surface} description={item.status}>
              <p>Canonical searchable and filterable surface contract.</p>
            </SectionPanel>
          )}
        />
      );
    case 'destructive-actions':
      return (
        <ConfirmDialog opened onClose={() => {}} onConfirm={() => {}} title="Delete this pattern" confirmAction="delete" isDanger>
          Destructive actions must remain explicit and reversible only with confirmation.
        </ConfirmDialog>
      );
    case 'pattern-service-reuse':
      return <PublicBrandFooter brandTitle="Pattern reuse" description="Shared primitives avoid local component drift." />;
    case 'semantic-actions':
      return (
        <ActionBar
          primary={{ action: 'save' }}
          secondary={[{ action: 'cancel' }]}
          tertiary={[{ action: 'preview' }, { action: 'refer' }]}
          iconOnly={[{ action: 'settings' }]}
        />
      );
    case 'detail-surfaces':
    case 'detail-profile-shell':
      return (
        <DetailProfileShell
          hero={<PageHeader title="Universal profile" description="Canonical detail shell example." />}
          actions={<ActionBar primary={{ action: 'edit' }} secondary={[{ action: 'refer' }]} />}
          sections={[
            <SectionPanel key="overview" title="Overview" description="One detail contract for page and drawer modes.">
              <p>Use one reusable composition, not local detail shells.</p>
            </SectionPanel>,
          ]}
        />
      );
    case 'embed-surfaces':
    case 'map-panel':
      return (
        <MapPanel
          title="Map containment"
          description="Shared map/iframe contract keeps embed behavior explicit."
          loading={false}
          empty="No map source configured for this demo."
        />
      );
    case 'buttons':
      return (
        <CtaButtonGroup
          primary={<SemanticButton action="save" />}
          secondary={<SemanticButton action="cancel" />}
          tertiary={<SemanticButton action="preview" />}
        />
      );
    case 'choice-chips':
      return <ChoiceChipFamilyDemo />;
    case 'icon-buttons':
      return <ActionBar primary={{ action: 'save' }} iconOnly={[{ action: 'settings' }, { action: 'search' }, { action: 'help' }]} />;
    case 'product-cards':
      return (
        <ConsumerDashboardGrid columns={3}>
          <ProductCard
            title="Spacious product"
            description="XL spacious card using the shared resolver for title hierarchy, spacing, and metadata rhythm."
            status="Published"
            size="xl"
            density="spacious"
            variant="media-left"
            metadata={[{ label: 'Price', value: '€39' }]}
            primaryAction={<a href="/general-design-system/patterns/public">Open</a>}
            secondaryActions={[
              { label: 'Save', href: '/general-design-system/patterns' },
              { label: 'Share', href: '/general-design-system/patterns' },
            ]}
          />
          <ProductCard
            title="Compact product"
            description="Dense contract for tighter lists without local CSS."
            status="Draft"
            size="xs"
            density="compact"
            variant="compact"
            metadata={[{ label: 'Price', value: '€12' }]}
          />
          <PublicProductCard
            title="Public media card"
            description="Shared public card using the same size and density API."
            price="€24"
            state="limited"
            size="lg"
            density="comfortable"
            metadata={[{ label: 'Contract', value: 'GDS-owned' }]}
            primaryAction={<a href="/general-design-system/live-demos/surfaces">Open</a>}
          />
        </ConsumerDashboardGrid>
      );
    case 'public-product-cards':
      return (
        <PublicProductCard
          title="Public product card"
          description="Flat media-first variant for licensed surfaces."
          price="€39"
          size="lg"
          state="available"
          metadata={[{ label: 'Scope', value: 'UI primitives' }]}
          interactiveMode="surface-button"
          onSurfaceActivate={() => {}}
          primaryAction={<a href="/general-design-system/live-demos/surfaces">Buy</a>}
        />
      );
    case 'media-card':
      return (
        <MediaCard
          title="Media compatibility card"
          description="Use only where the full PublicProductCard contract is not needed."
          status="Compatibility"
          image={<div />}
          overlay={<StatusBadge status="info">Media</StatusBadge>}
          actions={[{ label: 'Preview' }]}
        />
      );
    case 'accent-panels':
      return (
        <AccentPanel tone="violet" title="Accent band">
          <p>Use accent panel for advisory messaging.</p>
          <p>Shared tonal semantics preserve readability across surfaces.</p>
        </AccentPanel>
      );
    case 'metric-cards':
      return (
        <div>
          <MetricCard label="Coverage" value="100%" description="Live catalog coverage." trend={{ tone: 'positive', label: '+2%' }} />
          <ProgressCard label="Adoption" value="18 apps" progress={86} progressLabel="Connected teams" />
        </div>
      );
    case 'data-toolbars':
      return (
        <ListingProvider>
          <ListingFrameworkDemo />
        </ListingProvider>
      );
    case 'state-blocks':
      return <MissingDataPromptDemo />;
    case 'surface-presentation':
      return (
        <div>
          <SectionPanel title="Centered presentation" description="Shared presentation helper powers panel and state body alignment." presentation="centered" minHeight={220}>
            <StateBlock variant="empty" title="Centered state" description="No local wrapper needed for body alignment." compact />
          </SectionPanel>
          <SectionPanel title="Fill presentation" description="Fill mode keeps bounded state surfaces stable." presentation="fill" minHeight={180}>
            <p>Content fills the governed panel body without custom layout CSS.</p>
          </SectionPanel>
        </div>
      );
    case 'action-bar':
      return <ActionBar primary={{ action: 'save' }} secondary={[{ action: 'cancel' }]} tertiary={[{ action: 'preview' }]} iconOnly={[{ action: 'settings' }]} />;
    case 'listing-card':
      return (
        <ListingCard
          title="Shared listing card"
          description="Governed metadata rows and consistent affordance placement."
          metadata={[
            { id: 'date', label: 'Date', value: 'June 14' },
            { id: 'location', label: 'Location', value: 'Budapest' },
          ]}
          primaryAction={<a href="/general-design-system/patterns">Open</a>}
          saveAction={{ action: 'save' }}
          shareAction={{ action: 'refer' }}
          size="lg"
          interactiveMode="flip"
          revealContent={<p>Flip-side content slot for extended context and compliance-safe disclosure text.</p>}
        />
      );
    case 'share-button-group':
      return <ShareButtonGroup url="https://sovereignsquad.github.io/general-design-system/patterns" title="GDS pattern catalog" text="Inspect the shipped pattern inventory." compact />;
    case 'public-food-card':
      return (
        <PublicFoodCard
          title="Smoked paprika chicken bowl"
          description="Controlled freshness and helper copy contract."
          state="preorder"
          price="€12.50"
          helperText="Pickup window closes at 18:00."
          pickupNote="Today, 17:15-18:00"
          freshnessNote="Prepared in small daily batches"
          markers={[
            { id: 'featured', label: 'Featured', tone: 'positive' },
            { id: 'hot', label: 'Limited batch', tone: 'warning' },
          ]}
          primaryAction={<a href="/general-design-system/live-demos/food">Reserve pickup</a>}
        />
      );
    case 'food-menu-section':
      return (
        <FoodMenuSection
          title="Weekly menu"
          sectionNote="Pickup window: Saturday 09:00-12:00"
          categories={[
            {
              id: 'featured',
              title: 'Featured dishes',
              items: [
                {
                  id: 'dish',
                  title: 'Citrus chicken bowl',
                  description: 'Shared food-card contract.',
                  state: 'available',
                  price: '€12.50',
                  primaryAction: <a href="/general-design-system/live-demos/surfaces">Reserve</a>,
                },
              ],
            },
          ]}
        />
      );
    case 'playback-surface':
      return (
        <PlaybackSurface
          title="Playback contract"
          state="ready"
          statusMessage="Accessible timed-media containment."
          media={<div />}
        />
      );
    case 'public-shells':
      return (
        <BoundedPreviewSurface minHeight="30rem">
          <PublicShell
            brand={<strong>General Design System</strong>}
            navItems={[
              { id: 'overview', label: 'Overview', href: '/general-design-system/patterns' },
              { id: 'docs', label: 'Docs', href: '/general-design-system/themes' },
            ]}
            activeNavId="overview"
            actions={<button type="button">Sign in</button>}
            mobileNavigationMode="inline-collapse"
            mobileNavigation={<a href="/general-design-system/patterns">Patterns</a>}
            footer={<PublicBrandFooter brandTitle="GDS" description="Canonical public shell." />}
            maxContentWidth="lg"
          >
            <SectionPanel title="Public content area" description="Bounded public shell for docs and marketing pages.">
              <p>Public chrome should not be re-implemented locally.</p>
            </SectionPanel>
          </PublicShell>
        </BoundedPreviewSurface>
      );
    case 'public-nav':
      return <PublicNav activeId="patterns" items={[{ id: 'overview', label: 'Overview', href: '#overview' }, { id: 'install', label: 'Install', href: '#install' }]} />;
    case 'auth-shells':
      return (
        <BoundedPreviewSurface minHeight="28rem">
          <AuthShell
            title="Sign in to GDS"
            description="Canonical auth placement with provider errors, guest entry, and support fallback."
            intent="sign-in"
            error="The last provider attempt timed out. Choose a provider, retry, or continue as guest if your product allows it."
            socialAuth={<SocialAuthButtons layout="grid" providers={[{ id: 'google', policyNote: 'Approved by identity policy.' }, { id: 'github', tenantDisabledReason: 'Disabled by tenant policy.' }]} />}
            guestAction={<button type="button">Continue as guest</button>}
            supportAction={<button type="button">Contact support</button>}
            helper="Keep provider logic in the app; keep layout in GDS."
          >
            <p>Social auth remains part of the shared auth shell contract.</p>
          </AuthShell>
        </BoundedPreviewSurface>
      );
    case 'social-auth-buttons':
      return <SocialAuthButtons layout="grid" providers={[{ id: 'google' }, { id: 'apple' }, { id: 'github', error: 'Provider returned an error.' }, { id: 'microsoft', tenantDisabledReason: 'Tenant policy disabled Microsoft.' }]} />;
    case 'provider-identity-buttons':
      return (
        <ProviderIdentityButtonGroup
          layout="grid"
          providers={[
            { provider: 'google', href: '/auth/google', policyNote: 'Provider color authority remains governed.' },
            { provider: 'apple', href: '/auth/apple' },
            { provider: 'github', href: '/auth/github', tenantDisabledReason: 'Disabled by tenant policy.' },
            { provider: 'email', href: '/auth/email', description: 'Fallback identity lane.' },
          ]}
        />
      );
    case 'article-shells':
      return (
        <ArticleShell
          eyebrow="Editorial"
          title="How reference docs stay strict"
          lead="Article content stays in one shared shell."
          sideRail={
            <SectionPanel title="Side rail" description="Related docs and indexes.">
              <p>Surface side rails show indexes and adjacent references.</p>
            </SectionPanel>
          }
          meta={<span>Scope: Pattern catalog</span>}
        >
          <p>Use ArticleShell for docs, legal, and editorial readability.</p>
        </ArticleShell>
      );
    case 'docs-page-shell':
      return (
        <DocsPageShell
          title="Reference docs shell"
          lead="Docs surface with shared breadcrumbs and body layout."
          breadcrumbs={[{ label: 'Docs', href: '/general-design-system' }, { label: 'Patterns' }]}
        >
          <p>The docs shell is now fully controlled by GDS.</p>
        </DocsPageShell>
      );
    case 'docs-shell':
      return (
        <BoundedPreviewSurface minHeight="30rem">
          <DocsShell
            brand={<strong>General Design System</strong>}
            primaryNavigation={<SidebarNavItem action="home" href="/general-design-system/patterns/public" active />}
            secondaryNavigation={<SidebarNavItem action="theme" href="/general-design-system/themes" />}
            headerContext="Canonical docs/reference shell contract"
            actions={<SemanticButton action="theme" size="sm" />}
            contentWidth="full"
          >
            <SectionPanel title="Docs shell content" description="Reference/docs content belongs in package-owned shell framing.">
              <p>The official site should use this contract instead of page-local shell wrappers.</p>
            </SectionPanel>
          </DocsShell>
        </BoundedPreviewSurface>
      );
    case 'reference-section':
      return (
        <ReferenceSection
          title="Governed section framing"
          description="Reference pages should use one canonical section rhythm for heading, summary, and actionable content."
        >
          <p>This section is the package-owned docs contract used across the official site.</p>
        </ReferenceSection>
      );
    case 'reference-link-grid':
      return (
        <ReferenceLinkGrid
          columns={2}
          items={[
            {
              id: 'install',
              title: 'Install Guide',
              description: 'Open the canonical install path and versioned package guidance.',
              href: '/general-design-system/install',
            },
            {
              id: 'governance',
              title: 'Governance',
              description: 'Read strict adoption and theme-ownership requirements.',
              href: '/general-design-system/governance',
            },
          ]}
        />
      );
    case 'reference-locale-notice':
      return (
        <ReferenceLocaleNotice
          localeLabel="Deutsch"
          detail="The reference-site narrative remains English while semantic vocabulary is already localized."
        />
      );
    case 'reference-theme-explorer':
      return (
        <div>
          <BodyText>
            The full reference theme explorer owns the document runtime and is mounted on the Themes route.
            The catalog keeps this entry bounded so pattern previews cannot overwrite the active page color scheme.
          </BodyText>
          <ReferenceLinkGrid
            columns={2}
            items={[
              {
                id: 'themes-runtime',
                title: 'Open theme runtime',
                description: 'Inspect presets, color-scheme behavior, font lanes, and preview diagnostics in the canonical route.',
                href: '/general-design-system/themes',
                badge: 'Runtime owner',
              },
            ]}
          />
        </div>
      );
    case 'reference-site-shell':
      return (
        <BoundedPreviewSurface minHeight="30rem">
          <ReferenceSiteShell
            logoText="General Design System"
            primaryNavigation={<SidebarNavItem action="home" href="/general-design-system" active />}
            secondaryNavigation={<SidebarNavItem action="grid" href="/general-design-system/patterns" />}
            headerContext="Reference website shell"
            locale="en"
            localeOptions={[{ id: 'en', label: 'English' }]}
            onLocaleChange={() => {}}
          >
            <SectionPanel title="Reference-site composition" description="Legacy reference shell retained for bounded compatibility lanes.">
              <p>Prefer DocsShell for the official site path, keep this contract only where explicitly required.</p>
            </SectionPanel>
          </ReferenceSiteShell>
        </BoundedPreviewSurface>
      );
    case 'editorial-hero':
      return (
        <EditorialHero
          eyebrow="Editorial"
          title="Shipped editorial hero"
          description="Hero surface with media and action controls."
          actions={[{ label: 'Get started', href: '/general-design-system/patterns' }]}
          media={<div />}
        />
      );
    case 'feature-band':
      return (
        <FeatureBand
          columns={3}
          items={[
            { id: 'one', title: 'Shared contracts', description: 'Use one structure for feature messaging.' },
            { id: 'two', title: 'Fewer wrappers', description: 'Avoid local component duplication.' },
            { id: 'three', title: 'Predictable rhythm', description: 'Keep spacing and typography in one place.' },
          ]}
        />
      );
    case 'browse-surface':
      return (
        <BrowseSurface
          title="Catalog discoverability"
          description="Single browse surface contract for search, filters, and sort."
          resultCount={3}
          scopeOptions={[{ id: 'all', label: 'All', active: true }, { id: 'public', label: 'Public' }]}
          toolbar={{ searchSlot: <input aria-label="Search discoverables" />, createAction: <button type="button">Create</button> }}
          mobileFilters={<button type="button">Filters</button>}
          content={<DemoList items={['Discovery Shell', 'Listing Card', 'Map Panel']} />}
        />
      );
    case 'editorial-cards':
      return (
        <EditorialCard
          title="Neighborhood guide"
          description="Shared editorial card contract for story surfaces."
          badge="Featured"
          ctaLabel="Read more"
          href="/general-design-system/patterns/public"
          tone="cool"
        />
      );
    case 'consumer-sections':
      return (
        <ConsumerSection
          title="Account section"
          description="Shared section container for consumer surfaces."
          action={<ActionBar primary={{ action: 'save' }} />}
        >
          <SectionPanel title="Section content" description="Actions and metadata stay composable.">
            <p>Section children are now explicit to satisfy required layout contract.</p>
          </SectionPanel>
        </ConsumerSection>
      );
    case 'consumer-dashboard-grid':
      return (
        <ConsumerDashboardGrid columns={3}>
          <MetricCard label="Requests" value="42" description="Operations coverage." />
          <MetricCard label="Errors" value="0" description="Recovery surfaces remain clear." />
          <MetricCard label="Uptime" value="99.9%" description="Monitored states remain visible." />
        </ConsumerDashboardGrid>
      );
    case 'media-fields':
      return (
        <div>
          <MediaField
            label="Hero image"
            description="Use the media-field contract for upload, URL entry, preview, status, and recovery."
            value="https://cdn.example.com/hero.jpg"
            preview={<img alt="Hero preview" src="https://picsum.photos/id/1015/640/360" />}
            uploadControl={<button type="button">Upload image</button>}
            urlInput={<input aria-label="Image URL" defaultValue="https://cdn.example.com/hero.jpg" />}
            helpText="Prefer authored media with descriptive alt text."
            policyText="Public assets must be licensed for reuse and include alt text before publishing."
            acceptedTypes="JPEG, PNG, WebP"
            maxSize="10 MB max"
            progress={64}
            replaceAction={<button type="button">Replace</button>}
            retryAction={<button type="button">Retry</button>}
            onReset={() => {}}
            onRemove={() => {}}
            state="uploading"
          />
          <MediaField
            label="Locked campaign logo"
            description="Readonly mode keeps preview and policy context visible while suppressing edit controls."
            value="https://cdn.example.com/logo.png"
            preview={<img alt="Campaign logo preview" src="https://picsum.photos/id/1025/640/360" />}
            policyText="This asset is controlled by the brand system owner."
            acceptedTypes="PNG"
            maxSize="2 MB max"
            readonly
          />
        </div>
      );
    case 'content-operations-editor':
      return (
        <ContentOpsEditor
          header={<PageHeader title="Content operations" description="Reusable operations editor composition." />}
          sections={(
            <ContentOpsSection id="general" title="General settings" description="Shared sectioning for ops workflows.">
              <FormField label="Title" description="Use the same pattern for every editor." >
                <input aria-label="Content title" />
              </FormField>
            </ContentOpsSection>
          )}
          actionBar={<ContentOpsActionBar dirty actions={{ primary: { action: 'save' }, secondary: [{ action: 'refresh' }] }} />}
        />
      );
    case 'admin-app-shell':
      return (
        <BoundedPreviewSurface minHeight="30rem">
          <AppShell
            logoText="Admin GDS"
            primaryNavigation={<SemanticNavLink action="dashboard" href="/general-design-system/patterns/operations" active />}
            secondaryNavigation={<SemanticNavLink action="settings" href="/general-design-system/patterns" />}
            headerContext="Admin compatibility shell"
            showThemeToggle={false}
          >
            <SectionPanel title="Admin shell content" description="AppShell is backed by DiscoveryShell and remains an admin compatibility path.">
              <p>Use DiscoveryShell directly for new sidebar-first apps when possible.</p>
            </SectionPanel>
          </AppShell>
        </BoundedPreviewSurface>
      );
    case 'editor-scaffold':
      return (
        <EditorScaffold
          header={<WorkspaceHeader title="Editor scaffold" description="Header, form, preview, settings, and footer stay in one scaffold." />}
          form={<FormSection title="Form" description="Canonical grouped editor body."><FormField label="Name"><input aria-label="Name" /></FormField></FormSection>}
          preview={<SectionPanel title="Preview" description="Bounded preview rail."><p>Preview content</p></SectionPanel>}
          settings={<SectionPanel title="Settings" description="Bounded settings rail."><p>Settings content</p></SectionPanel>}
          footer={<ContentOpsActionBar actions={{ primary: { action: 'save' }, secondary: [{ action: 'cancel' }] }} />}
          stickyFooter
        />
      );
    case 'form-section':
      return (
        <FormSection title="Publication settings" description="Use FormSection for grouped admin form content.">
          <FormField label="Visibility"><select aria-label="Visibility"><option>Public</option></select></FormField>
        </FormSection>
      );
    case 'kanban-board':
      return <KanbanBoardDemo />;
    case 'workspace-header':
      return (
        <WorkspaceHeader
          breadcrumbs={[<a href="/general-design-system/patterns" key="patterns">Patterns</a>, <span key="operations">Operations</span>]}
          eyebrow="Workspace"
          title="Operations workspace"
          description="Governed workspace context and action placement."
          primaryAction={<SemanticButton action="save" />}
          secondaryActions={<SemanticButton action="preview" />}
        />
      );
    case 'section-panels':
      return (
        <SectionPanel
          title="Reusable section panel"
          description="Shared bordered section for content chunks, including contract-driven body framing."
          presentation="fill"
          minHeight={280}
          contentAlign="start"
          contentJustify="start"
        >
          <p>
            Use this panel as the canonical bounded composition for grouped content.
          </p>
          <p>Fill-mode examples can keep state surfaces stable without local wrappers.</p>
        </SectionPanel>
      );
    case 'public-brand-footer':
      return (
        <PublicBrandFooter
          brandTitle="General Design System"
          description="Canonical footer for public surfaces."
          actions={<button type="button">Contact</button>}
          legal="© General Design System"
        />
      );
    case 'public-site-footer':
      return (
        <PublicSiteFooter meta="Versioned public reference surface">
          Lightweight public footer for simple site meta and legal copy.
        </PublicSiteFooter>
      );
    case 'filter-drawer':
      return (
        <FilterDrawer
          opened
          onClose={() => {}}
          title="Filter set"
          description="One shared drawer contract for filters."
          applyAction={<SemanticButton action="save" />}
          resetAction={<SemanticButton action="reset" />}
        >
          <SectionPanel title="Filter controls" description="Scope, sort, and type remain bounded.">
            <p>Controls should stay compact and auditable.</p>
          </SectionPanel>
        </FilterDrawer>
      );
    case 'docs-code-blocks':
      return <DocsCodeBlock title="Usage" language="tsx" code="import { ListingCard } from '@sovereignsquad/gds-core';" />;
    case 'cta-button-groups':
      return (
        <CtaButtonGroup
          primary={<button type="button">Save</button>}
          secondary={<button type="button">Cancel</button>}
          tertiary={<button type="button">Learn more</button>}
        />
      );
    case 'upload-surfaces':
      return (
        <div>
          <UploadDropzone
            title="Upload reference assets"
            description="Use the shared dropzone in upload-first flows. GDS renders state and policy; the product owns storage."
            acceptedTypesLabel="PDF, PNG, JPEG"
            maxSizeLabel="5 MB max"
            selectedFiles={['brief.pdf']}
            policyText="Do not upload private customer data or unsupported file types."
            state="selected"
            retryAction={<button type="button">Retry upload</button>}
            removeAction={<button type="button">Remove asset</button>}
          />
          <UploadDropzone
            title="Logo upload failed"
            description="Error states must keep the next action visible and accessible."
            acceptedTypesLabel="PNG only"
            maxSizeLabel="2 MB max"
            policyText="Replace the file with a compressed PNG before retrying."
            state="too-large"
            error="The selected file is larger than the allowed size."
            retryAction={<button type="button">Choose another file</button>}
            removeAction={<button type="button">Remove file</button>}
          />
          <UploadDropzone
            title="Archived asset"
            description="Readonly upload surfaces preserve asset context without accepting new files."
            selectedFiles={['brand-mark.png']}
            readonly
          />
        </div>
      );
    case 'access-summaries':
      return <AccessSummary title="Shared access summary" roles={['platform-ui', 'maintainers']} scope="Reference site" state="permission-limited" owner="platform-ui" recoveryHint="Request the docs-admin scope to unlock private evidence." description="Access and scope stay explicit." />;
    case 'access-recovery-panels':
      return (
        <div>
          <AccessRecoveryPanel state="unauthenticated" onSignIn={() => {}} onBack={() => {}} />
          <AccessRecoveryPanel state="timeout" onRetry={() => {}} onBack={() => {}} supportAction={{ action: 'help', onClick: () => {}, variant: 'subtle' }} />
        </div>
      );
    case 'access-gates':
      return <AccessGatePlaygroundDemo />;
    case 'placeholder-panels':
      return (
        <PlaceholderPanel
          mode="placeholder"
          title="Under development section"
          description="This surface is intentionally not live yet."
          badge="Placeholder"
          footer="Use placeholder when governance requires visible placeholder state."
        />
      );
    case 'simple-data-tables':
      return (
        <SimpleDataTable
          columns={[
            { key: 'surface', header: 'Surface' },
            { key: 'coverage', header: 'Coverage' },
          ]}
          rows={[
            { id: '1', surface: 'DiscoveryShell', coverage: 'Live' },
            { id: '2', surface: 'ListingCard', coverage: 'Live' },
          ]}
          getRowKey={(row) => row.id}
        />
      );
    case 'admin-data-table':
      return (
        <AdvancedDataTable
          rows={[
            { id: '1', surface: 'Admin AppShell', status: 'Compatibility' },
            { id: '2', surface: 'ResponsiveDataView', status: 'Canonical' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface', sortable: true },
            { key: 'status', label: 'Status', sortable: true },
          ]}
          rowId={(row) => String(row.id)}
          stickyHeader
          responsiveFallback="stacked-cards"
        />
      );
    case 'responsive-data-view':
      return (
        <ResponsiveDataView
          data={[
            { id: '1', surface: 'ListingCard', state: 'Live demo' },
            { id: '2', surface: 'MapPanel', state: 'Live demo' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'state', label: 'State' },
          ]}
          activeFilters={[{ label: 'Live demo', onRemove: () => {} }]}
          renderCard={(item) => (
            <SectionPanel title={String(item.surface)} description={String(item.state)}>
              <p>Card fallback is owned by the consumer slot, not the responsive contract.</p>
            </SectionPanel>
          )}
          getRowKey={(row) => String(row.id)}
        />
      );
    case 'stats-strip':
      return <StatsStrip stats={[{ label: 'Routes', value: 8, diff: 12 }, { label: 'Exports', value: 92, diff: 4 }, { label: 'Mismatches', value: 0, diff: 0 }]} />;
    case 'info-card':
      return <InfoCard title="Coverage" value="Export tracked" description="Admin information card with governed emphasis." icon={<GdsIcons.Info size="1rem" />} />;
    case 'semantic-nav-link':
      return (
        <SidebarNav ariaLabel="Semantic admin navigation">
          <SidebarNavSection label="Semantic">
            <SemanticNavLink action="dashboard" href="/general-design-system/patterns/data" active />
            <SemanticNavLink action="settings" href="/general-design-system/patterns" />
          </SidebarNavSection>
        </SidebarNav>
      );
    case 'empty-state':
      return <EmptyState title="Nothing to show yet" description="Compatibility empty state remains visible in the catalog." action={<SemanticButton action="add" />} />;
    case 'stats-sections':
      return <StatsSection title="Threshold-aware statistics" belowThreshold thresholdMessage="Not enough data yet for this report." />;
    case 'reporting-contracts':
      return (
        <div>
        <ReportingSection
          title="Operational evidence report"
          description="A governed reporting section keeps period controls, metrics, chart summaries, evidence, and fallback tables in one predictable flow."
          state="partial"
          stateMessage="Two locations are missing from this period. The visible aggregate remains usable but must be disclosed."
          periodControl={(
            <PeriodSelector
              label="Reporting period"
              description="Use a canonical period control before inventing date-range chrome."
              value="last-30"
              timezone="Europe/Budapest"
              scope="All restaurants"
              filtered
              stale
              helperText="The consumer owns fetching and timezone math; GDS owns visible control structure."
              options={[
                { value: 'last-7', label: 'Last 7 days', description: 'Short-term operational view.' },
                { value: 'last-30', label: 'Last 30 days', description: 'Default board reporting view.' },
                { value: 'quarter', label: 'Quarter to date', description: 'Strategic planning view.' },
              ]}
            />
          )}
          metrics={(
            <div>
              <MetricCard label="Orders" value="1,240" description="Visible aggregate." trend={{ label: '+8%', tone: 'positive' }} />
              <ProgressCard label="Evidence coverage" value="18 / 20" progress={90} progressLabel="Reporting sources" />
            </div>
          )}
          chart={(
            <ChartTokenPanel
              title="Orders by channel"
              description="Chart wrappers must provide text summaries, tokenized legends, and table fallback."
              summary="Online orders account for 62 percent of visible orders; in-store orders account for 38 percent."
              state="permission-limited"
              legend={[
                { label: 'Online', token: getGdsSeriesColor('primary') },
                { label: 'In-store', token: getGdsSeriesColor('info') },
              ]}
              tableFallback={(
                <SimpleDataTable
                  columns={[{ key: 'channel', header: 'Channel' }, { key: 'share', header: 'Share' }]}
                  rows={[{ channel: 'Online', share: '62%' }, { channel: 'In-store', share: '38%' }]}
                />
              )}
            />
          )}
          evidence={(
            <EvidencePanel
              title="Evidence trail"
              description="Evidence panels disclose source, freshness, confidence, count, and access limitations."
              source="Point-of-sale export"
              freshness="Updated 12 minutes ago"
              confidence="High"
              evidenceCount={18}
              state="permission-limited"
              permissionNote="Private customer-level evidence is intentionally hidden from this aggregate."
              retryAction={<button type="button">Refresh evidence</button>}
            />
          )}
        />
        <br />
        <ChartWrapperFamilyDemo />
        </div>
      );
    case 'alerts':
      return <TelemetryDemo />;
    case 'loaders-skeletons':
      return <FeatureBand loading columns={3} items={[]} />;
    case 'public-flow-shell':
      return (
        <PublicFlowShell
          stage={{
            id: 'public-flow',
            title: 'Public flow surface',
            description: 'Canonical stepper-like flow shell for staged experiences.',
            status: 'ready',
            actions: [
              { action: 'save', priority: 'primary' },
              { action: 'cancel', priority: 'secondary' },
            ],
          }}
          eyebrow="Flow Experience"
          exitAction={<a href="/general-design-system/patterns">Close</a>}
        />
      );
    case 'notifications':
      return (
        <GdsNotificationProvider>
          <SectionPanel title="Notification surface" description="Notifications remain contextual, actionable, and explicit.">
            <div>
              <BannerNotice
                eyebrow="Service status"
                severity="warning"
                title="One partner connector is degraded"
                message="Background sync is delayed. Critical failures are still shown inline as well."
              />
              <br />
              <InlineAlert
                severity="info"
                title="Publishing queue active"
                message="New items will appear once validation completes."
              />
              <br />
              <NotificationCenter />
            </div>
          </SectionPanel>
        </GdsNotificationProvider>
      );
    case 'meaning-badge':
      return (
        <div>
          <MeaningBadge variant="attention" label="Featured" />
          <MeaningBadge variant="validation" label="Verified" icon="Success" />
          <MeaningBadge variant="info" label="Editorial pick" />
          <MeaningBadge variant="urgency" label="Ends soon" icon="Warning" />
        </div>
      );
    case 'fit-score-chip':
      return (
        <div>
          <FitScoreChip value={92} dimensions={[{ label: 'Budget' }, { label: 'Location' }]} />
          <FitScoreChip value={64} />
          <FitScoreChip value={31} />
        </div>
      );
    case 'badges':
      return (
        <div>
          <StatusBadge status="success">Published</StatusBadge>
          <StatusBadge status="warning">Needs review</StatusBadge>
          <StatusBadge status="danger">Blocked</StatusBadge>
          <StatusBadge status="info">Info</StatusBadge>
          <StatusBadge status="neutral">Draft</StatusBadge>
          <br />
          <StatusBadge status="success" withIcon>Published</StatusBadge>
          <StatusBadge status="warning" withIcon>Needs review</StatusBadge>
          <StatusBadge status="danger" withIcon>Blocked</StatusBadge>
          <StatusBadge status="info" withIcon>Info</StatusBadge>
          <br />
          <LabelTag label="Food" tone="info" />
          <LabelTag label="Community" tone="neutral" />
          <LabelTag label="Priority" tone="warning" />
          <br />
          <CountBadge value={12} />
          <CountBadge value={126} cap={99} srLabel="More than ninety nine updates" />
          <br />
          <span data-gds-badge-shapes>
            <GdsBadgeShapeCircle size={40} stroke={1.75} aria-hidden="true" />
            <GdsBadgeShapeSquircle size={40} stroke={1.75} aria-hidden="true" />
            <GdsBadgeShapeHexagon size={40} stroke={1.75} aria-hidden="true" />
            <GdsBadgeShapeShield size={40} stroke={1.75} aria-hidden="true" />
            <GdsBadgeShapeRosette size={40} stroke={1.75} aria-hidden="true" />
            <GdsBadgeShapePin size={40} stroke={1.75} aria-hidden="true" />
          </span>
          <br />
          <GdsBadge tone="success" icon="Success" label="Published" />
          <GdsBadge tone="warning" icon="Warning" label="Needs review" />
          <GdsBadge tone="danger" icon="Danger" label="Blocked" />
          <GdsBadge tone="info" icon="Info" label="Heads up" />
          <GdsBadge tone="neutral" label="Draft" />
          <br />
          <GdsBadge accent="teal" shape="hexagon" icon="Habit" label="Swimming" />
          <GdsBadge accent="grape" shape="circle" icon="Message" label="Choir" />
          <GdsBadge accent="forest" shape="shield" icon="Verify" label="Certified" />
          <GdsBadge accent="terracotta" shape="pin" icon="Location" label="Nearby" />
          <br />
          <span data-gds-count-badge-demo>
            <GdsCountBadge value={7} label="notifications" />
            <GdsCountBadge value={126} cap={99} label="unread messages" tone="info" />
            <GdsCountBadge dot label="new activity" tone="danger" anchor={<GdsIcon icon="Notifications" size="lg" />} />
            <GdsCountBadge value={3} label="drafts" tone="neutral" anchor={<GdsIcon icon="Inbox" size="lg" />} />
          </span>
          <br />
          <span data-gds-removable-tag-demo>
            <GdsRemovableTag label="Music" removeLabel="Remove filter: Music" onRemove={() => {}} />
            <GdsRemovableTag label="Ages 6-8" tone="info" removeLabel="Remove filter: Ages 6-8" onRemove={() => {}} />
            <GdsRemovableTag label="Weekends" tone="success" removeLabel="Remove filter: Weekends" onRemove={() => {}} />
          </span>
          <br />
          <GdsBadgeStack size={44} label="Certified — verification mark">
            <GdsBadgeStackLayer cutout="top-end">
              <GdsBadgeShapeShield size="100%" stroke={1.75} />
            </GdsBadgeStackLayer>
            <GdsBadgeStackLayer scale={0.5}>
              <GdsIcon icon="Success" size="100%" />
            </GdsBadgeStackLayer>
            <GdsBadgeStackLayer corner="top-end" scale={0.4}>
              <GdsBadgeShapeCircle size="100%" stroke={1.75} />
            </GdsBadgeStackLayer>
          </GdsBadgeStack>
        </div>
      );
    case 'modals':
      return (
        <div>
          <OverlayContractDemo />
          <br />
          <OverlayAliasDemo />
        </div>
      );
    case 'drawers':
      return (
        <div>
          <CommandPaletteDemo />
          <br />
          <OverlayAliasDemo />
        </div>
      );
    case 'small-screen-priority':
      return (
        <ConsumerDashboardGrid columns={1}>
          <SectionPanel title="Small-screen priority" description="Prioritize next action, then secondary actions and helper content.">
            <ActionBar primary={{ action: 'save' }} secondary={[{ action: 'cancel' }]} tertiary={[{ action: 'preview' }]} />
          </SectionPanel>
        </ConsumerDashboardGrid>
      );
    case 'table-responsive-strategies':
      return (
        <DataTable
          data={[
            { id: '1', surface: 'DiscoveryShell', approach: 'card-first' },
            { id: '2', surface: 'DataTable', approach: 'grid' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'approach', label: 'Responsive approach' },
          ]}
          getRowKey={(row: Record<string, string>, index: number) => `${row.id}-${index}`}
        />
      );
    case 'mobile-action-density':
      return (
        <SectionPanel title="Mobile action density" description="Keep one primary action plus compact secondary stack on small viewports.">
          <ActionBar
            primary={{ action: 'save' }}
            secondary={[{ action: 'cancel' }, { action: 'export' }]}
            iconOnly={[{ action: 'notifications', ariaLabel: 'More actions' }]}
          />
        </SectionPanel>
      );
    case 'searchable-selection':
      return (
        <div>
          <ActionBar primary={{ action: 'search' }} secondary={[{ action: 'submit' }]} />
          <DataToolbar
            searchSlot={<input aria-label="Search selection" />}
            filterSlot={<input aria-label="Filter selection" />}
            sortSlot={<button type="button">Sort</button>}
            resetAction={<button type="button">Reset</button>}
            createAction={<button type="button">Create</button>}
            activeFilters={[{ label: 'Selected', onRemove: () => {} }]}
          />
          <DemoList items={['Open', 'Selected', 'Filtered']} />
        </div>
      );
    case 'vocabulary-extension-lane':
      return (
        <ActionBar
          vocabularyPacks={[vocab]}
          primary={{ action: 'camera:urgent' }}
          secondary={[{ action: 'refresh' }]}
          tertiary={[{ action: 'save' }]}
          iconOnly={[{ action: 'help' }]}
        />
      );
    default:
      return (
        <SectionPanel title="Live reference note" description="This documented pattern is represented through the shared component family.">
          <p>No interactive demo renders here — this pattern is implemented through the exports and coverage details listed above.</p>
        </SectionPanel>
      );
  }
}

function PatternEntryCard({ entry }: { entry: PatternRegistryEntry }) {
  if (entry.id === 'partner-discovery-system') {
    return (
      <>
        <CoverageText entry={entry} />
        {renderEntryDemo(entry)}
      </>
    );
  }

  return (
    <SectionPanel title={entry.title} description={entry.summary}>
      <CoverageText entry={entry} />
      {renderEntryDemo(entry)}
    </SectionPanel>
  );
}

export function PatternsIndexPage() {
  const counts = Object.entries(familyMeta).map(([family, meta]) => ({
    id: family,
    title: meta.title,
    description: meta.description,
    href: `/general-design-system/patterns/${family}`,
    badge: `${getFamilyEntries(family as PatternFamily).length} entries`,
  }));

  return (
    <DocsPageShell
      title="Pattern Catalog"
      eyebrow="SSOT-aligned live catalog"
      lead="This catalog maps the documented pattern inventory to live runtime proof. The markdown SSOT remains normative, and this site is the visual reference."
    >
      <SiteTourLauncher
        tourId="gds-patterns"
        autoStart
        steps={[
          { id: 'patterns-families', target: 'patterns-families', title: 'Browse pattern families', body: 'Each family is a public route grouping documented patterns. Open one to inspect its live, governed runtime contract.', placement: 'bottom' },
          { id: 'patterns-coverage', target: 'patterns-coverage', title: 'Every pattern is traceable', body: 'The catalog stays a strict consumer of shipped primitives — each entry maps back to the canonical markdown SSOT, never a local fork.', placement: 'top' },
        ]}
      />
      <div data-gds-tour-target="patterns-families">
      <ReferenceSection title="Browse pattern families" description="Every documented pattern is grouped into a public route so visitors can inspect the live contract.">
        <ReferenceLinkGrid items={counts} />
      </ReferenceSection>
      </div>
      <div data-gds-tour-target="patterns-coverage">
      <ReferenceSection title="Coverage promise" description="The official site is expected to remain a strict consumer of the primitives it documents.">
        <FeatureBand
          columns={3}
          items={[
            { id: 'live', title: 'Live demonstrations', description: 'Documented patterns should be represented by shipped package surfaces or bounded examples.' },
            { id: 'traceable', title: 'Traceable to SSOT', description: 'Each entry keeps its section, family, route, and summary aligned with the canonical markdown inventory.' },
            { id: 'governed', title: 'No local authority', description: 'When the site needs a reusable surface, it belongs in GDS rather than in the app layer.' },
          ]}
        />
      </ReferenceSection>
      </div>
    </DocsPageShell>
  );
}

export function PatternFamilyPage({ family }: { family: PatternFamily }) {
  const meta = familyMeta[family];
  const entries = getFamilyEntries(family);
  const groupedEntries = groupEntries(entries);

  return (
    <DocsPageShell
      title={meta.title}
      eyebrow="Pattern family"
      lead={meta.description}
      breadcrumbs={[
        { label: 'Patterns', href: '/general-design-system/patterns' },
        { label: meta.title },
      ]}
    >
      <ReferenceSection
        title="How to use this family"
        description="Use docs routes for policy and usage guidance, then validate behavior against live demos where interaction/runtimes are relevant."
      >
        <ReferenceLinkGrid
          columns={3}
          items={[
            {
              id: 'install-path',
              title: 'Install path',
              description: 'Use the canonical package and provider setup before adopting patterns locally.',
              href: '/general-design-system/install',
            },
            {
              id: 'governance-rules',
              title: 'Governance rules',
              description: 'Review strict adoption boundaries, exceptions, and deletion expectations.',
              href: '/general-design-system/governance',
            },
            {
              id: 'live-runtime-proof',
              title: 'Live runtime proof',
              description: 'Use live demo routes to verify runtime behavior, not just static documentation copy.',
              href: '/general-design-system/live-demos',
            },
          ]}
        />
      </ReferenceSection>
      {Object.entries(groupedEntries).map(([section, sectionEntries]) => (
        <ReferenceSection
          key={section}
          title={section}
          description={`${sectionEntries.length} documented pattern${sectionEntries.length === 1 ? '' : 's'} in this section.`}
        >
          {sectionEntries.map((entry) => (
            <PatternEntryCard key={entry.id} entry={entry} />
          ))}
        </ReferenceSection>
      ))}
    </DocsPageShell>
  );
}
