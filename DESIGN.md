---
name: jayaremala.com
description: An editorial newsprint system where every typeface is an assigned speaker — the system, the author, the machine, and the reader.
colors:
  bg: "#fefefb"
  surface: "#f5f4f0"
  surface-raised: "#eceae6"
  surface-sunken: "#e3e0da"
  border: "#c6c2bb"
  border-subtle: "#dedad3"
  border-strong: "#978f87"
  fg: "#181410"
  fg-muted: "#3a342c"
  fg-subtle: "#5a5248"
  fg-faint: "#8c867e"
  skin: "#3b4320"
  skin-deep: "#2b3117"
  flesh-tint: "#eef0d2"
  flesh: "#d8de8a"
  pit: "#7a4a2b"
  skin-ink: "#23280f"
  signal-violet: "#6d28d9"
  accent-shared: "#4f46e5"
  accent-shared-secondary: "#8b5cf6"
  dark-bg: "#0f0e0c"
  dark-surface: "#171613"
  dark-surface-raised: "#201e1a"
  dark-border: "#2e2b26"
  dark-border-subtle: "#1f1d19"
  dark-border-strong: "#4d4840"
  dark-surface-sunken: "#0a0908"
  dark-fg: "#eeebe5"
  dark-fg-muted: "#cfcac1"
  dark-fg-subtle: "#9a948a"
  dark-fg-faint: "#6f6a62"
  dark-accent: "#d8de8a"
  dark-accent-hover: "#e6eaa8"
  dark-accent-light: "#23261a"
  dark-signal-violet: "#8b7cf6"
typography:
  display:
    fontFamily: "EB Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.65rem, 4.4vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "-0.016em"
    fontFeature: "kern 1, liga 1"
  display-lg:
    fontFamily: "EB Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 4.4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.03
    letterSpacing: "-0.016em"
  headline:
    fontFamily: "EB Garamond, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.016em"
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.006em"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  lead:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.8
  prose:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.85
  voice-serif:
    fontFamily: "EB Garamond, Georgia, Times New Roman, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.75
  dateline:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.16em"
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    letterSpacing: "0.2em"
  signature:
    fontFamily: "Cormorant Garamond, EB Garamond, Georgia, serif"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0.005em"
  marginalia:
    fontFamily: "Caveat, Segoe Print, Bradley Hand, cursive"
    fontWeight: 400
    lineHeight: 1.05
rounded:
  chip: "0.5rem"
  panel: "0.75rem"
  card: "1rem"
  pill: "9999px"
spacing:
  micro: "0.375rem"
  xs: "0.625rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2.5rem"
  chapter: "4rem"
  chapter-lg: "8rem"
components:
  button-ink:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.625rem 1.25rem"
  button-ink-hover:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg-faint}"
    rounded: "{rounded.chip}"
    padding: "0.375rem 0.875rem"
  chip-filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg-faint}"
    rounded: "{rounded.chip}"
    padding: "0.375rem 0.875rem"
  chip-filter-active:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
    rounded: "{rounded.chip}"
  card-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
  input-field:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.chip}"
    padding: "0.625rem 0.875rem"
  input-chat:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "0.625rem 0.875rem"
  nav-bar:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg-muted}"
    height: "50px"
---

# Design System: jayaremala.com

## Overview

**Creative North Star: "Three Voices"**

The site is a printed thing that happens to run in a browser. Its material is
newsprint and ink: an off-white sheet, a deep near-black ink, hairline column
rules doing the work that boxes and shadows do elsewhere. Nothing floats
decoratively; where something lifts, it lifts because you touched it.

