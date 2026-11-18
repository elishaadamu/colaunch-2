import {
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Check,
  Mail,
  X,
  Plus,
  AlertTriangle,
  Lock,
  ArrowRight,
  Inbox,
  Sparkles,
  MessageCircleQuestion,
  Ban,
  MailX,
  Users,
} from "lucide-react";
import FormattedMarkdownBody from "../FormattedMarkdownBody";

/* One visual language for reply classes: dot colour + label (black + crimson base, semantic accents). */
const CLASS_META = {
  interested: { label: "Interested", dot: "#34d399", text: "#6ee7b7", tint: "rgba(52,211,153,0.10)", line: "rgba(52,211,153,0.35)", Icon: Sparkles },
  question: { label: "Question", dot: "#fbbf24", text: "#fcd34d", tint: "rgba(251,191,36,0.10)", line: "rgba(251,191,36,0.35)", Icon: MessageCircleQuestion },
  not_interested: { label: "Not interested", dot: "#ff4d6d", text: "#ff8fa3", tint: "rgba(255,77,109,0.10)", line: "rgba(255,77,109,0.35)", Icon: XCircle },
  unsubscribe: { label: "Unsubscribed", dot: "#71717a", text: "#a1a1aa", tint: "rgba(255,255,255,0.04)", line: "rgba(255,255,255,0.14)", Icon: Ban },
  other: { label: "Other", dot: "#e4e4e7", text: "#e4e4e7", tint: "rgba(255,255,255,0.05)", line: "rgba(255,255,255,0.16)", Icon: Mail },
  awaiting_reply: { label: "Awaiting", dot: "#71717a", text: "#a1a1aa", tint: "rgba(255,255,255,0.03)", line: "rgba(255,255,255,0.12)", Icon: Clock },
  no_email: { label: "No email", dot: "#fbbf24", text: "#fcd34d", tint: "rgba(251,191,36,0.08)", line: "rgba(251,191,36,0.30)", Icon: MailX },
};
const metaFor = (cls) => CLASS_META[cls] || CLASS_META.other;

