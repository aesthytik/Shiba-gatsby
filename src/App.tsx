import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './features/home/HomePage'
import { TheoryHome } from './features/theory/TheoryHome'
import { PracticeSession } from './features/theory/PracticeSession'
import { MockTest } from './features/theory/MockTest'
import { SignsPage } from './features/theory/SignsPage'
import { PracticalHome } from './features/practical/PracticalHome'
import { TestDayWalkthrough } from './features/practical/TestDayWalkthrough'
import { ShowMeTellMe } from './features/practical/ShowMeTellMe'
import { ManoeuvresPage } from './features/practical/ManoeuvresPage'
import { FaultsGuide } from './features/practical/FaultsGuide'
import { MockDrive } from './features/practical/MockDrive'
import { RoutesHome } from './features/routes/RoutesHome'
import { AboutPage } from './features/about/AboutPage'
import { NotFound } from './features/about/NotFound'
import { DriveLessons } from './features/drive/DriveLessons'
import { DriveBriefing } from './features/drive/DriveBriefing'
import { DriveResult } from './features/drive/DriveResult'
import { ProgressPage } from './features/progress/ProgressPage'
import { WatchLibrary } from './features/video/WatchLibrary'
import { Spinner } from './components/ui/Spinner'

// The 3D modules pull in three.js, so they load on demand.
const HazardHome = lazy(() => import('./features/hazard/HazardHome'))
const HazardPlayer = lazy(() => import('./features/hazard/HazardPlayer'))
const RouteDetail = lazy(() => import('./features/routes/RouteDetail'))
const DrivePlay = lazy(() => import('./features/drive/DrivePlay'))
const VideoPlayer = lazy(() => import('./features/video/VideoPlayer'))

export function App() {
  return (
    <Suspense fallback={<Spinner label="Loading" />}>
      <Routes>
        {/* The driving view is full screen, with no navigation around it. */}
        <Route path="drive/:n/play" element={<DrivePlay />} />
        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route index element={<HomePage />} />
                <Route path="theory" element={<TheoryHome />} />
                <Route path="theory/practice/:deck" element={<PracticeSession />} />
                <Route path="theory/mock" element={<MockTest />} />
                <Route path="theory/signs" element={<SignsPage />} />
                <Route path="hazard" element={<HazardHome />} />
                <Route path="hazard/:clipId" element={<HazardPlayer />} />
                <Route path="watch" element={<WatchLibrary />} />
                <Route path="watch/:id" element={<VideoPlayer />} />
                <Route path="drive" element={<DriveLessons />} />
                <Route path="drive/:n" element={<DriveBriefing />} />
                <Route path="drive/:n/result" element={<DriveResult />} />
                <Route path="practical" element={<PracticalHome />} />
                <Route path="practical/test-day" element={<TestDayWalkthrough />} />
                <Route path="practical/show-me-tell-me" element={<ShowMeTellMe />} />
                <Route path="practical/manoeuvres" element={<ManoeuvresPage />} />
                <Route path="practical/faults" element={<FaultsGuide />} />
                <Route path="practical/mock-drive" element={<MockDrive />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="routes" element={<RoutesHome />} />
                <Route path="routes/:routeId" element={<RouteDetail />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </Suspense>
  )
}
