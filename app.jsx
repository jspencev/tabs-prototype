// app.jsx — root: state, tab system, underlord flow, drawers, moderator panel
const { useState, useEffect, useRef, useCallback } = React;

const UL_WIDTH = 320;
const TL_HEIGHT = 300;

// Study telemetry (metrics.js) — no-op if it didn't load.
const TRK = (e, p) => window.METRICS && window.METRICS.track(e, p);

// ?state= from a Great Question task link drops the participant straight into
// a set-up state (hyphenated or camelCase), bypassing the moderator panel.
const URL_SCENARIO = (() => {
  const s = (new URLSearchParams(window.location.search).get("state") || "").toLowerCase();
  return { "empty": "empty", "post-upload": "postUpload", "postupload": "postUpload",
           "rough-cut": "roughCut", "roughcut": "roughCut",
           "clips-added": "clipsAdded", "clipsadded": "clipsAdded" }[s] || null;
})();
const DEFAULT_SCENARIO = URL_SCENARIO || "empty";
// ?task=N puts Underlord in task mode: the participant's first message plays
// that task's scripted beat regardless of wording (see TASK_BEATS).
const URL_TASK = parseInt(new URLSearchParams(window.location.search).get("task"), 10) || 0;

// Moderator set-up states — the starting points the research tasks assume.
const SCENARIOS = [
  { value: "empty",      label: "Empty",       sub: "New project, nothing uploaded" },
  { value: "postUpload", label: "Post-upload", sub: "Video + transcript, fillers present" },
  { value: "roughCut",   label: "Rough cut",   sub: "Scenes, music, chapters; fillers removed" },
  { value: "clipsAdded", label: "Clips added", sub: "Rough cut + clips in the project" },
];

// Canvas effects live at app level so the command bar (rendered by App) and the
// Video Properties panel drive one source of truth.
const FX_BUSY = { studioSound: "ssBusy", eyeContact: "ecBusy", centerSpeaker: "csBusy" };
const FX_DEFAULTS = { studioSound: false, ssBusy: false, ssIntensity: 70,
  eyeContact: false, ecBusy: false, centerSpeaker: false, csBusy: false };

let _seq = 100;
const uid = (p) => `${p}-${_seq++}`;

// Every tab belongs to a composition ("main" unless it shows a clip).
function makeTab(kind, extra = {}) {
  const d = SURFACE_DEFS[kind] || { label: kind, icon: "doc" };
  return { id: uid(kind), kind, label: d.label, icon: d.icon, closeable: true, comp: "main", ...extra };
}

// Moderator scenarios: the prototype can be reset into any of the set-up states
// the research tasks assume. A scenario derives the demo flags, the seeded
// Underlord conversation, and a clean Canvas + Script layout.
function scenarioBaseline(scenario) {
  const tabsById = { "video-1": makeTab("video", { id: "video-1", closeable: false }),
                     "script-1": makeTab("script", { id: "script-1" }) };
  const panes = [{ id: "p1", tabIds: ["video-1", "script-1"], activeId: "video-1" }];
  // Underlord is decoupled from project state: a scenario only sets up the
  // project. It never fabricates chat — Underlord stays empty until the user
  // talks to it (or uploads through it).
  const flags = (f) => ({ videoAdded: false, fillersRemoved: false, fillerStriking: false,
                          chaptersAdded: false, rearranged: false, scenesAdded: false, clipsAdded: false, ...f });
  if (scenario === "postUpload") return { tabsById, panes, flags: flags({ videoAdded: true }), convo: [] };
  if (scenario === "roughCut")   return { tabsById, panes,
    flags: flags({ videoAdded: true, fillersRemoved: true, chaptersAdded: true, scenesAdded: true }), convo: [] };
  if (scenario === "clipsAdded") return { tabsById, panes,
    flags: flags({ videoAdded: true, fillersRemoved: true, chaptersAdded: true, scenesAdded: true, clipsAdded: true }), convo: [] };
  return { tabsById, panes, flags: flags(), convo: [] };
}
const INITIAL = scenarioBaseline(DEFAULT_SCENARIO);

