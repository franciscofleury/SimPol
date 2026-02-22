import { ElectionType } from './types';

export interface ElectionEvent {
  year: number;
  types: ElectionType[];
}

// Full 12-year electoral calendar
const FULL_CALENDAR: ElectionEvent[] = [
  { year: 0, types: ['DEPUTIES', 'SENATORS'] },
  { year: 2, types: ['GOVERNORS'] },
  { year: 4, types: ['DEPUTIES'] },
  { year: 6, types: ['GOVERNORS', 'SENATORS'] },
  { year: 8, types: ['DEPUTIES'] },
  { year: 10, types: ['GOVERNORS'] },
  { year: 12, types: ['DEPUTIES', 'SENATORS'] },
];

/**
 * Get elections scheduled for a given year, respecting max rounds.
 */
export function getElectionsForYear(year: number): ElectionEvent | null {
  const event = FULL_CALENDAR.find((e) => e.year === year);
  return event ?? null;
}

/**
 * Check if a given year has any elections.
 */
export function hasElections(year: number): boolean {
  return getElectionsForYear(year) !== null;
}

/**
 * Get all election events up to and including maxYear.
 */
export function getCalendarUpTo(maxYear: number): ElectionEvent[] {
  return FULL_CALENDAR.filter((e) => e.year <= maxYear);
}

/**
 * Governor term: 4 years. Returns the year the governor's term expires.
 */
export function governorTermEnd(electedYear: number): number {
  return electedYear + 4;
}

/**
 * Senator term: 6 years.
 */
export function senatorTermEnd(electedYear: number): number {
  return electedYear + 6;
}

/**
 * Deputy term: 4 years.
 */
export function deputyTermEnd(electedYear: number): number {
  return electedYear + 4;
}
