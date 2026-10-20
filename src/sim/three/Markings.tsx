import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { geo } from './materials'

/** [x, z, width, length, rotationY] in three.js coordinates. */
export type MarkingItem = [number, number, number, number, number?]

/** Instanced flat road markings (dashes, stripes, lines) drawn just above the road surface. */
export function Markings({ items, color = '#f2f2f2', y = 0.02 }: { items: MarkingItem[]; color?: string; y?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    items.forEach(([x, z, w, l, r = 0], i) => {
      o.position.set(x, y, z)
      o.rotation.set(0, r, 0)
      o.scale.set(w, 1, l)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [items, y])
  if (!items.length) return null
  return (
    <instancedMesh ref={ref} args={[geo.plane(), undefined, items.length]} receiveShadow frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={0.7} polygonOffset polygonOffsetFactor={-2} />
    </instancedMesh>
  )
}
