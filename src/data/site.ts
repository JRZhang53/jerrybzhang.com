// Edit this file to update your name, tagline, and links across the whole site.
export const SITE = {
  name: 'Jerry Zhang',
  title: 'Jerry Zhang',
  description: 'Personal website of Jerry Zhang.',
  // TODO: replace with a one-line description of yourself.
  tagline: 'Student, builder, and occasional writer.',
};

// Remove any link you don't want to show. Leave `href` empty to hide it.
export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/JRZhang53' },
  { label: 'LinkedIn', href: '' }, // TODO: e.g. https://www.linkedin.com/in/your-handle
  { label: 'Email', href: '' }, // TODO: e.g. mailto:you@example.com
].filter((l) => l.href);

export const NAV = [
  { label: 'About', href: '/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Resume', href: '/resume/' },
];
