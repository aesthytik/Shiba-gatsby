// Practical test content. The show me / tell me questions and answers are based on the DVSA list
// published on GOV.UK under the Open Government Licence v3.0.

export interface VehicleQuestion {
  id: string
  kind: 'tell' | 'show'
  q: string
  a: string
}

export const VEHICLE_QUESTIONS: VehicleQuestion[] = [
  { id: 't1', kind: 'tell', q: "Tell me how you'd check that the brakes are working before starting a journey.", a: 'Brakes should not feel spongy or slack. Test them as you set off. The car should not pull to one side.' },
  {
    id: 't2',
    kind: 'tell',
    q: "Tell me where you'd find the information for the recommended tyre pressures for this car and how tyre pressures should be checked.",
    a: "The manufacturer's guide (handbook). Use a reliable pressure gauge, check and adjust pressures when the tyres are cold, don't forget the spare tyre, and remember to refit the valve caps.",
  },
  {
    id: 't3',
    kind: 'tell',
    q: 'Tell me how you make sure your head restraint is correctly adjusted so it provides the best protection in the event of a crash.',
    a: 'Adjust it so the rigid part is at least as high as your eyes or the top of your ears, and as close to the back of your head as is comfortable. Some restraints are not adjustable.',
  },
  {
    id: 't4',
    kind: 'tell',
    q: "Tell me how you'd check the tyres to ensure that they have sufficient tread depth and that their general condition is safe to use on the road.",
    a: 'No cuts or bulges, and at least 1.6 mm of tread across the central three-quarters of the tyre and around the entire circumference.',
  },
  {
    id: 't5',
    kind: 'tell',
    q: "Tell me how you'd check that the headlights and tail lights are working. You don't need to exit the vehicle.",
    a: "Turn the lights on (switch on the ignition if needed), then walk round the car to check. As it's a 'tell me' question, you don't need to physically check them.",
  },
  { id: 't6', kind: 'tell', q: "Tell me how you'd know if there was a problem with your anti-lock braking system.", a: 'A warning light on the dashboard would come on if there was a fault with the ABS.' },
  {
    id: 't7',
    kind: 'tell',
    q: "Tell me how you'd check the direction indicators are working. You don't need to exit the vehicle.",
    a: 'Operate the indicator switch, or the hazard warning lights (switch on the ignition if needed), then walk round the car to check they are all flashing.',
  },
  {
    id: 't8',
    kind: 'tell',
    q: "Tell me how you'd check the brake lights are working on this car.",
    a: 'Press the brake pedal and use reflections in windows or garage doors, or ask someone to help.',
  },
  {
    id: 't9',
    kind: 'tell',
    q: "Tell me how you'd check the power-assisted steering is working before starting a journey.",
    a: 'If the steering becomes heavy the system may not be working. Either keep gentle pressure on the wheel while starting the engine — you should feel a slight movement as the system starts — or turn the wheel just after moving off to check it feels normal.',
  },
  {
    id: 't10',
    kind: 'tell',
    q: "Tell me how you'd switch on the rear fog light(s) and explain when you'd use it/them. You don't need to exit the vehicle.",
    a: 'Switch on dipped headlights, then the fog light switch, and check the warning light is on. Use them when visibility is seriously reduced, generally to less than 100 metres.',
  },
  {
    id: 't11',
    kind: 'tell',
    q: "Tell me how you switch your headlight from dipped to main beam and explain how you'd know the main beam is on.",
    a: 'Operate the headlight stalk or switch (with the ignition on if needed) and check the blue main-beam warning light on the dashboard.',
  },
  {
    id: 't12',
    kind: 'tell',
    q: "Open the bonnet and tell me how you'd check that the engine has sufficient oil.",
    a: 'Find the dipstick or oil level indicator and check the level is between the minimum and maximum marks.',
  },
  {
    id: 't13',
    kind: 'tell',
    q: "Open the bonnet and tell me how you'd check that the engine has sufficient engine coolant.",
    a: 'Find the high and low level markings on the coolant header tank (or the radiator filler cap) and describe how you would top it up to the correct level.',
  },
  {
    id: 't14',
    kind: 'tell',
    q: "Open the bonnet and tell me how you'd check that you have a safe level of hydraulic brake fluid.",
    a: 'Find the brake fluid reservoir and check the level is between the high and low markings.',
  },
  { id: 's1', kind: 'show', q: "When it's safe to do so, can you show me how you wash and clean the rear windscreen?", a: 'Operate the control to wash and wipe the rear windscreen.' },
  { id: 's2', kind: 'show', q: "When it's safe to do so, can you show me how you wash and clean the front windscreen?", a: 'Operate the control to wash and wipe the windscreen (turn the ignition on if needed).' },
  { id: 's3', kind: 'show', q: "When it's safe to do so, can you show me how you'd switch on your dipped headlights?", a: 'Operate the headlight switch (turn the ignition on if needed).' },
  { id: 's4', kind: 'show', q: "When it's safe to do so, can you show me how you'd set the rear demister?", a: 'Operate the rear demister switch (turn the ignition on if needed).' },
  { id: 's5', kind: 'show', q: "When it's safe to do so, can you show me how you'd operate the horn?", a: 'Press the horn (turn the ignition on if needed).' },
  {
    id: 's6',
    kind: 'show',
    q: "When it's safe to do so, can you show me how you'd demist the front windscreen?",
    a: 'Set the heating and ventilation to demist the windscreen: fan speed, temperature, air direction and source, and heated screen if fitted.',
  },
  { id: 's7', kind: 'show', q: "When it's safe to do so, can you show me how you'd open and close the side window?", a: 'Operate the control to open and then close the window.' },
]

