// workspace.jsx — tab strip + panes + split + drag/drop
const SURFACE_DEFS = {
  video:    { label: "Canvas",   icon: "video" },
  plan:     { label: "Plan",     icon: "doc" },
  review:   { label: "Review changes", icon: "revert" },
  script:   { label: "Script",   icon: "script" },
  media:    { label: "Media",    icon: "media" },
  stock:    { label: "Stock",    icon: "stock" },
  effects:  { label: "Effects",  icon: "effects" },
  captions: { label: "Captions", icon: "captions" },
  scenes:   { label: "Scenes",   icon: "scenes" },
  publish:  { label: "Publish",  icon: "globe" },
  settings: { label: "Settings", icon: "settings" },
};
window.SURFACE_DEFS = SURFACE_DEFS;

const ADD_MENU = ["video", "script", "media", "publish", "settings"];

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
      {tab.compName && <span className="comp" title={"Composition: " + tab.compName}>{tab.compName}</span>}
      {!tab.closeable
        ? <span className="ti lock" title="Always open"><Icons.lock/></span>
        : <button className="x" title="Close tab"
            onClick={(e) => { e.stopPropagation(); on.close(tab.id); }}><Icons.x/></button>}
    </div>
  );
}

function Pane({ pane, tabsById, isSplit, density, drag, on, demo }) {
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

  // A drag can split this pane when it's the only pane and has a tab to keep behind.
  const canSplit = !isSplit && drag.id != null && pane.tabIds.length > 1;

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
                  {demo && demo.clipsAdded && (
                    <>
                      <div className="mlabel">Clips</div>
                      {(((window.DEMO || {}).compositions || {}).clips || []).map((c) => {
                        const isOpen = Object.values(tabsById).some((tb) => (tb.comp || "main") === c.id);
                        return (
                          <div className={"mi" + (isOpen ? " disabled" : "")} key={c.id}
                               onClick={isOpen ? undefined : () => { on.openClip(c); setMenu(false); }}>
                            <Icons.video/> <span className="clip-label">{c.name}</span>
                            {isOpen && <span className="k">Open</span>}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          {pane.tabIds.length > 1 && !isSplit && activeTab && (
            <button className="icon-ghost" title="Split tab to the right" onClick={() => on.split(pane.id)}><Icons.split/></button>
          )}
        </div>
      </div>

      <div className="pane-content">
        {activeTab && (
          <SurfaceContent tab={activeTab} planUpdated={on.planUpdated} onGo={on.onGo} goPulse={on.goPulse} demo={demo} onAddMedia={on.onAddMedia} sel={on.sel} setSel={on.setSel} fx={on.fx} onEffect={on.onEffect} onStudioSound={on.onStudioSound} textLayerVisible={on.textLayerVisible} freeTextVisible={on.freeTextVisible} onScriptTool={on.onScriptTool} scriptBusy={on.scriptBusy} mediaSeg={on.mediaSeg} setMediaSeg={on.setMediaSeg}/>
        )}
      </div>

      {/* Split drop target: right 40% of the tab bar (dotted line at 60%), tab-bar height only. */}
      {canSplit && (
        <div className={"split-drop" + (splitOver ? " over" : "")}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setSplitOver(true); }}
          onDragLeave={() => setSplitOver(false)}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); on.splitDrop(drag.id, pane.id); setSplitOver(false); drag.set(null, null); }}>
          <span>Split right</span>
        </div>
      )}
    </section>
  );
}

function Workspace({ panes, tabsById, density, on, demo }) {
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
              density={density} drag={drag} on={on} demo={demo}/>
      ))}
    </div>
  );
}

Object.assign(window, { Workspace, Pane, Tab });
