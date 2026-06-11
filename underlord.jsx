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

function Underlord({ convo, thinking, onSend, onUploadSend, onOpenArtifact, onChip, onNewChat, history, onSelectHistory, onSkill, onPlanGo, onReview, onOpenClip, onClose }) {
  const [draft, setDraft] = useState("");
  const [histOpen, setHistOpen] = useState(false);
  const [histPos, setHistPos] = useState({ top: 0, right: 0 });
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState("");
  const [skillsPos, setSkillsPos] = useState({ left: 0, bottom: 0 });
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachPos, setAttachPos] = useState({ left: 0, bottom: 0 });
  const [pending, setPending] = useState(null); // { name, meta } attached but not yet sent
  const bodyRef = useRef(null);
  const taRef = useRef(null);
  const histRef = useRef(null);
  const composerRef = useRef(null);
  const clipRef = useRef(null);

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
    if (skill && skill.fn && onSkill) onSkill(skill.fn);
  };

  const toggleHist = () => {
    if (histOpen) { setHistOpen(false); return; }
    const r = histRef.current && histRef.current.getBoundingClientRect();
    if (r) setHistPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setHistOpen(true);
  };

  const toggleAttach = () => {
    if (attachOpen) { setAttachOpen(false); return; }
    const r = clipRef.current && clipRef.current.getBoundingClientRect();
    if (r) setAttachPos({ left: r.left, bottom: window.innerHeight - r.top + 6 });
    setAttachOpen(true);
  };
  const attachDemoFile = () => {
    const D = window.DEMO || {};
    setPending({ name: D.fileName, meta: D.duration });
    setAttachOpen(false);
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [convo, thinking]);

  const send = () => {
    const v = draft.trim();
    if (pending) {
      const file = pending;
      setPending(null); setDraft("");
      if (taRef.current) taRef.current.style.height = "auto";
      onUploadSend(v, file);
      return;
    }
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
        <div className="ul-title">Underlord <span className="ul-beta">Beta</span></div>
        <div className="ul-head-actions">
          <button className="icon-ghost" title="New chat" onClick={onNewChat}><Icons.messagePlus/></button>
          <button ref={histRef} className={"icon-ghost" + (histOpen ? " on" : "")} title="Chat history" onClick={toggleHist}><Icons.conversation/></button>
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
            {m.file && (
              <div className="ctx-file">
                <span className="ti"><Icons.video/></span>
                <span className="nm">{m.file.name}</span>
                {m.file.meta && <span className="meta">{m.file.meta}</span>}
              </div>
            )}
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
            {m.clips && (
              <div className="clip-list">
                {(((window.DEMO || {}).compositions || {}).clips || []).map((c) => (
                  <button className="clip-row" key={c.id} onClick={() => onOpenClip && onOpenClip(c)}>
                    <span className="cr-thumb" style={{ backgroundImage: "url(video-thumb.png)" }}></span>
                    <span className="cr-meta">
                      <span className="cr-nm">{c.name}</span>
                      <span className="cr-sub">Clip · {c.duration}</span>
                    </span>
                    <span className="cr-open">Open ›</span>
                  </button>
                ))}
              </div>
            )}
            {m.review && (
              <div className="msg-actions">
                <button className="msg-action" title="Restore project to before this step"><Icons.revert/> Revert</button>
                <button className="msg-action go" onClick={onReview}>Review changes</button>
                <span className="sp"></span>
                <button className="msg-action icon" title="Good response"><Icons.thumbUp/></button>
                <button className="msg-action icon" title="Bad response"><Icons.thumbDn/></button>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="msg ai">
            <div className="think shimmer">Thinking · ~60s</div>
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

      {attachOpen && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:39 }} onClick={() => setAttachOpen(false)}></div>
          <div className="menu attach-menu" style={{ position:"fixed", left: attachPos.left, bottom: attachPos.bottom }}>
            <div className="mlabel">Add files</div>
            <div className="mi" onClick={attachDemoFile}><Icons.upload/> Upload from computer</div>
            <div className="mi" onClick={attachDemoFile}><Icons.folder/> Attach from other projects</div>
          </div>
        </>
      )}

      <div className="ul-composer">
        <div className="composer-box" ref={composerRef}>
          {pending && (
            <div className="composer-attach">
              <span className="ca-chip">
                <span className="ti"><Icons.video/></span>
                <span className="nm">{pending.name}</span>
                {pending.meta && <span className="meta">{pending.meta}</span>}
                <button className="ca-x" title="Remove attachment" onClick={() => setPending(null)}><Icons.x/></button>
              </span>
            </div>
          )}
          <textarea ref={taRef} rows="1" value={draft} placeholder="Ask Underlord, @ to add context"
                    onChange={grow} onKeyDown={onKey}/>
          <div className="composer-bar">
            <button ref={clipRef} className={"cbtn" + (attachOpen ? " on" : "")} title="Upload video, audio, image, or PDF files" onClick={toggleAttach}><Icons.paperclip/></button>
            <button className="cbtn" title="Add context"><Icons.at/></button>
            <button className="cmodel" title="Model">Auto <Icons.chevD/></button>
            <span className="sp"></span>
            <button className="send" disabled={!draft.trim() && !pending} onClick={send}><Icons.arrowUp/></button>
          </div>
        </div>
        <div className="ul-hint">Underlord can make mistakes. <b>Learn more</b></div>
      </div>
    </aside>
  );
}

window.Underlord = Underlord;
