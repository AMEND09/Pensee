# Pensée — Recommended Changes & Feature Roadmap

-----

## 1. Remove Duplicate “Tap Start” Message

**Change**
Eliminate the redundant call-to-action in the writing view.

**Detailed Description**
The writing screen currently shows “Tap Start to begin your session…” as placeholder text inside the editor *and* as a floating button in the middle of the page. This creates visual confusion and makes the interface feel unpolished before the session has even begun.

**How It Works**
Remove the floating mid-screen button entirely. Keep only the “Start” button in the top-left corner of the toolbar. The editor placeholder text can remain as a subtle cue but should be lighter in weight so it reads as a ghost prompt rather than an instruction.

**How It Helps**
Reduces cognitive noise at the most critical moment — just before the user begins writing. A cluttered pre-session screen raises the psychological barrier to starting. One clear action, one clear invitation.

**User Flow**
User taps “Begin Today’s Challenge” → writing screen loads → single “Start” button visible in toolbar → user taps Start → timer begins → placeholder disappears → user writes.

**UI Description**
Top toolbar: Start button (terracotta, left-aligned), timer centered, dictionary and close icons right-aligned. Editor below: single line of ghost text in light warm gray, immediately disappearing on first keystroke. No floating elements in the body of the editor.

**UX Description**
The writing screen should feel like opening a blank notebook — quiet, expectant, uncluttered. Every element on screen that isn’t the page itself is a distraction. The friction of starting should come from the writing, not the interface.

-----

## 2. Reconsider the Shuffle Button

**Change**
Remove or reframe the “shuffle” button on the home screen prompt card.

**Detailed Description**
The shuffle button allows users to swap out today’s quote prompt before beginning. While well-intentioned, it undermines one of the app’s core propositions — that today’s prompt is meaningful, curated, and shared. If the prompt can be reshuffled arbitrarily, it feels random rather than intentional.

**How It Works**
Option A (recommended): Remove shuffle entirely. The daily prompt is the daily prompt — fixed, universal, deliberate. Option B: Rename and reframe it as “Try a Different Prompt Type” — allowing users to switch between a quote prompt, a question prompt, or a concept prompt while keeping the day’s theme intact. This preserves agency without undermining curation.

**How It Helps**
Strengthens the sense that Pensée is curated and considered rather than randomly generated. Users who know the prompt is fixed are more likely to commit to it rather than hunting for an easier one. Resistance to the prompt is often where the best writing begins.

**User Flow**
Option B flow: User views quote prompt → taps “Try a Different Type” → slides between Quote / Question / Concept variants of the same day’s theme → selects one → taps Begin.

**UI Description**
Option B: Replace “shuffle” pill with a subtle segmented control or swipeable card showing prompt type variants. Keep the terracotta accent for the active selection. Animation should be a gentle horizontal slide, not a jarring refresh.

**UX Description**
The home screen should feel like receiving a letter, not spinning a wheel. If users can change the prompt, the act of changing it should feel considered — like choosing which angle to approach a subject from — rather than random.

-----

## 3. Home Screen Emotional Primer

**Change**
Use the dead whitespace between the techniques card and the CTA button to surface something emotionally engaging.

**Detailed Description**
Currently there is significant empty space between “Today’s Techniques” and “Begin Today’s Challenge.” This real estate is an opportunity to prime the user emotionally and socially before they begin — to make them feel like they’re stepping into something, not just opening an app.

**How It Works**
Rotate between two content types in this space: (1) A one-line excerpt from the user’s own past writing — pulled from a previous session — displayed in italic with the date it was written. (2) A quiet social signal: “X people have written today” in small, understated type. Neither should feel like a notification or a push. They should feel like ambient warmth.

**How It Helps**
Seeing your own past writing before a new session creates continuity — you feel like a writer with a history, not someone starting from zero each day. Social presence, even minimal, creates accountability without pressure.

**User Flow**
User opens app → sees today’s prompt and techniques → in the space below, sees a line from a past session in italics → feels a quiet sense of momentum → taps Begin.

**UI Description**
A minimal text block between the techniques card and the CTA. Italic serif typeface, warm gray color — lighter than body text. No card, no border, no icon. Just the text and a small date label below it. On first use (no history), show a short orienting line like “Your writing will live here.”

