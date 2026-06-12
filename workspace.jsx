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

const ADD_MENU = ["media", "publish", "settings"]; // project-level surfaces (comps get their own section)

function Tab({ tab, active, paneId, density, drag, on, multiComp }) {
  const I = Icons[tab.icon] || Icons.doc;
  // Only composition-scoped surfaces carry a label, and only when there's more
  // than one composition to disambiguate (otherwise it'd be noise).
  const isCompSurface = tab.kind === "video" || tab.kind === "script";
  const compLabel = tab.compName || (tab.comp === "main" ? "Main video" : null);
  const showComp = multiComp && isCompSurface && compLabel;
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
      {showComp && <span className="comp" title={"Composition: " + compLabel}>{compLabel}</span>}
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
  const [naming, setNaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [hoverComp, setHoverComp] = useState(null);
  const toggleMenu = () => {
    setNaming(false); setNameDraft(""); setHoverComp(null);
    if (menu) { setMenu(false); return; }
    if (window.METRICS) window.METRICS.track("plus_menu_opened");
    const r = addRef.current && addRef.current.getBoundingClientRect();
    if (r) setMenuPos({ top: r.bottom + 6, left: r.left });
    setMenu(true);
  };
  // Is this composition's Canvas/Script already open as a tab?
  const compOpen = (compId, kind) =>
    Object.values(tabsById).some((tb) => tb.kind === kind && (tb.comp || "main") === compId);
  // Open-aware Canvas/Script line item for a composition (dim + "Open" badge,
  // click focuses the existing tab via openSurface reuse).
  const compItem = (c, kind, label) => {
    const isOpen = compOpen(c.id, kind);
    const I = kind === "video" ? Icons.video : Icons.script;
    return (
      <div className={"mi" + (isOpen ? " open" : "")}
           onClick={() => { on.openComp(pane.id, c, kind); setMenu(false); }}>
        <I/> {label}
        {isOpen && <span className="k">Open</span>}
      </div>
    );
  };
  const createComp = () => {
    on.newComposition(pane.id, nameDraft);
    setNaming(false); setNameDraft(""); setMenu(false);
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
               density={density} drag={drag} on={on} multiComp={(on.comps || []).length > 1}/>
        ))}
        <div className="strip-actions">
          <div style={{ position:"relative" }}>
            <button ref={addRef} className="icon-ghost add" title="Open surface…" onClick={toggleMenu}><Icons.plus/></button>
            {menu && (
              <>
                <div style={{position:"fixed",inset:0,zIndex:39}} onClick={() => setMenu(false)}></div>
                <div className="menu add-menu" style={{ position:"fixed", top:menuPos.top, left:menuPos.left }}>
                  {(on.comps || []).length <= 1 ? (
                    <>
                      {compItem((on.comps && on.comps[0]) || { id: "main", name: "Main video" }, "video", "Canvas")}
                      {compItem((on.comps && on.comps[0]) || { id: "main", name: "Main video" }, "script", "Script")}
                    </>
                  ) : (
                    <>
                      <div className="mlabel">Compositions</div>
                      {on.comps.map((c) => (
                        <div className="comp-parent" key={c.id}
                             onMouseEnter={() => setHoverComp(c.id)}
                             onMouseLeave={() => setHoverComp((h) => (h === c.id ? null : h))}>
                          <Icons.scenes/>
                          <span className="nm" title={c.name}>{c.name}</span>
                          <Icons.chevR className="chev"/>
                          {hoverComp === c.id && (
                            <div className="menu submenu" onMouseEnter={() => setHoverComp(c.id)}>
                              {compItem(c, "video", "Canvas")}
                              {compItem(c, "script", "Script")}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  <div className="mlabel">App</div>
                  {ADD_MENU.map((k) => {
                    const I = Icons[SURFACE_DEFS[k].icon];
                    const isOpen = openKinds.has(k);
                    return (
                      <div className={"mi" + (isOpen ? " open" : "")} key={k}
                           onClick={() => { on.openSurface(pane.id, k); setMenu(false); }}>
                        <I/> {SURFACE_DEFS[k].label}
                        {isOpen && <span className="k">Open</span>}
                      </div>
                    );
                  })}
                  <div className="mdiv"></div>
                  {naming ? (
                    <div className="name-row">
                      <input autoFocus placeholder="Composition name" value={nameDraft}
                             onChange={(e) => setNameDraft(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === "Enter") createComp();
                               if (e.key === "Escape") { setNaming(false); setNameDraft(""); }
                             }}/>
                      <button onClick={createComp}>Create</button>
                    </div>
                  ) : (
                    <div className="mi" onClick={() => setNaming(true)}>
                      <Icons.plus/> New composition
                    </div>
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
          <SurfaceContent tab={activeTab} planUpdated={on.planUpdated} onGo={on.onGo} goPulse={on.goPulse} demo={demo} onAddMedia={on.onAddMedia} sel={on.sel} setSel={on.setSel} fx={on.fx} onEffect={on.onEffect} onStudioSound={on.onStudioSound} textLayerVisible={on.textLayerVisible} freeTextVisible={on.freeTextVisible} onScriptTool={on.onScriptTool} scriptBusy={on.scriptBusy} mediaSeg={on.mediaSeg} setMediaSeg={on.setMediaSeg} onFillBlank={on.onFillBlank} intro={on.intro} onStockAdd={on.onStockAdd}/>
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
