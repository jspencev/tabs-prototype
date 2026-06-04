// timeline.jsx — bottom drawer (slideable, default closed), full width under panes
function Timeline({ open, height, onClose }) {
  const labs = [
    { i:"video",  t:"V1 — Maya" },
    { i:"video",  t:"V2 — Anika" },
    { i:"audio",  t:"A1 — Dialogue" },
    { i:"audio",  t:"A2 — Music" },
    { i:"captions", t:"Titles" },
  ];
  return (
    <div className="timeline" style={{ height: open ? height : 0 }}>
      <div className="tl-bar">
        <div className="tl-grip"><Icons.grip/> Timeline</div>
        <div className="tl-ctl">
          <button><Icons.skipB/></button>
          <button className="play"><Icons.play/></button>
          <button><Icons.skipF/></button>
        </div>
        <div className="tl-tc">00:00:31.910<span>/ 00:11:24.000</span></div>
        <div className="sp"></div>
        <div className="tl-zoom">− <input type="range" min="0" max="100" defaultValue="42"/> +</div>
        <button className="icon-ghost" title="Close timeline" onClick={onClose}><Icons.x/></button>
      </div>
      <div className="tl-grid">
        <div className="tl-labels">
          {labs.map((l, k) => { const I = Icons[l.i]; return (
            <div className="lab" key={k}><I/> {l.t}</div>
          );})}
        </div>
        <div className="tl-tracks">
          <div className="trk"><div className="clip v1" style={{left:"1%",width:"33%"}}>Maya · take 3</div><div className="clip v1" style={{left:"57%",width:"27%"}}>Maya · take 5</div></div>
          <div className="trk"><div className="clip v2" style={{left:"37%",width:"18%"}}>Anika · wide</div></div>
          <div className="trk"><div className="clip au" style={{left:"1%",width:"88%"}}></div></div>
          <div className="trk"><div className="clip mu" style={{left:"0%",width:"100%"}}>Ambient bed — Loop 2</div></div>
          <div className="trk"><div className="clip ti" style={{left:"2%",width:"10%"}}>LT: Maya</div><div className="clip ti" style={{left:"39%",width:"10%"}}>LT: Anika</div><div className="clip ti" style={{left:"63%",width:"13%"}}>CC: ON</div></div>
          <div className="playhead" style={{left:"46%"}}></div>
        </div>
      </div>
    </div>
  );
}

window.Timeline = Timeline;
