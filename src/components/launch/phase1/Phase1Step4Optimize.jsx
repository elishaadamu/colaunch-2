import React, { useEffect, useMemo, useState } from 'react'
import {
  Swords, Trophy, Zap, Radar, Magnet, CreditCard, MessageSquare, Flame, Lock, Undo2, Sparkles, Loader2,
  Target, Megaphone, Timer, Vote, Tag, Type, Crown, Plus, ArrowRight, Check, History, Medal, Star, Info,
} from 'lucide-react'
import { updateCoLaunchProject } from '../../../services/opsApi'
import { C, P1_SHARED_CSS } from './phase1Constants'
import StepRail from './StepRail'
import {
  channelStats, suggestPrice, computeXp, rankFor, grade, MOVE_COOLDOWN_HOURS, CHANNELS,
} from '../../../utils/launchMoves'

const S4_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
.s4 .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.s4 .card{background:${C.row};border:1px solid ${C.line}}
.s4 .well{background:${C.sheet};border:1px solid ${C.line}}
.s4 .eyebrow{font-size:.6875rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.faint}}
.s4 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;font-size:.8125rem;font-weight:600;cursor:pointer;border:1px solid transparent;padding:.55rem .9rem;transition:filter .15s,border-color .15s,color .15s,transform .1s}
.s4 .btn:active:not(:disabled){transform:translateY(1px)}
.s4 .btn:disabled{opacity:.45;cursor:not-allowed}
.s4 .btn-primary{background:${C.crimson};color:#fff}
.s4 .btn-primary:hover:not(:disabled){filter:brightness(1.1)}
.s4 .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.s4 .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.s4 .in{width:100%;background:${C.sheet};border:1px solid ${C.line};color:${C.text};padding:.5rem .7rem;font-size:.875rem;outline:none}
.s4 .in:focus{border-color:${C.crimsonLine}}
.s4 .chip{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .5rem;font-size:.6875rem;font-weight:600;border:1px solid ${C.line};color:${C.muted};background:${C.sheet}}
.s4 :focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
.s4 .movecard{transition:transform .18s,border-color .18s,box-shadow .18s}
.s4 .movecard:hover{transform:translateY(-2px);border-color:${C.lineStrong}}
@keyframes s4pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}
@keyframes s4glow{0%,100%{box-shadow:0 0 0 0 rgba(200,30,60,.0)}50%{box-shadow:0 0 0 4px rgba(200,30,60,.18)}}
@keyframes s4float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes s4fill{from{width:0}}
.s4 .pop{animation:s4pop .5s cubic-bezier(.16,1,.3,1) both}
.s4 .glow{animation:s4glow 2.4s ease-in-out infinite}
.s4 .float{animation:s4float 3s ease-in-out infinite}
.s4 .fill{animation:s4fill 1s cubic-bezier(.16,1,.3,1) both}
@media (prefers-reduced-motion:reduce){.s4 *{animation:none!important;transition:none!important}}
`

const RARITY = {
  common: { label: 'Common', color: C.muted },
  rare: { label: 'Rare', color: '#7dd3fc' },
  epic: { label: 'Epic', color: C.violetText },
  legendary: { label: 'Legendary', color: C.warn },
}

const fmt$ = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`
const hoursSince = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 36e5 : Infinity)

