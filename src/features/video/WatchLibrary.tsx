import { Link } from 'react-router'
import { Check, Play } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionTabs } from '../../components/layout/SectionTabs'
import { Badge } from '../../components/ui/Badge'
import { useProgress } from '../../store/progress'
import { lessonForVideo, VIDEOS } from './videos'

export function WatchLibrary() {
  const watched = useProgress((s) => s.watched)
  return (
    <>
      <PageHeader title="Watch" subtitle="Short animated explainers, replayed in 3D from the overhead, behind the car or the driver's seat. Each one ends with a chance to drive it yourself." />
      <SectionTabs section="theory" />
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {VIDEOS.map((v) => {
          const lesson = lessonForVideo(v.id)
          return (
            <li key={v.id}>
              <Link to={`/watch/${v.id}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5">
                <div className="relative grid h-[130px] place-items-center bg-navy">
                  <span className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 20%, #13a36f, transparent 60%)' }} aria-hidden="true" />
                  <span className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-navy transition group-hover:scale-105">
                    <Play size={22} fill="currentColor" className="ml-0.5" />
                  </span>
                  {watched[v.id] && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[#13a36f] px-2 py-0.5 text-xs font-bold text-[#04140e]">
                      <Check size={12} strokeWidth={3} /> Watched
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <h2 className="text-base leading-snug font-bold">{v.title}</h2>
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{v.blurb}</p>
                  <div className="mt-auto pt-2">{lesson && <Badge tone="brand">Drive lesson {lesson.n}</Badge>}</div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
