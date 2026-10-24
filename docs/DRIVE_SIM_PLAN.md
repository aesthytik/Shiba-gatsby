# Drive mode: plan for an interactive UK driving simulator

_October 2026. Builds on the existing RoadReady UK app (theory, 3D hazard clips, practical guides, on-rails route drive-through)._

## 1. Goal

Learners **drive a car themselves** in a 3D UK world:

1. **Lessons:** short, each teaching one Highway Code rule.
2. **Mock tests:** an examiner marks every fault the way the real marking sheet (DL25) does.
3. **Later, real roads** around actual test centres.

It should be fun enough to share (like the "Stop, Eh?" game) and accurate enough to trust (like a real examiner).

## 2. What we learned

### The "Stop, Eh?" game (X post by @mustafa01ali, 2 Oct 2026)

- **13 short lessons, each built around one rule.** For example, "Lesson 7 of 13 · All-way stop: Yield to the Right".
- **A briefing card before every drive:**
  - the rule, in one sentence
  - your route ("Go straight through")
  - what is about to happen ("The car coming from your right will stop together with you. Let it go first, then take your turn.")
  - the control keys, then **Back / Drive** buttons
- **A scripted scenario per rule.** Another car is timed to arrive at the same moment, so you must apply the rule.
- **Camera behind the car,** keyboard controls.
- **Warm, stylised low-poly art:** rounded autumn trees, soft clouds, a friendly suburb.
- **Small and personal.** It's a learning toy, not a test simulator: no examiner, no real places.

### DriveSim UK ([drivesim.uk](https://drivesim.uk/))

- Runs in the browser on **Google Photorealistic 3D Tiles** around **340+ DVSA test centres**.
- Searchable by centre or postcode.
- Examiner directions, plus paid exam mode and "AI instructor feedback".
- Keyboard, controller and touch controls.
- **Desktop-first.**
- Its pages give **no detail on traffic or on how faults are marked**, and prices conflict between pages.
- It says only a few areas are "fully built". That suggests Google's 3D view alone isn't enough to drive in: the road surface is a scanned shape, with no lanes, give-way lines, signals or speed limits the software can read.

### What we already have in this repo

| Existing piece | Where it is |
|---|---|
| Route generator: roads, junction turns, roundabouts and stop lines, with smooth curves | `src/features/routes/build.ts` |
| Low-poly models: cars, bus, people, cyclist, horse, tractor, houses, trees, signs, Belisha beacons | `src/sim/three/` |
| Sky and weather, road markings | `src/sim/three/` |
| Scripted actors with motion helpers, plus tests proving nothing collides | `src/sim/motion.ts`, `src/features/hazard/` |
| DL25 fault categories and the mock-drive marker | `src/data/practical.ts`, `src/features/practical/MockDrive.tsx` |
| Road signs | `src/components/signs/` |
| Progress store | `src/store/` |

## 3. Product

### Modes

1. **Lessons** (launch feature): guided, one rule each, 1–3 stars.
2. **Free drive:** explore the demo town, no marking.
3. **Mock test:**
   - 10–15 minutes
   - examiner directions, then a sat-nav "independent driving" section
   - one manoeuvre
   - full DL25 result
4. **Manoeuvres:** drive the parallel park, bay parks and pull-up-on-the-right yourself.
5. **Real test centre areas** (Phase 3+).

### Lesson flow

1. **Briefing card:** the rule, your route, what will happen, what you'll be marked on, the controls, then Drive.
2. **Drive.** The HUD shows the next instruction, your speed and the limit sign, indicators, mirror insets, and look buttons.
3. **Live tips** (gentle, can be turned off), e.g. "Check your right mirror before signalling".
4. **Result:** stars, a list of faults with **Watch it** buttons for replays, the Highway Code reference, then Retry or Next.

### Assist levels

The lessons are about rules, not steering skill, so beginners and phone users get help:

- **Assisted:** the car steers itself along the lane. You control speed, indicators and observation.
- **Standard:** you steer, with gentle lane-keeping.
- **Full:** no help.

## 4. UK lesson curriculum

★ = in Phase 1. HC = Highway Code rule number.

