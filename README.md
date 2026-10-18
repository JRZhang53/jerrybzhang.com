# jerrybzhang.com

Personal website, built with [Astro](https://astro.build), [Motion](https://motion.dev), and [Kokonut UI](https://kokonutui.com), and hosted on GitHub Pages.

## Editing

| What | Where |
| --- | --- |
| Name, typewriter phrases, social links, nav | `src/data/site.ts` |
| Bio | `src/pages/index.astro` |
| Projects | `src/data/projects.ts` (stable `id`, title, and `kind`: research, course, or side). Keep IDs when renaming titles so saved links keep working. |
| Fun side projects | Put each in `public/fun/<name>/` with an `index.html`, then add it to `src/data/projects.ts` with `kind: 'side'` and `href: '/fun/<name>/'`. It goes live at jerrybzhang.com/fun/<name>/. |
| Pickleball posts (linked from the bio) | Copy `src/content/pickleball/example-post.md` to a new `.md` file and remove `draft: true`. Photos go in `public/pickleball/`. |
| Resume | Edit `src/data/resume.ts` for entries, year ranges, and regional locations. The map and chronological list stay synchronized. A PDF at `public/resume.pdf` adds a download alongside the HTML resume. Research references use typed project IDs. |
| Photo | Drop it at `public/me.jpg`, then uncomment the `<img>` in `src/pages/index.astro` |
| Colors and fonts | `src/styles/global.css` (the `@theme` block) |
| Home page hero | `src/components/Hero.tsx`. Each interest selects a simulation from the small registry in `src/components/interest-field/sims.ts`; each model has its own file beside it. |
| Kokonut UI components | `src/components/kokonutui/` (adapted: site colors, theme toggle restyled to match) |

## Adding Kokonut UI components

```bash
npx shadcn@latest add @kokonutui/<component-name>
```

Browse components at https://kokonutui.com. They are React components; use them in `.astro` pages with a `client:load` or `client:visible` directive so they run in the browser.

## Running locally

```bash
npm ci
npm run setup:projects  # initialize pinned side-project repos and their dependencies
npm run dev      # http://localhost:4321
npm run verify   # Astro/TypeScript check, regression tests, build, generated-site checks
```

Use Node 24 (the exact version is in `.node-version`). A project-local Node 24
development dependency also supplies the runtime for npm scripts on this Windows
machine, whose system Node is older. No global Node installation was changed.

The hero renders essential text before hydration. “Stay on this interest” holds
the phrase while its simulation stays interactive. “Pause motion” freezes both
typing and the background. OS reduced-motion preferences update live. Canvas
frames stop while the hero is offscreen or the tab is hidden.

The waveguide renderer precomputes geometry and the propagation of its two input
modes on resize, then combines them each frame. To reproduce the numerical
benchmark against the original revision (requires Git history):

```bash
npx --no-install tsx scripts/benchmark-simulations.ts
```

Local measurements of numerical `step + paint` were 2.3–2.6× faster, with identical
pixels at the sampled frames, including a launched pulse. This excludes browser
compositing. Precomputation shifts approximately 8–14 ms of work to resize.

## Deploying

Every push to `main` verifies, builds, and deploys automatically via
`.github/workflows/deploy.yml`. Pull requests run the same verification without
deploying. The checks cover Astro templates, simulation numerics, animation
lifetime, stable project references, generated local links, server-rendered hero
text, draft exclusion, and the custom domain.

The October 2026 maintenance pass upgraded Astro to 7.4 and its React integration
to 7.1 following the [Astro migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/).
HTML whitespace compression explicitly retains the previous behavior around inline
links. The existing static GitHub Pages output and site content are preserved.

Agent setup and skill provenance are in `AGENTS.md` and `docs/agent-tooling.md`.

Tree of Life is maintained in the separate public repository
[`JRZhang53/tree-of-life`](https://github.com/JRZhang53/tree-of-life), pinned here
as `apps/tree-of-life`. The build verifies it and copies only compiled files to
`dist/fun/tree-of-life/`. It is a scaffold until product implementation is ready;
it is not yet listed on Projects. Setup, local preview, and release instructions
are in [`docs/tree-of-life.md`](docs/tree-of-life.md).

## Domain (GoDaddy DNS)

The file `public/CNAME` tells GitHub Pages to serve the site at `jerrybzhang.com`.
At GoDaddy, under **Domain → DNS → DNS Records**, the records are:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | JRZhang53.github.io |

GoDaddy's default "Parked" A record for `@` must be deleted, or the domain will keep showing GoDaddy's parking page.
