// Run manually after updating us-atlas. No map library or tile requests at runtime.
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { LOCATIONS } from '../src/data/resume.ts';

const require = createRequire(import.meta.url);
const topology = JSON.parse(readFileSync(require.resolve('us-atlas/states-10m.json'), 'utf8'));
const projection = geoMercator().center([-84, 38]).scale(760).translate([240, 220]).clipExtent([[0, 0], [480, 460]]);
const path = geoPath(projection).digits(1);
const states = feature(topology, topology.objects.states).features
  .filter((f) => !['02', '15', '72'].includes(f.id))
  .map((f) => ({ name: f.properties.name, path: path(f) })).filter((state) => state.path);
const markers = Object.fromEntries(Object.entries(LOCATIONS).map(([key, place]) =>
  [key, projection(place.coordinates).map((n) => Math.round(n * 10) / 10)]));
writeFileSync(new URL('../src/data/resume-map.json', import.meta.url), JSON.stringify({ states, markers }) + '\n');
