import { motion, useReducedMotion } from 'motion/react';
import BackgroundPaths from '@/components/kokonutui/background-paths';
import TypewriterTitle from '@/components/kokonutui/type-writer';

interface HeroProps {
  name: string;
  /** Phrases the typewriter cycles through under the name. */
  roles: string[];
}

// The one orchestrated moment on the site: the ribbon draws in, the name rises,
// then the typewriter starts on the roles.
export default function Hero({ name, roles }: HeroProps) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <BackgroundPaths
      angle={-14}
      className="min-h-[clamp(420px,62vh,620px)] justify-start text-accent/50"
      count={36}
      spread={0.9}
      speed={0.6}
    >
      <div className="relative mx-auto w-full max-w-5xl px-5 text-ink sm:px-8">
        <motion.h1
          className="font-display text-[clamp(3.25rem,11vw,7.5rem)] font-bold leading-[0.92] tracking-[-0.045em]"
          {...rise(0.35)}
        >
          {name}
        </motion.h1>
        <motion.div className="mt-6" {...rise(0.6)}>
          <TypewriterTitle
            as="p"
            className="justify-start"
            textClassName="font-display text-[clamp(1.35rem,3.2vw,2rem)] font-medium text-muted leading-snug @lg:text-[clamp(1.35rem,3.2vw,2rem)] @2xl:text-[clamp(1.35rem,3.2vw,2rem)]"
            sequences={roles.map((text) => ({ text, deleteAfter: true, pauseAfter: 1800 }))}
            startDelay={1400}
            typingSpeed={55}
          />
        </motion.div>
      </div>
    </BackgroundPaths>
  );
}