function App() {
  // ---- shell / drawers ----
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [ulOpen, setUlOpen] = useState(true);
  const [tlOpen, setTlOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false); // moderator panel (Cmd+Shift+P)

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
  // One-time onboarding: the very first new tab a user opens lands as a split
  // on the other side, to teach the multi-pane model.
  const firstOpenSplit = useRef(true);
  // Task mode: the beat plays once per task page load; later messages fall
  // back to keyword routing.
  const taskBeatFired = useRef(false);

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

  // ---- compositions popover (title-bar chevron) ----
  const [compsOpen, setCompsOpen] = useState(false);
  const [compsPos, setCompsPos] = useState({ top: 0, left: 0 });
  const [compsNaming, setCompsNaming] = useState(false);
  const [compsName, setCompsName] = useState("");
  const compRef = useRef(null);

  // ---- guided demo state ----
  const [view, setView] = useState("editor");      // 'home' | 'editor' — drop into the empty editor
  const [videoAdded, setVideoAdded] = useState(INITIAL.flags.videoAdded);
  const [fillersRemoved, setFillersRemoved] = useState(INITIAL.flags.fillersRemoved);
  const [fillerStriking, setFillerStriking] = useState(INITIAL.flags.fillerStriking);
  const [chaptersAdded, setChaptersAdded] = useState(INITIAL.flags.chaptersAdded);
  const [rearranged, setRearranged] = useState(INITIAL.flags.rearranged);
  const [scenesAdded, setScenesAdded] = useState(INITIAL.flags.scenesAdded);
  const [clipsAdded, setClipsAdded] = useState(INITIAL.flags.clipsAdded);
  const [planPhase, setPlanPhase] = useState(null); // null | 'proposed' | 'revised' | 'done'
  const [selection, setSelection] = useState(null); // null | 'video' | 'scene' | 'text' — canvas selection
  const [fx, setFx] = useState(FX_DEFAULTS);        // canvas effects (lifted from VideoSurface)
  const [ssPop, setSsPop] = useState(null);         // Studio Sound intensity popover: { rect } | null
  // The speaker lower-third starts hidden everywhere: Task 6 is the participant
  // *adding* it (Speaker layout / Add element → Text). Task links can pre-place
  // it with &lt=1 (Task 7 continues from a just-added text layer).
  const [textLayerVisible, setTextLayerVisible] = useState(
    new URLSearchParams(window.location.search).get("lt") === "1");
  const [freeTextVisible, setFreeTextVisible] = useState(false); // "Add element → Text" layer
  const [sceneLayout, setSceneLayout] = useState("Default Camera"); // active scene layout (picker)
  const fxTimers = useRef({});
  // Script tab AI actions (header pills) + text selection inside the transcript.
  const [scriptBusy, setScriptBusy] = useState(null); // null | 'fillers' | 'clarity'
  const [scriptSel, setScriptSel] = useState(false);
  const scriptRange = useRef(null);
  const scriptTimer = useRef(null);
  const [mediaSeg, setMediaSeg] = useState("project"); // Media browser segment
  // Intro slide (Underlord "Add an intro"): a title slide before the video.
  // playZone tracks which timeline section the playhead sits in.
  const [introAdded, setIntroAdded] = useState(false);
  const [introBg, setIntroBg] = useState(null);        // CSS background from a Stock tile
  const [playZone, setPlayZone] = useState("video");   // 'intro' | 'video'
  // Task 8 beat: Underlord "moves" the music bed to 0:00 (timeline applies it).
  const [musicMoved, setMusicMoved] = useState(false);
  const demo = { videoAdded, fillersRemoved, fillerStriking, chaptersAdded, rearranged, scenesAdded, clipsAdded, introAdded, musicMoved };

  // ===== tab operations =====
  const activate = (paneId, tabId) =>
    setPanes((ps) => ps.map((p) => p.id === paneId ? { ...p, activeId: tabId } : p));

  const close = (tabId) => {
    const tab = tabsById[tabId];
    if (tab && !tab.closeable) return;
    if (tabId === planId.current) planId.current = null;
    if (tabId === reviewId.current) reviewId.current = null;
    // Drop the tab record too — open-state checks ([+] menu, openSurface reuse)
    // read tabsById, and a ghost entry makes closed tabs look open forever.
    setTabsById((m) => { const next = { ...m }; delete next[tabId]; return next; });
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

  const openSurface = (paneId, kind, focus = true, comp = "main", extra = {}) => {
    // reuse the existing tab of this kind *within the same composition*
    const existing = Object.values(tabsById).find((x) => x.kind === kind && (x.comp || "main") === comp);
    if (existing) {
      setPanes((ps) => ps.map((p) => p.tabIds.includes(existing.id) ? { ...p, activeId: existing.id } : p));
      return existing.id;
    }
    const nt = makeTab(kind, { comp, ...extra });
    TRK("surface_opened", { target: kind });
    setTabsById((m) => ({ ...m, [nt.id]: nt }));
    // First new tab ever opens as a split on the other side (once per session).
    if (firstOpenSplit.current) {
      firstOpenSplit.current = false;
      TRK("split_created", { via: "auto-first-tab" });
      setPanes((ps) => ps.length > 1
        ? ps.map((p) => p.id === paneId ? { ...p, tabIds: [...p.tabIds, nt.id], activeId: nt.id } : p)
        : [...ps, { id: uid("p"), tabIds: [nt.id], activeId: nt.id }]);
      return nt.id;
    }
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
    TRK("split_created", { via: "split-button" });
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

  const splitDrop = (tabId, afterPaneId, via = "drag") => {
    if (tabId == null) return;
    TRK("split_created", { via });
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

  // Graceful generic acknowledgement — any unrecognized participant message
  // ends the research task here without spawning fake artifacts.
  const runGenericAck = (text, setList, setBusy, timerRef) => {
    setList((c) => [...c, { role: "user", text }]);
    setBusy(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setBusy(false);
      setList((c) => [...c, { role: "ai", text: "Got it — I'll take a pass at that and check back in when it's ready for review." }]);
    }, 1400);
  };

  const runGo = (setList) => {
    setGoPulse(false);
    setTlOpen(true);
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
      setConvo((c) => [...c, { role: "ai", text: "Done — the cut now opens on the payoff and groups the research sections together.", review: true }]);
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
      setConvo((c) => [...c, { role: "ai", text: "Added 8 chapters: Introduction, Competitive Research, Customer & Persona Research, Messaging & Positioning, and 4 more — you'll see them in the script and as scenes on the timeline." }]);
    }, 1400);
  };

  // Direct (no-plan) script edit — the lighter edit: remove filler words.
  const runDirectScriptEdit = (text) => {
    TRK("fillers_removed", { via: "underlord" });
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

  // "Find me a…" → point at the stock library and open it (Notion Task 5).
  const runStockGuide = (text) => {
    TRK("stock_opened", { via: "underlord" });
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setMediaSeg("stock");
      openSurface(panes[panes.length - 1].id, "media");
      setConvo((c) => [...c, { role: "ai", text: "Descript has a built-in stock library — I opened it in the Media tab. Search there and drag anything onto the canvas." }]);
    }, 1200);
  };

  // ===== Script tab AI actions (header pills — direct manipulation, no chat) =====
  const runScriptTool = (kind) => {
    if (scriptBusy) return;
    TRK("fillers_removed", { via: "script-pill:" + kind });
    setScriptBusy(kind);
    setFillerStriking(true);
    clearTimeout(scriptTimer.current);
    scriptTimer.current = setTimeout(() => {
      setFillerStriking(false);
      setFillersRemoved(true);
      setScriptBusy(null);
    }, 1400);
  };

  // ===== Script text selection → command bar 'script' context =====
  useEffect(() => {
    const h = () => {
      const s = document.getSelection();
      const node = s && !s.isCollapsed && s.anchorNode;
      const el = node && (node.nodeType === 1 ? node : node.parentElement);
      if (el && el.closest && el.closest(".script-doc")) {
        scriptRange.current = s.getRangeAt(0);
        setScriptSel(true);
      } else {
        setScriptSel(false);
      }
    };
    document.addEventListener("selectionchange", h);
    return () => document.removeEventListener("selectionchange", h);
  }, []);

  // Ignore = Descript's non-destructive strike: wrap the selection so it reads
  // as skipped, leaving the words in the doc.
  const ignoreSelection = () => {
    const r = scriptRange.current;
    if (!r) return;
    TRK("script_ignore");
    const span = document.createElement("span");
    span.className = "ignored";
    try { r.surroundContents(span); }
    catch { const frag = r.extractContents(); span.appendChild(frag); r.insertNode(span); }
    const s = document.getSelection();
    if (s) s.removeAllRanges();
    setScriptSel(false);
  };
  const deleteSelection = () => {
    const r = scriptRange.current;
    if (!r) return;
    TRK("script_delete");
    r.deleteContents();
    const s = document.getSelection();
    if (s) s.removeAllRanges();
    setScriptSel(false);
  };

  const drawerSend = (text) => {
    TRK("underlord_message", { via: "drawer" });
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
    // Task mode (GQ links): the first message plays the task's beat verbatim,
    // whatever the wording — participants can't stall off-script. Later
    // messages fall through to the keyword routing below.
    if (URL_TASK && !taskBeatFired.current && TASK_BEATS[URL_TASK]) {
      taskBeatFired.current = true;
      TASK_BEATS[URL_TASK](text);
      return;
    }
    // Plan phrase must be tested before the bare script phrase (one contains the other).
    if (/edit the script with a plan|with a plan|make a plan/.test(t)) { runRearrangePlan(text); return; }
    if (/edit the script|remove filler|clean up the script|tighten the script/.test(t)) { runDirectScriptEdit(text); return; }
    if (/edit the plan/.test(t)) { guidanceNoPlan(text); return; }
    if (/chapter/.test(t)) { runChapters(text); return; }
    if (/what clips|which clips|where.+clips|clips.+(exist|project)|find (the |my )?clips|show.+clips/.test(t)) { runListClips(text); return; }
    if (/create clips|make (some )?clips|social clips|clip the|cut.+clips/.test(t)) { runCreateClips(text); return; }
    if (/add (an |the )?intro|intro (slide|title)/.test(t)) { runAddIntro(text); return; }
    if (/lower.?third|speaker(?:'s)? name|name and title|name & title|speaker layout/.test(t)) { runAddLowerThird(text); return; }
    if (/studio ?sound|background noise|clean.+audio/.test(t)) { runStudioSoundSkill(text); return; }
    if (/stock|b-roll|broll|find (me )?(a|an|some) |image of|footage|background image/.test(t)) { runStockGuide(text); return; }
    runGenericAck(text, setConvo, setThinking, timer);
  };
  const drawerChip = (text) => { if (/^(go|looks good)/i.test(text)) runGo(setConvo); else drawerSend(text); };

  // ===== moderator: reset the editor into a set-up state =====
  const applyScenario = (s) => {
    setScenario(s);
    const b = scenarioBaseline(s);
    planId.current = null; reviewId.current = null; firstOpenSplit.current = true;
    clearTimeout(timer.current); clearTimeout(mistTimer.current);
    setTabsById(b.tabsById); setPanes(b.panes);
    setVideoAdded(b.flags.videoAdded); setFillersRemoved(b.flags.fillersRemoved);
    setFillerStriking(b.flags.fillerStriking); setChaptersAdded(b.flags.chaptersAdded);
    setRearranged(b.flags.rearranged); setScenesAdded(b.flags.scenesAdded); setClipsAdded(b.flags.clipsAdded);
    setThinking(false); setConvo(b.convo); setPlanPhase(null); setGoPulse(false);
    setMistOpen(false); setMistDocked(false); setMistConvo([]); setMistThinking(false);
    setSelection(null); setFx(FX_DEFAULTS); setSsPop(null); setTextLayerVisible(false); setFreeTextVisible(false);
    setSceneLayout("Default Camera");
    setMediaSeg("project"); setCustomComps([]); setCompsOpen(false);
    setIntroAdded(false); setIntroBg(null); setPlayZone("video");
    setMusicMoved(false); window.DEMO_TEXT_STYLE = null; taskBeatFired.current = false;
    setTlOpen(false);
    setView("editor");
  };

  // ===== top chrome: publish tab + share popover =====
  const openPublish = () => openSurface(panes[panes.length - 1].id, "publish");
  const toggleComps = () => {
    setCompsNaming(false); setCompsName("");
    if (compsOpen) { setCompsOpen(false); return; }
    TRK("comps_menu_opened");
    const r = compRef.current && compRef.current.getBoundingClientRect();
    if (r) setCompsPos({ top: r.bottom + 8, left: r.left });
    setCompsOpen(true);
  };
  const focusMainComp = () => {
    setPanes((ps) => ps.map((p) => p.tabIds.includes("video-1") ? { ...p, activeId: "video-1" } : p));
    setCompsOpen(false);
  };
  const toggleShare = () => {
    if (shareOpen) { setShareOpen(false); return; }
    const r = shareRef.current && shareRef.current.getBoundingClientRect();
    if (r) setSharePos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    setShareOpen(true);
  };

  // ===== canvas effects (toggle with a brief processing state) =====
  const toggleEffect = (key) => {
    const bk = FX_BUSY[key];
    const wasOff = !fx[key] && !fx[bk];
    setFx((s) => {
      if (s[key]) return { ...s, [key]: false };  // remove
      if (s[bk]) return s;                          // already processing
      return { ...s, [bk]: true };                  // start processing
    });
    if (wasOff) {
      clearTimeout(fxTimers.current[key]);
      fxTimers.current[key] = setTimeout(() => setFx((s) => ({ ...s, [bk]: false, [key]: true })), 1600);
    }
  };
  const setSsIntensity = (v) => setFx((s) => ({ ...s, ssIntensity: v }));
  // Studio Sound has an intensity popover (the canonical control). Any surface
  // opens the same one, anchored to its trigger; applying kicks off processing.
  const onStudioSound = (rect) => {
    setSsPop({ rect });
    if (!fx.studioSound && !fx.ssBusy) { TRK("studio_sound_applied", { via: "pill-popover" }); toggleEffect("studioSound"); }
  };
  const removeStudioSound = () => { if (fx.studioSound) toggleEffect("studioSound"); setSsPop(null); };
  const deleteTextLayer = () => {
    if (selection === "text2") setFreeTextVisible(false);
    else if (selection !== "introTitle") setTextLayerVisible(false);
    setSelection(null);
  };

  // Apply a scene layout from the picker (Notion Task 6). "Speaker Name" is the
  // lower-third; selecting it shows the name/title overlay. Other layouts just
  // register as the active layout (believable-but-canned, like the rest).
  const applyLayout = (name, via = "layout-picker") => {
    TRK("layout_applied", { target: name, via });
    setSceneLayout(name);
    if (name === "Speaker Name") { TRK("lower_third_added", { via }); setTextLayerVisible(true); setSelection("text"); }
    else { setTextLayerVisible(false); if (selection === "text") setSelection("scene"); }
  };

  // Command-bar representative menus: the few items that must visibly work
  // (Notion Task 6) act; the rest just close the menu.
  const onRepAction = (kind, item) => {
    if (kind === "layout") { applyLayout(item); return; }
    if (kind === "add" && (item === "Speaker name" || item === "Subtitle")) { TRK("element_added", { target: item }); TRK("lower_third_added", { via: "add-element" }); setTextLayerVisible(true); setSelection("text"); return; }
    if (kind === "add" && (item === "Text" || item === "Title")) { TRK("element_added", { target: item }); setFreeTextVisible(true); setSelection("text2"); return; }
  };

  // ===== empty Video tab: direct upload/record just adds media =====
  // Direct manipulation, NOT a chat action — it must not touch Underlord. Only
  // uploading *through* Underlord (its attachment) would make Underlord respond.
  const addMedia = () => {
    TRK("media_added", { via: "direct-upload" });
    setScenario("postUpload");
    setVideoAdded(true);
  };

  // ===== upload *through* Underlord (paperclip attachment + send) =====
  // The one upload path that legitimately makes Underlord respond. Underlord is
  // on rails: this plays a scripted acknowledgement, it does not execute anything.
  const uploadViaUnderlord = (text, file) => {
    TRK("media_added", { via: "underlord-attachment" });
    const msg = { role: "user", file };
    if (text) msg.text = text;
    setConvo((c) => [...c, msg]);
    setScenario("postUpload");
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
    TRK("media_added", { via: "home-upload" });
    setView("editor");
    setUlOpen(true);
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

  // ===== clips & compositions =====
  const openClip = (clip) => {
    TRK("clip_opened", { target: clip.name });
    openSurface(panes[panes.length - 1].id, "video", true, clip.id, { compName: clip.name });
  };
  // User-created compositions live in a registry so the [+] menu and the
  // compositions popover can list them even when their tabs are closed.
  const [customComps, setCustomComps] = useState([]); // { id, name, blank }
  const newComposition = (paneId, name) => {
    const id = uid("comp");
    const nm = (name || "").trim() || "Untitled";
    setCustomComps((cs) => [...cs, { id, name: nm, blank: true }]);
    const nt = makeTab("video", { comp: id, compName: nm, blank: true });
    setTabsById((m) => ({ ...m, [nt.id]: nt }));
    setPanes((ps) => ps.map((p) => p.id === paneId
      ? { ...p, tabIds: [...p.tabIds, nt.id], activeId: nt.id } : p));
  };
  const fillBlankComp = (tabId) => {
    const tb = tabsById[tabId];
    setTabsById((m) => (m[tabId] ? { ...m, [tabId]: { ...m[tabId], blank: false } } : m));
    if (tb) setCustomComps((cs) => cs.map((c) => c.id === tb.comp ? { ...c, blank: false } : c));
  };
  // Open a surface (Canvas/Script) scoped to a composition.
  const openComp = (paneId, comp, kind) => {
    if (comp.id === "main") { openSurface(paneId, kind, true, "main"); return; }
    openSurface(paneId, kind, true, comp.id, { compName: comp.name, blank: !!comp.blank });
  };
  const runCreateClips = (text) => {
    TRK("clips_created", { via: text ? "underlord" : "skill" });
    setConvo((c) => [...c, { role: "user", text: text || "Create clips" }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setClipsAdded(true);
      setScenario("clipsAdded");
      const D = window.DEMO || {};
      const folder = (D.compositions && D.compositions.clipsFolder) || "Clips";
      setConvo((c) => [...c,
        { role: "ai", text: `Created 4 clips from the strongest moments. They're saved as new compositions in “${folder}” — open any of them as a tab.` },
        { role: "ai", clips: true },
      ]);
    }, 1800);
  };
  const runListClips = (text) => {
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      if (clipsAdded) {
        setConvo((c) => [...c,
          { role: "ai", text: "This project has the main video plus 4 clips. Click one to open it as a tab:" },
          { role: "ai", clips: true },
        ]);
      } else {
        setConvo((c) => [...c, { role: "ai", text: "No clips yet — type “/” and pick Create clips, and I'll cut the best moments into shareable clips." }]);
      }
    }, 1000);
  };

  // ===== intro slide ("Add an intro") =====
  const runAddIntro = (text) => {
    setConvo((c) => [...c, { role: "user", text: text || "Add an intro" }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setIntroAdded(true);
      setPlayZone("intro");
      setTlOpen(true);
      openSurface(panes[panes.length - 1].id, "video", true, "main");
      setConvo((c) => [...c, { role: "ai",
        text: "Added an intro slide before your video — you can see it at the start of the timeline. Edit the title right on the canvas, or grab a background clip from Stock with the + button." }]);
    }, 1500);
  };

  const runAddLowerThird = (text) => {
    setConvo((c) => [...c, { role: "user", text: text || "Add lower thirds" }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      openSurface(panes[panes.length - 1].id, "video", true, "main");
      applyLayout("Speaker Name", "underlord");
      setConvo((c) => [...c, { role: "ai",
        text: "Applied the Speaker Name layout — the speaker's name and title now sit in the lower-left. Click the text on the canvas to edit it, or drag to reposition." }]);
    }, 1300);
  };

  // Stock "+" (Add as new layer): with an intro, the clip drops in behind the
  // intro title; otherwise it behaves like a plain add-to-canvas.
  const onStockAdd = (item, gradient) => {
    TRK("stock_added", { target: item && item.t });
    if (introAdded) {
      if (gradient) setIntroBg(gradient);
      setPlayZone("intro");
      openSurface(panes[panes.length - 1].id, "video", true, "main");
      return;
    }
    if (!videoAdded) { addMedia(); }
    openSurface(panes[panes.length - 1].id, "video", true, "main");
  };

  // ===== task mode (GQ links): beats for tasks without a keyword trigger =====
  const runTaskGuidance = (text, reply) => {
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setConvo((c) => [...c, { role: "ai", text: reply }]);
    }, 1100);
  };

  // Task 7: restyle the speaker lower-third. The text-layer state lives in
  // VideoSurface, so the override travels via window.DEMO_TEXT_STYLE + an event
  // (applied on mount too, in case the canvas isn't showing yet).
  const runStyleTextBeat = (text) => {
    TRK("text_style_changed", { via: "underlord" });
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      openSurface(panes[panes.length - 1].id, "video", true, "main");
      setTextLayerVisible(true);
      window.DEMO_TEXT_STYLE = { color: "#A3A3EE", fontSize: 38 };
      window.dispatchEvent(new Event("demo:style-text"));
      setSelection("text");
      setConvo((c) => [...c, { role: "ai",
        text: "Restyled the speaker name — larger, in the brand purple. Tweak the font, size, or color further in the Properties panel on the right." }]);
    }, 1300);
  };

  // Task 8: slide the music bed to the end of the introduction scene.
  const runMusicToStart = (text) => {
    TRK("music_repositioned", { via: "underlord" });
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setTlOpen(true);
      setMusicMoved(true);
      setConvo((c) => [...c, { role: "ai",
        text: "Moved the music bed so it starts right where the introduction ends — you can see it on the timeline below, and drag it anytime." }]);
    }, 1300);
  };

  // Task 15: perform the split (Script beside Canvas) on the participant's behalf.
  const runSplitBeat = (text) => {
    setConvo((c) => [...c, { role: "user", text }]);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      const scriptTab = Object.values(tabsById).find((tb) => tb.kind === "script" && (tb.comp || "main") === "main");
      if (scriptTab && panes.length === 1) splitDrop(scriptTab.id, null, "underlord");
      setConvo((c) => [...c, { role: "ai",
        text: "Done — script on the right, canvas on the left. You can make a split yourself anytime by dragging a tab to the right edge of the tab bar." }]);
    }, 1300);
  };

  // ===== guided demo: skills =====
  const onSkill = (id) => {
    if (id === "fillers") runFillerBeat();
    if (id === "clips") runCreateClips();
    if (id === "studioSound") runStudioSoundSkill();
  };
  const runStudioSoundSkill = (text) => {
    TRK("studio_sound_applied", { via: text ? "underlord" : "skill" });
    openSurface(panes[panes.length - 1].id, "video", true, "main");
    setConvo((c) => [...c, { role: "user", text: text || "Studio Sound" }]);
    setThinking(true);
    if (!fx.studioSound && !fx.ssBusy) toggleEffect("studioSound");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setConvo((c) => [...c, { role: "ai", text: "Applied Studio Sound across the project — background noise is gone and voices sound crisp. Tune the intensity from the Studio Sound pill on the canvas, or in Properties." }]);
    }, 1800);
  };
  const runFillerBeat = () => {
    TRK("fillers_removed", { via: "skill" });
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

  // Task number → the beat any message should play (the Notion research plan's
  // "right thing" per task). Tasks 1–2 are pre-upload (the no-media gate already
  // answers correctly) and 13 is verbal-only, so they're absent. Declared after
  // every beat above — the map captures them by value at render time.
  const TASK_BEATS = {
    3:  (t) => runTaskGuidance(t, "A good place to start is the Script tab — your video edits like a doc there. Or just tell me what you want changed and I'll take care of it."),
    4:  runDirectScriptEdit,
    5:  runStockGuide,
    6:  runAddLowerThird,
    7:  runStyleTextBeat,
    8:  runMusicToStart,
    9:  runStudioSoundSkill,
    10: (t) => runTaskGuidance(t, "I can do that for you — the Create clips skill finds the strongest moments and cuts them into shareable clips. Type “/” and pick Create clips whenever you're ready."),
    11: runCreateClips,
    12: runListClips,
    14: (t) => runTaskGuidance(t, "The [+] button in the tab bar opens any surface as a new tab — Canvas, Script, Media, Publish, or a whole new composition."),
    15: runSplitBeat,
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
    TRK("underlord_message", { via: "mist" });
    // Task mode: a mist message counts as talking to Underlord — dock into the
    // drawer and play the task's beat there, same as drawerSend.
    if (URL_TASK && !taskBeatFired.current && TASK_BEATS[URL_TASK] && videoAdded && planPhase == null) {
      taskBeatFired.current = true;
      setMistOpen(false); setMistDocked(false); setMistConvo([]);
      setUlOpen(true);
      TASK_BEATS[URL_TASK](text);
      return;
    }
    setMistConvo((c) => [...c, { role: "user", text }]);
    setMistDocked(true);
    setMistThinking(true);
    clearTimeout(mistTimer.current);
    mistTimer.current = setTimeout(() => {
      setMistThinking(false);
      setMistConvo((c) => [...c, { role: "ai", text: "Got it — I'll take a pass at that and check back in when it's ready for review." }]);
    }, 900);
  };
  const mistChip = (text) => mistSend(text);
  const closeMist = () => { setMistOpen(false); setMistDocked(false); };
  const dockMist = () => {
    setConvo(mistConvo);
    setThinking(false);
    setUlOpen(true);
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

  // Cmd+Shift+P (or Ctrl+Shift+P) toggles the hidden moderator panel.
  useEffect(() => {
    const h = (e) => {
      if ((e.key === "p" || e.key === "P") && e.shiftKey && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setModOpen((o) => !o); }
      else if (e.key === "Escape") setModOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const on = {
    activate, close, openSurface, split: splitFromActive, splitDrop, moveTab,
    moveTabBefore: moveTab,
    planUpdated, onGo: onPlanGo, goPulse,
    onAddMedia: addMedia,
    sel: selection, setSel: setSelection,
    fx, onEffect: toggleEffect, onStudioSound, textLayerVisible, freeTextVisible,
    onScriptTool: runScriptTool, scriptBusy,
    mediaSeg, openClip,
    setMediaSeg: (s) => { if (s === "stock") TRK("stock_opened", { via: "media-tab" }); setMediaSeg(s); },
    intro: { added: introAdded, bg: introBg, zone: playZone }, onStockAdd,
    newComposition, onFillBlank: fillBlankComp, openComp,
    comps: [
      { id: "main", name: "Main video" },
      ...(clipsAdded ? (((window.DEMO || {}).compositions || {}).clips || []).map((c) => ({ id: c.id, name: c.name })) : []),
      ...customComps,
    ],
  };
  // moveTab signature from strip drop: (tabId, paneId, beforeTabId)

  const activePane = panes[panes.length - 1];
  const activeTab = activePane && tabsById[activePane.activeId];
  const activeCompName = (activeTab && activeTab.compName) || "Main video";
  const DCOMPS = (window.DEMO && window.DEMO.compositions) || { main: { name: "Main video" }, clips: [] };
  const dockCenterX = (ulOpen ? UL_WIDTH : 0) + (window.innerWidth - (ulOpen ? UL_WIDTH : 0)) / 2;
  const dockBottom = tlOpen ? TL_HEIGHT + 14 : 64; // ride above the timeline when it's open
  // Command bar context: only the visible canvas (with media) drives selection-aware
  // actions. With no media or off-canvas, the bar shows just Ask Underlord ("none").
  const canvasVisible = panes.some((p) => { const tb = tabsById[p.activeId]; return tb && tb.kind === "video"; });
  // A live transcript text selection takes the bar over; an explicit selection
  // (canvas layer or timeline a-roll) drives it next; the visible canvas implies
  // scene context; otherwise just Ask Underlord.
  const cmdContext = !videoAdded ? "none"
    : scriptSel ? "script"
    : selection ? (selection === "text2" || selection === "introTitle" ? "text" : selection)
    : canvasVisible ? "scene" : "none";

  if (view === "home") return <Home onStart={enterEditor}/>;

  return (
    <div className="app density-comfortable">
      <header className="top">
        <button className={"chrome-btn icon" + (ulOpen ? " on" : "")} title="Toggle Underlord"
                onClick={() => setUlOpen((v) => !v)}><Icons.robot/></button>
        <div className="title">{(window.DEMO && window.DEMO.projectTitle) || "Untitled project"}<span className="crumb">Marketing</span>
          {videoAdded && (
            <button ref={compRef} className={"comp-btn" + (compsOpen ? " on" : "")}
                    title="Compositions" onClick={toggleComps}>
              <span className="cb-sep">/</span> {activeCompName} <Icons.chevD/>
            </button>
          )}
        </div>
        <div className="spacer"></div>
        <div className="status synced"><Icons.checkCircle/> Synced</div>
        <div className="avatars">
          <i style={{background:"linear-gradient(135deg,#d58c6a,#8b3a5a)"}}></i>
          <i style={{background:"linear-gradient(135deg,#a3a3ee,#6f58bd)"}}></i>
        </div>
        <button ref={shareRef} className={"chrome-btn" + (shareOpen ? " on" : "")} onClick={toggleShare}>Share</button>
        <button className="chrome-btn primary" onClick={openPublish}>Publish</button>
      </header>

      {compsOpen && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:49 }} onClick={() => setCompsOpen(false)}></div>
          <div className="comps-pop" style={{ top: compsPos.top, left: compsPos.left }}>
            <div className="cp-label">Compositions</div>
            <button className={"cp-item" + (activeCompName === "Main video" ? " on" : "")} onClick={focusMainComp}>
              <span className="cp-thumb" style={{ backgroundImage: "url(video-thumb.png)" }}></span>
              <span className="cp-meta"><span className="cp-nm">Main video</span><span className="cp-sub">{DCOMPS.main.duration}</span></span>
            </button>
            {clipsAdded && (
              <>
                <div className="cp-label folder"><Icons.folder/> {DCOMPS.clipsFolder}</div>
                {DCOMPS.clips.map((c) => (
                  <button key={c.id} className={"cp-item" + (activeCompName === c.name ? " on" : "")}
                          onClick={() => { openClip(c); setCompsOpen(false); }}>
                    <span className="cp-thumb" style={{ backgroundImage: "url(video-thumb.png)" }}></span>
                    <span className="cp-meta"><span className="cp-nm">{c.name}</span><span className="cp-sub">Clip · {c.duration}</span></span>
                  </button>
                ))}
              </>
            )}
            {customComps.map((c) => (
              <button key={c.id} className={"cp-item" + (activeCompName === c.name ? " on" : "")}
                      onClick={() => { openComp(panes[panes.length - 1].id, c, "video"); setCompsOpen(false); }}>
                <span className="cp-thumb" style={{ backgroundImage: c.blank ? "none" : "url(video-thumb.png)" }}></span>
                <span className="cp-meta"><span className="cp-nm">{c.name}</span><span className="cp-sub">{c.blank ? "Empty" : "Composition"}</span></span>
              </button>
            ))}
            {compsNaming ? (
              <div className="cp-name">
                <input autoFocus placeholder="Composition name" value={compsName}
                       onChange={(e) => setCompsName(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === "Enter") { newComposition(panes[panes.length - 1].id, compsName); setCompsNaming(false); setCompsName(""); setCompsOpen(false); }
                         if (e.key === "Escape") { setCompsNaming(false); setCompsName(""); }
                       }}/>
                <button onClick={() => { newComposition(panes[panes.length - 1].id, compsName); setCompsNaming(false); setCompsName(""); setCompsOpen(false); }}>Create</button>
              </div>
            ) : (
              <button className="cp-new" onClick={() => setCompsNaming(true)}>
                <Icons.plus/> New composition
              </button>
            )}
          </div>
        </>
      )}

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

      <div className="body" style={{ gridTemplateColumns: `${ulOpen ? UL_WIDTH : 0}px 1fr` }}>
        <Underlord convo={convo} thinking={thinking} onSend={drawerSend} onUploadSend={uploadViaUnderlord}
                   onOpenArtifact={onOpenArtifact} onChip={drawerChip}
                   onNewChat={newChat} history={chatHistory} onSelectHistory={selectChat}
                   onSkill={onSkill} onPlanGo={onPlanGo} onReview={openReview} onOpenClip={openClip}
                   onClose={() => setUlOpen(false)}/>

        <div className="workspace">
          <div className="ws-main">
            <Workspace panes={panes} tabsById={tabsById} density="comfortable" on={on} demo={demo}/>
            {!mistOpen && <CommandBar context={cmdContext} fx={fx} onEffect={toggleEffect} onStudioSound={onStudioSound} onDeleteText={deleteTextLayer} onIgnore={ignoreSelection} onDeleteSel={deleteSelection} onRep={onRepAction} currentLayout={sceneLayout} onUnderlord={openMistDock} dockCenterX={dockCenterX} dockBottom={dockBottom}/>}
            {!tlOpen && <TimelinePull onOpen={() => { TRK("timeline_opened"); setTlOpen(true); }}/>}
          </div>
          <Timeline open={tlOpen} height={TL_HEIGHT} demo={demo} appSel={selection} setAppSel={setSelection} playZone={playZone} onPlayZone={setPlayZone} onClose={() => setTlOpen(false)}/>
        </div>
      </div>

      {ssPop && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:39 }} onClick={() => setSsPop(null)}></div>
          <div className="ss-pop" style={{ position:"fixed", top: ssPop.rect.bottom + 6, left: ssPop.rect.left }}
               onClick={(e) => e.stopPropagation()}>
            <div className="ssp-head"><Icons.audio/> Studio Sound
              <span className="ssp-val">{fx.ssBusy ? "Applying…" : fx.ssIntensity + "%"}</span></div>
            {fx.ssBusy ? (
              <div className="ssp-row"><span className="pspin"></span><span className="ssp-lab">Processing…</span></div>
            ) : (
              <>
                <div className="ssp-row">
                  <span className="ssp-lab">Intensity</span>
                  <input className="pslider" type="range" min="0" max="100" step="1" value={fx.ssIntensity}
                         onChange={(e) => setSsIntensity(Number(e.target.value))}/>
                </div>
                <button className="ssp-remove" onClick={removeStudioSound}>Remove Studio Sound</button>
              </>
            )}
          </div>
        </>
      )}

      {mistOpen && (
        <EphemeralChat docked={mistDocked} castPos={castRef.current}
                       dockCenterX={dockCenterX} dockBottom={dockBottom}
                       convo={mistConvo} thinking={mistThinking}
                       onSend={mistSend} onChip={mistChip} onOpenArtifact={onOpenArtifact}
                       onClose={closeMist} onDock={dockMist}/>
      )}

      {modOpen && <ModeratorPanel scenario={scenario} onScenario={applyScenario}
                                  onReset={() => applyScenario(scenario)} onClose={() => setModOpen(false)}/>}
    </div>
  );
}

