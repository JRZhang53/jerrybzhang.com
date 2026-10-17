// Edit this file to update your name, roles, and links across the whole site.
export const SITE = {
  name: 'Jerry Zhang',
  title: 'Jerry Zhang',
  description: 'Personal website of Jerry Zhang.',
  // TODO: the phrases typed out under your name on the home page.
  roles: ['student.', 'occasional writer.'],
};

// Remove any link you don't want to show. Leave `href` empty to hide it.
export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/JRZhang53' },
  { label: 'LinkedIn', href: '' }, // TODO: e.g. https://www.linkedin.com/in/your-handle
  { label: 'Email', href: '' }, // TODO: e.g. mailto:you@example.com
].filter((l) => l.href);

// Navigation, keyed by path, in display order.
export const NAV = {
  '/': { name: 'About' },
  '/projects': { name: 'Projects' },
  '/blog': { name: 'Writing' },
  '/resume': { name: 'Resume' },
};
