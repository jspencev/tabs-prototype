// home.jsx — "Chatty Home" entry, borrowing Descript's GrandCentralDispatch.
// Presenter drops the (faked) file + types a prompt -> Get started -> into the editor.
const { useState, useRef, useEffect } = React;

const HOME_CHIPS = [
  "Clean up video recording",
  "Generate with an avatar",
  "Rough cut of podcast",
  "Create social clips",
  "Translate & dub video",
  "Turn slides into video",
];

function Home({ onStart }) {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);     // { name } once "uploaded"
  const [pct, setPct] = useState(0);          // fake upload progress
  const [dragging, setDragging] = useState(false);
  const taRef = useRef(null);
  const timer = useRef(null);

  const D = window.DEMO || {};

  const fakeUpload = () => {
    if (file) return;
    setFile({ name: D.fileName || "recording.mp4" });
    setPct(0);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setPct((p) => {
        if (p >= 100) { clearInterval(timer.current); return 100; }
        return Math.min(100, p + 9);
      });
    }, 90);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  const ready = !!file && pct >= 100;
  const canSubmit = ready || prompt.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onStart({ prompt: prompt.trim(), file });
  };

  return (
    <div className="home">
      <aside className="home-nav">
        <div className="hn-brand"><span className="hn-logo">d</span> Descript HQ</div>
        <div className="hn-group">
          <div className="hn-item active"><Icons.home/> Home</div>
          <div className="hn-item"><Icons.clock/> Recents</div>
          <div className="hn-item"><Icons.share2/> Shared with me</div>
        </div>
        <div className="hn-label">Workspaces</div>
        <div className="hn-group">
          <div className="hn-item"><Icons.lock/> Personal</div>
          <div className="hn-item"><Icons.user/> General</div>
        </div>
        <div className="hn-label">Tools</div>
        <div className="hn-group">
          <div className="hn-item"><Icons.color/> Brand Studio</div>
          <div className="hn-item"><Icons.media/> Media library</div>
          <div className="hn-item"><Icons.robot/> AI speakers</div>
        </div>
      </aside>

      <main className="home-main">
        <div className="home-top">
          <div className="home-search"><Icons.search/> Search projects</div>
          <div className="sp"></div>
          <button className="chrome-btn"><Icons.record/> Record</button>
          <button className="chrome-btn primary">New project</button>
        </div>

        <div className="home-scroll">
          <section className="gcd">
            <div className="gcd-head">
              <span className="gcd-bot"><Icons.robot/></span>
              <h1>What can I help you with?</h1>
            </div>

            <div className={"gcd-box" + (dragging ? " drag" : "")}
                 onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                 onDragLeave={() => setDragging(false)}
                 onDrop={(e) => { e.preventDefault(); setDragging(false); fakeUpload(); }}>
              {file && (
                <div className="gcd-chip">
                  <span className="ti"><Icons.video/></span>
                  <span className="nm">{file.name}</span>
                  {pct < 100
                    ? <span className="bar"><i style={{ width: pct + "%" }}></i></span>
                    : <span className="done">Ready</span>}
                </div>
              )}
              <textarea ref={taRef} rows="2" value={prompt}
                        placeholder="Upload a file or describe what you want to make, and I’ll help you plan it."
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}/>
              <div className="gcd-foot">
                <button className="gcd-attach" title="Upload video, audio, or image files" onClick={fakeUpload}><Icons.paperclip/></button>
                <span className="gcd-auto"><Icons.sparkle/> Auto</span>
                <div className="sp"></div>
                <button className={"gcd-go" + (canSubmit ? "" : " off")} onClick={submit}>Get started</button>
              </div>
              {dragging && <div className="gcd-drop">Drop files here</div>}
            </div>

            <div className="gcd-chips">
              {HOME_CHIPS.map((c) => (
                <button className="gcd-tmpl" key={c} onClick={() => setPrompt(c)}>{c}</button>
              ))}
              <button className="gcd-tmpl ghost">Browse prompt templates…</button>
            </div>
          </section>

          <section className="home-section">
            <h2>Recent projects</h2>
            <div className="home-recents">
              <div className="rcard">
                <div className="rthumb" style={{ backgroundImage: "url(video-thumb.png)" }}></div>
                <div className="rmeta">{DEMO.projectTitle}</div>
              </div>
              <div className="rcard"><div className="rthumb a"></div><div className="rmeta">Q2 Town Hall — recap</div></div>
              <div className="rcard"><div className="rthumb b"></div><div className="rmeta">Listing walkthrough v2</div></div>
              <div className="rcard"><div className="rthumb c"></div><div className="rmeta">Agent onboarding</div></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

window.Home = Home;
