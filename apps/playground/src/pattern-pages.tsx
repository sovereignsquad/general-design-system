import { GdsMap } from '@sovereignsquad/gds-core/map';
import { GdsPinSystemReference, GdsMotionSystemReference, GdsShapeElevationSystemReference, GdsDensitySpacingSystemReference, GdsIconSystemReference, GdsTypographySystemReference, GdsInlineLink } from '@sovereignsquad/gds-core';
import { useEffect, useMemo, useState } from 'react';
import {
  AISearchCard,
  BottomTabBar,
  BOTTOM_TAB_MAX_ITEMS,
  BOTTOM_TAB_HEIGHT,
  GdsViewportFrame,
  ChatThread,
  getGdsMaturitySummary,
  getGdsRecommendedMaturityCapabilities,
  GdsAccentContrastMatrix,
  MediaWithFallback,
  NumberStepper,
  SearchableSelect,
  type ChatMessageModel,
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
  GdsMeter,
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
  GdsIconBadge,
  GdsGeneratedAvatar,
  GdsGeneratedMark,
  GdsMapBasemapWash,
  GdsMapFilterRail,
  GdsMapPinBadge,
  GdsMapPinPreviewCard,
  GdsSavedIndicator,
  GdsGeneratedThumbnail,
  GdsGeneratedHero,
  gdsBadgeAccentColors,
  GdsBox,
  GdsStack,
  GdsInline,
  GdsIcon,
  MeaningBadge,
  FitScoreChip,
  BodyText,
  InlineText,
  MetadataText,
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
// Excluded from the main barrel so consumers who don't use it don't bundle it.
import { GdsRichTextEditor } from '@sovereignsquad/gds-core/rich-text-editor';
import { VibeThemePicker, GdsVibeThemeScope, GdsIconStyleContext, getGdsVibeThemes, getGdsVibeThemeCssVariables, type GdsThemePresetId, type GdsBadgeIconStyle } from '@sovereignsquad/gds-theme';
import type { GdsCategoryDefinition } from '@sovereignsquad/gds-core';
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
          {/* size="xs"/"sm"/default all exercise the mobile input-focus auto-zoom guard (gdsTheme's Input.vars). */}
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

function DestructiveActionDemo() {
  const [open, setOpen] = useState(false);
  return (
    <SectionPanel title="Destructive confirmation" description="Irreversible actions require an explicit, dismissible confirmation — never a permanently-open dialog.">
      <SemanticButton action="delete" onClick={() => setOpen(true)}>Delete pattern</SemanticButton>
      <ConfirmDialog
        opened={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Delete this pattern"
        confirmAction="delete"
        isDanger
      >
        Destructive actions must remain explicit and reversible only with confirmation.
      </ConfirmDialog>
    </SectionPanel>
  );
}

function BadgeCardCompositionDemo() {
  return (
    <SectionPanel title="Badges on cards" description="A card's status slot and footer accept any node, so a badge replaces the plain status pill and a cluster of badges summarizes categories or reasons at a glance.">
      <GdsInline gap="lg" align="start">
        <ProductCard
          title="Summer swim program"
          description="Eight-week beginner track at the community pool."
          status={<GdsBadge tone="success" icon="Success" label="Enrollment open" />}
          metadata={[
            { label: 'Ages', value: '6-12' },
            { label: 'Sessions', value: '8' },
          ]}
          footer={
            <GdsInline gap="xs">
              <GdsBadge accent="teal" shape="hexagon" icon="Habit" label="Swimming" />
              <GdsBadge accent="ocean" shape="circle" icon="Location" label="Pool 2" />
            </GdsInline>
          }
        />
        <ListingCard
          title="Riverside choir"
          description="All-ages community choir, no audition required."
          metadata={[{ id: 'schedule', label: 'Thursdays, 6pm' }]}
          score={<GdsBadge tone="info" icon="Info" label="Great fit" />}
          reason={
            <GdsInline gap="xs">
              <GdsBadge accent="grape" shape="circle" icon="Message" label="Choir" />
              <GdsBadge accent="forest" shape="shield" icon="Verify" label="Verified host" />
            </GdsInline>
          }
        />
      </GdsInline>
    </SectionPanel>
  );
}

function BadgeButtonAnchorDemo() {
  return (
    <SectionPanel title="Badges beside buttons" description="A count badge anchors to an icon button's corner via the same GdsBadgeStack corner model used to anchor an icon — the button stays the accessible hit target and name, the pill is decorative, and count changes announce through the badge's own live region. A plain badge can also sit beside a labeled button as a status echo.">
      <GdsInline gap="xl">
        <button type="button" aria-label="Notifications">
          <GdsCountBadge value={4} label="unread notifications" anchor={<GdsIcon icon="Notifications" size="lg" />} anchorSize="1.75rem" />
        </button>
        <button type="button" aria-label="Save this listing">
          <GdsCountBadge dot label="new activity on this listing" tone="info" anchor={<GdsIcon icon="Star" size="lg" />} anchorSize="1.75rem" />
        </button>
        <GdsInline gap="xs">
          <SemanticButton action="save">Save</SemanticButton>
          <GdsBadge tone="success" icon="Success" label="Saved" />
        </GdsInline>
      </GdsInline>
    </SectionPanel>
  );
}

const MAP_PIN_MARKERS: Array<{
  id: string;
  position: { lat: number; lng: number };
  accent: keyof typeof gdsBadgeAccentColors;
  icon: 'Location' | 'Habit' | 'Message' | 'Verify';
  label: string;
}> = [
  { id: 'pool', position: { lat: 51.5079, lng: -0.0877 }, accent: 'ocean', icon: 'Location', label: 'Community pool' },
  { id: 'studio', position: { lat: 51.5133, lng: -0.0886 }, accent: 'teal', icon: 'Habit', label: 'Dance studio' },
  { id: 'hall', position: { lat: 51.5031, lng: -0.1195 }, accent: 'grape', icon: 'Message', label: 'Riverside hall' },
  { id: 'center', position: { lat: 51.5014, lng: -0.0993 }, accent: 'forest', icon: 'Verify', label: 'Certified center' },
];

// Keyed by the same ids as MAP_PIN_MARKERS: activity drives the filter rail, the rest
// renders in the preview card when that pin is selected.
const MAP_PIN_DETAILS: Record<string, {
  activity: string; activityId: string; neighbourhood: string; summary: string;
  ageRange: string; priceEstimate?: string; lastChecked?: string;
  verified?: boolean; categoryIcon: 'Location' | 'Habit' | 'Message' | 'Verify';
}> = {
  // Four different domains, deliberately: the pin system is domain-agnostic.
  pool: { activity: 'Swimming', activityId: 'swimming', neighbourhood: 'Bankside', summary: 'Heated pools with beginner lanes and family sessions.', ageRange: '6-12', priceEstimate: '~\u00a340 / month', lastChecked: 'Checked last week', categoryIcon: 'Location' },
  studio: { activity: 'Dance', activityId: 'dance', neighbourhood: 'Barbican', summary: 'Ballet and street classes with end-of-term showcases.', ageRange: '5-16', priceEstimate: '~\u00a355 / term', lastChecked: 'Checked this month', categoryIcon: 'Habit' },
  hall: { activity: 'Music', activityId: 'music', neighbourhood: 'South Bank', summary: 'Choir and ensemble sessions in a riverside hall.', ageRange: '8-18', categoryIcon: 'Message' },
  center: { activity: 'Cooking', activityId: 'cooking', neighbourhood: 'Borough', summary: 'Certified kitchen classes with seasonal, market-led menus.', ageRange: '10-16', priceEstimate: '~\u00a348 / month', lastChecked: 'Checked last week', verified: true, categoryIcon: 'Verify' },
};

function BadgeMapDemo() {
  return (
    <SectionPanel title="Badges on a map" description="Map markers use GdsMapPinBadge — a governed pin marker, correct by construction, so consumers never hand-tune the centering/stroke/contrast constants themselves.">
      <PinSystemDemo />
      <MapSurfaceDemo />
    </SectionPanel>
  );
}

// Extracted so the pin-system and gds-map entries each prove themselves independently.
function PinSystemDemo() {
  return <GdsPinSystemReference />;
}

function MapSurfaceDemo() {
  // Rail counts and preview card both derive from the same markers the map renders.
  const [activityFilter, setActivityFilter] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | undefined>(undefined);
  const [savedPins, setSavedPins] = useState<Record<string, boolean>>({});

  const visibleMarkers = MAP_PIN_MARKERS.filter(
    (pin) => activityFilter === null || MAP_PIN_DETAILS[pin.id].activityId === activityFilter,
  );
  const activities = [...new Set(MAP_PIN_MARKERS.map((pin) => MAP_PIN_DETAILS[pin.id].activityId))];
  const railOptions = activities.map((activityId) => ({
    id: activityId,
    label: MAP_PIN_DETAILS[MAP_PIN_MARKERS.find((pin) => MAP_PIN_DETAILS[pin.id].activityId === activityId)!.id].activity,
    count: MAP_PIN_MARKERS.filter((pin) => MAP_PIN_DETAILS[pin.id].activityId === activityId).length,
  }));

  return (
    <MapPanel
      title="Nearby activities"
      description="Real OpenStreetMap tiles via GdsMap, composed under GdsMapBasemapWash — the tiles desaturate and take a tint of the active theme's canvas colour, so the basemap reads as part of the page rather than a foreign surface. The filter rail's counts come from the same markers the map renders, and selecting a pin opens its preview card. Tiles, markers and the ODbL credit are all governed, and switching the theme above re-initialises the map because Leaflet holds imperative DOM the CSS cascade cannot reach."
      minHeight={320}
      renderMap={() => (
        <GdsStack gap="sm">
          <GdsMapFilterRail
            ariaLabel="Filter places by activity"
            options={railOptions}
            value={activityFilter}
            onChange={(next) => {
              setActivityFilter(next);
              setSelectedPinId(undefined);
            }}
          />
          <GdsMapBasemapWash>
            <GdsMap
              label="Nearby activities"
              height="320px"
              markers={visibleMarkers.map((pin) => ({
                id: pin.id,
                position: pin.position,
                accent: pin.accent,
                label: pin.label,
              }))}
              selectedMarkerId={selectedPinId}
              onMarkerSelect={(markerId) => setSelectedPinId((current) => (current === markerId ? undefined : markerId))}
              defaultViewport={{ center: { lat: 51.5074, lng: -0.0965 }, zoom: 13 }}
              renderMarkerPreview={(markerId) => {
                const pin = MAP_PIN_MARKERS.find((entry) => entry.id === markerId);
                const detail = MAP_PIN_DETAILS[markerId];
                if (!pin || !detail) return null;
                return (
                  <GdsMapPinPreviewCard
                    title={pin.label}
                    activity={detail.activity}
                    neighbourhood={detail.neighbourhood}
                    summary={detail.summary}
                    ageRange={detail.ageRange}
                    trust={detail.verified ? { variant: 'validation', label: 'Verified provider' } : undefined}
                    priceEstimate={detail.priceEstimate}
                    lastChecked={detail.lastChecked}
                    thumbnailSeed={pin.id}
                    categories={[{ key: detail.activityId, label: detail.activity, icon: detail.categoryIcon }]}
                    primaryAction={<SemanticButton action="preview" fullWidth>View provider</SemanticButton>}
                    saved={Boolean(savedPins[pin.id])}
                    saveLabel={`Save ${pin.label}`}
                    unsaveLabel={`Remove ${pin.label} from saved`}
                    onSaveChange={(next) => setSavedPins((current) => ({ ...current, [pin.id]: next }))}
                    onClose={() => setSelectedPinId(undefined)}
                    closeLabel={`Close ${pin.label} preview`}
                  />
                );
              }}
            />
          </GdsMapBasemapWash>
        </GdsStack>
      )}
    />
  );
}

/**
 * Consumer-domain vocabulary, not a GDS-owned enum. `icon` uses existing GdsIconKey
 * stand-ins — no sport-specific icon exists in the closed registry.
 */
const EMOJI_MODE_CATEGORIES: GdsCategoryDefinition[] = [
  // Three different domains, deliberately: emoji mode is not sport-specific.
  { key: 'soccer', label: 'Soccer', accent: 'forest', icon: 'Location', emoji: '⚽' },
  { key: 'painting', label: 'Painting', accent: 'terracotta', icon: 'Gallery', emoji: '🎨' },
  { key: 'cooking', label: 'Cooking', accent: 'bronze', icon: 'Star', emoji: '🍜' },
];

function EmojiModeDemo() {
  // Defaults to emoji: the forced-colors runtime gate is a static snapshot with no click
  // simulation, so it only ever sees whatever mode is default.
  const [mode, setMode] = useState<GdsBadgeIconStyle>('emoji');
  return (
    <SectionPanel
      title="Badge glyph mode: Tabler or emoji"
      description="A client asked for emoji as an alternative to Tabler icons in badges. The mode below is ambient — set once (here, scoped to just this demo section via GdsIconStyleContext; a real app sets it once on GdsProvider's defaultBadgeIconStyle) and every badge/pin whose category has an emoji switches to it. A category with no emoji keeps its Tabler icon even in emoji mode — that's the failsafe, not a gap. The generated thumbnail on the right never reads emoji at all: it keeps rendering from the same category's icon regardless of this toggle, by construction."
    >
      <PillBar<GdsBadgeIconStyle>
        ariaLabel="Badge glyph mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'tabler', label: 'Tabler icons' },
          { value: 'emoji', label: 'Emoji' },
        ]}
      />
      <GdsIconStyleContext.Provider value={{ badgeIconStyle: mode }}>
        <GdsStack gap="md" mt="md">
          <GdsInline gap="xs">
            {EMOJI_MODE_CATEGORIES.map((category) => (
              <GdsBadge key={category.key} accent={category.accent} icon={category.icon as never} emoji={category.emoji} label={category.label} />
            ))}
          </GdsInline>
          <MapPanel
            title="Activity map"
            description="GdsMapPinBadge follows the same ambient mode — the ring stays the category's accent, the pin fills with a fixed dark-neutral disc in emoji mode (never the accent), and the emoji centers on it."
            minHeight={140}
            renderMap={() => (
              <GdsBox pos="relative" w="100%" h="100%">
                {EMOJI_MODE_CATEGORIES.map((category, index) => (
                  <GdsBox key={category.key} pos="absolute" top={`${30 + index * 5}%`} left={`${22 + index * 26}%`}>
                    <GdsMapPinBadge
                      size={36}
                      accent={category.accent}
                      icon={category.icon as never}
                      emoji={category.emoji}
                      label={category.label}
                    />
                  </GdsBox>
                ))}
              </GdsBox>
            )}
          />
          <GdsInline gap="md" align="start">
            {EMOJI_MODE_CATEGORIES.map((category) => (
              <GdsStack key={category.key} gap="xs" align="center">
                <GdsBox w={160}>
                  <GdsGeneratedThumbnail
                    seed={`sports-demo-${category.key}`}
                    categories={[{ key: category.key, label: category.label, icon: category.icon as never }]}
                    paletteSource="category"
                    category={category.accent}
                  />
                </GdsBox>
                <BodyText>{category.label} — thumbnail stays Tabler</BodyText>
              </GdsStack>
            ))}
          </GdsInline>
        </GdsStack>
      </GdsIconStyleContext.Provider>
    </SectionPanel>
  );
}

