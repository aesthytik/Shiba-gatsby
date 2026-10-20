// A test route is a script of driving elements. The generator in build.ts turns it into
// geometry, turn-by-turn directions and a speed profile for the map and the 3D drive-through.

export type JunctionKind = 'side-road' | 't-junction' | 'crossroads'
export type Control = 'give-way' | 'stop' | 'lights' | 'none'

export interface RoadFeature {
  /** Metres from the start of the road segment. */
  at: number
  kind: 'zebra' | 'bus-stop' | 'humps' | 'school'
}

export type Segment =
  | { t: 'road'; len: number; limit: 20 | 30 | 40 | 50 | 60; name?: string; area?: 'urban' | 'rural'; bend?: number; features?: RoadFeature[] }
  | { t: 'turn'; dir: 'left' | 'right' | 'ahead'; at: JunctionKind; control?: Control; into: string }
  | { t: 'roundabout'; exit: number; exits?: number; mini?: boolean; into: string }
  | { t: 'task'; kind: 'normal-stop' | 'pull-up-right' | 'emergency-stop' | 'parallel-park' | 'hill-start'; say: string }

export interface Hotspot {
  /** Index into the route's segments. */
  seg: number
  title: string
  note: string
}

export interface TestRoute {
  id: string
  centreId: string
  name: string
  summary: string
  difficulty: 'Easier' | 'Typical' | 'Challenging'
  segments: Segment[]
  hotspots: Hotspot[]
}

export interface TestCentre {
  id: string
  name: string
  area: string
  description: string
  demo: boolean
}
