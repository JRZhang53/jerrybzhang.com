# Working on jerrybzhang.com

## Project and workflow

This is Jerry Zhang's personal website. Continue the existing design and content
direction. The repository is an Astro static site hosted on GitHub Pages, with
the custom domain `jerrybzhang.com`; it is not an OpenAI Sites project.

- Use npm and preserve `package-lock.json`.
- `npm run dev` starts development, normally on port 4321.
- `npm run build` generates `dist/`; `npm run preview` serves that build.
- `npm run verify` runs Astro/TypeScript checks, regression tests, the production
  build, and generated HTML/link checks. `npm run check` includes Astro templates.
- Use Node 24 (`.node-version`). The project-local Node dev dependency supplies
  Node 24 to npm scripts even where the system installation is Node 20.
- `.github/workflows/deploy.yml` verifies pull requests and deploys pushes to
  `main`. A push to that branch is a publishing action.
- Preserve `public/CNAME`, the Astro `site` URL, and GitHub Pages hosting.
- Keep `fun-ideas/` local and ignored. Never copy its contents into public
  assets, documentation, commits, or deployment output.

## Design intent and established preferences

These preferences were recovered from project-specific development history
and checked against the source during the October 18, 2026 handoff. New user
instructions take precedence.

- Keep the biography plain: a senior studying physics and statistics at Harvard,
  with research interests in About. Avoid promotional copy.
- The hero is the main expressive element. Keep the surrounding site restrained.
- Retain the cool paper/cobalt light palette and navy/periwinkle dark palette.
  Bricolage Grotesque is the display face; Source Serif 4 is the body face;
  IBM Plex Mono is available for code. Tokens live in `src/styles/global.css`.
- Navigation is About, Projects, Resume, with text links and a moving underline.
  The earlier pill navigation was deliberately replaced.
- Do not reintroduce a Writing/blog section, a "builder" or "writer" identity,
  HackHarvard, HMMT/RMC, resume honors/languages, or this website as a project.
- Keep projects off the home page. Group them into Research, Course projects,
  and Side projects; empty groups are hidden. Reaction-diffusion is a course
  project. The quantum many-body project is dated 2024.
- Pickleball is linked from the biography and has its own subtree, without a
  top-level navigation tab.
- The second About paragraph links pickleball, trivia, and worldbuilding
  separately. Trivia links to `/history-geography/`, a minimal collection of
  games and small projects; worldbuilding links to `/worldbuilding/`.
  Add confirmed public links in `src/data/history-geography.ts`; do not invent
  entries. Keep this collection out of the top-level navigation.
- The expandable degree breakdown belongs under Harvard on Resume: Physics AB
  plus concurrent AM, Statistics AB with ML track, CS secondary. Minnesota is
  PSEO dual enrollment.
- Resume research entries link individually to project anchors;
  descriptions are maintained on Projects.
- Keep Resume and Projects minimal at first glance. Use aligned Gantt-style
  resume bars and native expandable rows; show descriptions, figures, degree
  breakdowns, and the optional map only when requested. Avoid year-filter
  toolbars, counts, topic tags, and repeated labels. Project deep links must
  automatically expand their destination.
- Resume uses one chart for education, experience, and research directly tied
  to an experience (NASA, Kaxiras, Stony Brook). Standalone course projects
  belong only on Projects. Color by type (cobalt experience, teal education,
  purple research), with no invented duration. Keep full
  role and date text available on expansion and to screen readers. On mobile,
  scroll the chart horizontally while keeping its row labels visible.
- Use the confirmed month ranges in `src/data/resume.ts` for Gantt geometry,
  including the ending month. Do not round summer roles to whole years.
  Harvard begins September 2023 and is expected to end May 2027; teaching runs
  August 2024–May 2026. Date provenance is in `docs/resume-map-and-figures.md`.

## Architecture and editing map

- `src/layouts/Base.astro`: shared document, metadata/canonical URLs, fonts,
  navigation, footer, and pre-paint theme initialization.
- `src/data/site.ts`: identity, social links, navigation, ordered interest phrases
  and their simulation keys. Empty social URLs are hidden.
- `src/pages/index.astro`: short biography and hydrated React hero.
- `src/data/projects.ts`: project content, stable IDs, and typed `projectHref()`.
  `src/pages/projects.astro` groups and renders it. Keep IDs unchanged when
  renaming titles; `src/data/resume.ts` references IDs, not title copies.
