import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { GdsButtonFeedbackReference } from './GdsButtonFeedbackReference';
import { GDS_BUTTON_FEEDBACK_DURATION_MS } from './SemanticButton';
import { GdsVocabulary } from './vocabulary';

function renderReference() {
  return render(<MantineProvider><GdsButtonFeedbackReference /></MantineProvider>);
}

describe('GdsButtonFeedbackReference', () => {
  it('swaps the label on click and reverts it after the governed duration', async () => {
    renderReference();
    const button = screen.getAllByRole('button')[0];
    const resting = button.textContent;

    fireEvent.click(button);
    expect(button.textContent).not.toBe(resting);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, GDS_BUTTON_FEEDBACK_DURATION_MS + 150));
    });
    expect(button.textContent).toBe(resting);
  });

  it('renders one live row per distinct feedback colour in the vocabulary', () => {
    renderReference();
    const distinctColors = new Set(
      Object.values(GdsVocabulary)
        .filter((config) => Boolean(config.feedback))
        .map((config) => config.feedback!.color),
    );
    // Two buttons per row (success + error), so the row count is derived rather than asserted
    // against a number that would go stale when the vocabulary gains a colour.
    expect(screen.getAllByRole('button')).toHaveLength(distinctColors.size * 2);
  });

  it('lists every vocabulary action that declares a feedback config', () => {
    renderReference();
    const withFeedback = Object.entries(GdsVocabulary).filter(([, config]) => Boolean(config.feedback));
    expect(withFeedback.length).toBeGreaterThan(0);
    for (const [action] of withFeedback) {
      expect(screen.getAllByText(action).length).toBeGreaterThan(0);
    }
  });
});
