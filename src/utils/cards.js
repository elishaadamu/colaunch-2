// Card helpers for simulated payments: the full number never leaves the browser (only brand + last 4).
export const digits = (v) => String(v || '').replace(/\D/g, '')
export const brandOf = (n) => /^4/.test(n) ? 'visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'mastercard' : /^3[47]/.test(n) ? 'amex' : /^6(011|5)/.test(n) ? 'discover' : /^(506[01]|507[89]|6500)/.test(n) ? 'verve' : 'card'
export const luhn = (n) => { let sum = 0; for (let i = 0; i < n.length; i += 1) { let d = +n[n.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9 } sum += d } return n.length >= 12 && sum % 10 === 0 }
export const fmtCard = (v) => { const n = digits(v).slice(0, 19); return brandOf(n) === 'amex' ? [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ') : n.replace(/(\d{4})(?=\d)/g, '$1 ') }
export const fmtExp = (v) => { const n = digits(v).slice(0, 4); return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n }
export const expOk = (v) => { const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m) return false; const mo = +m[1], yr = 2000 + +m[2]; if (mo < 1 || mo > 12) return false; const now = new Date(); return yr > now.getFullYear() || (yr === now.getFullYear() && mo >= now.getMonth() + 1) }
export function cardProblem({ card, exp, cvc }) {
  const n = digits(card); const len = brandOf(n) === 'amex' ? 4 : 3
  return !luhn(n) ? 'Check the card number.' : !expOk(exp) ? 'Check the expiry date (MM/YY, not in the past).' : digits(cvc).length !== len ? `The security code is ${len} digits.` : ''
}