The organizing idea is that type is casting, not decoration. **Instrument Sans
is the system talking** — chrome, labels, UI copy. It is bound under
`html:has(.portfolio)` in `globals.css`, so it covers every portfolio route
and `/chat` while gradeVITian and VRF Bricks keep their own faces. **EB Garamond (and Cormorant for the signature) is the author
talking** — hero and chapter headlines, pull-quotes, opinions, the signature
mark. **Geist Mono is the machine reporting** — measurements, datelines,
uptime counters, model ids, anything the build knows rather than claims.
**Source Serif 4 is the reader's voice** — long-form `/blog` and `/lab` prose,
set at reading size and never themed away. A visitor should be able to tell who
is speaking without reading a word.

Density is editorial, not dashboard: one column, generous vertical rhythm
between chapters, tight leading inside them. Colour is almost entirely absent —
the page is ink on paper, and a single avocado green appears only where something is
alive. The confirmed anti-reference is the generic developer-portfolio dark
mode: neon-on-charcoal, gradient hero, glassmorphic cards, a rainbow of tag
colours. This system rejects all of it.

**Key Characteristics:**
- Ink-on-paper primaries; a cool newsprint sheet and a deep near-black ink
- One accent — Skin in light, Flesh in dark — reserved for live state
- Four assigned typefaces, each with a fixed speaker
- Hairline rules and ruled bands instead of nested cards
- Flat at rest; depth is earned by interaction
- One continuous reading column at every viewport
- Paper grain over the whole page (2.8% multiply noise, 1.8% screen in dark)

## Colors

Two papers and one ink, plus a single avocado green that means "this is running".

### Primary — the Avocado palette
Three colours, all taken from a halved Hass avocado and nothing else. Chosen to be the site's own — deliberately not a forest-and-lime scheme.

- **Skin** (`{colors.skin}`): the dark olive rind. Light-mode accent (10.34:1 on paper) and the footer band in both modes.
- **Flesh** (`{colors.flesh}`): the butter-green meat. Dark-mode accent (13.54:1 on the ink-stone) and the fill colour; text on a Flesh fill is `{colors.skin-ink}`.
- **Pit** (`{colors.pit}`): the seed. Small marks only — the logo's stone and the seed badge above the featured testimonial. Never body text, never in dark mode as text (2.6:1).
- `flesh-tint` (`#eef0d2`) is the pale wash behind accent text in light mode; it is a tint of Flesh, not a fourth colour.
- **Fixed surfaces:** the testimonial deck faces (Skin, Paper, Flesh) and the footer band (Skin with Flesh accents and a halved-avocado line drawing) keep their colours in both modes.
- **Semantic exceptions:** amber for warnings and rose/red for errors and recording state stay, because they mean something. Everything decorative uses the accent.

### Secondary
- **Signal Violet** (`{colors.signal-violet}`): retired on the portfolio. `--accent-secondary` is collapsed onto `--accent` under `html:has(.portfolio)`, so every legacy indigo→violet second stop (gradient micro-label, scan-line) now renders as a single indigo. The token survives only for gradeVITian.

### Neutral
- **Newsprint** (`{colors.bg}`): the page. Off-white with a faint warm cast in the shipped hex.
- **Sheet** (`{colors.surface}`) / **Raised Sheet** (`{colors.surface-raised}`) / **Sunken Sheet** (`{colors.surface-sunken}`): the only tonal steps. Cards, hover beds, table headers.
- **Column Rule** (`{colors.border}`), **Faint Rule** (`{colors.border-subtle}`), **Heavy Rule** (`{colors.border-strong}`): the three line weights. Heavy opens a rule and marks a pull-quote's spine; standard divides ruled bands; faint separates rows inside one band.
- **Ink** (`{colors.fg}`) → **Muted** (`{colors.fg-muted}`) → **Subtle** (`{colors.fg-subtle}`) → **Faint** (`{colors.fg-faint}`): the full four-step ink ramp, and the system's real hierarchy device. Distinction is full ink; dormant is faint.
- **Ink-stone** (`{colors.dark-bg}`): dark mode is a warm near-black, not pure black and not a cool grey. It is the light-mode paper inverted: the same warm cast runs through `dark-surface`, the borders and the ink ramp, so the dark sheet stays tactile. Ink is `{colors.dark-fg}` (16.2:1); the faintest step `{colors.dark-fg-faint}` holds 3.6:1 and is for labels, never body copy.

