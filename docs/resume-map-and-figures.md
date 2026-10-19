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

The initial two figures were copied from Jerry's public repositories. Their
captions describe what the figure depicts, without adding new numerical claims.
The full-resolution image is linked from the preview and original provenance is
linked from the caption where a public source exists.

- `public/projects/protein-states.png`: `JRZhang53/protein-hmm`, commit
  `b18836da07d9c5300b1f893820a2e641591479d9`,
  `reports/figures/by_K/K4/structure_colored_PF00076_Q8IUH3_23-202.png`.
- `public/projects/quantum-energy.png`: `JRZhang53/ML-for-Quantum-Heisenberg-Model`,
  commit `0bfc7e2de90671df32fb3959ad1a40062d7b3e9d`,
  `G-CNN/energy-sampling-accuracy.png`.

### Course figures

On October 18, 2026, Jerry authorized searching his course files for figures to
add to Projects. Four images were selected for existing course entries. They
remain inside the collapsed project details, with native full-size image links,
descriptive alt text, and course/report credits. The original plots are preserved;
no data, labels, or colors were redrawn. Only the selected images are bundled,
not the course directories, notebooks, or complete reports.

Source paths below are relative to the owner's local Schoolwork directory:

- `public/projects/spin-optimization.png`: `6 Spring 2026/Statistics 221/221project/Stat_221_Final_Project_Write_up.pdf`,
  page 9, Figure 3, embedded image `Im7.png` (2623 × 1823). Extracted directly
  using pypdf. This is the final-report comparison, not the preliminary plot.
  The Ising ferromagnet is a baseline within the broader spin-glass project;
  the caption notes that optimizer step scales differ.
- `public/projects/interpolation-error.png`: `5 Fall 2025/Applied Math 254/254final/generalization_error_n100_eps0.5_SNR4_sigma1_npn100_nrep100_seed42_gaussian.png`
  (3600 × 2400), copied unchanged. Caption describes the plotted Gaussian-feature
  comparison without claiming this particular run demonstrates multiple descents.
- `public/projects/filament-torsion.png`: `4 Spring 2025/Physics 230/final project/report.pdf`,
  page 8, Figure 5, embedded image `Im7.png` (1192 × 970). Extracted directly using
  pypdf. The source report credits Jerry Zhang and Yizhe Sun; the caption retains
  both names. This figure illustrates the base model's geometry, not a claim of
  successful feedback control.
- `public/projects/reaction-diffusion.png`: `3 Fall 2024/Applied Math 207/final project/report/figs/grayscott_equilibria.png`
  (1655 × 713), copied unchanged. The accompanying `report.tex` identifies the top
  row as stochastic (τ = 1) and the bottom row as deterministic; columns use
  (F, k) = (0.03, 0.06), (0.029, 0.057), and (0.03, 0.055).

The two PDF source pages and all four standalone figures were visually inspected.
Third-party photos and borrowed model diagrams in the reports were not selected.
