// Beta invite tokens. Mirrors backend app/routers/beta_program.py (FNV-1a 32-bit of the lower-cased email).
export function emailToken(email = '') {
  let h = 0x811c9dc5
  const bytes = new TextEncoder().encode(String(email).trim().toLowerCase())
  for (const b of bytes) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `beta_e${h.toString(16).padStart(8, '0')}`
}

export function reservationToken(id = '') {
  return `beta_${String(id).replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`
}

/** Next semantic version: 'major' | 'minor' | 'patch'. */
export function bumpVersion(v = 'v0.0.0', part = 'patch') {
  const m = String(v).match(/(\d+)\.(\d+)\.(\d+)/)
  let [maj, min, pat] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0]
  if (part === 'major') { maj += 1; min = 0; pat = 0 } else if (part === 'minor') { min += 1; pat = 0 } else { pat += 1 }
  return `v${maj}.${min}.${pat}`
}
