'use client';

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Box, Button, TextInput } from '@mantine/core';
import { useGdsTranslation, GDS_MIN_TARGET_PX } from '@sovereignsquad/gds-theme';
import { FormField } from './FormField';
import { SemanticButton } from './SemanticButton';
import { GdsIcons } from './icons';
import { createGdsVocabularyPack } from './vocabulary';
import type { GdsVocabularyPack } from './vocabulary';
import { GdsStack, GdsInline } from './LayoutPrimitives';
import { MetadataText } from './Typography';

/**
 * HeroSearchPanel (issue 710).
 *
 * Homepage intent-capture surface: a card-shaped `<form role="search">` with a
 * consumer-defined, flex-wrapping row of labeled text fields, a primary + optional
 * secondary CTA, and an optional trust-line slot. Field configuration and all
 * visible copy are consumer-supplied; the component owns only structure, tokens,
 * and value-collection behaviour.
 */

/** Flex basis of one intent field in the panel's wrapping row. */
export const GDS_HERO_SEARCH_FIELD_FLEX_BASIS_PX = 120;
/** Minimum width one intent field may shrink to before the row wraps. */
export const GDS_HERO_SEARCH_FIELD_MIN_WIDTH_PX = 110;

/** One text field in a HeroSearchPanel. All copy is consumer-supplied. */
export interface HeroSearchFieldConfig {
  /** Stable key; becomes the property name in the submitted values record. Must be unique. */
  key: string;
  /** Visible field label. */
  label: string;
  /** Optional input placeholder. */
  placeholder?: string;
}

/** Props for {@link HeroSearchPanel}. */
export interface HeroSearchPanelProps {
  /** Field row definition. Required; the component ships no default field set. */
  fields: HeroSearchFieldConfig[];
  /** Controlled values. When set, the component is fully controlled via onChange. */
  values?: Record<string, string>;
  /** Initial values for uncontrolled mode. */
  defaultValues?: Record<string, string>;
  /** Fires with the full values record on every edit. */
  onChange?: (values: Record<string, string>) => void;
  /** Fires with the current values record on primary CTA click or form submit. */
  onSubmit: (values: Record<string, string>) => void;
  /** Overrides the primary CTA label; default is the governed `search` vocabulary action. */
  primaryActionLabel?: string;
  /** Secondary CTA label; the secondary button renders only when this is provided. */
  secondaryActionLabel?: string;
  /** Secondary CTA handler. */
  onSecondaryAction?: () => void;
  /** Governed trust-line slot rendered below the CTA row in metadata typography. Omitted = not rendered. */
  trustLine?: ReactNode;
  /** Accessible name for the search region; defaults to a governed localized string. */
  ariaLabel?: string;
  /** Disables all fields and CTAs. */
  disabled?: boolean;
}

/**
 * Deduplicates `fields` by `key`: duplicate keys are a consumer error, resolved
 * (not thrown) so the last definition's label/placeholder wins for rendering while
 * a `Map` keyed re-set keeps the row at its first-seen position — one value slot
 * backs every key that collides.
 */
function dedupeHeroSearchFields(fields: HeroSearchFieldConfig[]): HeroSearchFieldConfig[] {
  const byKey = new Map<string, HeroSearchFieldConfig>();
  for (const field of fields) {
    byKey.set(field.key, field);
  }
  return Array.from(byKey.values());
}

const panelSurfaceStyle = {
  background: 'var(--gds-bg-card, var(--gds-vibe-surface, var(--mantine-color-body)))',
  border: '1px solid var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-default-border)))',
  borderRadius: 'var(--gds-radius-card)',
  boxShadow: 'var(--gds-elevation-card)',
  padding: 'var(--mantine-spacing-md)',
};

const fieldInputStyles = {
  input: {
    borderRadius: 'var(--gds-radius-input)',
    minHeight: `${GDS_MIN_TARGET_PX}px`,
    borderColor: 'var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-default-border)))',
  },
};

/**
 * Governed homepage intent-capture surface: a card-shaped `<form role="search">` with a
 * consumer-defined, flex-wrapping row of labeled text fields, a primary + optional
 * secondary CTA, and an optional trust-line slot. Values are collected in controlled
 * (`values`/`onChange`) or uncontrolled (`defaultValues`) mode and handed to `onSubmit`
 * verbatim — no trimming, coercion, validation, or navigation happens inside the
 * component. It renders no fetched data, so the loading/empty/error/success states
 * contract does not apply internally; express post-submit lifecycle with
 * `AsyncSurface`/`StateBlock` in the consuming page instead.
 */
export function HeroSearchPanel({
  fields,
  values,
  defaultValues,
  onChange,
  onSubmit,
  primaryActionLabel,
  secondaryActionLabel,
  onSecondaryAction,
  trustLine,
  ariaLabel: ariaLabelProp,
  disabled = false,
}: HeroSearchPanelProps) {
  const { t } = useGdsTranslation();
  const ariaLabel = ariaLabelProp ?? t('gds.heroSearchPanel.ariaLabel', "Search");

  const controlled = values !== undefined;
  const [internalValues, setInternalValues] = useState<Record<string, string>>(defaultValues ?? {});
  const currentValues = controlled ? (values as Record<string, string>) : internalValues;

  const edit = (key: string, value: string) => {
    const next = { ...currentValues, [key]: value };
    if (!controlled) {
      setInternalValues(next);
    }
    onChange?.(next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    onSubmit(currentValues);
  };

  const renderedFields = dedupeHeroSearchFields(fields);
  const showSecondaryAction = Boolean(secondaryActionLabel && onSecondaryAction);
  const primaryVocabularyPacks: GdsVocabularyPack[] | undefined = primaryActionLabel
    ? [createGdsVocabularyPack('heroSearchPanel', { primary: { defaultMessage: primaryActionLabel, icon: GdsIcons.Search } })]
    : undefined;

  return (
    <form role="search" aria-label={ariaLabel} onSubmit={submit} style={panelSurfaceStyle}>
      <GdsStack gap="sm">
        {renderedFields.length > 0 ? (
          <GdsInline gap="sm" wrap="wrap" align="start">
            {renderedFields.map((field) => (
              <Box
                key={field.key}
                style={{
                  flex: `1 1 ${GDS_HERO_SEARCH_FIELD_FLEX_BASIS_PX}px`,
                  minWidth: `${GDS_HERO_SEARCH_FIELD_MIN_WIDTH_PX}px`,
                  overflowWrap: 'anywhere',
                }}
              >
                <FormField label={field.label}>
                  <TextInput
                    value={currentValues[field.key] ?? ''}
                    onChange={(event) => edit(field.key, event.currentTarget.value)}
                    placeholder={field.placeholder}
                    disabled={disabled}
                    styles={fieldInputStyles}
                  />
                </FormField>
              </Box>
            ))}
          </GdsInline>
        ) : null}

        <GdsInline gap="sm" wrap="wrap">
          <SemanticButton
            action={primaryActionLabel ? 'heroSearchPanel:primary' : 'search'}
            type="submit"
            disabled={disabled}
            vocabularyPacks={primaryVocabularyPacks}
          />
          {showSecondaryAction ? (
            <Button type="button" variant="default" disabled={disabled} onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
        </GdsInline>

        {trustLine ? <MetadataText>{trustLine}</MetadataText> : null}
      </GdsStack>
    </form>
  );
}
