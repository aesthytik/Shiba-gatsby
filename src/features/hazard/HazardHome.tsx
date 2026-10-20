import { Link } from 'react-router'
import { CloudRain, Moon, Play, Sun, Cloud, Timer } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, LinkCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useProgress } from '../../store/progress'
import { CLIPS, TOTAL_HAZARDS, type EnvPreset } from './clips'
import { HP_PASS_MARK } from './scoring'

const ENV_ICON: Record<EnvPreset, typeof Sun> = { sunny: Sun, overcast: Cloud, dusk: Moon, rain: CloudRain }

export default function HazardHome() {
  const results = useProgress((s) => s.hazardResults)
  const best = (id: string) => results.filter((r) => r.clipId === id).reduce<number | null>((b, r) => (b === null || r.score > b ? r.score : b), null)

  return (
    <>
      <PageHeader
        title="Hazard perception"
        subtitle={`The real test has 14 clips with 15 developing hazards, scored up to 5 points each. You need ${HP_PASS_MARK} out of 75 to pass. These practice clips are original 3D scenes, scored the same way.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <LinkCard to="/hazard/mock" icon={<Timer size={22} />} title="Hazard perception mock">
          Play all {CLIPS.length} clips ({TOTAL_HAZARDS} hazards) back to back, with your score scaled to the 75-point test.
        </LinkCard>
        <Card className="text-sm leading-relaxed text-muted">
          <p className="mb-1 font-semibold text-ink">What is a developing hazard?</p>
          Something that would make you take action, such as slowing down, changing direction or stopping. Click when you first see it start to develop — and
          click once or twice, not continuously.
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CLIPS.map((clip, i) => {
          const Icon = ENV_ICON[clip.env]
          const b = best(clip.id)
          const max = clip.hazards.length * 5
          return (
            <Link
              key={clip.id}
              to={`/hazard/${clip.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5"
            >
              <div className={`relative grid aspect-video place-items-center ${THUMB[clip.env]}`}>
                <RoadThumb />
                <span className="absolute grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white transition group-hover:scale-110">
                  <Play size={22} className="ml-0.5 fill-white" />
                </span>
                <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <Icon size={12} /> Clip {i + 1}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{clip.title}</p>
                  {b !== null && <Badge tone={b >= max * 0.6 ? 'ok' : 'warn'}>Best {b}/{max}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">{clip.summary}</p>
                <p className="mt-2 text-xs text-muted">
                  {clip.duration}s · {clip.hazards.length} hazard{clip.hazards.length > 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

const THUMB: Record<EnvPreset, string> = {
  sunny: 'bg-gradient-to-b from-sky-300 to-sky-100',
  overcast: 'bg-gradient-to-b from-slate-400 to-slate-200',
  dusk: 'bg-gradient-to-b from-indigo-900 to-orange-300',
  rain: 'bg-gradient-to-b from-slate-500 to-slate-300',
}

function RoadThumb() {
  return (
    <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <rect y="52" width="160" height="38" fill="#7d9c4f" />
      <path d="M62 52 L98 52 L150 90 L10 90 Z" fill="#4b4f55" />
      <path d="M80 54 V58 M80 63 V69 M80 75 V84" stroke="#f2f2f2" strokeWidth="1.5" />
    </svg>
  )
}
