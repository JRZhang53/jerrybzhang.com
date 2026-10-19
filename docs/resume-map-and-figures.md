# Resume map and project figures

The resume keeps nine education, work, and research entries in server-rendered
native details elements. One Gantt chart shares a horizontal year scale, with
experience in cobalt, education in teal, and research in purple. Only research
tied to an experience appears here (NASA, Kaxiras, and Stony Brook), with links
to its project details. Standalone course projects remain on Projects.
Dates and roles are in each row's accessible label and expanded details; color
is supplemented by category text in the details. Mobile retains the chart with
horizontal scrolling and sticky row labels. React adds
regional map selection and navigation back to individual entries. The map is
collapsed by default on all screen sizes; opening an entry updates its location.
Entry disclosures work without JavaScript. Projects use the same progressive
disclosure pattern, retaining full descriptions and figures inside each row.
Project hash navigation automatically opens the linked entry.
Bars use inclusive calendar months on a shared monthly scale, with annual grid
labels. Incoming HRT has no confirmed start date or duration and has no bar.

Month ranges were recovered from the owner's Project Resume, Skills Resume,
and CV TeX sources on October 18, 2026. Only dates needed for existing public
entries were transferred; the source resumes are not bundled or published.
The owner confirmed Harvard's September 2023 start and the May 2026 teaching
end; the CV records the teaching start as August 2024.

| Entry | Date range |
| --- | --- |
| Harvard education | September 2023 – May 2027 (expected) |
| Minnesota PSEO | September 2021 – May 2023 |
| Minnetonka | September 2019 – June 2023 |
| Citadel | June – August 2026 |
| Harvard teaching | August 2024 – May 2026 |
| NASA | May – August 2025 |
| Kaxiras | January – August 2024 |
| Stony Brook / Garcia | June 2022 – March 2023 |

`src/data/resume.ts` is the source of resume content and location metadata.
`src/lib/resume-timeline.ts` derives chronological entries and bar ranges.
`ResumeExplorer.tsx` coordinates the UI; `ResumeMap.tsx` renders locally
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

The Stony Brook range now includes its documented continuation into March 2023;
its project's 2023 label remains consistent with that end year. Kaxiras's former
2023–2024 label is corrected to the documented January–August 2024 period.

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
