// surfaces.jsx — the content rendered inside each tab
const { useState } = React;

// Shared AI-effect pill — identical style/behavior in the canvas bar and the
// VideoProperties panel. `on` = applied, `busy` = processing.
function EffectPill({ on, busy, icon, label, value, onClick }) {
  const I = Icons[icon] || Icons.sparkle;
  const ref = React.useRef(null);
  return (
    <button ref={ref} className={"cpill btn" + (on ? " ai" : "")}
            onClick={(e) => { e.stopPropagation(); onClick(ref.current ? ref.current.getBoundingClientRect() : null); }}>
      {busy ? <span className="pspin"></span> : <I/>}
      {busy ? "Applying…" : label}
      {value != null && !busy && <span className="cval">{value}</span>}
    </button>
  );
}
window.EffectPill = EffectPill;

// maps an effect key to its "processing" flag on the vid state
const EFFECT_BUSY = { studioSound: "ssBusy", eyeContact: "ecBusy" };

function VideoSurface({ demo }) {
  const added = !!(demo && demo.videoAdded);
  const [sel, setSel] = useState(null); // null | 'video' | 'scene'
  const [sc, setSc] = useState({
    name: "Scene 1", ratio: "16:9", bg: "#251E21",
    transition: "fade", transDur: 0.5, length: 8, blur: 0,
  });
  const [vid, setVid] = useState({
    clip: "MM 3.2.26 — full", scale: 100, rotation: 0, opacity: 100, radius: 0,
    volume: 80, speed: 1,
    studioSound: false, ssBusy: false, ssIntensity: 70,
    eyeContact: false, ecBusy: false,
  });
  const [ssPop, setSsPop] = useState(null); // { rect } when the Studio Sound intensity popover is open
  const setScene = (k, v) => setSc((s) => ({ ...s, [k]: v }));
  const setVideo = (k, v) => setVid((s) => ({ ...s, [k]: v }));

  // Eye Contact: apply -> async processing (spinner) -> applied; click again removes.
  const applyEffect = (key) => {
    const bk = EFFECT_BUSY[key];
    if (vid[key]) { setVideo(key, false); return; }   // remove
    if (vid[bk]) return;                                // already processing
    setVideo(bk, true);
    setTimeout(() => setVid((s) => ({ ...s, [bk]: false, [key]: true })), 2000);
  };

  // Studio Sound: apply -> processing -> applied, then auto-open the Intensity popover.
  // Clicking the (already-on) pill re-opens the popover; Remove lives inside it.
  const onStudioSound = (rect) => {
    if (vid.studioSound) { setSsPop({ rect }); return; }   // re-open
    if (vid.ssBusy) return;
    setVideo("ssBusy", true);
    setTimeout(() => {
      setVid((s) => ({ ...s, ssBusy: false, studioSound: true }));
      setSsPop({ rect });
    }, 2000);
  };
  const removeStudioSound = () => { setVideo("studioSound", false); setSsPop(null); };

  return (
    <div className="surf-video">
      <div className="canvas-bar">
        <button className={"cpill btn" + (sel === "scene" ? " sel" : "")}
                onClick={(e) => { e.stopPropagation(); if (added) setSel("scene"); }}>
          <Icons.scenes/> {added ? sc.name : "No scenes yet"}
        </button>
        <span className="cpill">1920 × 1080</span>
        {sel === "video" && <>
          <EffectPill on={vid.studioSound} busy={vid.ssBusy} icon="audio" label="Studio Sound"
                      value={vid.studioSound ? vid.ssIntensity + "%" : null}
                      onClick={(rect) => onStudioSound(rect)}/>
          <EffectPill on={vid.eyeContact} busy={vid.ecBusy} icon="sparkle" label="Eye Contact"
                      onClick={() => applyEffect("eyeContact")}/>
        </>}
        <span className="sp"></span>
        <span className="zoom">Fit</span>
      </div>
      <div className="stage-wrap" onClick={() => setSel(null)}>
        {added ? (
          <div className="stage stage-video" style={{ borderRadius: vid.radius }}>
            <img src="video-thumb.png" alt="Video"
                 style={{ opacity: vid.opacity / 100, transform: `scale(${vid.scale / 100})` }}
                 onClick={(e) => { e.stopPropagation(); setSel("video"); }}/>
            {sel === "video" && <div className="vid-frame" style={{ borderRadius: vid.radius }}>
              <span className="tag">Video</span>
              <span className="h tl"></span><span className="h tr"></span>
              <span className="h bl"></span><span className="h br"></span>
            </div>}
          </div>
        ) : (
          <div className="canvas-empty">
            <div className="ce-icon"><Icons.video/></div>
            <div className="ce-title">No media yet</div>
            <div className="ce-sub">Your video will appear here once it’s added to the project.</div>
          </div>
        )}
      </div>
      {sel === "video" && <VideoProperties vid={vid} set={setVideo} apply={applyEffect} onStudioSound={onStudioSound} onClose={() => setSel(null)} side="right"/>}
      {sel === "scene" && <SceneProperties sc={sc} set={setScene} onClose={() => setSel(null)}/>}

      {sel === "video" && ssPop && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 39 }} onClick={() => setSsPop(null)}></div>
          <div className="ss-pop" style={{ position: "fixed", top: ssPop.rect.bottom + 6, left: ssPop.rect.left }}
               onClick={(e) => e.stopPropagation()}>
            <div className="ssp-head"><Icons.audio/> Studio Sound <span className="ssp-val">{vid.ssIntensity}%</span></div>
            <div className="ssp-row">
              <span className="ssp-lab">Intensity</span>
              <input className="pslider" type="range" min="0" max="100" step="1" value={vid.ssIntensity}
                     onChange={(e) => setVideo("ssIntensity", Number(e.target.value))}/>
            </div>
            <button className="ssp-remove" onClick={removeStudioSound}>Remove Studio Sound</button>
          </div>
        </>
      )}
    </div>
  );
}

