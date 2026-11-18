import {
  Target, Send, MessageSquare, CheckCircle2, XCircle, RefreshCw, Clock, ExternalLink,
  ShieldCheck, Mail, X, Rocket, RotateCcw, User, Lock, Wand2, Layers,
} from "lucide-react";
import FormattedMarkdownBody from "../FormattedMarkdownBody";
import { formatConceptPricing } from "../../../utils/pricing";
import ConceptLandingPage from "../ConceptLandingPage";
import { resolveConceptLandingColor } from "../../../utils/projectLanding";

/* ──────────────────────────────────────────────────────────────────────────
 * Palette: dark slate surfaces with Crimson primary CTAs, Emerald verified/
 * split accents, Sky/Cyan inbox & Hunter signals, Violet AI drafting, and
 * Amber pending states.
 * ────────────────────────────────────────────────────────────────────────── */
const C = {
  bg: "#050506", sheet: "#111114", row: "#0c0c0e", raised: "#18181c",
  line: "rgba(255,255,255,0.08)", lineStrong: "rgba(255,255,255,0.18)",
  text: "#fafafa", body: "#d4d4d8", muted: "#a1a1aa", faint: "#71717a",
  crimson: "#c81e3c", crimsonHover: "#d92a49",
  crimsonSoft: "rgba(200,30,60,0.15)", crimsonLine: "rgba(200,30,60,0.45)", crimsonText: "#ff8fa3",
  ok: "#6fcf9b", okSoft: "rgba(111,207,155,0.13)", okLine: "rgba(111,207,155,0.38)",
  warn: "#f0b46a", warnSoft: "rgba(240,180,106,0.13)", warnLine: "rgba(240,180,106,0.40)",
  sky: "#d4d4d8", skySoft: "rgba(255,255,255,0.06)", skyLine: "rgba(255,255,255,0.18)", skyText: "#e4e4e7",
  violet: "#ff4d6d", violetSoft: "rgba(255,77,109,0.10)", violetLine: "rgba(255,77,109,0.38)", violetText: "#ff8fa3",
};

/* Concept colours follow the Step 5 rule so the selected concept matches its approved landing page. */
const conceptColor = (concept, i) => resolveConceptLandingColor(concept, i);

const PAGE_CSS = `
.s6 .serif{font-family:'Roboto',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:700;letter-spacing:-0.015em}
.s6 .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;white-space:nowrap;font-size:.8125rem;font-weight:600;border-radius:.625rem;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s;border:1px solid transparent}
.s6 .btn:disabled{opacity:.5;cursor:not-allowed}
.s6 .btn:focus-visible,.s6 .chip:focus-visible,.s6 .field:focus-visible{outline:2px solid ${C.crimson};outline-offset:2px}
.s6 .btn-primary{background:linear-gradient(180deg,#d62546 0%,#c81e3c 55%,#ad1833 100%);color:#fff;border-color:rgba(255,77,109,.35);box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 10px 26px -12px rgba(200,30,60,.6)}
.s6 .btn-primary:hover:not(:disabled){filter:brightness(1.08)}
.s6 .btn-primary:active:not(:disabled){transform:translateY(1px)}
.s6 .btn-quiet{background:${C.raised};color:${C.body};border-color:${C.line}}
.s6 .btn-quiet:hover:not(:disabled){border-color:${C.lineStrong};color:${C.text}}
.s6 .btn-ai{background:${C.violetSoft};color:${C.violetText};border-color:${C.violetLine}}
.s6 .btn-ai:hover:not(:disabled){background:rgba(255,77,109,0.2);border-color:${C.violet};color:#fff}
.s6 .btn-sky{background:${C.skySoft};color:${C.skyText};border-color:${C.skyLine}}
.s6 .btn-sky:hover:not(:disabled){background:rgba(255,255,255,0.10);border-color:rgba(255,255,255,0.3);color:#fff}
.s6 .btn-danger{background:transparent;color:${C.crimsonText};border-color:${C.crimsonLine}}
.s6 .btn-danger:hover:not(:disabled){background:${C.crimsonSoft}}
.s6 .chip{display:inline-flex;align-items:center;gap:.5rem;border-radius:999px;font-size:.75rem;font-weight:500;cursor:pointer;transition:border-color .15s,color .15s,background-color .15s;border:1px solid ${C.line};background:${C.row};color:${C.muted}}
.s6 .chip:hover{border-color:${C.lineStrong};color:${C.text}}
.s6 .chip[aria-pressed="true"]{background:${C.crimsonSoft};border-color:${C.crimsonLine};color:${C.text}}
.s6 .field{width:100%;background:${C.row};border:1px solid ${C.line};color:${C.text};border-radius:.625rem;font-size:.8125rem;transition:border-color .15s}
.s6 .field::placeholder{color:${C.faint}}
.s6 .field:hover{border-color:${C.lineStrong}}
.s6 .field:focus{border-color:rgba(200,30,60,.7);box-shadow:0 0 0 3px rgba(200,30,60,.18);outline:none}
.s6 .seg{flex:1;padding:.4rem .75rem;border-radius:.5rem;font-size:.8125rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.4rem;color:${C.muted};transition:color .15s,background-color .15s,box-shadow .15s}
.s6 .seg:hover{color:${C.text}}
.s6 .seg[aria-selected="true"]{background:${C.raised};color:${C.text};box-shadow:inset 0 0 0 1px ${C.lineStrong}}
@media (prefers-reduced-motion:reduce){.s6 *{animation:none!important;transition:none!important}}
`;