### Named Rules
**The Calm Surface Rule.** No ambient colour. The per-section accent washes, the footer glow and the purple footer wave were retired. Paper grain and the dot grid are the only texture; the one large field of solid colour is the inverted footer (see The Back Page).

**The One Ink Rule.** Emphasis is ink weight, not hue. A thing is important because it is set in full `fg` while its neighbours sit at `fg-subtle`, never because it was tinted. Audit test: desaturate a screen; if the hierarchy survives, it obeyed the rule.

**The Two Papers Rule.** There are two papers, `bg` and `surface`, plus a raised and a sunken step for edges. A surface never invents a third tint, a tinted card, or a coloured panel.

**The Cool Newsprint Rule.** The neutral ramp is normatively cool blue-slate — quality newsprint under natural light. The shipped hexes carry a warm cast (`#fefefb` / `#181410`) that is known drift, not intent; the correction is still pending. New neutrals are chosen cool.

**The Signal Rule.** The accent (Skin in light, Flesh in dark) means live: something running, open, active, or focused. It is not a brand wash, not a category colour, and not a hover flourish on a static element. Live is the accent, distinguished is full ink, dormant is faint — three states, one hue. The deck and footer are the two sanctioned colour fields.

**The No-Category-Colour Rule.** Tags, skills, project types, roles and post kinds are never colour-coded. They are distinguished by ink weight, rule weight, and position.

## Typography

**Display Font:** EB Garamond (with Georgia, Times New Roman, serif) — via `.display-serif`
**Body Font:** Instrument Sans (with system-ui, sans-serif) — bound under `html:has(.portfolio)`; `--font-instrument`
**Reading Font:** Source Serif 4 (with Georgia, serif) — `--font-blog`, long-form only
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace)
**Signature:** Cormorant Garamond italic; **Marginalia:** Caveat

**Character:** A humanist Garamond announcing over a crisp Instrument Sans that reports,
with a monospace that only ever states measured fact and a reading serif kept
for the reader alone. The pairing is a newspaper's: a masthead voice, a body
voice, and an agate voice, each doing one job.

### Hierarchy
- **Display** (600, `clamp(2.65rem, 4.4vw, 4.25rem)`, 1.0, `-0.016em`): the hero headline. Garamond's small x-height means every step is set larger and leaded tighter than a grotesque equivalent would be. The vw factor is deliberately modest so the headline never pushes the CTAs and signature below the fold.
- **Display Large** (600, `clamp(2rem, 4.4vw, 3.5rem)`): page titles across `/blog`, `/lab`, `/experience`, `/projects`, `/education`, `/apps`, `/now`.
- **Headline** (600, `clamp(1.5rem, 2.4vw, 2.1rem)`, 1.12): chapter labels in the home page rail.
- **Title** (600, `1rem`, 1.25, `-0.006em`): card and section headings; Instrument Sans.
- **Body** (400, `0.9375rem`, 1.55): all UI and card copy. `text-lead` (`1.0625rem`, 1.8) for bios and intro paragraphs.
- **Prose** (400, `1.0625rem`, 1.85, max 68ch): `/blog` and `/lab` article bodies in Source Serif 4, with Garamond headings, a Garamond drop cap in the accent, and hanging punctuation.
- **Dateline** (`0.6875rem`, uppercase, `0.16em`, tabular): Geist Mono. `PLACE / YEAR` above a chapter heading, and every measurement line beneath one.
- **Label** (700, `0.625rem`, uppercase, `0.2em`): section micro-labels and stat captions.
- **Ghost numeral** (Garamond 500, `clamp(4rem, 8vw, 8.5rem)`, 5–6% ink, lining + tabular figures): the chapter's typographic anchor, set behind the rail label.

