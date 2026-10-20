import { describe, expect, it } from 'vitest'
import { detectPattern, pointsForClick, scaleTo75, scoreClip } from './scoring'

const w = { id: 'h', start: 10, end: 15 }

describe('pointsForClick', () => {
  it('awards 5 to 1 across five equal bands', () => {
    expect(pointsForClick(w, 10)).toBe(5)
    expect(pointsForClick(w, 10.99)).toBe(5)
    expect(pointsForClick(w, 11.01)).toBe(4)
    expect(pointsForClick(w, 13.5)).toBe(2)
    expect(pointsForClick(w, 14.99)).toBe(1)
    expect(pointsForClick(w, 15)).toBe(1)
  })
  it('awards nothing outside the window', () => {
    expect(pointsForClick(w, 9.9)).toBe(0)
    expect(pointsForClick(w, 15.1)).toBe(0)
  })
})

describe('scoreClip', () => {
  it('scores only the first click inside each window', () => {
    const r = scoreClip([w], [4, 12.5, 10.2], 20)
    expect(r.hazards[0]).toEqual({ id: 'h', points: 5, clickAt: 10.2 })
    expect(r.total).toBe(5)
  })
  it('handles two hazards in one clip', () => {
    const r = scoreClip([w, { id: 'h2', start: 20, end: 25 }], [11.5, 24.5], 30)
    expect(r.total).toBe(4 + 1)
    expect(r.max).toBe(10)
  })
  it('zeroes the clip for continuous clicking', () => {
    const r = scoreClip([w], [10.1, 10.4, 10.8, 11.2, 11.6], 20)
    expect(r.patternFlagged).toBe(true)
    expect(r.total).toBe(0)
  })
})

describe('detectPattern', () => {
  it('allows a few clicks per hazard', () => {
    expect(detectPattern([3, 10.2, 11, 12.1], 20)).toBeUndefined()
  })
  it('flags rhythmic clicking', () => {
    expect(detectPattern([1, 3, 5, 7, 9, 11, 13], 20)).toBeDefined()
  })
})

it('scales a practice score to the 75-point test', () => {
  expect(scaleTo75(35, 35)).toBe(75)
  expect(scaleTo75(0, 35)).toBe(0)
})
