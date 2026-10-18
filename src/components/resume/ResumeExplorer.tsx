import { useRef, useState } from 'react';
import { LOCATIONS, STUDIES, type LocationId } from '../../data/resume';
import { PROJECTS, projectHref } from '../../data/projects';
import { RESUME_ENTRIES, YEARS, FIRST_YEAR, LAST_YEAR, activeInYear, availableLocations, durationRange, type YearSelection } from '../../lib/resume-timeline';
import ResumeMap from './ResumeMap';

const control = 'min-h-11 rounded-md px-3 font-display text-sm transition-colors hover:bg-accent/10 focus-visible:outline-accent';

export default function ResumeExplorer() {
  const [year, setYear] = useState<YearSelection>('all');
  const [selected, setSelected] = useState('harvard-education');
  const [location, setLocation] = useState<LocationId>('cambridge');
  const [mapOpen, setMapOpen] = useState(false);
  const entryRefs = useRef<Record<string, HTMLElement | null>>({});
  const mapRef = useRef<HTMLElement | null>(null);
  const matches = RESUME_ENTRIES.filter((entry) => activeInYear(entry, year));
  const regionEntries = matches.filter((entry) => entry.location === location);
  const period = year === 'all' ? 'All years' : year === 'upcoming' ? 'Upcoming' : String(year);

  function selectYear(next: YearSelection) {
    setYear(next);
    const nextMatches = RESUME_ENTRIES.filter((e) => activeInYear(e, next));
    const nextEntry = nextMatches.find((e) => e.id === selected)
      ?? nextMatches.find((e) => e.location === location) ?? nextMatches[0];
    if (nextEntry) { setSelected(nextEntry.id); setLocation(nextEntry.location); }
  }
  function selectEntry(id: string, reveal = false) {
    const entry = RESUME_ENTRIES.find((e) => e.id === id);
    if (!entry) return;
    setSelected(id); setLocation(entry.location);
    if (!activeInYear(entry, year)) setYear(entry.upcoming ? 'upcoming' : 'all');
    if (reveal) {
      const element = entryRefs.current[id];
      element?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      element?.focus({ preventScroll: true });
    } else {
      setMapOpen(true);
      if (matchMedia('(max-width: 1023px)').matches) requestAnimationFrame(() => {
        mapRef.current?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        mapRef.current?.focus({ preventScroll: true });
      });
    }
  }
  function selectLocation(id: LocationId) {
    setLocation(id);
    setSelected(matches.find((entry) => entry.location === id)?.id ?? '');
  }

  return <section aria-label="Resume timeline and map" className="resume-explorer mt-10">
    <div className="resume-controls border-y border-line py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="year-label" className="font-display text-sm text-muted">Explore by year</p>
        <p className="font-display text-sm text-muted" aria-live="polite" aria-atomic="true">{period} · {matches.length} {matches.length === 1 ? 'experience' : 'experiences'}</p>
      </div>
      <select aria-label="Year" value={String(year)} onChange={(event) => {
        const value = event.target.value;
        selectYear(value === 'all' || value === 'upcoming' ? value : Number(value));
      }} className="mt-3 min-h-11 w-full rounded-md border border-line bg-paper px-3 font-display text-base text-ink sm:hidden">
        <option value="all">All years</option>
        {YEARS.map((value) => <option key={value} value={value}>{value}</option>)}
        <option value="upcoming">Upcoming</option>
      </select>
      <div role="group" aria-labelledby="year-label" className="mt-2 hidden flex-wrap gap-1 sm:flex">
        {(['all', ...YEARS, 'upcoming'] as YearSelection[]).map((option) => <button key={option} type="button" aria-pressed={year === option} onClick={() => selectYear(option)}
          className={`${control} ${year === option ? 'bg-accent text-paper hover:bg-accent' : 'text-muted hover:text-ink'}`}>
          {option === 'all' ? 'All years' : option === 'upcoming' ? 'Upcoming' : option}
        </button>)}
      </div>
    </div>
    <noscript><p className="mt-4 text-base text-muted">The complete resume is below. Enable JavaScript to explore the map and years.</p></noscript>
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.12fr_1fr] lg:gap-12">
      <div className="min-w-0">
        <div className="mb-5 flex items-baseline justify-between gap-4"><h2 className="text-2xl">Through the years</h2><span className="font-display text-xs text-muted">Most recent first</span></div>
        <div className="duration-guide mb-4">
          <div className="flex justify-between font-display text-xs text-muted"><span>{FIRST_YEAR}</span><span>2023</span><span>{LAST_YEAR}</span></div>
          <p className="mt-1 text-xs text-muted">Bars share this scale; dates below show the available detail.</p>
        </div>
        <ol className="space-y-1">
          {RESUME_ENTRIES.map((entry) => {
            const range = durationRange(entry);
            const active = activeInYear(entry, year);
            const chosen = selected === entry.id;
            const project = entry.project ? PROJECTS.find((p) => p.id === entry.project) : undefined;
            return <li key={entry.id}>
              <article id={entry.id} tabIndex={-1} ref={(el) => { entryRefs.current[entry.id] = el; }} data-active={active} data-selected={chosen}
                className={`resume-entry relative scroll-mt-6 rounded-lg border-l-2 py-5 pr-3 pl-4 transition-colors ${chosen ? 'border-accent bg-accent/[0.055]' : active ? 'border-line' : 'border-transparent'}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-display text-xs">
                  <span className={entry.upcoming ? 'text-accent' : 'text-muted'}>{entry.upcoming ? 'Upcoming · Experience' : entry.category}</span><span className="text-muted tabular-nums">{entry.years}</span>
                </div>
                <h3 className={`mt-2 text-[1.3rem] leading-tight ${active ? 'text-ink' : 'text-muted'}`}>{entry.org}</h3>
                {entry.studies ? <details className="studies mt-1 text-base">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 underline decoration-accent decoration-dotted underline-offset-4">{entry.role}<span className="text-xs text-accent" aria-hidden="true">⌄</span></summary>
                  <dl className="mt-2 space-y-3 border-y border-line py-3">{STUDIES.map((study) => <div key={study.field}><dt className="font-display font-semibold">{study.field}</dt><dd className="text-sm text-muted">{study.detail}</dd></div>)}</dl>
                </details> : <p className="mt-1 text-base leading-relaxed">{entry.role}</p>}
                {entry.points && <ul className="mt-2 space-y-1 text-sm text-muted">{entry.points.map((point) => <li key={point}>{point}</li>)}</ul>}
                {project && entry.project && <a href={projectHref(entry.project)} className="mt-3 block text-sm leading-relaxed">{project.name}</a>}
                <button type="button" onClick={() => selectEntry(entry.id)} aria-pressed={chosen} aria-label={`Show ${entry.org}, ${entry.role} on map`}
                  className="resume-location mt-2 flex min-h-11 items-center gap-2 font-display text-xs text-muted hover:text-accent">
                  <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                  {entry.place}<span className="text-accent">{chosen ? 'Selected' : 'Show on map'}</span>
                </button>
                <span className="print-location hidden">{entry.place}</span>
                {range && <div className="duration-track relative mt-1 h-1.5 overflow-hidden rounded-full bg-line/60" aria-hidden="true">
                  <span className={`absolute inset-y-0 rounded-full ${active ? 'bg-accent/70' : 'bg-muted/35'}`} style={{ left: `${range.left}%`, width: `${range.width}%` }} />
                  {typeof year === 'number' && <span className="absolute inset-y-0 w-px bg-ink" style={{ left: `${(year - FIRST_YEAR + 0.5) / YEARS.length * 100}%` }} />}
                </div>}
              </article>
            </li>;
          })}
        </ol>
      </div>
      <aside ref={mapRef} tabIndex={-1} className="resume-map-panel order-first min-w-0 scroll-mt-4 lg:sticky lg:top-8 lg:order-last lg:max-h-[calc(100svh-4rem)] lg:overflow-y-auto lg:pr-2" aria-label="Experience locations">
        <button type="button" aria-expanded={mapOpen} aria-controls="resume-map-content" onClick={() => setMapOpen(!mapOpen)} className="flex min-h-11 w-full items-center justify-between border-b border-line font-display text-base lg:hidden">
          <span>{mapOpen ? 'Hide map' : 'Explore the map'}</span><span aria-hidden="true">{mapOpen ? '−' : '+'}</span>
        </button>
        <div id="resume-map-content" className={`${mapOpen ? 'block' : 'hidden'} lg:block`}>
          <h2 className="mb-3 mt-4 text-2xl lg:mt-0">Places along the way</h2>
          <ResumeMap selected={location} active={availableLocations(year)} onSelect={selectLocation} />
          <label className="mt-4 block font-display text-sm lg:hidden">Location
            <select value={location} onChange={(event) => selectLocation(event.target.value as LocationId)}
              className="mt-2 min-h-11 w-full rounded-md border border-line bg-paper px-3 text-base">
              {(Object.keys(LOCATIONS) as LocationId[]).map((id) => <option key={id} value={id}>{LOCATIONS[id].name}</option>)}
            </select>
          </label>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-display text-xs text-muted" aria-hidden="true"><span>● Active in selected period</span><span>○ Other locations</span></div>
          <div className="mt-5 border-t border-line pt-5" aria-live="polite" aria-atomic="false">
            <h3 className="text-xl">{LOCATIONS[location].name}</h3><p className="mt-1 text-sm text-muted">{LOCATIONS[location].region} · {period}</p>
            {regionEntries.length ? <ul className="mt-3 divide-y divide-line">{regionEntries.map((entry) => <li key={entry.id}>
              <button type="button" onClick={() => selectEntry(entry.id, true)} aria-pressed={selected === entry.id} className={`w-full rounded-sm py-3 text-left ${selected === entry.id ? 'text-accent' : 'text-ink hover:text-accent'}`}>
                <span className="block font-display text-sm font-semibold">{entry.org}</span><span className="block text-sm text-muted">{entry.role}</span><span className="block font-display text-xs text-muted">{entry.years}{entry.upcoming ? ' · Incoming' : ''}</span>
              </button></li>)}</ul> : <p className="mt-3 text-sm text-muted">No experiences here in this period. <button type="button" className="min-h-11 text-accent underline" onClick={() => selectYear('all')}>Show all years</button></p>}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted">Markers group nearby institutions. They show locations, not travel routes. Map: <a href="https://github.com/topojson/us-atlas" className="text-muted">U.S. Census / us-atlas</a>.</p>
        </div>
      </aside>
    </div>
  </section>;
}
