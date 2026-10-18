# Resume map and project figures

The resume keeps all nine entries in server-rendered HTML. React adds a year
selector, regional map, synchronized selections, and mobile map disclosure.
Dates remain at their original precision. A bar covers inclusive calendar years;
it does not assert exact start/end months. Incoming HRT has no invented start
date or duration and appears only in All years and Upcoming.

`src/data/resume.ts` is the source of resume content and location metadata.
`src/lib/resume-timeline.ts` derives the chronological entries and selection
logic. `ResumeExplorer.tsx` coordinates the UI; `ResumeMap.tsx` renders locally
bundled map geometry. Map controls are keyboard operable. Selection moves the
map slightly only after explicit input, respecting reduced motion. Print mode
includes all entries and expanded degrees, with controls and the map removed.
A future PDF is an additional download; it no longer replaces the HTML resume.

## Location precision

Markers represent institutional regions, not personal residence or travel.
Harvard education, teaching, and Kaxiras research share Cambridge. University
of Minnesota and Minnetonka High School share the Twin Cities region. HRT
and Stony Brook share a New York/Long Island regional marker; the entries retain
their distinct city labels. Employment cities already existed in resume data.

Institution sources checked October 18, 2026:
- NASA Langley, Hampton: https://www.nasa.gov/langley/
- Stony Brook Garcia program: https://www.stonybrook.edu/garcia/
- Minnetonka High School: https://www.minnetonkaschools.org/schools/high-school/mhs/office

The existing 2022 Stony Brook resume date and 2023 project date remain unchanged.

## Map data

Map boundaries come from `us-atlas` (2017 U.S. Census cartographic boundaries),
https://github.com/topojson/us-atlas. Run
`node scripts/generate-resume-map.mjs` under Node 24 to regenerate the checked-in
`src/data/resume-map.json`. D3 and TopoJSON are development-only generators;
the site makes no tile, geocoding, or mapping-service requests. No API key is needed.
The ISC notice is retained in `public/licenses/us-atlas.txt`.

## Figures

Figures were copied without alteration from Jerry's public repositories. Their
captions describe what the figure depicts, without adding new numerical claims.
The full-resolution image is linked from the preview and original provenance is
linked from the caption. No unpublished material or private ideas were used.

- `public/projects/protein-states.png`: `JRZhang53/protein-hmm`, commit
  `b18836da07d9c5300b1f893820a2e641591479d9`,
  `reports/figures/by_K/K4/structure_colored_PF00076_Q8IUH3_23-202.png`.
- `public/projects/quantum-energy.png`: `JRZhang53/ML-for-Quantum-Heisenberg-Model`,
  commit `0bfc7e2de90671df32fb3959ad1a40062d7b3e9d`,
  `G-CNN/energy-sampling-accuracy.png`.
