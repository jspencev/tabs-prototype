// textprops.jsx — floating Text properties panel (pops out right when a text layer is selected)
const TEXT_FONTS = ["Booton", "Podkova", "Manrope", "EB Garamond", "Playfair Display", "Brett"];
const TEXT_COLORS = ["#FFF8F4", "#251E21", "#A3A3EE", "#5F5FC2", "#E62324", "#F4BE4F", "#61C554", "#0093D6"];

function PSeg({ value, options, onChange }) {
  return (
    <div className="pseg">
      {options.map((o) => {
        const I = Icons[o.icon];
        return (
          <button key={o.v} className={value === o.v ? "on" : ""} title={o.t}
                  onClick={() => onChange(o.v)}><I/></button>
        );
      })}
    </div>
  );
}

// Telemetry: text styling edits count toward the visual-edits task. Throttled —
// sliders and typing would otherwise emit per tick.
let _styleTrackAt = 0;
function trackStyle(prop) {
  const now = Date.now();
  if (now - _styleTrackAt < 2000) return;
  _styleTrackAt = now;
  if (window.METRICS) window.METRICS.track("text_style_changed", { target: prop });
}

function TextProperties({ st, set: rawSet, onClose, side }) {
  const set = (k, v) => { trackStyle(k); rawSet(k, v); };
  return (
    <div className={"props" + (side === "left" ? " left" : "")} onClick={(e) => e.stopPropagation()}>
      <div className="props-h">
        <div className="ic"><Icons.type/></div>
        <div className="t">Text<span>Title layer · selected</span></div>
        <button className="icon-ghost x" title="Deselect" onClick={onClose}><Icons.x/></button>
      </div>
      <div className="props-body">

        <div className="psec">
          <div className="lab">Content</div>
          <textarea className="pf" value={st.text} onChange={(e) => set("text", e.target.value)}/>
        </div>

        <div className="psec">
          <div className="lab">Font</div>
          <select className="pf" value={st.fontFamily} onChange={(e) => set("fontFamily", e.target.value)}>
            {TEXT_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="prow">
            <div className="pstep">
              <button onClick={() => set("fontSize", Math.max(8, st.fontSize - 2))}>−</button>
              <input type="number" value={st.fontSize}
                     onChange={(e) => set("fontSize", Math.max(8, Math.min(220, Number(e.target.value) || 8)))}/>
              <button onClick={() => set("fontSize", Math.min(220, st.fontSize + 2))}>+</button>
            </div>
            <button className={"ptoggle" + (st.weight >= 600 ? " on" : "")} title="Bold"
                    onClick={() => set("weight", st.weight >= 600 ? 400 : 600)}><Icons.bold/></button>
            <button className={"ptoggle" + (st.italic ? " on" : "")} title="Italic"
                    onClick={() => set("italic", !st.italic)}><Icons.italic/></button>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Paragraph</div>
          <div className="prow">
            <span className="plab">Align</span>
            <PSeg value={st.textAlign} onChange={(v) => set("textAlign", v)}
              options={[{v:"left",icon:"alignL",t:"Left"},{v:"center",icon:"alignC",t:"Center"},{v:"right",icon:"alignR",t:"Right"}]}/>
          </div>
          <div className="prow">
            <span className="plab">Vertical</span>
            <PSeg value={st.verticalAlign} onChange={(v) => set("verticalAlign", v)}
              options={[{v:"top",icon:"alignT",t:"Top"},{v:"middle",icon:"alignM",t:"Middle"},{v:"bottom",icon:"alignB",t:"Bottom"}]}/>
          </div>
          <div className="prow">
            <span className="plab">Line height</span>
            <input className="pslider" type="range" min="0.8" max="2" step="0.05" value={st.lineHeight}
                   onChange={(e) => set("lineHeight", Number(e.target.value))}/>
            <span className="pval">{st.lineHeight.toFixed(2)}</span>
          </div>
          <div className="prow">
            <span className="plab">Tracking</span>
            <input className="pslider" type="range" min="-0.06" max="0.2" step="0.005" value={st.letterSpacing}
                   onChange={(e) => set("letterSpacing", Number(e.target.value))}/>
            <span className="pval">{st.letterSpacing.toFixed(3)}</span>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Fill</div>
          <div className="pswatches">
            {TEXT_COLORS.map((c) => (
              <button key={c} className={"pswatch" + (st.color.toLowerCase() === c.toLowerCase() ? " on" : "")}
                      style={{ background: c }} title={c} onClick={() => set("color", c)}/>
            ))}
            <label className="pswatch custom" title="Custom color">
              +<input type="color" value={st.color} onChange={(e) => set("color", e.target.value)}/>
            </label>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Layout</div>
          <div className="prow">
            <span className="plab">Box</span>
            <select className="pf" value={st.box} onChange={(e) => set("box", e.target.value)}>
              <option value="auto-width">Auto width</option>
              <option value="auto-height">Auto height</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <div className="prow">
            <span className="plab">Opacity</span>
            <input className="pslider" type="range" min="0" max="100" step="1" value={st.opacity}
                   onChange={(e) => set("opacity", Number(e.target.value))}/>
            <span className="pval">{st.opacity}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const ANCHORS = ["top-left","top","top-right","left","center","right","bottom-left","bottom","bottom-right"];

function ImageProperties({ st, set, onClose, side }) {
  return (
    <div className={"props" + (side === "left" ? " left" : "")} onClick={(e) => e.stopPropagation()}>
      <div className="props-h">
        <div className="ic"><Icons.image/></div>
        <div className="t">Logo<span>Image layer · selected</span></div>
        <button className="icon-ghost x" title="Deselect" onClick={onClose}><Icons.x/></button>
      </div>
      <div className="props-body">

        <div className="psec">
          <div className="lab">Source</div>
          <button className="pf" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer" }}>
            <Icons.replace/> Replace image…
          </button>
          <div className="prow">
            <span className="plab">Fit</span>
            <PSeg value={st.fit} onChange={(v) => set("fit", v)}
              options={[{v:"contain",icon:"fit",t:"Contain"},{v:"cover",icon:"corners",t:"Cover"},{v:"fill",icon:"image",t:"Fill"}]}/>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Transform</div>
          <div className="prow">
            <span className="plab">Scale</span>
            <input className="pslider" type="range" min="20" max="240" step="1" value={st.scale}
                   onChange={(e) => set("scale", Number(e.target.value))}/>
            <span className="pval">{st.scale}%</span>
          </div>
          <div className="prow">
            <span className="plab">Rotation</span>
            <input className="pslider" type="range" min="-180" max="180" step="1" value={st.rotation}
                   onChange={(e) => set("rotation", Number(e.target.value))}/>
            <span className="pval">{st.rotation}°</span>
          </div>
          <div className="prow">
            <span className="plab">Flip</span>
            <button className={"ptoggle" + (st.flipH ? " on" : "")} title="Flip horizontal"
                    onClick={() => set("flipH", !st.flipH)}><Icons.flipH/></button>
            <button className={"ptoggle" + (st.flipV ? " on" : "")} title="Flip vertical"
                    onClick={() => set("flipV", !st.flipV)}><Icons.flipV/></button>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Position</div>
          <div className="anchor-grid">
            {ANCHORS.map((a) => (
              <button key={a} className={"adot" + (st.anchor === a ? " on" : "")}
                      title={a.replace("-", " ")} onClick={() => set("anchor", a)}><i></i></button>
            ))}
          </div>
        </div>

        <div className="psec">
          <div className="lab">Appearance</div>
          <div className="prow">
            <span className="plab">Corners</span>
            <input className="pslider" type="range" min="0" max="40" step="1" value={st.radius}
                   onChange={(e) => set("radius", Number(e.target.value))}/>
            <span className="pval">{st.radius}px</span>
          </div>
          <div className="prow">
            <span className="plab">Opacity</span>
            <input className="pslider" type="range" min="0" max="100" step="1" value={st.opacity}
                   onChange={(e) => set("opacity", Number(e.target.value))}/>
            <span className="pval">{st.opacity}%</span>
          </div>
          <div className="prow">
            <span className="plab">Drop shadow</span>
            <button className={"ptoggle" + (st.shadow ? " on" : "")} title="Drop shadow"
                    onClick={() => set("shadow", !st.shadow)}><Icons.shadow/></button>
          </div>
        </div>

      </div>
    </div>
  );
}

const SCENE_BGS = ["#3A2A40", "#251E21", "#1B2B3A", "#2A3A2A", "#FFF8F4", "#101316"];

function SceneProperties({ sc, set, onClose }) {
  return (
    <div className="props" onClick={(e) => e.stopPropagation()}>
      <div className="props-h">
        <div className="ic"><Icons.scenes/></div>
        <div className="t">Scene<span>Scene · selected</span></div>
        <button className="icon-ghost x" title="Deselect" onClick={onClose}><Icons.x/></button>
      </div>
      <div className="props-body">

        <div className="psec">
          <div className="lab">Scene</div>
          <input className="pf" value={sc.name} onChange={(e) => set("name", e.target.value)}/>
        </div>

        <div className="psec">
          <div className="lab">Format</div>
          <div className="prow">
            <span className="plab">Aspect</span>
            <PSeg value={sc.ratio} onChange={(v) => set("ratio", v)}
              options={[{v:"16:9",icon:"video",t:"16:9"},{v:"1:1",icon:"fit",t:"1:1"},{v:"9:16",icon:"corners",t:"9:16"}]}/>
          </div>
          <div className="prow">
            <span className="plab">Background</span>
          </div>
          <div className="pswatches">
            {SCENE_BGS.map((c) => (
              <button key={c} className={"pswatch" + (sc.bg.toLowerCase() === c.toLowerCase() ? " on" : "")}
                      style={{ background: c }} title={c} onClick={() => set("bg", c)}/>
            ))}
            <label className="pswatch custom" title="Custom color">
              +<input type="color" value={sc.bg} onChange={(e) => set("bg", e.target.value)}/>
            </label>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Timing</div>
          <div className="prow">
            <span className="plab">Transition</span>
            <select className="pf" value={sc.transition} onChange={(e) => set("transition", e.target.value)}>
              <option value="none">None</option>
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="zoom">Zoom</option>
            </select>
          </div>
          <div className="prow">
            <span className="plab">Duration</span>
            <input className="pslider" type="range" min="0" max="3" step="0.1" value={sc.transDur}
                   onChange={(e) => set("transDur", Number(e.target.value))}/>
            <span className="pval">{sc.transDur.toFixed(1)}s</span>
          </div>
          <div className="prow">
            <span className="plab">Length</span>
            <input className="pslider" type="range" min="1" max="30" step="0.5" value={sc.length}
                   onChange={(e) => set("length", Number(e.target.value))}/>
            <span className="pval">{sc.length.toFixed(1)}s</span>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Background</div>
          <div className="prow">
            <span className="plab">Blur</span>
            <input className="pslider" type="range" min="0" max="20" step="1" value={sc.blur}
                   onChange={(e) => set("blur", Number(e.target.value))}/>
            <span className="pval">{sc.blur}px</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function VideoProperties({ vid, set, fx, onEffect, onStudioSound, onClose, side }) {
  return (
    <div className={"props" + (side === "left" ? " left" : "")} onClick={(e) => e.stopPropagation()}>
      <div className="props-h">
        <div className="ic"><Icons.video/></div>
        <div className="t">Video<span>Clip · selected</span></div>
        <button className="icon-ghost x" title="Deselect" onClick={onClose}><Icons.x/></button>
      </div>
      <div className="props-body">

        <div className="psec">
          <div className="lab">Source</div>
          <input className="pf" value={vid.clip} onChange={(e) => set("clip", e.target.value)}/>
          <button className="pf" style={{ cursor:"pointer" }}>Replace clip…</button>
        </div>

        <div className="psec">
          <div className="lab">Transform</div>
          <div className="prow">
            <span className="plab">Scale</span>
            <input className="pslider" type="range" min="20" max="200" step="1" value={vid.scale}
                   onChange={(e) => set("scale", Number(e.target.value))}/>
            <span className="pval">{vid.scale}%</span>
          </div>
          <div className="prow">
            <span className="plab">Rotation</span>
            <input className="pslider" type="range" min="-180" max="180" step="1" value={vid.rotation}
                   onChange={(e) => set("rotation", Number(e.target.value))}/>
            <span className="pval">{vid.rotation}°</span>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Adjust</div>
          <div className="prow">
            <span className="plab">Opacity</span>
            <input className="pslider" type="range" min="0" max="100" step="1" value={vid.opacity}
                   onChange={(e) => set("opacity", Number(e.target.value))}/>
            <span className="pval">{vid.opacity}%</span>
          </div>
          <div className="prow">
            <span className="plab">Corners</span>
            <input className="pslider" type="range" min="0" max="40" step="1" value={vid.radius}
                   onChange={(e) => set("radius", Number(e.target.value))}/>
            <span className="pval">{vid.radius}px</span>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Audio</div>
          <div className="prow">
            <span className="plab">Volume</span>
            <input className="pslider" type="range" min="0" max="100" step="1" value={vid.volume}
                   onChange={(e) => set("volume", Number(e.target.value))}/>
            <span className="pval">{vid.volume}%</span>
          </div>
          <div className="prow">
            <span className="plab">Speed</span>
            <PSeg value={vid.speed} onChange={(v) => set("speed", v)}
              options={[{v:0.5,icon:"skipB",t:"0.5×"},{v:1,icon:"play",t:"1×"},{v:2,icon:"skipF",t:"2×"}]}/>
          </div>
        </div>

        <div className="psec">
          <div className="lab">Effects</div>
          <div className="prow" style={{ flexWrap: "wrap", gap: 6 }}>
            <EffectPill on={fx.studioSound} busy={fx.ssBusy} icon="audio" label="Studio Sound"
                        value={fx.studioSound ? fx.ssIntensity + "%" : null}
                        onClick={(rect) => onStudioSound(rect)}/>
            <EffectPill on={fx.eyeContact} busy={fx.ecBusy} icon="sparkle" label="Eye Contact"
                        onClick={() => onEffect("eyeContact")}/>
            <EffectPill on={fx.centerSpeaker} busy={fx.csBusy} icon="user" label="Center active speaker"
                        onClick={() => onEffect("centerSpeaker")}/>
          </div>
        </div>

      </div>
    </div>
  );
}

const FONT_STACK = {
  "Booton": '"Booton", system-ui, sans-serif',
  "Podkova": '"Podkova", Georgia, serif',
  "Manrope": '"Manrope", system-ui, sans-serif',
  "EB Garamond": '"EB Garamond", Georgia, serif',
  "Playfair Display": '"Playfair Display", Georgia, serif',
  "Brett": '"Brett", Georgia, serif',
};

Object.assign(window, { TextProperties, ImageProperties, SceneProperties, VideoProperties, FONT_STACK, TEXT_FONTS, TEXT_COLORS });
