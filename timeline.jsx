// timeline.jsx — Descript redesigned (scene) timeline: 3-cluster toolbar, time
// ruler, scene filmstrip ribbon, color-coded pin tracks with in-lane title bars
// (no left gutter), and a bottom script track (wordbar + waveform). Clips drag
// horizontally to retime with snapping; the music clip is the hero (Task 8).
const { useState, useRef } = React;

const TL_DENSITY = { compact: 28, default: 60, large: 92 }; // media/audio row height
const TL_VECTOR_H = 28;                                      // vector rows ignore density
const TL_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3];
// Length of the prepended intro slide. Deliberately oversized for the demo:
// against a ~21-minute recording it has to stay a clickable playhead target.
const TL_INTRO_DUR = 60;
const TL_WAVE = Array.from({ length: 64 }, (_, i) =>
  26 + Math.round(58 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.27 + 1))));

const tlClock = (s) => {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};
const tlSpeaker = () => "#2f7d72";
const tlPinIcon = (kind) => kind === "audio" ? Icons.audio : kind === "media" ? Icons.video : Icons.type;

function TlWave({ color }) {
  return <div className="tl-wbars" style={{ color }}>{TL_WAVE.map((h, i) => <i key={i} style={{ height: h + "%" }}/>)}</div>;
}