| # | Lesson | Scenario | Marked on | HC |
|---|---|---|---|---|
| **Basics** |||||
| 1★ | Moving off safely | Parked at the kerb; a car is approaching from behind | Mirrors and blind-spot check before moving; signal only if it helps | 159 |
| 2 | Pulling up on the left | "Pull up at the next safe place" | Mirrors, signal, close to the kerb, not near a junction | 239–243 |
| 3 | Speed limits | 30 → 20 zone → 40 | Staying within limits, reacting to signs | 124 |
| **Junctions** |||||
| 4 | Turning left into a side road | A pedestrian is waiting to cross the side road | Mirror–signal–manoeuvre, position, giving way to the pedestrian | 182–183, H2 |
| 5 | Turning right into a side road | Oncoming traffic | Position just left of centre, waiting for a safe gap | 179–181 |
| 6★ | Emerging at a T-junction | Traffic from both directions | Stopping or slowing at the line, judging the gap, not making others slow down | 170–172 |
| 7★ | STOP junction | Clear road | A complete stop at the line, even when clear | 171 |
| 8 | Unmarked crossroads | Another car arrives from the side | Nobody has priority: slow, look, be ready to stop | 146 |
| **Roundabouts** |||||
| 9★ | Mini-roundabout: give way to the right | A car from the right arrives with you (the UK version of the "Stop, Eh?" lesson) | Giving way to the right, going round the painted circle, signals | 188 |
| 10 | Roundabout: turning left (1st exit) | Busy roundabout | Left lane, signal left, giving way | 185–186 |
| 11 | Roundabout: straight ahead | Two-lane approach | Lane choice, no signal on approach, signal left after the exit before yours | 186 |
| 12 | Roundabout: turning right (3rd exit) | Two-lane approach | Right lane, signal right, then left after the exit before yours | 186 |
| **Crossings and lights** |||||
| 13★ | Zebra crossing | A pedestrian walks up and steps out | Approach speed, stopping, no waving pedestrians across | 195 |
| 14 | Pelican and puffin crossings | Lights change; flashing amber at the pelican | Stopping on red, giving way on flashing amber | 196–199 |
| 15 | Traffic lights and box junctions | Queue beyond the box | Amber decision, not entering the box until the exit is clear | 174–175 |
| **Sharing the road** |||||
| 16 | Meeting traffic and parked cars | Parked cars on your side, oncoming car | Who gives way, safe clearance | — |
| 17 | Cyclists and horse riders | Overtaking safely | At least 1.5 m from cyclists (up to 30 mph), 2 m and under 10 mph for horses | 163, 215 |
| 18 | Buses and emergency vehicles | A bus pulls out; an ambulance approaches | Giving way to buses signalling to pull out, letting the ambulance pass safely and legally | 219, 223 |
| **Test skills** |||||
| 19 | Following a sat nav | 5-minute independent drive | Lane discipline, planning ahead, no sudden moves | — |
| 20 | Emergency stop | Examiner says "Stop!" | Reaction time, control, all-round observation before moving off | — |
| 21 | Manoeuvres | Parallel park, bay park, pull up on the right | Control, accuracy, observation | — |
| 22 | Mock test | Full examiner-marked drive | Everything | — |

## 5. Core systems

All simulation logic is **pure TypeScript** (no three.js), so it can be unit-tested and run headless. three.js / react-three-fiber is only used for drawing.

### 5.1 World

- Evolve `build.ts` into a **road graph**:
  - **nodes:** junctions, roundabouts, crossings
  - **edges:** roads, each with lanes, speed limit, markings and kerbs
- Lesson worlds are small hand-authored graphs, one or two junctions, built procedurally (as the route generator does today).
- Real places (Phase 3) produce the same graph from OpenStreetMap.
- The sim queries the graph for:
  - which lane the car is in
  - how far it is from the kerb or centre line
  - the next stop or give-way line
  - which other road users have priority over it

### 5.2 Vehicle

- **Model:** a kinematic bicycle model, with engine force, braking, drag and rolling resistance, and steering limits that change with speed. This is predictable, good enough for learner speeds and easy to tune.
- **Gearbox:** automatic first. A manual gearbox (clutch, stalling, hill starts) comes in Phase 4.
- **Timestep:** a fixed 60 Hz step, so replays are exact.
- **Collisions:** kerb contact comes from the road graph's edges. Car-to-car and car-to-pedestrian contact uses simple oriented-box checks. A physics engine (Rapier) is only added if this proves insufficient.

