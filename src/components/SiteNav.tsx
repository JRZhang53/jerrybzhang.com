import { MotionConfig, motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SiteNavProps {
  /** Links keyed by path, in display order. */
  items: Record<string, { name: string }>;
  pathname: string;
}

const matches = (path: string, current: string) =>
  path === '/' ? current === '/' : current === path || current.startsWith(`${path}/`);

// Plain text links with one accent underline that rests under the current page
// and glides to whichever link is hovered or focused.
export default function SiteNav({ items, pathname }: SiteNavProps) {
  const entries = Object.entries(items);
  const active = entries.find(([path]) => matches(path, pathname))?.[0] ?? null;
  const [hovered, setHovered] = useState<string | null>(null);
  const marked = hovered ?? active;

  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Main" onPointerLeave={() => setHovered(null)}>
        <ul className="flex items-center">
          {entries.map(([path, { name }]) => (
            <li key={path}>
              <a
                aria-current={path === active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-11 items-center px-2.5 py-2 font-display text-[15px] font-medium tracking-tight transition-colors duration-200 sm:px-3',
                  path === active || path === hovered ? 'text-ink' : 'text-muted'
                )}
                href={path}
                onBlur={() => setHovered(null)}
                onFocus={() => setHovered(path)}
                onPointerEnter={() => setHovered(path)}
              >
                {name}
                {marked === path && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-x-2.5 bottom-0.5 h-[2px] rounded-full bg-accent sm:inset-x-3"
                    layoutId="site-nav-mark"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </MotionConfig>
  );
}