**UX Description**
This element should feel discovered rather than designed — like a margin note, not a feature. It should never feel like a nudge or a metric. Its job is to make the user feel that something has already begun.

-----

## 4. Restructured Post-Session Reflection

**Change**
Replace the five open-ended text fields with a structured, low-friction reflection system that generates useful data.

**Detailed Description**
The current reflection screen asks users to type answers to five separate prompts after they’ve just spent 10 minutes writing. Most users will skip it. The restructured version collects more useful, structured data in under 30 seconds using taps rather than typing — while preserving one optional open field for users who want to say more.

**How It Works**
Three sections replace the current layout:

*Section 1 — Device ratings.* For each of today’s techniques, two tappable chips: “felt natural” and “felt forced.” One tap per device. This data feeds directly into spaced repetition logic — forced devices return sooner, natural ones graduate to longer intervals.

*Section 2 — Session feel.* A single five-point horizontal scale from “struggled to start” to “couldn’t stop.” One tap. This captures session quality over time and reveals patterns (e.g., the user always flows better on question prompts than quote prompts).

*Section 3 — Optional text.* One open field: “Anything worth holding onto from today?” No category label. Users who want to write will. Users who don’t have already given you everything you need.

**How It Helps**
Generates structured, queryable data per session rather than unstructured text. Enables spaced repetition. Reduces post-session friction dramatically, improving completion rate. Creates the foundation for showing users their own growth over time.

**User Flow**
Timer ends → reflection sheet slides up automatically → user rates each device (3 taps) → taps session feel (1 tap) → optionally writes a note → taps “Save Reflection” → brief celebratory moment → home screen.

**UI Description**
Device rating chips: pill-shaped, same style as technique chips on home screen. “Felt natural” in warm green-tinted cream, “felt forced” in muted gray. Selected state uses a subtle filled background. Session feel: five small circles on a horizontal line, labeled only at the ends. Optional text field: same styling as current fields, but presented as a single open prompt in lighter placeholder text.

**UX Description**
The reflection should feel like a brief exhale after the effort of writing — not another task. The tappable structure respects that the user has already given their creative energy. Speed and ease here directly determine whether this feature gets used at all.

-----

## 5. Device Coverage Tracker in Progress Screen

**Change**
Add a device mastery arc to the existing progress statistics view.

**Detailed Description**
The current progress screen shows streak, sessions completed, average word count, and total words written. These are quantity metrics. Missing entirely are quality and coverage metrics — the user has no sense of how many devices they’ve encountered, which ones they’ve mastered, or how far along their learning arc they are.

**How It Works**
Add a “Devices Practiced” section below the existing stats grid. Show a count like “12 of 40 devices practiced” with a small circular progress ring in terracotta. Below it, show the three most recently practiced devices with their mastery status — a warm green dot for “natural,” a muted dot for “still developing.” Tapping this section expands to a full device library showing all devices color-coded by mastery status.

**How It Helps**
Makes the learning arc visible and tangible. A user who can see they’ve mastered 12 of 40 devices feels progress. A user who sees litotes has been “forced” three sessions in a row understands why it keeps coming back. Visibility of growth is one of the most powerful retention mechanisms available.

**User Flow**
User taps history/progress icon → sees existing stats → scrolls down to device coverage ring → taps ring → full device library opens → devices shown as grid of chips, color-coded by mastery — untouched (gray), developing (warm amber), natural (green).

**UI Description**
Progress ring: thin circle, terracotta fill, cream background, percentage or fraction label centered. Device grid: same chip style as home screen, color-coded. Three status states use color only — no icons, no text labels on the chips themselves. A small legend at the top of the grid explains the three colors.

**UX Description**
The device library view should feel like looking at a map of territory you’ve explored — some areas familiar, some still blank. The gamification here is implicit rather than explicit: there are no points, no badges, just the visible shape of what you know and what you don’t yet.

-----

## 6. Literary Examples in Device Modals

**Change**
Add a third example to each rhetorical device modal drawn from a recognizable published work.

**Detailed Description**
The current device modal shows a definition and two generic example sentences. These are functional but flat — they demonstrate the device without showing it doing real emotional or rhetorical work. A third example from a specific author in a specific context elevates this from vocabulary lesson to craft apprenticeship.

