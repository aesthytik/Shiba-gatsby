# RoadReady UK v2: full app plan (rebuild)

_October 2026. This replaces the v1 roadmap. The driving simulator design is detailed in [DRIVE_SIM_PLAN.md](DRIVE_SIM_PLAN.md); market and licensing background is in [FEASIBILITY.md](FEASIBILITY.md)._

**One-line pitch:** the one app a UK learner needs from provisional licence to pass. Learn the theory, watch it explained, then **drive it yourself** in short lessons before you pay for the real thing.

---

## 1. What UK learners are up against

| Fact | What it means for the app |
|---|---|
| Theory pass rate is only about **45%** (third-party figures for 2024–25: 44.9%; DVSA's 2025–26 data isn't out yet) | Most people fail the theory test. Practice must feel like the real test and teach understanding, not memorisation |
| Practical pass rate is about **50%** (52.1% in August 2026) | Half of tests are wasted. Learners need to know when they're genuinely ready |
| About **45 hours of lessons + ~22 hours of private practice**, at around **£35/hour**; total cost **£1,600–£2,200** | Every rule learned in the app before a paid lesson saves money. "Save lessons" is the core value |
| **~20-week wait** for a practical test; booking rules tightened in 2026 (only the learner can book, 2 changes maximum) | Book early but arrive ready. Help learners plan; never offer booking bots |
| Theory certificate lasts **2 years**; a minimum learning period is under consultation; Northern Ireland now needs a **logbook** | Track dates and practice hours, ready for new rules |
| A known complaint about theory apps: *"the questions on the test aren't like the ones in the app"* | Realistic questions, video-clip questions and full mock tests that match the real format |

## 2. Gaps in the current app (honest audit)

| Area | Gap | Impact | Fix in v2 |
|---|---|---|---|
| Simulator | You can't drive. Route drives and hazard clips are watch-only | Missing the most engaging, most valuable feature | Drive mode with lessons, examiner and mock tests ([DRIVE_SIM_PLAN.md](DRIVE_SIM_PLAN.md)) |
| Theory content | 125 questions (the DVSA bank has 700+); not reviewed by an ADI; no video-clip questions in the mock | Not test-realistic; trust risk | Grow to 600+ ADI-reviewed questions, add the 3 video questions per mock, apply for the DVSA licence |
| Hazard perception | 6 clips (the real test has 14); scoring windows set by us, not calibrated | Can't do a true mock; scores may mislead | 30+ clips, a 14-clip exam mock, calibration with an ADI and beta users |
| Video helpers | None. Manoeuvres are 2D diagrams only | Learners who learn by watching are underserved | Short animated explainers made with the same 3D engine; "watch, then try it" |
| Progress | Stored only on one device. The readiness score is a simple formula, not validated | Lost when the browser is cleared; can't share; readiness may be wrong | Accounts with sync, a readiness model with 4 parts, an instructor/parent share link |
| Practical help | No lesson logbook, no plans for supervisors (parents), no reminders | Learners can't see real-world progress; parents don't know what to practise | Logbook, practice-session plans for supervisors, test-day reminders |
| Personalisation | No daily plan | Learners don't know what to do next | "Today's plan", built from weak areas and the test date |
| Accessibility | No voiceover, Welsh or BSL (the real theory test offers English or Welsh voiceover and BSL) | Excludes learners | Voiceover from launch, Welsh-ready structure, a dyslexia-friendly mode |
| Feedback loop | No analytics, no "report a problem" | Can't find confusing questions or bugs | Privacy-friendly analytics per question, in-app reporting |
| Architecture | Simulation logic mixed into React components; content checked only by tests; all data in one main bundle (~390 KB); no backend | Hard to scale the simulator and content | New monorepo with pure-TypeScript engine packages, validated content, a backend (§6) |
| Business | No accounts, payments or store apps | No revenue | Free core plus Premium; App Store and Google Play via Capacitor |
| Compliance | Children's code (AADC) not designed in; no process for Highway Code updates | Legal and accuracy risk | Privacy by default, guest mode, a content-versioning and review workflow |

**Ways learners could "cheat" or game the app, and how to prevent it:**
- **Memorising answers:** shuffle options, write varied wording, ask "why" follow-ups.
- **Driving slowly in the simulator to avoid faults:** the examiner also marks hesitation and holding up traffic, as real examiners do.
- **Clicking constantly in hazard clips:** already detected; keep and calibrate it.
- **A readiness score that's too optimistic:** count only recent results, and require mock tests before showing "Ready".

