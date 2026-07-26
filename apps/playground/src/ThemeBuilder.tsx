import { useMemo, useState } from 'react';
import { BodyText, MeaningBadge, ReferenceSection, SemanticButton } from '@sovereignsquad/gds-core';
import { AdminTextInput } from '@sovereignsquad/gds-admin';
import { createBrandTheme, GdsBrandThemeError } from '@sovereignsquad/gds-theme';

// Browser theme builder (issue 453): input five brand ramps and the governed
// `createBrandTheme(...)` generator returns a validated GDS token file (the
// `--gds-*` CSS-variable map) plus the same WCAG-AA contrast validation GDS uses
// in CI. This turns the package generator into a self-serve tool — a consumer
// pastes their brand hex, sees the readable-pair contrast validated, and copies a
// ready `:root {…}` block instead of hand-authoring tokens or guessing at
// contrast. Rendered from `TokensPage` on the `/themes` route. No inline styles /
// raw values: the tool is GDS-only consumer code, so it composes shipped
// primitives and emits the token file as text rather than styling with it.

type BrandKey = 'navy' | 'terracotta' | 'sage' | 'cream' | 'slate';

const BRAND_FIELDS: { key: BrandKey; label: string; hint: string }[] = [
  { key: 'navy', label: 'Primary (navy)', hint: 'brand.primary / bg.inverse' },
  { key: 'terracotta', label: 'Accent (terracotta)', hint: 'brand.accent / price' },
  { key: 'sage', label: 'Support (sage)', hint: 'state.success' },
  { key: 'cream', label: 'Page (cream)', hint: 'bg.page' },
  { key: 'slate', label: 'Secondary text (slate)', hint: 'text.secondary' },
];

const EMPTY_COLORS: Record<BrandKey, string> = {
  navy: '',
  terracotta: '',
  sage: '',
  cream: '',
  slate: '',
};

function toCssFile(cssVariables: Record<string, string>): string {
  const lightEntries = Object.entries(cssVariables).filter(([property]) => !property.endsWith('-dark'));
  return `:root {\n${lightEntries.map(([property, value]) => `  ${property}: ${value};`).join('\n')}\n}`;
}

export function ThemeBuilder() {
  const [colors, setColors] = useState<Record<BrandKey, string>>(EMPTY_COLORS);
  const [copied, setCopied] = useState(false);

  const allEmpty = BRAND_FIELDS.every((field) => colors[field.key].trim() === '');

  const result = useMemo(() => {
    try {
      const { cssVariables } = createBrandTheme({
        brandColors: colors,
        fonts: { display: 'Inter', body: 'Inter' },
      });
      return { ok: true as const, css: toCssFile(cssVariables) };
    } catch (error) {
      if (error instanceof GdsBrandThemeError) {
        return { ok: false as const, findings: error.findings.map((finding) => finding.message) };
      }
      return { ok: false as const, findings: [error instanceof Error ? error.message : String(error)] };
    }
  }, [colors]);

  const setColor = (key: BrandKey) => (value: string) => {
    setColors((current) => ({ ...current, [key]: value }));
    setCopied(false);
  };

  const copyCss = () => {
    if (result.ok && typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(result.css);
      setCopied(true);
    }
  };

  return (
    <ReferenceSection
      title="Theme builder"
      description="Paste your five brand colors and generate a validated GDS token file. The governed createBrandTheme(...) generator runs the same WCAG-AA contrast checks GDS uses in CI, then emits the --gds-* CSS variables you drop into your app's :root once, at the document root."
    >
      {BRAND_FIELDS.map((field) => (
        <AdminTextInput
          key={field.key}
          name={field.key}
          label={`${field.label} — ${field.hint}`}
          placeholder="Paste a 3- or 6-digit hex color"
          size="sm"
          value={colors[field.key]}
          onChange={setColor(field.key)}
        />
      ))}

      <br />

      {allEmpty ? (
        <BodyText>Enter your five brand colors above to generate a validated GDS token file.</BodyText>
      ) : result.ok ? (
        <>
          <MeaningBadge variant="validation" label="Valid — WCAG AA contrast passed" />
          <BodyText>Generated GDS token file:</BodyText>
          <pre aria-label="Generated GDS token file">
            <code>{result.css}</code>
          </pre>
          <SemanticButton action="copy" brandVariant="secondary" size="sm" onClick={copyCss} />
          {copied ? <BodyText>Copied to clipboard.</BodyText> : null}
        </>
      ) : (
        <>
          <MeaningBadge variant="attention" label="Invalid brand input" />
          {result.findings.map((message, index) => (
            <BodyText key={index}>{message}</BodyText>
          ))}
        </>
      )}
    </ReferenceSection>
  );
}
