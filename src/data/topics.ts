import type { SignId } from '../components/signs/signs'

/** The 14 topic areas DVSA uses for the car theory test. */
export const TOPICS = [
  { id: 'alertness', name: 'Alertness', blurb: 'Observation, distractions, tiredness' },
  { id: 'attitude', name: 'Attitude', blurb: 'Patience, courtesy, following distance' },
  { id: 'safety-vehicle', name: 'Safety and your vehicle', blurb: 'Checks, faults, tyres, lights' },
  { id: 'safety-margins', name: 'Safety margins', blurb: 'Stopping distances, weather' },
  { id: 'hazard-awareness', name: 'Hazard awareness', blurb: 'Spotting and reacting to danger' },
  { id: 'vulnerable', name: 'Vulnerable road users', blurb: 'Pedestrians, cyclists, horse riders' },
  { id: 'other-vehicles', name: 'Other types of vehicle', blurb: 'Lorries, buses, trams, motorcycles' },
  { id: 'vehicle-handling', name: 'Vehicle handling', blurb: 'Braking, skids, hills, conditions' },
  { id: 'motorway', name: 'Motorway rules', blurb: 'Joining, lanes, signals, breakdowns' },
  { id: 'rules-of-road', name: 'Rules of the road', blurb: 'Speed limits, junctions, parking' },
  { id: 'signs', name: 'Road and traffic signs', blurb: 'Signs, signals and markings' },
  { id: 'documents', name: 'Essential documents', blurb: 'Licences, insurance, MOT, penalties' },
  { id: 'incidents', name: 'Incidents and emergencies', blurb: 'Breakdowns, collisions, first aid' },
  { id: 'loading', name: 'Vehicle loading', blurb: 'Passengers, children, towing, loads' },
] as const

export type TopicId = (typeof TOPICS)[number]['id']

export interface Question {
  id: string
  topic: TopicId
  q: string
  /** First option is always the correct one in the source data; options are shuffled for display. */
  options: [string, string, string, string]
  explain: string
  ref?: string
  sign?: SignId
}

export function topicName(id: TopicId) {
  return TOPICS.find((t) => t.id === id)?.name ?? id
}
