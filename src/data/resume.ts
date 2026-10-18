// Shown on /resume until a PDF is added at public/resume.pdf.
export type Role = { title: string; years: string; points?: string[] };
export type Position = { org: string; place?: string; roles: Role[] };

// Harvard's line unfolds into this breakdown when clicked.
export const STUDIES = [
  { field: 'Physics', detail: 'AB, plus a concurrent AM (master’s)' },
  { field: 'Statistics', detail: 'AB, machine learning track' },
  { field: 'Computer Science', detail: 'Secondary field' },
];

export const EDUCATION: { school: string; details: string[]; studies?: string; years: string }[] = [
  {
    school: 'Harvard University',
    details: [],
    /** Clickable label that unfolds STUDIES. */
    studies: 'Physics and Statistics',
    years: '2023 – 2027',
  },
  { school: 'University of Minnesota', details: ['Post-Secondary Enrollment Options (PSEO) dual enrollment'], years: '2021 – 2023' },
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

// Each links to the named project's write-up on /projects.
export const RESEARCH: { org: string; title: string; years: string; project: string }[] = [
  {
    org: 'NASA Langley Research Center',
    title: 'Research Intern',
    years: 'Summer 2025',
    project: 'Ion transport in polymer electrolytes',
  },
  {
    org: 'Kaxiras Group, Harvard',
    title: 'Undergraduate Researcher',
    years: '2023 – 2024',
    project: 'Computational methods for quantum many-body problems',
  },
  {
    org: 'Stony Brook University',
    title: 'Research Intern, Garcia Summer Research Program',
    years: '2022',
    project: 'Molecular dynamics of soil-strengthening hydrogels',
  },
];
