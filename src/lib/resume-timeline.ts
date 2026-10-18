import { EDUCATION, EXPERIENCE, RESEARCH, type LocationId } from '../data/resume';
import type { ProjectId } from '../data/projects';

export type ResumeEntry = {
  id: string;
  category: 'Education' | 'Experience' | 'Research';
  org: string;
  role: string;
  years: string;
  place: string;
  location: LocationId;
  start?: number;
  end?: number;
  upcoming?: boolean;
  points?: string[];
  studies?: boolean;
  project?: ProjectId;
};
export type YearSelection = 'all' | 'upcoming' | number;

export const RESUME_ENTRIES: ResumeEntry[] = [
  ...EDUCATION.map((e): ResumeEntry => ({ ...e, category: 'Education', org: e.school,
    role: e.studies ?? e.details[0] ?? '', studies: !!e.studies })),
  ...EXPERIENCE.flatMap((e) => e.roles.map((r, i): ResumeEntry => ({ ...r,
    id: `${e.id}-${i}`, category: 'Experience', org: e.org, role: r.title,
    location: e.location, place: e.place }))),
  ...RESEARCH.map((e): ResumeEntry => ({ ...e, category: 'Research', role: e.title })),
].sort((a, b) => Number(!!b.upcoming) - Number(!!a.upcoming)
  || (b.start ?? 0) - (a.start ?? 0) || (b.end ?? 0) - (a.end ?? 0));

export const FIRST_YEAR = Math.min(...RESUME_ENTRIES.flatMap((e) => e.start === undefined ? [] : [e.start]));
export const LAST_YEAR = Math.max(...RESUME_ENTRIES.flatMap((e) => e.end === undefined ? [] : [e.end]));
export const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

export function activeInYear(entry: ResumeEntry, year: YearSelection): boolean {
  if (year === 'all') return true;
  if (year === 'upcoming') return !!entry.upcoming;
  return !entry.upcoming && entry.start !== undefined && entry.end !== undefined
    && entry.start <= year && entry.end >= year;
}

/** Inclusive calendar years only: do not imply invented month-level dates. */
export function durationRange(entry: ResumeEntry) {
  if (entry.upcoming || entry.start === undefined || entry.end === undefined) return null;
  return { left: (entry.start - FIRST_YEAR) / YEARS.length * 100,
    width: (entry.end - entry.start + 1) / YEARS.length * 100 };
}

export function availableLocations(year: YearSelection): LocationId[] {
  return [...new Set(RESUME_ENTRIES.filter((e) => activeInYear(e, year)).map((e) => e.location))];
}
