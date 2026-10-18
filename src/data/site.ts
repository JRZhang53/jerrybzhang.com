// Edit this file to update your name, interests, and links across the whole site.
export const SITE = {
  name: 'Jerry Zhang',
  title: 'Jerry Zhang',
  description: 'Jerry Zhang studies physics and statistics at Harvard and is joining Hudson River Trading as an algorithm developer.',
  // The line under your name on the home page: the lead-in, then each phrase typed out in turn.
  lead: 'Interested in',
  interests: [
    'statistical physics.',
    'dynamics and active matter.',
    'materials and energy.',
    'semiconductors and photonics.',
    'information theory.',
    'machine learning.',
    'interpretability.',
  ],
};

// Remove any link you don't want to show. Leave `href` empty to hide it.
export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/JRZhang53' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jerryzhang53' },
  { label: 'Email', href: '' }, // TODO: e.g. mailto:you@example.com
].filter((l) => l.href);

// Navigation, keyed by path, in display order.
export const NAV = {
  '/': { name: 'About' },
  '/projects': { name: 'Projects' },
  '/blog': { name: 'Writing' },
  '/resume': { name: 'Resume' },
};
