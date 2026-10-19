// Add, remove, or reorder projects here. /projects groups them by `kind`, in this order:
//   'research' – research work
//   'course'   – final projects for classes
//   'side'     – small things built for fun. Host each one in public/fun/<name>/ (an index.html
//                plus any scripts or assets) and set href to '/fun/<name>/'. This section only
//                appears once there's at least one side project.
export type Project = {
  /** Stable public anchor: do not change when editing the title. */
  id: string;
  name: string;
  /** Optional mathematical display title; name stays plain for links and labels. */
  mathName?: string;
  kind: 'research' | 'course' | 'side';
  description: string;
  tags?: string[];
  href?: string; // live site, paper, or demo
  repo?: string; // source code
  year?: string;
  figure?: { src: string; alt: string; caption: string; width: number; height: number; source?: string; credit?: string; wide?: boolean };
};

export const PROJECTS = [
  {
    id: 'tree-of-life',
    name: 'Tree of Life',
    kind: 'side',
    description:
      'A collection of small biology experiments: herd sheep, grow coral, follow ant trails, or see how a vine finds its support. Change the rules and compare what happens across twelve organisms and twenty-eight models.',
    href: '/fun/tree-of-life/',
    repo: 'https://github.com/JRZhang53/tree-of-life',
    tags: ['Biology', 'Simulation'],
    year: '2026',
  },
  {
    id: 'latent-structure-in-protein-sequences-via-hmms',
    name: 'Latent structure in protein sequences via HMMs',
    repo: 'https://github.com/JRZhang53/protein-hmm',
    figure: {
      src: '/projects/protein-states.png', width: 3310, height: 2147,
      alt: 'RRM protein structure with residues colored by latent HMM state: buried hydrophobic residues in red and acidic surface residues in green.',
      caption: 'A four-state HMM mapped onto an RRM protein structure.',
      source: 'https://github.com/JRZhang53/protein-hmm/blob/b18836da07d9c5300b1f893820a2e641591479d9/reports/figures/by_K/K4/structure_colored_PF00076_Q8IUH3_23-202.png',
    },
    kind: 'course',
    description:
      'How much of a protein’s 3D organization can a simple, interpretable model recover? Unsupervised hidden Markov models find recurring biochemical patterns in amino-acid sequences, and I compare their latent states against hydrophobicity, secondary structure, and solvent accessibility, alongside composition-based and supervised baselines.',
    tags: ['Statistics', 'Computational biology'],
    year: '2026',
  },
  {
    id: 'optimization-and-sampling-in-spin-glasses',
    name: 'Optimization and sampling in spin glasses',
    figure: {
      src: '/projects/spin-optimization.png', width: 2623, height: 1823, wide: true,
      alt: 'Four plots comparing best energy across optimization steps for simulated annealing, greedy descent, gradient descent, and Adam on a 196-spin Ising ferromagnet.',
      caption: 'An Ising baseline: four optimizers approach different final energies. Each panel uses its own step scale.',
      credit: 'STAT 221 final report, Figure 3.',
    },
    kind: 'course',
    description:
      'Competing interactions give spin glasses rugged energy landscapes full of local minima. This project measures how temperature, disorder, and interaction structure affect discrete and gradient-based algorithms across four canonical spin models, and when each one gets trapped.',
    tags: ['Optimization', 'Statistical physics'],
    year: '2026',
  },
  {
    id: 'multiple-descent-for-minimum-l1-norm-interpolators',
    name: 'Multiple descent for minimum ℓ₁-norm interpolators',
    mathName: String.raw`Multiple descent for minimum $\ell_1$-norm interpolators`,
    figure: {
      src: '/projects/interpolation-error.png', width: 3600, height: 2400, wide: true,
      alt: 'Log-scale generalization error plus one against the feature-to-sample ratio, comparing minimum L1- and L2-norm estimators for Gaussian features. Both peak near a ratio of one.',
      caption: String.raw`Generalization error near and beyond the interpolation threshold, comparing minimum $\ell_1$- and $\ell_2$-norm estimators with Gaussian features.`,
      credit: 'APMTH 254 final project.',
    },
    kind: 'course',
    description:
      'Heavily overparameterized models can keep improving well past the interpolation threshold. I reproduce prior multiple-descent results for Gaussian designs and extend them to study how signal sparsity and feature distributions drive a further drop in test error.',
    tags: ['Statistical learning theory'],
    year: '2025',
  },
  {
    id: 'feedback-and-torsional-growth-of-a-1d-filament',
    name: 'Feedback and torsional growth of a 1D filament',
    figure: {
      src: '/projects/filament-torsion.png', width: 1192, height: 970, wide: true,
      alt: 'Stretching, curvature, and torsion along a filament beside its simulated three-dimensional shape, with a reversal in winding direction around a vertical substrate.',
      caption: 'A reversal in winding direction appears alongside a change in torsion along the simulated filament.',
      credit: 'Jerry Zhang and Yizhe Sun · APMTH 230 final report, Figure 5.',
    },
    kind: 'course',
    description:
      'Growing filaments can buckle and twist under mechanical constraints. Using simulations of a filament attached to a substrate, I test whether stress-based feedback on growth can keep it straight and stable.',
    tags: ['Biophysics', 'Simulation'],
    year: '2025',
  },
  {
    id: 'pattern-formation-in-nonlinear-reaction-diffusion-systems',
    name: 'Pattern formation in nonlinear reaction-diffusion systems',
    figure: {
      src: '/projects/reaction-diffusion.png', width: 1655, height: 713, wide: true,
      alt: 'Six Gray–Scott concentration maps: stochastic simulations in the top row and deterministic simulations below, showing spots and connected stripe patterns across three parameter settings.',
      caption: 'Gray–Scott patterns at three feed and kill rates: stochastic simulations above, deterministic simulations below.',
      credit: 'APMTH 207 final project.',
    },
    kind: 'course',
    description:
      String.raw`A stochastic look at how patterns emerge in reaction-diffusion systems, using the spatial Gillespie algorithm with $\tau$-leaping and extending standard models with nonlinear diffusion.`,
    tags: ['Stochastic simulation'],
    year: '2024',
  },
  {
    id: 'ion-transport-in-polymer-electrolytes',
    name: 'Ion transport in polymer electrolytes',
    kind: 'research',
    description:
      'Research internship at NASA Langley on the SABERS solid-state battery project: high-performance computing simulations of how ions move through polymer electrolytes, plus a theoretical framework for the polymer models.',
    tags: ['Batteries', 'HPC simulation'],
    year: '2025',
  },
  {
    id: 'computational-methods-for-quantum-many-body-problems',
    name: 'Computational methods for quantum many-body problems',
    repo: 'https://github.com/JRZhang53/ML-for-Quantum-Heisenberg-Model',
    figure: {
      src: '/projects/quantum-energy.png', width: 2000, height: 490, wide: true,
      alt: 'Four density plots of energy estimates for batch sizes 5, 10, 20, and 100, with increasingly concentrated distributions.',
      caption: 'Energy-estimate distributions at four sampling batch sizes.',
      source: 'https://github.com/JRZhang53/ML-for-Quantum-Heisenberg-Model/blob/0bfc7e2de90671df32fb3959ad1a40062d7b3e9d/G-CNN/energy-sampling-accuracy.png',
    },
    kind: 'research',
    description:
      'Methods for spin-lattice systems such as the quantum Heisenberg model: symmetry reduction to speed up exact diagonalization, and a new variational Monte Carlo approach built on group-equivariant convolutional neural networks.',
    tags: ['Quantum physics', 'Machine learning'],
    year: '2024',
  },
  {
    id: 'molecular-dynamics-of-soil-strengthening-hydrogels',
    name: 'Molecular dynamics of soil-strengthening hydrogels',
    kind: 'research',
    description:
      'Molecular dynamics simulations of polyelectrolyte-nanocomposite hydrogels built from bacterial biopolymers, studied as a lower-carbon alternative to concrete for soil adhesion and water retention.',
    tags: ['Molecular dynamics', 'Materials'],
    year: '2023',
  },
] as const satisfies readonly Project[];

export type ProjectId = (typeof PROJECTS)[number]['id'];
export const projectHref = (id: ProjectId) => `/projects/#${id}`;