### 5.3 Controls

| Action | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Accelerate / brake | W/↑, S/↓, Space | Right-side pedals | Triggers |
| Steer | A/D, ←/→ | Thumb wheel or slider, or tilt to steer | Left stick |
| Indicators | Q / E | Buttons | Shoulder buttons |
| Interior mirror | X | Button | Face button |
| Look left / right (blind spot) | Z / C | Buttons | Right stick |
| Horn, lights, camera, pause | H, L, V, P | Menu | Menu |

- Keys can be remapped.
- Steering wheels via the browser Gamepad API come later.

### 5.4 Cameras and observation

- **Cameras:**
  - **Chase** (default, like "Stop, Eh?")
  - **Cockpit** (right-hand drive), with live mirror views
  - **Overhead** for replays
- **Looking:** learners can't turn their head, so mirror checks and blind-spot looks are explicit actions.
- Each look is time-stamped, so the examiner can check, for example, *"mirrors checked within 5 s before signalling"*.

### 5.5 Other road users

- **Cars:**
  - follow lane paths on the road graph
  - set their speed with a standard car-following model (IDM)
  - give way correctly, including to the right at roundabouts
  - obey traffic lights
- **Pedestrians:** walk on pavements and use crossings.
- **Cyclists:** ride at the left of the lane.
- **Scripted actors for lessons,** like the hazard clips but triggered by the player's position rather than a clock. For example: *"when the player is 30 m from the mini-roundabout, send a car from the right so it arrives at the same time"*.

### 5.6 Examiner engine (the key differentiator)

The sim emits a stream of events and state (position, speed, lane, indicators, looks, lights, nearby road users). Each **checker** watches that stream and raises faults with:

- the DL25 category
- severity: driving fault / serious / dangerous
- time and position
- a plain-English explanation
- the Highway Code reference

Faults become **more serious** when they're repeated, or when they make someone else brake or swerve. A collision or near miss is **dangerous**.

Initial checkers. All thresholds are tuneable and will be calibrated with an ADI.

| Checker | Driving fault | Serious / dangerous |
|---|---|---|
| Speed | Over the limit for more than 2 s | Clearly over the limit (+10%) for a sustained time |
| Signals | No signal before a turn or lane change, or signal left on for more than 8 s | Wrong signal that misleads others |
| Mirrors | No mirror check within 5 s before signalling, changing direction or slowing | Another road user affected |
| Moving off | No blind-spot check | Another vehicle has to brake |
| STOP line | — | Crossing the line without a full stop |
| Give way (junctions, roundabouts) | Hesitating when the gap is clearly safe ("undue hesitation") | Entering when a priority vehicle is under ~3 s away, or makes it brake |
| Traffic lights | — | Crossing the stop line on red |
| Pedestrian crossings | — | Not stopping for a pedestrian on, or clearly waiting at, a zebra crossing |
| Positioning and lanes | Drifting out of position, or the wrong roundabout lane for your exit | Crossing the centre line into oncoming traffic |
| Following distance | Less than 2 s gap for more than 3 s | Less than 1 s at speed |
| Clearance | Less than ~1 m from parked cars | Less than 1.5 m from a cyclist at up to 30 mph |
| Kerb | Touching or mounting it slowly | Mounting it at speed |
| Collision or near miss | — | Dangerous |

### 5.7 Lesson engine

A lesson is data, like the hazard clips in `clips.ts`:

- the world
- start position
- route and instructions
- scripted actors and their triggers
- objectives
- which checkers are active
- hints
- star rules: 3 = no faults; 2 = only driving faults; 1 = completed; fail = any serious or dangerous fault

### 5.8 Replay and debrief

- Record the inputs and the random seed. Because the sim is deterministic, any moment can be replayed exactly.
- The debrief shows:
  - fault pins on an overhead map (reusing `RouteMap`)
  - "watch it" replays starting 5 s before each fault
  - the DL25 sheet (reusing the `MockDrive` layout)
  - suggested next lessons

### 5.9 Art direction

- Move to the warmer stylised look from "Stop, Eh?":
  - rounded tree canopies, with seasonal palettes
  - soft billboard clouds
  - simple textures for asphalt and grass
