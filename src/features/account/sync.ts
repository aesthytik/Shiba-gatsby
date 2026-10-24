import { supabase } from '../../lib/supabase'
import { useProgress } from '../../store/progress'
import { startAuth, useAuth } from './auth'
import { mergeSnapshots, snapshotOf } from './merge'

const PUSH_DELAY_MS = 2500

let applying = false
let timer: ReturnType<typeof setTimeout> | undefined
let syncedUser: string | undefined

const setSync = (sync: 'syncing' | 'synced' | 'error', syncError?: string) =>
  useAuth.setState({ sync, syncError, ...(sync === 'synced' ? { lastSynced: Date.now() } : {}) })

async function push(userId: string) {
  if (!supabase) return
  setSync('syncing')
  const { error } = await supabase.from('progress').upsert({ user_id: userId, data: snapshotOf(useProgress.getState()), updated_at: new Date().toISOString() })
  error ? setSync('error', 'Could not save your progress. We will try again after your next change.') : setSync('synced')
}

/** Fetch the cloud copy, merge it with this device, then save the merged result back. */
let inFlight: Promise<void> | undefined

export function pullAndMerge(userId: string) {
  // SIGNED_IN and INITIAL_SESSION can arrive together: do the work once.
  inFlight ??= doPullAndMerge(userId).finally(() => (inFlight = undefined))
  return inFlight
}

async function doPullAndMerge(userId: string) {
  if (!supabase) return
  setSync('syncing')
  const { data, error } = await supabase.from('progress').select('data').eq('user_id', userId).maybeSingle()
  if (error) return setSync('error', 'Could not load your saved progress. Check your connection and try again.')
  const merged = mergeSnapshots(snapshotOf(useProgress.getState()), data?.data)
  applying = true
  useProgress.setState(merged)
  applying = false
  syncedUser = userId
  await push(userId)
}

/** Manual "Sync now" from the account page. */
export async function syncNow() {
  const user = useAuth.getState().user
  if (user) await pullAndMerge(user.id)
}

/** Delete the cloud copy but keep progress on this device. */
export async function deleteCloudCopy() {
  const user = useAuth.getState().user
  if (!supabase || !user) return { error: 'Not signed in.' }
  const { error } = await supabase.from('progress').delete().eq('user_id', user.id)
  if (error) return { error: 'Could not delete your cloud copy. Please try again.' }
  useAuth.setState({ sync: 'off', lastSynced: undefined })
  return {}
}

/** Wire up auth and keep the cloud copy in step with local changes while someone is signed in. */
export function startSync() {
  if (!supabase) return
  startAuth((user) => void pullAndMerge(user.id))
  useProgress.subscribe(() => {
    const user = useAuth.getState().user
    if (applying || !user || syncedUser !== user.id) return
    clearTimeout(timer)
    timer = setTimeout(() => void push(user.id), PUSH_DELAY_MS)
  })
  useAuth.subscribe((s, prev) => {
    if (prev.user && !s.user) {
      syncedUser = undefined
      clearTimeout(timer)
    }
  })
  // Push any pending change before the tab goes away.
  window.addEventListener('pagehide', () => {
    const user = useAuth.getState().user
    if (timer && user && syncedUser === user.id) {
      clearTimeout(timer)
      void push(user.id)
    }
  })
}
