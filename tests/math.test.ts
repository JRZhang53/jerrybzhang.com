import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderMathText } from '../src/lib/math';

test('inline and display math render at build time with MathML and keyboard-scrollable displays', () => {
  const inline = renderMathText(String.raw`Minimum $\ell_1$ norm and $\tau$-leaping.`, true);
  assert.match(inline, /class="katex"/);
  assert.match(inline, /<math xmlns=/);
  assert.match(inline, /<msub>/);
  assert.doesNotMatch(inline, /<p>/);
  const block = renderMathText(String.raw`$$
\begin{aligned}
\hat\beta &= \arg\min_\beta \lVert\beta\rVert_1 \\
\text{subject to}\quad X\beta &= y
\end{aligned}
$$`);
  assert.match(block, /katex-display/);
  assert.match(block, /tabindex="0"/);
  assert.match(block, /display="block"/);
  assert.match(block, /<mtable/);
});

test('code, escaped dollars, and plain prose are not mistaken for math or HTML', () => {
  assert.equal(renderMathText('Plain text & notation.', true), 'Plain text &#x26; notation.');
  const html = renderMathText('`$x$` and \\$10. <script>alert(1)</script>', true);
  assert.match(html, /<code>\$x\$<\/code>/);
  assert.match(html, /\$10/);
  assert.doesNotMatch(html, /class="katex"|<script>/);
});

test('invalid TeX and block content in inline slots fail instead of publishing broken notation', () => {
  assert.throws(() => renderMathText(String.raw`$\notARealCommand{x}$`), /render math/);
  assert.throws(() => renderMathText('First paragraph.\n\nSecond paragraph.', true), /single paragraph/);
});
