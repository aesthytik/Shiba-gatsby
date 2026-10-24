import { useMemo } from 'react'
import { Link } from 'react-router'
import { Info, MapPin } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useProgress } from '../../store/progress'
import { buildRoute, segmentSummary } from './build'
import { CENTRES, ROUTES } from './data'
import { RouteMap } from './RouteMap'
import { SectionTabs } from '../../components/layout/SectionTabs'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function RoutesHome() {
  const driven = useProgress((s) => s.routesDriven)
  const built = useMemo(() => ROUTES.map(buildRoute), [])

  return (
    <>
      <PageHeader
        title="Test routes"
        subtitle="Preview the kind of roads, junctions and manoeuvres you'll meet around a test centre — with turn-by-turn directions and a 3D drive-through."
      />
      <SectionTabs section="drive" />

      <Card className="mb-6 flex gap-3 border-warn/40 bg-warn-soft text-sm leading-relaxed text-ink">
        <Info size={18} className="mt-0.5 shrink-0 text-warn" />
        <p>
          DVSA does not publish test routes, and examiners can use any roads near the centre. The routes here are around a <strong>fictional demo centre</strong> to show how the
          feature works. Real centres and routes would be added from instructor-recorded drives.
        </p>
      </Card>

      {CENTRES.map((c) => (
        <section key={c.id} className="mb-8">
          <div className="mb-3 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <MapPin size={20} />
            </span>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                {c.name} {c.demo && <Badge tone="warn">Demo</Badge>}
              </h2>
              <p className="text-sm text-muted">{c.description}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {built
              .filter((b) => b.route.centreId === c.id)
              .map((b) => {
                const sum = segmentSummary(b.route.segments)
                return (
                  <Link
                    key={b.route.id}
                    to={`/routes/${b.route.id}`}
                    className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5"
                  >
                    <div className="aspect-[4/3] border-b border-line bg-surface-2">
                      <RouteMap built={b} compact />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink">{b.route.name}</p>
                        <Badge tone={b.route.difficulty === 'Challenging' ? 'bad' : b.route.difficulty === 'Easier' ? 'ok' : 'brand'}>{b.route.difficulty}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{b.route.summary}</p>
                      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-muted">
                        <span>{(b.length / 1609).toFixed(1)} miles</span>
                        <span>~{Math.round(b.duration / 60)} min</span>
                        {sum.roundabouts + sum.minis > 0 && <span>{plural(sum.roundabouts + sum.minis, 'roundabout')}</span>}
                        {sum.tasks > 0 && <span>{plural(sum.tasks, 'examiner task')}</span>}
                        {driven[b.route.id] ? <span className="text-ok">✓ driven {driven[b.route.id]}×</span> : null}
                      </p>
                    </div>
                  </Link>
                )
              })}
          </div>
        </section>
      ))}
    </>
  )
}