- Make it **unmistakably British:**
  - red-brick terraces and semis
  - double yellow lines
  - red post boxes, bus shelters, Belisha beacons
  - yellow rear number plates, white vans
  - driving on the left
- Performance:
  - merge static scenery per chunk
  - instance repeated objects
  - aim for fewer than 300 draw calls

### 5.10 AI instructor feedback (Phase 4)

- After a drive, send the fault log (not video) to Claude through a small server function.
- It returns a friendly, personal debrief and recommends lessons.
- Use a fast, low-cost Claude model and cap usage per user.

## 6. Real places (Phase 3+)

### Data sources

| Source | Licence | Used for |
|---|---|---|
| **OpenStreetMap** | ODbL (credit required) | Roads, lanes and turn lanes, speed limits, one-way streets, roundabouts and mini-roundabouts, give-way and stop junctions, traffic lights, zebra and signal crossings, pavements, buildings and heights, trees |
| **OS Terrain 50** | Open Government Licence | Real hills (hill starts, steep descents) |
| **DVSA test centre list** and published pass-rate statistics | Open Government Licence | Centre locations, area pages |
| **Google Photorealistic 3D Tiles** (optional) | Paid per use, Google terms | A "real look" backdrop |

### Pipeline

This is an offline build step (Node scripts in `tools/osm-import/`), not live map requests:

1. Pick a test centre and an area of roughly 3 km radius.
2. Extract OpenStreetMap data from a downloaded GB extract, processed locally with osmium.
3. Build the road graph:
   - merge road pieces
   - detect junctions and roundabout rings
   - lane counts
4. Work out the markings: give-way lines on minor approaches, centre lines, zig-zags at crossings.
5. Generate meshes: road surface, kerbs, pavements, markings, extruded buildings with UK roof styles, trees.
6. Place street furniture from the data and the rules, e.g. a speed-limit sign wherever the limit changes.
7. Package into compressed 3D chunks plus a road-graph file for the sim, and upload to a CDN.
8. QA:
   - automatic checks: everything connected, lanes continuous
   - visual review
   - an ADI checks the hotspots

### Routes

- Partner instructors author test-*style* routes as sequences of graph roads.
- The existing direction generator turns them into sat-nav instructions with real street names.
- Never claim routes are official.

### Size and roll-out

- Aim for 5–15 MB per area, streamed in chunks.
- Start with 3 pilot centres, then add the busiest centres and those with the longest waits.

### Google "real look" (decide after Phase 3)

- Shows Google's buildings around our own roads.
- Costs:
  - billed per request
  - third-party sources quote about $6 per 1,000 "root tile" requests; check the current pricing
  - needs to be online
  - requires attribution
- **Google Maps Platform terms must be checked** for caching limits and whether a simulator or game is a permitted use.

## 7. Platforms, performance, accessibility

- **Platforms:** the web app (PWA) first. Wrap it with Capacitor for iOS and Android.
  - Desktop: keyboard, gamepad, wheel.
  - Mobile: landscape, touch controls, assisted mode by default.
- **Performance targets:**
  - 60 fps on desktop integrated graphics
  - 30 fps on a 3-year-old mid-range Android phone
  - the first lesson downloads less than 5 MB
- **Quality presets,** detected automatically: shadows, resolution, number of road users.
- **Comfort:** field-of-view slider, camera smoothing, reduced motion, motion-sickness tips.
- **Accessibility:** remappable keys, captions for spoken directions, colour-blind-safe HUD, screen-reader-friendly menus and results.

## 8. Code layout

```
src/drive/
  engine/      fixed-step loop, vehicle.ts, input.ts (keyboard/touch/gamepad), cameras
  world/       roadGraph.ts (from route segments now, from OSM later), lane queries, meshes
  traffic/     idm.ts, agents, junction priority, traffic lights, pedestrians, cyclists
  examiner/    events.ts, checkers/*.ts, faults.ts (DL25 mapping), scoring.ts
  lessons/     lesson definitions, lesson engine, triggers
  replay/      input recording, deterministic playback
  ui/          BriefingCard, HUD, MirrorInsets, TouchControls, ResultScreen
tools/osm-import/   (Phase 3) OSM → road graph → mesh chunks
```

