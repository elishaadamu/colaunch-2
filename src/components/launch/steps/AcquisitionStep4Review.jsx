import {
  Send,
  MessageSquare,
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
} from "lucide-react";
import FormattedMarkdownBody from "../FormattedMarkdownBody";

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
  const step4Source = scopedIndividualCreator
    ? [scopedIndividualCreator]
    : unlaunchedCreators;

  const creatorsWithReplies = step4Source.map((c) => ({
    ...c,
    replyInfo: getCreatorReply(c),
  }));

  const interestedCount = creatorsWithReplies.filter(
    (c) => c.replyInfo.classification === "interested",
  ).length;
  const questionCount = creatorsWithReplies.filter(
    (c) => c.replyInfo.classification === "question",
  ).length;
  const notInterestedCount = creatorsWithReplies.filter(
    (c) => c.replyInfo.classification === "not_interested",
  ).length;
  const unsubCount = creatorsWithReplies.filter(
    (c) => c.replyInfo.classification === "unsubscribe",
  ).length;
  const otherCount = creatorsWithReplies.filter(
    (c) => c.replyInfo.classification === "other",
  ).length;
  const awaitingCount = creatorsWithReplies.filter(
    (c) => c.replyInfo.classification === "awaiting_reply",
  ).length;
  const noEmailCount = creatorsWithReplies.filter(
    (c) => c.replyInfo.classification === "no_email",
  ).length;

  const filteredReplies = scopedIndividualCreator
    ? creatorsWithReplies
    : creatorsWithReplies.filter((c) => {
        if (replyFilter === "all") return true;
        return c.replyInfo.classification === replyFilter;
      });

  const rawActiveReviewCreator =
    creatorsWithReplies.find((c) => c.id === selectedCreatorId || c.id === scopedCreatorId) ||
    creatorsWithReplies.find((c) => c.handle && (c.handle === selectedCreatorId || c.handle === scopedCreatorId)) ||
    filteredReplies[0] ||
    creatorsWithReplies[0] ||
    (scopedIndividualCreator ? { ...scopedIndividualCreator, replyInfo: getCreatorReply(scopedIndividualCreator) } : null);

  const activeReviewCreator = rawActiveReviewCreator
    ? {
        ...rawActiveReviewCreator,
        replyInfo: rawActiveReviewCreator.replyInfo || getCreatorReply(rawActiveReviewCreator),
      }
    : null;

  const activeReply = activeReviewCreator
    ? (activeReviewCreator.replyInfo || getCreatorReply(activeReviewCreator))
    : { classification: "awaiting_reply", sentiment: "neutral", reasoning: "Awaiting response", hasRealReply: false };

  return (
    <div className="p-6 rounded-none bg-[#0D121F] border border-[#334155] shadow-none space-y-5 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#334155] pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
            <MessageSquare className="w-4 h-4 text-[#C81E3C]" />
            <span>
              Interested Creator Review ({filteredReplies.length})
            </span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {scopedIndividualCreator
              ? `Focused individual review for ${scopedIndividualCreator.name || scopedIndividualCreator.handle}.`
              : "Review incoming creator responses, qualify sentiment, and advance interested leads to Step 5."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => syncImapReplies(true)}
            disabled={pollingImap}
            className="px-3.5 py-1.5 rounded-none bg-[#131929] hover:bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
            title="Check inbox for new creator replies"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center text-[#94A3B8] ${pollingImap ? "animate-spin" : ""}`}
            />
            <span className="flex-shrink-0">Sync Replies</span>
          </button>
        </div>
      </div>

      {/* Scoped Individual Lead Focus Banner */}
      {scopedIndividualCreator && (
        <div className="flex items-center justify-between p-3.5 rounded-none bg-[#131929] border border-[#334155] text-white text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-none bg-[#C81E3C] flex-shrink-0" />
            <span className="truncate">
              Focused on individual lead from CRM: <strong>{scopedIndividualCreator.name || scopedIndividualCreator.display_name || scopedIndividualCreator.handle}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearScopedCreator}
            className="px-3 py-1 rounded-none bg-[#1E293B] border border-[#334155] hover:bg-[#2A344A] text-white font-semibold transition cursor-pointer text-xs flex-shrink-0"
          >
            ← View All Leads
          </button>
        </div>
      )}

      {/* AI Response Classification Interactive Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <button
          type="button"
          onClick={() => setReplyFilter("all")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "all"
              ? "bg-[#C81E3C] border-[#C81E3C] text-white"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">
              All Leads
            </span>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "all" ? "bg-white/20 text-white" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {creatorsWithReplies.length}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReplyFilter("interested")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "interested"
              ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[11px] font-bold">
                Interested
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "interested" ? "bg-cyan-900/60 text-cyan-200 border border-cyan-500/30" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {interestedCount}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReplyFilter("question")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "question"
              ? "bg-amber-950/60 border-amber-500/60 text-amber-300 font-bold"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-bold">
                Question
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "question" ? "bg-amber-900/60 text-amber-200 border border-amber-500/30" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {questionCount}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReplyFilter("not_interested")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "not_interested"
              ? "bg-rose-950/60 border-rose-500/60 text-rose-300 font-bold"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[11px] font-bold">
                Not Interested
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "not_interested" ? "bg-rose-900/60 text-rose-200 border border-rose-500/30" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {notInterestedCount}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReplyFilter("unsubscribe")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "unsubscribe"
              ? "bg-[#1E293B] border-slate-500 text-slate-200 font-bold"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-[11px] font-bold">
                Unsubscribe
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "unsubscribe" ? "bg-[#0D121F] text-slate-300 border border-[#334155]" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {unsubCount}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReplyFilter("other")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "other"
              ? "bg-indigo-950/60 border-indigo-500/60 text-indigo-300 font-bold"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-[11px] font-bold">
                Other
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "other" ? "bg-indigo-900/60 text-indigo-200 border border-indigo-500/30" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {otherCount}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReplyFilter("awaiting_reply")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "awaiting_reply"
              ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-[11px] font-bold">
                Awaiting
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "awaiting_reply" ? "bg-cyan-900/60 text-cyan-200 border border-cyan-500/30" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {awaitingCount}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReplyFilter("no_email")}
          className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${replyFilter === "no_email"
              ? "bg-amber-950/60 border-amber-500/60 text-amber-300 font-bold"
              : "bg-[#0D121F] hover:bg-[#131929] border-[#334155] text-[#94A3B8] hover:text-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold">
                No Email
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none ${replyFilter === "no_email" ? "bg-amber-900/60 text-amber-200 border border-amber-500/30" : "bg-[#131929] text-[#94A3B8] border border-[#334155]"}`}>
              {noEmailCount}
            </span>
          </div>
        </button>
      </div>

      {/* Master-Detail Split Layout */}
      {filteredReplies.length === 0 ? (
        <div className="text-center py-16 text-[#94A3B8] text-xs bg-[#0D121F] rounded-none border border-[#334155] space-y-2">
          <p className="font-semibold text-white">No creators matching this category filter.</p>
          <p className="text-[#64748B] text-[11px]">
            When creators reply to your outreach emails, click{" "}
            <strong className="text-white">"Sync Replies"</strong> to fetch and classify
            their responses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Replies List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredReplies.map((c) => {
              const isSelected = activeReviewCreator?.id === c.id;
              const reply = c.replyInfo;
              const isApproved = c.status === "approved";
              const isRejected = c.status === "rejected";

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCreatorId(c.id)}
                  className={`p-3.5 rounded-none border transition-all cursor-pointer space-y-2.5 ${isSelected
                      ? "bg-[#141C2E] border-2 border-[#C81E3C] shadow-sm"
                      : isApproved
                        ? "bg-[#0D121F] border border-cyan-500/40 hover:border-cyan-500"
                        : isRejected
                          ? "bg-[#0D121F] border border-rose-900/40 opacity-60 hover:opacity-90"
                          : "bg-[#0D121F] border border-[#334155] hover:border-slate-500 hover:bg-[#131929]"
                    }`}
                >
                  {/* Card Header: Avatar, Name/Handle & Classification Badge */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={getCreatorAvatar(c)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = generateCreatorAvatarSvg(c.name || c.display_name || c.handle);
                        }}
                        alt=""
                        className="w-9 h-9 rounded-none object-cover border border-[#334155] bg-[#131929] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate font-display">
                          {c.name || c.display_name}
                        </h4>
                        <p className="text-[11px] text-[#94A3B8] truncate font-mono">
                          @{c.handle?.replace(/^@/, "")} • {c.platform}
                        </p>
                      </div>
                    </div>

                    {/* Classification Status Badge */}
                    {isApproved ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1 flex-shrink-0 border bg-cyan-950/40 text-cyan-400 border-cyan-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Approved</span>
                      </span>
                    ) : isRejected ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1 flex-shrink-0 border bg-rose-950/40 text-rose-400 border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Rejected</span>
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1 flex-shrink-0 border ${reply.classification === "interested"
                            ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
                            : reply.classification === "question"
                              ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                              : reply.classification === "not_interested"
                                ? "bg-rose-950/40 text-rose-400 border-rose-500/30"
                                : reply.classification === "unsubscribe"
                                  ? "bg-[#131929] text-[#94A3B8] border-[#334155]"
                                  : reply.classification === "no_email"
                                    ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                                    : "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${reply.classification === "interested"
                              ? "bg-cyan-400"
                              : reply.classification === "question"
                                ? "bg-amber-400"
                                : reply.classification === "not_interested"
                                  ? "bg-rose-400"
                                  : reply.classification === "unsubscribe"
                                    ? "bg-slate-400"
                                    : reply.classification === "no_email"
                                      ? "bg-amber-400"
                                      : "bg-cyan-400"
                            }`}
                        />
                        <span className="capitalize">
                          {reply.classification === "no_email"
                            ? "No Email"
                            : reply.classification.replace("_", " ")}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Message snippet bubble */}
                  {reply.hasRealReply ? (
                    <div className="p-2.5 rounded-none bg-[#131929] border border-[#334155]">
                      <p className="text-[11px] text-white line-clamp-2 italic leading-relaxed font-sans">
                        "{reply.snippet || reply.text}"
                      </p>
                    </div>
                  ) : reply.classification === "no_email" ? (
                    <div className="p-2.5 rounded-none bg-[#1A1412] border border-amber-900/50">
                      <p className="text-[11px] text-amber-300 italic font-sans flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Outreach not sent. No public business email.</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-none bg-[#131929]/50 border border-[#334155]">
                      <p className="text-[11px] text-[#94A3B8] italic font-sans">
                        Outreach delivered. Awaiting creator response.
                      </p>
                    </div>
                  )}

                  {/* Footer: Timestamp & Approval Status */}
                  <div className="flex items-center justify-between text-[10px] text-[#94A3B8] pt-2 border-t border-[#1E293B]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-[#64748B]" />
                      <span>{reply.time || "Recently"}</span>
                    </span>
                    {isApproved ? (
                      <span className="text-cyan-400 text-[10px] font-bold bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-none flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Approved
                      </span>
                    ) : isRejected ? (
                      <span className="text-rose-400 text-[10px] font-bold bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-none flex items-center gap-1 uppercase tracking-wider">
                        <XCircle className="w-3 h-3 text-rose-400" /> Rejected
                      </span>
                    ) : reply.hasRealReply ? (
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        Ready for Review
                      </span>
                    ) : (
                      <span className="text-[#64748B] font-medium font-mono">
                        Awaiting Response
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Full Conversation & Decision View */}
          {activeReviewCreator && (
            <div className="lg:col-span-7 p-5 rounded-none bg-[#0D121F] border border-[#334155] space-y-4 shadow-none">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#334155] pb-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getCreatorAvatar(activeReviewCreator)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = generateCreatorAvatarSvg(activeReviewCreator?.name || activeReviewCreator?.display_name || activeReviewCreator?.handle);
                    }}
                    alt=""
                    className="w-12 h-12 rounded-none object-cover border border-[#334155] bg-[#131929]"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate font-display">
                      {activeReviewCreator.name ||
                        activeReviewCreator.display_name}
                    </h3>
                    <p className="text-xs text-[#94A3B8] font-mono">
                      {activeReviewCreator.handle} •{" "}
                      {activeReviewCreator.platform} •{" "}
                      {activeReviewCreator.followerStr ||
                        activeReviewCreator.follower_count}{" "}
                      followers
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(activeReviewCreator.status === "approved" || activeReviewCreator.isApproved) ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-none border flex items-center gap-1.5 bg-cyan-950/40 text-cyan-400 border-cyan-500/30">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Approved • Qualified</span>
                    </span>
                  ) : (activeReviewCreator.status === "rejected" || activeReviewCreator.isRejected) ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-none border flex items-center gap-1.5 bg-rose-950/40 text-rose-400 border-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Rejected • Archived</span>
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-none border flex items-center gap-1.5 ${activeReply.classification ===
                          "interested"
                          ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
                          : activeReply.classification === "question"
                            ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                            : activeReply.classification === "not_interested"
                              ? "bg-rose-950/40 text-rose-400 border-rose-500/30"
                              : activeReply.classification === "unsubscribe"
                                ? "bg-[#131929] text-[#94A3B8] border-[#334155]"
                                : activeReply.classification === "no_email"
                                  ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                                  : "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
                        }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${activeReply.classification ===
                            "interested"
                            ? "bg-cyan-400"
                            : activeReply.classification === "question"
                              ? "bg-amber-400"
                              : activeReply.classification === "not_interested"
                                ? "bg-rose-400"
                                : activeReply.classification === "unsubscribe"
                                  ? "bg-slate-400"
                                  : activeReply.classification === "no_email"
                                    ? "bg-amber-400"
                                    : "bg-cyan-400"
                          }`}
                      />
                      <span className="capitalize">
                        {activeReply.hasRealReply
                          ? `AI: ${activeReply.classification.replace("_", " ")}`
                          : activeReply.classification === "no_email"
                            ? "No Email Set"
                            : "Awaiting Reply"}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* ── Creator Profile + Audience Stats Card ── */}
              <div className="p-4 rounded-none bg-[#131929] border border-[#334155] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                    Creator Profile & Audience
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-0.5 rounded-none">
                    Creator Score: {activeReviewCreator.creatorScore || 85}/100
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  <div className="p-2 rounded-none bg-[#0D121F] border border-[#334155] text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wider font-semibold">Followers</span>
                    <span className="text-xs font-bold text-white font-mono">{activeReviewCreator.followerStr || activeReviewCreator.follower_count || "N/A"}</span>
                  </div>
                  <div className="p-2 rounded-none bg-[#0D121F] border border-[#334155] text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wider font-semibold">Engagement</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">{activeReviewCreator.engagement || activeReviewCreator.engagement_score || "4.2"}%</span>
                  </div>
                  <div className="p-2 rounded-none bg-[#0D121F] border border-[#334155] text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wider font-semibold">Niche Fit</span>
                    <span className="text-xs font-bold text-white font-mono">{activeReviewCreator.nicheFit || activeReviewCreator.niche_fit || "95% Match"}</span>
                  </div>
                  <div className="p-2 rounded-none bg-[#0D121F] border border-[#334155] text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wider font-semibold">Consistency</span>
                    <span className="text-xs font-bold text-white font-mono">{activeReviewCreator.postingConsistency || activeReviewCreator.posting_consistency || "Weekly"}</span>
                  </div>
                  <div className="p-2 rounded-none bg-[#0D121F] border border-[#334155] text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wider font-semibold">Authenticity</span>
                    <span className="text-xs font-bold text-white font-mono">{activeReviewCreator.audienceAuthenticity || activeReviewCreator.audience_authenticity || "92%"}</span>
                  </div>
                  <div className="p-2 rounded-none bg-[#0D121F] border border-[#334155] text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wider font-semibold">Commercial</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">{activeReviewCreator.commercialPotential || activeReviewCreator.commercial_potential || "Strong"}</span>
                  </div>
                </div>

                {/* Bio / Relevant Content */}
                {activeReviewCreator.bio && (
                  <div className="p-2.5 rounded-none bg-[#0D121F] border border-[#334155]">
                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wider mb-1 font-semibold">Relevant Content / Bio</span>
                    <p className="text-[11px] text-[#CBD5E1] leading-relaxed line-clamp-3 italic">"{activeReviewCreator.bio}"</p>
                  </div>
                )}

                {/* Outreach History Summary */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#94A3B8] pt-2 border-t border-[#334155]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#C81E3C]" />
                    <strong className="text-white">Email:</strong>
                    {editingEmailCreatorId === activeReviewCreator.id ? (
                      <span className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="email"
                          value={tempEmailValue}
                          onChange={e => setTempEmailValue(e.target.value)}
                          onBlur={e => {
                            if (tempEmailValue.trim()) {
                              saveEditEmail(activeReviewCreator.id, e);
                            }
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditEmail(activeReviewCreator.id, e); if (e.key === 'Escape') cancelEditEmail(e); }}
                          className="w-40 px-1.5 py-0.5 rounded-none bg-[#070A12] border border-[#334155] text-white text-[11px] font-mono focus:outline-none focus:border-[#C81E3C]"
                          placeholder="creator@email.com"
                          autoFocus
                        />
                        <button type="button" onClick={e => saveEditEmail(activeReviewCreator.id, e)} className="p-0.5 rounded-none bg-[#C81E3C] hover:bg-[#B01732] text-white" title="Save">
                          <Check className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={e => cancelEditEmail(e)} className="p-0.5 rounded-none bg-[#1E293B] hover:bg-[#2A344A] text-[#94A3B8] hover:text-white" title="Cancel">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : (activeReviewCreator.email || activeReviewCreator.email_public) ? (
                      <span className="text-white font-mono font-medium">{activeReviewCreator.email || activeReviewCreator.email_public}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={e => startEditEmail(activeReviewCreator.id, '', e)}
                        className="text-[#FF4D6D] hover:underline font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Email</span>
                      </button>
                    )}
                  </span>
                  <span className="text-[#334155]">|</span>
                  <span className="flex items-center gap-1">
                    <Send className="w-3 h-3 text-[#94A3B8]" />
                    <strong className="text-white">Outreach:</strong> {activeReviewCreator.outreach_sent ? "Sent" : "Pending"}
                  </span>
                  <span className="text-[#334155]">|</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#94A3B8]" />
                    <strong className="text-white">Platform:</strong> {activeReviewCreator.platform}
                  </span>
                </div>
              </div>

              {/* AI Classification Analysis Box */}
              <div className="p-3.5 rounded-none bg-[#131929] border border-[#334155] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#94A3B8]">
                    Status:{" "}
                    <strong
                      className={
                        activeReply.hasRealReply
                          ? "text-cyan-400"
                          : activeReply.classification === "no_email"
                            ? "text-amber-400"
                            : "text-cyan-400"
                      }
                    >
                      {activeReply.hasRealReply
                        ? "Reply Received"
                        : activeReply.classification === "no_email"
                          ? "Email Needed"
                          : "Waiting for Response"}
                    </strong>
                  </span>
                  <span className="text-[#94A3B8]">
                    Sentiment:{" "}
                    <strong className="text-white capitalize">
                      {activeReply.sentiment}
                    </strong>
                  </span>
                </div>
                <p className="text-[#CBD5E1] text-[11px] leading-relaxed">
                  <strong className="text-white">Analysis:</strong>{" "}
                  {activeReply.reasoning}
                </p>
              </div>

              {/* Inbound Creator Response / Conversation Stream */}
              <div className="space-y-3">
                {activeReply.hasRealReply ? (
                  <div className="p-4 rounded-none bg-[#131929] border border-[#334155] space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[#334155] pb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={getCreatorAvatar(activeReviewCreator)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = generateCreatorAvatarSvg(activeReviewCreator?.name || activeReviewCreator?.display_name || activeReviewCreator?.handle);
                          }}
                          alt=""
                          className="w-5 h-5 rounded-none object-cover border border-[#334155]"
                        />
                        <span className="font-bold text-white text-xs font-display">
                          {activeReviewCreator.name ||
                            activeReviewCreator.display_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-none bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono flex items-center gap-1 font-bold">
                          <span>✨ Inbound Response</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {activeReviewCreator.replyInfo.replyTime || "Recently"}
                      </span>
                    </div>
                    <p className="text-[#CBD5E1] font-mono text-[11px]">
                      <strong className="text-white">Subject:</strong>{" "}
                      {activeReviewCreator.replyInfo.subject || "Re: Partnership Inquiry"}
                    </p>
                    <div className="p-3.5 rounded-none bg-[#0D121F] border border-[#334155] text-xs text-white font-mono">
                      <FormattedMarkdownBody
                        text={
                          activeReviewCreator.replyInfo.snippet ||
                          activeReviewCreator.last_message ||
                          "Creator responded to outreach."
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-none bg-[#131929]/40 border border-[#334155] text-center space-y-1.5 py-6">
                    <Clock className="w-5 h-5 text-[#64748B] mx-auto" />
                    <p className="text-xs font-semibold text-white">
                      Awaiting Creator Response
                    </p>
                    <p className="text-[11px] text-[#94A3B8] max-w-sm mx-auto">
                      Outreach email was delivered. Inbound replies will appear here in real-time.
                    </p>
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#334155]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                    Lead Decision
                  </span>
                  {activeReviewCreator.status === "approved" && (
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-none flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Approved
                    </span>
                  )}
                  {activeReviewCreator.status === "rejected" && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-none flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-400" /> Rejected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRejectCreator(activeReviewCreator.id)}
                    disabled={activeReviewCreator.status === "rejected"}
                    className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer border ${activeReviewCreator.status === "rejected"
                        ? "bg-rose-950/20 text-rose-500/50 border-rose-950/40 cursor-not-allowed"
                        : "bg-[#1A111E] hover:bg-[#2A1420] text-[#FF4D6D] hover:text-white border border-rose-900/60 hover:border-[#C81E3C] active:scale-95"
                      }`}
                  >
                    {activeReviewCreator.status === "rejected" ? "Archived (Rejected)" : "Reject Lead"}
                  </button>
                  {/* Accept & Advance to Step 5 Button */}
                  {activeReviewCreator.status !== "rejected" && (() => {
                    const rInfo = activeReviewCreator.replyInfo || getCreatorReply(activeReviewCreator);
                    const isAiInterested =
                      rInfo?.classification === "interested" ||
                      ["qualified", "interested"].includes((activeReviewCreator.replyClassification || activeReviewCreator.reply_classification || "").toLowerCase());
                    const isApproved = activeReviewCreator.status === "approved";
                    const canApproveOrAdvance = isAiInterested || isApproved;
                    const isDeclined = rInfo?.classification === "not_interested" || rInfo?.classification === "unsubscribe";

                    if (isDeclined) {
                      return (
                        <span className="text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-500/40 px-3 py-1.5 rounded-none flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Uninterested (Blocked from Step 5)</span>
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
                        className={`relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-none text-xs font-bold shadow-md transition-all ${!canApproveOrAdvance
                            ? "bg-[#131929] text-[#64748B] border border-[#334155] cursor-not-allowed"
                            : "bg-[#C81E3C] hover:bg-[#B01732] text-white active:scale-[0.98] cursor-pointer"
                          }`}
                        title={
                          !canApproveOrAdvance
                            ? "Locked: Creator cannot be approved until AI flags their inbound reply as interested"
                            : "Accept lead and advance to Step 5 Product Studio"
                        }
                      >
                        {!canApproveOrAdvance ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>Awaiting AI Interest Flag</span>
                          </>
                        ) : (
                          <>
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            <span>
                              {isApproved
                                ? "View Concepts in Step 5"
                                : "Accept & Advance to Step 5"}
                            </span>
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
