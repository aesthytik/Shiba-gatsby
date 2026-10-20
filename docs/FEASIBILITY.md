# RoadReady UK: feasibility, features and roadmap

_Research date: October 2026. Facts about tests, fees and rules change; check GOV.UK before relying on them._

## 1. Verdict

**Feasible, and the core is already built.** This repo contains a working web app (installable as a PWA, and wrappable as an iOS/Android app) with:

- theory practice, timed 50-question mocks and road signs
- 3D hazard perception clips scored the DVSA way
- a step-by-step practical test walkthrough, show me / tell me flashcards, animated manoeuvres and a mock-test fault marker
- test routes with turn-by-turn directions, hotspots and a 3D drive-through simulation

What decides whether this becomes a successful product is not the technology. It's three non-technical questions:

1. **Content licensing.** Do you licence DVSA's official revision questions and hazard clips, or stay with original content?
2. **Route data.** DVSA doesn't publish test routes, so where do real routes come from, and how do you keep them accurate?
3. **Production cost of 3D content.** How many high-quality clips you can afford, and at what fidelity.

Each is covered below with a recommendation.

## 2. The tests (what the app must prepare people for)

| | Format | Pass mark | Fee |
|---|---|---|---|
| Theory: multiple choice | 50 questions in 57 minutes; 3 are about a short video clip | 43 / 50 | £23 (both parts) |
| Theory: hazard perception | 14 clips, 15 developing hazards, up to 5 points each; pattern clicking scores 0 | 44 / 75 | (included) |
| Practical | ~40 min: eyesight check (20 m), 1 tell me + 1 show me question, ~20 min independent driving (sat nav or signs), 1 reversing manoeuvre, emergency stop in about 1 in 3 tests | ≤15 driving faults, no serious or dangerous | £62 weekday, £75 evenings/weekends |

Both theory parts must be passed at the same sitting. The certificate lasts two years.

### What changed in 2026, and why it matters for the app

- **Booking rules** (DVSA, phased in 2026): only 2 booking changes before you must cancel and rebook (31 March); **only the learner can book or manage a car test** (12 May); moves are limited to the three nearest centres (9 June). → The app **must not** offer booking or "cancellation-finder" bots. A countdown, reminders and a link to GOV.UK are fine.
- **Minimum learning period:** the January 2026 road safety strategy consulted on a 3- or 6-month gap between passing theory and taking the practical (closed March 2026, no decision yet). → If adopted, a **lesson / practice log** becomes much more valuable.
- **Northern Ireland graduated driver licensing** started 1 October 2026 and requires a recorded **logbook** of training before the practical test. → A logbook feature has a clear market in NI now.
- **Demand:** a record ~2.13 million car practical tests in 12 months, average waits of around 20 weeks to get a booking, and an August 2026 pass rate of 52.1%. Learners have a long wait and a real incentive to prepare.

## 3. Competitors and positioning

| Product | What it offers | Pricing seen |
|---|---|---|
| RAC Driving Theory Test Kit | 700+ DVSA-licensed questions, all DVSA hazard clips | Subscription from £4.99/month |
| Official DVSA / other theory kits ("4 in 1", "Theory Test Pro", etc.) | Licensed questions + clips, mock tests | One-off or subscription |
| Test Routes app | Routes for a chosen centre recorded by instructors | Free app, centre packs from £9.99 |

The theory market is crowded and mostly sells **the same DVSA-licensed content**. Gaps you can own:

1. **Theory + practical + routes in one place.** Most apps do one of these.
2. **Interactive 3D** instead of fixed video: replays with the hazard highlighted, the same clip in different weather, a scoring timeline that shows exactly why you scored 3 instead of 5.
3. **Route simulation** rather than a map line: a sat-nav style drive-through with hotspots ("common fault here").
4. **Tools for parents and instructors**, e.g. the mock-test marker and, later, shared progress.

## 4. Content and licensing

| Content | Status | What you can do |
|---|---|---|
| **DVSA revision question bank** and **practice hazard perception clips** | Crown copyright. You need a DVSA copyright licence ("Crown copyright licence agreement"); using them without one is a criminal offence | Apply via GOV.UK ("Make and sell driving theory test revision products"). You must acknowledge Crown copyright |
| **The Highway Code, GOV.UK test guidance, show me / tell me list** | Open Government Licence v3.0 | Reuse with attribution (the app already does) |
| **Road sign artwork** | Crown copyright; DfT publishes sign images | Check the published terms before using the official artwork. The app redraws simplified signs itself |
| **DVSA name and logo** | Protected | Never imply the app is official |

