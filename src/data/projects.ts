// Add, remove, or reorder projects here. /projects groups them by `kind`, in this order:
//   'research' – research work
//   'course'   – final projects for classes
//   'side'     – small things built for fun. Host each one in public/fun/<name>/ (an index.html
//                plus any scripts or assets) and set href to '/fun/<name>/'. This section only
//                appears once there's at least one side project.
export type Project = {
  name: string;
  kind: 'research' | 'course' | 'side';
  description: string;
  tags?: string[];
  href?: string; // live site, paper, or demo
  repo?: string; // source code
  year?: string;
};

/** Anchor for a project on /projects, e.g. /projects/#optimization-and-sampling-in-spin-glasses. */
export const projectId = (p: Pick<Project, 'name'>) =>
  p.name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const PROJECTS: Project[] = [
  {
    name: 'Latent structure in protein sequences via HMMs',
    kind: 'course',
    description:
      'How much of a protein’s 3D organization can a simple, interpretable model recover? Unsupervised hidden Markov models find recurring biochemical patterns in amino-acid sequences, and I compare their latent states against hydrophobicity, secondary structure, and solvent accessibility, alongside composition-based and supervised baselines.',
    tags: ['Statistics', 'Computational biology'],
    year: '2026',
  },
  {
    name: 'Optimization and sampling in spin glasses',
    kind: 'course',
    description:
      'Competing interactions give spin glasses rugged energy landscapes full of local minima. This project measures how temperature, disorder, and interaction structure affect discrete and gradient-based algorithms across four canonical spin models, and when each one gets trapped.',
    tags: ['Optimization', 'Statistical physics'],
    year: '2026',
  },
  {
    name: 'Multiple descent for minimum ℓ₁-norm interpolators',
    kind: 'course',
    description:
      'Heavily overparameterized models can keep improving well past the interpolation threshold. I reproduce prior multiple-descent results for Gaussian designs and extend them to study how signal sparsity and feature distributions drive a further drop in test error.',
    tags: ['Statistical learning theory'],
    year: '2025',
  },
  {
    name: 'Feedback and torsional growth of a 1D filament',
    kind: 'course',
    description:
      'Growing filaments can buckle and twist under mechanical constraints. Using simulations of a filament attached to a substrate, I test whether stress-based feedback on growth can keep it straight and stable.',
    tags: ['Biophysics', 'Simulation'],
    year: '2025',
  },
  {
    name: 'Pattern formation in nonlinear reaction-diffusion systems',
    kind: 'course',
    description:
      'A stochastic look at how patterns emerge in reaction-diffusion systems, using the spatial Gillespie algorithm with τ-leaping and extending standard models with nonlinear diffusion.',
    tags: ['Stochastic simulation'],
    year: '2024',
  },
  {
    name: 'Ion transport in polymer electrolytes',
    kind: 'research',
    description:
      'Research internship at NASA Langley on the SABERS solid-state battery project: high-performance computing simulations of how ions move through polymer electrolytes, plus a theoretical framework for the polymer models.',
    tags: ['Batteries', 'HPC simulation'],
    year: '2025',
  },
  {
    name: 'Computational methods for quantum many-body problems',
    kind: 'research',
    description:
      'Methods for spin-lattice systems such as the quantum Heisenberg model: symmetry reduction to speed up exact diagonalization, and a new variational Monte Carlo approach built on group-equivariant convolutional neural networks.',
    tags: ['Quantum physics', 'Machine learning'],
    year: '2024',
  },
  {
    name: 'Molecular dynamics of soil-strengthening hydrogels',
    kind: 'research',
    description:
      'Molecular dynamics simulations of polyelectrolyte-nanocomposite hydrogels built from bacterial biopolymers, studied as a lower-carbon alternative to concrete for soil adhesion and water retention.',
    tags: ['Molecular dynamics', 'Materials'],
    year: '2023',
  },
];
