import { Pause, Play } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import InterestField from '@/components/interest-field/InterestField';
import { SIMS, type SimKey } from '@/components/interest-field/sims';
import TypewriterTitle from '@/components/kokonutui/type-writer';

export interface Interest {
  text: string;
  /** The simulation shown behind the hero while this phrase is typed. */
  sim: SimKey;
}

interface HeroProps {
  name: string;
  /** Lead-in shown before the typed phrases, e.g. "Interested in". */
  lead: string;
  interests: Interest[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

// The name rises, then the typewriter cycles through interests while the
// background runs a matching simulation you can play with.
export default function Hero({ name, lead, interests }: HeroProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Pausing holds the current interest (the simulation keeps running and stays
  // interactive). Resuming starts a fresh typewriter at the next interest.
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState({ id: 0, startAt: 0 });
  // Counts trips through the list, so sims can start fresh each cycle (a new
  // Boltzmann graph), but not every phrase.
  const [cycle, setCycle] = useState(0);
  const sim = interests[index]?.sim ?? interests[0].sim;

  const onPhraseStart = (next: number) => {
    if (next < index) setCycle((c) => c + 1);
    setIndex(next);
  };

  const togglePaused = () => {
    if (paused) setRun({ id: run.id + 1, startAt: (index + 1) % interests.length });
    setPaused(!paused);
  };

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.9, ease: EASE },
        };

  return (
    <InterestField className="min-h-[clamp(440px,64vh,640px)]" sim={sim} variant={cycle}>
      <div className="relative mx-auto w-full max-w-5xl px-5 text-ink sm:px-8">
        <motion.h1
          className="font-display text-[clamp(3.25rem,11vw,7.5rem)] font-bold leading-[0.92] tracking-[-0.045em]"
          {...rise(0.35)}
        >
          {name}
        </motion.h1>
        <motion.p
          className="mt-6 flex select-none flex-col font-display text-[clamp(1.35rem,3.2vw,2rem)] font-medium leading-snug sm:flex-row sm:items-baseline sm:gap-x-[0.3em]"
          {...rise(0.6)}
        >
          <span className="text-muted">{lead}</span>
          {paused ? (
            <span className="text-ink">{interests[index]?.text}</span>
          ) : (
            <TypewriterTitle
              as="span"
              className="w-auto justify-start"
              key={run.id}
              onPhraseStart={onPhraseStart}
              sequences={interests.map(({ text }) => ({ text, deleteAfter: true, pauseAfter: 2600 }))}
              startAt={run.startAt}
              startDelay={run.id === 0 ? 1400 : 250}
              textClassName="text-ink text-[length:inherit] leading-snug @lg:text-[length:inherit] @2xl:text-[length:inherit]"
              typingSpeed={50}
            />
          )}
        </motion.p>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-5xl items-end justify-between gap-4 px-5 pb-4 sm:justify-end sm:px-8">
          <AnimatePresence initial={false} mode="wait">
            <motion.p
              animate={{ opacity: 1 }}
              className="max-w-[22rem] font-display text-xs leading-snug text-muted sm:text-right"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={sim}
              transition={{ duration: 0.3 }}
            >
              {SIMS[sim].caption}
            </motion.p>
          </AnimatePresence>
          {!reduce && (
            <button
              aria-label={paused ? 'Move on to the next interest' : 'Stay on this interest'}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-line/60 hover:text-ink"
              onClick={togglePaused}
              title={paused ? 'Move on to the next interest' : 'Stay on this interest'}
              type="button"
            >
              {paused ? <Play size={13} strokeWidth={2.5} /> : <Pause size={13} strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </div>
    </InterestField>
  );
}
