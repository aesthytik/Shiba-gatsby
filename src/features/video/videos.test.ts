import { describe, expect, it } from 'vitest'
import { PLAYABLE } from '../drive/lessons'
import { VIDEOS, buildReplay, frameAt, lessonForVideo, videoById } from './videos'

describe('video helpers', () => {
  it('has a video for every playable lesson, and every video points at a lesson', () => {
    for (const l of PLAYABLE) expect(videoById(l.video), `lesson ${l.n}`).toBeDefined()
    for (const v of VIDEOS) expect(lessonForVideo(v.id), v.id).toBeDefined()
  })

  it.each(VIDEOS.map((v) => v.id))('%s: replays a clean drive with chapters in order inside its running time', (id) => {
    const def = videoById(id)!
    const r = buildReplay(def)
    expect(r.duration).toBeGreaterThan(12)
    expect(r.duration).toBeLessThan(120)
    expect(r.chapterTimes).toHaveLength(def.chapters.length)
    r.chapterTimes.forEach((t, i) => {
      expect(t).toBeGreaterThanOrEqual(0)
      expect(t).toBeLessThanOrEqual(r.duration)
      if (i) expect(t).toBeGreaterThanOrEqual(r.chapterTimes[i - 1])
    })
    // Chapters should be spread out, not all collapsed at one moment.
    expect(new Set(r.chapterTimes.map((t) => Math.round(t))).size).toBeGreaterThanOrEqual(Math.min(3, def.chapters.length))
  })

  it('interpolates between frames', () => {
    const r = buildReplay(videoById('rbt-2')!)
    const a = frameAt(r, 10)
    const b = frameAt(r, 10 + 0.5 / r.fps)
    const c = frameAt(r, 10 + 1 / r.fps)
    expect(Math.abs(b.car.x - (a.car.x + c.car.x) / 2)).toBeLessThan(0.01)
  })
})