## 3. Competitors and the gap we fill

| Type | Examples | Strength | What they miss |
|---|---|---|---|
| Licensed theory kits | RAC Theory Test Kit, DVSA's official apps | Official questions and clips | No driving, no practical journey |
| Real-place simulator | DriveSim UK (Google 3D Tiles, 340+ centres) | Looks real, every centre | Desktop-first; no clear traffic or fault marking; no lessons; pricing unclear |
| Route apps | Test Routes and similar | Local routes | Accuracy concerns; routes only |
| Logbook / instructor apps | FourFive, MyLearners | Lesson tracking | No learning content or simulator |
| Lesson games | "Stop, Eh?" (viral X post) | Fun, one rule at a time, you drive | Not UK, narrow, no test prep |

**Our position:** the only app covering the **whole journey** (theory → watch → drive → practical → pass), with a **UK examiner that explains every fault**, and lessons you **drive yourself** on any phone.

## 4. Product design

### Principles

1. **Learn by doing:** every rule can be *read*, *watched* and *driven*.
2. **One rule at a time:** short lessons with a clear briefing card (the "Stop, Eh?" pattern).
3. **Explain every mark:** what you did, why it matters, the Highway Code rule, and a replay.
4. **Know when you're ready:** an honest readiness score; never encourage booking before it's ready.
5. **UK-first:** drive on the left, roundabouts, Highway Code, British streets, Welsh-ready.
6. **Any phone, even offline:** lessons and theory work without signal; 3D scales down on cheap phones.
7. **Safe and private:** guest mode first, minimal data, built for under-18 users.

### The learner journey

| Stage | Learner goal | What the app gives them |
|---|---|---|
| 1. Getting started | Provisional licence, eyesight, choosing an instructor | Checklist, costs and timeline, how to choose an ADI, number-plate eyesight check |
| 2. Theory | Pass both parts | Adaptive questions, signs, Highway Code reader, video explainers, hazard clips, full mocks |
| 3. Learning to drive | Build skills, save lessons | Drive lessons, logbook, supervisor practice plans, show me / tell me |
| 4. Test ready | Pass first time | Simulator mock tests, test-day walkthrough, faults guide, readiness check, reminders |
| 5. Passed (or not yet) | Drive safely, or bounce back | New-driver rules (6 points = licence revoked within 2 years), P plates, Pass Plus; or a fail debrief → targeted lessons → rebook (10 working days minimum) |

### Navigation (5 tabs)

| Tab | Contents |
|---|---|
| **Home: My plan** | Today's plan, readiness, test-date countdown, continue where you left off, journey stage |
| **Theory** | Practice by topic, mistakes, signs, Highway Code reader, hazard perception, mock test (50 questions plus 14 clips) |
| **Drive** | Lessons (units and stars), free drive, mock driving test, manoeuvres, real areas (later) |
| **Practical** | Test-day walkthrough, show me / tell me, faults guide, logbook, supervisor plans, mock-drive marker, booking guidance |
| **Progress** | Readiness breakdown, stats, streaks, history, sharing with instructor or parent, settings |

**Video helpers aren't a separate silo.** They appear in context: on every lesson's briefing card ("Watch how"), next to every theory topic, on the fault debrief ("Watch the right way"), and in a **Watch library** reachable from Home.

## 5. Features by area

**L** = launch, **N** = next, **later** = after that.

### 5.1 Theory test preparation
- **L** Adaptive practice: spaced repetition, weakest topics first, a "Daily 10".
- **L** 300+ original ADI-reviewed questions at launch, growing to 600+. Each has an explanation, a Highway Code reference and a "why the others are wrong" note.
- **L** A full mock in the real format: 50 questions in 57 minutes, including **3 video-clip questions** rendered by our 3D engine; then a 14-clip hazard perception section; results for both parts.
- **L** Road signs and markings trainer; Highway Code reader with search (Open Government Licence).
- **L** Hazard perception: 15+ clips at launch, aiming for 30+, with replay and explanations. Upgrade the art to the warmer style.
- **N** English voiceover for questions; Welsh language; dyslexia-friendly font; adjustable text size.
- **N** Licensed DVSA question bank and clips as a premium layer, if the licence is granted.
- **Later** BSL videos.