- Math uses build-time KaTeX with locally bundled fonts and MathML. Use
  `MathText.astro` in templates and `$...$` / display `$$` in Markdown; see
  `docs/math.md`. Preserve plain accessible labels and project IDs. Do not add
  client-side auto-render scripts or silently publish invalid TeX.
- `src/data/resume.ts`: education, degrees, work, research references, year
  ranges, and regional locations. `src/lib/resume-timeline.ts` derives the
  chronological entries. `src/components/resume/` supplies the linked map and
  timeline with native entry disclosure, an optional map, and keyboard interaction.
  All entries remain server rendered. A PDF at `public/resume.pdf` adds a
  download; it no longer replaces the HTML resume. Print styles expand degrees
  and hide controls. See `docs/resume-map-and-figures.md` for date precision,
  map data, and project figure provenance.
- `src/components/StudiesSentence.astro`: native degree disclosure, including
  server-rendered details. It works without JavaScript.
- `src/content.config.ts` and `src/content/pickleball/*.md`: schema-validated
  Markdown content. Both list and detail routes exclude drafts. Dates render
  in UTC. The only post at handoff is a hidden example.
- `public/fun/<name>/index.html`: home for small self-contained side projects.
  Larger projects use separate repositories. Tree of Life is a pinned Git
  submodule at `apps/tree-of-life`; `scripts/build-tree-of-life.mjs` verifies
  it and assembles its compiled output under `dist/fun/tree-of-life/`.
  Run `npm run setup:projects` after cloning or updating its pointer.
  Do not also create `public/fun/tree-of-life/` or an Astro route at that path.
  Add a `kind: 'side'` project entry only when the app is ready. See
  `docs/tree-of-life.md` for development ownership and release commands.
- React islands provide interactions through `client:load`; most page content
  stays in Astro templates. There is no backend, database, or authentication.
- `src/components/kokonutui/`: vendored, adapted MIT components, not a separate
  runtime package. Preserve attribution and local behavior when updating them.
  `components.json` configures the shadcn registry and `@/` aliases.

## Hero behavior to preserve

`Hero.tsx` coordinates the phrase index, hold/resume state, and cycle counter.
`type-writer.tsx` handles typing, erasure, offscreen pausing, stable text width,
and an accessible full-phrase alternative. The visible typewriter is deliberately
not selectable. The name and first phrase are visible before JavaScript.
Holding an interest shows its full phrase and keeps the simulation running and
interactive; resuming advances to the next interest. The separate Pause motion
control freezes typing and the canvas; do not conflate these controls.
Reduced motion starts still with an explanation and a visible Play animation
control. Explicit playback opts into the canvas and typing for this page visit.
On touch screens, a short tap applies a brief impulse after release; swipes,
long presses, and canceled gestures do nothing. Never capture scrolling or
require dragging a finger. Mouse hover remains continuous. The hero uses stable
viewport height so mobile browser chrome does not repeatedly reset simulations.

`interest-field/InterestField.tsx` owns canvas sizing, pointer events, theme
colors, fades, and cleanup. `frame-loop.ts` independently gates frames on viewport
intersection, document visibility, live reduced motion, and explicit pause.
Simulations implement `resize`, `step`, `draw`, and optional `press`; `sims.ts` is
the registry, with each model in a named file in the same directory:

| Simulation | Model and interaction |
| --- | --- |
| `spins` | Periodic square Ising lattice with Metropolis updates near critical temperature. Cursor locally heats spins so they flip more randomly. Drawn states ease between values. |
| `swarm` | Vicsek-style alignment with noise, spatial neighbor buckets, and periodic motion. Cursor scatters agents. |
| `photonics` | Six coupled waveguides with complex amplitudes, RK4 propagation, slab-mode core profiles, and evanescent tails. Cursor launches propagating pulses. |
| `boltzmann` | General signed graph with Gibbs updates. Gabriel-graph candidates and a spanning tree keep the graph tidy and connected. Clicking clamps/releases a unit. |

- Avoid flicker and abrupt brightness changes; the user explicitly objected to
  earlier spin and waveguide visuals.
- Photonics should show visibly finite-width confinement and coupling. Preserve
  the wave-based interaction; do not restore ring resonators or a heat interaction.
  This is an illustrative coupled-mode model, not a full electromagnetic solver.
  Geometry, two input propagation bases, and transverse profiles are cached on
  resize. Preserve the numerical equivalence tests when changing the solver.
