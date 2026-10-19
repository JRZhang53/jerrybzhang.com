import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { parse, type DefaultTreeAdapterTypes } from 'parse5';
import { SITE } from '../src/data/site';
import { PROJECTS } from '../src/data/projects';
import { RESUME_ENTRIES } from '../src/lib/resume-timeline';

type Node = DefaultTreeAdapterTypes.Node;
type Element = DefaultTreeAdapterTypes.Element;
const root = resolve('dist');
const read = (path: string) => readFileSync(path, 'utf8');
function elements(node: Node): Element[] {
  const own = 'tagName' in node ? [node] : [];
  return own.concat('childNodes' in node ? node.childNodes.flatMap(elements) : []);
}
const attr = (node: Element, key: string) => node.attrs.find((a) => a.name === key)?.value;
function text(node: Node): string {
  return 'value' in node ? node.value : 'childNodes' in node ? node.childNodes.map(text).join('') : '';
}
function htmlFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : name.endsWith('.html') ? [path] : [];
  });
}

test('essential home text is visible in server-rendered HTML before hydration', () => {
  const nodes = elements(parse(read(join(root, 'index.html'))));
  const heading = nodes.find((node) => node.tagName === 'h1');
  assert.ok(heading);
  assert.equal(text(heading), SITE.name);
  assert.doesNotMatch(attr(heading, 'style') ?? '', /opacity:\s*0/);
  const visiblePhrase = nodes.find((node) => node.tagName === 'span'
    && text(node) === SITE.interests[0].text
    && (attr(node, 'class') ?? '').includes('min-h-'));
  assert.ok(visiblePhrase, 'first interest must be printed as visible text, not only in a screen-reader alternative');
  assert.ok(nodes.some((node) => attr(node, 'href') === '#main-content'));
});

test('every generated local link and fragment resolves', () => {
  let count = 0;
  for (const file of htmlFiles(root)) {
    const relative = file.slice(root.length).replaceAll('\\', '/').replace(/index\.html$/, '');
    for (const node of elements(parse(read(file)))) {
      if (node.tagName !== 'a') continue;
      const href = attr(node, 'href');
      if (!href || !/^(\/|#)/.test(href) || href.startsWith('//')) continue;
      const url = new URL(href, `https://jerrybzhang.com${relative}`);
      let target = join(root, decodeURIComponent(url.pathname));
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
      assert.ok(existsSync(target), `${file}: missing ${href}`);
      if (url.hash && target.endsWith('.html')) {
        const id = decodeURIComponent(url.hash.slice(1));
        assert.ok(elements(parse(read(target))).some((element) => attr(element, 'id') === id), `${file}: missing anchor ${href}`);
      }
      count++;
    }
  }
  assert.ok(count > 0, 'the generated site must include local navigation');
});

test('public anchors, native degree disclosure, draft exclusion, and custom domain survive the build', () => {
  const projects = elements(parse(read(join(root, 'projects/index.html'))));
  PROJECTS.forEach((project) => assert.ok(projects.some((node) => attr(node, 'id') === project.id)));
  const resume = elements(parse(read(join(root, 'resume/index.html'))));
  if (!existsSync(join(root, 'resume.pdf'))) {
    assert.ok(resume.some((node) => node.tagName === 'details' && text(node).includes('concurrent AM')));
  }
  assert.equal(existsSync(join(root, 'pickleball/example-post/index.html')), false);
  assert.equal(read(join(root, 'CNAME')).trim(), 'jerrybzhang.com');
});

test('Tree of Life is assembled at its subpath with working entry assets and no source tree', () => {
  const appRoot = join(root, 'fun/tree-of-life');
  const nodes = elements(parse(read(join(appRoot, 'index.html'))));
  const assets = nodes.flatMap((node) => {
    const url = node.tagName === 'script' ? attr(node, 'src')
      : node.tagName === 'link' && ['stylesheet', 'modulepreload'].includes(attr(node, 'rel') ?? '')
        ? attr(node, 'href') : undefined;
    return url ? [url] : [];
  });
  assert.ok(assets.length > 0);
  for (const url of assets) {
    assert.ok(url.startsWith('/fun/tree-of-life/'), `asset escapes app path: ${url}`);
    assert.ok(existsSync(join(root, url)), `missing compiled app asset: ${url}`);
  }
  for (const privatePath of ['.git', 'node_modules', 'src', 'package.json', 'CNAME']) {
    assert.equal(existsSync(join(appRoot, privatePath)), false, `unexpected ${privatePath} in app output`);
  }
});

test('the complete resume and real project figures are available before JavaScript', () => {
  const resume = elements(parse(read(join(root, 'resume/index.html'))));
  for (const entry of RESUME_ENTRIES) {
    const article = resume.find((node) => attr(node, 'id') === entry.id);
    assert.ok(article, `missing resume entry ${entry.id}`);
    assert.equal(article.tagName, 'details', 'resume entries must work as native disclosures without JavaScript');
    assert.equal(attr(article, 'open'), undefined, 'resume details start collapsed');
    assert.ok(text(article).includes(entry.org));
    assert.ok(text(article).includes(entry.years));
  }
  // SVG title is parsed as raw text by HTML parsers: React text-separator
  // comments from multiple JSX children would cause a hydration mismatch.
  for (const title of resume.filter((node) => node.tagName === 'title')) {
    assert.doesNotMatch(text(title), /<!--/);
  }
  const projects = elements(parse(read(join(root, 'projects/index.html'))));
  for (const project of PROJECTS) {
    const disclosure = projects.find((node) => attr(node, 'id') === project.id);
    assert.ok(disclosure);
    assert.equal(disclosure.tagName, 'details');
    assert.equal(attr(disclosure, 'open'), undefined);
    assert.ok(text(disclosure).includes(project.description), 'full descriptions remain available without JavaScript');
  }
  const figures = projects.filter((node) => node.tagName === 'img');
  assert.equal(figures.length, 2);
  for (const figure of figures) {
    assert.ok(attr(figure, 'alt'));
    assert.ok(existsSync(join(root, attr(figure, 'src')!)));
    assert.ok(attr(figure, 'width') && attr(figure, 'height'));
  }
});
