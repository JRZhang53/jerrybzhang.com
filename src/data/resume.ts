// Shared content for the server-rendered resume, timeline, and regional map.
import type { ProjectId } from './projects';
export type Role = { title: string; years: string; start?: number; end?: number; upcoming?: boolean; points?: string[] };
export type Position = { id: string; org: string; place: string; location: LocationId; roles: Role[] };

/** Regional markers, not street addresses or a record of travel/residence. */
export const LOCATIONS = {
  minnesota: { name: 'Twin Cities', region: 'Minnesota', coordinates: [-93.27, 44.98] },
  cambridge: { name: 'Cambridge', region: 'Massachusetts', coordinates: [-71.11, 42.37] },
  newyork: { name: 'New York & Long Island', region: 'New York', coordinates: [-73.65, 40.86] },
  hampton: { name: 'Hampton', region: 'Virginia', coordinates: [-76.35, 37.03] },
  miami: { name: 'Miami', region: 'Florida', coordinates: [-80.19, 25.76] },
} as const;
export type LocationId = keyof typeof LOCATIONS;

// Harvard's line unfolds into this breakdown when clicked.
export const STUDIES = [
  { field: 'Physics', detail: 'AB, plus a concurrent AM (master’s)' },
  { field: 'Statistics', detail: 'AB, machine learning track' },
  { field: 'Computer Science', detail: 'Secondary field' },
];

export const EDUCATION: { id: string; school: string; details: string[]; studies?: string; years: string; start: number; end: number; location: LocationId; place: string }[] = [
  {
    id: 'harvard-education', start: 2023, end: 2027, location: 'cambridge', place: 'Cambridge, MA',
    school: 'Harvard University',
    details: [],
    /** Clickable label that unfolds STUDIES. */
    studies: 'Physics and Statistics',
    years: '2023 – 2027',
  },
  { id: 'minnesota-education', start: 2021, end: 2023, location: 'minnesota', place: 'Twin Cities, MN', school: 'University of Minnesota', details: ['Post-Secondary Enrollment Options (PSEO) dual enrollment'], years: '2021 – 2023' },
  { id: 'minnetonka-education', start: 2019, end: 2023, location: 'minnesota', place: 'Minnetonka, MN', school: 'Minnetonka Senior High School', details: ['High school diploma'], years: '2019 – 2023' },
];

export const EXPERIENCE: Position[] = [
  {
    id: 'hrt', location: 'newyork',
    org: 'Hudson River Trading',
    place: 'New York, NY',
    roles: [{ title: 'Algorithm Developer', years: 'After graduation', upcoming: true }],
  },
  {
    id: 'citadel', location: 'miami',
    org: 'Citadel Securities',
    place: 'Miami, FL',
    roles: [
      { title: 'Quantitative Research Intern', years: 'Summer 2026', start: 2026, end: 2026, points: ['Systematic equities monetization.'] },
    ],
  },
  {
    id: 'harvard-teaching', location: 'cambridge',
    org: 'Harvard University',
    place: 'Cambridge, MA',
    roles: [
      {
        title: 'Course Assistant',
        years: '2024 – 2026',
        start: 2024, end: 2026,
        points: [
          'Physics 16: Mechanics and Special Relativity',
          'Physics 153: Electrodynamics',
          'Physics 181: Statistical Mechanics and Thermodynamics',
        ],
      },
    ],
  },
];

// Stable IDs keep research links intact when project titles are edited.
export const RESEARCH: { id: string; org: string; title: string; years: string; project: ProjectId; start: number; end: number; location: LocationId; place: string }[] = [
  {
    id: 'nasa', start: 2025, end: 2025, location: 'hampton', place: 'Hampton, VA',
    org: 'NASA Langley Research Center',
    title: 'Research Intern',
    years: 'Summer 2025',
    project: 'ion-transport-in-polymer-electrolytes',
  },
  {
    id: 'kaxiras', start: 2023, end: 2024, location: 'cambridge', place: 'Cambridge, MA',
    org: 'Kaxiras Group, Harvard',
    title: 'Undergraduate Researcher',
    years: '2023 – 2024',
    project: 'computational-methods-for-quantum-many-body-problems',
  },
  {
    id: 'stony-brook', start: 2022, end: 2022, location: 'newyork', place: 'Stony Brook, NY',
    org: 'Stony Brook University',
    title: 'Research Intern, Garcia Summer Research Program',
    years: '2022',
    project: 'molecular-dynamics-of-soil-strengthening-hydrogels',
  },
];