const lower = (v) => String(v || "").toLowerCase();
const cleanHandle = (v) => String(v || "").replace(/^@/, "").toLowerCase().trim();
const nameOf = (c) => c?.name || c?.display_name || c?.handle || "Creator";
const emailOf = (c) => c?.email || c?.email_public || "";

function findDbProject(creator, dbProjects) {
  if (!creator) return null;
  const h = cleanHandle(creator.handle);
  const n = lower(creator.name || creator.display_name).trim();
  return (dbProjects || []).find((p) => {
    if (!p) return false;
    const ph = cleanHandle(p.creatorHandle);
    const pn = lower(p.creatorName).trim();
    return (
      (p.creatorId && (p.creatorId === creator.id || p.creatorId === creator.handle)) ||
      (p.id && (p.id === creator.project_id || p.id === creator.projectId || p.id === creator.active_project_id)) ||
      (h && ph && h === ph) ||
      (n && pn && n === pn && n.length > 3 && !["creator", "partner", "lead"].includes(n))
    );
  }) || null;
}

const PITCH_RE = /blueprint|opportunity deck|software concepts|bespoke software|landing pages built|concept selection|concept pitch|concepts for|partnering with creator forge|partnering with colaunch|concept 1|concept 2|concept 3|co-founder portal/i;

