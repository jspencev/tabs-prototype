// surfaces.jsx — the content rendered inside each tab
const { useState } = React;

function VideoSurface() {
  const [sel, setSel] = useState(null); // null | 'text' | 'scene' | 'video'
  const [st, setSt] = useState({
    text: "Skip to the good part.",
    fontFamily: "Booton",
    fontSize: 60,
    weight: 600,
    italic: false,
    textAlign: "center",
    verticalAlign: "middle",
    color: "#FFF8F4",
    letterSpacing: -0.02,
    lineHeight: 1.05,
    opacity: 100,
    box: "auto-height",
  });
  const [sc, setSc] = useState({
    name: "Scene 3", ratio: "16:9", bg: "#3A2A40",
    transition: "fade", transDur: 0.5, length: 8, blur: 0,
  });
  const [vid, setVid] = useState({
    clip: "Maya — take 3", scale: 100, rotation: 0, opacity: 100, radius: 8,
    volume: 80, speed: 1, studioSound: true, eyeContact: true,
  });
  const set = (k, v) => setSt((s) => ({ ...s, [k]: v }));
  const setScene = (k, v) => setSc((s) => ({ ...s, [k]: v }));
  const setVideo = (k, v) => setVid((s) => ({ ...s, [k]: v }));
  const justify = { left: "flex-start", center: "center", right: "flex-end" }[st.textAlign];
  const align = { top: "flex-start", middle: "center", bottom: "flex-end" }[st.verticalAlign];
  const ratioCss = { "16:9": "16/9", "9:16": "9/16", "1:1": "1/1" }[sc.ratio];
  const res = { "16:9": "1920 × 1080", "9:16": "1080 × 1920", "1:1": "1080 × 1080" }[sc.ratio];

  return (
    <div className="surf-video">
      <div className="canvas-bar">
        <button className={"cpill btn" + (sel === "scene" ? " sel" : "")}
                onClick={(e) => { e.stopPropagation(); setSel("scene"); }}>
          <Icons.scenes/> {sc.name}
        </button>
        <span className="cpill">{res}</span>
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
        <span className="zoom">62%</span>
      </div>
      <div className="stage-wrap" onClick={() => setSel(null)}>
        <div className="stage" style={{ aspectRatio: ratioCss, maxWidth: sc.ratio === "9:16" ? 420 : (sc.ratio === "1:1" ? 620 : "100%"), borderRadius: vid.radius }}>
          <div className="stage-bg" style={{
            background: `linear-gradient(150deg, ${sc.bg}, #6d4a70 55%, #8a5e6e)`,
            filter: sc.blur ? `blur(${sc.blur}px)` : "none",
            opacity: vid.opacity / 100,
          }}
            onClick={(e) => { e.stopPropagation(); setSel("video"); }}></div>
          <div className="subj" style={{ transform: `translateX(-50%) scale(${vid.scale / 100})`, opacity: vid.opacity / 100 }}
            onClick={(e) => { e.stopPropagation(); setSel("video"); }}></div>
          {sel === "video" && <div className="vid-frame" style={{ borderRadius: vid.radius }}>
            <span className="tag">Video</span>
            <span className="h tl"></span><span className="h tr"></span>
            <span className="h bl"></span><span className="h br"></span>
          </div>}
          <div className="lt"><div className="n">Maya Rivera</div><div className="r">Founder · Descript</div></div>
          <div className="cc">Underlord just handles it for you.</div>

          <div className="text-layer" style={{ justifyContent: justify, alignItems: align }}>
            <div className={"tl-text" + (sel === "text" ? " selected" : "")}
              style={{
                fontFamily: (window.FONT_STACK || {})[st.fontFamily] || st.fontFamily,
                fontSize: st.fontSize, fontWeight: st.weight,
                fontStyle: st.italic ? "italic" : "normal",
                color: st.color, textAlign: st.textAlign,
                letterSpacing: st.letterSpacing + "em", lineHeight: st.lineHeight,
                opacity: st.opacity / 100,
                width: st.box === "auto-width" ? "auto" : "70%",
                cursor: sel === "text" ? "move" : "pointer",
              }}
              onClick={(e) => { e.stopPropagation(); setSel("text"); }}>
              {st.text}
              {sel === "text" && <>
                <span className="tag">Text</span>
                <span className="h tl"></span><span className="h tr"></span>
                <span className="h bl"></span><span className="h br"></span>
              </>}
            </div>
          </div>
        </div>
      </div>
      {sel === "text" && <TextProperties st={st} set={set} onClose={() => setSel(null)} side="right"/>}
      {sel === "scene" && <SceneProperties sc={sc} set={setScene} onClose={() => setSel(null)}/>}
      {sel === "video" && <VideoProperties vid={vid} set={setVideo} onClose={() => setSel(null)} side="right"/>}
    </div>
  );
}

