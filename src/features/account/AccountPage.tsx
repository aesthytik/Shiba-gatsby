import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { AlertCircle, Check, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { cloudEnabled } from '../../lib/supabase'
import { useProgress } from '../../store/progress'
import { deleteAccount, signOut, updatePassword, useAuth, type Result } from './auth'
import { deleteCloudCopy, syncNow } from './sync'

const field = 'mt-1 block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] font-normal text-ink'

export function AccountPage() {
  const { user, ready, sync, lastSynced, syncError, recovery } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [pwResult, setPwResult] = useState<Result>({})
  const [msg, setMsg] = useState<Result>({})
  const [confirm, setConfirm] = useState<'none' | 'clear' | 'cloud' | 'account'>('none')
  const runs = useProgress((s) => s.driveRuns.length)
  const answered = useProgress((s) => Object.keys(s.questionStats).length)
  const logged = useProgress((s) => s.logbook.length)
  const reset = useProgress((s) => s.reset)

  if (!cloudEnabled) return <Navigate to="/login" replace />
  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwResult(await updatePassword(pw))
    setPw('')
  }
  const leave = async (clearDevice: boolean) => {
    await signOut()
    if (clearDevice) reset()
    navigate('/', { replace: true })
  }

  return (
    <>
      <PageHeader title="Account" subtitle="Your progress is saved to your account, so you can pick up on any device." />

      {recovery && (
        <form onSubmit={changePassword} className="mb-6 max-w-lg rounded-3xl border-2 border-brand bg-surface p-5">
          <h2 className="text-lg font-extrabold">Choose a new password</h2>
          <label className="mt-3 block text-sm font-semibold">
            New password
            <input type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={field} />
          </label>
          <button type="submit" className="mt-3 min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink">
            Save password
          </button>
          {pwResult.error && <p role="alert" className="mt-2 text-sm text-bad">{pwResult.error}</p>}
        </form>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <section aria-labelledby="who-h" className="rounded-3xl border border-line bg-surface p-5">
            <h2 id="who-h" className="mb-3 text-base font-extrabold">
              Signed in as
            </h2>
            <p className="flex items-center gap-3 text-[15px] font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-navy font-display text-lg font-extrabold text-white">{(user.email ?? '?')[0].toUpperCase()}</span>
              <span className="min-w-0 break-all">{user.email}</span>
            </p>
          </section>

          <section aria-labelledby="sync-h" className="rounded-3xl border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="sync-h" className="text-base font-extrabold">
                Cloud save
              </h2>
              {sync === 'synced' && <Badge tone="ok"><Check size={12} /> Saved</Badge>}
              {sync === 'syncing' && <Badge tone="brand"><RefreshCw size={12} className="animate-spin" /> Saving</Badge>}
              {sync === 'error' && <Badge tone="bad"><AlertCircle size={12} /> Problem</Badge>}
              {sync === 'off' && <Badge><CloudOff size={12} /> Not synced</Badge>}
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {lastSynced ? `Last saved at ${new Date(lastSynced).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. ` : ''}
              Changes are saved automatically a couple of seconds after you make them.
            </p>
            {syncError && <p role="alert" className="mt-2 text-sm text-bad">{syncError}</p>}
            <dl className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              {[
                ['Questions', answered],
                ['Drive runs', runs],
                ['Logged drives', logged],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-bg px-2 py-2.5">
                  <dd className="font-display text-xl font-extrabold">{v}</dd>
                  <dt className="text-xs text-muted">{k}</dt>
                </div>
              ))}
            </dl>
            <button type="button" onClick={() => void syncNow()} disabled={sync === 'syncing'} className="mt-4 flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-2 disabled:opacity-60">
              <Cloud size={16} /> Sync now
            </button>
          </section>

          {!recovery && (
            <form onSubmit={changePassword} className="rounded-3xl border border-line bg-surface p-5">
              <h2 className="text-base font-extrabold">Change password</h2>
              <label className="mt-3 block text-sm font-semibold">
                New password
                <input type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" className={field} />
              </label>
              <button type="submit" className="mt-3 min-h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-2">
                Update password
              </button>
              {pwResult.error && <p role="alert" className="mt-2 text-sm text-bad">{pwResult.error}</p>}
              {pwResult.notice && <p role="status" className="mt-2 text-sm text-brand">{pwResult.notice}</p>}
            </form>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section aria-labelledby="out-h" className="rounded-3xl border border-line bg-surface p-5">
            <h2 id="out-h" className="mb-2 text-base font-extrabold">
              Sign out
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-muted">Signing out keeps your progress on this device. On a shared computer, clear it as well.</p>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => void leave(false)} className="min-h-11 rounded-xl bg-navy px-4 text-sm font-bold text-white">
                Sign out
              </button>
              {confirm === 'clear' ? (
                <button type="button" onClick={() => void leave(true)} className="min-h-11 rounded-xl bg-bad px-4 text-sm font-bold text-white">
                  Yes, sign out and clear this device
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm('clear')} className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-2">
                  Sign out and clear this device
                </button>
              )}
            </div>
          </section>

          <section aria-labelledby="del-h" className="rounded-3xl border border-bad/30 bg-surface p-5">
            <h2 id="del-h" className="mb-2 text-base font-extrabold">
              Your data
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-muted">We store your email address and your progress, nothing else. You can remove the cloud copy, or delete the account entirely.</p>
            <div className="flex flex-col items-start gap-2.5">
              {confirm === 'cloud' ? (
                <button
                  type="button"
                  onClick={async () => {
                    setMsg(await deleteCloudCopy())
                    setConfirm('none')
                  }}
                  className="min-h-11 rounded-xl bg-bad px-4 text-sm font-bold text-white"
                >
                  Yes, delete my cloud copy
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm('cloud')} className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-2">
                  Delete my cloud copy
                </button>
              )}
              {confirm === 'account' ? (
                <button
                  type="button"
                  onClick={async () => {
                    const r = await deleteAccount()
                    if (r.error) setMsg(r)
                    else navigate('/', { replace: true })
                  }}
                  className="min-h-11 rounded-xl bg-bad px-4 text-sm font-bold text-white"
                >
                  Yes, permanently delete my account
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm('account')} className="min-h-11 rounded-xl border border-bad/40 px-4 text-sm font-semibold text-bad hover:bg-bad-soft">
                  Delete my account
                </button>
              )}
            </div>
            {msg.error && <p role="alert" className="mt-3 text-sm text-bad">{msg.error}</p>}
            <p className="mt-3 text-xs text-muted">Deleting your account removes it for good. Progress on this device stays unless you clear it.</p>
          </section>
          <Link to="/about" className="px-1 text-sm font-semibold text-brand">
            About &amp; sources
          </Link>
        </div>
      </div>
    </>
  )
}