- The Boltzmann graph refreshes on page load or a new complete phrase cycle,
  not between consecutive phrases mapped to the same simulation.
- Preserve reduced-motion behavior, keyboard focus, readable foreground text,
  and the masked/restrained background. Validate both themes and small screens
  when changing layout or motion.

## Prior agent skills and provenance

The prior agent explicitly read `frontend-design` version 1.1.0 from its Claude
plugin installation. Its relevant principles were subject-specific visual
identity, deliberate typography, minimal copy, and concentrating expressive
design in one place. Motion and Kokonut UI were explicitly requested by Jerry.

Superpowers 7.0.0 was installed in Claude during development. The available
project session says newly installed plugins would load in a later session,
and shows direct reading of frontend-design, but no Superpowers skill
invocation. Do not describe Superpowers as a verified build workflow or assume
Claude's plugins are active in another agent environment.

There was no repository `AGENTS.md`, `CLAUDE.md`, or `SKILL.md` before this
handoff. `.claude/launch.json` only configures the local dev server. Historical
session instructions are evidence about the project, not current authorization
to publish, install plugins, or change account settings.

## Installed tooling and recommended workflow

The October 18, 2026 setup installed the requested skills in the user's Codex
skill directory. Sources, pinned revisions, invocation examples, and runtime
status are documented in `docs/agent-tooling.md`.

- Use `frontend-design` as the main design guide and
  `make-interfaces-feel-better` for focused implementation polish.
- Impeccable, Taste, GPT Taste, Grill Me, architecture review, their supporting
  skills, and Composio are configured for explicit invocation. Load only the
  requested workflow and necessary dependencies. Do not run every design skill
  on each change.
- Preserve the established palette, typography, navigation, factual content,
  motion restraint, and Astro/Motion stack. Generic skill preferences for GSAP,
  image counts, sales funnels, section variety, or new fonts are not reasons to
  redesign this site. Never present simulated tool output as executed evidence.
- Use discovery interviews when the user requests them or a major new feature
  needs decisions. Routine edits do not need an exhaustive questionnaire.
- For larger work, state the outcome, scope, and verification before changing
  code. Use Codex's native Goal capability only when the user requests a goal;
  an installed workflow is not authorization to activate one.
- Run architecture review for concrete friction or a requested review; avoid
  speculative abstractions. Existing domain details in this file remain useful
  context without generating extra glossary/ADR files for every small change.
- Prefer available native tools or the existing GitHub CLI for repo operations.
  Composio CLI 0.4.5 is installed in Ubuntu-24.04 WSL at
  `/home/jerry/.local/bin/composio`; from Windows invoke it with
  `wsl --distribution Ubuntu-24.04 --exec /home/jerry/.local/bin/composio` followed
  by its arguments. Account login and individual app connections were not set
  up. Installing skills does not authorize external messages or account grants.
- Use the currently supported browser tools for visual checks. A bundled skill
  browser script does not override the active environment's tool restrictions.
- Verification is proportional to the change: build and type checks for code,
  actual browser checks for affected UI, and a clear report of any checks not run.
  Stop when the requested outcome and its checks are satisfied.

This file records project context and instructions; it is not a technical lock
or an access-control mechanism.

## Verification and remaining content gaps

Reviewed application source and the 20-commit history through `ba2d556` on
October 18, 2026. Before this file was added the working tree was clean.

- The maintenance pass adds reproducible verification with `npm run verify`,
  including Astro templates and generated local links. The example post remains
  excluded from the five-page static output.
- Numerical benchmarks compare the waveguide renderer with `ba2d556`; sampled
  pixels match, including a pointer pulse. Measurements exclude browser compositing.
- Browser validation covers mobile and desktop, both themes, hold/resume, motion
  pause, degree expansion, and project deep links. Scheduler tests cover offscreen,
  hidden-tab, reduced-motion, pause, resumption, and disposal combinations.
- Do not describe this as a full accessibility certification, physical-device
  touch test, cross-browser audit, or measured Core Web Vitals improvement.
- There is no resume PDF, profile photo, populated email link, published
  pickleball post, or side project yet. These are content slots, not build errors.
- The supplied resume sources resolve the old research date discrepancies:
  Stony Brook runs June 2022–March 2023, and Kaxiras January–August 2024.
- `fun-ideas/` is ignored now, but was tracked in commit `4a66a8b` and removed
  from the current tree in `92962d3`. Ignoring it does not remove historical
  versions. Do not expose its contents or rewrite history without a specific
  user request.
