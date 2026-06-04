// workspace.jsx — tab strip + panes + split + drag/drop
const SURFACE_DEFS = {
  video:    { label: "Video",    icon: "video" },
  plan:     { label: "Plan",     icon: "doc" },
  script:   { label: "Script",   icon: "script" },
  media:    { label: "Media",    icon: "media" },
  stock:    { label: "Stock",    icon: "stock" },
  effects:  { label: "Effects",  icon: "effects" },
  captions: { label: "Captions", icon: "captions" },
  scenes:   { label: "Scenes",   icon: "scenes" },
  settings: { label: "Settings", icon: "settings" },
};
window.SURFACE_DEFS = SURFACE_DEFS;

const ADD_MENU = ["video", "script", "settings", "media"];

function Tab({ tab, active, paneId, density, drag, on }) {
  const I = Icons[tab.icon] || Icons.doc;
  return (
    <div
      className={"tab" + (active ? " active" : "") + (tab.closeable ? "" : " anchor")
        + (drag.id === tab.id ? " dragging" : "")}
      draggable
      onClick={() => on.activate(paneId, tab.id)}
      onDragStart={(e) => { drag.set(tab.id, paneId); e.dataTransfer.effectAllowed = "move"; }}
      onDragEnd={() => drag.set(null, null)}
      onDragOver={(e) => { e.preventDefault(); drag.setOverTab(tab.id); }}
      title={tab.label}
    >
      <span className="ti"><I/></span>
      <span className="lbl">{tab.label}</span>
      {!tab.closeable
        ? <span className="ti lock" title="Always open"><Icons.lock/></span>
        : <button className="x" title="Close tab"
            onClick={(e) => { e.stopPropagation(); on.close(tab.id); }}><Icons.x/></button>}
    </div>
  );
}

function Pane({ pane, tabsById, isSplit, density, drag, on }) {
  const [menu, setMenu] = useState(false);
  const activeTab = tabsById[pane.activeId] || tabsById[pane.tabIds[0]];
  const [splitOver, setSplitOver] = useState(false);
  const openKinds = new Set(Object.values(tabsById).map((tb) => tb.kind));
  const addRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const toggleMenu = () => {
    if (menu) { setMenu(false); return; }
    const r = addRef.current && addRef.current.getBoundingClientRect();
    if (r) setMenuPos({ top: r.bottom + 6, left: r.left });
    setMenu(true);
  };

  return (
    <section className="pane">
      <div className={"strip" + (drag.over === "strip-" + pane.id ? " dragover" : "")}
        onDragOver={(e) => { e.preventDefault(); drag.setOver("strip-" + pane.id); }}
        onDrop={(e) => { e.preventDefault(); on.moveTab(drag.id, pane.id, drag.overTab); drag.set(null, null); }}>
        {pane.tabIds.map((id) => tabsById[id] && (
          <Tab key={id} tab={tabsById[id]} active={id === pane.activeId} paneId={pane.id}
               density={density} drag={drag} on={on}/>
        ))}
        <div className="strip-actions">
          <div style={{ position:"relative" }}>
            <button ref={addRef} className="icon-ghost add" title="Open surface…" onClick={toggleMenu}><Icons.plus/></button>
            {menu && (
              <>
                <div style={{position:"fixed",inset:0,zIndex:39}} onClick={() => setMenu(false)}></div>
                <div className="menu" style={{ position:"fixed", top:menuPos.top, left:menuPos.left }}>
                  <div className="mlabel">Open as tab</div>
                  {ADD_MENU.map((k) => {
                    const I = Icons[SURFACE_DEFS[k].icon];
                    const isOpen = openKinds.has(k);
                    return (
                      <div className={"mi" + (isOpen ? " disabled" : "")} key={k}
                           onClick={isOpen ? undefined : () => { on.openSurface(pane.id, k); setMenu(false); }}>
                        <I/> {SURFACE_DEFS[k].label}
                        {isOpen && <span className="k">Open</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {pane.tabIds.length > 1 && !isSplit && activeTab && (
            <button className="icon-ghost" title="Split tab to the right" onClick={() => on.split(pane.id)}><Icons.split/></button>
          )}
        </div>
      </div>

      <div className={"pane-content" + (splitOver ? " " : "")}
        onDragOver={(e) => {
          if (drag.id == null) return;
          const r = e.currentTarget.getBoundingClientRect();
          const right = e.clientX > r.left + r.width * 0.6;
          // only offer split when not already split, and there's another tab to keep
          if (right && !isSplit) { e.preventDefault(); setSplitOver(true); drag.setOver("split-" + pane.id); }
          else setSplitOver(false);
        }}
        onDragLeave={() => setSplitOver(false)}
        onDrop={(e) => { if (splitOver) { e.preventDefault(); on.splitDrop(drag.id, pane.id); } setSplitOver(false); drag.set(null, null); }}>
        {activeTab && (
          <SurfaceContent tab={activeTab} planUpdated={on.planUpdated} onGo={on.onGo} goPulse={on.goPulse}/>
        )}
        {splitOver && <div className="pane" style={{position:"absolute",inset:"0 0 0 60%",background:"rgba(163,163,238,.14)",borderLeft:"2px solid var(--blurple-400)",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:6}}>
          <span style={{font:"600 12px/1 var(--font-sans)",color:"#bdbdfb"}}>Split here</span>
        </div>}
      </div>
    </section>
  );
}

function Workspace({ panes, tabsById, density, on }) {
  const [dragId, setDragId] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [over, setOver] = useState(null);
  const [overTab, setOverTab] = useState(null);
  const drag = {
    id: dragId, from: dragFrom, over, overTab,
    set: (id, from) => { setDragId(id); setDragFrom(from); if (id == null) { setOver(null); setOverTab(null); } },
    setOver: (o) => setOver(o),
    setOverTab: (t) => setOverTab(t),
  };
  // overTab tracking via setOver when hovering a tab
  drag.setOver = (o) => { setOver(o); if (!o || !o.startsWith("strip")) setOverTab(null); };
  drag.setOverTab = (t) => setOverTab(t);

  return (
    <div className="panes">
      {panes.map((p, i) => (
        <Pane key={p.id} pane={p} tabsById={tabsById} isSplit={panes.length > 1}
              density={density} drag={drag} on={on}/>
      ))}
    </div>
  );
}

Object.assign(window, { Workspace, Pane, Tab });