### 5.2 Video helpers
- **What they are:** 30–90 second narrated explainers on roundabouts, every junction type, crossings, the manoeuvres, emergency stop, test day, and the top 10 faults.
- **How they're made:** the same scripted 3D scenes as the Drive lessons, played as an **in-app interactive video**. You can pause, rotate the camera, slow it down, and switch between driver and overhead views. Files stay tiny, it works offline, and it costs no filming.
- **Exported versions:** the same scenes rendered to MP4 (for low-end devices and social media, e.g. "Learn mini-roundabouts in 60 seconds").
- **Voice:** UK text-to-speech to start, a professional voice for the top videos later. Captions always on by default.
- **Watch, then try:** every explainer ends with "Try it", which opens the matching Drive lesson.
- **N** Real-car show me / tell me videos (bonnet checks, controls) filmed with a partner instructor, or recreated in a 3D car interior.

### 5.3 Simulator (Drive)
Full detail in [DRIVE_SIM_PLAN.md](DRIVE_SIM_PLAN.md). In summary:

- **L** **Lessons in the screenshot style:** briefing card (rule, your route, what will happen, controls) → you drive → stars, faults and replays. Launch with the first 2 units (about 9 lessons), aiming for 22.
- **L** Car feel: automatic gearbox, chase and cockpit cameras, indicators, explicit mirror and blind-spot checks; keyboard, touch and gamepad; assisted steering by default on phones.
- **L** **Examiner engine:** live fault checks mapped to the DL25 marking sheet (speed, signals, mirrors, moving off, STOP lines, give way, crossings, lane position, following distance, clearance, kerb, collisions), each explained with the Highway Code rule and a replay.
- **N** Realistic traffic (cars, cyclists, pedestrians, traffic lights), free drive, full **mock driving test** with sat-nav independent driving and a manoeuvre.
- **N** Drive the manoeuvres yourself.
- **Later** Real areas around test centres (OpenStreetMap roads plus Ordnance Survey hills), optional Google 3D "real look", manual gearbox, steering wheels, night and rain, AI instructor debrief.

### 5.4 Practical test help
- **L** Test-day walkthrough (kept from v1, with videos added); show me / tell me flashcards; faults guide and top-10 fail reasons; mock-drive marker for instructors and parents.
- **L** **Logbook:** record lessons and private practice (date, duration, skills covered, notes); hours total vs the ~45 + 22 guide; Northern Ireland logbook export.
- **L** **Supervisor plans:** short session plans for parents and supervising drivers ("Session 3: quiet junctions"), what to say, what to watch for, and the legal requirements (21+, held a full licence for 3+ years, L plates, insurance).
- **N** **Instructor link:** a read-only progress share, and lets the instructor tick off skills and see simulator fault trends.
- **N** Booking guidance: official GOV.UK links only, the 2026 rules explained, reminders before the test, a theory-certificate expiry warning.
- **N** After the test: pass or fail flows (see the journey stages above).

### 5.5 Progress
- **L** **Readiness score** with 4 parts, each with a "how to improve" tip:
  1. Theory knowledge (recent accuracy by topic, mock results)
  2. Hazard perception (recent clip scores)
  3. Driving rules (simulator lessons and mock-test faults)
  4. Real-world practice (logbook hours, instructor sign-off)

  "Ready" is shown only after recent passing mocks.
- **L** **Today's plan:** e.g. 10 questions on roundabouts + Drive lesson 9 + the "Mini-roundabouts" video. It adapts to weak areas and days until the test.
- **L** Streaks, gentle reminders (opt-in), history.
- **N** Accounts and sync across devices; sharing with an instructor or parent; exporting data.

## 6. Architecture

### 6.1 Repository: monorepo built from scratch

```
apps/
  web/              React app (screens, navigation, PWA); wrapped with Capacitor for iOS and Android
packages/
  ui/               design system: tokens, components (BriefingCard, HUD, cards, charts), accessibility
  content/          typed content with schemas: questions, signs, lessons, video scripts, practical data;
                    review metadata (author, ADI reviewer, Highway Code version); validation in CI
  core/             pure TS domain: progress, readiness model, spaced repetition, hazard scoring, study plan
  sim/              pure TS simulator: road graph, vehicle, traffic, examiner checkers, lesson engine, replay
  render/           three.js / react-three-fiber: models, art style, scenes for lessons, clips and videos
services/
  api/              Supabase: database schema, row-level security, edge functions (sync, entitlements, AI debrief)
tools/
  content-lint/     checks content (duplicates, missing references, reading level)
  video-render/     renders 3D scenes to MP4 (captions plus voice) for export and social
  osm-import/       (later) OpenStreetMap → road graph → 3D chunks for real areas
```

