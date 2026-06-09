// surfaces.jsx — the content rendered inside each tab
const { useState, useEffect } = React;

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

// Shared empty-state upload target used by both the Video canvas and the Script
// tab: upload hitbox + Record + drag/drop, then a brief fake ingest before
// handing off via onAddMedia. Direct manipulation — it never touches Underlord.
function UploadEmpty({ onAddMedia }) {
  const [uploading, setUploading] = useState(null); // null | 'upload' | 'record'
  const [dragOver, setDragOver] = useState(false);
  const onUpload = (mode) => {
    if (uploading) return;
    setUploading(mode);
    setTimeout(() => { setUploading(null); if (onAddMedia) onAddMedia(mode); }, 1100);
  };
  if (uploading) {
    return (
      <div className="canvas-empty">
        <div className="ce-uploading">
          <span className="ce-spin"></span>
          <div className="ce-title">{uploading === "record" ? "Recording…" : "Uploading…"}</div>
          <div className="ce-sub">{(window.DEMO && window.DEMO.fileName) || "recording.mp4"}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={"canvas-empty" + (dragOver ? " drag" : "")}
         onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
         onDragLeave={() => setDragOver(false)}
         onDrop={(e) => { e.preventDefault(); setDragOver(false); onUpload("upload"); }}>
      <button className="ce-hitbox" onClick={(e) => { e.stopPropagation(); onUpload("upload"); }}>
        <span className="ce-icon"><Icons.upload/></span>
        <span className="ce-title">Upload a file</span>
        <span className="ce-sub">Click to browse, or drag &amp; drop a video here</span>
      </button>
      <div className="ce-or">or</div>
      <button className="ce-record" onClick={(e) => { e.stopPropagation(); onUpload("record"); }}>
        <Icons.record/> Record
      </button>
      {dragOver && <div className="ce-drop">Drop to add</div>}
    </div>
  );
}
window.UploadEmpty = UploadEmpty;

// VideoSurface is controlled: selection (sel/setSel) and effects (fx) are owned
// by App so the bottom command bar and the property panels share one source of
// truth. Pure attributes (scale, rotation, etc.) stay local for the panels.
function VideoSurface({ demo, sel, setSel, fx, onEffect, onStudioSound, textLayerVisible, onAddMedia }) {
  const added = !!(demo && demo.videoAdded);
  const [sc, setSc] = useState({
    name: "Scene 1", ratio: "16:9", bg: "#251E21",
    transition: "fade", transDur: 0.5, length: 8, blur: 0,
  });
  const [vid, setVid] = useState({
    clip: "MM 3.2.26 — full", scale: 100, rotation: 0, opacity: 100, radius: 0,
    volume: 80, speed: 1,
  });
  const [txt, setTxt] = useState({
    text: "Neda Navab", fontFamily: "Booton", fontSize: 30, weight: 600, italic: false,
    textAlign: "left", verticalAlign: "bottom", lineHeight: 1.1, letterSpacing: 0,
    color: "#FFF8F4", box: "auto-width", opacity: 100,
  });
  const setScene = (k, v) => setSc((s) => ({ ...s, [k]: v }));
  const setVideo = (k, v) => setVid((s) => ({ ...s, [k]: v }));
  const setText = (k, v) => setTxt((s) => ({ ...s, [k]: v }));

  // Clear the app-level selection when the canvas surface unmounts.
  useEffect(() => () => { if (setSel) setSel(null); }, []);

  const fxActive = fx && (fx.studioSound || fx.ssBusy || fx.eyeContact || fx.ecBusy || fx.centerSpeaker || fx.csBusy);
  const badge = (on, busy, icon, label) => {
    if (!on && !busy) return null;
    const I = Icons[icon] || Icons.wand;
    return <span className="fx-badge">{busy ? <span className="pspin"></span> : <I/>}{busy ? label + "…" : label}</span>;
  };

  return (
    <div className="surf-video">
      <div className="canvas-bar">
        <button className={"cpill btn" + (sel === "scene" ? " sel" : "")}
                onClick={(e) => { e.stopPropagation(); if (added) setSel("scene"); }}>
          <Icons.scenes/> {added ? sc.name : "No scenes yet"}
        </button>
        <span className="cpill">1920 × 1080</span>
        {sel === "video" && fx && <>
          <EffectPill on={fx.studioSound} busy={fx.ssBusy} icon="audio" label="Studio Sound"
                      value={fx.studioSound ? fx.ssIntensity + "%" : null}
                      onClick={(rect) => onStudioSound(rect)}/>
          <EffectPill on={fx.eyeContact} busy={fx.ecBusy} icon="sparkle" label="Eye Contact"
                      onClick={() => onEffect("eyeContact")}/>
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
            {fxActive && (
              <div className="fx-badges">
                {badge(fx.studioSound, fx.ssBusy, "audio", "Studio Sound")}
                {badge(fx.eyeContact, fx.ecBusy, "sparkle", "Eye Contact")}
                {badge(fx.centerSpeaker, fx.csBusy, "user", "Center speaker")}
              </div>
            )}
            {textLayerVisible && (
              <div className={"lower-third" + (sel === "text" ? " sel" : "")}
                   onClick={(e) => { e.stopPropagation(); setSel("text"); }}>
                <div className="lt-name" style={{ fontFamily: (FONT_STACK[txt.fontFamily] || "inherit"),
                     fontSize: txt.fontSize, fontWeight: txt.weight, color: txt.color,
                     fontStyle: txt.italic ? "italic" : "normal", opacity: txt.opacity / 100 }}>{txt.text}</div>
                <div className="lt-role">Compass · Real Estate</div>
                {sel === "text" && <><span className="h tl"></span><span className="h tr"></span><span className="h bl"></span><span className="h br"></span></>}
              </div>
            )}
            {sel === "video" && <div className="vid-frame" style={{ borderRadius: vid.radius }}>
              <span className="tag">Video</span>
              <span className="h tl"></span><span className="h tr"></span>
              <span className="h bl"></span><span className="h br"></span>
            </div>}
          </div>
        ) : (
          <UploadEmpty onAddMedia={onAddMedia}/>
        )}
      </div>
      {sel === "video" && <VideoProperties vid={vid} set={setVideo} fx={fx} onEffect={onEffect} onStudioSound={onStudioSound} onClose={() => setSel(null)} side="right"/>}
      {sel === "scene" && <SceneProperties sc={sc} set={setScene} onClose={() => setSel(null)}/>}
      {sel === "text"  && <TextProperties st={txt} set={setText} onClose={() => setSel(null)} side="right"/>}
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
        <button className="go-btn" onClick={onGo}>
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

// The transcript is a contentEditable plain-text editor, which means the user
// mutates the DOM directly. To keep React from fighting those manual edits we
// (1) memoize this subtree so unrelated app re-renders never reconcile it, and
// (2) remount it via a `key` whenever a scripted edit changes the content (see
// ScriptSurface). A scripted edit therefore replaces the whole doc cleanly
// instead of granularly diffing against DOM the user already changed.
const ScriptDoc = React.memo(function ScriptDoc({ fillersRemoved, fillerStriking, chaptersAdded, rearranged }) {
  const D = window.DEMO || { transcript: [], speakers: {}, projectTitle: "" };
  let paras = D.transcript;
  if (rearranged && D.rearrangedOrder) {
    const byId = {};
    D.transcript.forEach((p) => { byId[p.id] = p; });
    paras = D.rearrangedOrder.map((id) => byId[id]).filter(Boolean);
  }
  let prev = null;
  return (
    <div className="script-doc" contentEditable suppressContentEditableWarning spellCheck={false}>
      <h1 className="script-title">{D.projectTitle}</h1>
      {paras.map((p, idx) => {
        const showSpk = p.speaker !== prev;
        prev = p.speaker;
        const showChapter = chaptersAdded && p.chapterStart;
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
                if (fillersRemoved) return null;
                if (fillerStriking) return <span key={i} className="fill striking">{t.f}</span>;
                return <span key={i}>{t.f}</span>;
              })}
            </p>
          </React.Fragment>
        );
      })}
    </div>
  );
});