**How It Works**
Each device modal gains a third example card, visually distinguished from the first two — perhaps with a slightly different background or a thin author attribution line. The example is drawn from a public domain or widely known text (Hemingway, Baldwin, Woolf, Seneca, Didion, Lincoln, etc.) and accompanied by one sentence explaining *why* the device works in that specific moment — not just *what* it is.

**How It Helps**
Contextualizes the device as a choice a real writer made for a specific effect. This is the difference between knowing that anaphora means repetition and understanding why Baldwin used it to build emotional weight in a specific passage. The latter is what produces internalized craft rather than applied vocabulary.

**User Flow**
User taps a device chip on home screen → modal appears → reads definition → reads two short generic examples → scrolls to third example → sees attributed literary sentence → reads one-line craft note explaining the effect → taps Done → begins session with richer understanding.

**UI Description**
Third example card: same pill-border style as existing examples but with a slightly warmer cream background. Author attribution in small caps below the passage, in the same muted terracotta used for labels throughout the app. Craft note in regular weight below attribution, separated by a hairline rule.

**UX Description**
The literary example should feel like a gift — something extra for the curious user who scrolls. It should never feel like homework. The craft note is one sentence maximum. If it requires two sentences, it’s too long.

-----

## 7. History View — Filter by Technique

**Change**
Add a technique filter to the Past Sessions history view.

**Detailed Description**
The history view currently shows a chronological timeline of sessions searchable by prompt, technique, or date. But there is no way to filter the entire list to show only sessions where a specific device was practiced. A user who wants to review how their relationship with litotes has evolved over time has no efficient way to do so.

**How It Works**
A horizontal scrollable row of technique chips appears below the search bar. Tapping a chip filters the timeline to show only sessions that included that device. Multiple chips can be selected simultaneously. Active chips use the filled terracotta state. Tapping again deselects. A “Clear” affordance appears when any filter is active.

**How It Helps**
Enables users to trace their own development with a specific device — seeing the first clumsy attempt, then gradual ease, then mastery. This is a powerful metacognitive tool and directly supports the spaced repetition learning model. It also makes the history view useful rather than merely archival.

**User Flow**
User opens history → taps filter chip for “anaphora” → timeline collapses to show only anaphora sessions → user taps a session from six weeks ago → reads their early attempt → taps most recent session → reads current attempt → feels the improvement.

**UI Description**
Filter chip row: same chip style as home screen technique chips, horizontally scrollable with fade-out on the right edge indicating more content. Active state: filled terracotta background, white text. Inactive state: cream background, dark text, hairline border. “Clear filters” in small terracotta text appears at the end of the row when active.

**UX Description**
The filter should feel like a lens rather than a search tool — it doesn’t find something specific, it changes how you see everything. The transition from full timeline to filtered timeline should be a smooth fade, not a hard cut.

-----

## 8. Session Intention Setter

**Change**
Add an optional single-tap intention prompt before each session begins.

**Detailed Description**
Research on deliberate practice shows that setting a specific goal before practice — even a micro-goal — produces meaningfully better outcomes than undirected practice. Currently the user reads today’s prompt and techniques, then taps Begin. There is no moment of intentional focus before the timer starts.

**How It Works**
After tapping “Begin Today’s Challenge” but before the writing screen loads, a brief interstitial appears — one question, four tappable options, skippable in one tap. “What do you want to try today?” Options: “Use a device more naturally” / “Write without stopping” / “Try a different kind of opening” / “Follow wherever it leads.” The selected intention is stored with the session and surfaced again in the reflection: “You set out to [intention] — how did that go?”

**How It Helps**
Creates a goal → practice → reflect loop per session, which is the mechanism behind the most evidence-backed writing instruction methods. Even a small, self-chosen goal shifts the session from passive freewriting to deliberate practice. Closing the loop in the reflection reinforces the habit.

**User Flow**
User taps Begin → interstitial appears with intention options → user taps one or taps Skip → writing screen loads → session runs → timer ends → reflection screen surfaces the chosen intention → user rates how it went.

