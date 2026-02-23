import { describe, it, expect } from 'vitest';
import {
  getElectionsForYear,
  hasElections,
  getCalendarUpTo,
  governorTermEnd,
  senatorTermEnd,
  deputyTermEnd,
} from '../calendar';

describe('getElectionsForYear', () => {
  it('returns DEPUTIES and SENATORS for year 0', () => {
    const result = getElectionsForYear(0);
    expect(result).not.toBeNull();
    expect(result!.types).toContain('DEPUTIES');
    expect(result!.types).toContain('SENATORS');
  });

  it('returns GOVERNORS for year 2', () => {
    const result = getElectionsForYear(2);
    expect(result).not.toBeNull();
    expect(result!.types).toEqual(['GOVERNORS']);
  });

  it('returns DEPUTIES for year 4', () => {
    const result = getElectionsForYear(4);
    expect(result).not.toBeNull();
    expect(result!.types).toEqual(['DEPUTIES']);
  });

  it('returns GOVERNORS and SENATORS for year 6', () => {
    const result = getElectionsForYear(6);
    expect(result).not.toBeNull();
    expect(result!.types).toContain('GOVERNORS');
    expect(result!.types).toContain('SENATORS');
  });

  it('returns DEPUTIES for year 8', () => {
    const result = getElectionsForYear(8);
    expect(result).not.toBeNull();
    expect(result!.types).toEqual(['DEPUTIES']);
  });

  it('returns GOVERNORS for year 10', () => {
    const result = getElectionsForYear(10);
    expect(result).not.toBeNull();
    expect(result!.types).toEqual(['GOVERNORS']);
  });

  it('returns DEPUTIES and SENATORS for year 12', () => {
    const result = getElectionsForYear(12);
    expect(result).not.toBeNull();
    expect(result!.types).toContain('DEPUTIES');
    expect(result!.types).toContain('SENATORS');
  });

  it('returns null for year 1', () => {
    expect(getElectionsForYear(1)).toBeNull();
  });

  it('returns null for year 3', () => {
    expect(getElectionsForYear(3)).toBeNull();
  });

  it('returns null for year 5', () => {
    expect(getElectionsForYear(5)).toBeNull();
  });

  it('returns null for year 7', () => {
    expect(getElectionsForYear(7)).toBeNull();
  });

  it('returns null for year 9', () => {
    expect(getElectionsForYear(9)).toBeNull();
  });

  it('returns null for year 11', () => {
    expect(getElectionsForYear(11)).toBeNull();
  });

  it('returns null for year beyond the calendar (year 13)', () => {
    expect(getElectionsForYear(13)).toBeNull();
  });
});

describe('hasElections', () => {
  it('returns true for all election years', () => {
    for (const year of [0, 2, 4, 6, 8, 10, 12]) {
      expect(hasElections(year), `year ${year}`).toBe(true);
    }
  });

  it('returns false for all non-election years', () => {
    for (const year of [1, 3, 5, 7, 9, 11]) {
      expect(hasElections(year), `year ${year}`).toBe(false);
    }
  });
});

describe('getCalendarUpTo', () => {
  it('returns only year 0 when maxYear=0', () => {
    const result = getCalendarUpTo(0);
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(0);
  });

  it('returns years 0, 2, 4 when maxYear=4', () => {
    const result = getCalendarUpTo(4);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.year)).toEqual([0, 2, 4]);
  });

  it('returns all 7 events when maxYear=12', () => {
    const result = getCalendarUpTo(12);
    expect(result).toHaveLength(7);
  });

  it('returns correct events when maxYear=8', () => {
    const result = getCalendarUpTo(8);
    expect(result.map((e) => e.year)).toEqual([0, 2, 4, 6, 8]);
  });

  it('includes events exactly at maxYear boundary', () => {
    const result = getCalendarUpTo(6);
    const years = result.map((e) => e.year);
    expect(years).toContain(6);
  });
});

describe('term end functions', () => {
  it('governorTermEnd adds 4 years from year 0', () => {
    expect(governorTermEnd(0)).toBe(4);
  });

  it('governorTermEnd adds 4 years from year 6', () => {
    expect(governorTermEnd(6)).toBe(10);
  });

  it('senatorTermEnd adds 6 years from year 0', () => {
    expect(senatorTermEnd(0)).toBe(6);
  });

  it('senatorTermEnd adds 6 years from year 6', () => {
    expect(senatorTermEnd(6)).toBe(12);
  });

  it('deputyTermEnd adds 4 years from year 0', () => {
    expect(deputyTermEnd(0)).toBe(4);
  });

  it('deputyTermEnd adds 4 years from year 4', () => {
    expect(deputyTermEnd(4)).toBe(8);
  });
});
