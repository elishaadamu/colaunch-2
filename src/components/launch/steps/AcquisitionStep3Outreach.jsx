import {
  Send,
  CheckCircle2,
  ArrowRight,
  Clock,
  Check,
  Users,
  X,
  Pencil,
  AlertTriangle,
} from "lucide-react";

export default function AcquisitionStep3Outreach({
  cancelEditEmail,
  creators,
  editingEmailCreatorId,
  followUpDays,
  generateCreatorAvatarSvg,
  getCreatorAvatar,
  handleSendBulkOutreach,
  outreachLog,
  saveEditEmail,
  sendingBulk,
  setActiveStep,
  setTempEmailValue,
  startEditEmail,
  tempEmailValue,
  unlaunchedCreators,
}) {
  return (
  <div className="p-6 acq-card space-y-6 text-white">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a2a30] pb-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Outreach Wave
          </span>
        </div>
        <h2 className="text-base font-bold text-white flex items-center gap-2 mt-1.5 font-display uppercase tracking-wide">
          <Send className="w-4 h-4 text-[#C81E3C]" />
          <span>Outreach Queue</span>
        </h2>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => handleSendBulkOutreach({ autoAdvance: true })}
          disabled={sendingBulk || creators.length === 0}
          className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg acq-btn-primary text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Send
            className={`w-3.5 h-3.5 text-white ${sendingBulk ? "animate-pulse" : ""}`}
          />
          <span>
            {sendingBulk ? "Dispatching..." : "Dispatch Email"}
          </span>
        </button>
        <button
          onClick={() => setActiveStep(4)}
          className="px-4 py-2.5 rounded-lg bg-[#141417] hover:bg-[#222227] text-white border border-[#2a2a30] hover:border-slate-500 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <span>Proceed to Step 4: Creator Replies</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA]" />
        </button>
      </div>
    </div>

    {outreachLog && (
      <div className="p-4 rounded-lg bg-[#141417] border border-[#2a2a30] text-xs font-mono text-emerald-400">
        {outreachLog}
      </div>
    )}

    {/* Sequence Automation Cards with Rich Ambient Accents */}
    <div className="grid md:grid-cols-3 gap-4 text-xs">
      {/* Card 1: Batch Size */}
      <div className="p-4 rounded-xl bg-[#111114] border border-[#222227] space-y-2 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C81E3C] via-rose-500 to-[#C81E3C]" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider font-display">Target Outreach Batch</span>
          <div className="w-7 h-7 rounded-lg bg-[#1A0B10] text-[#FF4D6D] border border-rose-900/50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-black text-white font-display font-mono">
          {creators.length} Creators
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-[#222227]">
          <span className="text-[11px] text-[#71717A]">Audience Size</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-lg">
            100K–1M Verified
          </span>
        </div>
      </div>

      {/* Card 2: Auto Follow-up Rule */}
      <div className="p-4 rounded-xl bg-[#111114] border border-[#222227] space-y-2 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider font-display">Auto Follow-up Rule</span>
          <div className="w-7 h-7 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-300 font-display font-mono">
          {followUpDays} Days Timing
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-[#222227]">
          <span className="text-[11px] text-[#71717A]">Sequence Step 2</span>
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded-lg">
            Auto-Follow In {followUpDays}d
          </span>
        </div>
      </div>

      {/* Card 3: Sequence Termination */}
      <div className="p-4 rounded-xl bg-[#111114] border border-[#222227] space-y-2 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-500" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider font-display">Sequence Termination</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-300 font-display font-mono">
          Response → Stop
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-[#222227]">
          <span className="text-[11px] text-[#71717A]">Compliance</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-lg">
            Live Response Tracking
          </span>
        </div>
      </div>
    </div>


    {/* Queue preview table */}
    <div className="space-y-3 pt-2">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
        <span className="w-2 h-2 rounded-lg bg-[#C81E3C]" />
        <span>Active Outreach Queue ({unlaunchedCreators.length})</span>
      </h3>
      <div className="overflow-x-auto rounded-lg border border-[#2a2a30] bg-[#0C0C0E]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#141417] text-[#A1A1AA] text-[11px] border-b border-[#2a2a30] font-mono uppercase tracking-wider">
            <tr>
              <th className="p-3">Creator</th>
              <th className="p-3">Platform</th>
              <th className="p-3">Followers</th>
              <th className="p-3">Recipient Email</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222227]">
            {unlaunchedCreators.map((c) => {
              const emailVal = c.email || c.email_public || "";
              const isEditing = editingEmailCreatorId === c.id;
              const pSlug = (c.platform || "youtube").toLowerCase();

              return (
                <tr key={c.id} className="hover:bg-[#141417]/70 transition-colors">
                  <td className="p-3 font-bold text-white flex items-center gap-2.5 font-display">
                    <img
                      src={getCreatorAvatar(c)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = generateCreatorAvatarSvg(c.name || c.display_name || c.handle);
                      }}
                      alt=""
                      className="w-7 h-7 rounded-lg object-cover border border-[#2a2a30] bg-[#141417]"
                    />
                    <span className="truncate max-w-[180px] text-white">
                      {c.name || c.display_name}
                    </span>
                  </td>
                  <td className="p-3">
                    {pSlug === "youtube" ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-red-950/40 text-red-400 border border-red-500/30">
                        YouTube
                      </span>
                    ) : pSlug === "instagram" ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-pink-950/40 text-pink-400 border border-pink-500/30">
                        Instagram
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                        TikTok
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-white font-bold">
                    {c.followerStr || c.follower_count}
                  </td>
                  <td className="p-3 font-mono">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 min-w-[220px]">
                        <input
                          type="email"
                          autoFocus
                          value={tempEmailValue}
                          onChange={(e) =>
                            setTempEmailValue(e.target.value)
                          }
                          onBlur={(e) => {
                            if (tempEmailValue.trim()) {
                              saveEditEmail(c.id, e);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditEmail(c.id, e);
                            if (e.key === "Escape") cancelEditEmail(e);
                          }}
                          className="bg-[#030304] border border-[#2a2a30] rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#C81E3C] flex-1 font-mono"
                        />
                        <button
                          type="button"
                          onClick={(e) => saveEditEmail(c.id, e)}
                          className="p-1 rounded-lg acq-btn-primary text-white cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => cancelEditEmail(e)}
                          className="p-1 rounded-lg bg-[#222227] hover:bg-[#2E2E34] text-[#A1A1AA] hover:text-white cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        {emailVal ? (
                          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 text-[11px]">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{emailVal}</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[10px] font-mono italic bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>No email set</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) =>
                            startEditEmail(c.id, emailVal, e)
                          }
                          className="p-1 text-[#71717A] hover:text-[#FF4D6D] rounded-lg opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Edit Email"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono border inline-flex items-center gap-1 ${
                        c.status === "rejected"
                          ? "bg-rose-950/40 text-rose-400 border-rose-500/30"
                          : c.status === "approved"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                            : emailVal
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-950/40 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {emailVal && c.status !== "rejected" && c.status !== "approved" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                      {!emailVal && c.status !== "rejected" && c.status !== "approved" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                      {c.status === "rejected"
                        ? "Archived (Rejected)"
                        : c.status === "approved"
                          ? "Approved (Active)"
                          : emailVal
                            ? "Ready in Queue"
                            : "Email Needed"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}
