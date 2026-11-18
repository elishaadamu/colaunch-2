import { useState, useEffect } from "react";
import CreatorFollowUpCRM from "./CreatorFollowUpCRM";
import { getCreators, getThreads, pollInboxReplies, updateCreatorDetails, deleteCreator, getWorkflowState, getCoLaunchProjects } from "../../services/opsApi";
import { updatePageSEO } from "../../utils/seo";
import { Users, ExternalLink, Rocket, ShieldCheck, CheckCircle, AlertCircle, X, Target, Layers, Zap, MessageSquare, ShieldAlert, Loader2 } from "lucide-react";
import { CRMSkeleton } from "./Section2Skeletons";
import CoLaunchLogo from "../ui/CoLaunchLogo";

const C = {
  bg: '#050506',
  sheet: '#0c0c0e',
  row: '#111114',
  raised: '#1c1c20',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#fafafa',
  body: '#d4d4d8',
  muted: '#a1a1aa',
  faint: '#71717a',
  crimson: '#c81e3c',
  crimsonHover: '#d92a49',
  crimsonSoft: 'rgba(200,30,60,0.14)',
  crimsonLine: 'rgba(200,30,60,0.42)',
  crimsonText: '#ff8fa3',
  ok: '#34d399',
  okSoft: 'rgba(52,211,153,0.10)',
  okLine: 'rgba(52,211,153,0.32)',
  sky: '#e4e4e7',
  skySoft: 'rgba(255,255,255,0.06)',
  skyLine: 'rgba(255,255,255,0.18)',
  violet: '#ff8fa3',
  violetSoft: 'rgba(255,77,109,0.10)',
  violetLine: 'rgba(255,77,109,0.34)',
  warn: '#fbbf24',
  warnSoft: 'rgba(251,191,36,0.10)',
  warnLine: 'rgba(251,191,36,0.32)',
};

const HEADING_FONT = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const CRM_PAGE_CSS = `
.crm-page-root .crm-btn-primary{background:linear-gradient(180deg,#d62546 0%,#c81e3c 55%,#ad1833 100%);color:#fff;border:1px solid rgba(255,77,109,.35);box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 10px 26px -12px rgba(200,30,60,.6);transition:filter .15s,box-shadow .2s,transform .15s}
.crm-page-root .crm-btn-primary:hover:not(:disabled){filter:brightness(1.08);box-shadow:0 1px 0 rgba(255,255,255,.2) inset,0 14px 32px -12px rgba(200,30,60,.75)}
.crm-page-root .crm-btn-primary:active:not(:disabled){transform:translateY(1px)}
.crm-page-root .crm-btn-quiet{background:#111114;color:#d4d4d8;border:1px solid rgba(255,255,255,.08);transition:background-color .15s,color .15s,border-color .15s}
.crm-page-root .crm-btn-quiet:hover:not(:disabled){background:#1c1c20;color:#fafafa;border-color:rgba(255,255,255,.18)}
.crm-page-root .crm-btn-danger{background:rgba(200,30,60,.10);color:#ff8fa3;border:1px solid rgba(200,30,60,.42);transition:background-color .15s,color .15s}
.crm-page-root .crm-btn-danger:hover:not(:disabled){background:rgba(200,30,60,.22);color:#fff}
.crm-page-root button:focus-visible,.crm-page-root a:focus-visible,.crm-page-root input:focus-visible,.crm-page-root select:focus-visible,.crm-page-root textarea:focus-visible{outline:2px solid #ff4d6d;outline-offset:2px}
.crm-page-root input[type=text]:focus,.crm-page-root textarea:focus,.crm-page-root select:focus{border-color:rgba(200,30,60,.7)!important;box-shadow:0 0 0 3px rgba(200,30,60,.18)}
.crm-page-root ::selection{background:#c81e3c;color:#fff}
.crm-page-root ::-webkit-scrollbar{width:8px;height:8px}
.crm-page-root ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:999px}
.crm-page-root ::-webkit-scrollbar-thumb:hover{background:#c81e3c}
`;

