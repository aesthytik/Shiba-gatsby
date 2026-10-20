# RoadReady UK

Prepare for the UK driving **theory** and **practical** tests in one app:

- **Theory:** practice questions by DVSA topic with explanations and Highway Code references, a mistakes deck, timed 50-question mock tests and a road-sign trainer.
- **Hazard perception:** interactive 3D clips (sun, overcast, dusk, rain) scored on the DVSA 5-point scale, with pattern-click detection, a scoring timeline and replays that highlight the hazard.
- **Practical:** a step-by-step test-day walkthrough, all 21 show me / tell me questions, animated manoeuvres, a faults guide and a mock-test marker for instructors and parents.
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
    home/          Dashboard
    theory/        Practice sessions, mock test, signs (logic.ts is unit-tested)
    hazard/        Clip scripts (clips.ts), scoring (scoring.ts), 3D scene and player
    practical/     Walkthrough, flashcards, manoeuvres, faults, mock-drive marker
    routes/        Route format (types.ts), demo routes (data.ts), generator (build.ts), map and 3D sim
  sim/             Shared motion maths and three.js models, materials, sky/weather
  store/           Progress store (Zustand, persisted to localStorage)
docs/FEASIBILITY.md
```

## Adding content

**Questions** go in `src/data/questions-*.ts`. `options[0]` is always the correct answer (options are shuffled for display). Include an explanation, and a Highway Code rule in `ref` where one applies. The tests check ids are unique and each question has four distinct options.

**Hazard clips** go in `src/features/hazard/clips.ts`. A clip is data:

- a scene layout (road width, parked cars, junctions, zebra crossing, signs)
- a speed profile for the camera car
- scripted actors (keyframes built with the `lineKeys`, `arcKeys` and `holdKey` helpers)
- scoring windows

The tests fail if any actor collides with the camera car or drives through a parked vehicle.

**Routes** go in `src/features/routes/data.ts`. A route is a list of segments: `road`, `turn` (side road, T-junction, crossroads with give-way, stop or lights), `roundabout` (exit number, mini or full) and `task` (pull up on the right, emergency stop, and so on). `build.ts` turns this into geometry, directions, stops and a speed profile; the map and 3D world are generated from that. Road lengths are measured from junction or roundabout centres.

## Deployment and mobile

- **Vercel:** import the repo at [vercel.com/new](https://vercel.com/new). `vercel.json` sets the Vite build, the SPA fallback and cache headers, so no extra settings are needed, and every push to `master` redeploys.
- Any other static host works too. `public/_redirects` provides the SPA fallback on Netlify; use the equivalent rewrite elsewhere.
- The app is an installable PWA and works offline after the first visit.
- For the App Store and Google Play, wrap the build with [Capacitor](https://capacitorjs.com/) (`npx cap add ios` / `android`). See the feasibility doc for payments and accounts.

## Licensing notes

The Highway Code and GOV.UK guidance are used under the Open Government Licence v3.0. The DVSA revision question bank and hazard perception clips are **not** included: they need a DVSA Crown copyright licence.