function GeneratedThumbnailDemo() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  return (
    <SectionPanel
      title="Generated card thumbnails"
      description="GdsGeneratedThumbnail (epic 503) composes a deterministic, zero-network SVG+HTML thumbnail from a listing's own category data — no image hosting, no AI image generation. paletteSource=&quot;theme&quot; (default, left two cards) reads the active theme's brand colors, so switching themes above restyles these along with everything else. paletteSource=&quot;category&quot; opts into the fixed curated-accent system instead, for consumers who want category color to stay stable across theme changes. The last card is badges=&quot;none&quot;: motif only, which is what a card renders when a listing has no photo — a badge there would repeat the title the card already prints beneath it."
    >
      <GdsInline gap="md" align="start">
        <GdsStack gap="xs" align="center">
          <GdsBox w={220}>
            <GdsGeneratedThumbnail
              seed="demo-listing-1"
              badges="ranked"
              categories={[
                { key: 'soccer', label: 'Soccer', icon: 'Location' },
                { key: 'painting', label: 'Painting', icon: 'Gallery' },
                { key: 'choir', label: 'Choir', icon: 'Message' },
              ]}
            />
          </GdsBox>
          <BodyText>paletteSource="theme" (default)</BodyText>
        </GdsStack>
        <GdsStack gap="xs" align="center">
          <GdsBox w={220}>
            <GdsGeneratedThumbnail
              seed="demo-listing-2"
              categories={[{ key: 'art', label: 'Art', icon: 'Gallery' }]}
            />
          </GdsBox>
          <BodyText>Single category, no secondary badges</BodyText>
        </GdsStack>
        <GdsStack gap="xs" align="center">
          <GdsBox w={220}>
            <GdsGeneratedThumbnail
              seed="demo-listing-3"
              categories={[
                { key: 'swimming', label: 'Swimming', icon: 'Star' },
                { key: 'yoga', label: 'Yoga', icon: 'Habit' },
              ]}
              paletteSource="category"
              category="teal"
              shade="deep"
            />
          </GdsBox>
          <BodyText>paletteSource="category" (teal / deep)</BodyText>
        </GdsStack>

        <GdsStack gap="xs" align="center">
          <GdsBox w={220}>
            <GdsGeneratedThumbnail
              seed="demo-listing-fallback"
              categories={[{ key: 'listing', label: 'Riverside choir', icon: 'Gallery' }]}
              badges="none"
            />
          </GdsBox>
          <MetadataText>badges=&quot;none&quot; — the fallback-image case</MetadataText>
        </GdsStack>

        <GdsStack gap="xs" align="center">
          <GdsBox w={220}>
            <GdsGeneratedThumbnail
              seed="demo-listing-interactive"
              categories={[
                { key: 'soccer', label: 'Soccer', icon: 'Location', onSelect: setSelectedCategory },
                { key: 'painting', label: 'Painting', icon: 'Gallery', onSelect: setSelectedCategory },
              ]}
              tintWithBackground="var(--gds-bg-canvas)"
              mixRatio={0.65}
            />
          </GdsBox>
          <MetadataText>
            {selectedCategory ? `Selected: ${selectedCategory}` : 'Tap a badge — onSelect + tintWithBackground'}
          </MetadataText>
        </GdsStack>
      </GdsInline>
      <GdsStack gap="xs" mt="md">
        <BodyText>Every aspect ratio in the vocabulary:</BodyText>
        <BodyText>
          The ratio is part of the governed contract — a consumer picks from the closed union, and
          the motif recomposes for the geometry rather than stretching. All four render here so
          none of them is a claim without a proof.
        </BodyText>
        <GdsInline gap="md" align="start">
          {(['3:2', '16:9', '4:3', '1:1'] as const).map((ratio) => (
            <GdsStack key={ratio} gap="xs" align="center">
              <GdsBox w={ratio === '1:1' ? 160 : 220}>
                <GdsGeneratedThumbnail
                  seed={`ratio-proof-${ratio}`}
                  aspectRatio={ratio}
                  badges="none"
                  categories={[{ key: 'gardening', label: 'Gardening', icon: 'Habit' }]}
                />
              </GdsBox>
              <MetadataText>{ratio}</MetadataText>
            </GdsStack>
          ))}
        </GdsInline>
      </GdsStack>
    </SectionPanel>
  );
}

