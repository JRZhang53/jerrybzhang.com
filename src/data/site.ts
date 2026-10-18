import type { Interest } from '@/components/Hero';

// Edit this file to update your name, interests, and links across the whole site.
export const SITE = {
  name: 'Jerry Zhang',
  title: 'Jerry Zhang',
  description: 'Jerry Zhang is a senior studying physics and statistics at Harvard.',
  // The line under your name on the home page: the lead-in, then each phrase typed out in
  // turn. `sim` picks the simulation behind the hero while that phrase shows:
  // 'spins' (Ising lattice), 'swarm' (active matter), 'waveguide' (photonics), 'boltzmann' (ML).
  lead: 'Interested in',
  interests: [
    { text: 'statistical physics.', sim: 'spins' },
    { text: 'dynamics and active matter.', sim: 'swarm' },
    { text: 'materials and energy.', sim: 'waveguide' },
    { text: 'semiconductors and photonics.', sim: 'waveguide' },
    { text: 'information theory.', sim: 'boltzmann' },
    { text: 'machine learning.', sim: 'boltzmann' },
    { text: 'interpretability.', sim: 'boltzmann' },
  ] satisfies Interest[],
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
  '/resume': { name: 'Resume' },
};