export default function FollowUpCRMPage() {
  const [creators, setCreators] = useState([]);
  const [realThreads, setRealThreads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workflowState, setWorkflowState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncingImap, setIsSyncingImap] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [cobuilderPassPrice, setCobuilderPassPrice] = useState(0);
  const [isPassPriceLoading, setIsPassPriceLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.removeItem('forge_cobuilder_pass_price'); } catch (e) { }

    const handlePriceEvent = (e) => {
      const p = e?.detail;
      if (p !== undefined && p !== null && !isNaN(Number(p))) {
        setCobuilderPassPrice(Number(p));
      } else {
        setCobuilderPassPrice(0);
      }
      setIsPassPriceLoading(false);
    };
    window.addEventListener('forge_pass_price_changed', handlePriceEvent);
    return () => {
      window.removeEventListener('forge_pass_price_changed', handlePriceEvent);
    };
  }, []);

  useEffect(() => {
    updatePageSEO({
      title: "Creator Follow-Up CRM & Inbound Replies | CoLaunch",
      description: "Directory list, audience score breakdown, AI sentiment analysis, and response tracking for partner creators.",
      image: "/og-image.svg"
    });
  }, []);

  const notify = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [creatorsRes, threadsRes, workflowRes, projectsRes] = await Promise.allSettled([
        getCreators({ limit: 1000 }),
        getThreads(),
        getWorkflowState(),
        getCoLaunchProjects(),
      ]);

      if (creatorsRes.status === "fulfilled" && creatorsRes.value) {
        const rawList = Array.isArray(creatorsRes.value)
          ? creatorsRes.value
          : creatorsRes.value?.creators || [];
        
        // MongoDB Atlas is the single authoritative source of truth
        setCreators(rawList);
        if (rawList.length === 0) {
          try {
            localStorage.removeItem("forge_crm_cached_creators");
            localStorage.removeItem("forge_launch_discovered_creators");
          } catch (e) { }
        }
      } else {
        setCreators([]);
      }
      if (threadsRes.status === "fulfilled" && threadsRes.value) {
        setRealThreads(Array.isArray(threadsRes.value) ? threadsRes.value : []);
      }
      if (workflowRes.status === "fulfilled" && workflowRes.value) {
        setWorkflowState(workflowRes.value);
        const ws = workflowRes.value;
        const dbFee = ws?.default_pass_price ?? ws?.cobuilder_pass_price ?? ws?.extra_state?.default_pass_price ?? ws?.extra_state?.cobuilder_pass_price;
        if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
          setCobuilderPassPrice(Number(dbFee));
        } else {
          setCobuilderPassPrice(0);
        }
      } else {
        setCobuilderPassPrice(0);
      }
      setIsPassPriceLoading(false);
      if (projectsRes.status === "fulfilled" && projectsRes.value) {
        setProjects(Array.isArray(projectsRes.value) ? projectsRes.value : []);
      }
    } catch (err) {
      console.warn("[FollowUpCRMPage] Data load error:", err);
      setCreators([]);
      if (!isSilent) {
        notify("error", "Sync Error", "Failed to retrieve latest CRM data from database.");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-poll interval every 30 seconds for background incoming replies
    const timer = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncImap = async () => {
    setIsSyncingImap(true);
    try {
      const res = await pollInboxReplies();
      const threads = res?.threads || (await getThreads());
      if (threads && Array.isArray(threads)) {
        setRealThreads(threads);
      }
      await loadData(true);
      notify("success", "Inbox Synced", "Successfully scanned IMAP and updated lead classifications.");
    } catch (err) {
      console.warn("[FollowUpCRMPage] IMAP sync failed:", err);
      notify("error", "Sync Failed", "Could not connect to inbox. Check IMAP settings.");
    } finally {
      setIsSyncingImap(false);
    }
  };

  const handleApproveCreator = async (creatorId) => {
    const target = (creators || []).find((c) => c.id === creatorId || c.handle === creatorId);
    const isAiInterested =
      target?.replyInfo?.classification === "interested" ||
      ["qualified", "interested"].includes((target?.reply_classification || target?.replyClassification || "").toLowerCase());

    if (!isAiInterested && target?.status !== "approved") {
      notify("warning", "Approval Blocked", "Creator cannot be approved until AI flags their reply as interested.");
      return;
    }

    setCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: "approved" } : c))
    );
    try {
      await updateCreatorDetails(creatorId, { status: "approved" });
      notify("success", "Lead Approved", "Creator marked as approved and ready for Step 5 product synthesis.");
    } catch (err) {
      console.warn("Approve creator failed:", err);
      notify("error", "Update Failed", "Could not persist approval to database.");
    }
  };

  const handleRejectCreator = async (creatorId) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: "rejected" } : c))
    );
    try {
      await updateCreatorDetails(creatorId, { status: "rejected" });
      notify("info", "Lead Rejected", "Creator archived and rejected in database.");
    } catch (err) {
      console.warn("Reject creator failed:", err);
      notify("error", "Update Failed", "Could not persist rejection to database.");
    }
  };

  const handleDeleteCreator = async (creatorId) => {
    setCreators((prev) => prev.filter((c) => c.id !== creatorId && c.handle !== creatorId));
    try {
      await deleteCreator(creatorId);
      notify("info", "Lead Deleted", "Creator permanently deleted from pipeline database.");
    } catch (err) {
      console.warn("Delete creator backend error:", err);
    }

    try {
      localStorage.removeItem("forge_crm_cached_creators");
      localStorage.removeItem("forge_launch_discovered_creators");
      const rawDeleted = (() => {
        try {
          const direct = localStorage.getItem("forge_deleted_creator_ids");
          if (!direct) return [];
          const parsed = JSON.parse(direct);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === "object" && Array.isArray(parsed.data)) return parsed.data;
          return [];
        } catch {
          return [];
        }
      })();
      const deletedIds = Array.isArray(rawDeleted) ? [...rawDeleted] : [];
      if (creatorId && !deletedIds.includes(creatorId)) {
        deletedIds.push(creatorId);
        localStorage.setItem("forge_deleted_creator_ids", JSON.stringify(deletedIds));
      }
      localStorage.setItem("forge_last_deleted_timestamp", Date.now().toString());
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent("forge_creator_deleted", { detail: { creatorId } })
    );
    loadData(true);
  };

  const handleDeleteAllCreators = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all creators from the database? This action cannot be undone.")) {
      return;
    }
    setIsDeletingAll(true);
    setCreators([]);
    setRealThreads([]);
    try {
      localStorage.removeItem("forge_crm_cached_creators");
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      const { deleteAllCreators } = await import("../../services/opsApi");
      await deleteAllCreators();
      notify("success", "All Leads Deleted", "All creators have been deleted from MongoDB Atlas.");
    } catch (err) {
      console.warn("Delete all creators failed:", err);
      notify("error", "Delete Failed", "Failed to delete all creators from database.");
    } finally {
      setIsDeletingAll(false);
      loadData(true);
    }
  };

  return (
    <div
      className="crm-page-root min-h-screen font-sans flex flex-col overflow-x-clip w-full max-w-[100vw] relative"
      style={{ background: C.bg, color: C.text }}
    >
      <style>{CRM_PAGE_CSS}</style>

      {/* Ambient canvas: black with a restrained crimson aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full" style={{ background: 'rgba(200,30,60,0.09)', filter: 'blur(120px)' }} />
        <div className="absolute -bottom-[25%] -right-[10%] w-[45vw] h-[45vw] rounded-full" style={{ background: 'rgba(255,77,109,0.04)', filter: 'blur(120px)' }} />
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.35,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
          }}
        />
      </div>

      {/* Top Navbar */}
      <header
        className="h-14 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 relative backdrop-blur-xl"
        style={{
          background: 'rgba(5,5,6,0.8)',
          borderBottom: '1px solid #1c1c20',
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,30,60,0.5), transparent)' }} aria-hidden="true" />
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => (window.location.href = "/launch")}
          >
            <CoLaunchLogo size={28} showWordmark={true} theme="dark" />
            <div className="hidden xl:flex items-center">
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: C.row, color: C.muted, border: `1px solid ${C.line}` }}
              >
                OPERATOR STUDIO
              </span>
            </div>
          </div>

          <div className="h-4 w-px hidden md:block" style={{ background: C.line }} />

          {/* Clean Suite Navigation Tabs */}
          <div
            className="hidden md:flex items-center gap-0.5 p-1 rounded-xl"
            style={{ background: C.sheet, border: '1px solid #222227' }}
          >
            <a
              href="/launch"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
              style={{ color: C.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.raised; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent'; }}
            >
              <Target className="w-3.5 h-3.5" style={{ color: C.faint }} />
              <span>Acquisition OS</span>
            </a>
            <a
              href="/project-os"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
              style={{ color: C.muted }}
              title="Open Dedicated Co-Launch Operations Center"
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.raised; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent'; }}
            >
              <Layers className="w-3.5 h-3.5" style={{ color: C.faint }} />
              <span>Project OS</span>
            </a>
            <button
              type="button"
              aria-current="page"
              className="crm-btn-primary flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />
              <span>Follow-Up CRM</span>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
              >
                {creators.length}
              </span>
            </button>
            <a
              href="/participation-manager"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
              style={{ color: C.muted }}
              title="Dedicated Creator Participation & Co-Builder Console"
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.raised; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent'; }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: C.warn }} />
              <span className="flex items-center gap-1">
                Co-Builders (
                {isPassPriceLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin inline-block" style={{ color: C.warn }} />
                ) : (
                  `$${cobuilderPassPrice || 0}`
                )}
                )
              </span>
            </a>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/admin-error-log"
            className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
            style={{
              background: C.row,
              color: C.crimsonText,
              border: `1px solid ${C.crimsonLine}`,
            }}
            title="Open Admin Pipeline Oversight & Error Log"
            onMouseEnter={(e) => { e.currentTarget.style.background = C.crimsonSoft; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.row; }}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: C.crimsonText }} />
            <span>Admin Error Log</span>
          </a>

          {creators.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllCreators}
              disabled={isDeletingAll}
              className="crm-btn-danger flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              title="Permanently wipe all creators from database"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isDeletingAll ? "Deleting..." : `Delete All (${creators.length})`}</span>
            </button>
          )}

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 relative z-10">
        {/* Mobile Suite Navigation Ribbon */}
        <div
          className="flex md:hidden items-center p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar"
          style={{ background: C.sheet, border: `1px solid ${C.line}` }}
        >
          <a
            href="/launch"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all"
            style={{ color: C.muted }}
          >
            <Target className="w-3.5 h-3.5" style={{ color: C.faint }} />
            <span>Acquisition</span>
          </a>
          <a
            href="/project-os"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all"
            style={{ color: C.muted }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: C.faint }} />
            <span>Project OS</span>
          </a>
          <button
            type="button"
            aria-current="page"
            className="crm-btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-bold whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />
            <span>CRM ({creators.length})</span>
          </button>
          <a
            href="/participation-manager"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all"
            style={{ color: C.muted }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: C.warn }} />
            <span>Co-Builders</span>
          </a>
        </div>

        {loading ? (
          <CRMSkeleton />
        ) : (
          <CreatorFollowUpCRM
            isPage={true}
            creators={creators}
            realThreads={realThreads}
            projects={projects}
            pitchSentMap={workflowState?.pitch_sent_map || {}}
            onSelectCreator={(creatorId, targetStep) => {
              if (targetStep === "section2" || targetStep === 7) {
                window.open(`/project-os?creator=${encodeURIComponent(creatorId)}`, "_blank");
              } else {
                const stepNum = Number(targetStep) || 5;
                window.open(`/launch?section=section1&step=${stepNum}&creator=${encodeURIComponent(creatorId)}`, "_blank");
              }
            }}
            onSyncImap={handleSyncImap}
            isSyncingImap={isSyncingImap}
            onApproveCreator={handleApproveCreator}
            onRejectCreator={handleRejectCreator}
            onDeleteCreator={handleDeleteCreator}
            onNotify={notify}
          />
        )}
      </main>

      {/* Floating Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md"
            style={{
              background: C.sheet,
              borderColor: toast.type === "success" ? C.okLine : toast.type === "error" ? C.crimsonLine : C.lineStrong,
              color: C.text,
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: C.ok }} />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: C.crimsonText }} />
            )}
            <div className="text-xs">
              <p className="font-bold" style={{ color: C.text, fontFamily: HEADING_FONT }}>{toast.title}</p>
              <p style={{ color: C.muted }}>{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 ml-2 rounded-lg cursor-pointer transition-colors"
              style={{ color: C.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
