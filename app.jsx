// app.jsx — root: state, tab system, underlord flow, drawers, tweaks
const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "underlord": true,
  "timeline": false,
  "ulWidth": 320,
  "tlHeight": 300,
  "density": "comfortable",
  "accent": "#A3A3EE",
  "contextBar": true,
  "scenario": "empty"
}/*EDITMODE-END*/;

let _seq = 100;
const uid = (p) => `${p}-${_seq++}`;

function makeTab(kind, extra = {}) {
  const d = SURFACE_DEFS[kind] || { label: kind, icon: "doc" };
  return { id: uid(kind), kind, label: d.label, icon: d.icon, closeable: true, ...extra };
}

// Moderator scenarios: the prototype can be reset into any of the set-up states
// the research tasks assume. A scenario derives the demo flags, the seeded
// Underlord conversation, and a clean Video + Script layout.
function scenarioBaseline(scenario) {
  const tabsById = { "video-1": makeTab("video", { id: "video-1", closeable: false }),
                     "script-1": makeTab("script", { id: "script-1" }) };
  const panes = [{ id: "p1", tabIds: ["video-1", "script-1"], activeId: "video-1" }];
  // Underlord is decoupled from project state: a scenario only sets up the
  // project. It never fabricates chat — Underlord stays empty until the user
  // talks to it (or uploads through it).
  const flags = (f) => ({ videoAdded: false, fillersRemoved: false, fillerStriking: false,
                          chaptersAdded: false, rearranged: false, ...f });
  if (scenario === "postUpload") return { tabsById, panes, flags: flags({ videoAdded: true }), convo: [] };
  if (scenario === "roughCut")   return { tabsById, panes, flags: flags({ videoAdded: true, chaptersAdded: true }), convo: [] };
  return { tabsById, panes, flags: flags(), convo: [] };
}
const INITIAL = scenarioBaseline(TWEAK_DEFAULTS.scenario);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ---- tab system ----
  const [tabsById, setTabsById] = useState(() => INITIAL.tabsById);
  const [panes, setPanes] = useState(() => INITIAL.panes);

  // ---- underlord chat ----
  const [convo, setConvo] = useState(INITIAL.convo);
  const [thinking, setThinking] = useState(false);
  const [planUpdated, setPlanUpdated] = useState(false);
  const [goPulse, setGoPulse] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const planId = useRef(null);
  const reviewId = useRef(null);
  const timer = useRef(null);

  // ---- ephemeral mist chat (summoned by "/") — its own conversation ----
  const [mistOpen, setMistOpen] = useState(false);
  const [mistDocked, setMistDocked] = useState(false);
  const [mistConvo, setMistConvo] = useState([]);
  const [mistThinking, setMistThinking] = useState(false);
  const mistTimer = useRef(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const castRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // ---- share (project access) popover ----
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePos, setSharePos] = useState({ top: 0, right: 0 });
  const shareRef = useRef(null);

  // ---- guided demo state ----
  const [view, setView] = useState("editor");      // 'home' | 'editor' — drop into the empty editor
  const [videoAdded, setVideoAdded] = useState(INITIAL.flags.videoAdded);
  const [fillersRemoved, setFillersRemoved] = useState(INITIAL.flags.fillersRemoved);
  const [fillerStriking, setFillerStriking] = useState(INITIAL.flags.fillerStriking);
  const [chaptersAdded, setChaptersAdded] = useState(INITIAL.flags.chaptersAdded);
  const [rearranged, setRearranged] = useState(INITIAL.flags.rearranged);
  const [planPhase, setPlanPhase] = useState(null); // null | 'proposed' | 'revised' | 'done'
  const [selection, setSelection] = useState(null); // null | 'video' | 'scene' — current canvas selection
  const demo = { videoAdded, fillersRemoved, fillerStriking, chaptersAdded, rearranged };

  const ulOpen = t.underlord;
  const tlOpen = t.timeline;

  // ===== tab operations =====
  const activate = (paneId, tabId) =>
    setPanes((ps) => ps.map((p) => p.id === paneId ? { ...p, activeId: tabId } : p));

  const close = (tabId) => {
    const tab = tabsById[tabId];
    if (tab && !tab.closeable) return;
    if (tabId === planId.current) planId.current = null;
    if (tabId === reviewId.current) reviewId.current = null;
    setPanes((ps) => {
      let next = ps.map((p) => {
        if (!p.tabIds.includes(tabId)) return p;
        const tabIds = p.tabIds.filter((x) => x !== tabId);
        let activeId = p.activeId;
        if (activeId === tabId) activeId = tabIds[tabIds.length - 1] || null;
        return { ...p, tabIds, activeId };
      });
      next = next.filter((p) => p.tabIds.length > 0);
      if (next.length === 0) next = [{ id: "p1", tabIds: ["video-1"], activeId: "video-1" }];
      return next;
    });
  };

  const findPaneOf = (ps, tabId) => ps.find((p) => p.tabIds.includes(tabId));

  const openSurface = (paneId, kind, focus = true) => {
    // reuse existing tab of this kind
    const existing = Object.values(tabsById).find((x) => x.kind === kind);
    if (existing) {
      setPanes((ps) => ps.map((p) => p.tabIds.includes(existing.id) ? { ...p, activeId: existing.id } : p));
      return existing.id;
    }
    const nt = makeTab(kind);
    setTabsById((m) => ({ ...m, [nt.id]: nt }));
    setPanes((ps) => ps.map((p) => p.id === paneId
      ? { ...p, tabIds: [...p.tabIds, nt.id], activeId: focus ? nt.id : p.activeId } : p));
    return nt.id;
  };

  const moveTab = (tabId, toPaneId, beforeTabId) => {
    if (tabId == null) return;
    setPanes((ps) => {
      let next = ps.map((p) => ({ ...p, tabIds: [...p.tabIds] }));
      // remove from source
      for (const p of next) {
        const i = p.tabIds.indexOf(tabId);
        if (i >= 0) { p.tabIds.splice(i, 1); if (p.activeId === tabId) p.activeId = p.tabIds[i] || p.tabIds[p.tabIds.length-1] || null; }
      }
      const dest = next.find((p) => p.id === toPaneId);
      if (dest) {
        let idx = dest.tabIds.length;
        if (beforeTabId && beforeTabId !== tabId) {
          const bi = dest.tabIds.indexOf(beforeTabId);
          if (bi >= 0) idx = bi;
        }
        dest.tabIds.splice(idx, 0, tabId);
        dest.activeId = tabId;
      }
      next = next.filter((p) => p.tabIds.length > 0);
      return next;
    });
  };

  const splitFromActive = (paneId) => {
    setPanes((ps) => {
      if (ps.length > 1) return ps;
      const src = ps.find((p) => p.id === paneId);
      if (!src || src.tabIds.length < 2) return ps;
      const moving = src.activeId;
      const rest = src.tabIds.filter((x) => x !== moving);
      const newSrc = { ...src, tabIds: rest, activeId: rest[rest.length - 1] };
      const newPane = { id: uid("p"), tabIds: [moving], activeId: moving };
      return [newSrc, newPane];
    });
  };

  const splitDrop = (tabId, afterPaneId) => {
    if (tabId == null) return;
    setPanes((ps) => {
      if (ps.length > 1) { return ps; } // handled by moveTab when already split
      const src = ps[0];
      if (src.tabIds.length < 2) return ps; // need to keep at least one behind
      const rest = src.tabIds.filter((x) => x !== tabId);
      const newSrc = { ...src, tabIds: rest, activeId: rest.includes(src.activeId) ? src.activeId : rest[rest.length-1] };
      const newPane = { id: uid("p"), tabIds: [tabId], activeId: tabId };
      return [newSrc, newPane];
    });
  };

  // ===== underlord flow =====
  const ensurePlanTab = () => {
    if (planId.current) return planId.current;
    const nt = makeTab("plan", { label: "Plan" });
    planId.current = nt.id;
    setTabsById((m) => ({ ...m, [nt.id]: nt }));
    setPanes((ps) => {
      const target = ps[0];
      return ps.map((p) => p.id === target.id
        ? { ...p, tabIds: [...p.tabIds, nt.id], activeId: nt.id } : p);
    });
    return nt.id;
  };

  // Open (or focus) the Review changes tab in the left pane.
  const openReview = () => {
    if (reviewId.current && tabsById[reviewId.current]) {
      setPanes((ps) => ps.map((p) => p.tabIds.includes(reviewId.current) ? { ...p, activeId: reviewId.current } : p));
      return reviewId.current;
    }
    const nt = makeTab("review", { label: "Review changes" });
    reviewId.current = nt.id;
    setTabsById((m) => ({ ...m, [nt.id]: nt }));
    setPanes((ps) => {
      const target = ps[0];
      return ps.map((p) => p.id === target.id
        ? { ...p, tabIds: [...p.tabIds, nt.id], activeId: nt.id } : p);
    });
    return nt.id;
  };

  // Generic simulated Underlord send — operates on whichever chat's list/busy
  // setters are passed in, so the drawer and the mist stay independent.
  const runSend = (text, setList, setBusy, timerRef) => {
    setList((c) => [...c, { role: "user", text }]);
    setBusy(true);
    clearTimeout(timerRef.current);
    const hasPlan = !!(planId.current && tabsById[planId.current]);
    timerRef.current = setTimeout(() => {
      setBusy(false);
      if (!hasPlan) {
        setList((c) => [...c,
          { role: "ai", text: "Great — here's a plan to do all that. I've opened it as its own tab so you can review it before we run anything." },
          { role: "ai", artifact: { id: "plan", name: "Plan — launch video cut", sub: "Markdown · opens as a tab" } },
          { role: "ai", text: "Want to change anything before I run it?", chips: ["Make it punchier", "Add captions", "Looks good — Go"] },
        ]);
        ensurePlanTab();
      } else {
        setList((c) => [...c, { role: "ai", text: "hello how are you doing" }]);
      }
    }, 1700);
  };

  const runGo = (setList) => {
    setGoPulse(false);
    if (!t.timeline) setTweak("timeline", true);
    setList((c) => [...c, { role: "ai", text: "Running the plan now — I'll pause between steps so you can review each change on the timeline." }]);
  };

  const onOpenArtifact = () => {
    const id = ensurePlanTab();
    setPanes((ps) => ps.map((p) => p.tabIds.includes(id) ? { ...p, activeId: id } : p));
  };

  // ===== drawer (sidebar) chat — routes to scripted beats =====
  const focusScript = () => openSurface(panes[panes.length - 1].id, "script");

  const runRearrangePlan = (text) => {
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    setPlanUpdated(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      ensurePlanTab();
      setGoPulse(true);
      setConvo((c) => [...c,
        { role: "ai", text: "Here’s a plan to restructure the story — I opened it as its own tab. Tell me what to change, or press Go." },
        { role: "ai", artifact: { id: "plan", name: window.DEMO.plan.initial.title, sub: "Markdown · opened as a tab" } },
      ]);
      setPlanPhase("proposed");
    }, 1500);
  };
  const revisePlan = (text) => {
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setPlanUpdated(true);
      setGoPulse(true);
      if (planId.current) setPanes((ps) => ps.map((p) => p.tabIds.includes(planId.current) ? { ...p, activeId: planId.current } : p));
      setConvo((c) => [...c, { role: "ai", text: "Good call — updated the plan on the right." }]);
      setPlanPhase("revised");
    }, 1300);
  };
  const onPlanGo = () => {
    setGoPulse(false);
    setPlanPhase("done");
    focusScript();
    setConvo((c) => [...c, { role: "ai", text: "Running it now — restructuring the story and cutting the script to match." }]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setRearranged(true);
      setConvo((c) => [...c, { role: "ai", text: "Done — the cut now opens on the thesis and groups the listing tactics together.", review: true }]);
    }, 1300);
  };
  const runChapters = (text) => {
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    focusScript();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setChaptersAdded(true);
      setConvo((c) => [...c, { role: "ai", text: "Added 4 chapters: Big is Your Engine, Boutique is Your Edge, Listing Resources, Open House Script." }]);
    }, 1400);
  };

  // Direct (no-plan) script edit — the lighter edit: remove filler words.
  const runDirectScriptEdit = (text) => {
    setConvo((c) => [...c, { role: "user", text }]);
    focusScript();
    setThinking(true);
    setFillerStriking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setFillerStriking(false);
      setFillersRemoved(true);
      setConvo((c) => [...c, { role: "ai", text: "Edited the script — removed 9 filler words (ums, uhs, false starts). It reads much tighter now." }]);
    }, 1400);
  };
  const guidanceNoPlan = (text) => {
    setConvo((c) => [...c, { role: "user", text },
      { role: "ai", text: "There’s no plan yet — try “edit the script with a plan” to create one." }]);
  };

  const drawerSend = (text) => {
    const t = text.toLowerCase().trim();
    // Precondition gate: with no media, Underlord can't pretend to do anything —
    // it plays the upload-guidance line instead of any scripted beat.
    if (!videoAdded) {
      setConvo((c) => [...c, { role: "user", text },
        { role: "ai", text: "I don’t see any media yet — upload a file with the paperclip to get started." }]);
      return;
    }
    if (planPhase === "proposed" || planPhase === "revised") {
      if (/^(go|approve|run it|looks good|do it|ship it)/.test(t)) { setConvo((c) => [...c, { role: "user", text }]); onPlanGo(); return; }
      revisePlan(text); return;
    }
    // Plan phrase must be tested before the bare script phrase (one contains the other).
    if (/edit the script with a plan|with a plan|make a plan/.test(t)) { runRearrangePlan(text); return; }
    if (/edit the script|remove filler|clean up the script|tighten the script/.test(t)) { runDirectScriptEdit(text); return; }
    if (/edit the plan/.test(t)) { guidanceNoPlan(text); return; }
    if (/chapter/.test(t)) { runChapters(text); return; }
    runSend(text, setConvo, setThinking, timer);
  };
  const drawerChip = (text) => { if (/^(go|looks good)/i.test(text)) runGo(setConvo); else drawerSend(text); };

  // ===== moderator: reset the editor into a set-up state =====
  const applyScenario = (s) => {
    setTweak("scenario", s);
    const b = scenarioBaseline(s);
    planId.current = null; reviewId.current = null;
    clearTimeout(timer.current); clearTimeout(mistTimer.current);
    setTabsById(b.tabsById); setPanes(b.panes);
    setVideoAdded(b.flags.videoAdded); setFillersRemoved(b.flags.fillersRemoved);
    setFillerStriking(b.flags.fillerStriking); setChaptersAdded(b.flags.chaptersAdded);
    setRearranged(b.flags.rearranged);
    setThinking(false); setConvo(b.convo); setPlanPhase(null); setGoPulse(false);
    setMistOpen(false); setMistDocked(false); setMistConvo([]); setMistThinking(false);
    setView("editor");
  };

  // ===== top chrome: publish tab + share popover =====
  const openPublish = () => openSurface(panes[panes.length - 1].id, "publish");
  const toggleShare = () => {
    if (shareOpen) { setShareOpen(false); return; }
    const r = shareRef.current && shareRef.current.getBoundingClientRect();
    if (r) setSharePos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    setShareOpen(true);
  };

  // ===== empty Video tab: direct upload/record just adds media =====
  // Direct manipulation, NOT a chat action — it must not touch Underlord. Only
  // uploading *through* Underlord (its attachment) would make Underlord respond.
  const addMedia = () => {
    setTweak("scenario", "postUpload");
    setVideoAdded(true);
  };

  // ===== upload *through* Underlord (paperclip attachment + send) =====
  // The one upload path that legitimately makes Underlord respond. Underlord is
  // on rails: this plays a scripted acknowledgement, it does not execute anything.
  const uploadViaUnderlord = (text, file) => {
    const msg = { role: "user", file };
    if (text) msg.text = text;
    setConvo((c) => [...c, msg]);
    setTweak("scenario", "postUpload");
    setVideoAdded(true);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setConvo((c) => [...c, { role: "ai", text: "Added your recording to the project. What would you like to do next?" }]);
    }, 1100);
  };

  // ===== guided demo: entry from Chatty Home =====
  const enterEditor = ({ prompt, file }) => {
    setView("editor");
    setTweak("underlord", true);
    const D = window.DEMO || {};
    const userMsg = { role: "user", file: { name: (file && file.name) || D.fileName, meta: D.duration } };
    if (prompt) userMsg.text = prompt;
    setConvo([
      userMsg,
      { role: "ai", text: "Adding your recording to the project…" },
    ]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVideoAdded(true);
      setConvo((c) => [...c, { role: "ai", text: "Okay — I’ve added that to your project. What would you like to do next?" }]);
    }, 900);
  };

  // ===== guided demo: skills (Beat 2) =====
  const onSkill = (id) => {
    if (id === "fillers") runFillerBeat();
  };
  const runFillerBeat = () => {
    openSurface(panes[panes.length - 1].id, "script");
    setConvo((c) => [...c, { role: "user", text: "Remove filler words" }]);
    setThinking(true);
    setFillerStriking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setFillerStriking(false);
      setFillersRemoved(true);
      setConvo((c) => [...c, { role: "ai", text: "Removed 9 filler words — ums, uhs, and false starts. The transcript reads much tighter now." }]);
    }, 1400);
  };

  // ===== drawer chat history =====
  const archiveCurrent = (list) => {
    if (convo.length === 0) return list;
    const firstUser = convo.find((m) => m.role === "user");
    const title = (firstUser && (firstUser.text || (firstUser.file && firstUser.file.name))) || "Chat";
    return [{ id: uid("chat"), title, ts: Date.now(), convo }, ...list];
  };
  const newChat = () => {
    setChatHistory((h) => archiveCurrent(h));
    setConvo([]);
    setThinking(false);
    clearTimeout(timer.current);
    planId.current = null;
  };
  const selectChat = (id) => {
    const item = chatHistory.find((c) => c.id === id);
    if (!item) return;
    setChatHistory((h) => archiveCurrent(h.filter((c) => c.id !== id)));
    setConvo(item.convo);
    setThinking(false);
  };

  // ===== mist chat (secondary surface — placeholder responses only) =====
  const mistSend = (text) => {
    setMistConvo((c) => [...c, { role: "user", text }]);
    setMistDocked(true);
    setMistThinking(true);
    clearTimeout(mistTimer.current);
    mistTimer.current = setTimeout(() => {
      setMistThinking(false);
      setMistConvo((c) => [...c, { role: "ai", text: "Hello, how are you doing?" }]);
    }, 900);
  };
  const mistChip = (text) => mistSend(text);
  const closeMist = () => { setMistOpen(false); setMistDocked(false); };
  const dockMist = () => {
    setConvo(mistConvo);
    setThinking(false);
    setTweak("underlord", true);
    setMistOpen(false);
    setMistDocked(false);
    setMistConvo([]);
  };
  const focusMist = () => {
    setTimeout(() => { const ta = document.querySelector(".mist-input textarea"); if (ta) ta.focus(); }, 60);
  };
  // Open the mist as a prompt-only input centered at the dock (no cursor cast) —
  // it visually takes the place of the contextual toolbar.
  const openMistDock = () => {
    castRef.current = null;
    setMistConvo([]);
    setMistThinking(false);
    setMistDocked(false);
    setMistOpen(true);
    focusMist();
  };

  // ===== "/" to summon the mist chat (Esc to dismiss) =====
  useEffect(() => {
    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (view !== "editor") return;
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        if (!mistOpen) {
          castRef.current = { ...mouseRef.current };
          setMistConvo([]);
          setMistThinking(false);
          setMistDocked(false);
          setMistOpen(true);
        }
        focusMist();
      } else if (e.key === "Escape" && mistOpen) {
        closeMist();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mistOpen, view]);

  // accent override
  useEffect(() => {
    document.documentElement.style.setProperty("--blurple-400", t.accent);
  }, [t.accent]);

  const on = {
    activate, close, openSurface, split: splitFromActive, splitDrop, moveTab,
    moveTabBefore: moveTab,
    planUpdated, onGo: onPlanGo, goPulse,
    onSelect: setSelection,
    onAddMedia: addMedia,
  };
  // moveTab signature from strip drop: (tabId, paneId, beforeTabId)

  const activePane = panes[panes.length - 1];
  const dockCenterX = (ulOpen ? t.ulWidth : 0) + (window.innerWidth - (ulOpen ? t.ulWidth : 0)) / 2;
  const dockBottom = tlOpen ? t.tlHeight + 14 : 64; // ride above the timeline when it's open

  if (view === "home") return <Home onStart={enterEditor}/>;

  return (
    <div className={"app density-" + t.density}>
      <header className="top">
        <button className={"chrome-btn icon" + (ulOpen ? " on" : "")} title="Toggle Underlord"
                onClick={() => setTweak("underlord", !ulOpen)}><Icons.robot/></button>
        <div className="title">Launch video — rough cut<span className="crumb">Marketing</span></div>
        <div className="spacer"></div>
        <div className="status synced"><Icons.checkCircle/> Synced</div>
        <div className="avatars">
          <i style={{background:"linear-gradient(135deg,#d58c6a,#8b3a5a)"}}></i>
          <i style={{background:"linear-gradient(135deg,#a3a3ee,#6f58bd)"}}></i>
        </div>
        <button ref={shareRef} className={"chrome-btn" + (shareOpen ? " on" : "")} onClick={toggleShare}>Share</button>
        <button className="chrome-btn primary" onClick={openPublish}>Publish</button>
      </header>

      {shareOpen && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:49 }} onClick={() => setShareOpen(false)}></div>
          <div className="share-pop" style={{ top: sharePos.top, right: sharePos.right }}>
            <div className="sp-title">Project access</div>
            <div className="sp-invite">
              <input placeholder="Invite by email"/>
              <button>Invite</button>
            </div>
            <div className="sp-row">
              <span className="sp-ic"><Icons.globe/></span>
              <div className="sp-meta"><span className="sp-nm">Anyone with the link</span><span className="sp-sub">Can view</span></div>
              <Icons.chevD/>
            </div>
            <button className="sp-copy"><Icons.share2/> Copy link</button>
          </div>
        </>
      )}

      <div className="body" style={{ gridTemplateColumns: `${ulOpen ? t.ulWidth : 0}px 1fr` }}>
        <Underlord convo={convo} thinking={thinking} onSend={drawerSend} onUploadSend={uploadViaUnderlord}
                   onOpenArtifact={onOpenArtifact} onChip={drawerChip}
                   onNewChat={newChat} history={chatHistory} onSelectHistory={selectChat}
                   onSkill={onSkill} onPlanGo={onPlanGo} onReview={openReview}
                   onClose={() => setTweak("underlord", false)}/>

        <div className="workspace">
          <div className="ws-main">
            <Workspace panes={panes} tabsById={tabsById} density={t.density} on={on} demo={demo}/>
            {t.contextBar && !mistOpen && videoAdded && <ContextBar selection={selection} dockCenterX={dockCenterX} dockBottom={dockBottom} onUnderlord={openMistDock}/>}
            {!tlOpen && <TimelinePull onOpen={() => setTweak("timeline", true)}/>}
          </div>
          <Timeline open={tlOpen} height={t.tlHeight} onClose={() => setTweak("timeline", false)}/>
        </div>
      </div>

      {mistOpen && (
        <EphemeralChat docked={mistDocked} castPos={castRef.current}
                       dockCenterX={dockCenterX} dockBottom={dockBottom}
                       convo={mistConvo} thinking={mistThinking}
                       onSend={mistSend} onChip={mistChip} onOpenArtifact={onOpenArtifact}
                       onClose={closeMist} onDock={dockMist}/>
      )}

      <Tweaks t={t} setTweak={setTweak} applyScenario={applyScenario}/>
    </div>
  );
}

