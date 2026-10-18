import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PROJECTS, projectHref } from '../src/data/projects';
import { RESEARCH } from '../src/data/resume';

test('project anchors are unique, URL-safe, and cover every research reference', () => {
  const ids = new Set(PROJECTS.map((project) => project.id));
  assert.equal(ids.size, PROJECTS.length);
  for (const id of ids) assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const research of RESEARCH) {
    assert.ok(ids.has(research.project));
    assert.equal(projectHref(research.project), `/projects/#${research.project}`);
  }
});
