// Add, remove, or reorder projects here. They show up on /projects in this order.
export type Project = {
  name: string;
  description: string;
  tags?: string[];
  href?: string; // live site or demo
  repo?: string; // source code
  year?: string;
};

export const PROJECTS: Project[] = [
  {
    name: 'jerrybzhang.com',
    description: 'This website. Built with Astro, Motion, and Kokonut UI, and hosted on GitHub Pages.',
    tags: ['Astro', 'React', 'Tailwind CSS'],
    href: 'https://jerrybzhang.com',
    repo: 'https://github.com/JRZhang53/jerrybzhang.com',
    year: '2026',
  },
  // TODO: replace this placeholder with a real project.
  {
    name: 'Example project',
    description: 'One or two sentences on what it does, why you built it, and what you learned.',
    tags: ['Python'],
    year: '2025',
  },
];
