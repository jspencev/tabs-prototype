// surfaces.jsx — the content rendered inside each tab
const { useState } = React;

function VideoSurface({ demo }) {
  const added = !!(demo && demo.videoAdded);
  const [sel, setSel] = useState(null); // null | 'video' | 'scene'
  const [sc, setSc] = useState({
    name: "Scene 1", ratio: "16:9", bg: "#251E21",
    transition: "fade", transDur: 0.5, length: 8, blur: 0,
  });
  const [vid, setVid] = useState({
    clip: "MM 3.2.26 — full", scale: 100, rotation: 0, opacity: 100, radius: 0,
    volume: 80, speed: 1, studioSound: true, eyeContact: false,
  });
  const setScene = (k, v) => setSc((s) => ({ ...s, [k]: v }));
  const setVideo = (k, v) => setVid((s) => ({ ...s, [k]: v }));

  return (
    <div className="surf-video">
      <div className="canvas-bar">
        <button className={"cpill btn" + (sel === "scene" ? " sel" : "")}
                onClick={(e) => { e.stopPropagation(); if (added) setSel("scene"); }}>
          <Icons.scenes/> {added ? sc.name : "No scenes yet"}
        </button>
        <span className="cpill">1920 × 1080</span>
        {sel === "video" && <>
          <button className={"cpill btn" + (vid.studioSound ? " ai" : "")}
                  onClick={(e) => { e.stopPropagation(); setVideo("studioSound", !vid.studioSound); }}>
            <Icons.audio/> Studio Sound
          </button>
          <button className={"cpill btn" + (vid.eyeContact ? " ai" : "")}
                  onClick={(e) => { e.stopPropagation(); setVideo("eyeContact", !vid.eyeContact); }}>
            <Icons.sparkle/> Eye Contact
          </button>
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
      {sel === "video" && <VideoProperties vid={vid} set={setVideo} onClose={() => setSel(null)} side="right"/>}
      {sel === "scene" && <SceneProperties sc={sc} set={setScene} onClose={() => setSel(null)}/>}
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