### Named Rules
**The Assigned Speaker Rule.** Four faces, four speakers: Instrument Sans is the system, Garamond/Cormorant is the author, Geist Mono is the machine, Source Serif 4 is the reader. Before setting a new string, name its speaker; that names the face. A measurement never appears in Garamond, and an opinion never appears in mono.

**The Unthemeable Voice Rule.** `--font-garamond`, `--font-cormorant` and `--font-blog` are deliberately never overridden by `[data-theme]`. The author's voice and the reader's voice survive every theme; only the system's voice swaps.

**The Escape Hatch Rule.** `--font-display` is overridden in exactly one place: `html:has(.portfolio)` points it at Garamond, which makes Garamond the portfolio's one display voice (h1 and the hero name band included). Never override it per theme or at `:root` — gradeVITian and VRF Bricks inherit the root value and must stay grotesque. Inside components, keep reaching for `.display-serif` rather than the variable.

**The Ghost Numeral Rule.** A chapter is counted once, by the oversized ghost numeral in the rail. No second mono numeral, no third line above the heading; the dateline below carries the filing.

## Layout

One continuous reading column at every viewport. The home page is a stack of
plain `<section>` chapters inside a container that steps `max-w-6xl` →
`xl:max-w-7xl` → `2xl:max-w-[90rem]`, padded `px-4` → `sm:px-6` → `md:px-8`,
with a wider right gutter at `xl` (`xl:pr-16`) reserving a lane for the fixed
section indicator.

Each chapter is a two-column grid only from `lg` up: a `13rem` → `xl:15rem` →
`2xl:17rem` rail beside a `minmax(0,1fr)` body, gap `lg:3.5rem` → `xl:5rem`.
Below `lg` the rail is a normal stacked block. The rail goes `lg:sticky` in pure
CSS — no matchMedia, no ResizeObserver, no scroll handler — so its identity
stays with you while the body scrolls past, and it degrades on its own.

Vertical rhythm is the chapter interval: `pt-16 pb-12` on phones rising through
`sm` / `md` / `lg` to `xl:pt-36 pb-24`. The sticky nav is 50px (`--nav-h`), and
chapters carry `scroll-margin-top: calc(var(--nav-h) + 0.875rem)` so an anchor
jump never parks a heading under the chrome.

Reading measures are capped explicitly: prose 68ch, testimonials 68ch,
experience and education bullet lists 72ch, standfirsts and body columns 62ch,
decks and short annotations 46ch.

Breakpoints are Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280,
`2xl` 1536). Mobile disables the legacy sticky card-stacking entirely
(`.stack-pin` → static below 768px) so native momentum scroll stays smooth.

### Named Rules
**The One Column Rule.** The page is one column of reading at every width. Side rails carry identity, never content the reader must have. A layout that only works above `lg` is not a layout.

**The Measure Rule.** Every run of text declares its measure. Nothing sets wider than 72ch, and prose sets at 68ch.

## Elevation & Depth

The system is flat at rest. `--shadow-card` is literally `none` in light mode;
depth in daylight is carried by hairline borders and the two paper tints, not by
shadow. Dark mode gets a minimal resting shadow (a 1px/3px pair at 50%/35%
black) because on the dark ink-stone a border alone loses the edge.

Shadow is a response, not a property. `.card-lift` translates a surface up 3px
and swaps to `--shadow-card-hover` over 300ms on the site's one easing curve;
`:active` settles it back to `translateY(0) scale(0.99)` in 75ms. Buttons scale
to 0.97 on press globally. The only ambient shadow left is `--shadow-stack`, an
upward cast under stacked sections, and the reading-mode spotlight
(`0 0 0 100vmax rgba(0,0,0,0.62)`) which is a scrim expressed as a shadow so it
survives ancestor stacking contexts.