// bottom pull-up handle to reveal the timeline (click, or drag up)
function TimelinePull({ onOpen }) {
  const start = useRef(null);
  const onDown = (e) => {
    start.current = e.clientY;
    const move = (ev) => { if (start.current != null && start.current - ev.clientY > 22) { open(); } };
    const open = () => { cleanup(); onOpen(); };
    const up = () => cleanup();
    const cleanup = () => { start.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  return (
    <button className="tl-pull" onMouseDown={onDown} onClick={onOpen} title="Open timeline — drag up or click">
      Timeline
    </button>
  );
}

// Selection-aware contextual toolbar. Toolsets mirror Descript's real canvas
// toolbars (MediaRefToolbar for clips, CanvasSceneToolbar for scenes). Tools are
// representative; only "Ask Underlord" is wired.
const CTX_TOOLSETS = {
  video: { label: "Video clip", tools: [
    ["replace", "Replace"], ["fit", "Crop"], ["effects", "Effects"],
    ["audio", "Studio Sound"], ["sparkle", "Eye Contact"], ["color", "Color"],
  ] },
  scene: { label: "Scene", tools: [
    ["scenes", "Layout"], ["color", "Background"], ["effects", "Transition"], ["media", "Layers"],
  ] },
};
CTX_TOOLSETS.none = { label: null, tools: CTX_TOOLSETS.scene.tools };

function ContextBar({ selection, dockCenterX, dockBottom, onUnderlord }) {
  const set = CTX_TOOLSETS[selection] || CTX_TOOLSETS.none;
  return (
    <div className="ctx-bar" style={{ left: dockCenterX, bottom: dockBottom }}>
      {set.label && <span className="ctx-label">{set.label}</span>}
      {set.tools.map(([icon, label]) => {
        const I = Icons[icon] || Icons.wand;
        return <button className="fb" key={label} aria-label={label} data-tip={label}><I/></button>;
      })}
      <div className="sep"></div>
      <button className="fb ul" onClick={onUnderlord} aria-label="Ask Underlord" data-tip="Ask Underlord"><Icons.robot/></button>
    </div>
  );
}

function Tweaks({ t, setTweak, applyScenario }) {
  return (
    <TweaksPanel>
      <TweakSection label="Scenario"/>
      <TweakRadio label="Set-up state" value={t.scenario}
        options={[{value:"empty",label:"Empty"},{value:"postUpload",label:"Uploaded"},{value:"roughCut",label:"Rough cut"}]}
        onChange={applyScenario}/>
      <TweakSection label="Layout"/>
      <TweakToggle label="Underlord drawer" value={t.underlord} onChange={(v) => setTweak("underlord", v)}/>
      <TweakToggle label="Timeline drawer" value={t.timeline} onChange={(v) => setTweak("timeline", v)}/>
      <TweakSlider label="Underlord width" value={t.ulWidth} min={260} max={420} step={4} unit="px" onChange={(v) => setTweak("ulWidth", v)}/>
      <TweakSlider label="Timeline height" value={t.tlHeight} min={160} max={320} step={4} unit="px" onChange={(v) => setTweak("tlHeight", v)}/>
      <TweakSection label="Style"/>
      <TweakRadio label="Density" value={t.density} options={["compact","comfortable"]} onChange={(v) => setTweak("density", v)}/>
      <TweakColor label="Underlord accent" value={t.accent}
        options={["#A3A3EE","#7A7ADC","#8841C6","#B84676"]} onChange={(v) => setTweak("accent", v)}/>
      <TweakSection label="Future direction"/>
      <TweakToggle label="Contextual toolbar" value={t.contextBar} onChange={(v) => setTweak("contextBar", v)}/>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