export const CAR_CHECKLIST = [
  { id: 'licence', label: 'Your UK photocard provisional driving licence' },
  { id: 'glasses', label: 'Glasses or contact lenses if you need them to read a number plate' },
  { id: 'own-car-tax', label: 'If using your own car: taxed, insured for a driving test, and roadworthy with a current MOT' },
  { id: 'own-car-lights', label: 'No warning lights showing (e.g. airbag or engine light) and no tyre damage' },
  { id: 'own-car-l', label: 'L plates (or D plates in Wales) on the front and back' },
  { id: 'own-car-mirror', label: 'An extra interior rear-view mirror for the examiner' },
  { id: 'own-car-seat', label: 'Passenger seat belt and a proper passenger head restraint' },
  { id: 'arrive-early', label: 'Plan to arrive about 10 minutes early' },
]

export interface WalkthroughStep {
  id: string
  title: string
  time: string
  what: string[]
  tips: string[]
  widget?: 'checklist' | 'eyesight' | 'tell' | 'show' | 'reaction' | 'manoeuvre' | 'result'
}

export const WALKTHROUGH: WalkthroughStep[] = [
  {
    id: 'prepare',
    title: 'Before test day',
    time: 'Days before',
    what: [
      'Check you have everything you need, and that the car meets the rules if you are using your own.',
      'Since May 2026, only you (the learner) can book or manage your car test on GOV.UK, and you can change a booking only twice before you must cancel and rebook.',
    ],
    tips: ['Do at least one full mock test with your instructor, ideally on roads around your test centre.', 'Get a good night\'s sleep and eat before your test.'],
    widget: 'checklist',
  },
  {
    id: 'arrive',
    title: 'At the test centre',
    time: '10 minutes early',
    what: [
      'The examiner checks your licence and asks you to sign a declaration about your insurance and that you live in the UK.',
      'You can ask for your instructor or supervising driver to sit in the back during the test, and to listen to the debrief at the end.',
    ],
    tips: ['Tell the examiner if you have a condition or disability they should know about — they can make reasonable adjustments.'],
  },
  {
    id: 'eyesight',
    title: 'Eyesight check',
    time: 'Start of the test',
    what: [
      'You read a car number plate from 20 metres (20.5 metres for an old-style plate).',
      'If you cannot read it, you fail the test and it will not continue.',
    ],
    tips: ['Practise beforehand: 20 metres is about five car lengths.'],
    widget: 'eyesight',
  },
  {
    id: 'tell',
    title: "'Tell me' question",
    time: 'Before you drive',
    what: ["The examiner asks one 'tell me' vehicle safety question before you set off."],
    tips: ['Getting a question wrong counts as one driving fault, not a fail.'],
    widget: 'tell',
  },
  {
    id: 'general',
    title: 'General driving',
    time: 'About 20 minutes',
    what: [
      'You drive on different types of road and traffic, following the examiner\'s directions.',
      'You will be asked to pull over and move off, including a normal stop at the side of the road, pulling out from behind a parked vehicle and a hill start.',
    ],
    tips: ['Drive as you would with your instructor. If you make a mistake, keep calm and carry on — it may only be a minor fault.'],
  },
  {
    id: 'show',
    title: "'Show me' question",
    time: 'While driving',
    what: ["While you are driving, the examiner asks one 'show me' question, such as operating the windscreen washers."],
    tips: ['Only do it when it is safe. Losing control while doing it can be a serious fault.'],
    widget: 'show',
  },
  {
    id: 'manoeuvre',
    title: 'Reversing manoeuvre',
    time: 'One exercise',
    what: [
      'You are asked to do one of: parallel park at the side of the road, park in a parking bay (driving in and reversing out, or reversing in and driving out), or pull up on the right-hand side of the road, reverse about two car lengths and rejoin the traffic.',
    ],
    tips: ['Go slowly and keep looking all around. You can make small corrections — it is observation and control that matter.'],
    widget: 'manoeuvre',
  },
  {
    id: 'emergency',
    title: 'Emergency stop',
    time: 'About 1 in 3 tests',
    what: ['The examiner raises their hand and says "Stop". Stop quickly and safely, keeping control of the car.', 'You do not need to check your mirrors first.'],
    tips: ['Brake firmly and progressively, and clutch down just before you stop. Check all round before moving off again.'],
    widget: 'reaction',
  },
  {
    id: 'independent',
    title: 'Independent driving',
    time: 'About 20 minutes',
    what: [
      'You follow directions from a sat nav (the examiner provides and sets it up) or follow traffic signs. Most tests use a sat nav.',
      'Going the wrong way is not a fault, as long as you do it safely. You can ask the examiner to confirm where you are going.',
    ],
    tips: ['Watch for lane signs early, especially on multi-lane roundabouts.'],
  },
  {
    id: 'result',
    title: 'Your result',
    time: 'Total about 40 minutes',
    what: [
      'You pass if you make no more than 15 driving faults (minors) and no serious or dangerous faults.',
      'If you pass, the examiner can usually have your full licence sent to you automatically. If not, you can book another test at least 10 working days later.',
    ],
    tips: ['Listen to the debrief either way — it tells you exactly what to work on.'],
    widget: 'result',
  },
]

