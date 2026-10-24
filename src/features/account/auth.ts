import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error'

interface AuthState {
  /** False until we know whether someone is already signed in. */
  ready: boolean
  user: User | null
  /** True after following a password reset link. */
  recovery: boolean
  sync: SyncStatus
  lastSynced?: number
  syncError?: string
}

export const useAuth = create<AuthState>(() => ({ ready: !supabase, user: null, recovery: false, sync: 'off' }))

export interface Result {
  error?: string
  /** Set when the next step is for the learner to check their email. */
  notice?: string
}

const NOT_SET_UP = 'Cloud save is not set up on this site yet.'

/** Plain-English versions of the messages Supabase returns. */
function explain(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'That email and password do not match. Check them, or use the sign-in link instead.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. We sent you a link when you created the account.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'There is already an account with that email. Try signing in instead.'
  if (m.includes('password') && m.includes('characters')) return 'Choose a password of at least 8 characters.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Could not reach the server. Check your connection and try again.'
  return message
}

const origin = () => (typeof window === 'undefined' ? '' : window.location.origin)

export async function signIn(email: string, password: string): Promise<Result> {
  if (!supabase) return { error: NOT_SET_UP }
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return error ? { error: explain(error.message) } : {}
}

export async function signUp(email: string, password: string): Promise<Result> {
  if (!supabase) return { error: NOT_SET_UP }
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${origin()}/` } })
  if (error) return { error: explain(error.message) }
  // With email confirmation on, there is no session yet.
  return data.session ? {} : { notice: `We have sent a confirmation link to ${email.trim()}. Open it to finish creating your account.` }
}

export async function sendMagicLink(email: string): Promise<Result> {
  if (!supabase) return { error: NOT_SET_UP }
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${origin()}/` } })
  return error ? { error: explain(error.message) } : { notice: `We have sent a sign-in link to ${email.trim()}. It works once and expires soon.` }
}

export async function sendPasswordReset(email: string): Promise<Result> {
  if (!supabase) return { error: NOT_SET_UP }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin()}/account` })
  return error ? { error: explain(error.message) } : { notice: `If there is an account for ${email.trim()}, we have sent a link to reset the password.` }
}

export async function updatePassword(password: string): Promise<Result> {
  if (!supabase) return { error: NOT_SET_UP }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: explain(error.message) }
  useAuth.setState({ recovery: false })
  return { notice: 'Password updated.' }
}

export async function signOut(): Promise<Result> {
  if (!supabase) return {}
  const { error } = await supabase.auth.signOut()
  return error ? { error: explain(error.message) } : {}
}

export async function deleteAccount(): Promise<Result> {
  if (!supabase) return { error: NOT_SET_UP }
  const { error } = await supabase.rpc('delete_my_account')
  if (error) return { error: explain(error.message) }
  await supabase.auth.signOut()
  return {}
}

let started = false

/** Restore any saved session and keep the auth store in step with Supabase. */
export function startAuth(onSignedIn: (user: User) => void) {
  if (started || !supabase) return
  started = true
  supabase.auth.getSession().then(({ data }) => useAuth.setState({ user: data.session?.user ?? null, ready: true }))
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null
    useAuth.setState({ user, ready: true, recovery: event === 'PASSWORD_RECOVERY' ? true : useAuth.getState().recovery, ...(user ? {} : { sync: 'off' as const }) })
    // Calling Supabase from inside this callback can deadlock, so hand off to the next tick.
    if (user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) setTimeout(() => onSignedIn(user), 0)
  })
}
