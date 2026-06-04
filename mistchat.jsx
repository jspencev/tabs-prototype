// mistchat.jsx — ephemeral "mist" chat summoned by "/"
// Casts an input above the cursor, then on submit glides down and locks to a
// bottom-center dock. Messages stack upward and dissolve into mist (top fade).
const { useState, useRef, useEffect } = React;

function EphemeralChat({ docked, castPos, dockCenterX, convo, thinking, onSend, onChip, onOpenArtifact, onClose, onDock }) {
  const [draft, setDraft] = useState("");
  const taRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { if (taRef.current) taRef.current.focus(); }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [convo, thinking, docked]);

  const send = () => {
    const v = draft.trim();
    if (!v) return;
    onSend(v);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };
  const grow = (e) => {
    const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 80) + "px";
    setDraft(el.value);
  };

  // CAST: translate the dock-anchored container up to the cursor.
  // DOCKED: settle back to the workspace-centered dock (transform transition glides).
  const cx = typeof dockCenterX === "number" ? dockCenterX : window.innerWidth / 2;
  let transform = "translateX(-50%)";
  if (!docked && castPos) {
    const dx = castPos.x - cx;
    const dy = (castPos.y - 14) - (window.innerHeight - 64);
    transform = `translateX(-50%) translate(${dx}px, ${dy}px)`;
  }

  return (
    <div className={"mist" + (docked ? " docked" : " cast")} style={{ left: cx, transform }}>
      <div className="mist-scroll" ref={scrollRef}>
        {convo.map((m, k) => (
          <div className={"mist-msg " + (m.role === "user" ? "user" : "ai")} key={k}>
            {m.text && <div className="mist-bubble">{m.text}</div>}
            {m.artifact && (
              <div className="mist-artifact" onClick={() => onOpenArtifact(m.artifact)}>
                <span className="ai"><Icons.doc/></span>
                <span className="meta">
                  <span className="nm">{m.artifact.name}</span>
                  <span className="sub">{m.artifact.sub}</span>
                </span>
                <span className="open">Open ›</span>
              </div>
            )}
            {m.chips && (
              <div className="mist-chips">
                {m.chips.map((c, j) => <button className="mist-chip" key={j} onClick={() => onChip(c)}>{c}</button>)}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="mist-msg ai">
            <div className="think"><span className="spin"></span> Thinking · ~60s</div>
          </div>
        )}
      </div>

      <div className="mist-input">
        <span className="mist-spark"><Icons.sparkle/></span>
        <textarea ref={taRef} rows="1" value={draft} placeholder="Ask Underlord…"
                  onChange={grow} onKeyDown={onKey}/>
        <button className="mist-send" disabled={!draft.trim()} onClick={send}><Icons.arrowUp/></button>
      </div>

      <div className="mist-actions">
        <button className="mist-dock" title="Dock to sidebar" onClick={onDock}><Icons.sidebar/></button>
        <button className="mist-x" title="Close (Esc)" onClick={onClose}><Icons.x/></button>
      </div>
    </div>
  );
}

window.EphemeralChat = EphemeralChat;
