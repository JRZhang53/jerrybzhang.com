# Agent tooling for this website

Installed and checked on October 18, 2026. The tools live in the user's Codex
skill directory, outside this public website repository. New skills should be
available on the next turn; if the app does not discover them, restart it.

## Recommended setup

Keep one design lead and add a specialist for the task:

1. Use Front-end Design for a new section or a substantial visual change,
   grounded in the existing site and the constraints in `AGENTS.md`.
2. Use Make Interfaces Feel Better for spacing, hit areas, text wrapping,
   interaction states, and animation detail.
3. Explicitly invoke Impeccable for an audit, critique, responsive adaptation,
   or final polish of a named surface. Its current package contains 24 commands.
4. Use Taste or GPT Taste only when deliberately exploring a different visual
   direction. They are alternatives, not cumulative requirements.
5. Invoke Grill Me for a new idea that needs discovery, and architecture review
   for a concrete maintenance problem. Neither is a gate on routine edits.

Taste currently requires substantial imagery and motion; GPT Taste prescribes
sales-page structure and GSAP. Those defaults conflict with this site's quiet
personal presentation. The site's actual brief wins. No extra animation library,
stock photography, marketing sections, or factual claims should be introduced
just to satisfy a generic skill's checklist.

## Installed skills

| Skill name | Original source | Invocation |
| --- | --- | --- |
| `frontend-design` | [Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Automatic when relevant |
| `make-interfaces-feel-better` | [Jakub Krehel](https://github.com/jakubkrehel/make-interfaces-feel-better) | Automatic when relevant |
| `impeccable` | [Pbakaus / Impeccable](https://github.com/pbakaus/impeccable) | Explicit |
| `design-taste-frontend` | [Leonxlnx / Taste Skill](https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill) | Explicit |
| `gpt-taste` | [Leonxlnx / GPT Taste](https://github.com/Leonxlnx/taste-skill/tree/main/skills/gpt-tasteskill) | Explicit |
| `grill-me` | [Matt Pocock](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) | Explicit |
| `grilling` | [Grill Me dependency](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling) | Explicit or loaded by its parent workflow |
| `improve-codebase-architecture` | [Matt Pocock](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture) | Explicit |
| `codebase-design` | [Architecture dependency](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design) | Explicit or loaded by its parent workflow |
| `domain-modeling` | [Architecture dependency](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling) | Explicit or loaded by its parent workflow |
| `composio` | [Composio product/setup guidance](https://github.com/ComposioHQ/composio/tree/next/skills/composio) | Explicit |
| `composio-cli` | [Official CLI 0.4.5 release](https://github.com/ComposioHQ/composio/releases/tag/%40composio%2Fcli%400.4.5) | Explicit |

All source skill bodies are preserved. Local `agents/openai.yaml` metadata sets
`policy.allow_implicit_invocation: false` on optional workflows. Upstream license
and notice files are retained. No automatic edit hooks were installed.

## Example requests

- `Use $impeccable audit on the home hero for accessibility and mobile layout. Report findings first.`
- `Use $make-interfaces-feel-better for a quick review of navigation and the theme toggle.`
- `Use $grill-me to clarify this new side-project idea.`
- `Use $improve-codebase-architecture to review the simulation lifecycle. Focus on current friction.`
- `Use $design-taste-frontend to explore an alternative for this new standalone side project. Preserve the main site's identity.`

These are targeted workflows. A full-site redesign or architecture refactor is
not implied by installing them.

## Goals and repository alignment

Codex already has a native `/goal`; no third-party replacement was installed.
Use it for an explicitly requested persistent objective with a measurable end
state and verification. A normal prompt remains suitable for a small edit.
See [OpenAI's goal guide](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex).

`AGENTS.md` provides the repository context and scope constraints. It is ordinary
agent guidance, not an enforceable global lock. Tests and review supply evidence
that changes actually respect those constraints.

## Composio runtime

The [official CLI documentation](https://docs.composio.dev/docs/cli) requires WSL
on Windows. CLI 0.4.5 was installed into the existing Ubuntu-24.04 distribution
at `/home/jerry/.composio`, with an entry point at
`/home/jerry/.local/bin/composio`. The release ZIP and skill ZIP were checked
against the release's SHA-256 manifest. The complete runtime bundle was retained.

From PowerShell:

```powershell
wsl --distribution Ubuntu-24.04 --exec /home/jerry/.local/bin/composio --version
```

When an external-app task needs it, the next setup step is user login:

```powershell
wsl --distribution Ubuntu-24.04 --exec /home/jerry/.local/bin/composio login
```

Login and app connections were not performed during this installation. Composio
manages provider authentication but still requires the account owner's consent.
Use existing GitHub tooling for this site's routine Git work; add Composio
connections only for an actual cross-app task. No account integration is part
of the website's browser runtime or production dependencies.

## Reproducibility and checks

The Codex skill-installer helper installed GitHub source directories at these
fixed revisions; the generated CLI skill came from the verified release ZIP:

| Repository | Revision |
| --- | --- |
| `anthropics/skills` | `dbd4588f9e1033efb41dad4bef2f7947c8993d44` |
| `pbakaus/impeccable` | `08d5b470495d242ca0470f4aeae1956c3a074f83` |
| `Leonxlnx/taste-skill` | `f624f37a8c650b9cc550253104925efe4c8de246` |
| `jakubkrehel/make-interfaces-feel-better` | `35545ea1512ad59fa463e6b1f95ca9c052981fe6` |
| `mattpocock/skills` | `49dd158d1076134a641b33efb035946536778336` |
| `ComposioHQ/composio` guidance | `231122de19abd820eac91549382e407e2d2cbe06` |
| Composio CLI and generated skill | `@composio/cli@0.4.5` |

Local installation details and `SKILL.md` hashes are recorded in
`~/.codex/skill-installations/website-2026-10-18.json`.

Validation covered skill names/descriptions, companion files, invocation
metadata, and executable version probes. Impeccable's Windows engine reports
`impeccable-engine 0.1.15`; its skill metadata is version 4.6.0. Composio reports
`0.4.5`. These checks establish installation, not design quality or working
external account connections. The initial installation did not change website
source or dependencies. The subsequent authorized maintenance pass applied the
architecture, audit, optimization, and interface-polish workflows; current code
verification is `npm run verify`, as documented in the repository README.

When updating a skill, inspect upstream changes and preserve the explicit-use
metadata. Updates may otherwise restore broad automatic invocation. Keep the
sources pinned until deliberately updating them.
