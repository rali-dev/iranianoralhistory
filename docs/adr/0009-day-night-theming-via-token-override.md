# 9. Day/Night theming via a token-override layer

- Status: Accepted
- Date: 2026-07-14
- Deciders: Engineering

## Context

The public archive shipped with a single, light "day" look. We want a user-toggleable **night mode**
that (1) leaves the day look **pixel-identical**, (2) reuses the existing brand palette (deep Bordeaux
`#7F0000`/`#A30000` on warm cream `#FFFFCC`) rather than inventing a second one, and (3) is visible on
**every** route.

Two failure modes had to be avoided:

- **Colour logic scattered across components.** The app already standardised on Tailwind v4 design
  tokens (`--page-bg`, `--bg-card`, `--text-primary`, `--accent`, …) in `styles.css`. A dark mode that
  re-specifies colours per component would duplicate that system and drift.
- **Day-mode regressions.** Roughly a third of the shell (nav, footer, banner, logo plates, raised
  buttons) still used *hard-coded* utilities — `bg-white`, `bg-white/95`, `text-black/65`, `#FFFFCC`.
  These do not react to token changes, so a naive token flip would leave half the UI stuck in light.

## Decision

Implement night mode as a **pure token-override layer**, and finish tokenising the shell so the layer
reaches everything.

1. **One override block.** `[data-theme="dark"] { … }` in `styles.css` re-binds the *same* semantic
   custom properties to a dark, warm-Anthracite translation of the brand family (Bordeaux lifted to a
   readable `#D65D57`; cream translated to `#1A1512`). Every surface built on `var(--…)` flips for
   free — no per-component dark styles. `color-scheme` is set per mode for native controls.

2. **Shell tokens whose light value equals the old hard-code.** New tokens (`--ink`, `--surface-raised`,
   `--logo-plate`, `--nav-bg`, `--nav-dropdown-bg`, `--banner-bg`) replace the remaining hard-coded
   colours. Their **light** values are byte-for-byte the originals — e.g. `text-black/65` becomes
   `color-mix(in srgb, var(--ink) 65%, transparent)` where `--ink:#000` reproduces `rgba(0,0,0,0.65)`
   exactly — so the day look is provably unchanged, while the same tokens carry the dark values.

3. **Theme is a shared-UI concern, not app state.** A signal-based `ThemeService` (`providedIn:'root'`,
   in `frontend-shared-ui`, mirroring `ImageLightboxService`/`I18nService`) is the single source of
   truth: it persists the explicit choice (`localStorage` key `ioh-theme`), falls back to the OS
   `prefers-color-scheme`, and reflects state as `data-theme` on `<html>`. A reusable
   `ThemeToggleComponent` (`<lib-theme-toggle>`, Sun ⇄ crescent-Moon, CSS-driven cross-fade) lives in
   the same lib and is mounted once in the global nav, so it appears on all routes including admin/auth.

4. **No flash of the wrong theme.** A tiny inline script in `index.html` sets `data-theme` from the
   same storage key/OS query *before* first paint; the service stays consistent with it at runtime.

## Consequences

**Positive**
- Day mode is unchanged by construction (identical light token values), backed by the existing
  `design-tokens.spec` guard and the app/lib unit suites (green: shared-ui, i18n parity, frontend app).
- Dark mode is a single, reviewable block; adding a token automatically themes every consumer.
- The toggle and service are reusable design-system building blocks, not app-local code.
- Trilingual, accessible: `THEME.*` keys in de/en/fa, `aria-label`/`aria-pressed`, reduced-motion honoured.

**Negative / trade-offs**
- One accent value cannot satisfy both "white text on accent fill" and "accent text on a dark surface"
  at full WCAG-AA; `#D65D57` is tuned to pass white-on-accent and large/icon accent-on-dark. A second
  fill token could be added later if small accent text on dark ever appears.
- Every genuinely white surface must be an intentional token (`--surface-raised` vs `--logo-plate`);
  new hard-coded `bg-white`/`text-black` reintroduces a light island in dark mode.

**Neutral**
- Default remains light (day) unless the OS prefers dark or the user has toggled — a one-line change if
  a hard light default is ever wanted.
