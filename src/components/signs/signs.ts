// Road signs drawn from scratch as SVG markup (viewBox 0 0 100 100).
// Kept as strings so the same source renders in the UI and as textures in the 3D scenes.

const RED = '#d4111e'
const BLUE = '#1d5aa6'
const INK = '#141414'
const FONT = `font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle"`

const triangle = (inner: string) =>
  `<path d="M50 9 L93 86 H7 Z" fill="#fff" stroke="${RED}" stroke-width="8" stroke-linejoin="round"/>${inner}`
const ring = (inner: string) => `<circle cx="50" cy="50" r="44" fill="#fff" stroke="${RED}" stroke-width="10"/>${inner}`
const blueDisc = (inner: string) => `<circle cx="50" cy="50" r="46" fill="${BLUE}" stroke="#fff" stroke-width="2"/>${inner}`
const blueRect = (inner: string, h = 92) => `<rect x="4" y="${(100 - h) / 2}" width="92" height="${h}" rx="6" fill="${BLUE}" stroke="#fff" stroke-width="2"/>${inner}`
const asphalt = (inner: string) => `<rect x="2" y="2" width="96" height="96" rx="8" fill="#3b3f45"/>${inner}`
/** Red prohibition bar, top-left to bottom-right, clipped to the ring's inner edge. */
const prohibit = `<line x1="22" y1="22" x2="78" y2="78" stroke="${RED}" stroke-width="9"/>`
const arrowHead = (x: number, y: number, rot: number, size = 9, color = INK) =>
  `<path d="M${x} ${y - size} L${x + size} ${y + size * 0.6} H${x - size} Z" fill="${color}" transform="rotate(${rot} ${x} ${y})"/>`

const roundaboutArrows = (color: string, r: number, cy = 50, cx = 50, w = 6) => {
  let out = ''
  for (let k = 0; k < 3; k++) {
    const rot = k * 120
    // arc from -100° to -20° (clockwise on screen), with a head at the end
    const a0 = (-110 * Math.PI) / 180
    const a1 = (-30 * Math.PI) / 180
    const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)]
    const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)]
    const headRot = -30 + 180
    out += `<g transform="rotate(${rot} ${cx} ${cy})"><path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${r} ${r} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="${color}" stroke-width="${w}"/>${arrowHead(p1[0], p1[1], headRot, w * 1.25, color)}</g>`
  }
  return out
}

