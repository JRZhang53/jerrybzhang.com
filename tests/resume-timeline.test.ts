import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOCATIONS } from '../src/data/resume';
import { RESUME_ENTRIES, YEARS, activeInYear, availableLocations, durationRange } from '../src/lib/resume-timeline';

test('year selection includes overlapping study, teaching, and research', () => {
  assert.deepEqual(RESUME_ENTRIES.filter((e) => activeInYear(e, 2025)).map((e) => e.id).sort(),
    ['harvard-education', 'harvard-teaching-0', 'nasa']);
  assert.deepEqual(availableLocations(2025).sort(), ['cambridge', 'hampton']);
  assert.deepEqual(RESUME_ENTRIES.filter((e) => activeInYear(e, 2022)).map((e) => e.id).sort(),
    ['minnesota-education', 'minnetonka-education', 'stony-brook']);
});

test('incoming roles never acquire an invented date or finite duration', () => {
  const upcoming = RESUME_ENTRIES.filter((e) => activeInYear(e, 'upcoming'));
  assert.equal(upcoming.length, 1);
  assert.equal(upcoming[0].org, 'Hudson River Trading');
  assert.equal(durationRange(upcoming[0]), null);
  for (const year of YEARS) assert.equal(activeInYear(upcoming[0], year), false);
});

test('timeline bounds, inclusive end years, locations, and unique IDs remain consistent', () => {
  assert.equal(new Set(RESUME_ENTRIES.map((e) => e.id)).size, RESUME_ENTRIES.length);
  for (const entry of RESUME_ENTRIES) {
    assert.ok(LOCATIONS[entry.location]);
    assert.ok(activeInYear(entry, 'all'));
    const range = durationRange(entry);
    if (!range) continue;
    assert.ok(range.left >= 0 && range.width > 0 && range.left + range.width <= 100.00001);
    assert.ok(activeInYear(entry, entry.start!));
    assert.ok(activeInYear(entry, entry.end!));
    assert.equal(activeInYear(entry, entry.end! + 1), false);
  }
});
