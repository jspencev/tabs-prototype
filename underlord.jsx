// underlord.jsx — left agent drawer (slideable, default open)
const { useRef, useEffect } = React;

const relTime = (ts) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  return Math.floor(h / 24) + "d";
};

function Underlord({ convo, thinking, onSend, onOpenArtifact, onChip, onNewChat, history, onSelectHistory, onSkill, onPlanGo, onClose }) {
  const [draft, setDraft] = useState("");
  const [histOpen, setHistOpen] = useState(false);
  const [histPos, setHistPos] = useState({ top: 0, right: 0 });
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState("");
  const [skillsPos, setSkillsPos] = useState({ left: 0, bottom: 0 });
  const bodyRef = useRef(null);
  const taRef = useRef(null);
  const histRef = useRef(null);
  const composerRef = useRef(null);

  const SKILLS = (window.DEMO && window.DEMO.skills) || [];
  const filteredSkills = SKILLS.filter((s) => s.label.toLowerCase().includes(skillFilter.toLowerCase()));

  const openSkills = () => {
    const r = composerRef.current && composerRef.current.getBoundingClientRect();
    if (r) setSkillsPos({ left: r.left, bottom: window.innerHeight - r.top + 6 });
    setSkillsOpen(true);
  };
  const selectSkill = (skill) => {
    setSkillsOpen(false);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
    if (skill && skill.fn === "fillers" && onSkill) onSkill("fillers");
  };

  const toggleHist = () => {
    if (histOpen) { setHistOpen(false); return; }
    const r = histRef.current && histRef.current.getBoundingClientRect();
    if (r) setHistPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setHistOpen(true);
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [convo, thinking]);

  const send = () => {
    const v = draft.trim();
    if (!v) return;
    onSend(v); setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
  };
  const onKey = (e) => {
    if (skillsOpen) {
      if (e.key === "Escape") { e.preventDefault(); setSkillsOpen(false); return; }
      if (e.key === "Enter") { e.preventDefault(); if (filteredSkills[0]) selectSkill(filteredSkills[0]); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };
  const grow = (e) => {
    const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 90) + "px";
    const v = el.value;
    setDraft(v);
    if (v.startsWith("/")) { setSkillFilter(v.slice(1)); if (!skillsOpen) openSkills(); }
    else if (skillsOpen) setSkillsOpen(false);
  };

  const empty = convo.length === 0 && !thinking;

  return (
    <aside className="ul">
      <div className="ul-head">
        <div className="ul-mark"><Icons.sparkle/></div>
        <div>
          <div className="t">Underlord</div>
          <div className="st">● {thinking ? "Working…" : "Ready"}</div>
        </div>
        <div className="ul-head-actions">
          <button className="icon-ghost" title="New chat" onClick={onNewChat}><Icons.plus/></button>
          <button ref={histRef} className={"icon-ghost" + (histOpen ? " on" : "")} title="Chat history" onClick={toggleHist}><Icons.history/></button>
          <button className="icon-ghost close" title="Hide Underlord" onClick={onClose}><Icons.sidebar/></button>
        </div>
        {histOpen && (
          <>
            <div style={{ position:"fixed", inset:0, zIndex:49 }} onClick={() => setHistOpen(false)}></div>
            <div className="ul-hist" style={{ top: histPos.top, right: histPos.right }}>
              <div className="ul-hist-label">Recent chats</div>
              {(history && history.length > 0) ? history.map((c) => (
                <div className="ul-hist-item" key={c.id}
                     onClick={() => { onSelectHistory(c.id); setHistOpen(false); }}>
                  <span className="t">{c.title}</span>
                  <span className="ts">{relTime(c.ts)}</span>
                </div>
              )) : <div className="ul-hist-empty">No past chats</div>}
            </div>
          </>
        )}
      </div>

      <div className="ul-body" ref={bodyRef}>
        {empty && (
          <div className="ul-empty">
            <div className="glow"><Icons.sparkle/></div>
            <h3>What are we making?</h3>
            <p>Describe the edit you want. I'll plan it, and the plan opens as its own tab you can review before running.</p>
          </div>
        )}

        {convo.map((m, k) => (
          <div className={"msg " + (m.role === "user" ? "user" : "ai")} key={k}>
            {m.role === "ai" && <span className="who">Underlord</span>}
            {m.text && <div className="bubble">{m.text}</div>}
            {m.artifact && (
              <div className="artifact" onClick={() => onOpenArtifact(m.artifact)}>
                <span className="ai"><Icons.doc/></span>
                <span className="meta">
                  <span className="nm">{m.artifact.name}</span>
                  <span className="sub">{m.artifact.sub}</span>
                </span>
                <span className="open">Open ›</span>
              </div>
            )}
            {m.chips && (
              <div className="chips">
                {m.chips.map((c, j) => <button className="chip" key={j} onClick={() => onChip(c)}>{c}</button>)}
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="msg ai">
            <span className="who">Underlord</span>
            <div className="think"><span className="spin"></span> Thinking · ~60s</div>
          </div>
        )}
      </div>

      {skillsOpen && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:39 }} onClick={() => setSkillsOpen(false)}></div>
          <div className="menu skills-menu" style={{ position:"fixed", left: skillsPos.left, bottom: skillsPos.bottom }}>
            <div className="mlabel">Skills</div>
            {filteredSkills.length > 0 ? filteredSkills.map((s) => (
              <div className="mi" key={s.label} onClick={() => selectSkill(s)}>
                <Icons.bulb/> <span className="skill">{s.label}</span>
              </div>
            )) : <div className="mi disabled"><span className="skill">No matching skills</span></div>}
          </div>
        </>
      )}

      <div className="ul-composer">
        <div className="composer-box" ref={composerRef}>
          <textarea ref={taRef} rows="1" value={draft} placeholder="Ask Underlord to make an edit…  (type / for skills)"
                    onChange={grow} onKeyDown={onKey}/>
          <button className="send" disabled={!draft.trim()} onClick={send}><Icons.arrowUp/></button>
        </div>
        <div className="ul-hint">Type <b>/</b> for skills</div>
      </div>
    </aside>
  );
}

window.Underlord = Underlord;