// Hidden moderator panel (Cmd+Shift+P / Ctrl+Shift+P) — snaps the editor to a research
// set-up state between tasks. Participants never see it.
function ModeratorPanel({ scenario, onScenario, onReset, onClose }) {
  return (
    <div className="mod-panel" onClick={(e) => e.stopPropagation()}>
      <div className="mod-head">
        <span className="mod-title">Moderator</span>
        <span className="mod-kbd">⌘⇧P</span>
        <button className="icon-ghost" title="Close" onClick={onClose}><Icons.x/></button>
      </div>
      <div className="mod-label">Set-up state</div>
      {SCENARIOS.map((s) => (
        <button key={s.value} className={"mod-state" + (scenario === s.value ? " on" : "")}
                onClick={() => onScenario(s.value)}>
          <span className="ms-dot"></span>
          <span className="ms-meta"><span className="ms-nm">{s.label}</span><span className="ms-sub">{s.sub}</span></span>
        </button>
      ))}
      <button className="mod-reset" onClick={onReset}><Icons.revert/> Reset current state</button>
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

// Command bar: contextual ACTIONS (verbs) per canvas selection. Properties live
// in the Properties panel, not here. Ask Underlord is the "describe it" action.
// [icon, tooltip, kind]; kind drives an action menu or (for delete) a handler.
const CMD_SETS = {
  scene:  [["layout", "Change layout", "layout"], ["plus", "Add element", "add"], ["captions", "Captions", "captions"]],
  video:  [["effects", "Effects", "effects"], ["crop", "Crop", "crop"], ["replace", "Replace media", "replace"]],
  text:   [["effects", "Effects", "textfx"], ["wand", "Animate", "animate"], ["trash", "Delete", "delete"]],
  script: [["ignore", "Ignore", "ignoreSel"], ["trash", "Delete", "deleteSel"]],
  none:   [],
};

// Representative action menus (these "make sense" but don't deeply function —
// full behavior lands in later stages). Grounded in Descript's real labels.
const REP_MENUS = {
  add:      { label: "Add element", items: ["Text", "Subtitle", "Title", "Shape", "Media", "Speaker name"] },
  captions: { label: "Captions", items: ["This scene", "All scenes"] },
  crop:     { label: "Crop", items: ["Original", "Square", "Portrait", "Landscape", "Reset"] },
  replace:  { label: "Replace media", items: ["From computer", "From stock", "From project files"] },
  textfx:   { label: "Effects", items: ["Shadow", "Outline", "Background", "Glow"] },
  animate:  { label: "Animation", items: ["Fade in", "Slide in", "Pop", "Typewriter"] },
};

// Descript's "Change layout" pack: layout cards grouped by category (Basic /
// Title / Overlay / Presentation / Social). Names + type taxonomy mirror the
// real default pack (descript-model LayoutType + descript_default.json). The
// "Speaker Name" card is the lower-third (Notion Task 6); applying it shows the
// name/title overlay. Others register as the active layout for the demo.
const LAYOUT_PACK = [
  ["Basic", [["Default Camera", "camera"], ["Zoom", "zoom"], ["Screen Recording", "screen"], ["B-roll", "media"], ["2 Camera", "multicam"]]],
  ["Title", [["Default Intro", "intro"], ["Chapter Title", "chapter"], ["Outro CTA", "outro"]]],
  ["Overlay", [["Speaker Name", "speaker"], ["Captions", "captions"], ["Text Overlay", "text"]]],
  ["Presentation", [["List", "list"], ["Paragraph", "paragraph"], ["Quote", "quote"], ["Big Fact", "big-fact"]]],
  ["Social", [["Audiogram", "audiogram"], ["Social Clip - Portrait", "captions"]]],
];

// Schematic preview per layout type (the real picker uses rendered thumbnails).
function LayoutThumb({ type }) {
  const el = (cls, key) => <span className={"lp-el " + cls} key={key}></span>;
  const parts = {
    camera: [el("head")],
    zoom: [el("head zoom")],
    screen: [el("screen"), el("cam")],
    media: [el("media")],
    multicam: [el("half l"), el("half r")],
    speaker: [el("head"), el("grad"), el("nm"), el("ttl")],
    intro: [el("title")],
    chapter: [el("title sm"), el("rule")],
    outro: [el("title sm"), el("dots")],
    captions: [el("cap")],
    text: [el("line w1"), el("line w2")],
    list: [el("bullet b1"), el("bullet b2"), el("bullet b3")],
    paragraph: [el("line w1"), el("line w2"), el("line w3")],
    quote: [el("quote"), el("line w2")],
    "big-fact": [el("fact")],
    audiogram: [el("wave")],
  };
  return <span className={"lp-thumb t-" + type}>{parts[type] || null}</span>;
}

function LayoutPicker({ current, left, bottom, onPick }) {
  const clampedLeft = Math.min(left, window.innerWidth - 296);
  return (
    <div className="menu layout-picker" style={{ position:"fixed", left: clampedLeft, bottom }} onClick={(e) => e.stopPropagation()}>
      <div className="lp-head">Change layout</div>
      <div className="lp-scroll">
        {LAYOUT_PACK.map(([cat, items]) => (
          <div className="lp-cat" key={cat}>
            <div className="lp-cat-name">{cat}</div>
            <div className="lp-grid">
              {items.map(([name, type]) => (
                <button key={name} className={"lp-card" + (current === name ? " on" : "")}
                        title={cat + " › " + name} onClick={() => onPick(name)}>
                  <LayoutThumb type={type}/>
                  <span className="lp-name">{name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CmdEffectsMenu({ fx, onEffect, onStudioSound, onClose, left, bottom }) {
  const rows = [
    ["studioSound", "ssBusy", "Studio Sound", "audio"],
    ["eyeContact", "ecBusy", "Eye Contact", "sparkle"],
    ["centerSpeaker", "csBusy", "Center active speaker", "user"],
  ];
  return (
    <div className="menu cmd-menu" style={{ position:"fixed", left, bottom }} onClick={(e) => e.stopPropagation()}>
      <div className="mlabel">Effects</div>
      {rows.map(([key, bk, label, icon]) => {
        const I = Icons[icon] || Icons.wand;
        const on = fx[key], busy = fx[bk];
        // Studio Sound hands off to the shared intensity popover; others toggle.
        const click = (e) => {
          if (key === "studioSound") { const r = e.currentTarget.getBoundingClientRect(); onClose(); onStudioSound(r); }
          else onEffect(key);
        };
        return (
          <div key={key} className={"fx-row" + (on ? " on" : "")} onClick={click}>
            <span className="fx-ic">{busy ? <span className="pspin"></span> : <I/>}</span>
            <span className="fx-nm">{label}</span>
            <span className="fx-state">{busy ? "Applying…" : on ? "On" : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

function CmdRepMenu({ kind, left, bottom, onItem }) {
  const m = REP_MENUS[kind];
  if (!m) return null;
  return (
    <div className="menu cmd-menu" style={{ position:"fixed", left, bottom }} onClick={(e) => e.stopPropagation()}>
      <div className="mlabel">{m.label}</div>
      {m.items.map((it) => <div className="mi" key={it} onClick={() => onItem && onItem(it)}>{it}</div>)}
    </div>
  );
}

function CommandBar({ context, fx, onEffect, onStudioSound, onDeleteText, onIgnore, onDeleteSel, onRep, currentLayout, onUnderlord, dockCenterX, dockBottom }) {
  const [menu, setMenu] = useState(null); // { kind, left, bottom }
  const set = CMD_SETS[context] || CMD_SETS.none;
  // Selection changes can strand an open menu — close it when context changes.
  useEffect(() => { setMenu(null); }, [context]);
  const onAction = (kind, e) => {
    if (kind === "delete") { onDeleteText(); return; }
    if (kind === "ignoreSel") { onIgnore(); return; }
    if (kind === "deleteSel") { onDeleteSel(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setMenu((m) => (m && m.kind === kind) ? null : { kind, left: r.left, bottom: window.innerHeight - r.top + 8 });
  };
  return (
    <>
      {menu && <div style={{ position:"fixed", inset:0, zIndex:39 }} onClick={() => setMenu(null)}></div>}
      {/* mousedown would collapse a transcript text selection before the click lands */}
      <div className="cmd-bar" style={{ left: dockCenterX, bottom: dockBottom }} onMouseDown={(e) => e.preventDefault()}>
        {set.map(([icon, label, kind]) => {
          const I = Icons[icon] || Icons.wand;
          return <button key={kind} className={"fb" + (menu && menu.kind === kind ? " on" : "")}
                         aria-label={label} data-tip={label} onClick={(e) => onAction(kind, e)}><I/></button>;
        })}
        {set.length > 0 && <div className="sep"></div>}
        <button className="fb ul" onClick={onUnderlord} aria-label="Ask Underlord" data-tip="Ask Underlord"><Icons.robot/></button>
      </div>
      {menu && menu.kind === "effects" && (
        <CmdEffectsMenu fx={fx} onEffect={onEffect} onStudioSound={onStudioSound} onClose={() => setMenu(null)} left={menu.left} bottom={menu.bottom}/>
      )}
      {menu && menu.kind === "layout" && (
        <LayoutPicker current={currentLayout} left={menu.left} bottom={menu.bottom}
                      onPick={(name) => { if (onRep) onRep("layout", name); setMenu(null); }}/>
      )}
      {menu && menu.kind !== "effects" && menu.kind !== "layout" && (
        <CmdRepMenu kind={menu.kind} left={menu.left} bottom={menu.bottom}
                    onItem={(it) => { if (onRep) onRep(menu.kind, it); setMenu(null); }}/>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
