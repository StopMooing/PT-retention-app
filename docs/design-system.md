# UNFNSHD design system

How every screen looks and behaves. Read with `CLAUDE.md` (hard rules) and
`src/ui/index.jsx` (the building blocks). If a screen needs something this file does not
cover, follow the nearest pattern here rather than inventing a new one.

## Personality
Calm, warm, confident. Bone and forest, not neon. The app celebrates showing up and always
points to the next step ("journey over verdict"). Plain Australian English, short sentences,
sentence case. No em dashes. No emoji in headings or labels (the client's own habit icons are
fine). No exclamation marks except to celebrate something the client did.

## Colour (never raw hex in screens)
Use the semantic Tailwind names. They switch automatically in dark mode.

| Use | Class |
|---|---|
| Page background | `bg-bg` |
| Card / sheet / input | `bg-surface` |
| Subtle fill (track, pressed, segmented bg) | `bg-surface-2` |
| Main text | `text-ink` |
| Secondary text | `text-muted` |
| Tertiary / placeholder | `text-faint` |
| Hairline borders | `border-line` (inputs: `border-line-strong`) |
| Primary action, active state, links | `bg-accent text-on-accent`, `text-accent` |
| Soft accent fill (chips, selected rows) | `bg-accent-soft` |
| Warning / needs attention | `text-warn bg-warn-soft` |
| Problem / destructive | `text-bad bg-bad-soft` |
| Macros (same meaning everywhere) | `protein`, `carbs`, `fats`, `kcal` (e.g. `text-protein`, `style={{ color: 'var(--protein)' }}`) |

- Ring and chart strokes: `var(--accent)`, `var(--protein)` etc. in inline style.
- Do NOT use `bg-black/40` style overlays: "black" is the ink colour, which is light in dark
  mode. Use `style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}` (or the `Sheet` component).
- Do NOT use stock greys (`gray-*`), `black`, `white`, `emerald-*`, `green-*` in new code.
  They are remapped as a safety net only. Replace them as you touch each screen.
- Remove every `style={{ fontFamily: ... }}`. The body font is set globally.
- One accent only. Status colours (warn, bad) are for status, not decoration.
- Never yellow on black.

## Type
- Display: `font-display` (Baloo 2 ExtraBold). Page titles (32px), hero numbers (28 to 44px),
  the wordmark. Never for body text or buttons.
- Body: Nunito Sans (default). Card titles `text-[17px] font-bold`, body `text-[15px]`,
  meta `text-[13px] text-muted`, section labels via `SectionLabel`.
- Numbers that matter (kg, kcal, days) use `font-display` and `tabular-nums` where they line up.

## Shape and space
- Cards: `Card` (20px radius, 1px `border-line`, `bg-surface`, 16px padding). No drop shadows
  on cards; shadows only on floating things (sheets, toasts, the tab bar).
- Buttons and chips are fully rounded pills. Inputs are 14px radius, 48px tall.
- Phone screen gutter 16px (`px-4`). Gap between cards 12px, between sections 28px.
- Tap targets at least 44px. Bottom tab bar respects `env(safe-area-inset-bottom)`.
- Coach screens: max content width 1200px, 24px gutters, cards on `bg-bg`.

## Building blocks (`src/ui`)
`Mark`, `Logo`, `PageTitle`, `SectionLabel`, `Card`, `Button` (primary / secondary / soft /
ghost / danger, sm / md / lg), `Chip` (neutral / accent / warn / bad / solid), `Ring`,
`Segmented`, `Stat`, `Avatar`, `Sheet`, `PhotoViewer`, `EmptyState` (coach side only), `ThemeSwitch`,
`Field`. Icons: `lucide-react`, 20px in rows, 22px in the tab bar, stroke 2.

## Patterns
- **Screen top:** `PageTitle` with the screen name, optional action on the right.
- **Week strip:** seven day pills, today filled accent, dot under days with a session, tick
  for a completed session. Tapping a day selects it.
- **Progress:** `Ring` for "x of y" (sessions this week, check-in countdown, macros).
- **Lists:** rows inside one card separated by `divide-y divide-line`, 56px+ rows, chevron
  on the right when the row opens something.
- **Set logging:** one row per set: set number, previous, kg, reps, tick button. Completed
  rows tint `bg-accent-soft`. Number inputs use `inputMode="decimal"`.
- **Sheets for tasks:** adding food, picking a date, adding a workout open a `Sheet`, not a
  new page.
- **Empty data on client screens:** hide the section (house rule). Coach screens may use
  `EmptyState` with one clear next action.
- **Status (coach):** Engaged = `Chip tone="accent"`, Drifting = `warn`, At Risk = `bad`.
- **Destructive actions:** `Button variant="danger"` with a confirm step.
- **Loading:** a small centred `Mark` that gently pulses (`animate-pulse`), not a spinner and
  not the word "Loading...".

## Copy rules (client screens)
- Lead with what was done: "2 of 3 sessions done" not "1 session missed".
- Next step always visible: "Next up: Upper A, Wednesday".
- Weight: show the trend (7-day average), never a verdict.
- No "Behind", "Failed", "Missed" verdicts. "Not logged yet" is fine.
