import { EDUCATION, EXPERIENCE, RESEARCH, type LocationId, type DatedPeriod } from '../data/resume';
import type { ProjectId } from '../data/projects';

export type ResumeEntry = {
  id: string;
  category: 'Education' | 'Experience' | 'Research';
  org: string;
  role: string;
  years: string;
  place: string;
  location: LocationId;
  upcoming?: boolean;
  points?: string[];
  studies?: boolean;
  project?: ProjectId;
} & Partial<DatedPeriod>;

export const RESUME_ENTRIES: ResumeEntry[] = [
  ...EDUCATION.map((e): ResumeEntry => ({ ...e, category: 'Education', org: e.school,
    role: e.studies ?? e.details[0] ?? '', studies: !!e.studies })),
  ...EXPERIENCE.flatMap((e) => e.roles.map((r, i): ResumeEntry => ({ ...r,
    id: `${e.id}-${i}`, category: 'Experience', org: e.org, role: r.title,
    location: e.location, place: e.place }))),
  ...RESEARCH.map((e): ResumeEntry => ({ ...e, category: 'Research', role: e.title })),
].sort((a, b) => Number(!!b.upcoming) - Number(!!a.upcoming)
  || ((b.start ?? 0) * 12 + (b.startMonth ?? 0)) - ((a.start ?? 0) * 12 + (a.startMonth ?? 0)));

export const FIRST_YEAR = Math.min(...RESUME_ENTRIES.flatMap((e) => e.start === undefined ? [] : [e.start]));
export const LAST_YEAR = Math.max(...RESUME_ENTRIES.flatMap((e) => e.end === undefined ? [] : [e.end]));
export const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

/** Inclusive calendar months; year labels mark equal twelve-month columns. */
export function durationRange(entry: ResumeEntry) {
  if (entry.upcoming || entry.start === undefined || entry.end === undefined
    || entry.startMonth === undefined || entry.endMonth === undefined) return null;
  const start = (entry.start - FIRST_YEAR) * 12 + entry.startMonth - 1;
  const end = (entry.end - FIRST_YEAR) * 12 + entry.endMonth;
  return { left: start / (YEARS.length * 12) * 100,
    width: (end - start) / (YEARS.length * 12) * 100 };
}
