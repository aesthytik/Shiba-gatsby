import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'

export type AtmospherePreset = 'sunny' | 'overcast' | 'dusk' | 'rain'

const PRESETS: Record<
  AtmospherePreset,
  { bg: string; fog: [number, number]; hemi: [string, string, number]; sun: number; sunColor: string; sky?: [number, number, number]; shadows: boolean }
> = {
  sunny: { bg: '#a9cbe8', fog: [80, 330], hemi: ['#dbeeff', '#6b7b55', 1.6], sun: 2.4, sunColor: '#fff4e0', sky: [60, 45, -80], shadows: true },
  overcast: { bg: '#b4bcc4', fog: [40, 260], hemi: ['#d9dee3', '#5a5f55', 1.5], sun: 0.7, sunColor: '#e9edf1', shadows: false },
  dusk: { bg: '#5a4e66', fog: [30, 230], hemi: ['#b3a8c8', '#4a4648', 1.7], sun: 0.9, sunColor: '#ffb27a', sky: [100, 2, -100], shadows: false },
  rain: { bg: '#8c969f', fog: [20, 180], hemi: ['#c9d0d6', '#5a5f5a', 2.0], sun: 0.5, sunColor: '#e0e6ea', shadows: false },
}

/** Sky, fog and lights. The sun's shadow camera follows `follow` so shadows stay sharp near the camera car. */
export function Atmosphere({ preset, follow }: { preset: AtmospherePreset; follow: { current: THREE.Vector3 } }) {
  const p = PRESETS[preset]
  const sun = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const f = follow.current
    if (sun.current) {
      sun.current.position.set(f.x + 40, 60, f.z + 25)
      target.position.set(f.x, 0, f.z - 25)
      target.updateMatrixWorld()
    }
  })

  return (
    <>
      <color attach="background" args={[p.bg]} />
      <fog attach="fog" args={[p.bg, p.fog[0], p.fog[1]]} />
      {p.sky && <Sky distance={4500} sunPosition={p.sky} turbidity={preset === 'dusk' ? 10 : 6} rayleigh={preset === 'dusk' ? 3 : 1.2} mieCoefficient={0.006} mieDirectionalG={0.85} />}
      <hemisphereLight args={[p.hemi[0], p.hemi[1], p.hemi[2]]} />
      <primitive object={target} />
      <directionalLight
        ref={sun}
        intensity={p.sun}
        color={p.sunColor}
        target={target}
        castShadow={p.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
      />
      {preset === 'rain' && <Rain follow={follow} />}
    </>
  )
}

function Rain({ follow, count = 1600 }: { follow: { current: THREE.Vector3 }; count?: number }) {
  const ref = useRef<THREE.LineSegments>(null)
  const { geometry, offsets } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 6)
    const off = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      off[i * 3] = (Math.random() - 0.5) * 40
      off[i * 3 + 1] = Math.random() * 14
      off[i * 3 + 2] = -Math.random() * 45 + 6
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geometry: g, offsets: off }
  }, [count])

  useFrame((_, dt) => {
    const f = follow.current
    const pos = geometry.attributes.position.array as Float32Array
    const fall = Math.min(dt, 0.05) * 16
    for (let i = 0; i < count; i++) {
      let y = offsets[i * 3 + 1] - fall
      if (y < 0) y += 14
      offsets[i * 3 + 1] = y
      const x = f.x + offsets[i * 3]
      const z = f.z + offsets[i * 3 + 2]
      pos.set([x, y, z, x + 0.02, y + 0.55, z + 0.08], i * 6)
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeBoundingSphere()
  })

  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color="#d6e2ec" transparent opacity={0.45} />
    </lineSegments>
  )
}
