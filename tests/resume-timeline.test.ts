import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOCATIONS } from '../src/data/resume';
import { RESUME_ENTRIES, YEARS, durationRange } from '../src/lib/resume-timeline';

test('incoming roles never acquire an invented date or finite duration', () => {
  const upcoming = RESUME_ENTRIES.filter((e) => e.upcoming);
  assert.equal(upcoming.length, 1);
  assert.equal(upcoming[0].org, 'Hudson River Trading');
  assert.equal(durationRange(upcoming[0]), null);
  assert.equal(upcoming[0].start, undefined);
  assert.equal(upcoming[0].end, undefined);
});

test('timeline bounds, complete month dates, locations, and unique IDs remain consistent', () => {
  assert.equal(new Set(RESUME_ENTRIES.map((e) => e.id)).size, RESUME_ENTRIES.length);
  for (const entry of RESUME_ENTRIES) {
    assert.ok(LOCATIONS[entry.location]);
    const range = durationRange(entry);
    if (entry.upcoming) continue;
    assert.ok(range, `missing month precision for ${entry.id}`);
    assert.ok(range.left >= 0 && range.width > 0 && range.left + range.width <= 100.00001);
  }
});

test('documented months produce short internships and correct cross-year spans', () => {
  const expectedMonths: Record<string, number> = {
    'citadel-0': 3, nasa: 4, kaxiras: 8, 'stony-brook': 10,
    'harvard-teaching-0': 22, 'harvard-education': 45,
    'minnesota-education': 21, 'minnetonka-education': 46,
  };
  for (const [id, months] of Object.entries(expectedMonths)) {
    const range = durationRange(RESUME_ENTRIES.find((entry) => entry.id === id)!);
    assert.ok(range);
    assert.ok(Math.abs(range.width / 100 * YEARS.length * 12 - months) < 0.00001, id);
  }
  const citadel = durationRange(RESUME_ENTRIES.find((entry) => entry.id === 'citadel-0')!)!;
  assert.ok(Math.abs(citadel.left / 100 * YEARS.length * 12 - 89) < 0.00001,
    'June 2026 starts 89 months after January 2019');
});
