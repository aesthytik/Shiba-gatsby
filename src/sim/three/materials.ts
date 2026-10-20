import * as THREE from 'three'
import { signSvg, type SignId } from '../../components/signs/signs'

// Shared geometry and material caches. Scenes create hundreds of similar meshes, so sharing
// these keeps GPU memory and draw setup low.

const matCache = new Map<string, THREE.MeshStandardMaterial>()

export function mat(color: string, opts: { rough?: number; metal?: number; emissive?: string; emissiveIntensity?: number; flat?: boolean } = {}) {
  const key = `${color}|${opts.rough ?? 0.8}|${opts.metal ?? 0}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? 0}|${opts.flat ?? false}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.8,
      metalness: opts.metal ?? 0,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      flatShading: opts.flat ?? false,
    })
    matCache.set(key, m)
  }
  return m
}

const geoCache = new Map<string, THREE.BufferGeometry>()

function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key) as T | undefined
  if (!g) {
    g = make()
    geoCache.set(key, g)
  }
  return g
}

export const geo = {
  box: () => cached('box', () => new THREE.BoxGeometry(1, 1, 1)),
  sphere: () => cached('sphere', () => new THREE.SphereGeometry(1, 16, 12)),
  cyl: () => cached('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 14)),
  wheel: () => cached('wheel', () => new THREE.CylinderGeometry(1, 1, 1, 18).rotateZ(Math.PI / 2)),
  cone: () => cached('cone', () => new THREE.ConeGeometry(1, 1, 8)),
  ico: () => cached('ico', () => new THREE.IcosahedronGeometry(1, 0)),
  plane: () => cached('plane', () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)),
  /** Triangular prism for roofs: ridge along X, 1 wide, 1 tall, 1 deep. */
  roof: () =>
    cached('roof', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.5, 0)
      shape.lineTo(0.5, 0)
      shape.lineTo(0, 1)
      shape.closePath()
      const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false })
      g.translate(0, 0, -0.5)
      g.rotateY(Math.PI / 2)
      return g
    }),
  torus: () => cached('torus', () => new THREE.TorusGeometry(1, 0.08, 8, 40).rotateX(Math.PI / 2)),
}

const signTextures = new Map<string, THREE.Texture>()

/** Road sign texture rendered from the same SVG used in the UI. */
export function signTexture(id: SignId) {
  let tex = signTextures.get(id)
  if (tex) return tex
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  const img = new Image()
  img.onload = () => {
    canvas.getContext('2d')!.drawImage(img, 0, 0, 256, 256)
    t.needsUpdate = true
  }
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(signSvg(id, 256))}`
  signTextures.set(id, t)
  tex = t
  return tex
}

const signMats = new Map<string, THREE.MeshBasicMaterial>()
export function signMaterial(id: SignId) {
  let m = signMats.get(id)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: signTexture(id), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, toneMapped: false })
    signMats.set(id, m)
  }
  return m
}