function ScriptSurface({ demo, onAddMedia }) {
  const flags = demo || {};
  if (!flags.videoAdded) {
    return (
      <div className="surf-script empty">
        <UploadEmpty onAddMedia={onAddMedia}/>
      </div>
    );
  }
  // Content version: changes only on a scripted edit, forcing a clean remount.
  const version = [flags.fillersRemoved, flags.fillerStriking, flags.chaptersAdded, flags.rearranged].join("-");
  return (
    <div className="surf-script">
      <ScriptDoc key={version}
                 fillersRemoved={flags.fillersRemoved} fillerStriking={flags.fillerStriking}
                 chaptersAdded={flags.chaptersAdded} rearranged={flags.rearranged}/>
    </div>
  );
}

// ── Review changes ───────────────────────────────────────────────────────────
const RV_PREROLL = 3;
const fmtTC = (s) => {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};
const rvPct = (v, dur) => (dur > 0 ? Math.max(0, Math.min(100, (v / dur) * 100)) : 0);

function ReviewSurface() {
  const D = window.DEMO || {};
  const diff = D.reviewDiff || { durationSec: 0, prevDurationSec: 0, keyMoments: [] };
  const moments = diff.keyMoments || [];
  const [view, setView] = useState("current");   // 'current' | 'prev' | 'diff'
  const [selected, setSelected] = useState(0);

  const isPrev = view === "prev";
  const isDiff = view === "diff";
  const dur = isPrev ? diff.prevDurationSec : diff.durationSec;
  const rangeOf = (km) => (isPrev ? km.prev : km.current);

  const sel = moments[selected] || null;
  const selRange = sel ? rangeOf(sel) : { start: 0, end: 0 };
  const seekTime = Math.max(0, selRange.start - RV_PREROLL);

  const refLabel = isDiff
    ? moments.length + " changes"
    : (isPrev ? "before · " + (diff.beforeRef || "").slice(0, 7)
              : "after · " + (diff.afterRef || "").slice(0, 7));

  const TABS = [["current", "Current"], ["prev", "Prev"], ["diff", "Show diff"]];

  const frame = (
    <img className="rv-frame" src="video-thumb.png" alt="Video frame"/>
  );
  const placeholder = (label) => (
    <div className={"rv-ph " + (label === "Removed" ? "removed" : "added")}>
      <div className="rv-ph-mark">{label === "Removed" ? <Icons.x/> : <Icons.plus/>}</div>
      <div className="rv-ph-tx">{label}</div>
    </div>
  );
  const side = (which) => {
    const kind = sel ? sel.kind : "modify";
    if (which === "before") return kind === "insert" ? placeholder("Added") : frame;
    return kind === "delete" ? placeholder("Removed") : frame;
  };

  return (
    <div className="surf-review">
      <div className="rv-bar">
        <div className="rv-toggle">
          {TABS.map(([id, label]) => (
            <button key={id} className={"rv-tab" + (view === id ? " on" : "")}
                    onClick={() => setView(id)}>{label}</button>
          ))}
        </div>
        <span className="sp"></span>
        <span className="rv-ref" title={isPrev ? diff.beforeRef : diff.afterRef}>{refLabel}</span>
      </div>

      {isDiff ? (
        <div className="rv-diff">
          <div className="rv-stage"><span className="rv-badge">Before</span>{side("before")}</div>
          <div className="rv-stage"><span className="rv-badge">After</span>{side("after")}</div>
        </div>
      ) : (
        <div className="rv-stage solo">
          <span className="rv-badge">{isPrev ? "Before" : "After"}</span>
          {frame}
        </div>
      )}

      <div className="rv-controls">
        <button className="rv-play" title="Play"><Icons.play/></button>
        <span className="rv-tc">{fmtTC(seekTime)}</span>
        <div className="rv-timeline">
          <div className="rv-scrub">
            <i className="rv-fill" style={{ width: rvPct(seekTime, dur) + "%" }}></i>
            <span className="rv-head" style={{ left: rvPct(seekTime, dur) + "%" }}></span>
          </div>
          <div className="rv-track" title="Key moments — click to jump">
            {moments.map((km, i) => {
              const r = rangeOf(km);
              const isMarker = r.end <= r.start;
              const left = rvPct(r.start, dur);
              const width = isMarker ? null : rvPct(r.end - r.start, dur);
              return (
                <button key={km.id}
                        className={"km-window km-" + km.kind + (i === selected ? " sel" : "") + (isMarker ? " marker" : "")}
                        style={{ left: left + "%", width: width != null ? width + "%" : undefined }}
                        aria-label={km.label}
                        title={km.label}
                        onClick={() => setSelected(i)}></button>
              );
            })}
          </div>
        </div>
        <span className="rv-tc dim">{fmtTC(dur)}</span>
      </div>

      {sel && (
        <div className="rv-changes">
          <div className="rv-ch-head">
            <span className={"rv-dot km-" + sel.kind}></span>{sel.label}
            <span className="rv-ch-tc">{fmtTC(rangeOf(sel).start)}</span>
          </div>
          <ul>{sel.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

// ── Publish ───────────────────────────────────────────────────────────────
// A tab (never a modal) that mirrors Descript's Export/Publish popover:
// destinations, format, resolution, page access, and a Publish action.
const PUBLISH_DESTS = [
  { id: "web",     icon: "globe",    label: "Web link",     sub: "Shareable Descript page" },
  { id: "local",   icon: "download", label: "Local export", sub: "Download a file" },
  { id: "youtube", icon: "youtube",  label: "YouTube",      sub: "Publish to your channel" },
  { id: "drive",   icon: "drive",    label: "Google Drive", sub: "Save a copy to Drive" },
];
const PUBLISH_FORMATS = ["Video", "Audio", "GIF", "Subtitles", "Transcript"];

function PublishSurface() {
  const [dest, setDest] = useState("web");
  const [format, setFormat] = useState("Video");
  const [resolution, setResolution] = useState("1080p");
  const [access, setAccess] = useState("Anyone with the link");
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const isWeb = dest === "web";
  const publish = () => {
    if (busy) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); setPublished(true); }, 1400);
  };
  return (
    <div className="surf-publish">
      <div className="pub-bar">
        <span className="pub-title">{published ? "Published" : "Publish"}</span>
        <span className="sp"></span>
        {published && <span className="pub-live"><Icons.globe/> Live</span>}
      </div>
      <div className="pub-body">
        <div className="pub-dests">
          {PUBLISH_DESTS.map((d) => {
            const I = Icons[d.icon] || Icons.globe;
            return (
              <button key={d.id} className={"pub-dest" + (dest === d.id ? " on" : "")}
                      onClick={() => { setDest(d.id); setPublished(false); }}>
                <span className="pd-ic"><I/></span>
                <span className="pd-meta"><span className="pd-nm">{d.label}</span><span className="pd-sub">{d.sub}</span></span>
              </button>
            );
          })}
        </div>
        <div className="pub-panel">
          {!published ? (
            <>
              <div className="pub-row">
                <span className="pub-lab">Format</span>
                <div className="pub-chips">
                  {PUBLISH_FORMATS.map((f) => (
                    <button key={f} className={"pub-chip" + (format === f ? " on" : "")}
                            onClick={() => setFormat(f)}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="pub-row">
                <span className="pub-lab">Resolution</span>
                <select className="pub-select" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                  <option>720p</option><option>1080p</option><option>4K</option>
                </select>
              </div>
              {isWeb && (
                <div className="pub-row">
                  <span className="pub-lab">Page access</span>
                  <select className="pub-select" value={access} onChange={(e) => setAccess(e.target.value)}>
                    <option>Anyone with the link</option>
                    <option>Project access required</option>
                    <option>Password protected</option>
                  </select>
                </div>
              )}
              <button className="pub-go" onClick={publish} disabled={busy}>
                {busy ? <span className="pspin"></span> : <Icons.globe/>}
                {busy ? "Publishing…" : (isWeb ? "Publish" : "Export")}
              </button>
            </>
          ) : (
            <div className="pub-done">
              <div className="pub-row">
                <span className="pub-lab">Share link</span>
                <div className="pub-linkfield">
                  <input readOnly value="share.descript.com/v/a1b2c3d4"/>
                  <button className="pub-copy">Copy</button>
                </div>
              </div>
              <div className="pub-actions">
                <button className="pub-secondary"><Icons.download/> Download</button>
                <button className="pub-secondary"><Icons.globe/> Open share page</button>
                <button className="pub-secondary" onClick={() => setPublished(false)}>Update settings</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Media (project Files) ────────────────────────────────────────────────────
// Mirrors Descript's project "Files" panel: empty -> "Drag & drop or click to
// add files" + "Add files"; filled -> the demo file as a row. Upload is the same
// immediate fake ingest as the canvas (direct manipulation, no Underlord chatter).
function MediaSurface({ demo, onAddMedia }) {
  const added = !!(demo && demo.videoAdded);
  const D = window.DEMO || {};
  const [dragOver, setDragOver] = useState(false);
  const add = () => { if (onAddMedia) onAddMedia(); };
  return (
    <div className="surf-media">
      <div className="md-bar">
        <span className="md-title">Files</span>
        <span className="sp"></span>
        <button className="md-add" onClick={add}><Icons.plus/> Add files</button>
      </div>
      {added ? (
        <div className="md-list">
          <div className="md-item">
            <span className="md-thumb" style={{ backgroundImage: "url(video-thumb.png)" }}></span>
            <span className="md-meta">
              <span className="md-nm">{D.fileName}</span>
              <span className="md-sub">Video · {D.duration}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className={"md-empty" + (dragOver ? " drag" : "")}
             onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
             onDragLeave={() => setDragOver(false)}
             onDrop={(e) => { e.preventDefault(); setDragOver(false); add(); }}>
          <button className="md-drop" onClick={add}>
            <span className="md-ic"><Icons.folder/></span>
            <span className="md-dt">Drag &amp; drop or click to add files</span>
          </button>
        </div>
      )}
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
function SurfaceContent({ tab, planUpdated, onGo, goPulse, demo, onAddMedia, sel, setSel, fx, onEffect, onStudioSound, textLayerVisible }) {
  switch (tab.kind) {
    case "video":  return <VideoSurface demo={demo} sel={sel} setSel={setSel} fx={fx} onEffect={onEffect} onStudioSound={onStudioSound} textLayerVisible={textLayerVisible} onAddMedia={onAddMedia}/>;
    case "plan":   return <PlanDoc updated={planUpdated} onGo={onGo} goPulse={goPulse}/>;
    case "review": return <ReviewSurface/>;
    case "publish":return <PublishSurface/>;
    case "script": return <ScriptSurface demo={demo} onAddMedia={onAddMedia}/>;
    case "media":  return <MediaSurface demo={demo} onAddMedia={onAddMedia}/>;
    case "stock":  return <Placeholder icon="stock" title="Stock" body="Search stock video, photos and music — opens as its own closeable tab."/>;
    case "effects":return <Placeholder icon="effects" title="Effects" body="Transitions, filters and layer effects for the selected clip."/>;
    case "captions":return <Placeholder icon="captions" title="Captions" body="Style, position and time your auto-generated captions."/>;
    case "settings":return <Placeholder icon="settings" title="Settings" body="Project preferences — resolution, export defaults, brand kit and shortcuts. Opens as its own tab."/>;
    default:       return <Placeholder icon="doc" title={tab.label} body="Surface content."/>;
  }
}

Object.assign(window, { VideoSurface, PlanDoc, ReviewSurface, PublishSurface, MediaSurface, ScriptSurface, Placeholder, SurfaceContent });
