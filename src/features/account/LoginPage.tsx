import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Cloud, Mail } from 'lucide-react'
import { cloudEnabled } from '../../lib/supabase'
import { Logo } from '../../components/ui/Logo'
import { sendMagicLink, sendPasswordReset, signIn, signUp, useAuth, type Result } from './auth'

type Mode = 'signin' | 'signup' | 'reset'

const field = 'mt-1 block w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] font-normal text-ink placeholder:text-muted'

export function LoginPage() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result>({})

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  if (!cloudEnabled) {
    return (
      <div className="mx-auto max-w-md pt-6">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <Cloud className="mb-3 text-muted" size={28} />
          <h1 className="font-display text-2xl font-extrabold">Cloud save is not switched on</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Your progress is saved on this device only. The site owner needs to add Supabase settings to turn on accounts.</p>
          <Link to="/" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink">
            Back to home
          </Link>
        </div>
      </div>
    )
  }
  if (ready && user) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult({})
    const r = mode === 'signin' ? await signIn(email, password) : mode === 'signup' ? await signUp(email, password) : await sendPasswordReset(email)
    setResult(r)
    setBusy(false)
  }
  const link = async () => {
    if (!email.trim()) return setResult({ error: 'Enter your email address first.' })
    setBusy(true)
    setResult(await sendMagicLink(email))
    setBusy(false)
  }
  const switchTo = (m: Mode) => {
    setMode(m)
    setResult({})
  }
  const title = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Save your progress' : 'Reset your password'

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-10">
      <div className="mb-6 flex justify-center md:hidden">
        <Logo />
      </div>
      <div className="rounded-3xl border border-line bg-surface p-6 md:p-8">
        <h1 className="font-display text-3xl leading-none font-extrabold tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {mode === 'signup' ? 'Create a free account to keep your lessons, logbook and test results safe, and pick up on any device. Anything you have done on this device comes with you.' : mode === 'reset' ? 'Enter your email and we will send you a link to choose a new password.' : 'Sign in to load your saved progress.'}
        </p>

        {mode !== 'reset' && (
          <div role="tablist" aria-label="Account" className="mt-5 flex gap-1.5 rounded-2xl bg-surface-2 p-1.5">
            {(['signin', 'signup'] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchTo(m)} className={`min-h-10 flex-1 rounded-xl text-sm font-semibold ${mode === m ? 'bg-surface text-ink shadow-sm shadow-black/10' : 'text-muted'}`}>
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <label className="text-sm font-semibold">
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
          </label>
          {mode !== 'reset' && (
            <label className="text-sm font-semibold">
              Password
              <input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} className={field} />
            </label>
          )}

          {result.error && (
            <p role="alert" className="rounded-xl bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
              {result.error}
            </p>
          )}
          {result.notice && (
            <p role="status" className="rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm text-brand">
              {result.notice}
            </p>
          )}

          <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-brand text-[15px] font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-60">
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {mode === 'signin' && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <button type="button" onClick={link} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold hover:bg-surface-2 disabled:opacity-60">
              <Mail size={16} /> Email me a sign-in link
            </button>
            <button type="button" onClick={() => switchTo('reset')} className="mt-4 w-full text-center text-sm font-semibold text-brand">
              Forgot your password?
            </button>
          </>
        )}
        {mode === 'reset' && (
          <button type="button" onClick={() => switchTo('signin')} className="mt-4 w-full text-center text-sm font-semibold text-brand">
            Back to sign in
          </button>
        )}
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        You can use RoadReady without an account.{' '}
        <Link to="/" className="font-semibold text-brand">
          Carry on without one
        </Link>
      </p>
    </div>
  )
}