- **Why this shape:** the simulator, scoring and readiness logic are **pure TypeScript**, so they're unit-tested and can run headless ("bot drivers" in CI).
- The UI and 3D layers can change without breaking the rules.
- Content is data with schemas, so ADIs can review it and it can be updated without code changes.

**Carried over from v1** (moved into the new packages, not copied blindly):
- the question bank and road signs
- show me / tell me and practical data
- route geometry helpers
- 3D models, sky and weather
- hazard scoring and its tests
- manoeuvre keyframes

### 6.2 Technology

| Need | Choice | Why |
|---|---|---|
| App | React + TypeScript + Vite; Tailwind with a design system | Proven in v1; fast |
| 3D | three.js via react-three-fiber | Already working; runs on any modern phone browser |
| Mobile apps | PWA plus Capacitor | One codebase for web, iOS and Android |
| Local data | IndexedDB (Dexie), local-first | Works offline; instant |
| Backend | Supabase (Postgres, auth, storage, edge functions), UK/EU region | Accounts, sync, sharing, entitlements, with little to maintain |
| Sign-in | Guest by default; email link, Apple, Google | Less friction; minimal data for under-18s |
| Payments | RevenueCat (app stores) plus Stripe (web) | Apple and Google require their billing in apps |
| AI debrief | Claude through a server function, sending the fault log only | Personal feedback; usage capped per user |
| Analytics | Privacy-friendly, EU-hosted, no personal data; anonymous stats per question | Find confusing content; stay AADC-compliant |
| Errors | Sentry | Catch crashes on real devices |
| Assets | CDN (video, 3D chunks), streaming video | Fast loads, small app |
| Notifications | Web push plus native push | Reminders and streaks (opt-in) |
| Languages | Translation structure from day one (en-GB, cy) | Welsh support |

### 6.3 Quality

- **Tests:**
  - unit tests (core, simulator, scoring)
  - **bot-driver tests** (a good driver gets 3 stars; each kind of bad driver gets the right fault)
  - content validation
  - end-to-end tests (Playwright)
  - screenshot comparisons of key scenes
- **CI:** GitHub Actions on every PR, with a Vercel preview deploy for each PR.
- **Budgets:**
  - first load under 250 KB of JavaScript (3D loads separately)
  - first lesson under 5 MB
  - 60 fps on desktop, 30 fps on a mid-range Android phone
- **Accessibility:** aim for WCAG 2.2 AA, with an audit before launch.

### 6.4 Privacy and safety

- Guest mode; no location by default.
- Data minimisation.
- Age Appropriate Design Code (AADC) and UK GDPR:
  - a privacy assessment (DPIA)
  - high privacy settings by default
  - no dark patterns
- Clear notices: not official, not a substitute for lessons, routes are illustrative.

## 7. Design direction

- **Look:** warm, friendly, stylised low-poly (inspired by "Stop, Eh?"), with British cues:
  - red-brick terraces, post boxes, Belisha beacons
  - yellow rear number plates, double yellow lines
  - autumn trees
- **UI:** clean cards, generous touch targets, bold briefing cards with a single clear call to action, dark mode, colour-blind-safe status colours.
- **Mobile-first layouts;** the simulator runs landscape on phones.
- **Shared design system** across theory, Drive and video so the app feels like one product.

## 8. Rebuild roadmap

The **v1 site stays live** until v2 matches its features. v2 is built on a new branch with preview deploys, and the switch happens when it's ready. Effort is a rough estimate for me building with you reviewing.

| Phase | Scope | Done when | Effort |
|---|---|---|---|
| **0. Foundations** | Monorepo, design system, content schemas, move v1 content into packages, CI, preview deploys, new app shell (5 tabs, Home plan placeholder) | Shell deploys to a preview URL; content validated; tests green | 1–2 weeks |
| **1. Drive core + first lessons** | Vehicle, cameras, controls (keyboard, touch, assisted), briefing-card lesson flow, examiner with 8 checks, results with stars and replays, lessons 1, 6, 7, 9, 13, art refresh | A scripted good driver gets 3 stars on each lesson; bad drivers get the right faults; playable on a phone | 3–4 weeks |
| **2. Theory 2.0** | Adaptive practice, 300+ questions, video-clip questions, 15 hazard clips in the new style, full mock, Highway Code reader, voiceover | The full mock matches the real format; questions validated; an ADI has reviewed the first 150 | 3 weeks |
| **3. Video helpers v1** | Interactive explainer player, 12 explainers linked to lessons and topics, MP4 export tool | Every launch lesson has a "watch how" video; exports under 10 MB each | 2–3 weeks |
| **4. Practical + Progress** | Logbook, supervisor plans, readiness model, Today's plan, reminders; accounts and sync; share link | A plan is generated daily from weak areas; progress syncs across 2 devices | 3 weeks |
| **5. Full Drive** | All 22 lessons, traffic, mock driving test, manoeuvres, free drive | A 10–15 minute mock works end to end; an ADI agrees with faults on 20 recorded drives | 4 weeks |
| **6. Launch** | Payments, store apps, full ADI content review, accessibility audit, privacy (DPIA, policy), beta with 50 learners, switch v1 → v2 | Store approval; beta retention and score improvements tracked | 3–4 weeks |
| **7. Real areas** | OpenStreetMap pipeline, 3 pilot test centres, then scale; optional Google real-look mode | Pilot routes drive with no geometry errors | 4–6 weeks, then ongoing |

