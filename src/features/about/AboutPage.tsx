import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useProgress } from '../../store/progress'
import { cloudEnabled } from '../../lib/supabase'
import { useAuth } from '../account/auth'

export function AboutPage() {
  const reset = useProgress((s) => s.reset)
  const user = useAuth((s) => s.user)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <PageHeader title="About and sources" subtitle="What this app is, where its content comes from, and how your data is stored." />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <h2 className="font-semibold text-ink">Not an official DVSA product</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            RoadReady UK is an independent study aid. It is not affiliated with or endorsed by the Driver and Vehicle Standards Agency (DVSA). Always check GOV.UK for the
            latest rules, fees and booking information.
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink">Content and licensing</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
            <li>
              <strong className="text-ink">Practice questions</strong> are original, written from the rules in The Highway Code. They are not the DVSA revision question bank,
              which can only be used under a DVSA Crown copyright licence.
            </li>
            <li>
              <strong className="text-ink">Hazard perception clips</strong> are original 3D scenes, scored using the same 5-point method as the real test. They are not DVSA
              clips.
            </li>
            <li>
              <strong className="text-ink">Show me / tell me questions</strong> and test format details are based on GOV.UK guidance. Contains public sector information licensed
              under the Open Government Licence v3.0.
            </li>
            <li>
              <strong className="text-ink">Road signs</strong> are redrawn for this app as simplified illustrations.
            </li>
            <li>
              <strong className="text-ink">Test routes</strong> are illustrative routes around a fictional centre. DVSA does not publish test routes.
            </li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink">Your data</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {user
              ? 'You are signed in, so your progress is also saved to your account. Resetting here clears this device and, once synced, your cloud copy too.'
              : cloudEnabled
                ? 'Your progress is stored only in this browser on this device unless you create an account to save it. We never send it anywhere otherwise.'
                : 'Your progress is stored only in this browser on this device. Nothing is sent to a server.'}
          </p>
          {confirm ? (
            <div className="mt-3 flex gap-2">
              <Button
                variant="danger"
                onClick={() => {
                  reset()
                  setConfirm(false)
                }}
              >
                Yes, delete my progress
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="mt-3" onClick={() => setConfirm(true)}>
              Reset all progress
            </Button>
          )}
        </Card>
      </div>
    </>
  )
}
