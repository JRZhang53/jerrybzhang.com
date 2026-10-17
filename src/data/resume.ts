// Shown on /resume until a PDF is added at public/resume.pdf.
export type Role = { title: string; years: string; points?: string[] };
export type Position = { org: string; place?: string; roles: Role[] };

export const EDUCATION = [
  { school: 'Harvard University', detail: 'AB, Physics and Statistics (double concentration)', years: '2023 – 2027' },
  { school: 'University of Minnesota', detail: '', years: '2021 – 2023' },
  { school: 'Minnetonka Senior High School', detail: 'High school diploma', years: '2019 – 2023' },
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
    org: 'HackHarvard',
    place: 'Cambridge, MA',
    roles: [
      {
        title: 'Advisory Board',
        years: '2025 – 2026',
        points: [
          'Advised planning of HackHarvard 2025.',
          'Directed and coordinated HackHarvard events in China, Greece, Turkey, Saudi Arabia, Vietnam, and Mexico.',
        ],
      },
      {
        title: 'Co-Director',
        years: '2023 – 2024',
        points: ['Directed Harvard’s annual hackathon, led the undergraduate organizing team, and supervised event-day planning.'],
      },
      {
        title: 'Logistics Organizer',
        years: '2023',
        points: ['Ran registration, food, inventory, and competition-day logistics for 700+ competitors, staff, sponsors, and judges.'],
      },
    ],
  },
  {
    org: 'HMMT',
    place: 'Cambridge, MA',
    roles: [{ title: 'Staff', years: '2023 – 2024' }],
  },
  {
    org: 'RMC Academy',
    place: 'Northfield, MN',
    roles: [{ title: 'Art of Sciences Camp Counselor', years: 'Summer 2023' }],
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

export const HONORS = [
  { name: 'USAPhO Bronze Medal (twice)', from: 'American Association of Physics Teachers', year: '2022' },
  { name: 'Theoretical CS, 1st place', from: 'Carnegie Mellon Informatics and Mathematics Competition', year: '2022' },
  { name: 'AIME Qualifier; AMC 12 Distinguished Honor Roll', from: 'Mathematical Association of America', year: '' },
  { name: 'National Merit Scholar', from: 'National Merit Scholarship Corporation', year: '' },
  { name: 'Math League, 3rd place individual in state (twice)', from: 'Minnesota State High School Mathematics League', year: '' },
  { name: 'Individual All-Star Award', from: 'Minnesota High School Quiz Bowl League', year: '' },
  { name: 'National German Exam Gold Medal', from: 'American Association of Teachers of German', year: '' },
  { name: 'Presidential Volunteer Service Gold Award (twice)', from: '', year: '' },
];

export const LANGUAGES = ['English (native)', 'Chinese (native)', 'German (elementary)'];