**UI Description**
Interstitial: bottom sheet modal, same style as existing modals. Question in medium-weight serif at top. Four chips below in a 2×2 grid. “Skip for now” in small muted text below the grid. The selected chip fills with a light terracotta tint. No confirm button — selection immediately advances to the writing screen after a 300ms pause.

**UX Description**
This screen should take under five seconds to move through. It is not a form — it is a moment of orientation. The design should communicate that this is lightweight and optional without making it feel skippable by default. Placing “Skip for now” below the grid rather than at the top nudges users toward engaging without forcing them.

-----

## 9. Weekly Reading Room

**Change**
Add a curated weekly passage feature to the home screen, accessible without a tab bar.

**Detailed Description**
A weekly literary passage, hand-annotated to show rhetorical devices at work in a master’s hands, surfaces as a card on the home screen below the techniques card. Tapping it opens a full-screen reading experience where the passage is presented sentence by sentence with annotations inline — similar to how Genius layers meaning onto lyrics, but focused entirely on craft rather than content.

**How It Works**
A “This Week’s Passage” card sits below the techniques card on the home screen. It shows the first line of the passage and the author name. Tapping opens a full-screen modal. Inside, the passage is broken into sentence or paragraph cards in a vertical scroll. Each device moment is highlighted; tapping a highlight reveals a short annotation explaining what device is operating and why it works in that specific context. The passage is sourced from public domain texts (via the Gutenberg API) and annotated by hand.

**How It Helps**
Reading and writing are mutually reinforcing — research consistently shows that close reading of excellent prose accelerates writing development. The annotation layer makes close reading accessible to users who don’t have a formal literary education. Connecting the week’s passage to the week’s devices creates a direct bridge between observation and practice.

**User Flow**
User opens app → scrolls past prompt card and techniques card → sees “This Week’s Passage” card with first line of text → taps → full-screen modal opens → reads through passage as scrollable sentence cards → taps a highlighted phrase → annotation appears below → finishes passage → taps Done → returns to home screen.

**UI Description**
Home screen card: same rounded card style as prompt and techniques cards. First line of passage in italic serif, slightly smaller than the quote prompt. Author name in small caps below. Subtle “Read →” affordance in muted terracotta. Full-screen modal: cream background, generous line height, passage text in the app’s primary serif. Highlighted device moments use a warm amber underline rather than background highlight — readable without being intrusive. Annotation appears as a small card below the relevant sentence, in slightly smaller text with a terracotta device label above it.

**UX Description**
The reading room should feel slow by design — the opposite of the timed writing challenge. No timer, no word count, no progress metric. Just a passage and the quiet company of annotations. The vertical scroll pace naturally controls the reading rhythm. Users should feel like they are reading in the margins of a book belonging to someone with very good taste.

-----

## 10. Onboarding — First Session Experience

**Change**
Build a dedicated onboarding flow for new users that walks them through their first session interactively before the timer starts.

**Detailed Description**
Currently there is no visible onboarding in the app. A new user who opens Pensée for the first time sees today’s prompt, three technique chips they may not understand, and a button to begin a 10-minute session. A user who doesn’t know what asyndeton is before their first timer starts will feel defeated rather than energized. The first session is the single highest-leverage moment for long-term retention.

**How It Works**
On first launch, after account creation, the user is taken through a three-step interactive introduction before their first session: (1) The prompt is introduced — what it is, how to relate to it (not to write *about* it literally but to use it as a lens). (2) Each of the three techniques is introduced with its definition and a live example — the user taps each chip to reveal the definition, simulating exactly the gesture they’ll use during the real session. (3) A brief reassurance about the format — freewriting means no editing, no backspacing, no perfection. Then the first session begins. After the first session, the reflection is also briefly guided — each field has a short tooltip on first use.

**How It Helps**
Eliminates the primary cause of first-session failure: not knowing what the devices mean before the timer starts. Sets accurate expectations about freewriting. Makes the core gesture — tapping a device chip to learn about it — feel familiar before it matters. Dramatically improves first-session completion rate and day-two retention.

**User Flow**
New user creates account → onboarding begins → Step 1: prompt introduction (read, tap to continue) → Step 2: technique chips appear one by one, user taps each to see definition → Step 3: brief freewriting explanation → “Ready? Let’s begin.” → writing session starts → session ends → guided reflection with tooltips.

