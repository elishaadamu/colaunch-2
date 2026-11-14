import { createPortal } from "react-dom";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Clock,
  Copy,
  Check,
  ExternalLink,
  X,
  Rocket,
  Lightbulb,
  Loader2,
  RotateCcw,
  Heart,
} from "lucide-react";
import CustomizedDeckModal from "../CustomizedDeckModal";
import ClientProfileModal from "../ClientProfileModal";
import Step5ProposalEmailModal from "../Step5ProposalEmailModal";
import AdminPipelineLookup from "../AdminPipelineLookup";
import ActionNotificationToast from "../../ui/ActionNotificationToast";
import ConfirmationModal from "../../ui/ConfirmationModal";
import { PARTNERSHIP_EMAIL, VENTURE_ARTIFACTS } from "./acquisitionConstants";

export default function AcquisitionModals({
  activeArtifactTab,
  aiDetectedChoiceMap,
  answerSentMap,
  applyAutoDraft,
  artifactCopied,
  awaitingCreators,
  creatorBrandColorMap,
  creatorConceptSelectionMap,
  creators,
  customPitchBody,
  customPitchSubject,
  decisionModal,
  dismissToast,
  editingConcept,
  editingConceptIndex,
  ensureCreatorConcepts,
  executeDeleteAllCreators,
  generateCreatorAvatarSvg,
  getCreatorAudienceIntelligence,
  getCreatorAvatar,
  getCreatorReply,
  getCreatorThreadMessages,
  getStep5EmailData,
  handleApplyScopedUrl,
  handleAutonomousResend,
  handleClearScopedCreator,
  handleConfirmDecisionModal,
  handleGenerateDecisionAi,
  handleModifyReplyClassification,
  handlePitchAndCreateProject,
  handleSaveConcept,
  handleSelectConcept,
  handleSendBlueprintAndAdvanceToStep6,
  hunterDataMap,
  inputUrlCreatorId,
  inputUrlTargetStep,
  interestedCreators,
  isDeletingAll,
  isLaunchingProject,
  isSendingPitch,
  launchStepIndex,
  notify,
  persuasionSentMap,
  pitchSentMap,
  pollingImap,
  realThreads,
  scopedCreatorId,
  scopedIndividualCreator,
  selectedConceptId,
  selectedCreator,
  setActiveArtifactTab,
  setActiveStep,
  setArtifactCopied,
  setCustomPitchBody,
  setCustomPitchSubject,
  setDecisionModal,
  setEditingConcept,
  setEditingConceptIndex,
  setInputUrlCreatorId,
  setInputUrlTargetStep,
  setSelectedConceptId,
  setSelectedCreatorId,
  setShowAdminLookup,
  setShowAwaitingModal,
  setShowClientProfileModal,
  setShowDeleteConfirmModal,
  setShowInterestedModal,
  setShowResetUrlModal,
  setShowSetUrlModal,
  setShowStep5EmailModal,
  setViewingDeckConcept,
  showAdminLookup,
  showAwaitingModal,
  showClientProfileModal,
  showDeleteConfirmModal,
  showInterestedModal,
  showResetUrlModal,
  showSetUrlModal,
  showStep5EmailModal,
  syncImapReplies,
  toasts,
  unlaunchedCreators,
  viewingDeckConcept,
  viewingDeckIndex,
}) {
  return (
    <>
  {/* ── Interested & Qualified Creators Modal ───────────────────────────────── */}
  {showInterestedModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Interested & Qualified Creators ({interestedCreators.length}
                )
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              These creators replied with interest or have been approved.
              Click any creator to jump straight to their distinct proposal & concepts!
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => syncImapReplies(true)}
              disabled={pollingImap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer flex-shrink-0 disabled:opacity-50 shadow-2xs"
              title="Check inbox for replies"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center ${pollingImap ? "animate-spin text-emerald-600" : "text-slate-400"}`}
              />
              <span className="flex-shrink-0">Sync Inbox</span>
            </button>
            <button
              type="button"
              onClick={() => setShowInterestedModal(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {interestedCreators.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No creators marked as interested yet. Once a creator replies
              or is qualified, they will automatically appear here!
            </div>
          ) : (
            interestedCreators.map((c) => {
              const replyInfo = getCreatorReply(c);
              const emailVal = c.email || c.email_public || "";
              const pitchSent = Boolean(pitchSentMap[c.id]);
              const choice = aiDetectedChoiceMap[c.id];
              const isCurrentlySelected = selectedCreator?.id === c.id;

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${isCurrentlySelected
                      ? "bg-white border-emerald-300 ring-1 ring-emerald-300 shadow-xs"
                      : "bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-2xs"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatar}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = generateCreatorAvatarSvg(c?.name || c?.handle || "Creator");
                      }}
                      alt=""
                      className="w-11 h-11 rounded-none object-cover border border-[#334155]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {c.name || c.display_name}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {c.handle}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700 font-mono">
                          {c.platform} • {c.followerStr || c.follower_count}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-emerald-700 font-mono text-[11px] font-medium">
                          {emailVal}
                        </span>
                        <span className="text-slate-300">•</span>
                        {pitchSent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                            <span>Proposal Dispatched</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-cyan-50 text-cyan-800 border-cyan-200 flex items-center gap-1">
                            <span>Ready to Pitch</span>
                          </span>
                        )}
                        {choice?.conceptName && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-800 border-teal-200">
                              Concept: {choice.conceptName}
                            </span>
                          </>
                        )}
                      </div>

                      {replyInfo.hasRealReply && replyInfo.text && (
                        <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 italic max-w-lg shadow-2xs">
                          "
                          {replyInfo.text.length > 140
                            ? replyInfo.text.slice(0, 140) + "..."
                            : replyInfo.text}
                          "
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCreatorId(c.id);
                        const savedConcept = creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null;
                        setSelectedConceptId(savedConcept);
                        setActiveStep(6);
                        setShowInterestedModal(false);
                      }}
                      className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${isCurrentlySelected
                          ? "bg-[#0F172A] text-white border border-slate-800"
                          : "bg-[#0F172A] hover:bg-[#1E293B] text-white border border-slate-800"
                        }`}
                    >
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>
                        {isCurrentlySelected
                          ? "Viewing in Pitch & Select"
                          : "Open in Pitch & Select →"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span>
            Click any creator above to isolate and preview their exact
            proposal & concepts.
          </span>
          <button
            type="button"
            onClick={() => setShowInterestedModal(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ── Awaiting Creator Replies Modal ────────────────────────────────────── */}
  {showAwaitingModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900">
                Awaiting Replies & Pending Leads
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              These creators have not replied with interest yet. Once they
              reply, they will automatically advance to Product Ideas & Proposal Pitch.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => syncImapReplies(true)}
              disabled={pollingImap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer flex-shrink-0 disabled:opacity-50 shadow-2xs"
              title="Check inbox for replies"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center ${pollingImap ? "animate-spin text-emerald-600" : "text-slate-400"}`}
              />
              <span className="flex-shrink-0">Sync Inbox</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAwaitingModal(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {awaitingCreators.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              All creators in this batch have replied and are qualified.
            </div>
          ) : (
            awaitingCreators.map((c) => {
              const replyInfo = getCreatorReply(c);
              const emailVal = c.email || c.email_public || "";
              const hasEmail = Boolean(emailVal && emailVal.includes("@"));
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatar}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = generateCreatorAvatarSvg(c?.name || c?.handle || "Creator");
                      }}
                      alt=""
                      className="w-10 h-10 rounded-none object-cover border border-[#334155]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {c.name || c.display_name}
                        </span>
                        <span className="text-slate-500">{c.handle}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700 font-mono">
                          {c.platform} • {c.followerStr || c.follower_count}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {hasEmail ? (
                          <span className="text-emerald-700 font-mono text-[11px] font-medium">
                            {emailVal}
                          </span>
                        ) : (
                          <span className="text-amber-800 text-[11px] italic">
                            No Email Address
                          </span>
                        )}
                        <span className="text-slate-300">•</span>
                        {replyInfo.hasRealReply ? (
                          replyInfo.classification === "not_interested" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                              <span>Declined / Not Interested</span>
                            </span>
                          ) : replyInfo.classification === "question" ||
                            replyInfo.classification === "more_info" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                              <span>Question / Asking for Info</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                              <span>Qualified / Interested</span>
                            </span>
                          )
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasEmail
                                ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                          >
                            {hasEmail
                              ? "⏳ Awaiting Reply"
                              : "No Email (Outreach Skipped)"}
                          </span>
                        )}
                      </div>
                      {replyInfo.hasRealReply && replyInfo.text && (
                        <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 italic max-w-lg shadow-2xs">
                          "
                          {replyInfo.text.length > 150
                            ? replyInfo.text.slice(0, 150) + "..."
                            : replyInfo.text}
                          "
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {replyInfo.classification === "question" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCreatorId(c.id);
                          setShowAwaitingModal(false);
                          setActiveStep(6);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>Answer Question</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleModifyReplyClassification(c.id, "interested");
                        setSelectedCreatorId(c.id);
                        const savedConcept = creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null;
                        setSelectedConceptId(savedConcept);
                        setActiveStep(6);
                        setShowAwaitingModal(false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Mark as Interested & Pitch</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>When creators reply to your email, they will automatically advance to product review.</span>
          </span>
          <button
            type="button"
            onClick={() => setShowAwaitingModal(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Admin Pipeline Oversight & Error Lookup Modal */}
  <AdminPipelineLookup
    isOpen={showAdminLookup}
    onClose={() => setShowAdminLookup(false)}
    creators={creators}
    realThreads={realThreads}
    pitchSentMap={pitchSentMap}
    answerSentMap={answerSentMap}
    persuasionSentMap={persuasionSentMap}
    onSelectCreator={(cid) => {
      setSelectedCreatorId(cid);
      setShowAdminLookup(false);
      setActiveStep(6);
    }}
    onTriggerFollowUp={(c) => {
      handleAutonomousResend(c);
    }}
    onForceLaunchProject={(c) => {
      setSelectedCreatorId(c.id);
      setShowAdminLookup(false);
      handlePitchAndCreateProject();
    }}
    onSyncImap={() => syncImapReplies(true)}
    isSyncing={pollingImap}
    onNotify={notify}
  />



  {/* ── Step 4 Decision & Optional Email Notification Modal ─────────────── */}
  {decisionModal.isOpen && decisionModal.creator && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${decisionModal.decisionType === "approve"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
            >
              {decisionModal.decisionType === "approve" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${decisionModal.decisionType === "approve"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                >
                  {decisionModal.decisionType === "approve"
                    ? "Accept Creator"
                    : "Reject Lead"}
                </span>
                <span className="text-xs text-slate-500">
                  • Step 4 Decision Review
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 font-display">
                {decisionModal.decisionType === "approve"
                  ? `Accept Partnership with ${decisionModal.creator.name || decisionModal.creator.display_name}`
                  : `Decline & Archive ${decisionModal.creator.name || decisionModal.creator.display_name}`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setDecisionModal((prev) => ({ ...prev, isOpen: false }))
            }
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Profile Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={
                decisionModal.creator.avatar ||
                decisionModal.creator.avatar_url ||
                generateCreatorAvatarSvg(decisionModal.creator?.handle || "Creator")
              }
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = generateCreatorAvatarSvg(decisionModal.creator?.handle || "Creator");
              }}
              alt=""
              className="w-10 h-10 rounded-none object-cover border border-[#334155] flex-shrink-0"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 truncate">
                {decisionModal.creator.name ||
                  decisionModal.creator.display_name}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {decisionModal.creator.handle} •{" "}
                {decisionModal.creator.platform} •{" "}
                {decisionModal.creator.followerStr ||
                  decisionModal.creator.follower_count}{" "}
                followers
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
              Email Address
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {decisionModal.creator.email ||
                decisionModal.creator.email_public ||
                "No email available"}
            </span>
          </div>
        </div>

        {/* Optional Email Notification Toggle & Composition */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={decisionModal.sendEmail}
                  onChange={(e) =>
                    setDecisionModal((prev) => ({
                      ...prev,
                      sendEmail: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer accent-[#0F172A]"
                />
                <span>Send decision notification email to creator</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                Optional. Send an email notification to (
                {decisionModal.creator.email ||
                  decisionModal.creator.email_public ||
                  "creator email"}
                ).
              </p>
            </div>

            {decisionModal.sendEmail && (
              <button
                type="button"
                onClick={handleGenerateDecisionAi}
                disabled={decisionModal.isGeneratingAi}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-2xs"
                title="Generate personalized email description with AI"
              >
                {decisionModal.isGeneratingAi ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>
                  {decisionModal.isGeneratingAi
                    ? "Generating..."
                    : "Generate with AI"}
                </span>
              </button>
            )}
          </div>

          {decisionModal.sendEmail && (
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden space-y-0 shadow-xs animate-in fade-in">
              {/* Fake Mailbox Header */}
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                    <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 tracking-wide ml-1">
                    {decisionModal.decisionType === "approve"
                      ? "Partnership Acceptance Notice"
                      : "Partnership Status Update"}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                  🔒 SMTP Dispatch Ready
                </span>
              </div>

              {/* Metadata fields */}
              <div className="bg-slate-50/60 px-4 py-2.5 border-b border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold w-14">From:</span>
                  <span className="text-slate-800 font-mono text-[11px]">
                    CoLaunch Studio &lt;{PARTNERSHIP_EMAIL}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold w-14">To:</span>
                  <span className="text-emerald-700 font-mono text-[11px] font-bold">
                    {decisionModal.creator.name ||
                      decisionModal.creator.display_name}{" "}
                    &lt;
                    {decisionModal.creator.email ||
                      decisionModal.creator.email_public}
                    &gt;
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-slate-500 font-bold w-14">
                    Subject:
                  </span>
                  <input
                    type="text"
                    value={decisionModal.subject}
                    onChange={(e) =>
                      setDecisionModal((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="e.g. Partnership Accepted: Advancing to Product Discovery"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Body Editor */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Email Message Description (Editable)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    AI-Generated Template
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={decisionModal.body}
                  onChange={(e) =>
                    setDecisionModal((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }))
                  }
                  placeholder="Enter optional description sent to the creator..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3.5 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none transition-colors"
                />

                {decisionModal.decisionType === "approve" && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>50/50 Revenue Split • 0 Cost Guarantee</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-800 font-bold">
                      Included in Offer
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() =>
              setDecisionModal((prev) => ({ ...prev, isOpen: false }))
            }
            disabled={decisionModal.isSending}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmDecisionModal}
              disabled={decisionModal.isSending}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 ${decisionModal.decisionType === "approve"
                  ? "bg-[#0F172A] hover:bg-[#1E293B] border border-slate-800"
                  : "bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-rose-600/20"
                }`}
            >
              {decisionModal.decisionType === "approve" && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
              {decisionModal.isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
              ) : decisionModal.decisionType === "approve" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>
                {decisionModal.isSending
                  ? "Processing..."
                  : decisionModal.decisionType === "approve"
                    ? decisionModal.sendEmail
                      ? "Confirm Acceptance & Send Email →"
                      : "Confirm Acceptance & Advance →"
                    : decisionModal.sendEmail
                      ? "Confirm Rejection & Send Email"
                      : "Confirm Rejection & Archive"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── Precision Workspace Provisioning Modal (Linear / Vercel Aesthetic) ── */}
  {isLaunchingProject && typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden">
      {(() => {
        const concepts = selectedCreator?.productConcepts || (selectedCreator ? ensureCreatorConcepts(selectedCreator) : []);
        const concept = concepts?.find((p) => p.id === selectedConceptId) || concepts?.[0];
        const cleanHandle = (selectedCreator?.handle || "partner").replace(/^@/, "");
        const creatorDisplayName = selectedCreator?.name || selectedCreator?.display_name || `@${cleanHandle}`;

        return (
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-left space-y-5 relative overflow-hidden">
            {/* Hairline subtle top glow */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            {/* Partner Header */}
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={selectedCreator?.avatar || generateCreatorAvatarSvg(selectedCreator?.name || selectedCreator?.handle || "Creator")}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = generateCreatorAvatarSvg(selectedCreator?.name || selectedCreator?.handle || "Creator");
                  }}
                  alt=""
                  className="w-10 h-10 rounded-none object-cover border border-[#334155]"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <Rocket className="w-2 h-2 text-white" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Initializing Workspace
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {launchStepIndex} / 4
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate mt-0.5">
                  {creatorDisplayName}
                </h3>
              </div>
            </div>

            {/* Real Venture Specs */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Concept</span>
                <p className="font-semibold text-slate-800 truncate mt-0.5">
                  {concept?.name || "Co-Launch Venture"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Terms</span>
                <p className="font-semibold text-emerald-700 font-mono truncate mt-0.5">
                  50 / 50 Net Split
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Co-Founder Portal Link</span>
                <p className="font-mono text-[11px] text-slate-600 truncate mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{selectedCreator?.email || selectedCreator?.email_public || "Direct Magic Link Generated"}</span>
                </p>
              </div>
            </div>

            {/* Linear-Style Provisioning Checklist */}
            <div className="space-y-2 py-1">
              {[
                { id: 1, text: "Configuring product architecture & concept specs" },
                { id: 2, text: "Generating secure Co-Founder Portal access" },
                { id: 3, text: "Initializing validation telemetry & revenue milestones" },
                { id: 4, text: "Connecting Project OS workspace" },
              ].map((step) => {
                const isComplete = launchStepIndex > step.id;
                const isCurrent = launchStepIndex === step.id;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${isComplete
                        ? "text-slate-600"
                        : isCurrent
                          ? "text-slate-900 font-bold"
                          : "text-slate-400"
                      }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {isComplete ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <span className="truncate">{step.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Segmented Micro-Progress Indicator */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${launchStepIndex >= idx
                        ? "bg-emerald-500 shadow-2xs"
                        : "bg-slate-200"
                      }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>
                    {launchStepIndex === 1
                      ? "Binding specifications..."
                      : launchStepIndex === 2
                        ? "Deploying founder portal..."
                        : launchStepIndex === 3
                          ? "Setting up validation gates..."
                          : "Opening workspace..."}
                  </span>
                </span>
                <span>{launchStepIndex * 25}%</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>,
    document.body
  )}

  {/* ── Co-Launch Venture Artifacts Modal (CF-5050 Agreement, Architecture, Signals) ── */}
  {activeArtifactTab && typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
      <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200/90 shadow-2xl text-left relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Hairline accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 z-10" />

        {/* Header & Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Verified Co-Launch Artifact
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 font-display">
                  {VENTURE_ARTIFACTS[activeArtifactTab]?.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const art = VENTURE_ARTIFACTS[activeArtifactTab];
                    const textToCopy = `${art.title}\n${art.subtitle}\n\n${art.summary}\n\n` +
                      (art.clauses ? art.clauses.map(c => `${c.title}\n${c.body}`).join('\n\n') : '') +
                      (art.specs ? art.specs.map(s => `${s.tier}: ${s.tech}\n${s.details}`).join('\n\n') : '') +
                      (art.metrics ? art.metrics.map(m => `${m.label} (${m.value}): ${m.desc}`).join('\n\n') : '');
                    navigator.clipboard.writeText(textToCopy);
                    setArtifactCopied(true);
                    setTimeout(() => setArtifactCopied(false), 2500);
                  } catch (e) { }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                {artifactCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Spec</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveArtifactTab(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Artifact Selector Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            {Object.keys(VENTURE_ARTIFACTS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setActiveArtifactTab(k)}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer ${activeArtifactTab === k
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {VENTURE_ARTIFACTS[k].shortTitle}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans">
            {VENTURE_ARTIFACTS[activeArtifactTab]?.summary}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {VENTURE_ARTIFACTS[activeArtifactTab]?.stats?.map((st, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">{st.label}</span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{st.val}</span>
              </div>
            ))}
          </div>

          {/* Detailed Content */}
          {activeArtifactTab === 'agreement' && (
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Mutual Venture Operating Clauses
              </span>
              {VENTURE_ARTIFACTS.agreement.clauses.map((c, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-200">
                      {c.num}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 font-display">
                      {c.title}
                    </h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed pl-7 text-[11.5px]">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeArtifactTab === 'architecture' && (
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Full-Stack Cloud Infrastructure Spec
              </span>
              {VENTURE_ARTIFACTS.architecture.specs.map((s, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 font-display">
                      {s.tier}
                    </h4>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {s.tech}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11.5px]">
                    {s.details}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeArtifactTab === 'signals' && (
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Signal Extraction & WTP Logic
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VENTURE_ARTIFACTS.signals.metrics.map((m, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 font-display">
                        {m.label}
                      </h4>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {m.value}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {m.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Legally Binding Mutual Operating Spec · CoLaunch Studio</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveArtifactTab(null)}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

  {/* Universal Floating Action Notifications & Alerts */}
  <ActionNotificationToast toasts={toasts} onDismiss={dismissToast} />

  {/* Confirmation Modal for Resetting Pipeline & Deleting All Leads */}
  <ConfirmationModal
    isOpen={showDeleteConfirmModal}
    onClose={() => setShowDeleteConfirmModal(false)}
    onConfirm={executeDeleteAllCreators}
    title="Reset Pipeline & Delete All Leads?"
    message="Are you sure you want to delete all creators and start again? This will permanently wipe all discovered creators, email threads, outreach history, and reset your acquisition workflow back to campaign setup."
    confirmText="Confirm & Delete Everything"
    cancelText="Keep Leads"
    isDestructive={true}
    isLoading={isDeletingAll}
    stats={[
      `${creators.length} Discovered Creators`,
      `${realThreads.length} Email Threads`,
      "All Opportunity Pitches & Decks",
    ]}
  />

  {/* Step 5 1-on-1 Proposal Email Preview & Edit Modal */}
  <Step5ProposalEmailModal
    isOpen={showStep5EmailModal}
    creator={selectedCreator}
    emailData={selectedCreator ? getStep5EmailData(selectedCreator) : null}
    customSubject={customPitchSubject}
    customBody={customPitchBody}
    isSending={isSendingPitch}
    onSaveCopy={(subj, body) => {
      setCustomPitchSubject(subj);
      setCustomPitchBody(body);
    }}
    onResetCopy={() => {
      if (selectedCreator) {
        const data = getStep5EmailData(selectedCreator);
        setCustomPitchSubject(data.defaultSubject);
        setCustomPitchBody(data.defaultBody);
      }
    }}
    onSendAndAdvance={() => {
      setShowStep5EmailModal(false);
      handleSendBlueprintAndAdvanceToStep6(selectedCreator);
    }}
    onClose={() => setShowStep5EmailModal(false)}
  />

  {/* Step 5 Interactive Customized Pitch Deck Modal */}
  <CustomizedDeckModal
    isOpen={Boolean(viewingDeckConcept)}
    concept={viewingDeckConcept}
    conceptIndex={viewingDeckIndex}
    creator={{
      ...selectedCreator,
      brand_color: creatorBrandColorMap[selectedCreator?.id]?.primaryHex || selectedCreator?.brand_color,
      brandColor: creatorBrandColorMap[selectedCreator?.id]?.primaryHex || selectedCreator?.brandColor,
    }}
    audienceIntelligence={selectedCreator?.audienceIntelligence || getCreatorAudienceIntelligence(selectedCreator)}
    onClose={() => setViewingDeckConcept(null)}
  />

  {/* Step 6 Client Profile & Intel Inspector Modal */}
  <ClientProfileModal
    isOpen={showClientProfileModal}
    creator={selectedCreator}
    selectedConceptId={creatorConceptSelectionMap[selectedCreator?.id] || selectedConceptId || selectedCreator?.selectedConceptId}
    threadMessages={selectedCreator ? getCreatorThreadMessages(selectedCreator, realThreads) : []}
    hunterData={selectedCreator ? (hunterDataMap[selectedCreator.id] || null) : null}
    onClose={() => setShowClientProfileModal(false)}
    onSelectConcept={(cid) => {
      if (selectedCreator) {
        handleSelectConcept(cid, selectedCreator.id);
      }
    }}
    onApplyAutoDraft={(angle, concept) => {
      if (selectedCreator) {
        applyAutoDraft(selectedCreator, angle, concept, true);
      }
    }}
  />

  {/* Reset URL & Exit Focus Modal */}
  {showResetUrlModal && (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600 shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-display">
                Reset URL & Exit Individual Focus?
              </h3>
              <p className="text-xs text-slate-500">
                Switch back to collective creator pipeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowResetUrlModal(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <p>
            The operator currently opened an individual creator in the workspace:
          </p>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="font-semibold text-slate-900">
              {scopedIndividualCreator?.name || scopedIndividualCreator?.handle || "Selected Creator"}
            </span>
            <span className="text-[11px] font-mono text-slate-500 truncate ml-auto">
              {scopedCreatorId}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Returning to Step 01 (Campaign Setup) or resetting will remove this ID from the URL so you will not see this single creator restricted in Step 2, 3, 4, 5, or 6 again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              handleClearScopedCreator(1);
              setShowResetUrlModal(false);
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset URL & View All</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveStep(1);
              setShowResetUrlModal(false);
            }}
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            title="Go to Step 1 without removing the creator ID from URL"
          >
            Keep Focus & Go to Step 1
          </button>
          <button
            type="button"
            onClick={() => setShowResetUrlModal(false)}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Set / Change Creator Focus URL Modal */}
  {showSetUrlModal && (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-2xs">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-display">
                Set Creator Focus URL
              </h3>
              <p className="text-xs text-slate-500">
                Scope steps 4, 5, or 6 to a single creator by ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSetUrlModal(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Creator ID or Handle
            </label>
            <input
              type="text"
              value={inputUrlCreatorId}
              onChange={(e) => setInputUrlCreatorId(e.target.value)}
              placeholder="e.g. 818dee64-eeca-4111-9d4a-9d222184327d or jpgcoaching"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-xs font-mono outline-hidden shadow-2xs transition"
            />
          </div>

          {/* Quick Picker from active pipeline creators */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Or pick from active leads:
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
              {unlaunchedCreators.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setInputUrlCreatorId(c.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                    inputUrlCreatorId === c.id
                      ? "bg-indigo-600 text-white font-semibold"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={getCreatorAvatar(c)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = generateCreatorAvatarSvg(c?.name || c?.handle || "Creator");
                      }}
                      alt=""
                      className="w-5 h-5 rounded-none object-cover flex-shrink-0 border border-[#334155]"
                    />
                    <span className="truncate">{c.name || c.display_name || c.handle}</span>
                  </div>
                  <span className={`text-[10px] font-mono ml-2 ${inputUrlCreatorId === c.id ? "text-indigo-200" : "text-slate-400"}`}>
                    {c.id.slice(0, 8)}...
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Step Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Pipeline Step
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, label: "Step 01" },
                { step: 4, label: "Step 04" },
                { step: 5, label: "Step 05" },
                { step: 6, label: "Step 06" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setInputUrlTargetStep(s.step)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer text-center ${
                    inputUrlTargetStep === s.step
                      ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {scopedCreatorId ? (
            <button
              type="button"
              onClick={() => {
                handleClearScopedCreator();
                setShowSetUrlModal(false);
              }}
              className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
            >
              Clear URL
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSetUrlModal(false)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!inputUrlCreatorId.trim()}
              onClick={() => handleApplyScopedUrl(inputUrlCreatorId, inputUrlTargetStep)}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              Apply & Open URL
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
    </>
  );
}
