// timeline.jsx — bottom drawer (slideable, default closed), Descript-styled
function Timeline({ open, height, onClose }) {
  const D = window.DEMO || { chapters: [], duration: "20:50" };
  const scenes = D.chapters || [];
  const labs = [
    { i:"video",  t:"V1 — Neda" },
    { i:"video",  t:"V2 — Ashley" },
    { i:"audio",  t:"A1 — Dialogue" },
    { i:"audio",  t:"A2 — Music" },
    { i:"captions", t:"Titles" },
  ];
  return (
    <div className="timeline" style={{ height: open ? height : 0 }}>
      <div className="tl-bar">
        <div className="tl-grip"><Icons.grip/> Timeline</div>
        <div className="tl-ctl">
          <button title="Skip back"><Icons.skipB/></button>
          <button className="play" title="Play"><Icons.play/></button>
          <button title="Skip forward"><Icons.skipF/></button>
        </div>
        <button className="tl-split" title="Split clip"><Icons.split/> Split</button>
        <div className="tl-tc">00:03:35<span>/ {D.duration}</span></div>
        <div className="sp"></div>
        <div className="tl-zoom">− <input type="range" min="0" max="100" defaultValue="42"/> + <span className="z">62%</span></div>
        <button className="icon-ghost" title="Close timeline" onClick={onClose}><Icons.x/></button>
      </div>

      <div className="tl-scenes">
        {scenes.map((s, i) => (
          <div className="tl-scene" key={i} style={{ flex: i === scenes.length - 1 ? 2.2 : 1 }}>
            <div className="ts-thumb" style={{ backgroundImage: "url(video-thumb.png)" }}></div>
            <div className="ts-meta"><span className="nm">{s.name}</span><span className="ts">{s.ts}</span></div>
          </div>
        ))}
      </div>

      <div className="tl-grid">
        <div className="tl-labels">
          {labs.map((l, k) => { const I = Icons[l.i]; return (
            <div className="lab" key={k}><I/> {l.t}</div>
          );})}
        </div>
        <div className="tl-tracks">
          <div className="trk"><div className="clip v1" style={{left:"1%",width:"33%"}}>Neda · open</div><div className="clip v1" style={{left:"57%",width:"27%"}}>Neda · tactics</div></div>
          <div className="trk"><div className="clip v2" style={{left:"37%",width:"18%"}}>Ashley · question</div></div>
          <div className="trk"><div className="clip au" style={{left:"1%",width:"98%"}}></div></div>
          <div className="trk"><div className="clip mu" style={{left:"0%",width:"100%"}}>Ambient bed — Loop 2</div></div>
          <div className="trk"><div className="clip ti" style={{left:"2%",width:"10%"}}>LT: Neda</div><div className="clip ti" style={{left:"39%",width:"12%"}}>LT: Ashley</div><div className="clip ti" style={{left:"63%",width:"13%"}}>CC: ON</div></div>
          <div className="playhead" style={{left:"17%"}}></div>
        </div>
      </div>
    </div>
  );
}

window.Timeline = Timeline;
