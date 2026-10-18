// Shown on /resume until a PDF is added at public/resume.pdf.
export type Role = { title: string; years: string; points?: string[] };
export type Position = { org: string; place?: string; roles: Role[] };

export const EDUCATION: { school: string; details: string[]; years: string }[] = [
  {
    school: 'Harvard University',
    details: [
      'AB in Physics and Statistics (machine learning track)',
      'Concurrent AM in Physics',
      'Secondary in Computer Science',
    ],
    years: '2023 – 2027',
  },
  { school: 'University of Minnesota', details: [], years: '2021 – 2023' },
  { school: 'Minnetonka Senior High School', details: ['High school diploma'], years: '2019 – 2023' },
];

export const EXPERIENCE: Position[] = [
  {
    org: 'Hudson River Trading',
    place: 'New York, NY',
    roles: [{ title: 'Algorithm Developer (incoming)', years: 'After graduation' }],
  },
  {
    org: 'Citadel Securities',
    place: 'Miami, FL',
    roles: [
      { title: 'Quantitative Research Intern', years: 'Summer 2026', points: ['Systematic equities monetization.'] },
    ],
  },
  {
    org: 'Harvard University',
    place: 'Cambridge, MA',
    roles: [
      {
        title: 'Course Assistant',
        years: '2024 – 2026',
        points: [
          'Physics 16: Mechanics and Special Relativity',
          'Physics 153: Electrodynamics',
          'Physics 181: Statistical Mechanics and Thermodynamics',
        ],
      },
    ],
  },
];

export const RESEARCH: Position[] = [
  {
    org: 'NASA Langley Research Center',
    place: 'Hampton, VA',
    roles: [
      {
        title: 'Research Intern',
        years: 'Summer 2025',
        points: [
          'Studied ion transport in polymer electrolytes for solid-state batteries, as part of the SABERS project.',
          'Ran high-performance computing simulations and developed a theoretical framework for the polymer models.',
        ],
      },
    ],
  },
  {
    org: 'Kaxiras Group, Harvard',
    place: 'Cambridge, MA',
    roles: [
      {
        title: 'Undergraduate Researcher',
        years: '2023 – 2024',
        points: [
          'Built a framework for solving quantum many-body systems with machine learning.',
          'Used physics-informed neural networks and group-equivariant CNNs in PyTorch to study criticality and phase transitions in magnetic systems.',
          'Applied representation theory to speed up exact diagonalization of the quantum Heisenberg model.',
        ],
      },
    ],
  },
  {
    org: 'Stony Brook University',
    roles: [
      {
        title: 'Research Intern, Garcia Summer Research Program',
        years: '2022',
        points: [
          'Computational materials science research with Dr. Dilip Gersappe.',
          'Gave an oral presentation at the Fall 2022 Materials Research Society meeting.',
          'Published a paper on sustainability and development ethics in the JESTI journal.',
        ],
      },
    ],
  },
];