export default function Phase1Step4Optimize(props) {
  const {
    project, reservations = [], presalesRevenue, presaleTarget, totalTraffic, totalSignups, surveyResponses = [],
    campaignKit, experimentsData, isAnalyzingExperiments, handleRunExperimentsAI, handleApplyExperimentVariant,
    handleRevertExperiment, handleAddSimulatedReservation, showNotification, setActiveStep, onSelectStep, onUpdateProject,
    plan, surveyData, activeFoundingPrice = 49, activeDepositPrice = 10, optimizationMoves = [], handlePlayMove, handleUndoMove,
  } = props

  // ── Real numbers ────────────────────────────────────────────────────────────────────────
  const visitors = Number(totalTraffic) || 0
  const signups = Number(totalSignups) || 0
  const backers = reservations.length
  const revenue = Number(presalesRevenue) || 0
  const goalRevenue = Number(presaleTarget) || 0
  const goalBackers = Math.max(1, Math.ceil(goalRevenue / Math.max(1, activeFoundingPrice)))
  const schedule = campaignKit?.postingSchedule || []
  const postsDone = schedule.filter((t) => t.done).length
  const postsSent = schedule.filter((t) => t.emailed).length
  const surveyCount = surveyResponses.length
  const supporters = surveyResponses.filter((r) => r?.support?.decision === 'yes').length
  const pricePoints = surveyResponses.reduce((acc, r) => {
    const pp = r?.support?.pricePoint
    if (pp) acc[pp] = (acc[pp] || 0) + 1
    return acc
  }, {})
  const conversion = visitors > 0 ? backers / visitors : 0
  const signupRate = visitors > 0 ? (signups + supporters) / visitors : 0
  const channels = useMemo(() => channelStats(project || {}, reservations), [project, reservations])
  const topChannel = channels.find((c) => c.visits > 0 || c.backers > 0) || null
  const activeMoves = optimizationMoves.filter((m) => !m.undoneAt)
  const lastPlayed = (type) => activeMoves.find((m) => m.type === type)?.playedAt
  const landingCopy = campaignKit?.landingPageCopy || {}
  const currentHeadline = landingCopy.headline || project?.selectedConcept?.tagline || project?.productTagline || ''

  // ── XP, rank, boss ──────────────────────────────────────────────────────────────────────
  const xp = computeXp({ visitors, signups, surveyCount, supporters, backers, postsDone: Math.max(postsDone, postsSent), movesPlayed: activeMoves.length })
  const rank = rankFor(xp.total)
  const bossHp = Math.max(0, goalBackers - backers)
  const bossPct = bossHp / goalBackers
  const bossDown = bossHp === 0 || (goalRevenue > 0 && revenue >= goalRevenue)

  // Rank-up celebration (once per new rank, per project)
  const [rankUp, setRankUp] = useState(null)
  useEffect(() => {
    if (!project?.id) return
    const key = `s4_rank_${project.id}`
    let saved = 0
    try { saved = Number(localStorage.getItem(key)) || 0 } catch (_) {}
    if (saved && rank.level > saved) setRankUp(rank)
    try { localStorage.setItem(key, String(Math.max(saved, rank.level))) } catch (_) {}
  }, [project?.id, rank.level]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stat meters ─────────────────────────────────────────────────────────────────────────
  const visitorsNeeded = Math.max(20, goalBackers * 25) // ~4% conversion
  const stats = [
    { key: 'reach', emoji: '📡', Icon: Radar, name: 'Reach', value: `${visitors}`, sub: `of ~${visitorsNeeded} visitors`, ratio: visitors / visitorsNeeded },
    { key: 'hook', emoji: '🪝', Icon: Magnet, name: 'Hook', value: visitors ? `${(signupRate * 100).toFixed(1)}%` : '—', sub: 'sign up or pledge', ratio: signupRate / 0.15 },
    { key: 'convert', emoji: '💳', Icon: CreditCard, name: 'Convert', value: visitors ? `${(conversion * 100).toFixed(1)}%` : '—', sub: 'visitors who pre-order', ratio: conversion / 0.04 },
    { key: 'voice', emoji: '🗣️', Icon: MessageSquare, name: 'Voice', value: `${surveyCount}`, sub: `survey answers · ${supporters} 🤝`, ratio: surveyCount / 15 },
    { key: 'momentum', emoji: '⚡', Icon: Flame, name: 'Momentum', value: schedule.length ? `${Math.max(postsDone, postsSent)}/${schedule.length}` : '—', sub: 'posts out', ratio: schedule.length ? Math.max(postsDone, postsSent) / schedule.length : 0 },
  ]
  const weakest = [...stats].sort((a, b) => a.ratio - b.ratio)[0]

  // ── Move deck (each card changes an earlier step) ──────────────────────────────────────
  const priceSuggestion = suggestPrice({ founding: activeFoundingPrice, visitors, backers, pricePoints })
  const [priceDraft, setPriceDraft] = useState(priceSuggestion.price)
  useEffect(() => setPriceDraft(priceSuggestion.price), [priceSuggestion.price])
  const aiHeadlines = (experimentsData?.experiments || []).filter((e) => e.category === 'landing_page' || e.targetField === 'landingPageHero' || e.category === 'messaging').map((e) => e.variant).filter((v) => v && v.length < 120)
  const [headlineDraft, setHeadlineDraft] = useState('')
  useEffect(() => { if (!headlineDraft) setHeadlineDraft(aiHeadlines[0] || '') }, [aiHeadlines.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const [questionDraft, setQuestionDraft] = useState('')
  const [targetDraft, setTargetDraft] = useState(() => Math.round((revenue || goalRevenue) * 1.5) || 5000)
  const spotsLeft = Math.max(1, Math.min(bossHp || goalBackers, 50))

  const defaultQuestion = backers === 0 && visitors > 0
    ? 'What stopped you from pre-ordering today?'
    : surveyCount < 3 ? `What would make ${project?.productName || 'this'} a must-have for you?` : 'Which feature would you use first?'

  const moves = [
    {
      type: 'headline', emoji: '🎯', Icon: Type, title: 'Sharpen the hook', rarity: 'rare', xp: 30,
      why: visitors >= 10 && conversion < 0.02 ? `${visitors} people saw the page, ${backers} pre-ordered. The headline isn't landing.` : 'The first line decides whether visitors keep reading.',
      changes: 'Live page headline (and CTA)',
      affects: ['Step 2 · Landing page', 'Live page'],
      score: visitors >= 10 && conversion < 0.02 ? 90 : 40,
      ready: Boolean(headlineDraft.trim()),
      body: (
        <div className="space-y-2">
          <p className="m-0 text-[11px]" style={{ color: C.faint }}>Now: “{currentHeadline || 'concept tagline'}”</p>
          {aiHeadlines.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {aiHeadlines.slice(0, 3).map((h) => (
                <button key={h} type="button" className="chip cursor-pointer" style={headlineDraft === h ? { borderColor: C.crimsonLine, color: C.text } : undefined} onClick={() => setHeadlineDraft(h)}>🤖 {h.slice(0, 40)}{h.length > 40 ? '…' : ''}</button>
              ))}
            </div>
          )}
          <input className="in" value={headlineDraft} onChange={(e) => setHeadlineDraft(e.target.value)} placeholder="New headline for the live page" />
        </div>
      ),
      payload: () => ({ headline: headlineDraft.trim() }),
    },
    {
      type: 'price', emoji: '💸', Icon: Tag, title: 'Price lab', rarity: 'epic', xp: 40,
      why: priceSuggestion.reason,
      changes: `Founding ${fmt$(activeFoundingPrice)} → ${fmt$(priceDraft)}`,
      affects: ['Step 1 · Plan', 'Step 2 · Checkout', 'Step 3 · Every draft', 'Live page'],
      score: (visitors >= 20 && conversion < 0.01) || Object.keys(pricePoints).length >= 3 ? 85 : 30,
      ready: Number(priceDraft) > 0 && Number(priceDraft) !== Number(activeFoundingPrice),
      body: (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: C.muted }}>$</span>
          <input className="in" type="number" min={5} value={priceDraft} onChange={(e) => setPriceDraft(Number(e.target.value))} aria-label="New founding price" />
          <span className="text-xs whitespace-nowrap" style={{ color: C.faint }}>deposit {fmt$(Math.max(5, Math.round(priceDraft * 0.2)))}</span>
        </div>
      ),
      payload: () => ({ founding: Math.round(Number(priceDraft)), deposit: Math.max(5, Math.round(priceDraft * 0.2)) }),
    },
    {
      type: 'double_down', emoji: '📣', Icon: Megaphone, title: topChannel ? `Double down on ${topChannel.label}` : 'Bonus post', rarity: 'common', xp: 25,
      why: topChannel ? `${topChannel.emoji} ${topChannel.label} brought ${topChannel.visits} visits and ${topChannel.backers} pre-orders, your best channel.` : 'No channel data yet. An extra X post is the fastest way to get some.',
      changes: 'Adds a bonus post as the very next one',
      affects: ['Step 3 · Schedule', 'Next daily email', 'Step 3 · AI brief'],
      score: visitors < 20 ? 95 : 50,
      ready: schedule.length > 0,
      lockedReason: schedule.length ? null : 'Generate the campaign in Step 3 first',
      payload: () => ({ channelKey: topChannel?.key || 'x' }),
    },
    {
      type: 'urgency', emoji: '⏳', Icon: Timer, title: 'Scarcity timer', rarity: 'rare', xp: 30,
      why: `${bossHp || goalBackers} founding seats left. A clear deadline turns "later" into "now".`,
      changes: `Banner: “Only ${spotsLeft} founding spots left”`,
      affects: ['Live page', 'Step 2 · Landing page'],
      score: visitors >= 20 && backers > 0 ? 75 : 35,
      ready: true,
      payload: () => ({ spotsLeft }),
      active: Boolean(landingCopy.urgency?.text),
    },
    {
      type: 'survey_question', emoji: '🗳️', Icon: Vote, title: 'Ask the crowd', rarity: 'common', xp: 20,
      why: backers === 0 && visitors > 0 ? 'Visitors are leaving without buying. Ask them why.' : `${surveyCount} survey answers so far. One sharp question finds the real objection.`,
      changes: 'Adds a question to the public survey',
      affects: ['Step 2 · Survey', 'Public survey page'],
      score: surveyCount < 3 ? 70 : 30,
      ready: Boolean((questionDraft || defaultQuestion).trim()),
      body: <input className="in" value={questionDraft} onChange={(e) => setQuestionDraft(e.target.value)} placeholder={defaultQuestion} />,
      payload: () => ({ question: (questionDraft || defaultQuestion).trim(), category: backers === 0 ? 'Objection' : 'Feature Wishlist' }),
    },
    {
      type: 'target', emoji: '🏔️', Icon: Target, title: bossDown ? 'Raise the bar' : 'Recalibrate the goal', rarity: 'legendary', xp: 50,
      why: bossDown ? `Goal smashed (${fmt$(revenue)}). Set a bigger one before the gate.` : 'Only change the goal when the data says the original was wrong.',
      changes: `Goal ${fmt$(goalRevenue)} → ${fmt$(targetDraft)}`,
      affects: ['Step 1 · Validation goal', 'Step 5 · Gate'],
      score: bossDown ? 100 : 5,
      ready: Number(targetDraft) > 0 && Number(targetDraft) !== goalRevenue,
      body: (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: C.muted }}>$</span>
          <input className="in" type="number" min={100} step={100} value={targetDraft} onChange={(e) => setTargetDraft(Number(e.target.value))} aria-label="New goal" />
        </div>
      ),
      payload: () => ({ amount: Number(targetDraft) }),
    },
  ].map((m) => {
    const hrs = hoursSince(lastPlayed(m.type))
    const cooling = hrs < MOVE_COOLDOWN_HOURS
    return { ...m, cooling, cooldownLeft: cooling ? Math.ceil(MOVE_COOLDOWN_HOURS - hrs) : 0 }
  })
  const best = [...moves].filter((m) => !m.cooling && !m.lockedReason).sort((a, b) => b.score - a.score)[0]

  const play = (m) => {
    if (!handlePlayMove || m.cooling || m.lockedReason || !m.ready) return
    handlePlayMove({ type: m.type, title: m.title, emoji: m.emoji, xp: m.xp, payload: m.payload() })
    if (m.type === 'survey_question') setQuestionDraft('')
  }

  // ── Achievements (all from real data) ───────────────────────────────────────────────────
  const achievements = [
    { emoji: '👀', name: 'First eyes', desc: 'First visitor', on: visitors > 0 },
    { emoji: '🗣️', name: 'Heard', desc: 'First survey answer', on: surveyCount > 0 },
    { emoji: '🤝', name: 'Believer', desc: 'First "yes, I\'ll support"', on: supporters > 0 },
    { emoji: '💳', name: 'First blood', desc: 'First pre-order', on: backers > 0 },
    { emoji: '🃏', name: 'Strategist', desc: 'Play 3 moves', on: activeMoves.length >= 3 },
    { emoji: '📬', name: 'Full send', desc: 'Every post sent', on: schedule.length > 0 && schedule.every((t) => t.emailed || t.done) },
    { emoji: '🔟', name: 'Ten strong', desc: '10 pre-orders', on: backers >= 10 },
    { emoji: '🏆', name: 'Wall breaker', desc: 'Hit the goal', on: bossDown },
  ]

  const aiCards = experimentsData?.experiments || project?.experiments || []
  const showSimTools = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('simulate') === '1'
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="s4 p1-themed p1-rise p-5 sm:p-6 space-y-6" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
      <style>{P1_SHARED_CSS + S4_CSS}</style>
      <StepRail current="optimize" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="min-w-0">
          <p className="eyebrow m-0">Step 4 · Run & optimise</p>
          <h3 className="serif m-0 mt-1 text-3xl sm:text-4xl leading-tight" style={{ color: C.text }}>Launch Arena 🎮</h3>
          <p className="m-0 mt-2 text-sm max-w-2xl" style={{ color: C.muted }}>
            Your real numbers are the score. Every move you play rewrites an earlier step: the live page, your prices, the creator's posts or the survey. Undo any move at any time.
          </p>
        </div>
        <button type="button" className="btn btn-quiet shrink-0" onClick={handleRunExperimentsAI} disabled={isAnalyzingExperiments}>
          {isAnalyzingExperiments ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}🤖 Scout with AI
        </button>
      </div>

      {rankUp && (
        <div role="status" className="pop flex items-center justify-between gap-3 px-4 py-3" style={{ background: C.okSoft, border: `1px solid ${C.okLine}` }}>
          <span className="text-sm font-semibold" style={{ color: C.text }}>🎉 Rank up! You're now {rankUp.emoji} {rankUp.name}.</span>
          <button type="button" className="text-xs cursor-pointer" style={{ color: C.muted }} onClick={() => setRankUp(null)}>Dismiss</button>
        </div>
      )}

      {/* Player + Boss */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <span className="float w-16 h-16 flex items-center justify-center text-4xl shrink-0" style={{ background: C.sheet, border: `1px solid ${C.lineStrong}` }} aria-hidden="true">{rank.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="eyebrow m-0 flex items-center gap-1.5"><Trophy className="w-3 h-3" />Rank {rank.level} of 6</p>
              <p className="serif m-0 text-3xl leading-none mt-1" style={{ color: C.text }}>{rank.name}</p>
              <p className="m-0 mt-1 text-sm" style={{ color: C.muted }}><strong style={{ color: C.text }}>{xp.total.toLocaleString()} XP</strong>{rank.next ? ` · ${(rank.next.min - xp.total).toLocaleString()} to ${rank.next.emoji} ${rank.next.name}` : ' · max rank'}</p>
            </div>
          </div>
          <div className="h-2.5 w-full" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
            <div className="fill h-full" style={{ width: `${rank.progress * 100}%`, background: `linear-gradient(90deg, ${C.crimson}, ${C.warn})` }} />
          </div>
          <details>
            <summary className="text-xs cursor-pointer flex items-center gap-1.5" style={{ color: C.muted }}><Info className="w-3 h-3" />How XP is earned (real activity only)</summary>
            <ul className="list-none m-0 mt-2 p-0 grid grid-cols-2 gap-1.5">
              {xp.parts.map((p) => (
                <li key={p.label} className="well px-2.5 py-1.5 flex items-center justify-between text-xs">
                  <span style={{ color: C.body }}>{p.label}</span>
                  <span style={{ color: C.faint }}>{p.n} × {p.per} = <strong style={{ color: C.text }}>{p.xp}</strong></span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="p-5 space-y-4" style={{ background: bossDown ? `linear-gradient(160deg, ${C.okSoft}, transparent 60%), ${C.row}` : `linear-gradient(160deg, rgba(200,30,60,.16), transparent 60%), ${C.row}`, border: `1px solid ${bossDown ? C.okLine : C.crimsonLine}` }}>
          <div className="flex items-center gap-4">
            <span className={`${bossDown ? 'pop' : 'float'} w-16 h-16 flex items-center justify-center text-4xl shrink-0`} style={{ background: C.sheet, border: `1px solid ${C.lineStrong}` }} aria-hidden="true">{bossDown ? '🏆' : '🐉'}</span>
            <div className="min-w-0 flex-1">
              <p className="eyebrow m-0 flex items-center gap-1.5"><Swords className="w-3 h-3" />Boss</p>
              <p className="serif m-0 text-3xl leading-none mt-1" style={{ color: C.text }}>{bossDown ? 'Wall broken!' : 'The Founding Wall'}</p>
              <p className="m-0 mt-1 text-sm" style={{ color: C.muted }}>
                {bossDown ? 'You hit the goal. The gate is open.' : <>Each pre-order is a hit. <strong style={{ color: C.text }}>{bossHp}</strong> of {goalBackers} seats to go.</>}
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1" style={{ color: C.faint }}><span>❤️ HP {bossHp}/{goalBackers}</span><span>💰 {fmt$(revenue)} of {fmt$(goalRevenue)}</span></div>
            <div className="h-3.5 w-full flex" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
              <div className="fill h-full" style={{ width: `${bossPct * 100}%`, background: bossDown ? C.ok : 'linear-gradient(90deg,#ff4d6d,#c81e3c)' }} />
            </div>
          </div>
          <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.body }}>
            <Zap className="w-3.5 h-3.5" style={{ color: C.warn }} />
            {bossDown ? 'Play "Raise the bar" or head to the gate.' : `Weak spot: ${weakest.emoji} ${weakest.name}. ${best ? `Best move: ${best.emoji} ${best.title}.` : ''}`}
          </p>
        </section>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {stats.map((s) => {
          const [g, col] = grade(s.ratio)
          return (
            <div key={s.key} className="card p-3.5 space-y-2" style={s.key === weakest.key ? { borderColor: C.crimsonLine } : undefined}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.body }}><span aria-hidden="true">{s.emoji}</span>{s.name}</span>
                <span className="w-6 h-6 flex items-center justify-center text-xs font-black" style={{ background: C.sheet, border: `1px solid ${col}`, color: col }}>{g}</span>
              </div>
              <p className="serif m-0 text-3xl leading-none" style={{ color: C.text }}>{s.value}</p>
              <div className="h-1.5" style={{ background: C.sheet }}><div className="fill h-full" style={{ width: `${Math.min(1, s.ratio) * 100}%`, background: col }} /></div>
              <p className="m-0 text-[11px]" style={{ color: C.faint }}>{s.sub}</p>
            </div>
          )
        })}
      </section>

      {/* Move deck */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow m-0">🃏 Your hand</p>
            <h4 className="serif m-0 mt-0.5 text-2xl" style={{ color: C.text }}>Play a move</h4>
          </div>
          <p className="m-0 text-xs" style={{ color: C.muted }}>Each card shows exactly which earlier step it changes. {MOVE_COOLDOWN_HOURS}h cooldown so results can show.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {moves.map((m) => {
            const isBest = best && best.type === m.type
            const r = RARITY[m.rarity]
            const disabled = m.cooling || !!m.lockedReason || !m.ready
            return (
              <article key={m.type} className={`movecard card p-4 flex flex-col gap-3 ${isBest ? 'glow' : ''}`} style={isBest ? { borderColor: C.crimsonLine, background: `linear-gradient(170deg, rgba(200,30,60,.12), transparent 50%), ${C.row}` } : undefined}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 flex items-center justify-center text-2xl shrink-0" style={{ background: C.sheet, border: `1px solid ${C.line}` }} aria-hidden="true">{m.emoji}</span>
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-semibold leading-tight flex items-center gap-1.5" style={{ color: C.text }}><m.Icon className="w-3.5 h-3.5 shrink-0" style={{ color: C.crimsonText }} />{m.title}</p>
                      <p className="m-0 text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{ color: r.color }}>{r.label} · +{m.xp} XP</p>
                    </div>
                  </div>
                  {isBest && <span className="chip shrink-0" style={{ borderColor: C.crimsonLine, color: C.crimsonText }}><Star className="w-3 h-3" />Best now</span>}
                  {m.active && !isBest && <span className="chip shrink-0" style={{ borderColor: C.okLine, color: C.ok }}>Live</span>}
                </div>
                <p className="m-0 text-xs leading-relaxed" style={{ color: C.body }}>{m.why}</p>
                {m.body}
                <div className="well px-2.5 py-2 text-xs" style={{ color: C.muted }}>✏️ {m.changes}</div>
                <div className="flex flex-wrap gap-1">
                  {m.affects.map((a) => <span key={a} className="chip">↩ {a}</span>)}
                </div>
                <button type="button" className="btn btn-primary mt-auto" disabled={disabled} onClick={() => play(m)}>
                  {m.lockedReason ? <><Lock className="w-3.5 h-3.5" />{m.lockedReason}</> : m.cooling ? <>⏱️ Ready in {m.cooldownLeft}h</> : <>Play card <ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      {/* AI scout cards */}
      {aiCards.length > 0 && (
        <section className="space-y-3">
          <div>
            <p className="eyebrow m-0">🤖 Scouted by AI</p>
            <h4 className="serif m-0 mt-0.5 text-2xl" style={{ color: C.text }}>Bonus cards from your numbers</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiCards.map((exp, idx) => {
              const applied = exp.status === 'applied'
              return (
                <article key={exp.id || idx} className="card p-4 space-y-2.5" style={applied ? { borderColor: C.okLine } : undefined}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: C.text }}>🧪 {exp.title || exp.name}</span>
                    {exp.expectedUplift && <span className="chip" style={{ color: C.ok, borderColor: C.okLine }}>📈 {exp.expectedUplift}</span>}
                  </div>
                  {exp.hypothesis && <p className="m-0 text-xs" style={{ color: C.muted }}>{exp.hypothesis}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="well p-2"><span className="block font-semibold" style={{ color: C.faint }}>Now</span><span style={{ color: C.body }}>{exp.control || exp.variantA || '—'}</span></div>
                    <div className="well p-2" style={{ borderColor: C.okLine }}><span className="block font-semibold" style={{ color: C.ok }}>Try</span><span style={{ color: C.text }}>{exp.variant || exp.variantB}</span></div>
                  </div>
                  <div className="flex gap-2">
                    {applied ? (
                      <button type="button" className="btn btn-quiet flex-1" onClick={() => handleRevertExperiment?.(exp)}><Undo2 className="w-3.5 h-3.5" />Undo</button>
                    ) : (
                      <button type="button" className="btn btn-primary flex-1" onClick={() => handleApplyExperimentVariant?.(exp)}>Play card <ArrowRight className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* History + achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0 flex items-center gap-1.5"><History className="w-3 h-3" />📜 Move history</p>
          {optimizationMoves.length === 0 ? (
            <p className="m-0 text-sm" style={{ color: C.faint }}>No moves yet. Play a card above. Every change it makes shows up here and can be undone.</p>
          ) : (
            <ol className="list-none m-0 p-0 space-y-2 max-h-80 overflow-y-auto pr-1">
              {optimizationMoves.map((m) => (
                <li key={m.id} className="well p-3 flex items-start gap-3" style={m.undoneAt ? { opacity: 0.5 } : undefined}>
                  <span className="text-xl leading-none mt-0.5" aria-hidden="true">{m.emoji || '🃏'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-semibold" style={{ color: C.text, textDecoration: m.undoneAt ? 'line-through' : 'none' }}>{m.title} <span className="font-normal text-xs" style={{ color: C.ok }}>+{m.xp} XP</span></p>
                    <p className="m-0 text-xs" style={{ color: C.muted }}>{m.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">{(m.affects || []).map((a) => <span key={a} className="chip">{a}</span>)}</div>
                    <p className="m-0 mt-1 text-[11px]" style={{ color: C.faint }}>{new Date(m.playedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}{m.undoneAt ? ' · undone' : ''}</p>
                  </div>
                  {!m.undoneAt && (
                    <button type="button" className="btn btn-quiet shrink-0" onClick={() => handleUndoMove?.(m)}><Undo2 className="w-3.5 h-3.5" />Undo</button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="lg:col-span-5 card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0 flex items-center gap-1.5"><Medal className="w-3 h-3" />🏅 Achievements · {achievements.filter((a) => a.on).length}/{achievements.length}</p>
          <ul className="list-none m-0 p-0 grid grid-cols-4 gap-2">
            {achievements.map((a) => (
              <li key={a.name} title={`${a.name}: ${a.desc}`} className="well p-2 text-center" style={a.on ? { borderColor: C.okLine } : { opacity: 0.45 }}>
                <span className={`block text-2xl ${a.on ? 'pop' : ''}`} style={a.on ? undefined : { filter: 'grayscale(1)' }} aria-hidden="true">{a.on ? a.emoji : '🔒'}</span>
                <span className="block mt-1 text-[10px] font-semibold leading-tight" style={{ color: a.on ? C.text : C.faint }}>{a.name}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Channel leaderboard + pre-orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-5 card p-4 sm:p-5 space-y-3">
          <p className="eyebrow m-0">🏁 Channel leaderboard</p>
          <ol className="list-none m-0 p-0 space-y-1.5">
            {channels.map((c, i) => {
              const maxV = Math.max(1, ...channels.map((x) => x.visits))
              return (
                <li key={c.key} className="well p-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 min-w-0" style={{ color: C.text }}>
                      <span className="w-5 text-center" aria-hidden="true">{(c.visits || c.backers) && i < 3 ? medals[i] : '·'}</span>
                      <span aria-hidden="true">{c.emoji}</span><span className="truncate">{c.label}</span>
                    </span>
                    <span className="text-xs shrink-0" style={{ color: C.muted }}>{c.visits} visits · <strong style={{ color: C.ok }}>{c.backers}</strong> 💳</span>
                  </div>
                  <div className="h-1 mt-1.5" style={{ background: C.row }}><div className="fill h-full" style={{ width: `${(c.visits / maxV) * 100}%`, background: C.crimson }} /></div>
                </li>
              )
            })}
          </ol>
          <p className="m-0 text-[11px]" style={{ color: C.faint }}>From the ?ref= tag on each Step 3 tracking link.</p>
        </section>

        <section className="lg:col-span-7 card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow m-0">💳 Hits on the wall · {backers}</p>
            {showSimTools && handleAddSimulatedReservation && (
              <button type="button" className="btn btn-quiet" onClick={handleAddSimulatedReservation}><Plus className="w-3 h-3" />Test pre-order</button>
            )}
          </div>
          {reservations.length === 0 ? (
            <p className="well m-0 p-6 text-center text-sm" style={{ color: C.faint }}>No pre-orders yet. The first one lands the first hit. 🗡️</p>
          ) : (
            <ul className="list-none m-0 p-0 space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {reservations.map((r, idx) => (
                <li key={r.id || idx} className="well p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span aria-hidden="true">{idx === reservations.length - 1 ? '🩸' : '⚔️'}</span>
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-semibold truncate" style={{ color: C.text }}>{r.customerName || r.name || 'Pre-order'}</p>
                      <p className="m-0 text-[11px] truncate" style={{ color: C.faint }}>{[r.tier || r.passType, r.channel && CHANNELS[r.channel] ? CHANNELS[r.channel].label : r.channel, r.date].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: C.ok }}>{Number(r.amount) > 0 ? fmt$(r.amount) : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Next */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <p className="m-0 text-xs flex items-center gap-1.5" style={{ color: C.muted }}>
          {bossDown ? <><Crown className="w-3.5 h-3.5" style={{ color: C.warn }} />Goal reached. Take it to the gate.</> : <><Check className="w-3.5 h-3.5" />You can go to the gate at any time; it decides with these numbers.</>}
        </p>
        <button
          type="button"
          className="btn btn-primary px-5 py-2.5"
          onClick={() => {
            const updated = { step4Done: true, phase1Step4Done: true, validationOptimized: true, telemetryReviewed: true }
            onUpdateProject?.((prev) => ({ ...(prev || {}), ...updated }))
            if (project?.id) updateCoLaunchProject(project.id, updated).catch((e) => console.warn(e))
            showNotification?.('Numbers locked in. On to the gate.')
            setActiveStep('gate')
            onSelectStep?.('gate')
          }}
        >
          🚪 Go to the gate <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