**Public launch in roughly 5–6 months.** Phases 2–4 can overlap if there's more help (e.g. a content writer and an ADI).

## 9. Business model and success measures

- **Free:** theory basics, Daily 10, Unit 1 Drive lessons, 3 hazard clips, test-day walkthrough.
- **Premium:** all lessons, mock tests (theory and driving), all clips and videos, logbook export, real areas. For example around **£4.99/month** or a one-off "until you pass" price; check against competitors at launch.
- **Instructor plan (later):** multiple pupils, progress dashboards.
- **Avoid insurance referrals** until there's FCA advice.

**Measures:**
- activation (first lesson completed)
- weekly active learners
- 7- and 30-day retention
- theory mock pass rate over time
- self-reported first-time pass rate vs the national ~45% (theory) and ~50% (practical)
- free → premium conversion

## 10. Risks

| Risk | Mitigation |
|---|---|
| A rebuild delays everything | Keep v1 live; phase gates; reuse v1 content and tested logic |
| Simulator doesn't feel good | Feel spike first; assist levels; tune with you on real devices |
| Examiner marks unfairly | Conservative thresholds, every fault explained, "this seems wrong" button, ADI calibration |
| Content errors | ADI review workflow, version tracking against the Highway Code, in-app reporting |
| Phone performance | Quality presets, assisted mode, streamed assets |
| Legal / privacy (under-18s) | Privacy by default, DPIA, clear notices |
| DVSA licence refused or slow | Original content is the baseline; licensed content is an add-on |

## 11. Decisions needed

1. **Approve the monorepo rebuild**, keeping v1 live until v2 matches it.
2. **Product name** ("RoadReady UK" is a placeholder; check trademarks).
3. **Apply for the DVSA licence now?** (recommended)
4. **Find an ADI partner** to review content and calibrate the examiner.
5. **Voice:** text-to-speech first (recommended) or a voice actor.
6. **Welsh at launch,** or soon after? (Recommended: structure ready at launch, Welsh content soon after.)
7. **Backend:** Supabase (recommended); needs your account.
8. **Already decided:** both platforms, tuned on desktop first; automatic gearbox first.

## Sources

- Theory pass rates: [DVSA theory test statistics](https://www.gov.uk/government/statistics/operational-driving-theory-test-statistics), [passrates.uk: theory test pass rates](https://passrates.uk/guide/theory-test-pass-rates)
- Practical pass rate and waits: [RAC: learners waiting 20 weeks](https://www.rac.co.uk/drive/news/motoring-news/learner-drivers-waiting-20-weeks-to-book-practical-test/), [IOTA: DVSA annual report 2025–26](https://www.iota.org.uk/blog/dvsa-publishes-its-annual-report-for-2025-26)
- Lessons and costs: [passrates.uk: how many lessons](https://passrates.uk/guide/how-many-driving-lessons-do-i-need), [passrates.uk: cost of learning to drive 2026](https://passrates.uk/guide/cost-of-learning-to-drive-2026-breakdown)
- Booking changes: [DVSA bulletin](https://content.govdelivery.com/accounts/UKDVSA/bulletins/40ea316)
- Competitors: [DriveSim UK](https://drivesim.uk/), [DriveSim simulator page](https://drivesim.uk/simulator), [Theory Test Hero listing (question realism complaint)](https://apps.apple.com/app/id1588142206), [FourFive](https://apps.apple.com/gb/app/fourfive-learn-to-drive/id1536951736)
- Lesson-game reference: "Stop, Eh?" post by @mustafa01ali on X, 2 October 2026 (screenshot supplied)
