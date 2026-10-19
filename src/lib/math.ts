import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import type { Root, Element } from 'hast';

export const mathOptions = { output: 'htmlAndMathml', trust: false, strict: 'error' } as const;

// Shared by Astro Markdown and data-driven text. Never ship broken TeX silently.
export function rehypeMathFinish() {
  return (tree: Root, file: { messages: { source?: string; message: string }[] }) => {
    const error = file.messages.find((message) => message.source === 'rehype-katex');
    if (error) throw new Error(error.message);
    function visit(node: Root | Element) {
      if (node.type === 'element' && Array.isArray(node.properties.className)
        && node.properties.className.includes('katex-display')) {
        node.properties.tabIndex = 0;
        node.properties.role = 'group';
        node.properties.ariaLabel = 'Equation';
      }
      for (const child of node.children) if (child.type === 'element') visit(child);
    }
    visit(tree);
  };
}

const processor = unified().use(remarkParse).use(remarkMath).use(remarkRehype)
  .use(rehypeKatex, mathOptions).use(rehypeMathFinish).use(rehypeStringify);

/** Build-time Markdown + $inline$ / $$display$$ math; raw HTML is discarded. */
export function renderMathText(value: string, inline = false): string {
  const tree = processor.runSync(processor.parse(value));
  if (inline) {
    const [paragraph] = tree.children;
    if (tree.children.length !== 1 || paragraph.type !== 'element' || paragraph.tagName !== 'p') {
      throw new Error('Inline math text must be a single paragraph. Use block mode for display equations.');
    }
    tree.children = paragraph.children;
  }
  return processor.stringify(tree);
}