function PlanDoc({ updated, onGo, goPulse }) {
  const D = window.DEMO || {};
  const plan = (updated ? (D.plan && D.plan.revised) : (D.plan && D.plan.initial)) || { title: "Plan", steps: [] };
  return (
    <div className="surf-doc">
      <div className="doc-bar">
        <span className="ro"><Icons.lock/> Generated · read-only</span>
        <span className="sp"></span>
        <button className={"go-btn" + (goPulse ? " pulse" : "")} onClick={onGo}>
          <Icons.sparkle/> Go
        </button>
      </div>
      <div className="doc-body">
        <h1>{plan.title}</h1>
        <p className="lede">A working plan to restructure “{D.projectTitle}” into a tighter client-experience story. Underlord will reorder the script to match. Refine it by talking to Underlord, then press Go to run.</p>

        <h2>Plan</h2>
        <ol>
          {plan.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>

        <h2>Notes</h2>
        <p>This plan opened as its own tab and isn’t hand-editable — tell Underlord what to change, then press <strong>Go</strong> to apply it to the script.</p>
      </div>
    </div>
  );
}

function ScriptSurface({ demo }) {
  const D = window.DEMO || { transcript: [], speakers: {}, projectTitle: "" };
  const flags = demo || {};
  let paras = D.transcript;
  if (flags.rearranged && D.rearrangedOrder) {
    const byId = {};
    D.transcript.forEach((p) => { byId[p.id] = p; });
    paras = D.rearrangedOrder.map((id) => byId[id]).filter(Boolean);
  }
  let prev = null;
  return (
    <div className="surf-script">
      <div className="script-doc">
        <h1 className="script-title">{D.projectTitle}</h1>
        {paras.map((p, idx) => {
          const showSpk = p.speaker !== prev;
          prev = p.speaker;
          const showChapter = flags.chaptersAdded && p.chapterStart;
          return (
            <React.Fragment key={p.id}>
              {showChapter && (
                <div className="chapter">
                  <span className="ch-mark"><Icons.marker/></span>
                  <span className="ch-name">{p.chapterStart}</span>
                  <span className="ch-ts">{p.ts}</span>
                </div>
              )}
              {showSpk && (
                <div className="spk-label">
                  <span className="nm">{p.speaker}</span>
                  <span className="tc">{p.ts}</span>
                </div>
              )}
              <p className="para-tx">
                {idx === 0 && <span className="lead-thumb" style={{ backgroundImage: "url(video-thumb.png)" }}></span>}
                {p.tokens.map((t, i) => {
                  if (typeof t === "string") return <span key={i}>{t}</span>;
                  if (flags.fillersRemoved) return null;
                  if (flags.fillerStriking) return <span key={i} className="fill striking">{t.f}</span>;
                  return <span key={i}>{t.f}</span>;
                })}
              </p>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Placeholder({ icon, title, body }) {
  const I = Icons[icon] || Icons.media;
  return (
    <div className="surf-ph">
      <div className="pic"><I/></div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

// resolve a surface by its kind
function SurfaceContent({ tab, planUpdated, onGo, goPulse, demo }) {
  switch (tab.kind) {
    case "video":  return <VideoSurface demo={demo}/>;
    case "plan":   return <PlanDoc updated={planUpdated} onGo={onGo} goPulse={goPulse}/>;
    case "script": return <ScriptSurface demo={demo}/>;
    case "media":  return <Placeholder icon="media" title="Media library" body="Drag clips, images and recordings here. This whole surface is just a tab now."/>;
    case "stock":  return <Placeholder icon="stock" title="Stock" body="Search stock video, photos and music — opens as its own closeable tab."/>;
    case "effects":return <Placeholder icon="effects" title="Effects" body="Transitions, filters and layer effects for the selected clip."/>;
    case "captions":return <Placeholder icon="captions" title="Captions" body="Style, position and time your auto-generated captions."/>;
    case "settings":return <Placeholder icon="settings" title="Settings" body="Project preferences — resolution, export defaults, brand kit and shortcuts. Opens as its own tab."/>;
    default:       return <Placeholder icon="doc" title={tab.label} body="Surface content."/>;
  }
}

Object.assign(window, { VideoSurface, PlanDoc, ScriptSurface, Placeholder, SurfaceContent });
