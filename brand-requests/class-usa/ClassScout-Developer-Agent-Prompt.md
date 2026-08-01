# ClassScout Redesign — Master Prompt for the Developer Agent

> Paste everything below the line into your AI coding agent running **inside the `classscout` repo**. It is self-contained: exact paths, token values, fonts, logo assets, functions, and acceptance criteria. Deeper specs live in `docs/redesign/` and are referenced where useful.

---

You are implementing the ClassScout brand + UX redesign in this repository (Next.js App Router + Mantine 7 + GDS 2.6.4, MongoDB, local-AI lane). Work in small, verifiable commits, one workstream at a time, and run `npm run lint && npm test && npm run build` before declaring a step done.

## 0. Source-of-truth rules (do not violate)
- **Design (color, typography, spacing, component styling)** comes ONLY from the brand design system. The authoritative spec is `docs/redesign/ClassScout-Design-Tokens-and-Components.md`. The current live theme (teal / Poppins / charcoal) is WRONG and must be replaced.
- **Functions, layout/IA, and content/copy** come from the partner reference app and the spec docs — see `docs/redesign/ClassScout-Lovable-Reconciliation.md`. Do NOT copy the partner app's colors or fonts.
- **Logo** = the official pack already in `public/images/brand/` (do not redraw or recolor it).
- Full rule set: `docs/redesign/ClassScout-UIUX-SSOT.md`. Component anatomy: `ClassScout-Design-Tokens-and-Components.md`. GDS gaps: `ClassScout-GDS-Implementability.md`.

## 1. Brand tokens (replace the stale palette)
Edit `src/app/globals.css` `:root` and `src/theme/mantineTheme.ts`. Replace the current teal/charcoal/ivory values with these exact brand tokens (hex + HSL for the HSL-based vars):

| Token | Hex | HSL | Role |
|---|---|---|---|
| navy | `#0b223e` | `213 70% 14%` | text, headings, sidebar, **primary buttons** (`--foreground`, `--primary`) |
| terracotta | `#ca8570` | `14 46% 62%` | **accent**, selected, price+star, Featured badges (`--accent`) |
| sage | `#90a287` | `100 13% 58%` | trust/validation, Recommended, neighborhood-selected |
| cream/ivory | `#faf7f1` | `40 41% 96%` | page background (`--background`) |
| white | `#ffffff` | `0 0% 100%` | cards only (`--card`) |
| slate | `#434c59` | `215 14% 31%` | metadata, descriptions (`--muted-foreground`) |
| navy-pressed | `#07182c` | `213 73% 10%` | primary button pressed |
| tag-neutral | `#f1ece4` | `37 32% 92%` | neutral info tags (`--secondary`) |
| terracotta-tint | `#f5ddd5` | `15 55% 90%` | urgency badge / calculator total bg |
| border-card | `#eee7dd` | `38 38% 90%` | card border (`--border`, `--input`) |

Rules: page bg = cream; cards = white; **never navy as a full-page background**. Remove every `teal`/`orange`/`grape` brand usage. If GDS's `createPublicBrandTheme` can't express this palette, override Mantine theme colors at app level and record the limitation in `docs/redesign/ClassScout-GDS-Implementability.md`.
Buttons (semantic): **Primary = navy** fill / white text (View details, Book now, Save provider). **Accent = terracotta**, used sparingly (Add to Calculator, Tickets). **Secondary = white + hairline border / navy text** (Share, Clear, Back). Disabled = muted grey — never navy/terracotta.

## 2. Fonts (interim free lookalikes; auto-swap later)
In `src/app/layout.tsx` remove the `Inter`/`Poppins` `next/font/google` imports and `--font-inter`/`--font-poppins` vars. Add:
```ts
import { Fraunces, Outfit } from "next/font/google";
const display = Fraunces({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-display", display: "swap" });
const body = Outfit({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-body", display: "swap" });
// add `${display.variable} ${body.variable}` to <html className>
```
In `globals.css`/theme set the stacks so the licensed faces win automatically once added:
`--font-display: "Bogart","Fraunces",Georgia,serif;` and `--font-body: "Garet","Outfit",ui-sans-serif,system-ui,sans-serif;`
Mantine: `theme.fontFamily = "var(--font-body)"`, `theme.headings.fontFamily = "var(--font-display)"`. Use the display face for hero/marketing headings only; in-app section titles and provider-card names use the **body face, semibold**. (Fraunces ≈ Bogart, Outfit ≈ Garet; both free/OFL. To switch to licensed fonts later, drop the files in `public/fonts/`, add an `@font-face`, and they take over via the stack — no other change.)

