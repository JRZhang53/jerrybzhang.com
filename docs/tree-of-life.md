# Tree of Life integration

Repository: https://github.com/JRZhang53/tree-of-life

Production path after a portfolio release: `https://jerrybzhang.com/fun/tree-of-life/`.
This setup does not publish the scaffold or change DNS.

## Ownership and local work

The implementation agent works in the independent sibling checkout
`C:/Users/Jerry/Documents/Website/tree-of-life`. It has its own Git history,
dependencies, CI, and development server. The portfolio consumes a separate
pinned checkout at `apps/tree-of-life`, so work in the agent's checkout cannot
silently change the portfolio build. Avoid developing in both copies at once.

The portfolio owns the submodule pointer, integration, Projects listing, and
deployment. The app agent owns the app and reports a verified release SHA.
Submodules pin commits; the `main` branch setting does not auto-update builds.

After cloning the portfolio:

```sh
npm ci
npm run setup:projects
npm run verify
```

The root build runs Astro, runs the child's `npm run verify`, and copies only
the child's `dist/` into `dist/fun/tree-of-life/`. Source and dependencies never
enter the published output. CI checks out submodules recursively and installs
both lockfiles. The child is public, so no cross-repository token is required.

## Local preview

For app development, run `npm run dev` inside the sibling repo and visit
`http://127.0.0.1:5173/fun/tree-of-life/`. The portfolio dev server on 4321
serves Astro; it does not proxy the child development server.

For the assembled production site, run `npm run verify` followed by
`npm run preview` in the portfolio and visit the displayed server URL plus
`/fun/tree-of-life/`. Use this to verify integration before publishing.

## Update to an implementation commit

First have the app agent verify and push its commit to the child repository.
Then, from the portfolio, replace `VERIFIED_COMMIT_SHA` below with that SHA:

```sh
git -C apps/tree-of-life fetch origin
git -C apps/tree-of-life checkout --detach VERIFIED_COMMIT_SHA
npm --prefix apps/tree-of-life ci
npm run verify
git add apps/tree-of-life
```

Review and commit that pointer change with any intentional integration changes.
On the first integration, also commit `.gitmodules`, the build script,
workflow, package script, TypeScript exclusion, documentation, and integration
test. Review existing portfolio changes separately; do not blindly stage all.
Publishing occurs when an approved portfolio commit is pushed to `main`.
To roll back, select the previous verified child SHA and repeat verification.

Do not pull a moving child branch during CI. Do not add duplicate source under
`public/fun/tree-of-life`, enable Pages in the child repo, add a second CNAME,
or give the child workflow a token to deploy the parent.

## Build and routing contract

- `npm ci`, `npm run verify`, and `dist/index.html` must remain supported.
- Vite's base is `/fun/tree-of-life/`; dynamic asset and data URLs use
  `import.meta.env.BASE_URL`.
- Hash routes or emitted HTML pages work on static Pages. Arbitrary history
  routes will 404 on refresh without additional hosting infrastructure.
- The app has no backend or secrets. Keep storage and service-worker scopes
  limited to this app.
- Add the public project listing and remove the child's scaffold `noindex`
  only when a real implementation is ready.