### Shadow Vocabulary
- **Rest, light** (`box-shadow: none`): the default. Borders do the work.
- **Rest, dark** (`0 1px 3px 0 rgb(5 3 15 / 0.5), 0 1px 2px -1px rgb(5 3 15 / 0.35)`): the minimum needed to hold an edge on black.
- **Lift, light** (`0 12px 32px -8px rgb(0 0 0 / 0.08)`): hover on an interactive tile only.
- **Lift, dark** (`0 4px 16px -2px rgb(5 3 15 / 0.65), 0 8px 32px -4px rgb(5 3 15 / 0.50), 0 1px 3px 0 rgb(5 3 15 / 0.35)`): the same gesture, more layers to read on black.
- **Stack** (`0 -16px 48px -8px rgb(0 0 0 / 0.12)`; `0.50` in dark): the upward cast under a stacked section.

### Named Rules
**The Earned Depth Rule.** Surfaces are flat until touched. Shadow is the response to hover, focus, or press — never a resting decoration, and never a substitute for a rule or a tint.

**The Ruled Band Rule.** A group of related figures is a ruled band — `border-y` on the group, `divide-x` between the cells — not a row of cards. Cards nested inside cards are the failure mode this replaced; every line in a band is present at rest, never gated behind a hover a touch device cannot reach.

**The No-Scrim Rule.** The nav meets content at a clean edge. It carries the page background, not a translucent wash — a scrim over the sticky chrome dropped body copy behind it to roughly 2:1 and was removed.

## Shapes

Three corners and no more: `chip` (0.5rem) for tags, small controls and input
fields; `panel` (0.75rem) for dropdowns, drawers and code blocks; `card` (1rem)
for the canonical content card. A fourth shape exists and is deliberately not on
the ramp — the full pill (`9999px`), reserved for actions and the chat input,
so a thing you press never has the same silhouette as a thing you read.

Borders are the primary form language. Three weights of the same hairline —
`border-strong` where a rule begins, `border` where it divides, `border-subtle`
where it merely separates rows — carry nearly all structure. The chapter rule is
a gradient hairline that starts heavy at the spine and vanishes before the
margin: a column rule, not a UI divider. Pull-quotes hang off a single
`border-l border-border-strong` with hanging punctuation. Dotted chains
(radial-gradient at 3px/11px, masked to fade at both ends) stand in for dividers
where a hard rule would be too loud.

Recurring geometry: the 24px dot grid (hero, nav, footer), the corner-bracket
motif on bracketed tiles, and the avocado mark used as the chapter bullet.

### Named Rules
**The Three Corners Rule.** Chip, panel, card. A new surface picks one of the three or it picks the pill because it is an action. There is no fourth radius.

**The Rule Before The Box Rule.** Reach for a hairline before a container. If a border, a gradient rule, or a divided band can express the grouping, it does — a bordered box is the last resort, not the first.

## Components

### Buttons
- **Shape:** Full pill (`9999px`) for actions; chip (0.5rem) for quiet controls.
- **Primary — the avocado pill (`.btn-avo`):** a Skin pill in light mode, Flesh in dark, used for every primary action site-wide (Schedule a call, Book 30 minutes, Send message, Ask Avocado in the nav, Install, Read the case study). On hover or keyboard focus the inside of the fruit sweeps in from the left — Flesh with skin-ink in light mode, Skin with Flesh ink in dark — over 450ms; reduced motion makes it instant. Disabled drops to 55% with no sweep.
- **Secondary (`.btn-avo-ghost`):** hairline pill that takes the accent border and a pale flesh wash on hover. Selected filter chips use `bg-accent text-accent-fg`.
- **Hover / Focus:** Global `:active` scales to 0.97 in 75ms. Focus-visible is a 2px accent outline at 3px offset, 6px radius, applied globally.
- **Quiet / Ghost:** paper background, hairline border, `fg-faint` text rising to `fg` on hover. No fill, no shadow.

### Chips
- **Style:** Chip radius, `bg-surface`, hairline border, `fg-faint` label at 12px with a 10px count badge.
- **State:** Selected inverts to solid ink (`bg-fg` / `text-bg` / `border-fg`); unselected stays paper. Filter state is expressed by inversion, never by hue.