export const SIGNS = {
  stop: {
    name: 'Stop and give way',
    category: 'regulatory',
    meaning: 'Stop at the solid white line and give way to traffic on the major road, even if it looks clear.',
    svg: `<path d="M31 4 H69 L96 31 V69 L69 96 H31 L4 69 V31 Z" fill="${RED}" stroke="#fff" stroke-width="3"/><text x="50" y="60" ${FONT} font-size="27" fill="#fff">STOP</text>`,
  },
  'give-way': {
    name: 'Give way to traffic on the major road',
    category: 'regulatory',
    meaning: 'Give way to traffic on the major road. You may not need to stop if the way is clear.',
    svg: `<path d="M7 14 H93 L50 91 Z" fill="#fff" stroke="${RED}" stroke-width="8" stroke-linejoin="round"/><text x="50" y="38" ${FONT} font-size="14" fill="${INK}">GIVE</text><text x="50" y="54" ${FONT} font-size="14" fill="${INK}">WAY</text>`,
  },
  'no-entry': {
    name: 'No entry for vehicular traffic',
    category: 'regulatory',
    meaning: 'Vehicles must not enter. Often found at the exit of a one-way street.',
    svg: `<circle cx="50" cy="50" r="46" fill="${RED}" stroke="#fff" stroke-width="2"/><rect x="17" y="41" width="66" height="18" fill="#fff"/>`,
  },
  'national-speed-limit': {
    name: 'National speed limit applies',
    category: 'regulatory',
    meaning: 'For cars: 60 mph on single carriageways and 70 mph on dual carriageways and motorways.',
    svg: `<defs><clipPath id="nsl"><circle cx="50" cy="50" r="44"/></clipPath></defs><circle cx="50" cy="50" r="45" fill="#fff" stroke="${INK}" stroke-width="2.5"/><rect x="-10" y="39" width="120" height="22" fill="${INK}" clip-path="url(#nsl)" transform="rotate(-45 50 50)"/>`,
  },
  'speed-20': {
    name: 'Maximum speed 20 mph',
    category: 'regulatory',
    meaning: 'Do not exceed 20 mph. Red rings set a maximum.',
    svg: ring(`<text x="50" y="64" ${FONT} font-size="40" fill="${INK}">20</text>`),
  },
  'speed-30': {
    name: 'Maximum speed 30 mph',
    category: 'regulatory',
    meaning: 'Do not exceed 30 mph.',
    svg: ring(`<text x="50" y="64" ${FONT} font-size="40" fill="${INK}">30</text>`),
  },
  'speed-40': {
    name: 'Maximum speed 40 mph',
    category: 'regulatory',
    meaning: 'Do not exceed 40 mph.',
    svg: ring(`<text x="50" y="64" ${FONT} font-size="40" fill="${INK}">40</text>`),
  },
  'speed-50': {
    name: 'Maximum speed 50 mph',
    category: 'regulatory',
    meaning: 'Do not exceed 50 mph.',
    svg: ring(`<text x="50" y="64" ${FONT} font-size="40" fill="${INK}">50</text>`),
  },
  'no-right-turn': {
    name: 'No right turn',
    category: 'regulatory',
    meaning: 'Turning right is prohibited at the junction ahead.',
    svg: ring(`<path d="M38 78 V48 Q38 40 46 40 H60" fill="none" stroke="${INK}" stroke-width="8"/>${arrowHead(64, 40, 90, 10)}${prohibit}`),
  },
  'no-left-turn': {
    name: 'No left turn',
    category: 'regulatory',
    meaning: 'Turning left is prohibited at the junction ahead.',
    svg: ring(`<path d="M62 78 V48 Q62 40 54 40 H40" fill="none" stroke="${INK}" stroke-width="8"/>${arrowHead(36, 40, -90, 10)}${prohibit}`),
  },
  'no-u-turn': {
    name: 'No U-turns',
    category: 'regulatory',
    meaning: 'You must not make a U-turn.',
    svg: ring(`<path d="M60 76 V44 A11 11 0 0 0 38 44 V62" fill="none" stroke="${INK}" stroke-width="8"/>${arrowHead(38, 66, 180, 10)}${prohibit}`),
  },
  'no-waiting': {
    name: 'No waiting',
    category: 'regulatory',
    meaning: 'You may stop briefly to load or let passengers in or out, but not wait. Check plates for times.',
    svg: `<circle cx="50" cy="50" r="44" fill="${BLUE}" stroke="${RED}" stroke-width="10"/><line x1="21" y1="21" x2="79" y2="79" stroke="${RED}" stroke-width="10"/>`,
  },
  'no-stopping': {
    name: 'No stopping (clearway)',
    category: 'regulatory',
    meaning: 'No stopping at any time, not even to pick up or set down passengers.',
    svg: `<circle cx="50" cy="50" r="44" fill="${BLUE}" stroke="${RED}" stroke-width="10"/><line x1="21" y1="21" x2="79" y2="79" stroke="${RED}" stroke-width="10"/><line x1="79" y1="21" x2="21" y2="79" stroke="${RED}" stroke-width="10"/>`,
  },
  'ahead-only': {
    name: 'Ahead only',
    category: 'regulatory',
    meaning: 'Blue circles tell you what you must do. Here you must go straight ahead.',
    svg: blueDisc(`<rect x="44" y="40" width="12" height="40" fill="#fff"/>${arrowHead(50, 32, 0, 16, '#fff')}`),
  },
  'keep-left': {
    name: 'Keep left',
    category: 'regulatory',
    meaning: 'Pass on the left of the sign, usually around a traffic island.',
    svg: blueDisc(`<g transform="rotate(-135 50 50)"><rect x="44" y="36" width="12" height="40" fill="#fff"/>${arrowHead(50, 30, 0, 16, '#fff')}</g>`),
  },
  'mini-roundabout': {
    name: 'Mini-roundabout',
    category: 'regulatory',
    meaning: 'Give way to traffic from the right and go round the central marking.',
    svg: blueDisc(roundaboutArrows('#fff', 24, 50, 50, 7)),
  },
  'min-speed-30': {
    name: 'Minimum speed 30 mph',
    category: 'regulatory',
    meaning: 'You must travel at no less than 30 mph (unless it is unsafe). Blue circles give positive instructions.',
    svg: blueDisc(`<text x="50" y="64" ${FONT} font-size="40" fill="#fff">30</text>`),
  },
  'warn-crossroads': {
    name: 'Crossroads ahead',
    category: 'warning',
    meaning: 'A crossroads is ahead. Look out for traffic joining and crossing.',
    svg: triangle(`<rect x="45" y="36" width="10" height="42" fill="${INK}"/><rect x="29" y="52" width="42" height="10" fill="${INK}"/>`),
  },
  'warn-t-junction': {
    name: 'T-junction ahead',
    category: 'warning',
    meaning: 'The road ends at a T-junction ahead. You will need to turn left or right.',
    svg: triangle(`<rect x="45" y="48" width="10" height="30" fill="${INK}"/><rect x="27" y="40" width="46" height="10" fill="${INK}"/>`),
  },
  'warn-roundabout': {
    name: 'Roundabout ahead',
    category: 'warning',
    meaning: 'A roundabout is ahead. Plan your lane and speed early.',
    svg: triangle(roundaboutArrows(INK, 14, 61, 50, 5)),
  },
  'warn-bend-right': {
    name: 'Bend to the right',
    category: 'warning',
    meaning: 'The road bends to the right ahead. Slow down before the bend.',
    svg: triangle(`<path d="M44 80 V60 Q44 46 58 42" fill="none" stroke="${INK}" stroke-width="8"/>${arrowHead(60, 41, 70, 9)}`),
  },
  'warn-double-bend': {
    name: 'Double bend, first to the left',
    category: 'warning',
    meaning: 'A double bend is ahead, first to the left. Slow down and keep left.',
    svg: triangle(`<path d="M56 81 C56 70 42 68 42 59 C42 51 58 50 58 42" fill="none" stroke="${INK}" stroke-width="7"/>${arrowHead(58, 38, 0, 8)}`),
  },
  'warn-road-narrows': {
    name: 'Road narrows on both sides',
    category: 'warning',
    meaning: 'The road gets narrower ahead. Be ready to give way to oncoming traffic.',
    svg: triangle(`<path d="M37 80 V66 L44 56 V40 M63 80 V66 L56 56 V40" fill="none" stroke="${INK}" stroke-width="6"/>`),
  },
  'warn-two-way': {
    name: 'Two-way traffic straight ahead',
    category: 'warning',
    meaning: 'You are leaving a one-way section. Expect traffic coming towards you.',
    svg: triangle(`<rect x="38" y="48" width="7" height="30" fill="${INK}"/>${arrowHead(41.5, 43, 0, 8)}<rect x="55" y="40" width="7" height="30" fill="${INK}"/>${arrowHead(58.5, 75, 180, 8)}`),
  },
  'warn-traffic-signals': {
    name: 'Traffic signals ahead',
    category: 'warning',
    meaning: 'Traffic lights ahead that you may not be expecting. Be ready to stop.',
    svg: triangle(`<rect x="40" y="34" width="20" height="46" rx="4" fill="${INK}"/><circle cx="50" cy="43" r="5.5" fill="#e3262e"/><circle cx="50" cy="57" r="5.5" fill="#f5a300"/><circle cx="50" cy="71" r="5.5" fill="#1aa64b"/>`),
  },
  'warn-humps': {
    name: 'Road humps',
    category: 'warning',
    meaning: 'Traffic-calming humps ahead. Slow down.',
    svg: triangle(`<path d="M24 74 H30 Q36 58 42 74 H58 Q64 58 70 74 H76" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`),
  },
  'warn-steep-down': {
    name: 'Steep hill downwards',
    category: 'warning',
    meaning: 'A steep downhill gradient. Use a lower gear and control your speed.',
    svg: triangle(`<path d="M25 78 H75 L25 54 Z" fill="${INK}"/><text x="58" y="56" ${FONT} font-size="15" fill="${INK}">10%</text>`),
  },
  'warn-other-danger': {
    name: 'Other danger',
    category: 'warning',
    meaning: 'A hazard not covered by other signs. A plate below usually explains it.',
    svg: triangle(`<rect x="45" y="36" width="10" height="28" rx="3" fill="${INK}"/><circle cx="50" cy="73" r="5.5" fill="${INK}"/>`),
  },
  'one-way': {
    name: 'One-way traffic',
    category: 'informatory',
    meaning: 'Traffic on this road travels in the direction of the arrow only.',
    svg: blueRect(`<rect x="16" y="45" width="52" height="10" fill="#fff"/>${arrowHead(76, 50, 90, 13, '#fff')}`, 56),
  },
  'priority-over-oncoming': {
    name: 'Priority over vehicles from the opposite direction',
    category: 'informatory',
    meaning: 'You have priority through the narrow section ahead (your direction is the larger white arrow).',
    svg: blueRect(`<rect x="33" y="40" width="10" height="40" fill="#fff"/>${arrowHead(38, 30, 0, 14, '#fff')}<rect x="60" y="24" width="7" height="34" fill="${RED}"/>${arrowHead(63.5, 66, 180, 10, RED)}`),
  },
  parking: {
    name: 'Parking place',
    category: 'informatory',
    meaning: 'A place where you can park. Check plates for any time limits or charges.',
    svg: blueRect(`<text x="50" y="74" ${FONT} font-size="62" fill="#fff">P</text>`),
  },
  motorway: {
    name: 'Start of motorway',
    category: 'motorway',
    meaning: 'Motorway regulations apply from this point. Learner drivers may only continue with an approved instructor in a dual-controlled car.',
    svg: blueRect(`<rect x="14" y="22" width="72" height="8" fill="#fff"/><path d="M20 84 L40 34 M80 84 L60 34" stroke="#fff" stroke-width="6"/><path d="M50 84 V74 M50 66 V58 M50 50 V44" stroke="#fff" stroke-width="4"/>`),
  },
  'countdown-300': {
    name: 'Countdown marker: 300 yards to the exit',
    category: 'motorway',
    meaning: 'About 300 yards to the start of the exit slip road. Two bars ≈ 200 yards, one ≈ 100 yards.',
    svg: `<rect x="22" y="4" width="56" height="92" rx="4" fill="${BLUE}" stroke="#fff" stroke-width="2"/><g stroke="#fff" stroke-width="9"><line x1="28" y1="36" x2="72" y2="18"/><line x1="28" y1="60" x2="72" y2="42"/><line x1="28" y1="84" x2="72" y2="66"/></g>`,
  },
  'mark-box-junction': {
    name: 'Box junction',
    category: 'markings',
    meaning: 'Do not enter unless your exit is clear (unless turning right and only blocked by oncoming traffic).',
    svg: asphalt(`<rect x="14" y="14" width="72" height="72" fill="none" stroke="#f7c600" stroke-width="3"/><g stroke="#f7c600" stroke-width="2.5"><line x1="14" y1="14" x2="86" y2="86"/><line x1="86" y1="14" x2="14" y2="86"/><line x1="14" y1="38" x2="62" y2="86"/><line x1="38" y1="14" x2="86" y2="62"/><line x1="14" y1="62" x2="38" y2="86"/><line x1="62" y1="14" x2="86" y2="38"/><line x1="86" y1="38" x2="38" y2="86"/><line x1="62" y1="14" x2="14" y2="62"/><line x1="86" y1="62" x2="62" y2="86"/><line x1="38" y1="14" x2="14" y2="38"/></g>`),
  },
  'mark-zigzag': {
    name: 'Zig-zag lines at a pedestrian crossing',
    category: 'markings',
    meaning: 'Controlled area near a crossing: you must not park or overtake the leading vehicle approaching the crossing.',
    svg: asphalt(`<path d="M28 8 L20 18 L28 28 L20 38 L28 48 L20 58 L28 68 L20 78 L28 88" fill="none" stroke="#fff" stroke-width="3"/><path d="M80 8 L72 18 L80 28 L72 38 L80 48 L72 58 L80 68 L72 78 L80 88" fill="none" stroke="#fff" stroke-width="3"/><g fill="#fff"><rect x="34" y="88" width="32" height="6"/></g><path d="M51 8 V20 M51 30 V42 M51 52 V64 M51 74 V86" stroke="#fff" stroke-width="2.5"/>`),
  },
  'mark-double-white': {
    name: 'Double white lines — solid line nearest you',
    category: 'markings',
    meaning: 'You must not cross or straddle the solid line except to pass a stationary vehicle, or overtake a cyclist, horse or road maintenance vehicle moving at 10 mph or less.',
    svg: asphalt(`<rect x="44" y="6" width="4" height="88" fill="#fff"/><path d="M54 8 V26 M54 38 V56 M54 68 V86" stroke="#fff" stroke-width="4"/><path d="M26 72 L26 44" stroke="#9aa3ad" stroke-width="2" stroke-dasharray="2 3"/>${arrowHead(26, 40, 0, 6, '#9aa3ad')}`),
  },
} as const satisfies Record<string, { name: string; category: SignCategory; meaning: string; svg: string }>

export type SignCategory = 'warning' | 'regulatory' | 'informatory' | 'motorway' | 'markings'
export type SignId = keyof typeof SIGNS

export const SIGN_CATEGORIES: { id: SignCategory; name: string; rule: string }[] = [
  { id: 'regulatory', name: 'Orders', rule: 'Circles give orders. Red rings prohibit, blue circles tell you what you must do.' },
  { id: 'warning', name: 'Warnings', rule: 'Triangles warn of hazards ahead.' },
  { id: 'informatory', name: 'Information', rule: 'Rectangles inform. Blue rectangles are local information, green are primary routes.' },
  { id: 'motorway', name: 'Motorway', rule: 'Motorway signs are blue.' },
  { id: 'markings', name: 'Road markings', rule: 'Markings on the road surface carry the same legal weight as signs.' },
]

export function signSvg(id: SignId, size = 100) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${SIGNS[id].svg}</svg>`
}
