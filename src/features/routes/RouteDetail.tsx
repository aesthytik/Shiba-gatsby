import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Box, TriangleAlert } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { buildRoute, segmentSummary } from './build'
import { routeById } from './data'
import { RouteMap } from './RouteMap'
import { InstructionIcon, RouteSim } from './RouteSim'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function RouteDetail() {
  const { routeId = '' } = useParams()
  const route = routeById(routeId)
  const built = useMemo(() => (route ? buildRoute(route) : undefined), [route])
  const [driving, setDriving] = useState(false)
  const [active, setActive] = useState<number | undefined>(undefined)

  if (!route || !built) {
    return (
      <>
        <PageHeader title="Route not found" back="/routes" />
        <ButtonLink to="/routes">All routes</ButtonLink>
      </>
    )
  }

  const sum = segmentSummary(route.segments)
  // Hotspots on a plain road show under the direction that leads onto it.
  const hotspotsFor = (seg: number) => route.hotspots.filter((h) => h.seg === seg || (h.seg === seg + 1 && route.segments[h.seg].t === 'road'))

  return (
    <>
      <PageHeader
        title={route.name}
        back="/routes"
        subtitle={route.summary}
        actions={
          !driving && (
            <Button onClick={() => setDriving(true)}>
              <Box size={16} /> Drive it in 3D
            </Button>
          )
        }
      />
      <div className="mb-5 flex flex-wrap gap-2 text-xs">
        <Badge tone={route.difficulty === 'Challenging' ? 'bad' : route.difficulty === 'Easier' ? 'ok' : 'brand'}>{route.difficulty}</Badge>
        <Badge>{(built.length / 1609).toFixed(1)} miles</Badge>
        <Badge>~{Math.round(built.duration / 60)} min drive</Badge>
        <Badge>{plural(sum.turns, 'junction turn')}</Badge>
        <Badge>{plural(sum.roundabouts + sum.minis, 'roundabout')}</Badge>
        <Badge tone="warn">Demo route</Badge>
      </div>

      {driving ? (
        <RouteSim built={built} onExit={() => setDriving(false)} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card className="overflow-hidden p-0">
            <div className="aspect-square bg-surface-2">
              <RouteMap built={built} activeStep={active} onSelectStep={setActive} />
            </div>
            <p className="border-t border-line px-4 py-2.5 text-xs text-muted">Numbers are directions; yellow markers are hotspots where candidates often pick up faults.</p>
          </Card>

          <Card className="p-0">
            <h2 className="border-b border-line px-5 py-3 font-semibold text-ink">Turn-by-turn</h2>
            <ol className="max-h-[70vh] divide-y divide-line overflow-y-auto">
              <li className="flex gap-3 px-5 py-3 text-sm text-muted">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-[11px] font-extrabold text-surface">TC</span>
                <span className="pt-1.5">Leave the test centre onto {route.segments[0].t === 'road' ? route.segments[0].name : 'the road'}.</span>
              </li>
              {built.instructions.map((ins, i) => {
                const hs = hotspotsFor(ins.seg)
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className={`flex w-full gap-3 px-5 py-3 text-left transition ${active === i ? 'bg-brand-soft' : 'hover:bg-surface-2'}`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ins.icon === 'task' ? 'bg-warn-soft text-warn' : 'bg-brand-soft text-brand'}`}>
                        <InstructionIcon ins={ins} size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">
                          {i + 1}. {ins.text}
                        </span>
                        {hs.map((h) => (
                          <span key={h.title} className="mt-1.5 block rounded-lg bg-warn-soft p-2 text-xs leading-relaxed text-ink">
                            <strong className="flex items-center gap-1 text-warn">
                              <TriangleAlert size={12} /> {h.title}
                            </strong>
                            {h.note}
                          </span>
                        ))}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>
      )}
    </>
  )
}