function GeneratedIdentityDemo() {
  return (
    <SectionPanel
      title="Generated identity: avatars and marks"
      description="The identity shapes of the generated-imagery system. GdsGeneratedAvatar renders a deterministic mark from a person's name — initials on the house gradient, with a seeded gradient angle so two people with the same initials still differ; no photos, no third-party avatar service. GdsGeneratedMark fills logo-shaped slots: the gradient with one motif rendered prominently, seeded tilt for per-entity distinction. Both follow the active theme via live token references, like every generated surface."
    >
      <GdsInline gap="md" align="center">
        <GdsGeneratedAvatar name="Ada Lovelace" seed="user-1" size={56} />
        <GdsGeneratedAvatar name="Alan Lovelace" seed="user-2" size={56} />
        <GdsGeneratedAvatar name="Grace Hopper" seed="user-3" size={56} />
        <GdsGeneratedAvatar name="日本 花子" seed="user-4" size={56} />
        <GdsGeneratedMark seed="workspace-acme" icon="Habit" size={56} />
        <GdsGeneratedMark seed="workspace-nova" icon="Gallery" size={56} />
        <GdsGeneratedMark seed="workspace-tide" icon="Location" size={56} />
      </GdsInline>
      <BodyText>
        The first two avatars share the initials and differ only by seed — the distinction lives
        in geometry, never in hue, because hue belongs to the theme. The site&apos;s own favicon
        and social card are generated by the same system from the default theme&apos;s palette.
      </BodyText>
    </SectionPanel>
  );
}

function GeneratedHeroDemo() {
  const badges = [
    { key: 'soccer', label: 'Soccer', icon: 'Location' as const },
    { key: 'basketball', label: 'Basketball', icon: 'Habit' as const },
    { key: 'gymnastics', label: 'Gymnastics', icon: 'Trophy' as const },
    { key: 'swimming', label: 'Swimming', icon: 'Star' as const },
    { key: 'art', label: 'Art', icon: 'Gallery' as const },
    { key: 'music', label: 'Music', icon: 'Message' as const },
  ];
  return (
    <SectionPanel
      title="Generated hero backdrops"
      description="GdsGeneratedHero shares GdsGeneratedThumbnail's palette and seed engine at banner scale: an accent wash plus one of four pluggable background strategies, and up to 6 ranked badges at a fixed size ladder (one large, two medium, three small) — fixed slots, not free placement, so the composition never reads as clutter."
    >
      <GdsStack gap="md">
        <GdsGeneratedHero seed="demo-hero-wash" label="Sports classes in Riverdale" badges={badges} />
        <GdsGeneratedHero seed="demo-hero-mosaic" label="Camps across the city" background="mosaic-abstract" badges={badges} />
        <GdsGeneratedHero seed="demo-hero-icons" label="Every activity, one map" background="icon-field" badges={badges} />
        <GdsGeneratedHero
          seed="demo-hero-regions"
          label="Neighborhood coverage"
          badges={badges}
          background={{
            type: 'region-mosaic',
            regions: [
              { x0: 0.05, y0: 0.1, x1: 0.32, y1: 0.55 },
              { x0: 0.3, y0: 0.15, x1: 0.5, y1: 0.42, weight: 1.6 },
              { x0: 0.55, y0: 0.2, x1: 0.78, y1: 0.6 },
              { x0: 0.62, y0: 0.55, x1: 0.9, y1: 0.92, weight: 2 },
              { x0: 0.08, y0: 0.55, x1: 0.28, y1: 0.88 },
            ],
          }}
        />
      </GdsStack>
    </SectionPanel>
  );
}