## 3. Logo (use the official pack)
Assets in `public/images/brand/`: `logo-pin.png` (primary mark), `logo-pin-filled.png`, `mark-face-sage.png`, `mark-face-navy.png`, `wordmark.png`, `appicon-navy.png`, `appicon-sage.png`, `appicon-terracotta.png`, source `ClassScout-logo-source.ai`.
- `src/components/scout/Logo.tsx`: use `logo-pin.png` as the mark (~36px in header); replace the wordmark color `c="teal.6"` with terracotta or render `wordmark.png`; keep `withWordmark`/`size` props; mark must sit in a contrasting badge.
- `src/app/layout.tsx` metadata: point `icon`/`shortcut`/`apple` to `appicon-navy.png` (generate a 32px favicon from it); set OG image to a logo lockup.
- Stop referencing `public/images/class_scout_*.png`.

## 4. Navigation — mobile bottom tab bar + new destinations
- `src/components/scout/Sidebar.tsx`: add `Family Events` and `Scout AI Assistant` to `ITEMS` (Discover group) with icons + routes; active = terracotta pill / white text on navy sidebar.
- New `src/components/scout/BottomTabBar.tsx` (app-level — GDS lacks it): shown `< lg` only, white bg, hairline top border, safe-area aware, 5 tabs **Home · Discover · Scout AI · Saved · Account**; active icon+label terracotta, inactive slate; Scout AI is the emphasized center; "Discover" opens a category-switcher sheet. No dark-navy bottom nav.
- Render it in `src/components/scout/ClassScoutShell.tsx` with bottom padding so content clears it; keep the GDS sidebar for `≥ lg`.

## 5. Provider card — Fit Score, "Why this fits", actions, fallback
Edit `src/components/scout/ProviderCard.tsx` (spec: tokens doc §6/§6c):
- Stop `return null` on image failure → render a **branded fallback** (category illustration on cream) and keep the card; visible count must equal result count.
- Price (`$/class`) and rating star → **terracotta**; provider name → navy (body font, semibold); location → slate.
- Badges by meaning: Featured/Staff Pick = terracotta; Recommended/Parent Pick = sage; neutral tags (Ages, Weekend) = `#f1ece4`; urgency = light terracotta tint.
- Add `variant="ai"`: **Fit Score chip** + **"Why this fits"** line (2–4 reasons) + four actions **Save · View Details · Contact · Visit Website**.
- New `FitScoreChip` component (sage→terracotta scale) fed by match scores from `src/lib/providerQuery.ts` / the data model.