/* ── small pieces ── */
function Pill({ tone = "neutral", children, className = "" }) {
  const tones = {
    neutral: { color: C.muted, background: C.row, borderColor: C.line },
    crimson: { color: C.crimsonText, background: C.crimsonSoft, borderColor: C.crimsonLine },
    ok: { color: C.ok, background: C.okSoft, borderColor: C.okLine },
    warn: { color: C.warn, background: C.warnSoft, borderColor: C.warnLine },
    sky: { color: C.skyText, background: C.skySoft, borderColor: C.skyLine },
    violet: { color: C.violetText, background: C.violetSoft, borderColor: C.violetLine },
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${className}`} style={tones[tone] || tones.neutral}>
      {children}
    </span>
  );
}

function Avatar({ creator, getCreatorAvatar, generateCreatorAvatarSvg, className = "w-5 h-5" }) {
  return (
    <img
      src={getCreatorAvatar(creator)}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = generateCreatorAvatarSvg(nameOf(creator));
      }}
      alt=""
      className={`rounded-full object-cover ${className}`}
    />
  );
}

const Panel = ({ children, className = "", style }) => (
  <section className={`rounded-2xl ${className}`} style={{ background: C.sheet, border: `1px solid ${C.line}`, ...style }}>
    {children}
  </section>
);

const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{children}</label>
);

function Stat({ label, value }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
      <p className="m-0 text-[11px]" style={{ color: C.faint }}>{label}</p>
      <p className="m-0 mt-0.5 text-sm font-semibold break-words" style={{ color: C.text }}>{value}</p>
    </div>
  );
}

export default function AcquisitionStep6Pitch({
  activeAutoDraftAngle, aiDetectedChoiceMap, applyAutoDraft, autoDraftEnabled, cobuilderPassPrice,
  creatorConceptSelectionMap, customPitchBody, customPitchSubject, dbProjects, ensureCreatorConcepts,
  ensureDistinctPricing, generateCreatorAvatarSvg, getCreatorAvatar, getCreatorThreadMessages,
  handleAdminDeclineDiy, handleClearScopedCreator, handleHunterFindEmail, handleHunterVerifyEmail,
  handlePitchAndCreateProject, handleRegenerateStep6Draft, handleRestoreCreator, handleSelectConcept,
  handleSendDiyFollowUpEmail, handleSendOpportunityPitch, hunterActionType, hunterDataMap, hunterLoadingId,
  interestedCreators, isCreatorDeclined, isCreatorMessage, isGeneratingStep6Ai, isLaunchingProject,
  isSendingPitch, notify, onGoToProjectOS, openDecisionModal, pitchSentMap, pollingImap, realThreads,
  scopedIndividualCreator, selectedConceptId, selectedCreator, setAiDetectedChoiceMap, setAutoDraftEnabled,
  setCreators, setCustomPitchBody, setCustomPitchSubject, setSelectedConceptId, setSelectedCreatorId,
  setShowClientProfileModal, setStep6LeftTab, step6LeftTab, syncImapReplies,
}) {
  const av = { getCreatorAvatar, generateCreatorAvatarSvg };
  const creator = selectedCreator;
  const status = lower(creator?.status);
  const rejected = Boolean(creator) && (status === "rejected" || isCreatorDeclined(creator));
  const detected = creator ? aiDetectedChoiceMap[creator.id] : null;
  const committedChoice = detected?.decision === "CREATE_PROJECT" || detected?.decision === "COMMITTED";
  const matchedProj = findDbProject(creator, dbProjects);
  const hasProjectId = Boolean(creator?.project_id || creator?.projectId);

  // Gate: launched means a project exists. Commitment: the creator said yes (or admin confirmed).
  const alreadyLaunched = Boolean(creator?.project_id || ["launched", "active_project"].includes(status));
  const hasCommitment = !rejected && Boolean(committedChoice || creator?.isCommitted === true || alreadyLaunched);
  const launchedForHeader =
    Boolean(hasProjectId && (["launched", "active_project", "partnered"].includes(status) || matchedProj) &&
      (committedChoice || creator?.isCommitted === true || status === "launched" || status === "partnered")) ||
    Boolean(matchedProj && (committedChoice || creator?.isCommitted === true || status === "launched" || status === "partnered"));

  const showProjectOS = (c) => { if (onGoToProjectOS) onGoToProjectOS(c); };

  const unlockCommitment = (chosen) => {
    setAiDetectedChoiceMap((prev) => ({
      ...prev,
      [creator.id]: {
        decision: "CREATE_PROJECT",
        actionLabel: `Launch & Create Project (${chosen?.name || "Selected Concept"})`,
        confidence: 100,
        conceptName: chosen?.name || "Selected Concept",
        conceptId: chosen?.id,
        reasoning: "Admin manually confirmed creator commitment. Gate unlocked for ProjectOS promotion.",
        color: "emerald",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
      },
    }));
    setCreators((prev) => prev.map((c) => (c.id === creator.id ? { ...c, isCommitted: true } : c)));
    notify("success", "Commitment Unlocked", "Creator commitment verified! You can now promote to ProjectOS.", 3500);
  };

  const profileUrl = (c) => {
    const h = String(c.handle || "").replace(/^@/, "");
    const p = lower(c.platform || "youtube");
    return c.profile_url || c.url || (
      p === "youtube" ? `https://www.youtube.com/@${h}` :
      p === "instagram" ? `https://www.instagram.com/${h}` :
      p === "tiktok" ? `https://www.tiktok.com/@${h}` :
      `https://twitter.com/${h}`
    );
  };

  return (
    <div className="s6 acq-card p-5 sm:p-7 space-y-6" style={{ color: C.text }}>
      <style>{PAGE_CSS}</style>

      {/* Creator switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-sm font-medium shrink-0" style={{ color: C.muted }}>Creators</span>
          {scopedIndividualCreator && (
            <button type="button" onClick={handleClearScopedCreator} className="btn btn-quiet px-2.5 py-1 text-xs">
              Show all creators
            </button>
          )}
          {interestedCreators.map((c) => {
            const msgs = getCreatorThreadMessages(c, realThreads);
            const choice = aiDetectedChoiceMap[c.id];
            const proj = findDbProject(c, dbProjects);
            const cStatus = lower(c.status);
            const committed = Boolean(choice?.decision === "CREATE_PROJECT" || choice?.decision === "COMMITTED" || c.isCommitted === true);
            let launched = Boolean(
              (c.project_id || c.projectId) && (["launched", "active_project", "partnered"].includes(cStatus) || proj),
            );
            if (!launched && proj && (committed || cStatus === "launched" || cStatus === "partnered")) launched = true;
            const pitchSent = Boolean(
              pitchSentMap[c.id] || cStatus === "pitched" ||
              msgs.some((m) => PITCH_RE.test(`${m.subject || ""} ${m.body || ""}`)),
            );
            const tag = launched
              ? { tone: "ok", text: "Launched" }
              : pitchSent
              ? choice?.isStep6Reply
                ? { tone: "sky", text: "In conversation" }
                : { tone: "violet", text: "Proposal sent" }
              : { tone: "warn", text: "Draft ready" };

            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={creator?.id === c.id}
                onClick={() => {
                  setSelectedCreatorId(c.id);
                  setSelectedConceptId(creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null);
                }}
                className="chip pl-1.5 pr-2 py-1"
              >
                <Avatar creator={c} {...av} />
                <span>{c.name || c.display_name}</span>
                <Pill tone={tag.tone}>{tag.text}</Pill>
              </button>
            );
          })}
          {interestedCreators.length === 0 && (
            <span className="text-xs italic" style={{ color: C.warn }}>No creators ready to pitch yet</span>
          )}
        </div>
        <button type="button" onClick={() => syncImapReplies(true)} disabled={pollingImap} className="btn btn-sky px-3 py-1.5 shrink-0" title="Check inbox for new replies">
          <RefreshCw className={`w-3.5 h-3.5 ${pollingImap ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>Sync inbox</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setShowClientProfileModal(true)}
            className="shrink-0 cursor-pointer rounded-full p-0.5"
            style={{ border: `2px solid ${C.crimsonLine}`, boxShadow: `0 0 0 3px ${C.crimsonSoft}` }}
            title="Open client profile"
            aria-label="Open client profile"
          >
            <Avatar creator={creator} {...av} className="w-14 h-14" />
          </button>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#ff4d6d" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff4d6d", boxShadow: "0 0 10px rgba(255,77,109,0.9)" }} />
              Step 06 · Pitch & select
            </span>
            <h2 className="serif m-0 mt-1 text-2xl sm:text-3xl leading-tight truncate">{nameOf(creator)}</h2>
            <p className="m-0 mt-0.5 text-sm break-all" style={{ color: emailOf(creator) ? C.skyText : C.muted }}>{emailOf(creator) || "No email on file"}</p>
            <p className="m-0 mt-1 text-xs" style={{ color: C.muted }}>
              Review the concepts, talk with the creator, then create the project once they commit.
              <span className="ml-1.5 align-middle"><Pill tone="crimson">50/50 revenue split</Pill></span>
            </p>
          </div>
        </div>

        {creator && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button type="button" onClick={() => setShowClientProfileModal(true)} className="btn btn-quiet h-9 px-3.5" title="Channel reach, metrics, bio and concepts">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Client profile</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </button>
            {rejected ? (
              <>
                <Pill tone="crimson" className="h-9 px-3"><XCircle className="w-3.5 h-3.5" aria-hidden="true" />Archived</Pill>
                <button type="button" onClick={() => handleRestoreCreator(creator.id)} className="btn btn-quiet h-9 px-3.5" title="Move this creator back into the active pipeline">
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Restore lead</span>
                </button>
              </>
            ) : (
              <button type="button" onClick={() => openDecisionModal(creator, "reject")} className="btn btn-danger h-9 px-3.5">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reject lead</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Promotion gate */}
      {creator && (
        rejected ? (
          <div className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}>
            <div>
              <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>This lead is archived</p>
              <p className="m-0 mt-0.5 text-xs" style={{ color: C.body }}>
                Concepts, promotion and kickoff emails are paused. Restore the lead to reopen them.
              </p>
            </div>
            <button type="button" onClick={() => handleRestoreCreator(creator.id)} className="btn btn-quiet h-9 px-3.5 shrink-0">
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Restore lead</span>
            </button>
          </div>
        ) : (
          <div
            className="p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%), ${C.sheet}`,
              border: `1px solid ${C.line}`,
              borderLeftWidth: "3px",
              borderLeftColor: hasCommitment ? C.ok : C.warn,
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <span
                key={hasCommitment ? "committed" : "waiting"}
                className="acq-check-in w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: hasCommitment ? C.okSoft : C.warnSoft,
                  border: `1px solid ${hasCommitment ? C.okLine : C.warnLine}`,
                }}
              >
                {hasCommitment
                  ? <CheckCircle2 className="w-4 h-4" style={{ color: C.ok }} aria-hidden="true" />
                  : <Lock className="w-4 h-4" style={{ color: C.warn }} aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold" style={{ color: C.text }}>
                  {hasCommitment ? "Creator has committed" : "Waiting for the creator to commit"}
                </p>
                <p className="m-0 mt-0.5 text-xs leading-relaxed" style={{ color: C.body }}>
                  {hasCommitment
                    ? "Create the project to send the kickoff email and open it in ProjectOS."
                    : "ProjectOS stays locked until the creator confirms a concept or agrees to the co-launch terms."}
                </p>
                <ol className="list-none m-0 mt-2.5 p-0 flex items-center gap-2 text-[11px] font-semibold" aria-label="Progress to Section 2">
                  {[
                    { label: "Proposal sent", done: true },
                    { label: "Creator committed", done: hasCommitment },
                    { label: "Project created", done: alreadyLaunched },
                  ].map((st, i, arr) => (
                    <li key={st.label} className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5" style={{ color: st.done ? C.ok : C.faint }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: st.done ? C.okSoft : "transparent", border: `1px solid ${st.done ? C.okLine : C.line}` }}>
                          {st.done ? <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> : <span className="text-[9px]">{i + 1}</span>}
                        </span>
                        {st.label}
                      </span>
                      {i < arr.length - 1 && <span className="w-5 h-px" style={{ background: st.done ? C.okLine : C.line }} aria-hidden="true" />}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {!hasCommitment && (
                <button
                  type="button"
                  className="btn btn-quiet h-9 px-3.5"
                  title="Mark the creator as committed without waiting for a reply"
                  onClick={() => {
                    const list = creator.productConcepts || ensureCreatorConcepts(creator);
                    unlockCommitment(list.find((c) => c.id === selectedConceptId) || list[0]);
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Confirm commitment</span>
                </button>
              )}

              {alreadyLaunched ? (
                <>
                  {creator.diyOfferStatus === "accepted" || creator.isDIY ? (
                    <Pill tone="ok" className="h-9 px-3 text-xs">DIY ProjectOS active (${cobuilderPassPrice})</Pill>
                  ) : creator.diyOfferStatus === "declined" ? (
                    <Pill tone="neutral" className="h-9 px-3 text-xs">Studio-managed, 50/50 split</Pill>
                  ) : (
                    <>
                      <Pill tone="warn" className="h-9 px-3 text-xs"><Clock className="w-3.5 h-3.5" aria-hidden="true" />${cobuilderPassPrice} DIY offer pending</Pill>
                      <button type="button" onClick={() => handleSendDiyFollowUpEmail(creator)} className="btn btn-quiet h-9 px-3.5" title={`Remind the creator to accept the $${cobuilderPassPrice} DIY offer or decline`}>
                        <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Send follow-up</span>
                      </button>
                      <button type="button" onClick={() => handleAdminDeclineDiy(creator)} className="btn btn-danger h-9 px-3.5" title="Decline DIY for the creator and move to the managed 50/50 track">
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Decline DIY</span>
                      </button>
                    </>
                  )}
                  {launchedForHeader && (
                    <button type="button" disabled={isLaunchingProject} onClick={() => handlePitchAndCreateProject()} className="btn btn-quiet h-9 px-3.5" title="Re-sync project specs from the selected concept">
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Re-sync project</span>
                    </button>
                  )}
                  <button type="button" onClick={() => showProjectOS(creator)} className="btn btn-primary h-9 px-4">
                    <Rocket className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Open ProjectOS</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={!hasCommitment || isLaunchingProject}
                  onClick={() => handlePitchAndCreateProject()}
                  className={`btn btn-primary h-10 px-5 ${hasCommitment && !isLaunchingProject ? "acq-glow-pulse" : ""}`}
                  title={
                    hasCommitment
                      ? `Create the project and send the $${cobuilderPassPrice} DIY / managed-track offer email`
                      : "Locked until the creator confirms commitment"
                  }
                >
                  {hasCommitment ? <Rocket className="w-3.5 h-3.5" aria-hidden="true" /> : <Lock className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{isLaunchingProject ? "Creating..." : hasCommitment ? `Create project and send $${cobuilderPassPrice} offer` : "Create project"}</span>
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Two columns */}
      {creator && (() => {
        const msgs = getCreatorThreadMessages(creator, realThreads);
        const rawConcepts = creator.productConcepts || ensureCreatorConcepts(creator);
        const concepts = ensureDistinctPricing(rawConcepts);
        const savedId = creatorConceptSelectionMap[creator.id] || selectedConceptId || creator.selectedConceptId;
        const chosen =
          concepts.find((c) => c.id === savedId) ||
          concepts.find((c) => c.id === detected?.conceptId) ||
          concepts[0];
        const chosenIndex = Math.max(0, concepts.findIndex((c) => c.id === chosen?.id));
        const chosenAccent = conceptColor(chosen, chosenIndex);
        const hasFeedback = Boolean(detected?.isStep6Reply && !hasCommitment && !rejected);
        const hunter = hunterDataMap[creator.id];
        const hunterScore = hunter?.score || creator.hunter_score;
        const loadingThis = hunterLoadingId === creator.id;
        const platform = creator.platform || "YouTube";
        const audience = creator.followerStr || creator.follower_count || "Not available";
        const engagementRaw = creator.engagement_rate || creator.engagementRate ||
          (creator.engagement ? `${creator.engagement}%` : creator.engagement_score ? `${creator.engagement_score}%` : "");

        const selectionStatus = rejected
          ? { tone: "crimson", text: "Lead archived" }
          : hasCommitment
          ? { tone: "ok", text: "Confirmed by creator" }
          : hasFeedback
          ? { tone: "sky", text: "Feedback in review" }
          : { tone: "warn", text: "Awaiting creator reply" };

        return (
          <div className="acq-stagger grid lg:grid-cols-12 gap-5">
            {/* Left */}
            <div className="lg:col-span-5 space-y-4">
              <div role="tablist" aria-label="Concept or profile" className="p-1 rounded-xl flex gap-1" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={step6LeftTab === "concept"}
                  onClick={() => setStep6LeftTab("concept")}
                  className="seg"
                  style={step6LeftTab === "concept" ? { background: C.crimsonSoft, color: C.text, boxShadow: `inset 0 0 0 1px ${C.crimsonLine}` } : undefined}
                >
                  <Layers className="w-3.5 h-3.5" style={{ color: step6LeftTab === "concept" ? C.crimsonText : C.muted }} aria-hidden="true" />
                  <span>Concept and terms</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={step6LeftTab === "profile"}
                  onClick={() => setStep6LeftTab("profile")}
                  className="seg"
                  style={step6LeftTab === "profile" ? { background: C.skySoft, color: C.text, boxShadow: `inset 0 0 0 1px ${C.skyLine}` } : undefined}
                >
                  <User className="w-3.5 h-3.5" style={{ color: step6LeftTab === "profile" ? C.skyText : C.muted }} aria-hidden="true" />
                  <span>Profile</span>
                </button>
              </div>

              {step6LeftTab === "profile" ? (
                <Panel className="p-5 space-y-4" style={{ borderTop: `3px solid ${C.sky}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rounded-full p-0.5 shrink-0" style={{ border: `2px solid ${C.skyLine}` }}>
                        <Avatar creator={creator} {...av} className="w-14 h-14" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="serif m-0 text-2xl leading-tight truncate">{nameOf(creator)}</h3>
                        <p className="m-0 text-xs" style={{ color: C.skyText }}>
                          {platform} · @{String(creator.handle || "").replace(/^@/, "")}
                        </p>
                        <p className="m-0 mt-0.5 text-xs" style={{ color: C.faint }}>{creator.location || "Location not listed"}</p>
                      </div>
                    </div>
                    <a href={profileUrl(creator)} target="_blank" rel="noopener noreferrer" className="btn btn-sky px-3 py-1.5 shrink-0" title="Open the public profile in a new tab">
                      <span>Channel</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Audience" value={audience} />
                    <Stat label="Engagement" value={engagementRaw || "Not available"} />
                    <Stat label="Creator score" value={creator.creatorScore || "Not scored"} />
                  </div>

                  <div className="p-3 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.violetLine}` }}>
                    <p className="m-0 text-xs font-medium" style={{ color: C.violetText }}>Bio</p>
                    <p className="m-0 mt-1 text-sm leading-relaxed" style={{ color: C.body }}>
                      {creator.bio || "No bio on file."}
                    </p>
                  </div>

                  {(() => {
                    const tags = [creator.niche, ...(creator.topics || creator.niches || [])].filter(Boolean).slice(0, 4);
                    const tagTones = ["sky", "violet", "crimson", "ok"];
                    return tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t, i) => <Pill key={i} tone={tagTones[i % tagTones.length]}>{t}</Pill>)}
                      </div>
                    ) : null;
                  })()}

                  <div className="p-3 rounded-xl space-y-2" style={{ background: C.row, border: `1px solid ${C.skyLine}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="m-0 text-xs font-medium" style={{ color: C.skyText }}>Contact email</p>
                      {hunterScore && <Pill tone="ok">{hunterScore}% deliverable</Pill>}
                    </div>
                    <p className="m-0 text-sm break-all select-all" style={{ color: C.text }}>{emailOf(creator) || "No verified email"}</p>
                  </div>

                  <button type="button" onClick={() => setShowClientProfileModal(true)} className="btn btn-quiet w-full py-2.5">
                    <User className="w-3.5 h-3.5" style={{ color: C.skyText }} aria-hidden="true" />
                    <span>Open full client dossier</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Panel>
              ) : (
                <>
                  <Panel className="p-5 space-y-4" style={{ border: `1px solid ${C.line}`, borderTop: `3px solid ${chosenAccent}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: C.body }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: chosenAccent }} aria-hidden="true" />
                        {rejected ? "Archived concepts" : hasCommitment ? "Chosen concept" : "Proposed concept"}
                      </span>
                      <Pill tone="ok">Fit {chosen?.opportunityScore || 94}/100</Pill>
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="serif m-0 text-3xl leading-tight">{chosen?.name}</h3>
                        <Pill tone="violet" className="shrink-0 mt-1 text-xs font-semibold px-2.5 py-1">
                          {formatConceptPricing(chosen?.pricing)}
                        </Pill>
                      </div>
                      <p className="m-0 mt-1 text-sm font-medium" style={{ color: C.body }}>{chosen?.tagline}</p>
                      {chosen?.problem && (
                        <p className="m-0 mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
                          <span style={{ color: C.skyText, fontWeight: 500 }}>Solves: </span>{chosen.problem}
                        </p>
                      )}
                    </div>

                    {chosen && (
                      <div key={chosen.id || chosenIndex} className="acq-pop space-y-1.5">
                        <p className="m-0 text-[11px] font-medium" style={{ color: C.faint }}>Landing page that ships to Section 2</p>
                        <div style={{ border: `1px solid ${C.line}` }}>
                          <ConceptLandingPage
                            concept={chosen}
                            conceptIndex={chosenIndex}
                            creator={creator}
                            brandColor={chosenAccent}
                            mode="thumb"
                            getCreatorAvatar={getCreatorAvatar}
                            generateCreatorAvatarSvg={generateCreatorAvatarSvg}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Stat label="Time to first version" value={chosen?.mvpDifficulty || "2 weeks"} />
                      <div className="p-3 rounded-xl" style={{ background: C.row, border: `1px solid ${C.line}` }}>
                        <p className="m-0 text-[11px]" style={{ color: C.faint }}>Status</p>
                        <p className="m-0 mt-1"><Pill tone={selectionStatus.tone}>{selectionStatus.text}</Pill></p>
                      </div>
                    </div>

                    {concepts.length > 1 && (
                      <div className="pt-3 space-y-2" style={{ borderTop: `1px solid ${C.line}` }}>
                        <p className="m-0 text-xs font-medium" style={{ color: C.muted }}>Switch concept</p>
                        <div className="flex gap-2">
                          {concepts.map((c, i) => {
                            const current = chosen?.id === c.id || (!chosen && i === 0);
                            const dotColor = conceptColor(c, i);
                            return (
                              <button
                                key={c.id || i}
                                type="button"
                                aria-pressed={current}
                                onClick={() => handleSelectConcept(c.id, creator.id)}
                                className="chip flex-1 justify-center px-2 py-1.5 truncate"
                                style={current ? { borderColor: dotColor, background: C.raised, color: C.text } : undefined}
                                title={c.name}
                              >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} aria-hidden="true" />
                                <span className="truncate">{i + 1}. {String(c.name || "").split(" ")[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Panel>

                  <div
                    className="p-4 rounded-xl text-xs space-y-1.5"
                    style={{
                      background: rejected ? C.row : "rgba(52,211,153,0.06)",
                      border: `1px solid ${rejected ? C.line : C.okLine}`,
                      borderLeftWidth: "3px",
                      borderLeftColor: rejected ? C.crimsonLine : C.ok,
                    }}
                  >
                    <p className="m-0 flex items-center justify-between gap-2 text-sm font-semibold" style={{ color: rejected ? C.muted : C.text }}>
                      <span className="flex items-center gap-1.5">
                        {rejected ? <Lock className="w-4 h-4" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" style={{ color: C.ok }} aria-hidden="true" />}
                        {rejected ? "50/50 partnership terms (inactive)" : "50/50 partnership terms"}
                      </span>
                      {!rejected && <Pill tone="ok">$0 upfront</Pill>}
                    </p>
                    <p className="m-0 leading-relaxed" style={{ color: C.body }}>
                      {rejected
                        ? "This lead is archived. Restore it to bring the partnership terms back."
                        : "CoLaunch builds, hosts and supports the first version. The creator brings distribution and feedback. Net subscription profit is split 50/50 through automated Stripe payouts."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl space-y-3" style={{ background: C.row, border: `1px solid ${C.line}`, borderTop: `2px solid ${C.skyLine}` }}>
                    <div className="flex items-center justify-between">
                      <p className="m-0 flex items-center gap-1.5 text-sm font-semibold">
                        <User className="w-3.5 h-3.5" style={{ color: C.skyText }} aria-hidden="true" />
                        <span>Creator</span>
                      </p>
                      <button type="button" onClick={() => setShowClientProfileModal(true)} className="text-xs font-medium cursor-pointer inline-flex items-center gap-1" style={{ color: C.skyText }}>
                        Full dossier <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
                      </button>
                    </div>
                    <dl className="m-0 space-y-1.5 text-xs">
                      {[["Audience", audience], ["Niche", creator.niche || "Not listed"], ["Email", emailOf(creator) || "No email"]].map(([k, v]) => (
                        <div key={k} className="flex items-start justify-between gap-3">
                          <dt style={{ color: C.muted }}>{k}</dt>
                          <dd className="m-0 text-right break-all" style={{ color: k === "Email" && emailOf(creator) ? C.skyText : C.text }}>{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="pt-3 space-y-2" style={{ borderTop: `1px solid ${C.line}` }}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: C.body }}>
                          <Target className="w-3.5 h-3.5" style={{ color: C.skyText }} aria-hidden="true" /> Email check (Hunter.io)
                        </span>
                        {hunterScore ? <Pill tone="ok">{hunterScore}% deliverable</Pill> : null}
                      </div>

                      {emailOf(creator) ? (
                        <>
                          <button type="button" onClick={(e) => handleHunterVerifyEmail(creator, e)} disabled={loadingThis} className="btn btn-sky w-full py-2 text-xs">
                            {loadingThis && hunterActionType === "verify"
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                              : <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />}
                            <span>Verify deliverability</span>
                          </button>
                          {hunter && (
                            <dl className="m-0 p-2.5 rounded-lg text-[11px] space-y-1" style={{ background: C.bg, border: `1px solid ${C.okLine}` }}>
                              <div className="flex justify-between"><dt style={{ color: C.muted }}>Status</dt><dd className="m-0" style={{ color: C.ok }}>{hunter.status}</dd></div>
                              <div className="flex justify-between"><dt style={{ color: C.muted }}>SMTP check</dt><dd className="m-0" style={{ color: hunter.smtp_check ? C.ok : C.warn }}>{hunter.smtp_check ? "Passed" : "Blocked or failed"}</dd></div>
                              <div className="flex justify-between"><dt style={{ color: C.muted }}>Public sources</dt><dd className="m-0" style={{ color: C.skyText }}>{hunter.sources_count || (hunter.sources || []).length} found</dd></div>
                            </dl>
                          )}
                        </>
                      ) : (
                        <button type="button" onClick={(e) => handleHunterFindEmail(creator, e)} disabled={loadingThis} className="btn btn-sky w-full py-2 text-xs">
                          {loadingThis && hunterActionType === "find"
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            : <Target className="w-3.5 h-3.5" aria-hidden="true" />}
                          <span>Find business email</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right */}
            <div className="lg:col-span-7 space-y-4">
              <Panel className="overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderBottom: `1px solid ${C.line}`, background: C.row }}>
                  <p className="m-0 flex items-center gap-2.5 text-sm font-semibold min-w-0">
                    <span className="w-7 h-7 inline-flex items-center justify-center shrink-0" style={{ background: C.crimsonSoft, border: `1px solid ${C.crimsonLine}` }}>
                      <Mail className="w-3.5 h-3.5" style={{ color: "#ff8fa3" }} aria-hidden="true" />
                    </span>
                    <span className="truncate">Conversation with {nameOf(creator)}</span>
                  </p>
                  <Pill tone="neutral">{msgs.length} {msgs.length === 1 ? "message" : "messages"}</Pill>
                </div>

                <ul className="acq-stagger list-none m-0 p-3 sm:p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 520 }}>
                  {msgs.length > 0 ? msgs.map((msg, idx) => {
                    const fromCreator = isCreatorMessage(msg);
                    return (
                      <li
                        key={msg.id || idx}
                        className={`relative p-4 text-xs space-y-2.5 ${fromCreator ? "ml-6" : "mr-6"}`}
                        style={{
                          background: fromCreator ? "rgba(200,30,60,0.06)" : "#111114",
                          border: `1px solid ${fromCreator ? C.crimsonLine : C.line}`,
                          borderLeft: `3px solid ${fromCreator ? "#ff4d6d" : "#3f3f46"}`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold truncate" style={{ color: C.text }}>
                              {fromCreator ? (creator.name || msg.from_address) : "CoLaunch Studio"}
                            </span>
                            <Pill tone={fromCreator ? "crimson" : "neutral"}>{fromCreator ? "Creator reply" : "Sent by you"}</Pill>
                          </span>
                          <span className="shrink-0" style={{ color: C.faint }}>
                            {msg.received_at ? new Date(msg.received_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Recently"}
                          </span>
                        </div>
                        <div className="leading-relaxed" style={{ color: C.body }}>
                          <FormattedMarkdownBody text={msg.body} isDark />
                        </div>
                      </li>
                    );
                  }) : (
                    <li className="p-8 text-center text-sm space-y-2" style={{ color: C.muted }}>
                      <Clock className="w-5 h-5 mx-auto" style={{ color: C.warn }} aria-hidden="true" />
                      <p className="m-0">No messages yet. Write a reply below or generate an AI draft.</p>
                    </li>
                  )}
                </ul>
              </Panel>

              <Panel className="p-4 space-y-4" style={{ borderTop: `2px solid ${C.violetLine}` }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.violetSoft, border: `1px solid ${C.violetLine}` }}>
                      <MessageSquare className="w-3.5 h-3.5" style={{ color: C.violetText }} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="serif m-0 text-2xl leading-tight">Reply to {String(creator.name || "the creator").split(" ")[0]}</h3>
                      <p className="m-0 text-xs" style={{ color: C.muted }}>Nothing is sent until you press Send.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <label
                      className="chip px-3 py-1.5 select-none"
                      style={autoDraftEnabled ? { background: C.violetSoft, borderColor: C.violetLine, color: C.violetText } : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={autoDraftEnabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setAutoDraftEnabled(val);
                          try { localStorage.setItem("forge_step6_auto_draft_enabled", val ? "true" : "false"); } catch {}
                          if (val && creator) applyAutoDraft(creator, activeAutoDraftAngle);
                        }}
                        className="w-3.5 h-3.5 cursor-pointer"
                        style={{ accentColor: C.violet }}
                      />
                      <Wand2 className="w-3 h-3" aria-hidden="true" />
                      <span>Auto draft {autoDraftEnabled ? "on" : "off"}</span>
                    </label>
                    <button type="button" onClick={() => applyAutoDraft(creator, activeAutoDraftAngle, null, true)} className="btn btn-sky px-3 py-1.5" title="Write a fresh draft for the current angle">
                      <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Re-draft</span>
                    </button>
                    <button type="button" onClick={handleRegenerateStep6Draft} disabled={isGeneratingStep6Ai} className="btn btn-ai px-3 py-1.5" title="Write a draft that answers the creator's latest reply">
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingStep6Ai ? "animate-spin" : ""}`} aria-hidden="true" />
                      <span>{isGeneratingStep6Ai ? "Generating..." : "AI draft"}</span>
                    </button>
                  </div>
                </div>

                {autoDraftEnabled && (
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Draft angle">
                    <span className="text-xs mr-1 font-medium" style={{ color: C.violetText }}>Angle</span>
                    {[
                      { id: "smart", label: "Answer their questions", desc: "Replies directly to the creator's questions and comments" },
                      { id: "kickoff", label: "2-week roadmap", desc: "Build and launch timeline" },
                      { id: "terms", label: "50/50 and zero cost", desc: "Transparent partnership economics" },
                      { id: "demo_call", label: "15-minute walkthrough", desc: "Quick call or Loom walkthrough" },
                      { id: "concept_deep_dive", label: "Concept deep-dive", desc: "Feature and monetization breakdown" },
                    ].map((angle) => (
                      <button
                        key={angle.id}
                        type="button"
                        aria-pressed={activeAutoDraftAngle === angle.id}
                        onClick={() => applyAutoDraft(creator, angle.id, null, true)}
                        title={angle.desc}
                        className="chip px-2.5 py-1"
                        style={activeAutoDraftAngle === angle.id ? { background: C.violetSoft, borderColor: C.violet, color: C.violetText } : undefined}
                      >
                        {angle.label}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <Label htmlFor="s6-subject">Subject</Label>
                  <input id="s6-subject" type="text" className="field px-3.5 py-2" value={customPitchSubject} onChange={(e) => setCustomPitchSubject(e.target.value)} placeholder="Subject" />
                </div>

                <div>
                  <Label htmlFor="s6-body">Message</Label>
                  <textarea
                    id="s6-body"
                    rows={7}
                    className="field p-3.5 leading-relaxed resize-y"
                    value={customPitchBody}
                    onChange={(e) => setCustomPitchBody(e.target.value)}
                    placeholder={`Hi ${creator.name?.split(" ")[0] || "there"}, thanks for replying! We'd love to partner with you on building ${chosen?.name}...`}
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs mr-1 font-medium" style={{ color: C.skyText }}>Add a line</span>
                  {[
                    `Glad you like ${chosen?.name || "the concept"}! Let's get started`,
                    "Zero technical effort or time required from you",
                    "Can we schedule a quick 15-min demo call?",
                  ].map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomPitchBody((prev) => (prev ? `${prev}\n\n${s}` : s))}
                      className="chip px-2.5 py-1 truncate"
                      style={{ maxWidth: 240, borderColor: C.skyLine, color: C.body }}
                      title={s}
                    >
                      <span className="truncate">{s}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.line}` }}>
                  <p className="m-0 text-xs break-all" style={{ color: C.muted }}>
                    To: <span style={{ color: C.skyText }}>{emailOf(creator) || "No email set"}</span>
                  </p>
                  <button type="button" onClick={() => handleSendOpportunityPitch()} disabled={isSendingPitch} className="btn btn-primary h-10 px-5">
                    {isSendingPitch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
                    <span>{isSendingPitch ? "Sending..." : "Send email"}</span>
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
