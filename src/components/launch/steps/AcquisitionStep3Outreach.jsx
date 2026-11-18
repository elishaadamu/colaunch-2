import {
  Send,
  ArrowRight,
  Clock,
  Check,
  X,
  Pencil,
  AlertTriangle,
  Mail,
  MailPlus,
  OctagonX,
  Youtube,
  Instagram,
  Music2,
  Loader2,
  Radio,
} from "lucide-react";

const PLATFORM_META = {
  youtube: { label: "YouTube", Icon: Youtube, color: "#ef4444" },
  instagram: { label: "Instagram", Icon: Instagram, color: "#ec4899" },
  tiktok: { label: "TikTok", Icon: Music2, color: "#e4e4e7" },
};

function getQueueStatus(c, emailVal) {
  if (c.status === "rejected") return { label: "Archived", dot: "#71717a", text: "#a1a1aa" };
  if (c.status === "approved") return { label: "Approved", dot: "#34d399", text: "#34d399" };
  if (emailVal) return { label: "Ready to send", dot: "#34d399", text: "#d4d4d8" };
  return { label: "Needs email", dot: "#fbbf24", text: "#fbbf24" };
}

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
  const queue = unlaunchedCreators || [];
  const total = queue.length;
  const readyCount = queue.filter(
    (c) => (c.email || c.email_public) && c.status !== "rejected"
  ).length;
  const missingCount = queue.filter(
    (c) => !(c.email || c.email_public) && c.status !== "rejected"
  ).length;
  const readyPct = total > 0 ? Math.round((readyCount / total) * 100) : 0;
  const sendDisabled = sendingBulk || creators.length === 0;

  const sequence = [
    {
      key: "send",
      Icon: Send,
      title: "Initial email",
      value: `${creators.length} creator${creators.length === 1 ? "" : "s"}`,
      note: "100K–1M audience, verified",
      accent: "#ff4d6d",
    },
    {
      key: "follow",
      Icon: Clock,
      title: "Auto follow-up",
      value: `After ${followUpDays} day${Number(followUpDays) === 1 ? "" : "s"}`,
      note: "Only if there's no reply",
      accent: "#fbbf24",
    },
    {
      key: "stop",
      Icon: OctagonX,
      title: "Sequence stops",
      value: "On any reply",
      note: "Replies are tracked live",
      accent: "#34d399",
    },
  ];

  return (
    <div className="acq-card p-5 sm:p-7 space-y-7 text-white">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF4D6D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] shadow-[0_0_10px_rgba(255,77,109,0.9)]" />
            Step 03 · Direct outreach
          </span>
          <h2 className="m-0 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Outreach queue
          </h2>
          <p className="m-0 text-sm text-[#A1A1AA]">
            <span className="text-white font-semibold">{readyCount}</span> ready to send
            {missingCount > 0 && (
              <>
                {" "}·{" "}
                <span className="text-amber-400 font-semibold">{missingCount}</span> need an email
                before they can be contacted
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveStep(4)}
            className="h-11 px-4 bg-[#111114] hover:bg-[#1C1C20] text-[#D4D4D8] hover:text-white border border-[#2a2a30] hover:border-[#3a3a42] font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Go to replies</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSendBulkOutreach({ autoAdvance: true })}
            disabled={sendDisabled}
            className="acq-btn-primary h-11 px-5 font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {sendingBulk ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {sendingBulk
                ? "Sending…"
                : readyCount > 0
                  ? `Send to ${readyCount} creator${readyCount === 1 ? "" : "s"}`
                  : "Send outreach"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Readiness meter ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-[#A1A1AA] uppercase tracking-wider">Queue readiness</span>
          <span className="text-white tabular-nums">
            {readyCount}/{total} <span className="text-[#71717A] font-normal">· {readyPct}%</span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-[#1C1C20] overflow-hidden" role="progressbar" aria-valuenow={readyPct} aria-valuemin={0} aria-valuemax={100} aria-label="Creators with an email address">
          <div
            className="h-full bg-gradient-to-r from-[#C81E3C] to-[#FF4D6D] transition-all duration-500"
            style={{ width: `${readyPct}%` }}
          />
        </div>
      </div>

      {/* ── Live dispatch log ── */}
      {outreachLog && (
        <div
          className="flex items-start gap-3 px-4 py-3 bg-[#050506] border border-[#222227] border-l-2"
          style={{ borderLeftColor: sendingBulk ? "#FF4D6D" : "#34d399" }}
          role="status"
          aria-live="polite"
        >
          <span className="mt-0.5 shrink-0">
            {sendingBulk ? (
              <Radio className="w-4 h-4 text-[#FF4D6D] animate-pulse" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              {sendingBulk ? "Sending now" : "Last activity"}
            </p>
            <p className="m-0 mt-0.5 text-[13px] text-[#D4D4D8] font-mono break-words">{outreachLog}</p>
          </div>
        </div>
      )}

      {/* ── Sequence timeline ── */}
      <div className="space-y-3">
        <h3 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
          How the sequence runs
        </h3>
        <ol className="acq-stagger grid md:grid-cols-3 gap-px bg-[#222227] border border-[#222227] list-none m-0 p-0">
          {sequence.map((item, i) => {
            const Icon = item.Icon;
            return (
              <li key={item.key} className="relative bg-[#0C0C0E] p-5 flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span
                    className="w-10 h-10 flex items-center justify-center border"
                    style={{
                      color: item.accent,
                      borderColor: `${item.accent}55`,
                      background: `${item.accent}14`,
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[10px] font-mono text-[#71717A]">0{i + 1}</span>
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    {item.title}
                  </p>
                  <p className="m-0 text-lg font-bold text-white tracking-tight">{item.value}</p>
                  <p className="m-0 text-xs text-[#71717A]">{item.note}</p>
                </div>
                {i < sequence.length - 1 && (
                  <ArrowRight
                    className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 p-0.5 text-[#71717A] bg-[#0C0C0E] border border-[#222227] z-10"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Queue table ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
            Recipients <span className="text-white">({total})</span>
          </h3>
          {missingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Add an email to {missingCount} creator{missingCount === 1 ? "" : "s"} to include them in this send
            </span>
          )}
        </div>

        <div className="overflow-x-auto border border-[#222227] bg-[#0C0C0E]">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead>
              <tr className="bg-[#111114] text-[#71717A] text-[11px] uppercase tracking-wider border-b border-[#222227]">
                <th scope="col" className="px-4 py-3 font-semibold">Creator</th>
                <th scope="col" className="px-4 py-3 font-semibold">Platform</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">Followers</th>
                <th scope="col" className="px-4 py-3 font-semibold">Recipient email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="acq-stagger divide-y divide-[#1C1C20]">
              {total === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Mail className="w-6 h-6 mx-auto text-[#71717A]" />
                    <p className="m-0 mt-2 text-sm font-semibold text-white">No creators in the queue</p>
                    <p className="m-0 mt-1 text-xs text-[#71717A]">Qualify creators in Step 2 to add them here.</p>
                  </td>
                </tr>
              )}
              {queue.map((c) => {
                const emailVal = c.email || c.email_public || "";
                const isEditing = editingEmailCreatorId === c.id;
                const pSlug = (c.platform || "youtube").toLowerCase();
                const platform = PLATFORM_META[pSlug] || PLATFORM_META.youtube;
                const PIcon = platform.Icon;
                const status = getQueueStatus(c, emailVal);
                const handle = c.handle ? `@${String(c.handle).replace(/^@/, "")}` : "";

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-[#111114] ${c.status === "rejected" ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getCreatorAvatar(c)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = generateCreatorAvatarSvg(c.name || c.display_name || c.handle);
                          }}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-[#2a2a30] bg-[#141417] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="m-0 font-semibold text-white truncate max-w-[220px]">
                            {c.name || c.display_name || handle || "Creator"}
                          </p>
                          {handle && (
                            <p className="m-0 text-xs text-[#71717A] truncate max-w-[220px]">{handle}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-[#D4D4D8]">
                        <PIcon className="w-4 h-4" style={{ color: platform.color }} />
                        {platform.label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-semibold text-white tabular-nums">
                      {c.followerStr || c.follower_count || "—"}
                    </td>

                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 min-w-[260px]">
                          <input
                            type="email"
                            autoFocus
                            placeholder="name@example.com"
                            aria-label={`Email for ${c.name || c.display_name || "creator"}`}
                            value={tempEmailValue}
                            onChange={(e) => setTempEmailValue(e.target.value)}
                            onBlur={(e) => {
                              if (tempEmailValue.trim()) saveEditEmail(c.id, e);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditEmail(c.id, e);
                              if (e.key === "Escape") cancelEditEmail(e);
                            }}
                            className="h-8 px-2.5 text-[13px] text-white flex-1"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => saveEditEmail(c.id, e)}
                            className="acq-btn-primary w-8 h-8 flex items-center justify-center cursor-pointer"
                            title="Save email"
                            aria-label="Save email"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => cancelEditEmail(e)}
                            className="w-8 h-8 flex items-center justify-center bg-[#1C1C20] hover:bg-[#2E2E34] text-[#A1A1AA] hover:text-white border border-[#2a2a30] cursor-pointer"
                            title="Cancel"
                            aria-label="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : emailVal ? (
                        <div className="group flex items-center gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                          <span className="text-[13px] text-[#D4D4D8] truncate max-w-[240px]" title={emailVal}>
                            {emailVal}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => startEditEmail(c.id, emailVal, e)}
                            className="p-1 text-[#71717A] hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                            title="Edit email"
                            aria-label={`Edit email for ${c.name || c.display_name || "creator"}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => startEditEmail(c.id, "", e)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 transition-colors cursor-pointer"
                        >
                          <MailPlus className="w-3.5 h-3.5" />
                          Add email
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-[13px] font-medium" style={{ color: status.text }}>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: status.dot, boxShadow: `0 0 8px ${status.dot}99` }}
                        />
                        {status.label}
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