function StatusPill({ cls, label, large = false }) {
  const m = metaFor(cls);
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border whitespace-nowrap ${large ? "text-xs px-3 py-1" : "text-[11px] px-2 py-0.5"}`}
      style={{ color: m.text, background: m.tint, borderColor: m.line }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
      {label || m.label}
    </span>
  );
}

export default function AcquisitionStep4Review({
  cancelEditEmail,
  editingEmailCreatorId,
  generateCreatorAvatarSvg,
  getCreatorAvatar,
  getCreatorReply,
  handleApproveCreator,
  handleClearScopedCreator,
  handleRejectCreator,
  handleSynthesizeStep5Ai,
  notify,
  pollingImap,
  replyFilter,
  saveEditEmail,
  scopedCreatorId,
  scopedIndividualCreator,
  selectedCreatorId,
  setActiveStep,
  setReplyFilter,
  setSelectedCreatorId,
  setTempEmailValue,
  startEditEmail,
  syncImapReplies,
  tempEmailValue,
  unlaunchedCreators,
}) {
  // When scoped to an individual from CRM / deep link, only show that 1 creator
  const step4Source = scopedIndividualCreator ? [scopedIndividualCreator] : unlaunchedCreators;

  const creatorsWithReplies = step4Source.map((c) => ({ ...c, replyInfo: getCreatorReply(c) }));
  const countOf = (cls) => creatorsWithReplies.filter((c) => c.replyInfo.classification === cls).length;

  const filters = [
    { id: "all", label: "All", count: creatorsWithReplies.length },
    { id: "interested", label: "Interested", count: countOf("interested") },
    { id: "question", label: "Questions", count: countOf("question") },
    { id: "awaiting_reply", label: "Awaiting", count: countOf("awaiting_reply") },
    { id: "not_interested", label: "Not interested", count: countOf("not_interested") },
    { id: "no_email", label: "No email", count: countOf("no_email") },
    { id: "unsubscribe", label: "Unsubscribed", count: countOf("unsubscribe") },
    { id: "other", label: "Other", count: countOf("other") },
  ];
  const interestedCount = countOf("interested");
  const repliedCount = creatorsWithReplies.filter((c) => c.replyInfo.hasRealReply).length;

  const filteredReplies = scopedIndividualCreator
    ? creatorsWithReplies
    : creatorsWithReplies.filter((c) => replyFilter === "all" || c.replyInfo.classification === replyFilter);

  const rawActiveReviewCreator =
    creatorsWithReplies.find((c) => c.id === selectedCreatorId || c.id === scopedCreatorId) ||
    creatorsWithReplies.find((c) => c.handle && (c.handle === selectedCreatorId || c.handle === scopedCreatorId)) ||
    filteredReplies[0] ||
    creatorsWithReplies[0] ||
    (scopedIndividualCreator ? { ...scopedIndividualCreator, replyInfo: getCreatorReply(scopedIndividualCreator) } : null);

  const activeReviewCreator = rawActiveReviewCreator
    ? { ...rawActiveReviewCreator, replyInfo: rawActiveReviewCreator.replyInfo || getCreatorReply(rawActiveReviewCreator) }
    : null;

  const activeReply = activeReviewCreator
    ? activeReviewCreator.replyInfo || getCreatorReply(activeReviewCreator)
    : { classification: "awaiting_reply", sentiment: "neutral", reasoning: "Awaiting response", hasRealReply: false };

  const avatarOf = (c) => (
    <img
      src={getCreatorAvatar(c)}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = generateCreatorAvatarSvg(c?.name || c?.display_name || c?.handle);
      }}
      alt=""
      className="w-full h-full rounded-full object-cover"
    />
  );

  const isActiveApproved = activeReviewCreator && (activeReviewCreator.status === "approved" || activeReviewCreator.isApproved);
  const isActiveRejected = activeReviewCreator && (activeReviewCreator.status === "rejected" || activeReviewCreator.isRejected);

  return (
    <div className="acq-card p-5 sm:p-7 space-y-6 text-white">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF4D6D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] shadow-[0_0_10px_rgba(255,77,109,0.9)]" />
            Step 04 · Interested review
          </span>
          <h2 className="m-0 text-xl sm:text-2xl font-bold tracking-tight text-white">Creator replies</h2>
          <p className="m-0 text-sm text-[#A1A1AA]">
            {scopedIndividualCreator ? (
              <>Focused review for <span className="text-white font-semibold">{scopedIndividualCreator.name || scopedIndividualCreator.handle}</span>.</>
            ) : (
              <>
                <span className="text-white font-semibold">{repliedCount}</span> replied ·{" "}
                <span className="text-emerald-400 font-semibold">{interestedCount}</span> interested and ready to approve
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => syncImapReplies(true)}
          disabled={pollingImap}
          className="h-11 px-4 bg-[#111114] hover:bg-[#1C1C20] text-[#D4D4D8] hover:text-white border border-[#2a2a30] hover:border-[#3a3a42] font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 self-start lg:self-auto"
          title="Check inbox for new creator replies"
        >
          <RefreshCw className={`w-4 h-4 ${pollingImap ? "animate-spin" : ""}`} />
          <span>{pollingImap ? "Checking inbox…" : "Sync replies"}</span>
        </button>
      </div>

      {/* ── Scoped focus banner ── */}
      {scopedIndividualCreator && (
        <div className="acq-pop flex items-center justify-between gap-3 px-4 py-3 bg-[#1A0F12] border border-[#C81E3C]/40 text-sm">
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#FF4D6D] shrink-0 animate-pulse" />
            <span className="truncate text-[#D4D4D8]">
              Focused on <strong className="text-white">{scopedIndividualCreator.name || scopedIndividualCreator.display_name || scopedIndividualCreator.handle}</strong> from the CRM
            </span>
          </span>
          <button
            type="button"
            onClick={handleClearScopedCreator}
            className="shrink-0 h-8 px-3 text-xs font-semibold bg-[#111114] hover:bg-[#1C1C20] border border-[#2a2a30] text-white cursor-pointer"
          >
            View all leads
          </button>
        </div>
      )}

      {/* ── Classification filter ── */}
      {!scopedIndividualCreator && (
        <div className="flex gap-1 p-1 bg-[#050506] border border-[#222227] overflow-x-auto" role="group" aria-label="Filter replies">
          {filters.map((f) => {
            const active = replyFilter === f.id;
            const m = f.id === "all" ? null : metaFor(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setReplyFilter(f.id)}
                className={`shrink-0 inline-flex items-center gap-2 h-9 px-3 text-[13px] font-semibold border transition-colors cursor-pointer ${
                  active
                    ? "text-white border-[#FF4D6D]/55 bg-gradient-to-b from-[#C81E3C]/30 to-[#C81E3C]/10"
                    : "text-[#A1A1AA] border-transparent hover:text-white hover:bg-[#141417]"
                }`}
              >
                {m && <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />}
                {f.label}
                <span className={`text-[11px] tabular-nums px-1.5 ${active ? "text-white bg-white/15" : "text-[#71717A] bg-[#141417]"}`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Master / detail ── */}
      {filteredReplies.length === 0 ? (
        <div className="acq-pop text-center py-16 px-6 bg-[#0C0C0E] border border-dashed border-[#2a2a30] space-y-2">
          <Inbox className="w-7 h-7 mx-auto text-[#71717A]" />
          <p className="m-0 text-sm font-semibold text-white">Nothing in this category yet</p>
          <p className="m-0 text-xs text-[#71717A] max-w-sm mx-auto">
            When creators reply to your outreach, use <strong className="text-white">Sync replies</strong> to pull and classify them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: list */}
          <div className="lg:col-span-5 max-h-[680px] overflow-y-auto pr-1">
            <ul className="acq-stagger list-none m-0 p-0 space-y-2">
              {filteredReplies.map((c) => {
                const isSelected = activeReviewCreator?.id === c.id;
                const reply = c.replyInfo;
                const isApproved = c.status === "approved";
                const isRejected = c.status === "rejected";
                const cls = reply.classification;
                const m = metaFor(cls);

                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCreatorId(c.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`acq-lift relative w-full text-left p-3.5 border cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-gradient-to-br from-[#C81E3C]/20 to-[#0C0C0E] border-[#FF4D6D]/55"
                          : "bg-[#0C0C0E] border-[#222227] hover:border-[#3a3a42]"
                      } ${isRejected ? "opacity-55" : ""}`}
                    >
                      {isSelected && <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#FF4D6D]" aria-hidden="true" />}
                      <div className="flex items-center gap-3">
                        <span className="relative w-10 h-10 shrink-0">
                          {avatarOf(c)}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0C0C0E]" style={{ background: isApproved ? "#34d399" : isRejected ? "#ff4d6d" : m.dot }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="m-0 text-sm font-semibold text-white truncate">{c.name || c.display_name}</p>
                            <span className="text-[11px] text-[#71717A] shrink-0">{reply.time || "Recently"}</span>
                          </div>
                          <p className="m-0 text-xs text-[#71717A] truncate">@{c.handle?.replace(/^@/, "")} · {c.platform}</p>
                        </div>
                      </div>

                      <p className={`m-0 mt-2.5 text-[13px] leading-relaxed line-clamp-2 ${reply.hasRealReply ? "text-[#D4D4D8]" : "text-[#71717A] italic"}`}>
                        {reply.hasRealReply
                          ? `“${reply.snippet || reply.text}”`
                          : cls === "no_email"
                            ? "Outreach not sent: no public business email."
                            : "Outreach delivered. Waiting for a response."}
                      </p>

                      <div className="mt-2.5 flex items-center gap-2">
                        {isApproved ? (
                          <StatusPill cls="interested" label="Approved" />
                        ) : isRejected ? (
                          <StatusPill cls="not_interested" label="Rejected" />
                        ) : (
                          <StatusPill cls={cls} />
                        )}
                        {reply.hasRealReply && !isApproved && !isRejected && cls === "interested" && (
                          <span className="text-[11px] font-semibold text-emerald-400">Ready to approve</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: detail */}
          {activeReviewCreator && (
            <div key={activeReviewCreator.id} className="acq-slide-in lg:col-span-7 bg-[#0C0C0E] border border-[#222227] lg:sticky lg:top-24">
              {/* Identity */}
              <div className="p-5 flex items-start justify-between gap-4 border-b border-[#222227]">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-14 h-14 shrink-0 p-0.5 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#C81E3C]/30">
                    {avatarOf(activeReviewCreator)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="m-0 text-lg font-bold text-white truncate">{activeReviewCreator.name || activeReviewCreator.display_name}</h3>
                    <p className="m-0 text-xs text-[#A1A1AA] truncate">
                      @{(activeReviewCreator.handle || "").replace(/^@/, "")} · {activeReviewCreator.platform} ·{" "}
                      {activeReviewCreator.followerStr || activeReviewCreator.follower_count} followers
                    </p>
                  </div>
                </div>
                {isActiveApproved ? (
                  <StatusPill cls="interested" label="Approved" large />
                ) : isActiveRejected ? (
                  <StatusPill cls="not_interested" label="Rejected" large />
                ) : (
                  <StatusPill
                    cls={activeReply.classification}
                    large
                    label={activeReply.hasRealReply ? `AI: ${metaFor(activeReply.classification).label}` : activeReply.classification === "no_email" ? "No email" : "Awaiting reply"}
                  />
                )}
              </div>

              <div className="p-5 space-y-5">
                {/* Stats */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">Audience</span>
                    <span className="text-xs text-[#A1A1AA]">
                      Creator score <span className="text-white font-bold tabular-nums">{activeReviewCreator.creatorScore || 85}</span>/100
                    </span>
                  </div>
                  <dl className="acq-stagger grid grid-cols-3 sm:grid-cols-6 gap-px bg-[#222227] border border-[#222227] m-0">
                    {[
                      ["Followers", activeReviewCreator.followerStr || activeReviewCreator.follower_count || "N/A"],
                      ["Engagement", `${activeReviewCreator.engagement || activeReviewCreator.engagement_score || "4.2"}%`],
                      ["Niche fit", activeReviewCreator.nicheFit || activeReviewCreator.niche_fit || "95%"],
                      ["Cadence", activeReviewCreator.postingConsistency || activeReviewCreator.posting_consistency || "Weekly"],
                      ["Authentic", activeReviewCreator.audienceAuthenticity || activeReviewCreator.audience_authenticity || "92%"],
                      ["Commercial", activeReviewCreator.commercialPotential || activeReviewCreator.commercial_potential || "Strong"],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-[#111114] px-2 py-2.5 text-center">
                        <dt className="text-[10px] text-[#71717A] uppercase tracking-wider">{k}</dt>
                        <dd className="m-0 mt-0.5 text-sm font-bold text-white truncate">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {activeReviewCreator.bio && (
                  <p className="m-0 text-[13px] text-[#A1A1AA] leading-relaxed line-clamp-3 border-l-2 border-[#2a2a30] pl-3 italic">
                    {activeReviewCreator.bio}
                  </p>
                )}

                {/* Contact row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#A1A1AA]">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-[#FF4D6D] shrink-0" />
                    {editingEmailCreatorId === activeReviewCreator.id ? (
                      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="email"
                          value={tempEmailValue}
                          onChange={(e) => setTempEmailValue(e.target.value)}
                          onBlur={(e) => {
                            if (tempEmailValue.trim()) saveEditEmail(activeReviewCreator.id, e);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditEmail(activeReviewCreator.id, e);
                            if (e.key === "Escape") cancelEditEmail(e);
                          }}
                          className="w-48 h-8 px-2 text-[13px] text-white"
                          placeholder="creator@email.com"
                          aria-label="Creator email"
                          autoFocus
                        />
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={(e) => saveEditEmail(activeReviewCreator.id, e)} className="acq-btn-primary w-8 h-8 flex items-center justify-center" title="Save" aria-label="Save email">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={(e) => cancelEditEmail(e)} className="w-8 h-8 flex items-center justify-center bg-[#1C1C20] border border-[#2a2a30] text-[#A1A1AA] hover:text-white" title="Cancel" aria-label="Cancel">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ) : activeReviewCreator.email || activeReviewCreator.email_public ? (
                      <span className="text-white truncate">{activeReviewCreator.email || activeReviewCreator.email_public}</span>
                    ) : (
                      <button type="button" onClick={(e) => startEditEmail(activeReviewCreator.id, "", e)} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add email
                      </button>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Outreach {activeReviewCreator.outreach_sent ? "sent" : "pending"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Sentiment <span className="text-white capitalize">{activeReply.sentiment}</span>
                  </span>
                </div>

                {/* AI analysis */}
                <div className="px-4 py-3 bg-[#111114] border border-[#222227] border-l-2 border-l-[#FF4D6D]">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4D6D]" /> AI read
                  </p>
                  <p className="m-0 mt-1 text-[13px] text-[#D4D4D8] leading-relaxed">{activeReply.reasoning}</p>
                </div>

                {/* Conversation */}
                {activeReply.hasRealReply ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A1A1AA]">
                        <span className="text-white font-semibold">{activeReviewCreator.replyInfo.subject || "Re: Partnership inquiry"}</span>
                      </span>
                      <span className="text-[#71717A]">{activeReviewCreator.replyInfo.replyTime || "Recently"}</span>
                    </div>
                    <div className="acq-pop relative p-4 bg-[#141417] border border-[#2a2a30] text-[13px] text-[#E4E4E7] leading-relaxed">
                      <FormattedMarkdownBody
                        text={activeReviewCreator.replyInfo.snippet || activeReviewCreator.last_message || "Creator responded to outreach."}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-[#2a2a30]">
                    <Clock className="w-5 h-5 text-[#71717A] mx-auto" />
                    <p className="m-0 mt-2 text-sm font-semibold text-white">Waiting for a reply</p>
                    <p className="m-0 mt-1 text-xs text-[#71717A]">Replies appear here as soon as the inbox syncs.</p>
                  </div>
                )}
              </div>

              {/* Decision bar */}
              <div className="px-5 py-4 border-t border-[#222227] bg-[#050506] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">Decision</span>
                <div className="flex items-center gap-2.5 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => handleRejectCreator(activeReviewCreator.id)}
                    disabled={activeReviewCreator.status === "rejected"}
                    className="h-10 px-4 text-sm font-semibold border transition-colors cursor-pointer disabled:cursor-not-allowed text-[#FF8FA3] border-[#C81E3C]/40 bg-[#C81E3C]/[0.06] hover:bg-[#C81E3C]/20 hover:text-white disabled:opacity-50 disabled:hover:bg-[#C81E3C]/[0.06]"
                  >
                    {activeReviewCreator.status === "rejected" ? "Archived" : "Reject lead"}
                  </button>
                  {activeReviewCreator.status !== "rejected" &&
                    (() => {
                      const rInfo = activeReviewCreator.replyInfo || getCreatorReply(activeReviewCreator);
                      const isAiInterested =
                        rInfo?.classification === "interested" ||
                        ["qualified", "interested"].includes((activeReviewCreator.replyClassification || activeReviewCreator.reply_classification || "").toLowerCase());
                      const isApproved = activeReviewCreator.status === "approved";
                      const canApproveOrAdvance = isAiInterested || isApproved;
                      const isDeclined = rInfo?.classification === "not_interested" || rInfo?.classification === "unsubscribe";

                      if (isDeclined) {
                        return (
                          <span className="h-10 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" /> Declined, can't move to Step 5
                          </span>
                        );
                      }

                      return (
                        <button
                          type="button"
                          disabled={!canApproveOrAdvance}
                          onClick={() => {
                            if (!canApproveOrAdvance) {
                              notify("warning", "Approval Blocked", "Creator cannot be approved until AI flags their reply as interested.");
                              return;
                            }
                            handleApproveCreator(activeReviewCreator.id, activeReviewCreator);
                            setSelectedCreatorId(activeReviewCreator.id);
                            setActiveStep(5);
                            handleSynthesizeStep5Ai(activeReviewCreator);
                          }}
                          className={`h-10 px-5 inline-flex items-center gap-2 text-sm font-bold ${
                            canApproveOrAdvance
                              ? "acq-btn-primary acq-glow-pulse cursor-pointer"
                              : "bg-[#141417] text-[#71717A] border border-[#2a2a30] cursor-not-allowed"
                          }`}
                          title={canApproveOrAdvance ? "Accept lead and generate concepts in Step 5" : "Unlocks when the AI marks the reply as interested"}
                        >
                          {canApproveOrAdvance ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              {isApproved ? "View concepts" : "Approve & generate concepts"}
                              <ArrowRight className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" /> Waiting for interest
                            </>
                          )}
                        </button>
                      );
                    })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