**Recommendation:** ship v1 with original content (what's here now), apply for the DVSA licence in parallel, and add the licensed question bank and clips as a premium layer when it's granted. Learners actively look for "DVSA licensed", so it's worth having, but original 3D clips are your differentiator either way.

Every original question needs review by an approved driving instructor (ADI) before launch. The 125 included questions were written from the Highway Code with rule references, but they have not had professional review yet.

## 5. Test routes: data and legality

- DVSA (then DSA) **stopped publishing routes in 2010**, when independent driving was introduced, to stop learners memorising them. Examiners can use any roads near the centre and change them at any time.
- I found no law against publishing routes on public roads, and route apps already operate, but it is not legal advice. Market routes as "**practise the area and its tricky junctions**", not "memorise the test".
- **Where real routes can come from:**
  1. Partner instructors (ADIs) who know local routes: revenue share per centre.
  2. Learners recording drives with GPS, with consent, as a contribution feature.
- **Pipeline to turn a GPS trace into a simulated route:** map-match the trace to OpenStreetMap (OSRM or Valhalla) → read junction types, roundabout exits, speed limits and crossings from OSM tags → convert to the app's segment format (`src/features/routes/types.ts`) → the existing generator builds the map, directions, speed profile and 3D world.
- **Compliance:** OSM data is ODbL, so show attribution. GPS traces are personal data under UK GDPR, so you need consent, minimisation and deletion on request.
- **More realistic 3D later:** MapLibre GL with open vector tiles and 3D buildings for a "fly the real streets" preview, or photorealistic 3D tiles (paid, with usage terms). The procedural simulator here works offline and is cheap; real-imagery views are a v2 upgrade.

## 6. 3D clips and videos: options and cost

| Approach | Fidelity | Cost per clip | Notes |
|---|---|---|---|
| **Procedural in-app 3D** (this repo) | Stylised, low-poly | Low: about a day of scripting per clip once the engine exists | Interactive, offline, any weather, replay with hazards shown, tiny download |
| **Pre-rendered CGI video** (Blender / Unreal) | High | Medium to high, depending on studio | Looks closest to the DVSA clips; fixed video, larger app |
| **Licensed DVSA clips** | Official | Licence terms | The "real thing" learners trust |

**Recommendation:** use a hybrid. Keep procedural 3D for practice volume and the interactive review (no one else does this). Add licensed DVSA clips for the exam-style mock. Commission CGI only for marketing and a few hero clips.

## 7. Technical approach

**Current stack:** Vite + React + TypeScript, Tailwind CSS, three.js (react-three-fiber), Zustand with local persistence, Vitest. There is no backend yet: progress lives on the device.

- **Mobile apps:** it's a PWA today (installable and works offline). For the App Store and Google Play, wrap the same code with **Capacitor**. That's one codebase, and WebGL performance is good on modern phones. React Native or Expo would mean rewriting the 3D layer.
- **When you add accounts and payments:** Supabase or Firebase for auth and sync; RevenueCat to handle in-app purchases (Apple and Google require their billing for digital content in apps); Stripe on the web.
- **Performance:** the 3D chunk (~250 KB gzipped) loads only on hazard and route pages. Scenery is culled by distance. Test on low-end Android before launch.

## 8. Feature list and roadmap

### Built in this MVP
- [x] Theory: 14 DVSA topics, practice with explanations and Highway Code references, mistakes deck (Leitner boxes), timed 50-question mock with flagging and topic breakdown, sign browser and sign quiz
- [x] Hazard perception: 6 original 3D clips (sun, overcast, dusk, rain; one double-hazard clip), DVSA-style 5-band scoring, pattern-click detection, review timeline, replay with hazards highlighted, full mock scaled to /75
- [x] Practical: 10-step test-day walkthrough with interactive widgets (checklist, number plate, reaction timer), 21 show me / tell me flashcards, 4 animated manoeuvres, faults guide with scenario quiz and top-10 fail reasons, mock-drive marker with DL25-style categories, skills checklist
- [x] Routes: 3 demo routes with schematic maps, turn-by-turn directions, hotspots, and a 3D drive-through (driver / follow / overhead cameras, sat-nav HUD, speed and limit, spoken directions, mini-map)
- [x] Progress dashboard, test-date countdown, 2026 rule changes, dark mode, offline PWA
- [x] 71 unit tests, including "no scripted actor ever collides with the camera car" and "the route sim stops at every line"

### Next (v1, launch-ready)
- ADI review of all content; grow the original bank to 400+ questions, or integrate the licensed DVSA bank
- Video-clip questions in the mock (3 per test, as in the real exam), reusing the 3D engine
- 15+ more hazard clips so the mock can match the real 14-clip format
- Accounts and cloud sync; freemium paywall
- Real test centres: the DVSA centre list and published pass-rate statistics (Open Government Licence), plus partner-recorded routes for the first 10 centres
- Accessibility: screen-reader pass, voiceover for questions, dyslexia-friendly font option. The real theory test offers English or Welsh voiceover and BSL, so plan Welsh and BSL support

### Later (v2+)
- Lesson and practice log, with an NI GDL logbook export and minimum-learning-period tracking if that becomes law
- Parent and instructor accounts: share progress, assign topics, sync mock-drive results
- Route recorder (GPS) and community hotspot notes, moderated
- Collision hotspots near test centres from the STATS19 road safety data (Open Government Licence)
- Real-street 3D previews (MapLibre / 3D tiles)
- Motorcycle, LGV/PCV and ADI theory variants (same engine, different banks)
- Gamification: streaks, daily goals, readiness score that predicts theory pass likelihood

## 9. Business model

- **Freemium:** free sample topics, 2 hazard clips and 1 demo route. Premium unlocks everything, e.g. a monthly subscription comparable to competitors (around £4.99) or a one-off "until you pass" price.
- **Route packs per centre**, comparable to existing route apps (around £5–£10 per centre).
- **B2B for driving schools:** instructor seats, branded progress reports for pupils.
- **Partnerships** (insurers, car dealers, driving schools). Referring users to insurance products is FCA-regulated, so get compliance advice first.

## 10. Risks and compliance checklist

- **Accuracy and liability:** professional (ADI) content review, a visible "not official" disclaimer (included), and a way for users to report errors
- **Children's data:** learners can apply for a provisional licence from 15 years 9 months and drive at 17, so the app is likely to be used by under-18s → the **ICO Age Appropriate Design Code** applies (privacy by default, minimal data, no nudge techniques)
- **UK GDPR** for accounts, analytics and especially GPS route recording
- **Booking:** do not automate or resell test bookings (now restricted to the learner)
- **App store rules:** in-app purchase for digital content; clear subscription terms
- **Accessibility:** WCAG 2.2 AA; captions and voiceover; colour-blind-safe hazard UI (the scoring bands also show point values as text)

## 11. Suggested next steps

1. Decide on the DVSA licence. If yes, apply now, as approval and contracts take time.
2. Recruit one ADI as a content reviewer and route partner for a pilot centre.
3. Pick a name and check trademarks ("RoadReady UK" is a placeholder).
4. Run a closed beta with 20–50 learners; measure theory mock scores and hazard scores over time.
5. Add accounts and payments, wrap with Capacitor, submit to the stores.

## Sources

- GOV.UK: [Theory test multiple-choice questions](https://www.gov.uk/theory-test/multiple-choice-questions), [Hazard perception test](https://www.gov.uk/theory-test/hazard-perception-test), [Pass mark and result](https://www.gov.uk/theory-test/pass-mark-and-result), [Theory test changes, Sept 2020](https://www.gov.uk/government/news/theory-test-changes-28-september-2020)
- GOV.UK: [What happens during the driving test](https://www.gov.uk/driving-test/what-happens-during-test), [Car show me / tell me questions](https://www.gov.uk/government/publications/car-show-me-tell-me-vehicle-safety-questions/car-show-me-tell-me-vehicle-safety-questions)
- GOV.UK: [Make and sell driving theory test revision products (DVSA licensing)](https://www.gov.uk/guidance/make-and-sell-driving-theory-test-revision-products)
- DVSA bulletin: [Next steps for changes to the driving test booking service](https://content.govdelivery.com/accounts/UKDVSA/bulletins/40ea316); [Carwow summary of 2026 booking changes](https://www.carwow.co.uk/news/10823/dvsa-driving-test-booking-changes-2026)
- Waits and pass rates: [RAC: learners waiting 20 weeks](https://www.rac.co.uk/drive/news/motoring-news/learner-drivers-waiting-20-weeks-to-book-practical-test/), [IOTA: DVSA annual report 2025–26](https://www.iota.org.uk/blog/dvsa-publishes-its-annual-report-for-2025-26), [passrates.uk: record test capacity 2026](https://passrates.uk/guide/driving-test-record-capacity-2026)
- Routes: [Road Safety GB: DSA scraps publication of test routes](https://roadsafetygb.org.uk/?p=4566)
- Policy: [RAC Foundation: NI graduated driver licensing](https://www.racfoundation.org/media-centre/northern-ireland-introduces-graduated-driver-licensing), [Theory Test Pro: minimum learning period consultation](https://www.theorytestpro.co.uk/posts/minimum-learning-period-the-biggest-change-to-the-driving-test-in-90-years/)
- Competitors: [Yorkshire Post: best-rated learning-to-drive apps](https://www.yorkshirepost.co.uk/education/apple-app-store-5-best-rated-apps-learning-to-drive-passing-dvsa-licence-test-4967114)
