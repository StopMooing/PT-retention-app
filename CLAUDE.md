# UNFNSHD (repo: pt-retention-app)

Coaching app for Luke, a personal trainer at Revo Woodcroft, Adelaide. Clients pay
$30/week; the weekly check-in loop (client checks in, coach replies) is the product.
Luke has no coding background: explain outcomes in plain English, not mechanics.

Latest state: `docs/status-2026-10-30.md` (also in the claude.ai project as
`claude/unfnshd-status-2026-10-30.md`); it wins over older notes. Fuller context lives in the
claude.ai project "CRM": `claude/pt-blueprint-handoff.md`
(state, open items, history), `claude/client-app-design-brief.md` (client app north star),
`claude/unfnshd-brand.md` (logo, colours, light and dark mode).

## Stack
- React 19 + Vite + Tailwind. Supabase (auth, Postgres, RLS), project `ksataubrattfspjpftlk`.
- Vercel: pushes to `main` deploy to production at https://unfnshd.app; every other branch
  gets a preview build. `api/chat.js` is a serverless function (Anthropic API, JWT-checked);
  it only works on deployed URLs, not localhost.
- Sentry error monitoring (`src/sentry.js`): org `unfnshd`, project `pt-retention-app`.
  Errors only. No session replay, no tracing, no personal data. Keep it that way.
- Main files: `App.jsx` (routing, coach dashboard), `ClientProfile.jsx` (coach view of a
  client), `ClientApp.jsx` (client PWA, very large: split per tab during the redesign),
  `ClaimPage.jsx` (account claim from an invite link), `AuthPage.jsx`.

## Hard rules
- Day logic: always `toLocalDateStr()` (ClientApp.jsx), NEVER `toISOString()`. Adelaide is
  UTC+10:30 / +9:30 and this has caused many bugs.
- No em dashes anywhere: code, copy, comments, commit messages.
- Any number shown on more than one screen comes from one shared function, so screens agree.
- Client-facing screens never show empty or placeholder content. Hide empty sections.
- Tone ("journey over verdict"): celebrate showing up and point to the next step. No copy
  that tells a client they failed ("Behind plan" style verdicts).
- Tailwind dynamic colours need inline `style={{ backgroundColor: ... }}`.

## Database
- Schema changes go through a named Supabase migration (`apply_migration`), never raw SQL,
  and the same SQL is saved in `supabase/migrations/<version>_<name>.sql` in the same change.
  One-off data fixes (deleting a test row) need no migration.
- `supabase/schema-baseline-2026-10-26.sql` is a reference snapshot, not a migration.
- RLS controls rows, never columns. When one role may edit another's record, use column
  GRANTs (see `checkins`: coaches may update only `coach_reply` and `replied_at`).
- Policy existence is not policy correctness: test what a policy actually allows.
- Check foreign keys and delete rules before deleting any row. Deleting a coach account
  cascades to all their clients and every client's data. All FKs to `exercises.id` cascade.
- Code change first, database change second, never both in one irreversible step.
- Destructive SQL (drop, revoke, alter, delete) shows Luke an approval prompt; a call that
  returns "cancelled" ran nothing. Tell him to watch for it before sending one.

## Workflow
- Read the code you are changing first. Never guess line numbers or logic.
- Verify before and after every change; `npm run build` must pass before any commit.
  `grep -c` counts lines, not occurrences, and is case sensitive: prefer exact string checks.
- Work on a branch, push, confirm the Vercel preview build is READY, then fast-forward `main`
  and confirm the production deployment is READY.
- Stop and explain when something does not match what you expected, before editing.

## Brand (UNFNSHD)
- Logo: an open ring (about 80% closed, dot in the gap) beside "UNFNSHD" in Baloo 2, 800,
  uppercase. Meaning: "we aren't done, we can still work and move".
- Light mode (default): bg #F3F1EC, text #121212, accent #2E6B57, secondary #55534E,
  borders #CFCBC2. Dark mode: bg #121212, text #F3F1EC, accent #7FD1A8 (button text
  #0B2A1E), surfaces #1E1E1E, borders #3A3A3A. Client can switch in settings; first launch
  follows the phone. Define colours once per mode (CSS variables), never per screen.
- Never yellow on black (the competitor CNDTND's look).

## Design and screenshots
- `docs/design-system.md` is binding for every screen: semantic colour tokens only (no raw hex,
  no stock grey/black/white), `src/ui` building blocks, copy rules.
- Client screens live in `src/client/`, coach pieces in `src/coach/` and `src/tools/`.
- `tools/screenshots/` runs the built app against fake sample data (no real accounts). Use it
  to check screens in light and dark before pushing.

## Agent skills in this repo
`.claude/skills/`: supabase-postgres-best-practices (any database work),
vercel-react-best-practices (React structure and performance), ponytail and
ponytail-review. **Ponytail runs at the `lite` level here**: build what was asked, and
name the smaller option in one line. It must never cut the verification gates, error
handling or security checks above. Skills come only from official sources and are read
before they are committed; do not add skills that fetch instructions at run time.