Reuses: `sim/three/*`, `sim/motion.ts`, the route geometry helpers, signs, DL25 data, `RouteMap`, the progress store.

## 9. Phases and acceptance criteria

Effort assumes me building with you reviewing. These are rough estimates.

| Phase | Scope | Done when | Effort |
|---|---|---|---|
| **0. Feel spike** | Drive a car round the existing demo town: chase camera, keyboard, kerb detection, speedometer | 60 fps on desktop; the car feels controllable to you | 2–3 days |
| **1. Lessons MVP** | Briefing card UI; HUD; indicators and look actions; scripted actors; 8 checkers (speed, signals, mirrors, moving off, STOP line, give way, zebra, kerb and collision); stars and result screen; lessons 1, 6, 7, 9, 13; art refresh; basic touch controls and assisted mode; released as **Beta** | Every checker has unit tests; a scripted "good driver" gets 3 stars on every lesson; scripted "bad drivers" get the expected fault; playable on a phone | 2–3 weeks |
| **2. Full curriculum** | All 22 lessons; general traffic; roundabout lanes; cyclists and pedestrians; traffic lights; cockpit view with mirrors; replays; free drive; examiner and sat-nav mock test in the demo town; gamepad | A 10–15 minute mock test works end to end; an ADI reviews the faults on 20 recorded drives | 3–4 weeks |
| **3. Real places pilot** | OSM import pipeline; 3 pilot centres with terrain and buildings; 3 test-style routes each; real street names | Full routes drive with no geometry errors; areas load in under 10 s on 4G | 4–6 weeks |
| **4. Scale and polish** | 10 → 50 → 340 centres; optional Google real-look mode; AI instructor feedback; accounts and payments; manual gearbox; steering wheels; night and rain | — | Ongoing |

## 10. Testing

- **Unit tests:** vehicle model, car-following model, junction priority, every examiner checker (fed synthetic event streams).
- **Bot drivers:** scripted inputs drive each lesson headless in CI.
  - a "good driver" must pass
  - a "no-signal driver", a "STOP-runner" and a "doesn't-give-way driver" must each get the expected fault

  This builds on the existing hazard-clip collision tests.
- **Visual checks:** Playwright screenshots of key moments, as already done for the hazard clips and routes.
- **Human checks:** ADI calibration sessions, and a beta with 20–50 learners.
- **Budgets:** bundle size and frame-rate limits enforced in CI.

## 11. Business and positioning

- **Versus DriveSim:** they have real-looking areas for every centre today. We offer:
  - guided UK lessons
  - an examiner that marks precisely and explains why
  - other road users that behave realistically
  - the full course (theory, hazard perception, practical)
  - phone support and offline lessons
- **Pricing idea:**
  - free: Unit 1 lessons plus one mock test
  - premium: all lessons, unlimited mock tests and real centres, plus centre packs
- **Growth:** short shareable clips, like the "Stop, Eh?" post (e.g. "Learn mini-roundabouts in 60 seconds"), for TikTok, Instagram and X.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Driving feels bad on keyboard or touch | Phase 0 spike; assist levels; tuning with you |
| Examiner marks unfairly | Conservative thresholds; every fault explained with a replay; a "this seems wrong" button; ADI calibration |
| OSM gaps or errors in some areas | Automatic checks plus manual patches; start with well-mapped towns |
| Google cost or terms | Optional mode, decided at a gate after Phase 3 |
| Motion sickness | Comfort settings; chase camera by default |
| Phone performance | Quality presets; assisted mode; chunked streaming |
| Legal | Clear "not a substitute for lessons" and "not official routes" notices; the Age Appropriate Design Code for under-18 users |
| Scope creep | Phase gates with clear "done when" criteria |

## 13. Decisions needed

My recommended defaults are in bold.

1. **Start with Phase 0 → Phase 1 in the demo town**, or real places first?
2. Platform priority: **design touch controls from day one, but tune the driving on desktop first**.
3. Gearbox: **automatic first**, manual in Phase 4.
4. Google real-look mode: **decide after Phase 3**.
5. For Phase 3: allow `overpass-api.de` / `download.geofabrik.de` in this environment's network settings, or run the import pipeline elsewhere.
6. Final product name (RoadReady UK is a placeholder).
