import { LOCATIONS, type LocationId } from '../../data/resume';
import geography from '../../data/resume-map.json';

type Props = { selected: LocationId; active: LocationId[]; onSelect: (id: LocationId) => void };
const labels: Record<LocationId, { x: number; y: number; anchor?: 'end' | 'start' }> = {
  minnesota: { x: 91, y: 74 }, cambridge: { x: 432, y: 105, anchor: 'end' },
  newyork: { x: 330, y: 188, anchor: 'end' },
  hampton: { x: 325, y: 253, anchor: 'end' }, miami: { x: 325, y: 428 },
};

export default function ResumeMap({ selected, active, onSelect }: Props) {
  const [sx, sy] = geography.markers[selected];
  return <svg viewBox="0 0 480 460" className="resume-map w-full" role="group" aria-label="Map of education and experience locations">
    <title>Education and experience in the eastern United States</title>
    <defs><clipPath id="resume-map-clip"><rect width="480" height="460" rx="12" /></clipPath></defs>
    <g clipPath="url(#resume-map-clip)">
      <rect width="480" height="460" className="fill-accent/[0.025]" />
      <g className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out" style={{ transform: `translate(${(240 - sx) * 0.035}px, ${(220 - sy) * 0.035}px)` }}>
        <g aria-hidden="true" className="fill-line/40 stroke-muted/25" strokeWidth="0.7">
          {geography.states.map((state) => <path key={state.name} d={state.path ?? ''} />)}
        </g>
        <text x="370" y="345" className="fill-muted/60 font-serif text-[13px] italic" aria-hidden="true">Atlantic Ocean</text>
        {(Object.entries(LOCATIONS) as [LocationId, typeof LOCATIONS[LocationId]][]).map(([id, place]) => {
          const [x, y] = geography.markers[id];
          const label = labels[id];
          const enabled = active.includes(id);
          const chosen = selected === id;
          const labelWidth = id === 'newyork' ? 142 : place.name.length * 8 + 16;
          return <g key={id} role="button" tabIndex={0} aria-label={`${place.name}, ${place.region}${enabled ? '' : ', no experiences in selected period'}`}
            aria-pressed={chosen} onClick={() => onSelect(id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); } }}
            className={`map-marker cursor-pointer ${enabled ? 'text-accent' : 'text-muted'}`}>
            <title>{`${place.name}, ${place.region}`}</title>
            <rect x={label.anchor === 'end' ? label.x - labelWidth + 8 : label.x - 8} y={label.y - 24}
              width={labelWidth} height={id === 'newyork' ? 52 : 44} fill="transparent" />
            <circle cx={x} cy={y} r="24" fill="transparent" />
            {chosen && <circle cx={x} cy={y} r="16" fill="currentColor" opacity="0.12" />}
            <circle cx={x} cy={y} r={chosen ? 7 : 5} fill={enabled ? 'currentColor' : 'var(--color-paper)'} stroke="currentColor" strokeWidth="2" />
            <path d={`M${x} ${y} L${label.x} ${label.y - 7}`} fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.55" aria-hidden="true" />
            <text x={label.x} y={label.y} textAnchor={label.anchor ?? 'start'} className={`map-label font-display text-[14px] ${chosen ? 'font-semibold fill-accent' : 'fill-ink'}`}>
              {id === 'newyork' ? <><tspan x={label.x}>New York</tspan><tspan x={label.x} dy="16">&amp; Long Island</tspan></> : place.name}
            </text>
          </g>;
        })}
      </g>
    </g>
  </svg>;
}