export const FAULT_TYPES = [
  { id: 'd', name: 'Driving fault (minor)', tone: 'warn' as const, desc: 'Not potentially dangerous, but if you keep making the same fault it can become a serious fault. You can have up to 15 and still pass.' },
  { id: 's', name: 'Serious fault', tone: 'bad' as const, desc: 'Something potentially dangerous. One serious fault means you fail.' },
  { id: 'x', name: 'Dangerous fault', tone: 'bad' as const, desc: 'Involves actual danger to you, the examiner, the public or property. One dangerous fault means you fail.' },
]

/** DVSA's most common reasons for failing the car test. */
export const TOP_FAILS = [
  { title: 'Not making effective observations at junctions', fix: 'Look properly in all directions before emerging. Treat each junction as new and "creep and peep" when your view is restricted.' },
  { title: 'Not using mirrors correctly when changing direction', fix: 'Mirrors – signal – manoeuvre. Check your interior and door mirrors before signalling or changing lane.' },
  { title: 'Not moving off safely', fix: 'All-round observation including blind spots before moving off, whether from the kerb, behind a parked car or on a hill.' },
  { title: 'Incorrect positioning when turning right at junctions', fix: 'Position just left of the centre line (or in the correct lane) and stop before the point of turn if you need to wait.' },
  { title: 'Not responding appropriately to traffic lights', fix: 'Approach at a speed that lets you stop if the lights change, and never wait beyond the stop line.' },
  { title: 'Poor positioning on the road during normal driving', fix: 'Keep well left in normal driving without hugging the kerb, and follow lane markings.' },
  { title: 'Not having proper control of the steering', fix: 'Steer smoothly at the right time — not too early or too late — and keep both hands on the wheel except when changing gear or signalling.' },
  { title: 'Not responding correctly to traffic signs', fix: 'Scan for signs early, especially speed limits, no-entry and lane signs.' },
  { title: 'Not keeping control of the vehicle during reverse parking', fix: 'Go slowly with clutch control, and make small corrections. Accuracy and observation both count.' },
  { title: 'Not responding appropriately to road markings', fix: 'Follow lane arrows and give-way lines, and do not stop in yellow box junctions unless allowed.' },
]