function GeneratedImageryCardPlaceholderDemo() {
  return (
    <SectionPanel
      title="As a card-image placeholder"
      description="image accepts any node on ListingCard, PublicProductCard, and PublicFoodCard — GdsGeneratedThumbnail composes directly into that slot, no changes to the card components required, so a listing keeps an on-brand thumbnail instead of a blank gray icon the moment it exists, real photo or not."
    >
      <GdsInline gap="lg" align="start">
        <ListingCard
          title="Riverside choir"
          description="No host photo on file yet — the listing still reads as finished."
          image={
            <GdsGeneratedThumbnail
              seed="listing-riverside-choir"
              categories={[{ key: 'music', label: 'Choir', icon: 'Message' }]}
              aspectRatio="4:3"
            />
          }
          metadata={[{ id: 'schedule', label: 'Thursdays, 6pm' }]}
        />
        <PublicProductCard
          title="Hand-thrown ceramic mug"
          description="New maker's first listing — no product photo yet."
          image={
            <GdsGeneratedThumbnail
              seed="product-ceramic-mug"
              categories={[{ key: 'craft', label: 'Handmade', icon: 'Star' }]}
              aspectRatio="4:3"
            />
          }
          price="€18"
          state="available"
        />
        <PublicFoodCard
          title="Chef's daily special"
          description="Same-day addition — no time for a photo shoot."
          image={
            <GdsGeneratedThumbnail
              seed="food-daily-special"
              categories={[{ key: 'kitchen', label: 'Kitchen pick', icon: 'Trophy' }]}
              aspectRatio="4:3"
            />
          }
          price="€14"
          state="available"
        />
      </GdsInline>
    </SectionPanel>
  );
}

function BadgeProfileClusterDemo() {
  return (
    <SectionPanel title="Badge clusters on a profile" description="Multiple badges read left-to-right in a wrapping row beside identity — never stacked on the avatar, which the GdsBadgeStack corner model reserves for a single verification mark.">
      <GdsInline gap="md" align="start">
        <GdsBadgeStack size={48} label="Jordan Rivera — verified host">
          <GdsBadgeStackLayer cutout="bottom-end">
            <GdsBadgeShapeCircle size="100%" stroke={1.5} />
          </GdsBadgeStackLayer>
          <GdsBadgeStackLayer scale={0.62}>
            <GdsIcon icon="Profile" size="100%" tone="default" />
          </GdsBadgeStackLayer>
          <GdsBadgeStackLayer corner="bottom-end" scale={0.44}>
            <GdsBadgeShapeShield size="100%" stroke={1.75} />
          </GdsBadgeStackLayer>
        </GdsBadgeStack>
        <GdsStack gap="xs">
          <BodyText>Jordan Rivera</BodyText>
          <GdsInline gap="xs">
            <GdsBadge accent="teal" shape="hexagon" icon="Habit" label="Swimming" />
            <GdsBadge accent="grape" shape="circle" icon="Message" label="Choir" />
            <GdsBadge accent="forest" shape="shield" icon="Verify" label="Certified coach" />
            <GdsCountBadge value={3} label="badges earned this season" tone="info" />
          </GdsInline>
        </GdsStack>
      </GdsInline>
    </SectionPanel>
  );
}

function BadgeOverlayDemo() {
  const [open, setOpen] = useState(false);
  return (
    <OverlayManagerProvider>
      <SectionPanel title="Badges in overlays" description="A modal can confirm a badge was just earned; an inline alert carries a badge as its action content. Badges never appear inside a toast body, which stays text-only for assistive tech.">
        <button id="open-badge-dialog" type="button" onClick={() => setOpen(true)}>View achievement</button>
        <GdsDialog
          id="badge-achievement-dialog"
          opened={open}
          onClose={() => setOpen(false)}
          invokerId="open-badge-dialog"
          title="Achievement unlocked"
          description="A new badge was added to this profile."
        >
          <GdsInline gap="md">
            <GdsBadgeStack size={56} label="Ten-session streak">
              <GdsBadgeStackLayer>
                <GdsBadgeShapeRosette size="100%" stroke={1.5} />
              </GdsBadgeStackLayer>
              <GdsBadgeStackLayer scale={0.5}>
                <GdsIcon icon="Star" size="100%" tone="default" />
              </GdsBadgeStackLayer>
            </GdsBadgeStack>
            <BodyText>Ten-session streak — keep it going!</BodyText>
          </GdsInline>
          <SemanticButton action="confirm" onClick={() => setOpen(false)}>Nice</SemanticButton>
        </GdsDialog>
        <InlineAlert
          title="New badge available"
          message="Complete two more sessions to unlock the Certified Coach badge."
          severity="info"
          action={<GdsBadge tone="info" icon="Info" label="2 sessions to go" />}
        />
        <InlineAlert
          title="Certification expiring soon"
          message="Renew before the season starts to keep the Certified Coach badge active."
          severity="warning"
          action={<GdsBadge tone="warning" icon="Warning" label="Renew by Sep 1" />}
        />
        <InlineAlert
          title="Certification lapsed"
          message="This badge no longer displays on the public profile until it is renewed."
          severity="error"
          action={<GdsBadge tone="danger" icon="Danger" label="Renewal required" />}
        />
      </SectionPanel>
    </OverlayManagerProvider>
  );
}

/**
 * How a state tone behaves across presets, measured rather than described: derived from
 * the same resolver the contrast gate reads. Phrases stay literals for the extractor;
 * only the choice between them is computed.
 */
const TONE_BEHAVIOUR_PHRASE = {
  anchoredBoth: 'One value in every preset, in both schemes.',
  anchoredDark: 'Anchored in dark; tinted per preset in light.',
  anchoredLight: 'Anchored in light; tinted per preset in dark.',
  tinted: 'Tinted per preset in both schemes.',
} as const;

function measureToneBehaviour(tone: 'success' | 'warning' | 'danger' | 'info') {
  const presets = getGdsVibeThemes();
  const distinct = (scheme: 'light' | 'dark') => new Set(
    presets.map((p) => getGdsVibeThemeCssVariables(p.id, scheme)[`--gds-state-${tone}`]),
  ).size;
  const light = distinct('light');
  const dark = distinct('dark');
  const key = light === 1 && dark === 1 ? 'anchoredBoth'
    : dark === 1 ? 'anchoredDark'
      : light === 1 ? 'anchoredLight'
        : 'tinted';
  return { phrase: TONE_BEHAVIOUR_PHRASE[key], light, dark, presets: presets.length };
}

const BADGE_TONES = [
  { tone: 'success', icon: 'Success', label: 'Success' },
  { tone: 'warning', icon: 'Warning', label: 'Warning' },
  { tone: 'danger', icon: 'Danger', label: 'Danger' },
  { tone: 'info', icon: 'Info', label: 'Info' },
] as const;

/**
 * The one place the analytics demo's numbers live — chart summary, legend, and table
 * fallback all read from here. A drift between them is an accessibility defect: the
 * summary is what assistive tech announces in place of the picture.
 */
const CHANNEL_SHARES = [
  { label: 'Online', share: 62, token: 'primary' as const },
  { label: 'In-store', share: 38, token: 'info' as const },
];

/** Shares must describe the whole, or the summary misleads about what the chart shows. */
if (CHANNEL_SHARES.reduce((sum, c) => sum + c.share, 0) !== 100) {
  throw new Error('CHANNEL_SHARES must total 100; the chart summary claims to account for all visible orders.');
}

const EVIDENCE_SOURCES = { covered: 18, total: 20 };

/**
 * Builds the chart's text equivalent from the same data the table renders.
 *
 * Uses `%online%`/`%instore%`, not a template literal — the phrase extractor only
 * collects string literals.
 */
function channelSummary(): string {
  return 'Online orders account for %online% percent of visible orders; in-store orders account for %instore% percent.'
    .replace(/%online%/, String(CHANNEL_SHARES[0].share))
    .replace(/%instore%/, String(CHANNEL_SHARES[1].share));
}

