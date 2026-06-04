// app.jsx — root: state, tab system, underlord flow, drawers, tweaks
const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "underlord": true,
  "timeline": false,
  "ulWidth": 320,
  "tlHeight": 232,
  "density": "comfortable",
  "accent": "#A3A3EE",
  "contextBar": false
}/*EDITMODE-END*/;

let _seq = 100;
const uid = (p) => `${p}-${_seq++}`;

function makeTab(kind, extra = {}) {
  const d = SURFACE_DEFS[kind] || { label: kind, icon: "doc" };
  return { id: uid(kind), kind, label: d.label, icon: d.icon, closeable: true, ...extra };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ---- tab system ----
  const [tabsById, setTabsById] = useState(() => {
    const v = makeTab("video", { id: "video-1", closeable: false });
    const s = makeTab("script", { id: "script-1" });
    return { "video-1": v, "script-1": s };
  });
  const [panes, setPanes] = useState(() => (
    [{ id: "p1", tabIds: ["video-1", "script-1"], activeId: "video-1" }]
  ));

  // ---- underlord chat ----
  const [convo, setConvo] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [planUpdated, setPlanUpdated] = useState(false);
  const [goPulse, setGoPulse] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const planId = useRef(null);
  const timer = useRef(null);

  // ---- ephemeral mist chat (summoned by "/") — its own conversation ----
  const [mistOpen, setMistOpen] = useState(false);
  const [mistDocked, setMistDocked] = useState(false);
  const [mistConvo, setMistConvo] = useState([]);
  const [mistThinking, setMistThinking] = useState(false);
  const mistTimer = useRef(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const castRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  const ulOpen = t.underlord;
  const tlOpen = t.timeline;

  // ===== tab operations =====
  const activate = (paneId, tabId) =>
    setPanes((ps) => ps.map((p) => p.id === paneId ? { ...p, activeId: tabId } : p));

  const close = (tabId) => {
    const tab = tabsById[tabId];
    if (tab && !tab.closeable) return;
    if (tabId === planId.current) planId.current = null;
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
      const target = ps[ps.length - 1];
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

  // ===== drawer (sidebar) chat =====
  const drawerSend = (text) => runSend(text, setConvo, setThinking, timer);
  const drawerChip = (text) => { if (/^(go|looks good)/i.test(text)) runGo(setConvo); else drawerSend(text); };

  // ===== drawer chat history =====
  const archiveCurrent = (list) => {
    if (convo.length === 0) return list;
    const firstUser = convo.find((m) => m.role === "user");
    const title = firstUser && firstUser.text ? firstUser.text : "Chat";
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

  // ===== mist chat =====
  const mistSend = (text) => { runSend(text, setMistConvo, setMistThinking, mistTimer); setMistDocked(true); };
  const mistChip = (text) => { if (/^(go|looks good)/i.test(text)) runGo(setMistConvo); else mistSend(text); };
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

  // ===== "/" to summon the mist chat (Esc to dismiss) =====
  useEffect(() => {
    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const h = (e) => {
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
  }, [mistOpen]);

  // accent override
  useEffect(() => {
    document.documentElement.style.setProperty("--blurple-400", t.accent);
  }, [t.accent]);

  const on = {
    activate, close, openSurface, split: splitFromActive, splitDrop, moveTab,
    moveTabBefore: moveTab,
    planUpdated, onGo: () => runGo(setConvo), goPulse,
  };
  // moveTab signature from strip drop: (tabId, paneId, beforeTabId)

  const activePane = panes[panes.length - 1];

  return (
    <div className={"app density-" + t.density}>
      <header className="top">
        <div className="traffic"><i></i><i></i><i></i></div>
        <button className={"chrome-btn icon" + (ulOpen ? " on" : "")} title="Toggle Underlord"
                onClick={() => setTweak("underlord", !ulOpen)}><Icons.sparkle/></button>
        <div className="title">Launch video — rough cut<span className="crumb">Marketing</span></div>
        <div className="spacer"></div>
        <div className="status"><span className="dot"></span> Transcribed · 98%</div>
        <button className={"chrome-btn icon" + (tlOpen ? " on" : "")} title="Toggle Timeline"
                onClick={() => setTweak("timeline", !tlOpen)}><Icons.timeline/></button>
        <div className="avatars">
          <i style={{background:"linear-gradient(135deg,#d58c6a,#8b3a5a)"}}></i>
          <i style={{background:"linear-gradient(135deg,#a3a3ee,#6f58bd)"}}></i>
        </div>
        <button className="chrome-btn">Share</button>
        <button className="chrome-btn primary">Publish</button>
      </header>

      <div className="body" style={{ gridTemplateColumns: `${ulOpen ? t.ulWidth : 0}px 1fr` }}>
        <Underlord convo={convo} thinking={thinking} onSend={drawerSend}
                   onOpenArtifact={onOpenArtifact} onChip={drawerChip}
                   onNewChat={newChat} history={chatHistory} onSelectHistory={selectChat}
                   onClose={() => setTweak("underlord", false)}/>

        <div className="workspace">
          <div className="ws-main">
            <Workspace panes={panes} tabsById={tabsById} density={t.density} on={on}/>
            {t.contextBar && <FloatBar onUnderlord={() => setTweak("underlord", true)}/>}
            {!tlOpen && <TimelinePull onOpen={() => setTweak("timeline", true)}/>}
          </div>
          <Timeline open={tlOpen} height={t.tlHeight} onClose={() => setTweak("timeline", false)}/>
        </div>
      </div>

      {mistOpen && (
        <EphemeralChat docked={mistDocked} castPos={castRef.current}
                       dockCenterX={(ulOpen ? t.ulWidth : 0) + (window.innerWidth - (ulOpen ? t.ulWidth : 0)) / 2}
                       convo={mistConvo} thinking={mistThinking}
                       onSend={mistSend} onChip={mistChip} onOpenArtifact={onOpenArtifact}
                       onClose={closeMist} onDock={dockMist}/>
      )}

      <Tweaks t={t} setTweak={setTweak}/>
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

function FloatBar({ onUnderlord }) {
  return (
    <div className="float-bar">
      <button className="fb"><Icons.scissors/> Split</button>
      <button className="fb"><Icons.trim/> Trim</button>
      <button className="fb"><Icons.text/> Text</button>
      <button className="fb"><Icons.color/> Color</button>
      <div className="sep"></div>
      <button className="fb ul" onClick={onUnderlord}><Icons.sparkle/> Ask Underlord <span className="kbd">/</span></button>
    </div>
  );
}

function Tweaks({ t, setTweak }) {
  return (
    <TweaksPanel>
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
      <TweakToggle label="Floating context bar" value={t.contextBar} onChange={(v) => setTweak("contextBar", v)}/>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