**UI Description**
Onboarding uses the same modal sheet style as the rest of the app — no separate design language. Step indicators: three small dots at the top of each sheet, filled as the user progresses. The technique chip interaction in Step 2 is identical to the real chip interaction, creating muscle memory. “Ready? Let’s begin.” appears on the same terracotta CTA button as “Begin Today’s Challenge” — continuity of the action.

**UX Description**
Onboarding should feel like being welcomed by a thoughtful host, not processed by a system. It should be completable in under two minutes. Every screen should have a clear skip option — forcing users through onboarding they don’t want creates resentment. The goal is to eliminate the anxiety of the blank page for a new user, not to teach them everything the app can do.

-----

## 11. Post-Session Celebratory Moment

**Change**
Add a brief, warm moment between the timer ending and the reflection sheet appearing.

**Detailed Description**
Currently the experience moves directly from the timer hitting zero to the reflection screen. There is no acknowledgment that the user just did something — sat down, wrote, finished. That moment of completion deserves recognition before the reflective mode begins.

**How It Works**
When the timer hits zero, writing is locked (no further input). A brief full-screen overlay appears for approximately two seconds — the word count large and centered in terracotta, and a single short line below it drawn from a rotating set of genuine, non-corporate affirmations. Not “Great job!” but something like “336 words. That’s a complete thought.” After two seconds (or a tap), the overlay fades and the reflection sheet rises.

**How It Helps**
Creates a psychological punctuation mark between the active effort of writing and the reflective mode of the post-session screen. Acknowledges the user’s effort without being hollow or performative. The word count displayed prominently in this moment makes quantity feel meaningful rather than incidental.

**User Flow**
Timer hits 00:00 → writing locks → celebratory overlay fades in → word count displays large → one-line affirmation below → user taps or waits 2 seconds → reflection sheet rises from bottom.

**UI Description**
Overlay: full-screen cream background. Word count in large terracotta numerals — significantly larger than any other number in the app. Affirmation in regular-weight serif below, centered, in dark brown. No buttons, no icons. Fades out naturally or on tap. Transition to reflection sheet: the overlay fades as the sheet rises, creating a smooth handoff rather than a hard cut.

**UX Description**
Two seconds is the right duration — long enough to land, short enough not to feel like a loading screen. The affirmations should be written with the same literary sensibility as the prompts: specific, slightly unexpected, never generic. “You wrote through it” is better than “Amazing work!” The moment should feel earned, not automatic.

-----

## 12. Logo Refinement

**Change**
Refine the current “p” lettermark to use a typeface with more character and craft.

**Detailed Description**
The current logo uses what appears to be Times New Roman or a close equivalent — a functional serif but one with no distinctive point of view. For a product whose entire identity is built around literary craft and considered language, the logo typeface needs to carry more intentionality.

**How It Works**
Replace the current letterform with the lowercase “p” from Cormorant Garamond, Freight Display, or Canela — all of which have calligraphic origins, distinctive stroke contrast, and a handmade quality that connects to writing as a physical act. Test the mark in terracotta on cream (the primary in-app version) before finalizing in black. The descender foot should feel warm and slightly calligraphic rather than mechanical.

**How It Helps**
The logo is the first thing a potential user sees — in the App Store, on a shared export card, in a browser tab. A typeface with genuine character communicates immediately that Pensée has a strong aesthetic point of view. It makes the app feel like it was made by people who care about language, not just people who made an app about language.

**User Flow**
Not applicable — this is a brand asset rather than an interactive element.

**UI Description**
Lettermark: lowercase “p” in Cormorant Garamond (or equivalent) at the weight where the calligraphic stroke contrast is most visible. Primary version: terracotta on cream. Secondary: dark brown on cream. Monochrome: black on white. The é accent in the wordmark version should be rendered correctly and never dropped.

**UX Description**
A logo has no UX in the traditional sense, but it has an emotional effect. The goal is that someone seeing the Pensée mark for the first time feels like they’re looking at the cover of a book they’d want to read — specific, restrained, confident.

-----

*Document prepared February 2026. All recommendations based on review of current app screens and informed by research in cognitive psychology, deliberate practice theory, and writing pedagogy.*