function SavedIndicatorDemo() {
  const [saved, setSaved] = useState(false);
  return (
    <SectionPanel
      title="Saved indicator"
      description="One governed toggle in two geometries: the corner form composes onto a map pin, the button form sits in a preview card's action row. Both are the same labelled button with aria-pressed — never a decorative heart — and both take their size from the control scale, so a compact theme moves them with everything else. The accessible name states the action available; aria-pressed carries the state, so neither is announced twice."
    >
      <GdsInline gap="lg" align="center">
        <GdsSavedIndicator
          saved={saved}
          onSaveChange={setSaved}
          saveLabel="Save Riverside Swim Club"
          unsaveLabel="Remove Riverside Swim Club from saved"
        />
        <InlineText>{saved ? 'Saved' : 'Not saved'}</InlineText>
        {/* The corner form takes its anchor as a prop and composes through the governed badge
            stack — no positioned wrapper for the consumer to get right. */}
        <GdsSavedIndicator
          mode="corner"
          saved={saved}
          onSaveChange={setSaved}
          saveLabel="Save Riverside Swim Club"
          unsaveLabel="Remove Riverside Swim Club from saved"
          anchor={<GdsMapPinBadge accent="ocean" icon="Location" label="Riverside Swim Club" size={56} filled />}
        />
      </GdsInline>
    </SectionPanel>
  );
}

function BadgeThemeMatrixDemo() {
  const [preset, setPreset] = useState<GdsThemePresetId>('default');
  const measured = useMemo(
    () => BADGE_TONES.map((tone) => ({ ...tone, ...measureToneBehaviour(tone.tone) })),
    [],
  );

  return (
    <SectionPanel
      title="Badges across themes"
      description="Semantic tone maps to the --gds-state-* role tokens, and the rule is deliberately not uniform: an alarm colour that moves is not an alarm, so danger is anchored, while tones that carry no urgency are tinted with the preset's own hue. Every figure below is counted from the resolved tokens at render time rather than written down, so this panel cannot fall out of step with the system it documents. The accent palette is separate: it never changes as you switch presets, because a category means the same thing in every theme. That is a contract, not a gap — a preset MAY declare its own accents, and the contrast gate then verifies that palette rather than the shared one."
    >
      <VibeThemePicker value={preset} onChange={setPreset} label="Preview preset" />
      <GdsVibeThemeScope presetId={preset} scheme="light">
        <GdsStack gap="xs">
          {measured.map((m) => (
            <GdsInline key={m.tone} gap="sm" align="center">
              <GdsBadge tone={m.tone} icon={m.icon} label={m.label} />
              <InlineText>{m.phrase}</InlineText>
              {/* Counted live: the number IS the evidence for the phrase beside it. */}
              <MetadataText>
                {`${m.light} / ${m.dark} distinct values across ${m.presets} presets (light / dark)`}
              </MetadataText>
            </GdsInline>
          ))}
          <GdsInline gap="sm" align="center">
            <GdsBadge accent="teal" icon="Habit" label="Accent" />
            <InlineText>A fixed category vocabulary, identical in every preset and scheme.</InlineText>
          </GdsInline>
        </GdsStack>
      </GdsVibeThemeScope>
    </SectionPanel>
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
        description: 'Authenticating your sample identity and role to unlock premium content.',
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
    description: 'The axes every component and pattern in this system builds on: colour and theming, typography, density and spacing, shape and elevation, motion and micro-interactions, icons, and accessibility.',
  },
  components: {
    title: 'Components',
    description: 'The controls, inputs, and shell/navigation primitives every product assembles pages from — one canonical page per piece.',
  },
  systems: {
    title: 'Systems',
    description: 'The doc-with-proof deep dives: badge system and generated imagery, hosted here; theming, map system, and i18n stay one click away on their own pages.',
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

// Registered as a vocabulary pack so the footer button is a themed SemanticButton, not a raw control.
const KANBAN_LOAD_MORE_VOCAB = createGdsVocabularyPack('board', {
  loadMore: { defaultMessage: 'Load more', icon: GdsIcons.List },
});

// `backlog` is the not-yet-loaded page for the "Load more" footer; `totalCount`
// is the server total the header badge reports.
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

// Exercises the checkbox-group and repeatable field types under the catalog's a11y/contrast gates.
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

/** Each row is a GdsInline, which wraps by default, so it never clips on narrow viewports. */
function BadgeSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <GdsStack gap="xs">
      <BodyText><strong>{title}</strong></BodyText>
      <MetadataText>{description}</MetadataText>
      <GdsInline gap="sm" align="center">{children}</GdsInline>
    </GdsStack>
  );
}

// Single source: the cap the demo renders and the number the sentence beside it quotes.
const BADGE_COUNT_CAP = 99;
const BADGE_COUNT_COPY = 'A count caps rather than growing without bound, and announces its real value to assistive technology so the capped form is never the whole story. This one caps at %cap%.'
  .replace(/%cap%/, String(BADGE_COUNT_CAP));

function BadgeVocabularyDemo() {
  return (
    <GdsStack gap="lg">
      <BadgeSection
        title="Status"
        description="System state, not editorial emphasis. The label carries the meaning; colour repeats it, so a reader who cannot see the colour loses nothing."
      >
        <StatusBadge status="success">Published</StatusBadge>
        <StatusBadge status="warning">Needs review</StatusBadge>
        <StatusBadge status="danger">Blocked</StatusBadge>
        <StatusBadge status="info">Info</StatusBadge>
        <StatusBadge status="neutral">Draft</StatusBadge>
      </BadgeSection>

      <BadgeSection
        title="Status with its canonical icon"
        description="The same five states with the governed icon ahead of the label. The icon is decorative — it is the second cue, never the only one."
      >
        <StatusBadge status="success" withIcon>Published</StatusBadge>
        <StatusBadge status="warning" withIcon>Needs review</StatusBadge>
        <StatusBadge status="danger" withIcon>Blocked</StatusBadge>
        <StatusBadge status="info" withIcon>Info</StatusBadge>
      </BadgeSection>

      <BadgeSection
        title="Label tags"
        description="Neutral classification rather than state: a tag says what something is, a status says how it is doing."
      >
        <LabelTag label="Food" tone="info" />
        <LabelTag label="Community" tone="neutral" />
        <LabelTag label="Priority" tone="warning" />
      </BadgeSection>

      <BadgeSection
        title="Counts"
        description={BADGE_COUNT_COPY}
      >
        <CountBadge value={12} />
        <CountBadge value={126} cap={BADGE_COUNT_CAP} srLabel="More than ninety nine updates" />
      </BadgeSection>

      <BadgeSection
        title="Shape vocabulary"
        description="Six silhouettes drawn on the Tabler geometry, so a composed mark sits beside the icon set instead of next to it."
      >
        <span data-gds-badge-shapes>
          <GdsBadgeShapeCircle size={40} stroke={1.75} aria-hidden="true" />
          <GdsBadgeShapeSquircle size={40} stroke={1.75} aria-hidden="true" />
          <GdsBadgeShapeHexagon size={40} stroke={1.75} aria-hidden="true" />
          <GdsBadgeShapeShield size={40} stroke={1.75} aria-hidden="true" />
          <GdsBadgeShapeRosette size={40} stroke={1.75} aria-hidden="true" />
          <GdsBadgeShapePin size={40} stroke={1.75} aria-hidden="true" />
        </span>
      </BadgeSection>

      <BadgeSection
        title="Composed badge — semantic tone"
        description="GdsBadge takes a tone when it reports system state, and resolves its own colour pair against the surface it sits on."
      >
        <GdsBadge tone="success" icon="Success" label="Published" />
        <GdsBadge tone="warning" icon="Warning" label="Needs review" />
        <GdsBadge tone="danger" icon="Danger" label="Blocked" />
        <GdsBadge tone="info" icon="Info" label="Heads up" />
        <GdsBadge tone="neutral" label="Draft" />
      </BadgeSection>

      <BadgeSection
        title="Composed badge — category accent"
        description="An accent names a category and means the same thing in every theme, which is why it does not shift with the preset the way a tone does."
      >
        <GdsBadge accent="teal" shape="hexagon" icon="Habit" label="Swimming" />
        <GdsBadge accent="grape" shape="circle" icon="Message" label="Choir" />
        <GdsBadge accent="forest" shape="shield" icon="Verify" label="Certified" />
        <GdsBadge accent="terracotta" shape="pin" icon="Location" label="Nearby" />
      </BadgeSection>

      <BadgeSection
        title="Count badge, standalone and anchored"
        description="The same count either stands alone or anchors to an icon's corner through the badge stack — the anchor stays the accessible target."
      >
        <span data-gds-count-badge-demo>
          <GdsCountBadge value={7} label="notifications" />
          <GdsCountBadge value={126} cap={99} label="unread messages" tone="info" />
          <GdsCountBadge dot label="new activity" tone="danger" anchor={<GdsIcon icon="Notifications" size="lg" />} />
          <GdsCountBadge value={3} label="drafts" tone="neutral" anchor={<GdsIcon icon="Inbox" size="lg" />} />
        </span>
      </BadgeSection>

      <BadgeSection
        title="Removable tags"
        description="A filter a reader can take off. The remove control names the filter it removes, so it is unambiguous out of context."
      >
        <span data-gds-removable-tag-demo>
          <GdsRemovableTag label="Music" removeLabel="Remove filter: Music" onRemove={() => {}} />
          <GdsRemovableTag label="Ages 6-8" tone="info" removeLabel="Remove filter: Ages 6-8" onRemove={() => {}} />
          <GdsRemovableTag label="Weekends" tone="success" removeLabel="Remove filter: Weekends" onRemove={() => {}} />
          <GdsRemovableTag label="Archived" removeLabel="Remove filter: Archived" onRemove={() => {}} disabled />
        </span>
      </BadgeSection>

      <BadgeSection
        title="Icon-only category marks"
        description="A flat accent disc with no text, for a category already named by adjacent content — a legend, a caption, an aria-labelled group. Decorative by default; pass label when it stands alone."
      >
        <span data-gds-icon-badge-demo style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <GdsIconBadge accent="teal" icon="Habit" label="Fitness" />
          <GdsIconBadge accent="ocean" shade="deep" icon="Location" label="Nearby" />
          <GdsIconBadge accent="terracotta" icon="Calendar" label="Scheduled" />
        </span>
      </BadgeSection>

      {/*
        The composed proofs the original wall ended with, kept intact and now clearly separated
        from the vocabulary above: those sections name the parts, these show them working
        together on real surfaces.
      */}
      <BadgeCardCompositionDemo />
      <BadgeButtonAnchorDemo />
      <BadgeMapDemo />
      <BadgeProfileClusterDemo />
      <BadgeOverlayDemo />
      <EmojiModeDemo />
      <SavedIndicatorDemo />
      <BadgeThemeMatrixDemo />
    </GdsStack>
  );
}

