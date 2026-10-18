import { ChevronDown } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useId, useState } from 'react';

export interface Study {
  field: string;
  detail: string;
}

interface StudiesSentenceProps {
  before: string;
  /** The clickable phrase that unfolds the breakdown. */
  label: string;
  after: string;
  studies: Study[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

// A plain sentence whose key phrase unfolds into the full degree breakdown,
// so the details are there for anyone curious without leading the page.
export default function StudiesSentence({ before, label, after, studies }: StudiesSentenceProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <MotionConfig reducedMotion="user">
      <p>
        {before}{' '}
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="inline-flex cursor-pointer items-baseline gap-0.5 text-ink underline decoration-accent decoration-dotted decoration-2 underline-offset-[5px] transition-colors hover:decoration-solid"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          {label}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            aria-hidden="true"
            className="inline-flex self-center text-accent"
            transition={{ duration: 0.3, ease: EASE }}
          >
            <ChevronDown size={16} strokeWidth={2.5} />
          </motion.span>
        </button>{' '}
        {after}
      </p>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            key="studies"
            transition={{ duration: 0.4, ease: EASE }}
          >
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {studies.map((s, i) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="grid items-baseline gap-x-6 py-3 sm:grid-cols-[10rem_1fr]"
                  initial={{ opacity: 0, y: -6 }}
                  key={s.field}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.3, ease: EASE }}
                >
                  <dt className="font-display font-semibold">{s.field}</dt>
                  <dd className="text-base text-muted">{s.detail}</dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
