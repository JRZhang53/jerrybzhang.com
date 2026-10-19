# Mathematical typography

Math is typeset at build time with KaTeX. The stylesheet and fonts are bundled
locally; no math renderer or CDN script runs in the browser. Output includes
visual HTML and accessible MathML. Figures keep their original raster labels.

Markdown pages and content collections use `$...$` for inline math and `$$`
on separate lines for display equations. Escape a literal dollar as `\$`;
inline code and fenced code keep their literal contents. For example:

```md
Minimum $\ell_1$ norm with $\tau$-leaping.

$$
\begin{aligned}
\hat\beta &= \arg\min_{\beta\in\mathbb R^p}\lVert\beta\rVert_1 \\
\text{subject to}\quad X\beta &= y
\end{aligned}
$$
```

Astro components can use `MathText` for the same syntax:

```astro
---
import MathText from '../components/MathText.astro';
const label = String.raw`Minimum $\ell_1$ norm`;
---
<h2><MathText text={label} /></h2>
<div class="math-copy"><MathText text={description} inline={false} /></div>
```

Inline mode accepts one paragraph and emits no wrapper, so it can live inside a
heading or caption. Block mode supports paragraphs and display equations. Use
`String.raw` for TypeScript strings containing backslashes. Project descriptions
and captions support math; `mathName` optionally supplies a typeset title while
`name` stays plain for accessible labels and resume links.

The renderer discards raw HTML in data-driven text. KaTeX trust is disabled;
invalid or unsupported TeX fails the build. It renders mathematical notation,
not full LaTeX documents or arbitrary document packages. Keep the direct KaTeX
version compatible with rehype-katex so the generated markup and CSS agree.

Display equations scroll within their own region on narrow screens and are
keyboard focusable. Inline math follows prose sizing and resets heading letter
spacing. Both themes inherit the surrounding text color.

Implementation: `src/lib/math.ts`, `src/components/MathText.astro`, Astro's
explicit unified Markdown processor, and `src/styles/global.css`.

References: [KaTeX server rendering](https://katex.org/docs/node.html) and
[remark/rehype math](https://github.com/remarkjs/remark-math).