function LoadersSkeletonsDemo() {
  const items = [
    { id: 'trust', title: 'Verified hosts', description: 'Every listing carries a checked identity before it is shown.' },
    { id: 'service', title: 'Local support', description: 'A named contact per area rather than a shared inbox.' },
    { id: 'place', title: 'Nearby first', description: 'Results are ordered by travel time, not by paid placement.' },
  ];

  return (
    <SectionPanel
      title="Loading skeletons"
      description="A skeleton reserves the shape of the content that is coming, so the layout does not jump when it arrives. Shown beside the resolved band it is standing in for — on its own it is indistinguishable from a surface that failed to load, which is exactly how it read before."
    >
      <GdsStack gap="lg">
        <GdsStack gap="xs">
          <MetadataText>Loading</MetadataText>
          <FeatureBand loading columns={3} items={[]} />
        </GdsStack>
        <GdsStack gap="xs">
          <MetadataText>Resolved — same columns, same heights</MetadataText>
          <FeatureBand columns={3} items={items} />
        </GdsStack>
      </GdsStack>
    </SectionPanel>
  );
}

function BottomTabNavigationDemo() {
  const [activeId, setActiveId] = useState('browse');
  const [sheetOpenFor, setSheetOpenFor] = useState<string | null>(null);
  const items = [
    { id: 'browse', label: 'Browse', href: '#browse', icon: <GdsIcon icon="Search" /> },
    { id: 'saved', label: 'Saved', href: '#saved', icon: <GdsIcon icon="Favorite" /> },
    { id: 'book', label: 'Book', href: '#book', icon: <GdsIcon icon="Calendar" /> },
    { id: 'inbox', label: 'Inbox', href: '#inbox', icon: <GdsIcon icon="Inbox" /> },
    { id: 'profile', label: 'Profile', href: '#profile', icon: <GdsIcon icon="Profile" /> },
  ];

  return (
    <SectionPanel
      title="Bottom tab navigation"
      description="A viewport-fixed, mobile-only surface, shown inside a bounded frame that acts as its viewport. The frame is a shipped primitive, not page scaffolding: it establishes a containing block so the bar pins to the frame instead of the window, and publishes its width class so the bar's breakpoint gate resolves against the frame. Outside a frame the bar behaves exactly as before. The active tab carries aria-current, and each destination is a real link rather than a button styled as one."
    >
      <GdsViewportFrame width="compact" label="Compact width — the class this surface is built for">
        <GdsStack gap="sm">
          <BodyText>Content scrolls behind the bar; the bar stays pinned to the frame.</BodyText>
          <BottomTabBar items={items} activeId={activeId} onNavItemSelect={setActiveId} ariaLabel="Example primary navigation" />
        </GdsStack>
      </GdsViewportFrame>
      <MetadataText>
        {`Selected: ${activeId}. The bar accepts at most ${BOTTOM_TAB_MAX_ITEMS} items — it throws rather than silently dropping one — and reserves ${BOTTOM_TAB_HEIGHT}px plus the safe-area inset, which is the padding a scrolling surface owes it.`}
      </MetadataText>

      <GdsViewportFrame width="compact" label="renderItem — one item opens a sheet instead of navigating">
        <GdsStack gap="sm">
          <BodyText>
            {sheetOpenFor ? `Sheet open for: ${sheetOpenFor}` : 'No sheet open.'}
          </BodyText>
          <BottomTabBar
            items={items}
            activeId={activeId}
            ariaLabel="Example primary navigation with a custom item"
            renderItem={(item, active) => (
              item.id === 'inbox' ? (
                <button
                  type="button"
                  onClick={() => setSheetOpenFor(item.label)}
                  style={{
                    flex: 1, minWidth: 44, minHeight: 44, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, background: 'none', border: 'none', cursor: 'pointer',
                    color: active ? 'var(--gds-brand-accent, var(--mantine-color-violet-6))' : 'var(--gds-text-secondary, var(--mantine-color-gray-6))',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ) : (
                <a
                  href={item.href}
                  onClick={(event) => { event.preventDefault(); setActiveId(item.id); }}
                  style={{
                    flex: 1, minWidth: 44, minHeight: 44, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, textDecoration: 'none',
                    color: active ? 'var(--gds-brand-accent, var(--mantine-color-violet-6))' : 'var(--gds-text-secondary, var(--mantine-color-gray-6))',
                  }}
                >
                  {item.icon}
                  {item.label}
                </a>
              )
            )}
          />
        </GdsStack>
      </GdsViewportFrame>
    </SectionPanel>
  );
}

function MaturityCapabilitiesDemo() {
  const summary = getGdsMaturitySummary();
  const capabilities = getGdsRecommendedMaturityCapabilities();

  return (
    <SectionPanel
      title="Maturity capabilities"
      description="The recommended delivery capability groups, read from the shipped registry rather than restated here. Every row carries the issue that backs it, so a roadmap claim on this site is traceable to work that exists."
    >
      <GdsStack gap="xs">
        <MetadataText>
          {`${summary.total} capability groups: ${summary['production-ready']} production-ready, ${summary['adoption-tooling']} adoption tooling, ${summary['operational-contract']} operational contract.`}
        </MetadataText>
        {capabilities.map((capability) => (
          <GdsInline key={capability.id} gap="sm" align="center">
            <StatusBadge status={capability.status === 'production-ready' ? 'success' : 'info'}>{capability.status}</StatusBadge>
            <InlineText>{capability.title}</InlineText>
            <MetadataText>{`#${capability.issueNumber} • ${capability.packageLanes.join(', ')}`}</MetadataText>
          </GdsInline>
        ))}
      </GdsStack>
    </SectionPanel>
  );
}

function AccentContrastMatrixDemo() {
  const [preset, setPreset] = useState<GdsThemePresetId>('default');

  return (
    <SectionPanel
      title="Accent contrast matrix"
      description="Every accent, shade and mode for one preset, each with its measured ratio and the threshold it has to clear. The figures are produced by evaluateGdsAccentContrast() — the same function verify:accent-contrast runs in CI — so this panel cannot disagree with the build that gates it. Modes the gate does not enforce are shown as measured-only rather than hidden, because a theme author wants those numbers too."
    >
      <VibeThemePicker value={preset} onChange={setPreset} label="Measured preset" />
      <GdsAccentContrastMatrix preset={preset} colorScheme="light" title="Light scheme" />
      <GdsAccentContrastMatrix preset={preset} colorScheme="dark" title="Dark scheme" />
    </SectionPanel>
  );
}

function SearchableSelectDemo() {
  const [value, setValue] = useState<string | null>('riverside');

  return (
    <SectionPanel
      title="Searchable select"
      description="A combobox that filters as you type, groups its options under headings, and clears back to a null value rather than an empty string. Keyboard alone drives it: type to filter, Up/Down to move, Enter to commit, Escape to dismiss. The control announces its popup relationship through aria-haspopup, and it can load its options asynchronously with its own loading, empty and error states."
    >
      <SearchableSelect
        value={value}
        onChange={setValue}
        ariaLabel="Find a swim club"
        placeholder="Search clubs…"
        clearable
        options={[
          { value: 'riverside', label: 'Riverside Swim Club', group: 'Nearby' },
          { value: 'lakeside', label: 'Lakeside Aquatic Centre', group: 'Nearby' },
          { value: 'northgate', label: 'Northgate Pool', group: 'Nearby' },
          { value: 'harbour', label: 'Harbour Masters', group: 'Further out' },
          { value: 'summit', label: 'Summit Leisure', group: 'Further out', disabled: true },
        ]}
      />
      <MetadataText>{value ? `Selected value: ${value}` : 'No selection — the clearable control returns null, not an empty string.'}</MetadataText>
    </SectionPanel>
  );
}

function ConversationSurfaceDemo() {
  const [messages, setMessages] = useState<ChatMessageModel[]>([
    { id: 'm1', role: 'user', content: 'Which clubs run a beginner lane on weekday evenings?' },
    { id: 'm2', role: 'assistant', content: 'Riverside and Northgate both run beginner lanes on weekday evenings.' },
  ]);

  // Transport and persistence belong to the caller; this appends locally only.
  const send = (text: string) => {
    setMessages((current) => [...current, { id: `m${current.length + 1}`, role: 'user', content: text }]);
  };

  return (
    <SectionPanel
      title="Conversation surface"
      description="An auto-scrolling thread that stays pinned to the newest message unless the reader has scrolled away, role-styled bubbles for user and assistant, and an input that sends on Enter and inserts a newline on Shift+Enter. The thread is an ARIA live region, so arriving replies are announced. The second thread is the same component with streaming set, which is what reveals the typing indicator."
    >
      <ChatThread messages={messages} onSend={send} placeholder="Ask about a club…" />
      <ChatThread
        messages={[{ id: 's1', role: 'user', content: 'Do any of them offer a family rate?' }]}
        streaming
        onSend={send}
        placeholder="Input is disabled while the assistant streams"
      />
    </SectionPanel>
  );
}

function MediaWithFallbackDemo() {
  return (
    <SectionPanel
      title="Media with fallback"
      description="The box reserves its aspect ratio before anything loads, so a missing or failed image degrades in place rather than resizing the frame around it. The right-hand frame points at a path that does not resolve: it shows the branded fallback at the same size, in the same position."
    >
      <GdsInline gap="lg" align="start">
        <MediaWithFallback alt="No source supplied — the branded fallback stands in at the reserved ratio." ratio={16 / 9} fallbackLabel="No image supplied" />
        <MediaWithFallback
          src="/general-design-system/deliberately-unresolvable.png"
          alt="A source that cannot resolve — the fallback replaces it without changing the reserved box."
          ratio={16 / 9}
          fallbackLabel="Image unavailable"
        />
      </GdsInline>
    </SectionPanel>
  );
}

// Single source for the bound: the control's `max` and the sentence beside it.
const LANE_PLACES = 8;

function NumberStepperDemo() {
  const [quantity, setQuantity] = useState(2);

  return (
    <SectionPanel
      title="Number stepper"
      description="A bounded quantity control with spinbutton semantics: it exposes its current, minimum and maximum values to assistive technology, clamps rather than accepting an out-of-range entry, and moves in whole steps from the keyboard. The increment and decrement controls carry their own accessible names instead of relying on the glyph."
    >
      <GdsInline gap="lg" align="center">
        <NumberStepper value={quantity} onChange={setQuantity} min={1} max={LANE_PLACES} ariaLabel="Lane places" />
        <InlineText>{`${quantity} of ${LANE_PLACES} places`}</InlineText>
      </GdsInline>
      <MetadataText>Bounds are enforced by the component: the controls disable at the ends rather than letting the value leave the range.</MetadataText>
    </SectionPanel>
  );
}

function AISearchCardDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <SectionPanel
      title="AI search card"
      description="The governed entry point into an assistant surface: a labelled search field, a BETA meaning badge that stays distinct from system status badges, and prompt chips that fill the query. Submitting hands the raw text to the caller — the card routes intent and owns none of the answering."
    >
      <AISearchCard
        onSubmit={setSubmitted}
        placeholder="Ask about clubs, lanes or timetables"
        prompts={['Beginner lanes near me', 'Weekend family sessions', 'Clubs with a warm pool']}
      />
      <MetadataText>{submitted ? `Last query handed to the caller: ${submitted}` : 'Submit a query or pick a prompt — the card reports the text and does nothing else with it.'}</MetadataText>
    </SectionPanel>
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
                  <SidebarNavItem action="dashboard" href="/general-design-system/live-proofs/surfaces" active />
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
      return <DestructiveActionDemo />;
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
          empty="No map source configured for this proof."
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
            primaryAction={<GdsInlineLink href="/general-design-system/patterns/public">Open</GdsInlineLink>}
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
            primaryAction={<GdsInlineLink href="/general-design-system/live-proofs/surfaces">Open</GdsInlineLink>}
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
          primaryAction={<GdsInlineLink href="/general-design-system/live-proofs/surfaces">Buy</GdsInlineLink>}
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
          <GdsStack gap="xs">
            <MetadataText>Fit score — a static measurement, role=&quot;meter&quot; not role=&quot;progressbar&quot;</MetadataText>
            <GdsMeter value={72} label="Fit score" />
          </GdsStack>
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
          primaryAction={<GdsInlineLink href="/general-design-system/patterns">Open</GdsInlineLink>}
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
          primaryAction={<GdsInlineLink href="/general-design-system/live-proofs/food">Reserve pickup</GdsInlineLink>}
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
                  primaryAction: <GdsInlineLink href="/general-design-system/live-proofs/surfaces">Reserve</GdsInlineLink>,
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
            mobileNavigation={<GdsInlineLink href="/general-design-system/patterns">Patterns</GdsInlineLink>}
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
          mediaPosition="left"
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
    case 'generated-imagery':
      return (
        <div>
          <GeneratedThumbnailDemo />
          <br />
          <GeneratedIdentityDemo />
          <br />
          <GeneratedHeroDemo />
          <br />
          <GeneratedImageryCardPlaceholderDemo />
        </div>
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
          {/* Preview uses the generated-imagery system: deterministic, zero-network, theme-following. */}
          <MediaField
            label="Hero image"
            description="Use the media-field contract for upload, URL entry, preview, status, and recovery."
            value="https://cdn.example.com/hero.jpg"
            preview={(
              <GdsGeneratedThumbnail
                seed="media-field-hero"
                categories={[{ key: 'hero', label: 'Hero image', icon: 'Gallery' }]}
              />
            )}
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
            preview={(
              <GdsGeneratedThumbnail
                seed="media-field-campaign-logo"
                categories={[{ key: 'logo', label: 'Campaign logo', icon: 'Gallery' }]}
              />
            )}
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
          breadcrumbs={[<GdsInlineLink href="/general-design-system/patterns" key="patterns">Patterns</GdsInlineLink>, <span key="operations">Operations</span>]}
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
            { id: '1', surface: 'ListingCard', state: 'Live proof' },
            { id: '2', surface: 'MapPanel', state: 'Live proof' },
          ]}
          columns={[
            { key: 'surface', label: 'Surface' },
            { key: 'state', label: 'State' },
          ]}
          activeFilters={[{ label: 'Live proof', onRemove: () => {} }]}
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
              {/*
                `progress` is computed from the fraction rather than written beside it. It read
                `value="18 / 20" progress={90}` — two copies of one fact, and the bar is what a
                sighted reader believes while the text is what a screen reader announces. The
                two must not be able to disagree.
              */}
              <ProgressCard
                label="Evidence coverage"
                value={`${EVIDENCE_SOURCES.covered} / ${EVIDENCE_SOURCES.total}`}
                progress={Math.round((EVIDENCE_SOURCES.covered / EVIDENCE_SOURCES.total) * 100)}
                progressLabel="Reporting sources"
              />
            </div>
          )}
          chart={(
            <ChartTokenPanel
              title="Orders by channel"
              description="Chart wrappers must provide text summaries, tokenized legends, and table fallback."
              /*
                The summary is the chart's TEXT EQUIVALENT — what a screen-reader user is given
                instead of the picture. It used to state 62/38 in prose while the table
                fallback stated 62/38 again in its own literals: one fact, three copies, and
                nothing to stop them drifting apart. A text equivalent that disagrees with the
                data is worse than none, because it is trusted.
                Both are now built from CHANNEL_SHARES.
              */
              summary={channelSummary()}
              state="permission-limited"
              legend={CHANNEL_SHARES.map((c) => ({ label: c.label, token: getGdsSeriesColor(c.token) }))}
              tableFallback={(
                <SimpleDataTable
                  columns={[{ key: 'channel', header: 'Channel' }, { key: 'share', header: 'Share' }]}
                  rows={CHANNEL_SHARES.map((c) => ({ channel: c.label, share: `${c.share}%` }))}
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
      return <LoadersSkeletonsDemo />;
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
          exitAction={<GdsInlineLink href="/general-design-system/patterns">Close</GdsInlineLink>}
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
      return <BadgeVocabularyDemo />;
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
    case 'bottom-tab-navigation':
      return <BottomTabNavigationDemo />;
    case 'maturity-capabilities':
      return <MaturityCapabilitiesDemo />;
    case 'pin-system':
      return <PinSystemDemo />;
    case 'motion-system':
      return <GdsMotionSystemReference />;
    case 'shape-elevation':
      return <GdsShapeElevationSystemReference />;
    case 'density-spacing':
      return <GdsDensitySpacingSystemReference />;
    case 'icon-system':
      return <GdsIconSystemReference />;
    case 'typography':
      return <GdsTypographySystemReference />;
    case 'gds-map':
      return <MapSurfaceDemo />;
    case 'accent-contrast-matrix':
      return <AccentContrastMatrixDemo />;
    case 'searchable-select':
      return <SearchableSelectDemo />;
    case 'conversation-surface':
      return <ConversationSurfaceDemo />;
    case 'media-with-fallback':
      return <MediaWithFallbackDemo />;
    case 'number-stepper':
      return <NumberStepperDemo />;
    case 'ai-search-card':
      return <AISearchCardDemo />;
    default:
      // verify:pattern-live-proof fails the build if a live-proof entry lands here.
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
    // id enables deep links: /patterns/<family>#entry-<id>.
    <SectionPanel id={`entry-${entry.id}`} title={entry.title} description={entry.summary}>
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
            { id: 'live', title: 'Live proofs', description: 'Documented patterns should be represented by shipped package surfaces or bounded examples.' },
            { id: 'traceable', title: 'Traceable to SSOT', description: 'Each entry keeps its section, family, route, and summary aligned with the canonical markdown inventory.' },
            { id: 'governed', title: 'No local authority', description: 'When the site needs a reusable surface, it belongs in GDS rather than in the app layer.' },
          ]}
        />
      </ReferenceSection>
      </div>
    </DocsPageShell>
  );
}