## 6. Scout AI (the centerpiece)
Behavior/contract: `ClassScout-Lovable-Reconciliation.md` §5; design: tokens doc §6/§11. **Backend = the app's own local-AI lane in `src/lib/localAi` (ClassScout Lite)** — do NOT use Supabase/Lovable. Add `src/app/api/scout-ai/route.ts` that takes `{messages, providers}` and streams a completion from `src/lib/localAi`.
1. **Homepage AI search** (`src/components/scout/views/HomeView.tsx`): a "Scout AI" card with a **BETA** tag, placeholder "What are you looking for today?", quick-prompt chips (Weekend activities · Classes near me · Birthday party ideas · Summer camps · Drop-in activities). On submit, route to the assistant with the query preloaded.
2. **Assistant page**: add route `src/app/scout-ai/page.tsx` + view `src/components/scout/views/ScoutAssistantView.tsx`. Title + intro, 4 suggested prompts (2×2), chat transcript (user bubble navy/right, AI bubble white/left), bottom input (Enter sends, Shift+Enter newline). Register the route in `src/lib/scoutRoutes.ts` and the shell switch in `ClassScoutShell.tsx`.
3. **Response contract:** the model receives a JSON list of REAL providers and may recommend ONLY by exact `id` (never invent). It writes a 1–2 sentence intro, then on its OWN line emits `[[PROVIDERS: id1, id2, id3]]` (1–5 ids); the UI parses that marker and renders `ProviderCard variant="ai"` cards (Fit Score + "Why this fits"), NOT a text list. Fallback if nothing fits: suggest nearby neighborhoods/relaxed filters, still grounded in real ids. Offer next-step chips: "Show more", "Compare in calculator", "Switch borough". Tone warm/concise; one clarifying question only when needed; always note schedule/price/availability should be confirmed with the provider. Handle rate-limit/credit/errors gracefully.
4. **Provider profile Scout AI Summary** (`src/components/scout/panels/ProviderProfile.tsx`): a "Scout AI Summary" section grounded ONLY in that provider's profile data + quick-question buttons (beginners? / suitable for my child's age? / what makes this different? / find similar nearby) + an "Ask about this provider…" input. Never invents; missing data → confirm-with-provider.

## 7. Family Events + ticketing
Spec: tokens doc §6b. Add `Family Events` as a discover category (extend `Category` in `src/types/provider.ts` and the discover plumbing in `src/lib/scoutRoutes.ts`, `Sidebar.tsx`, `ClassScoutShell.tsx`; note `ProgramType` already includes "Family Events"). Add route `src/app/family-events/page.tsx`.
- New `src/components/scout/EventCard.tsx`: same shell as ProviderCard + date/time meta + top-left category badge (Free / Weekend / Toddler-friendly) + primary **"Tickets"** (accent terracotta) + secondary "View details" + share.
- New `src/components/scout/views/EventCheckoutView.tsx`: in-app checkout, **no real payment in MVP**, reachable from EventCard "Tickets" and the event profile. Filter row: borough → neighborhood → price (All/Free/Paid) → age → event type.

## 8. Filters sheet, states, trust/content
- `src/components/scout/Filters.tsx` + `src/components/scout/views/DiscoverView.tsx`: on mobile present filters in a **bottom sheet** (drag handle, scrollable, pinned "Apply (N)" + "Clear"); active filters as a horizontally scrollable removable-chip row under the results header. Borough selected = navy, neighborhood selected = sage, filter chips selected = terracotta.
- Remove `return null` on load/error in `HomeView.tsx`, `CalculatorView.tsx`, `MyAccountView.tsx` → render skeletons while loading and a `StateBlock` error with retry on failure (home included). Empty states: what happened + why + next action; no "Open admin".
- Trust/content: remove the "Staff admin" link from the public footer (`ClassScoutShell.tsx`) and the "Open admin" CTA from public empty states (`DiscoverView.tsx`). Show **"est."** at every price at point of display (not only footer). Show ratings only when real. Newsletter: real endpoint or "coming soon"; give the email field a visible label.

## 9. Verification (must pass before handoff)
- `npm run lint && npm test && npm run build` green.
- `grep -ri "teal\|poppins\|inter(" src` and `grep -ri "class_scout_notext" src public` return nothing meaningful.
- Screenshot Home, a Discover category, Scout AI, a Provider profile, Family Events, Calculator at **390px and 1440px** and confirm: navy primary CTAs, terracotta accents/price/star, white bottom tab bar on mobile, no blank states, Fit Score + "Why this fits" on AI cards, new pin logo in header + favicon, Fraunces headings + Outfit body.
- Re-read `ClassScout-Design-Tokens-and-Components.md` and spot-check each rule.

## Order
1 (theme) → 2 (fonts) → 3 (logo) → 4 (nav) → 5 (card) → 6 (Scout AI) → 7 (Family Events) → 8 (states/filters) → 9 (verify). Steps 1–5 and 8 can largely run in parallel with 6–7. Commit per step with a clear message.