export const FAULT_SCENARIOS = [
  { s: 'On a quiet road with nobody around, you forget to check your mirror before signalling left.', a: 'd', why: 'A mirror check missed with no-one affected is usually a driving fault — but repeat it and it can become serious.' },
  { s: 'You pull out of a junction and an approaching car has to brake to avoid you.', a: 's', why: 'You caused another road user to change speed: that is potentially dangerous and is marked as a serious fault.' },
  { s: 'The examiner has to use the dual-control brake to stop you hitting a pedestrian.', a: 'x', why: 'Actual danger and the examiner had to intervene: a dangerous fault.' },
  { s: 'You stall the car once when moving off, but restart safely.', a: 'd', why: 'A stall handled safely is a control driving fault.' },
  { s: 'You drive at 40 mph through a 30 mph limit for a short stretch.', a: 's', why: 'Clearly exceeding the speed limit is normally marked as a serious fault.' },
  { s: 'During the parallel park you mount the kerb slightly and correct it.', a: 'd', why: 'A minor mount corrected safely is often a driving fault, but mounting heavily or repeatedly can be serious.' },
]

/** Simplified DL25 marking-sheet categories used by the mock drive marker. */
export const DL25 = [
  { id: 'vehicle-checks', label: 'Show me / tell me' },
  { id: 'controlled-stop', label: 'Controlled (emergency) stop' },
  { id: 'reverse', label: 'Reversing manoeuvre' },
  { id: 'precautions', label: 'Precautions before starting' },
  { id: 'control', label: 'Control (clutch, gears, steering, brakes)' },
  { id: 'move-off', label: 'Moving off' },
  { id: 'mirrors', label: 'Use of mirrors' },
  { id: 'signals', label: 'Signals' },
  { id: 'clearance', label: 'Clearance to obstructions' },
  { id: 'response', label: 'Response to signs and signals' },
  { id: 'speed', label: 'Use of speed' },
  { id: 'following', label: 'Following distance' },
  { id: 'progress', label: 'Progress (hesitation, appropriate speed)' },
  { id: 'junctions', label: 'Junctions' },
  { id: 'judgement', label: 'Judgement (overtaking, meeting, crossing)' },
  { id: 'positioning', label: 'Positioning and lane discipline' },
  { id: 'crossings', label: 'Pedestrian crossings' },
  { id: 'normal-stops', label: 'Position for normal stops' },
  { id: 'awareness', label: 'Awareness and planning' },
  { id: 'ancillary', label: 'Ancillary controls' },
  { id: 'independent', label: 'Independent driving' },
]

export const SKILLS = [
  { group: 'Basics', items: ['Cockpit drill: doors, seat, steering, seat belt, mirrors', 'Moving off and stopping', 'Using mirrors and signals (MSM)', 'Clutch control and hill starts'] },
  { group: 'Junctions', items: ['Turning left and right into side roads', 'Emerging from T-junctions', 'Crossroads', 'Roundabouts and mini-roundabouts'] },
  { group: 'On the road', items: ['Meeting traffic and clearance to parked cars', 'Pedestrian crossings', 'Dual carriageways and faster roads', 'Following a sat nav and traffic signs'] },
  { group: 'Manoeuvres', items: ['Parallel parking', 'Reversing into a parking bay', 'Driving into a bay and reversing out', 'Pulling up on the right and reversing'] },
  { group: 'Test ready', items: ['Emergency stop', 'Driving in the dark or bad weather', 'A full mock test with no serious faults', 'Driving the test centre area confidently'] },
]
