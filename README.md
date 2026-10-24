# RoadReady UK

Prepare for the UK driving **theory** and **practical** tests in one app:

- **Drive (new):** a drivable simulator for learners. Eleven short lessons (moving off, speed limits, pulling up, T-junctions, mini-roundabouts, zebra crossings, traffic lights), each teaching one rule. Automatic gearbox, keyboard, gamepad or on-screen controls, guided steering and speed limiter, a working rear-view mirror, scripted traffic and an examiner that marks faults using DVSA category names. Every lesson ends with stars and what to fix.
- **Watch (new):** animated explainers replayed in 3D (overhead, behind or driver view) from the same demo driver that the tests use to prove each lesson can be driven cleanly.
- **Progress (new):** a readiness score with next steps, weekly hours chart, mock and hazard trends, and faults by type.
- **Theory:** practice questions by DVSA topic with explanations and Highway Code references, a mistakes deck, timed 50-question mock tests and a road-sign trainer.
- **Hazard perception:** interactive 3D clips (sun, overcast, dusk, rain) scored on the DVSA 5-point scale, with pattern-click detection, a scoring timeline and replays that highlight the hazard.
- **Practical:** a logbook for real driving hours (instructor and private), skill levels, a practice plan for your supervising driver, a step-by-step test-day walkthrough, all 21 show me / tell me questions, animated manoeuvres, a faults guide and a mock-test marker for instructors and parents.
- **Test routes:** turn-by-turn route previews with hotspots and a 3D drive-through (driver, follow and overhead cameras, sat-nav style directions, spoken prompts).

Feasibility, licensing, market research and the roadmap are in [`docs/FEASIBILITY.md`](docs/FEASIBILITY.md).

> Independent study aid, not affiliated with DVSA. Questions and 3D clips are original; test routes are illustrative around a fictional centre.

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck
npm run build      # production build in dist/ (includes the PWA service worker)
npm run preview    # serve the production build
```

## Project structure

```
src/
  components/      Shared UI, layout and the SVG road-sign library
  data/            Question bank, topics, practical test content, manoeuvre keyframes
  features/
    home/          Dashboard ("your plan for today", readiness, countdown)
    drive/         Lesson simulator: engine.ts (physics, examiner, traffic), scenarios*.ts, bot.ts (demo driver),
                   DriveScene.tsx (3D), DrivePlay.tsx (HUD), lessons.ts (22-lesson curriculum, 11 playable)
    video/         Video helpers: chapters and replay of the demo driver
    account/       Supabase auth, login and account pages, cloud sync and merge (merge.ts is unit-tested)
    progress/      Stats (readiness, weekly hours, faults) and the Progress page
    theory/        Practice sessions, mock test, signs (logic.ts is unit-tested)
    hazard/        Clip scripts (clips.ts), scoring (scoring.ts), 3D scene and player
    practical/     Walkthrough, flashcards, manoeuvres, faults, mock-drive marker
    routes/        Route format (types.ts), demo routes (data.ts), generator (build.ts), map and 3D sim
  sim/             Shared motion maths and three.js models, materials, sky/weather
  store/           Progress store (Zustand, persisted to localStorage)
docs/FEASIBILITY.md
```

## Adding a drive lesson

A lesson is a `Scenario` (see `src/features/drive/types.ts`): roads, markings, scripted traffic (`npcs`), checks shown on screen, a `rules(ctx)` function that raises faults the way an examiner would, and a `demo` plan for the demo driver. Add it to `builders` in `lessons.ts` and give the lesson a `scenario` id. `engine.test.ts` then automatically requires that the demo driver finishes with zero faults and three stars, that a driver who ignores other road users does not, and that the lesson cannot be finished by sitting still. `videos.ts` adds the matching video helper.

Controls: W/S accelerate and brake, A/D steer, Q/E indicators, X mirror, Z/C look over each shoulder, V camera, Esc pause.

## Adding content

**Questions** go in `src/data/questions-*.ts`. `options[0]` is always the correct answer (options are shuffled for display). Include an explanation, and a Highway Code rule in `ref` where one applies. The tests check ids are unique and each question has four distinct options.

**Hazard clips** go in `src/features/hazard/clips.ts`. A clip is data:

- a scene layout (road width, parked cars, junctions, zebra crossing, signs)
- a speed profile for the camera car
- scripted actors (keyframes built with the `lineKeys`, `arcKeys` and `holdKey` helpers)
- scoring windows

The tests fail if any actor collides with the camera car or drives through a parked vehicle.

**Routes** go in `src/features/routes/data.ts`. A route is a list of segments: `road`, `turn` (side road, T-junction, crossroads with give-way, stop or lights), `roundabout` (exit number, mini or full) and `task` (pull up on the right, emergency stop, and so on). `build.ts` turns this into geometry, directions, stops and a speed profile; the map and 3D world are generated from that. Road lengths are measured from junction or roundabout centres.

## Accounts and cloud save (Supabase)

Accounts are optional. Without any settings the app runs entirely on the learner's device. With Supabase configured, learners can create an account (email and password, or an emailed sign-in link), and their progress syncs between devices. Signing in merges what is on the device with what is in the cloud, so nothing is lost; after that, changes save automatically a couple of seconds after they happen.

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL editor**, run `supabase/migrations/0001_progress.sql` (the table and row level security) and `0002_delete_my_account.sql` (lets learners delete their own account).
3. In **Authentication > URL configuration**, set **Site URL** to your deployed address and add it, plus `http://localhost:5173`, under **Redirect URLs**. Confirmation, sign-in and reset links return there.
4. In **Authentication > Providers > Email**, keep email enabled. Leave **Confirm email** on for production.
5. Copy **Project URL** and the **anon public key** (Project settings > API) into `.env.local` (see `.env.example`), and into your host's environment variables (on Vercel: Project > Settings > Environment Variables, then redeploy).

The anon key is meant to be public: row level security means each learner can read and change only their own row. Never put the `service_role` key in this app. Merge rules live in `src/features/account/merge.ts` and are unit-tested.

## Deployment and mobile

- **Vercel:** import the repo at [vercel.com/new](https://vercel.com/new). `vercel.json` sets the Vite build, the SPA fallback and cache headers, so no extra settings are needed, and every push to `master` redeploys.
- Any other static host works too. `public/_redirects` provides the SPA fallback on Netlify; use the equivalent rewrite elsewhere.
- The app is an installable PWA and works offline after the first visit.
- For the App Store and Google Play, wrap the build with [Capacitor](https://capacitorjs.com/) (`npx cap add ios` / `android`). See the feasibility doc for payments and accounts.

## Licensing notes

The Highway Code and GOV.UK guidance are used under the Open Government Licence v3.0. The DVSA revision question bank and hazard perception clips are **not** included: they need a DVSA Crown copyright licence.
