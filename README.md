# jerrybzhang.com

Personal website, built with [Astro](https://astro.build), [Motion](https://motion.dev), and [Kokonut UI](https://kokonutui.com), and hosted on GitHub Pages.

## Editing

| What | Where |
| --- | --- |
| Name, typewriter phrases, social links, nav | `src/data/site.ts` |
| Bio | `src/pages/index.astro` |
| Projects | `src/data/projects.ts` |
| Blog posts | `src/content/blog/*.md` (add a new `.md` file) |
| Resume | Drop a PDF at `public/resume.pdf` |
| Photo | Drop it at `public/me.jpg`, then uncomment the `<img>` in `src/pages/index.astro` |
| Colors and fonts | `src/styles/global.css` (the `@theme` block) |
| Home page hero animation | `src/components/Hero.tsx` |
| Kokonut UI components | `src/components/kokonutui/` (adapted: site colors, plain links instead of Next.js) |

## Adding Kokonut UI components

```bash
npx shadcn@latest add @kokonutui/<component-name>
```

Browse components at https://kokonutui.com. They are React components; use them in `.astro` pages with a `client:load` or `client:visible` directive so they run in the browser.

## Running locally

```bash
npm install
npm run dev      # http://localhost:4321
```

## Deploying

Every push to `main` builds and deploys automatically via `.github/workflows/deploy.yml`.

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