function Timeline({ open, height, demo, appSel, setAppSel, playZone, onPlayZone, onClose }) {
  const D = window.DEMO || {};
  const full = D.timeline || { durationSec: 1, scenes: [], pins: [], script: { words: [], segments: [] } };
  // Scenario-aware content: empty → nothing; post-upload → one unsegmented
  // recording plus the music bed (Notion Task: drag it to start with the intro);
  // rough-cut+ → the full scene/pin model.
  const videoAdded = !!(demo && demo.videoAdded);
  const scenesAdded = !!(demo && demo.scenesAdded);
  const introAdded = !!(demo && demo.introAdded);
  const base = !videoAdded
    ? { durationSec: 1, scenes: [], pins: [], script: { words: [], segments: [] } }
    : !scenesAdded
      ? { durationSec: full.durationSec,
          scenes: [{ name: D.fileName || "Recording", startSec: 0, durSec: full.durationSec }],
          pins: full.pins.filter((p) => p.kind === "audio"), script: full.script }
      : full;
  // "Add an intro" prepends a title slide: shift everything right by its length.
  const model = introAdded
    ? { durationSec: base.durationSec + TL_INTRO_DUR,
        scenes: [{ name: "Intro", startSec: 0, durSec: TL_INTRO_DUR, intro: true },
                 ...base.scenes.map((s) => ({ ...s, startSec: s.startSec + TL_INTRO_DUR }))],
        pins: base.pins.map((p) => ({ ...p, startSec: p.startSec + TL_INTRO_DUR })),
        script: { words: ((base.script && base.script.words) || []).map((w) => ({ ...w, startSec: w.startSec + TL_INTRO_DUR })),
                  segments: ((base.script && base.script.segments) || []).map((s) => ({ ...s, startSec: s.startSec + TL_INTRO_DUR })) } }
    : base;
  const dur = model.durationSec || 1;
  const [pins, setPins] = useState(() => model.pins.map((p) => ({ ...p })));
  const [sel, setSel] = useState(null);
  React.useEffect(() => { setPins(model.pins.map((p) => ({ ...p }))); setSel(null); }, [videoAdded, scenesAdded, introAdded]);
  const [playSec, setPlaySec] = useState(215);
  // When the intro lands, park the playhead inside it so the canvas shows it;
  // afterwards every seek reports which section the playhead is in.
  React.useEffect(() => { if (introAdded) setPlaySec(TL_INTRO_DUR / 2); }, [introAdded]);
  React.useEffect(() => {
    if (introAdded && onPlayZone) onPlayZone(playSec < TL_INTRO_DUR ? "intro" : "video");
  }, [introAdded, playSec]);
  // The app can force the intro zone (e.g. Stock "+" drops a clip behind the
  // intro) — pull the playhead back into the intro to match.
  React.useEffect(() => {
    if (introAdded && playZone === "intro" && playSec >= TL_INTRO_DUR) setPlaySec(TL_INTRO_DUR / 2);
  }, [introAdded, playZone]);
  const [density, setDensity] = useState("default");
  const [zoom, setZoom] = useState(68);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tool, setTool] = useState("Select");
  const [view, setView] = useState("timeline");
  const [menu, setMenu] = useState(null);   // { kind, left, bottom }
  const [snapX, setSnapX] = useState(null);  // px within track area
  const areaRef = useRef(null);

  const pct = (sec) => (sec / dur) * 100;
  const scenes = model.scenes || [];
  const words = (model.script && model.script.words) || [];
  const segs = (model.script && model.script.segments) || [];
  const orderedPins = [...pins].sort((a, b) => (a.kind === "audio" ? 1 : 0) - (b.kind === "audio" ? 1 : 0));

  const sceneEdges = [];
  scenes.forEach((sc) => { sceneEdges.push(sc.startSec); sceneEdges.push(sc.startSec + sc.durSec); });

  const toggleMenu = (kind, e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu((m) => (m && m.kind === kind) ? null : { kind, left: r.left, bottom: window.innerHeight - r.top + 6 });
  };

  const seek = (e) => {
    if (!areaRef.current) return;
    const r = areaRef.current.getBoundingClientRect();
    setPlaySec(Math.max(0, Math.min(dur, ((e.clientX - r.left) / r.width) * dur)));
  };
  const adjacentScene = (dir) => {
    const starts = scenes.map((s) => s.startSec);
    if (dir < 0) { const p = [...starts].reverse().find((s) => s < playSec - 0.5); setPlaySec(p != null ? p : 0); }
    else { const n = starts.find((s) => s > playSec + 0.5); setPlaySec(n != null ? n : dur); }
  };

  // Drag a clip horizontally to retime, snapping to scene edges / other clips /
  // playhead (Shift disables). The music clip is the demo hero (Notion Task 8).
  const startDrag = (e, pin) => {
    setSel(pin.id);
    if (tool !== "Select" || !areaRef.current) return;
    e.preventDefault(); e.stopPropagation();
    const r = areaRef.current.getBoundingClientRect();
    const pxPerSec = r.width / dur;
    const startX = e.clientX;
    const orig = pin.startSec;
    const thresh = 8 / pxPerSec;
    const onMove = (ev) => {
      let next = orig + (ev.clientX - startX) / pxPerSec;
      next = Math.max(0, Math.min(dur - pin.durSec, next));
      let line = null;
      if (!ev.shiftKey) {
        const targets = [0, dur, playSec, ...sceneEdges];
        pins.forEach((p) => { if (p.id !== pin.id) { targets.push(p.startSec); targets.push(p.startSec + p.durSec); } });
        let best = null;
        targets.forEach((t) => {
          [["L", next], ["R", next + pin.durSec]].forEach(([edge, val]) => {
            const d = Math.abs(val - t);
            if (d < thresh && (!best || d < best.d)) best = { d, edge, t };
          });
        });
        if (best) {
          next = Math.max(0, Math.min(dur - pin.durSec, best.edge === "L" ? best.t : best.t - pin.durSec));
          line = (best.t / dur) * r.width;
        }
      }
      setSnapX(line);
      setPins((ps) => ps.map((p) => (p.id === pin.id ? { ...p, startSec: next } : p)));
    };
    const onUp = () => { setSnapX(null); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const ticks = [];
  for (let t = 0; t < dur; t += 180) ticks.push(t);

  return (
    <div className="timeline" style={{ height: open ? height : 0 }}>
      {/* toolbar */}
      <div className="tl-toolbar">
        <div className="tl-cl left">
          <button className="tlb" title="Previous scene" onClick={() => adjacentScene(-1)}><Icons.chevronsL/></button>
          <button className="tlb" title="Next scene" onClick={() => adjacentScene(1)}><Icons.chevronsR/></button>
          <button className={"tlb" + (menu && menu.kind === "markers" ? " on" : "")} title="Markers" onClick={(e) => toggleMenu("markers", e)}><Icons.marker/></button>
          <span className="tl-time">{tlClock(playSec)}<span> / {tlClock(dur)}</span></span>
        </div>
        <div className="tl-cl center">
          <button className="tlb rec" title="Record"><Icons.record/></button>
          <button className="tlb play" title={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>{playing ? <Icons.pause/> : <Icons.play/>}</button>
          <button className={"tlb txt" + (menu && menu.kind === "speed" ? " on" : "")} title="Playback speed" onClick={(e) => toggleMenu("speed", e)}>{speed}x</button>
          <button className="tlb txt" title="Split"><Icons.split/> Split</button>
        </div>
        <div className="tl-cl right">
          <button className="tlb" title="Zoom out" onClick={() => setZoom((z) => Math.max(25, z - 25))}><Icons.minus/></button>
          <button className="tlb txt" title="Zoom options">{zoom}%</button>
          <button className="tlb" title="Zoom in" onClick={() => setZoom((z) => Math.min(400, z + 25))}><Icons.plus/></button>
          <span className="tl-vdiv"></span>
          <button className={"tlb tool" + (menu && menu.kind === "tools" ? " on" : "")} title="Tools" onClick={(e) => toggleMenu("tools", e)}><Icons.pointer/><Icons.chevD/></button>
          <button className={"tlb" + (menu && menu.kind === "density" ? " on" : "")} title="Layer size" onClick={(e) => toggleMenu("density", e)}><Icons.density/></button>
          <button className="tlb" title={view === "timeline" ? "Storyboard view" : "Timeline view"} onClick={() => setView((v) => v === "timeline" ? "card" : "timeline")}>{view === "timeline" ? <Icons.gridView/> : <Icons.laneView/>}</button>
          <span className="tl-vdiv"></span>
          <button className="tlb" title="Hide timeline" onClick={onClose}><Icons.x/></button>
        </div>
      </div>

      {menu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 41 }} onClick={() => setMenu(null)}></div>
          <div className="menu tl-menu" style={{ position: "fixed", left: menu.left, bottom: menu.bottom }} onClick={(e) => e.stopPropagation()}>
            {menu.kind === "tools" && <>
              <div className="mlabel">Tools</div>
              {[["Select", "pointer"], ["Hand", "wand"], ["Blade", "blade"], ["Range", "fit"], ["Slip", "arrowR"]].map(([t, ic]) => {
                const I = Icons[ic] || Icons.pointer;
                return <div className={"mi" + (tool === t ? " on" : "")} key={t} onClick={() => { setTool(t); setMenu(null); }}><I/> {t}</div>;
              })}
            </>}
            {menu.kind === "density" && <>
              <div className="mlabel">Layer size</div>
              {["compact", "default", "large"].map((d) => (
                <div className={"mi" + (density === d ? " on" : "")} key={d} onClick={() => { setDensity(d); setMenu(null); }}>{d[0].toUpperCase() + d.slice(1)}</div>
              ))}
            </>}
            {menu.kind === "speed" && <>
              <div className="mlabel">Playback speed</div>
              {TL_SPEEDS.map((s) => <div className={"mi" + (speed === s ? " on" : "")} key={s} onClick={() => { setSpeed(s); setMenu(null); }}>{s}x</div>)}
            </>}
            {menu.kind === "markers" && <>
              <div className="mlabel">Markers</div>
              <div className="mi"><Icons.marker/> Add marker at playhead</div>
              <div className="mi disabled">No markers yet</div>
            </>}
          </div>
        </>
      )}

      {/* body: left rail + time-axis content */}
      <div className="tl-body">
        <div className="tl-rail"><button className="tl-add" title="Add scene"><Icons.plus/></button></div>
        <div className="tl-content">
          <div className="tl-ruler" onMouseDown={seek}>
            {ticks.map((t) => <span className="tl-tick" key={t} style={{ left: pct(t) + "%" }}>{tlClock(t)}</span>)}
          </div>

          <div className="tl-tracks-area" ref={areaRef}>
            {/* scene ribbon — the a-roll. Clicking selects it app-wide (Task 9). */}
            <div className="tl-ribbon">
              {!videoAdded && <div className="tl-empty">Add media to your project to see the timeline</div>}
              {scenes.map((sc, i) => sc.intro ? (
                <div className="tl-scene intro" key={i}
                     style={{ left: pct(sc.startSec) + "%", width: pct(sc.durSec) + "%" }}
                     onMouseDown={(e) => { e.stopPropagation(); setPlaySec(sc.startSec + sc.durSec / 2); }}>
                  <div className="ts-name">{sc.name}</div>
                </div>
              ) : (
                <div className={"tl-scene" + (appSel === "video" ? " sel" : "")} key={i}
                     style={{ left: pct(sc.startSec) + "%", width: pct(sc.durSec) + "%" }}
                     onMouseDown={(e) => { e.stopPropagation(); if (setAppSel) setAppSel("video"); }}>
                  <div className="ts-film" style={{ backgroundImage: "url(video-thumb.png)" }}></div>
                  <div className="ts-name">{sc.name}</div>
                </div>
              ))}
            </div>

            {/* pin tracks */}
            <div className="tl-pins">
              {orderedPins.map((pin) => {
                const I = tlPinIcon(pin.kind);
                return (
                  <div className="tl-row" key={pin.id} style={{ height: pin.kind === "vector" ? TL_VECTOR_H : TL_DENSITY[density] }}>
                    <div className={"tl-clip " + pin.kind + (sel === pin.id ? " sel" : "")}
                         style={{ left: pct(pin.startSec) + "%", width: pct(pin.durSec) + "%" }}
                         onMouseDown={(e) => startDrag(e, pin)}>
                      <div className="tlc-title"><I/><span>{pin.title}</span></div>
                      {pin.kind === "media" && <div className="tlc-body tlc-thumb" style={{ backgroundImage: "url(video-thumb.png)" }}></div>}
                      {pin.kind === "audio" && <div className="tlc-body"><TlWave color="#1d9a5c"/></div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* bottom script track */}
            <div className="tl-script">
              <div className="tl-wordbar">
                {words.map((w, i) => <span className="tl-word" key={i} style={{ left: pct(w.startSec) + "%", width: pct(w.durSec) + "%" }}>{w.t}</span>)}
              </div>
              <div className="tl-scriptwave">
                {segs.map((s, i) => (
                  <div className="tl-waveseg" key={i} style={{ left: pct(s.startSec) + "%", width: pct(s.durSec) + "%" }}>
                    <TlWave color={tlSpeaker(s.speaker)}/>
                  </div>
                ))}
              </div>
            </div>

            {/* overlays */}
            <div className="tl-dividers">
              {scenes.map((sc, i) => sc.startSec > 0 && <span className="tl-divline" key={i} style={{ left: pct(sc.startSec) + "%" }}></span>)}
            </div>
            {snapX != null && <span className="tl-snap" style={{ left: snapX + "px" }}></span>}
            <div className="tl-playhead" style={{ left: pct(playSec) + "%" }}><span className="tl-caret"></span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Timeline = Timeline;