function PlanDoc({ updated, onGo, goPulse }) {
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
        <h1>{updated ? "Updated plan — launch video cut" : "Plan — launch video cut"}</h1>
        <p className="lede">A working plan for turning the raw two-camera recording into a tight 90-second launch cut. Underlord will execute each step and pause for review.</p>

        <h2>Summary</h2>
        <p>{updated
          ? "Tightened to a 75-second cut. Cold open now leads with the transcript-editing demo, B-roll holds shortened to 2s, and the lower-third only shows while a speaker is on camera."
          : "Two speakers, ~11 minutes of footage. Goal is a punchy launch cut: remove fillers, tighten pauses, cut between angles on speaker change, and add captions."}</p>

        <h2>Flow</h2>
        <div className="flow">
          <div className="node">Raw footage</div>
          <div className="arr"><Icons.arrowR/></div>
          <div className="node ai">Clean transcript</div>
          <div className="arr"><Icons.arrowR/></div>
          <div className="node ai">Auto multicam</div>
          <div className="arr"><Icons.arrowR/></div>
          <div className="node">Captions</div>
          <div className="arr"><Icons.arrowR/></div>
          <div className="node">Launch cut</div>
        </div>

        <h2>Plan</h2>
        <ol>
          <li><strong>Clean up audio.</strong> Studio Sound on both tracks; remove 14 filler words.</li>
          <li><strong>Tighten pauses</strong> over 1.0s ({updated ? "now over 0.7s" : "6 found"}).</li>
          <li><strong>Automatic Multicam</strong> — cut to whoever is speaking.</li>
          <li><strong>Lower-thirds</strong> — {updated ? "show only while speaker is on camera" : "add on first appearance, linger 4s"}.</li>
          <li><strong>Captions</strong> — generate, style to brand, place safe-area bottom.</li>
        </ol>

        <h2>Notes</h2>
        <p>This document is Markdown with a Mermaid diagram. It opened as its own tab and isn't hand-editable — refine it by talking to Underlord, then press <strong>Go</strong> to run.</p>
      </div>
    </div>
  );
}

function ScriptSurface() {
  const rows = [
    { i:"MR", c:"#8b3a5a", n:"Maya Rivera", t:"00:00:04.120", x:<>So, <span className="fill">um,</span> today we're launching something we've been quietly building for months — the parts of editing that don't need taste should just happen on their own.</> },
    { i:"AP", c:"#6f58bd", n:"Anika Patel", t:"00:00:18.440", x:<>Right — <span className="fill">you know,</span> you edit by editing the transcript. Delete a sentence and the audio and video go with it.</> },
    { i:"MR", c:"#8b3a5a", n:"Maya Rivera", t:"00:00:31.910", x:<>Exactly. And for the repetitive stuff — silence, fillers, angle changes — Underlord just handles it.</> },
  ];
  return (
    <div className="surf-script">
      {rows.map((r, k) => (
        <div className="para" key={k}>
          <div className="spk">
            <span className="av" style={{ background:`linear-gradient(135deg,${r.c},#3a1f30)` }}>{r.i}</span>
            <span className="nm">{r.n}</span><span className="tc">{r.t}</span>
          </div>
          <div className="tx">{r.x}</div>
        </div>
      ))}
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
function SurfaceContent({ tab, planUpdated, onGo, goPulse }) {
  switch (tab.kind) {
    case "video":  return <VideoSurface/>;
    case "plan":   return <PlanDoc updated={planUpdated} onGo={onGo} goPulse={goPulse}/>;
    case "script": return <ScriptSurface/>;
    case "media":  return <Placeholder icon="media" title="Media library" body="Drag clips, images and recordings here. This whole surface is just a tab now."/>;
    case "stock":  return <Placeholder icon="stock" title="Stock" body="Search stock video, photos and music — opens as its own closeable tab."/>;
    case "effects":return <Placeholder icon="effects" title="Effects" body="Transitions, filters and layer effects for the selected clip."/>;
    case "captions":return <Placeholder icon="captions" title="Captions" body="Style, position and time your auto-generated captions."/>;
    case "settings":return <Placeholder icon="settings" title="Settings" body="Project preferences — resolution, export defaults, brand kit and shortcuts. Opens as its own tab."/>;
    default:       return <Placeholder icon="doc" title={tab.label} body="Surface content."/>;
  }
}

Object.assign(window, { VideoSurface, PlanDoc, ScriptSurface, Placeholder, SurfaceContent });
