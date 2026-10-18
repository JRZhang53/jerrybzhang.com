import { Pause, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import InterestField from '@/components/interest-field/InterestField';
import { SIMS } from '@/components/interest-field/sims';
import TypewriterTitle from '@/components/kokonutui/type-writer';
import type { Interest } from '@/data/site';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface HeroProps {
  name: string;
  /** Lead-in shown before the typed phrases, e.g. "Interested in". */
  lead: string;
  interests: Interest[];
}

// The name rises, then the typewriter cycles through interests while the
// background runs a matching simulation you can play with.
export default function Hero({ name, lead, interests }: HeroProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  useEffect(() => setReady(true), []);
  // Pausing holds the current interest (the simulation keeps running and stays
  // interactive). Resuming starts a fresh typewriter at the next interest.
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState({ id: 0, startAt: 0 });
  // Counts trips through the list, so sims can start fresh each cycle (a new
  // Boltzmann graph), but not every phrase.
  const [cycle, setCycle] = useState(0);
  const sim = interests[index]?.sim ?? interests[0]?.sim ?? 'spins';

  const onPhraseStart = (next: number) => {
    if (next < index) setCycle((c) => c + 1);
    setIndex(next);
  };

  const togglePaused = () => {
    if (paused) setRun({ id: run.id + 1, startAt: (index + 1) % Math.max(1, interests.length) });
    setPaused(!paused);
  };

  return (
    <InterestField className="min-h-[clamp(440px,64vh,640px)]" sim={sim} variant={cycle} paused={motionPaused}>
      <div className="relative mx-auto w-full max-w-5xl px-5 text-ink sm:px-8">
        <h1
          className="hero-name font-display text-[clamp(3.25rem,11vw,7.5rem)] font-bold leading-[0.92] tracking-[-0.04em]"
        >
          {name}
        </h1>
        <p
          className="mt-6 flex select-none flex-col font-display text-[clamp(1.2rem,3.2vw,2rem)] font-medium leading-snug sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-[0.3em]"
        >
          <span className="text-muted">{lead}</span>
          {paused ? (
            <span className="min-h-[2.75em] text-ink sm:min-h-0">{interests[index]?.text}</span>
          ) : (
            <TypewriterTitle
              as="span"
              className="min-h-[2.75em] min-w-0 w-auto items-start justify-start [container-type:normal] sm:min-h-0"
              key={run.id}
              onPhraseStart={onPhraseStart}
              sequences={interests.map(({ text }) => ({ text, deleteAfter: true, pauseAfter: 2600 }))}
              startAt={run.startAt}
              initialText={run.id === 0}
              paused={motionPaused}
              startDelay={run.id === 0 ? 1400 : 250}
              textClassName="text-ink text-[length:inherit] leading-snug @lg:text-[length:inherit] @2xl:text-[length:inherit]"
              typingSpeed={50}
            />
          )}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-2 px-5 pb-4 sm:flex-row sm:items-end sm:justify-end sm:gap-4 sm:px-8">
          <AnimatePresence initial={false} mode="wait">
            <motion.p
              animate={{ opacity: 1 }}
              className="max-w-[22rem] font-display text-xs leading-snug text-muted sm:text-right"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={sim}
              transition={{ duration: reduce || motionPaused ? 0 : 0.3 }}
            >
              {SIMS[sim].caption}
            </motion.p>
          </AnimatePresence>
          {ready && !reduce && interests.length > 0 && (
            <div className="flex shrink-0 self-end items-center gap-1">
            <button
              aria-label={paused ? 'Move on to the next interest' : 'Stay on this interest'}
              aria-pressed={paused}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-line/60 hover:text-ink"
              onClick={togglePaused}
              title={paused ? 'Move on to the next interest' : 'Stay on this interest'}
              type="button"
            >
              {paused ? <Play size={13} strokeWidth={2.5} /> : <Pause size={13} strokeWidth={2.5} />}
            </button>
            <button
              aria-pressed={motionPaused}
              className="min-h-11 cursor-pointer rounded-md px-2 font-display text-xs text-muted transition-colors hover:bg-line/60 hover:text-ink"
              onClick={() => setMotionPaused((value) => !value)}
              type="button"
            >
              {motionPaused ? 'Resume motion' : 'Pause motion'}
            </button>
            </div>
          )}
        </div>
      </div>
    </InterestField>
  );
}