### Cards / Containers
- **Corner Style:** Card (1rem), from the shared `Tile` primitive.
- **Background:** `surface` on `bg`, hairline `border`.
- **Shadow Strategy:** none at rest; `card-lift` only when the tile is interactive (see Elevation & Depth).
- **Border:** hairline, strengthening to `border-strong` on hover.
- **Internal Padding:** `1.25rem` typical, `1.5rem` at `sm` and up.
- **Sweep:** an optional 1px accent hairline pinned to the top edge that wipes in left-to-right (`scale-x-0` → `scale-x-100`, 300ms) on hover. It is a boolean, not a colour — there is no per-tile gradient.
- **Brackets:** optional 10px corner brackets at 50% border ink, warming to 40% accent on hover.

### Inputs / Fields
- **Style:** Chip radius, page background (`bg`), hairline border, `0.625rem 0.875rem`. Font-size is forced to 16px below 640px to stop iOS auto-zoom.
- **Focus:** the container takes the state, not the field — `focus-within:border-accent`. The inner `input`/`textarea` has its own outline and ring suppressed by design.
- **Chat input:** the same field as a full pill, with a double box-shadow focus ring (3px page-coloured gap, then 5px accent at 45%) instead of a border shift.
- **Disabled:** 60% opacity, border held at `border`.

### Navigation
- **Style:** sticky, 50px tall, on the page background with no scrim and no blur over content. Content meets it at a clean edge.
- **Typography:** Instrument Sans at 14px for links; the wordmark is a 20px serif at wide tracking.
- **States:** a sliding rounded-md indicator follows the hovered item; the active item is full ink with an accent icon; inactive is `fg-muted`. Dropdowns are panel-radius surfaces at 95% opacity with a 14px backdrop blur and a hairline ring — blur applies to menus, never to the bar.
- **Mobile:** an 11px-minimum-height icon row and a panel-radius drawer; a chat FAB sits fixed on portfolio pages.
- **Ambient:** a 24px dot grid fades to 18% inside the nav pill once the page is scrolled.

### The Chapter Dateline
The home page's signature device. A chapter that records a real deployment is
filed like a field note: a mono `PLACE / YEAR` line at 11px, uppercase, `0.16em`
tracking, with the place in `fg-muted`, the slash in `fg-faint`, and the year
tabular. The Garamond chapter label sits directly under it, then the gradient
column rule draws itself left-to-right over 900ms, then an optional 46ch deck,
then — separated by a `border-subtle` top rule — the mono measure line: what that
site cost or produced. Chapters that argue rather than record leave the dateline
unset and read as a plain heading. Two of the home page's chapters (The work, Why I build) are filed
this way.

### The Still-Running Ledger
A row per shipped product, dot-leadered across the measure. A pulsing Signal
Indigo dot (a solid dot under an `animate-ping` halo) marks live; an archived
entry drops to a faint static dot. The uptime is mono and tabular and counts real
years and days. Rows have no borders — they are a hover bed (`surface-raised`) at
panel radius and a leader line of `border`-coloured dots that warms to 40% accent
on hover.

### The Back Page
The portfolio footer is the sheet turned over: a Skin band in both modes with Flesh as its only accent and a halved-avocado line drawing (rind, flesh line, stone) cropped into the right corner, so it can never blend into the page. Its top edge is perforated (page-coloured 4px holes every 18px). Inside: a closing ask in Garamond with an inverted ink pill ("Book 30 minutes"), the signature sign-off at display scale that writes itself left to right on scroll (clip-path, reduced-motion shows it whole), the site index, and a mono colophon with the build date and a live Dallas clock. The primary pill is Flesh with skin-ink text.