function sectionSlug(section: string) {
  return `section-${section.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
}

/**
 * Filter + jump-to-section + grouped-sections rendering for a set of registry entries.
 * Shared by PatternFamilyPage, ComponentsIndexPage, and SystemsPage.
 */
export function FamilyEntryBrowser({ entries }: { entries: PatternRegistryEntry[] }) {
  const [query, setQuery] = useState('');
  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      entry.title.toLowerCase().includes(needle)
      || entry.section.toLowerCase().includes(needle)
      || entry.summary.toLowerCase().includes(needle)
      || entry.sourceComponent?.toLowerCase().includes(needle));
  }, [entries, query]);
  const groupedEntries = groupEntries(entries);
  const groupedFilteredEntries = groupEntries(filteredEntries);

  return (
    <>
      <ReferenceSection
        title="Jump to section"
        description="Every section here, largest first — click through, or filter below to search across all of them."
      >
        <ReferenceLinkGrid
          columns={3}
          items={Object.entries(groupedEntries)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([section, sectionEntries]) => ({
              id: sectionSlug(section),
              title: section,
              description: `${sectionEntries.length} documented pattern${sectionEntries.length === 1 ? '' : 's'}.`,
              href: `#${sectionSlug(section)}`,
            }))}
        />
        <AdminTextInput
          name="pattern-family-filter"
          label="Filter"
          placeholder="e.g. button, motion, checkbox…"
          value={query}
          onChange={setQuery}
        />
        <BodyText>
          Showing {filteredEntries.length} of {entries.length}.
        </BodyText>
      </ReferenceSection>
      {Object.entries(groupedFilteredEntries).map(([section, sectionEntries]) => (
        <ReferenceSection
          key={section}
          id={sectionSlug(section)}
          title={section}
          description={`${sectionEntries.length} documented pattern${sectionEntries.length === 1 ? '' : 's'} in this section.`}
        >
          {sectionEntries.map((entry) => (
            <PatternEntryCard key={entry.id} entry={entry} />
          ))}
        </ReferenceSection>
      ))}
    </>
  );
}

export function PatternFamilyPage({ family }: { family: PatternFamily }) {
  const meta = familyMeta[family];
  const entries = getFamilyEntries(family);

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
        description="Use docs routes for policy and usage guidance, then validate behavior against live proofs where interaction/runtimes are relevant."
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
              description: 'Use live proof routes to verify runtime behavior, not just static documentation copy.',
              href: '/general-design-system/live-proofs',
            },
          ]}
        />
      </ReferenceSection>
      <FamilyEntryBrowser entries={entries} />
    </DocsPageShell>
  );
}
