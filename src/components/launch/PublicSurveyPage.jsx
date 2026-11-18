import { useState, useEffect } from 'react'
import {
  Sparkles, CheckCircle2, MessageSquare, Send, Star,
  HelpCircle, ArrowRight, ShieldCheck, Heart, Loader2
} from 'lucide-react'
import { getProjectBySlug, getCoLaunchProjects, recordSurveyResponseUniversal } from '../../services/opsApi'
import { trackVisit } from '../../services/tracker'
import { updatePageSEO } from '../../utils/seo'

export default function PublicSurveyPage({ slug }) {
  const [project, setProject] = useState(null)
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [answers, setAnswers] = useState({})
  const [intentRating, setIntentRating] = useState(8)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchProject = async () => {
      try {
        let fetched = null
        if (slug) {
          try {
            fetched = await getProjectBySlug(slug)
          } catch (e) {}
        }
        if (!fetched) {
          const all = await getCoLaunchProjects()
          const list = Array.isArray(all) ? all : all?.projects || []
          if (slug) {
            const clean = slug.toLowerCase().trim()
            fetched = list.find(p =>
              (p.slug && p.slug.toLowerCase() === clean) ||
              (p.productName && p.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean) ||
              (p.id === clean)
            )
          }
          if (!fetched && list.length > 0) {
            fetched = list[0]
          }
        }
        if (isMounted && fetched) {
          setProject(fetched)
        }
      } catch (err) {
        console.warn('[PublicSurveyPage] Project fetch notice:', err)
      }
    }

    fetchProject()
    trackVisit(`/survey/${slug || 'product'}`, updated => {
      if (isMounted && updated) setProject(prev => ({ ...(prev || {}), ...updated }))
    })

    return () => {
      isMounted = false
    }
  }, [slug])

  useEffect(() => {
    updatePageSEO({
      title: project?.productName ? `Audience Survey — ${project.productName} | CoLaunch` : "Audience Discovery & Research Survey | CoLaunch",
      description: "Help shape our next software product! Share your biggest workflow challenges in 60 seconds.",
      image: "/og-image.svg"
    });
  }, [project?.productName]);

  const productName = project?.productName || 'Software Product'
  const creatorName = project?.creatorName || 'Creator'
  const niche = project?.niche || 'Software Workflows'
  const brandColor = project?.brandColor || project?.brand_color || '#c81e3c'
  
  const rawQuestions = project?.surveyData?.questions ||
    project?.validationCampaign?.researchSurvey?.questions ||
    project?.validationCampaign?.research_survey?.questions ||
    project?.discoverySurvey?.questions

  const questions = (Array.isArray(rawQuestions) && rawQuestions.length > 0)
    ? rawQuestions
    : [
        {
          id: 'q1',
          category: 'Pain Point',
          question: `What is the single most frustrating bottleneck you face when managing ${niche}?`
        },
        {
          id: 'q2',
          category: 'Current Spend',
          question: `What tools or services do you currently pay for monthly? Approximately how much do you spend?`
        },
        {
          id: 'q3',
          category: 'Pricing Validation',
          question: `If ${productName} automates this completely, would a founding member price of $99/year provide positive ROI?`
        },
        {
          id: 'q4',
          category: 'Feature Wishlist',
          question: `What is the #1 must-have feature you need in ${productName} on day one?`
        }
      ]

  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const responsePayload = {
        projectId: project?.id,
        slug: slug || project?.slug || project?.productName,
        name: respondentName.trim() || 'Community Member',
        email: respondentEmail.trim(),
        rating: intentRating,
        answers: answers
      }

      const updatedProject = await recordSurveyResponseUniversal(responsePayload)
      if (updatedProject) {
        setProject(updatedProject)
        try {
          window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updatedProject }))
        } catch (e) {}
      }
      setIsSubmitted(true)
    } catch (err) {
      console.error('Failed saving survey response to database:', err)
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="survey-root min-h-screen bg-[#07090e] text-slate-100 selection:bg-[#c81e3c] selection:text-white font-sans antialiased py-12 px-4 sm:px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .survey-root .serif {
          font-family: 'Instrument Serif', Georgia, serif;
          letter-spacing: -0.015em;
          font-weight: 400;
        }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Top bar branding */}
        <div className="flex items-center justify-between text-xs pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
            <span className="font-semibold text-slate-200">Community Discovery</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">2 min feedback</span>
        </div>

        {/* Header Hero */}
        <div className="text-center space-y-3 pt-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Product Advisory Board · {creatorName}
          </p>

          <h1 className="serif text-4xl sm:text-6xl text-white font-normal leading-[1.08] tracking-tight">
            Help shape <em className="italic" style={{ color: brandColor }}>{productName}</em>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Co-founded with <strong className="text-white font-medium">{creatorName}</strong>. Your feedback decides which features get built into the Day 1 release.
          </p>

          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: 'rgba(200, 30, 60, 0.08)',
              borderColor: 'rgba(200, 30, 60, 0.25)',
              color: '#ff8fa3',
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Founding contributor priority access included</span>
          </div>
        </div>

        {/* Form Container */}
        {isSubmitted ? (
          <div
            className="p-8 sm:p-12 rounded-3xl border text-center space-y-4 animate-fade-in"
            style={{
              backgroundColor: '#0c0e14',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl border"
              style={{
                backgroundColor: 'rgba(200, 30, 60, 0.12)',
                borderColor: 'rgba(200, 30, 60, 0.35)',
                color: '#ff8fa3',
              }}
            >
              ✓
            </div>
            <h2 className="serif text-3xl sm:text-4xl font-normal text-white">
              Thank you for your feedback.
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Your responses have been recorded and are directly shaping the Day 1 MVP roadmap for {productName}.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`/preorder/${productName.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: brandColor }}
              >
                <span>View founding pre-order page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false)
                  setAnswers({})
                }}
                className="px-4 py-2.5 rounded-xl text-slate-300 text-xs font-semibold border border-white/10 hover:bg-white/[0.05] cursor-pointer"
                style={{ backgroundColor: '#07090e' }}
              >
                Submit another response
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Items */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-5 sm:p-6 rounded-2xl border transition-colors space-y-3"
                  style={{
                    backgroundColor: '#0c0e14',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-semibold" style={{ color: '#ff8fa3' }}>
                        0{idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {q.category || `Question ${idx + 1}`}
                      </span>
                    </div>
                    {idx === 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">Required</span>
                    )}
                  </div>

                  <h3 className="serif text-xl sm:text-2xl text-white font-normal leading-snug">
                    {q.question}
                  </h3>

                  <textarea
                    rows={3}
                    required={idx === 0}
                    placeholder="Write your thoughts or specific workflows..."
                    value={answers[q.id] || ''}
                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                    className="w-full p-3.5 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-all resize-y"
                    style={{
                      backgroundColor: '#07090e',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    onFocus={e => (e.target.style.borderColor = brandColor)}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                  />
                </div>
              ))}
            </div>

            {/* Buying Intent Rating Pill Bar */}
            <div
              className="p-5 sm:p-6 rounded-2xl border space-y-3"
              style={{
                backgroundColor: '#0c0e14',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="serif text-xl sm:text-2xl text-white font-normal">
                  How excited are you to use {productName}?
                </h3>
                <span className="text-sm font-semibold font-mono" style={{ color: brandColor }}>
                  {intentRating}/10
                </span>
              </div>

              <div className="grid grid-cols-10 gap-1 sm:gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setIntentRating(num)}
                    className="h-10 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer border"
                    style={
                      intentRating === num
                        ? {
                            backgroundColor: brandColor,
                            borderColor: brandColor,
                            color: '#ffffff',
                            boxShadow: '0 4px 14px rgba(200, 30, 60, 0.35)',
                          }
                        : {
                            backgroundColor: '#07090e',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8',
                          }
                    }
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>1 — Not interested</span>
                <span>5 — Might try</span>
                <span>10 — Need it on day one</span>
              </div>
            </div>

            {/* Respondent Info (Name & Email for VIP access) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Your name</label>
                <input
                  type="text"
                  required
                  placeholder="First and last name"
                  value={respondentName}
                  onChange={e => setRespondentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                  style={{
                    backgroundColor: '#0c0e14',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onFocus={e => (e.target.style.borderColor = brandColor)}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Your email (for VIP Alpha invite)</label>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={respondentEmail}
                  onChange={e => setRespondentEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                  style={{
                    backgroundColor: '#0c0e14',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onFocus={e => (e.target.style.borderColor = brandColor)}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: brandColor,
                boxShadow: '0 8px 24px -4px rgba(200, 30, 60, 0.4)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting feedback...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit discovery feedback & claim VIP spot</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs pt-4">
          Powered by CoLaunch · Confidential Discovery Research
        </div>
      </div>
    </div>
  )
}