### The Avocado Preview
On `lg+` the hero's right column is a small Avocado card that types out answers to recruiter questions. The answers are pre-written from the knowledge base (`profile.avocadoPreview`) and the card is labelled "Preview"; "Ask this" hands the question to `/chat?q=`. It sits on two sheets — Skin behind-left (−3°) and Flesh behind-right (2.5°) — that fan further on hover or focus. Its header is the seed avatar, the question is an accent bubble, and "Ask this" is a ghost pill.

### The Testimonial Deck
"Kind words" opens with one verbatim pull line (`pull` in testimonials.json) under a round Pit-brown seed badge with the mark pressed in Flesh, then deals the testimonials as overlapping cards (−2rem overlap, tilts −3°…3°, small vertical offsets) in Skin / Paper / Flesh faces. The track is a native horizontal scroller (swipe on touch, trackpad on desktop) with a slow left-to-right drift on top (28px/s) that pauses on hover, focus, touch, an expanded card, off-screen, or the pause button, and never runs under reduced motion. Hover or focus straightens and lifts a card to the front. Long quotes clamp at 7 lines with "Read all".

### Avocado faces
One shared surface language for every "printed object" on the site: `data-face="skin" | "flesh" | "paper"` on `.deck-card`, `.role-card`, `.stance-panel`, `.prompt-card` and `.note-card`. Skin is olive with paper ink, Flesh is butter with skin-ink, Paper is the surface with a hairline. Faces keep their colour in both modes; nested `text-fg` inherits the face's ink. Pit never becomes a face — it stays a mark.

### Card rows ("The work")
The work chapter spans full width (no rail). Roles and builds share one shape: three equal cards in a row from `lg` up, and below that a swipeable snap row that bleeds to the screen edge with a peek of the next card. Role cards are Avocado faces (Skin, Paper, Flesh) reading top to bottom: dates (mono), company (Garamond), role and qualifier, the first bullet that carries a number (clamped to 5 lines), and the location with a pin at the foot. They lift 4px on hover where hover exists.

### Note stack ("Writing")
Blog posts and lab logs as one pile of note cards (`NoteStack`), with an index of titles beside it on `lg+` (below it on smaller screens). The top card shows a cover image if the post has one, otherwise a tinted band with its tags; the two cards beneath peek out tilted and offset. "Next", a swipe or a drag past 90px throws the top card off to the side and it slides in at the bottom; "Previous" pulls the bottom card to the top; the index jumps straight to any note; arrow keys work when the pile is focused. Nothing moves on its own. Reduced motion swaps cards without the throw.

### Seed ring
A pit-brown seed with a sentence set around it on a circular path, turning once every 22s (stopped under reduced motion). Used as the "Still running" mark and as Avocado's identity on `/chat`. The sentence is real copy, announced once via sr-only.

### Avocado chat
`/chat` opens on the seed ring, a Garamond "Ask me anything about Jaya", a single segmented persona control, and the suggested questions dealt as tilted Avocado-face cards ("pick a card"). Avocado's avatar everywhere is the seed (`SeedAvatar`), replacing the 🥑 emoji; the visitor's own messages sit in accent bubbles.

### Social preview cards
Blog and lab posts, and the site-wide `public/og-image.png`, share one card (`lib/portfolio/og-card.tsx`): a Skin sheet, EB Garamond throughout (fetched as TTF at build, falling back silently), Flesh labels and pill outlines, a Pit seed masthead, and the halved-avocado line drawing cropped into the corner. Lab status: Active is Flesh, Paused a light Pit, Shipped paper.

### Site bubbles (the page map)
One component (`SiteBubbles`), two places: the home page's "Explore the rest" chapter (just before "Let's talk") and the phone menu. Every page in `site-nav.tsx` is a bubble coloured by its group — Work is Skin, Writing is Flesh, Developers is Paper — sized by how often visitors want it (Projects, Experience and Blog largest), carrying a real count from the knowledge files (`site-stats.ts`: "8 projects", "22 photos"). The Pit in the middle is "Ask Avocado" for anyone unsure where to go. From `md` up the section lays the bubbles on an ellipse around the pit (groups kept as contiguous arcs) with a dashed accent ring behind them — a cut avocado; below `md`, and in the phone sheet, they wrap as a cluster. Bubbles drift on their own phases (off under reduced motion), lift on hover/focus, and the current page carries an accent ring. A three-dot legend sits under the map.

