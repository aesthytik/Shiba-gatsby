import { useEffect, useRef } from 'react'
import type { DriveInput } from './types'

type Pending = Pick<DriveInput, 'indicate' | 'mirror' | 'look'>

/** Keyboard, on-screen buttons and gamepad, merged into one input per simulation step. */
export class DriveInputs {
  private keys = new Set<string>()
  private queue: Pending[] = []
  private padHeld = { left: false, right: false, mirror: false, lookL: false, lookR: false }
  /** Written by the on-screen buttons. */
  touch = { throttle: 0, brake: 0, steer: 0 }
  onPause?: () => void
  onCamera?: () => void
  usedPad = false

  private down = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const code = e.code
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) e.preventDefault()
    if (e.repeat) return
    this.keys.add(code)
    this.event(code)
  }
  private up = (e: KeyboardEvent) => void this.keys.delete(e.code)
  private blur = () => this.keys.clear()

  private event(code: string) {
    if (code === 'KeyQ') this.push({ indicate: 'left' })
    else if (code === 'KeyE') this.push({ indicate: 'right' })
    else if (code === 'KeyX') this.push({ mirror: true })
    else if (code === 'KeyZ') this.push({ look: 'left' })
    else if (code === 'KeyC') this.push({ look: 'right' })
    else if (code === 'KeyV') this.onCamera?.()
    else if (code === 'Escape' || code === 'KeyP') this.onPause?.()
  }

  push(p: Pending) {
    if (this.queue.length < 6) this.queue.push(p)
  }

  attach() {
    window.addEventListener('keydown', this.down)
    window.addEventListener('keyup', this.up)
    window.addEventListener('blur', this.blur)
  }

  detach() {
    window.removeEventListener('keydown', this.down)
    window.removeEventListener('keyup', this.up)
    window.removeEventListener('blur', this.blur)
  }

  private pad(input: DriveInput) {
    const pad = typeof navigator !== 'undefined' && navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : undefined
    if (!pad) return
    const b = (i: number) => pad.buttons[i]
    const rt = b(7)?.value ?? 0
    const lt = b(6)?.value ?? 0
    const x = pad.axes[0] ?? 0
    const rx = pad.axes[2] ?? 0
    if (rt > 0.05 || lt > 0.05 || Math.abs(x) > 0.15) this.usedPad = true
    input.throttle = Math.max(input.throttle, rt)
    input.brake = Math.max(input.brake, lt)
    if (Math.abs(x) > 0.12) input.steer = -x
    const edge = (key: keyof DriveInputs['padHeld'], now: boolean, p: Pending) => {
      if (now && !this.padHeld[key]) this.push(p)
      this.padHeld[key] = now
    }
    edge('left', !!b(4)?.pressed, { indicate: 'left' })
    edge('right', !!b(5)?.pressed, { indicate: 'right' })
    edge('mirror', !!b(3)?.pressed, { mirror: true })
    edge('lookL', rx < -0.6, { look: 'left' })
    edge('lookR', rx > 0.6, { look: 'right' })
  }

  read(): DriveInput {
    const k = this.keys
    const input: DriveInput = {
      throttle: k.has('KeyW') || k.has('ArrowUp') ? 1 : this.touch.throttle,
      brake: k.has('KeyS') || k.has('ArrowDown') || k.has('Space') ? 1 : this.touch.brake,
      steer: (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) - (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) || this.touch.steer,
    }
    this.pad(input)
    const next = this.queue.shift()
    if (next) Object.assign(input, next)
    return input
  }
}

export function useDriveInputs() {
  const ref = useRef<DriveInputs | null>(null)
  if (!ref.current) ref.current = new DriveInputs()
  useEffect(() => {
    const i = ref.current!
    i.attach()
    return () => i.detach()
  }, [])
  return ref.current
}
