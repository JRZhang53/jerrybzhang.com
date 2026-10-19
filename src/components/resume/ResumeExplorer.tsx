import { useEffect, useRef, useState } from 'react';
import { LOCATIONS, STUDIES, type LocationId } from '../../data/resume';
import { PROJECTS, projectHref } from '../../data/projects';
import { RESUME_ENTRIES, YEARS, durationRange } from '../../lib/resume-timeline';
import ResumeMap from './ResumeMap';

const locations = Object.keys(LOCATIONS) as LocationId[];

export default function ResumeExplorer() {
  const [location, setLocation] = useState<LocationId>('cambridge');
  const [selected, setSelected] = useState('');
  const entries = useRef<Record<string, HTMLDetailsElement | null>>({});
  const chart = useRef<HTMLDivElement | null>(null);

  function reveal(id: string) {
    const element = entries.current[id];
    if (!element) return;
    element.open = true;
    element.querySelector('summary')?.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  useEffect(() => {
    if (matchMedia('(max-width: 639px)').matches && chart.current) {
      chart.current.scrollLeft = chart.current.scrollWidth - chart.current.clientWidth;
    }
    function revealHash() {
      try { reveal(decodeURIComponent(window.location.hash.slice(1))); } catch { /* Invalid fragments have no matching entry. */ }
    }
    revealHash();
    window.addEventListener('hashchange', revealHash);
    return () => window.removeEventListener('hashchange', revealHash);
  }, []);

  return <section aria-label="Resume timeline and map" className="resume-explorer mt-10">
    <div className="gantt-legend mb-5 flex flex-wrap gap-x-6 gap-y-2 font-display text-xs text-muted" aria-label="Timeline categories">
      <span data-category="Experience"><i aria-hidden="true" />Experience</span>
      <span data-category="Education"><i aria-hidden="true" />Education</span>
      <span data-category="Research"><i aria-hidden="true" />Research</span>
    </div>
    <p className="mb-3 font-display text-xs text-muted sm:hidden">Scroll across the years. Select a row for details.</p>
    <div ref={chart} className="gantt-scroll" role="region" aria-label="Resume Gantt chart, horizontally scrollable on small screens" tabIndex={0}>
    <div className="gantt-chart">
    <div className="timeline-axis timeline-grid" aria-hidden="true">
      <span className="gantt-label font-display text-xs text-muted">Select to explore</span>
      <div className="grid grid-cols-9 font-display text-xs text-muted tabular-nums">
        {YEARS.map((year) => <span key={year} className="text-center">{year}</span>)}
      </div>
    </div>
    <ol className="border-t border-line">
      {RESUME_ENTRIES.map((entry) => {
        const range = durationRange(entry);
        const project = entry.project ? PROJECTS.find((p) => p.id === entry.project) : undefined;
        return <li key={entry.id}>
          <details id={entry.id} data-category={entry.category} ref={(el) => { entries.current[entry.id] = el; }} className="resume-entry group scroll-mt-8"
            onToggle={(event) => {
              if (event.currentTarget.open) { setSelected(entry.id); setLocation(entry.location); }
            }}>
            <summary className="timeline-grid cursor-pointer" title={`${entry.role} · ${entry.years}`} aria-label={`${entry.org}, ${entry.category}, ${entry.years}. ${entry.upcoming ? 'Incoming ' : ''}${entry.role}`}>
              <span className="gantt-label">
                <span className="font-display text-sm leading-snug">{entry.org}
                  {RESUME_ENTRIES.some((other) => other.id !== entry.id && other.org === entry.org) && <span className="mt-1 block text-xs text-muted">{entry.role}</span>}
                </span>
                <svg className="disclosure-chevron text-muted" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg>
              </span>
              <span className="gantt-track" aria-hidden="true">
                {range ? <span className="gantt-bar" style={{ left: `${range.left}%`, width: `${range.width}%` }} />
                  : <span className="gantt-upcoming font-display text-xs">Incoming · after graduation</span>}
              </span>
            </summary>
            <div className="resume-detail pb-6 text-base">
              <p className="font-display text-base font-semibold">{entry.upcoming ? 'Incoming ' : ''}{entry.role}</p>
              <p className="mt-1 mb-3 font-display text-xs text-muted">{entry.category} · {entry.years} · {entry.place}</p>
              {entry.studies && <dl className="grid gap-3 sm:grid-cols-3">{STUDIES.map((study) => <div key={study.field}><dt className="font-display text-sm font-semibold">{study.field}</dt><dd className="mt-1 text-sm text-muted">{study.detail}</dd></div>)}</dl>}
              {entry.points && <ul className="space-y-1 text-sm text-muted">{entry.points.map((point) => <li key={point}>{point}</li>)}</ul>}
              {project && entry.project && <a href={projectHref(entry.project)} className="inline-flex min-h-11 items-center text-base">{project.name}</a>}
            </div>
          </details>
        </li>;
      })}
    </ol>
    </div>
    </div>
    <p className="mt-3 font-display text-xs text-muted">Bars show start and end months.</p>
    <details className="resume-map-panel mt-6">
      <summary className="flex min-h-11 w-fit cursor-pointer items-center gap-2 font-display text-sm text-muted hover:text-accent">
        Explore the places
        <svg className="disclosure-chevron" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg>
      </summary>
      <div className="mt-5 grid items-center gap-6 sm:grid-cols-[1.2fr_1fr] sm:gap-12">
        <ResumeMap selected={location} active={locations} onSelect={setLocation} />
        <div>
          <label className="block font-display text-sm sm:hidden">Location
            <select value={location} onChange={(event) => setLocation(event.target.value as LocationId)} className="my-3 min-h-11 w-full rounded border border-line bg-paper px-3 text-base">
              {locations.map((id) => <option key={id} value={id}>{LOCATIONS[id].name}</option>)}
            </select>
          </label>
          <div aria-live="polite">
            <h2 className="text-xl">{LOCATIONS[location].name}</h2>
            <p className="mt-1 text-sm text-muted">{LOCATIONS[location].region}</p>
            <ul className="mt-4 space-y-1">{RESUME_ENTRIES.filter((entry) => entry.location === location).map((entry) => <li key={entry.id}>
              <button type="button" onClick={() => reveal(entry.id)} className={`min-h-11 w-full py-2 text-left hover:text-accent ${selected === entry.id ? 'text-accent' : 'text-ink'}`}>
                <span className="block font-display text-sm font-semibold">{entry.org}</span>
                <span className="block text-sm text-muted">{entry.role}</span>
                <span className="block font-display text-xs text-muted">{entry.years}</span>
              </button>
            </li>)}</ul>
          </div>
          <p className="mt-5 text-xs text-muted">Institutional regions. Map: <a href="https://github.com/topojson/us-atlas" className="text-muted">U.S. Census / us-atlas</a>.</p>
        </div>
      </div>
    </details>
  </section>;
}