### Navigation — seed and page map
The wordmark is the plain "Jaya" serif (no mark beside it). Desktop dropdown items sit their icon in a small disc of the group's bubble colour, so the nav and the page map read as one system. On phones the hamburger is replaced by the seed: tapping it opens a full-screen "Where to?" sheet (portalled to `<body>`, page scroll locked, Escape closes) holding the page map, with Résumé, Install and Admin at the foot.

### Back to top
A 44px floating button on the left edge of every portfolio page (the right corner belongs to the chat button), appearing after 400px of scroll. A ring around it fills with the accent as you read down the page; hover fills the button with the accent.

### Closing the chat
The chat header's close control is a small whole avocado. Clicking it (or Esc) veils the page, drops a knife through the middle, and the halves fall apart (~950ms), then returns to the previous page on the site, or home if the visitor arrived directly. Reduced motion closes immediately.

### Reading (blog + lab posts)
Post titles are Garamond at display-lg with the description as a voice-serif standfirst beneath. Body is Source Serif 4 at 18px from `md` up (17px on phones), ~66ch measure; h2 1.75rem with a faint rule, h3 1.35rem; links thicken on hover; inline code sits on the flesh tint. Lab entries show eight tech tags and fold the rest behind "+N more".

## Do's and Don'ts

### Do:
- **Do** name the speaker before choosing a face: system (Instrument Sans), author (Garamond/Cormorant), machine (Geist Mono), reader (Source Serif 4).
- **Do** build hierarchy from the four-step ink ramp — `fg` → `fg-muted` → `fg-subtle` → `fg-faint` — before reaching for any colour.
- **Do** reserve the accent (Skin / Flesh) for live state: running, open, active, focused.
- **Do** express a group of figures as a ruled band (`border-y` + `divide-x`) at reading scale, with every line visible at rest.
- **Do** pick one of the three corners (chip 0.5rem, panel 0.75rem, card 1rem), or the pill if it is an action.
- **Do** cap the measure — 68ch for prose, 72ch for bullet lists, 62ch for body columns.
- **Do** let depth be earned: flat at rest, `card-lift` on hover, 0.97 on press.
- **Do** file a real deployment with a mono `PLACE / YEAR` dateline and a mono measure line.
- **Do** add every new ambient or infinite animation to the `prefers-reduced-motion` block, and reset the property it holds hostage (`scaleX(1)`, `stroke-dashoffset: 0`, `opacity: 0`) rather than only killing the animation.
- **Do** keep the author's and reader's faces out of `--font-display`; that variable is the theme escape hatch.

### Don't:
- **Don't** colour-code categories, tags, skills, or post types. No emerald/teal/amber/orange/sky/violet ramps on reading surfaces.
- **Don't** introduce a third paper tint or a tinted card to signal state; invert to ink instead.
- **Don't** nest a card inside a card. If it needs grouping, rule it.
- **Don't** put a scrim, wash, or blur behind the sticky nav over body content.
- **Don't** gate information behind hover — a touch device will never see it.
- **Don't** override `--font-display`, `--font-garamond`, `--font-cormorant`, or `--font-blog` per theme.
- **Don't** add a resting shadow in light mode; `--shadow-card` is `none` there on purpose.
- **Don't** invent a fourth radius or a bespoke per-component corner.
- **Don't** set a measurement in a serif or an opinion in mono.
- **Don't** bring back Roboto, Inter or Arial as the system face, or pure black as the dark sheet.
- **Don't** colour-code awards, search results or badges; an award is full ink with a trophy glyph.
- **Don't** reach for the generic developer-portfolio dark mode: neon on charcoal, gradient heroes, glass cards, rainbow tags.
