// Study metrics — transport-agnostic event recorder for unmoderated tests,
// ported from Jovo's nui-prototype (docs/STUDY-METRICS.md there).
//
// Great Question records video but can't track URLs or events, so the
// prototype self-reports: who (pid), where (task/state), what (event), when
// (ms since the task page loaded), and how tasks were completed
// (task_success {via}).
//
// SHARED COLLECTOR: events POST to the same Google Apps Script web app /
// Sheet as the nui-prototype. Every event name is prefixed "tabs_" so this
// prototype's rows can never blend with that study's data — filter the
// `event` column by prefix to split them.
//
// With no endpoint configured, events still log to the console and buffer in
// localStorage (study_metrics_log) for manual export.
(() => {
  "use strict";

  window.STUDY_METRICS_CONFIG = window.STUDY_METRICS_CONFIG || {
    endpoint: "https://script.google.com/a/macros/descript.com/s/AKfycbxPvt1UgZD3q_9r2Dsop9baZXnMNcs2CrDxzKv7EGJhcZ6LFIw1L07ZghUsMWuLx8lt/exec",
  };

  const params = new URLSearchParams(window.location.search);
  const task = parseInt(params.get("task"), 10) || 0;
  const state = params.get("state") || "default";

  // Participant id: ?pid= from the Great Question task link wins; otherwise
  // one is generated and persisted so all tasks in a browser share an id.
  function rand() { return Math.random().toString(36).slice(2, 8); }
  let pid = params.get("pid") || "";
  if (!pid) {
    try {
      pid = localStorage.getItem("study_pid") || ("p-" + rand());
      localStorage.setItem("study_pid", pid);
    } catch (_) { pid = "p-" + rand(); }
  }

  const sessionId = Date.now();            // one per task page load
  const taskStart = performance.now();

  // Which events end which Notion task (the research plan's Validation
  // column). The first matching event per page load also fires task_success
  // with via = "<event>" or "<event>:<via>".
  const SUCCESS = {
    2:  ["media_added"],
    4:  ["fillers_removed", "script_ignore", "script_delete", "underlord_message"],
    5:  ["stock_added", "stock_opened", "underlord_message"],
    6:  ["lower_third_added", "element_added", "underlord_message"],
    7:  ["text_style_changed", "underlord_message"],
    8:  ["music_repositioned", "underlord_message"],
    9:  ["studio_sound_applied"],
    11: ["clips_created", "underlord_message"],
    12: ["clip_opened", "comps_menu_opened"],
    14: ["plus_menu_opened"],
    15: ["split_created"],
  };
  let succeeded = false;

  function record(event, props) {
    return Object.assign({
      event: "tabs_" + event,
      task: task,
      state: state,
      pid: pid,
      session_id: sessionId,
      t_ms: Math.round(performance.now() - taskStart),
      ts: new Date().toISOString(),
    }, props || {});
  }

  function sendEndpoint(rec) {
    const url = window.STUDY_METRICS_CONFIG.endpoint;
    if (!url) return;
    // text/plain avoids a CORS preflight (Apps Script reads the raw body)
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      keepalive: true,
      mode: "no-cors",
      body: JSON.stringify(rec),
    }).catch(() => {});
  }

  function buffer(rec) {
    try {
      const log = JSON.parse(localStorage.getItem("study_metrics_log") || "[]");
      log.push(rec);
      localStorage.setItem("study_metrics_log", JSON.stringify(log.slice(-500)));
    } catch (_) {}
  }

  function emit(rec) {
    buffer(rec);
    sendEndpoint(rec);
    if (window.STUDY_METRICS_DEBUG) console.log("[metrics]", rec);
  }

  function track(event, props) {
    emit(record(event, props));
    if (!succeeded && SUCCESS[task] && SUCCESS[task].includes(event)) {
      succeeded = true;
      const via = event + (props && props.via ? ":" + props.via : "");
      emit(record("task_success", { via: via }));
    }
  }

  window.METRICS = { track: track, pid: pid, task: task, state: state };

  // Generic click breadcrumbs fill the gaps between instrumented events so
  // full click paths are reconstructable per task. Labels come from the
  // nearest meaningful control; throttled to one per 150ms.
  let lastClick = 0;
  document.addEventListener("click", (e) => {
    const now = performance.now();
    if (now - lastClick < 150) return;
    lastClick = now;
    const el = e.target.closest("button, a, [role=\"button\"], .mi, .tab, .cpill, .cmd-item, .stk-tile, .tl-clip, .tl-scene");
    if (!el) return;
    const label = el.title || el.id ||
      (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 48) ||
      el.className.toString().split(" ")[0];
    if (label) track("ui_click", { target: label });
  }, true);

  track("task_started");
})();
