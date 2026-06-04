# Presenter script — Guided rough-cut demo (Neda Navab project)

A free-clicking prototype. All "AI" is faked and fires in the order below as you trigger it. No real LLM, no media processing. Open `Editor 4.0 - Adaptive Tabs.html` (served over http://). **Reset** between runs = reload the page (returns to Chatty Home).

Throughout, the thesis to land: **everything is a tab** — video, script, plan — and **Underlord is summoned anywhere with `/`**.

---

## Beat 1 — Entry (Chatty Home → editor)
**Do:**
1. On Chatty Home, click the paperclip (or drag a file onto the box). The recording "uploads" (progress → Ready).
2. Click **Get started** (no need to type anything).
3. You land in the editor on the **Video** tab. The first thing in the Underlord chat is the **file context pill** for the recording you brought in. Underlord automatically adds it: the canvas pops from empty state to the video, and it says "Okay — I've added that to your project. What would you like to do next?" (no action needed from you here).

**Shows:** Chatty Home ("What can I help you with?") → editor; the chat opens with the attached-file pill (no typed instruction); the canvas swaps from empty state to the real video frame on its own.

**Say:** "You start where you already are — the home hub. You just bring a file — no prompt needed — and Underlord drops you straight into the editor. It shows the file you handed it right there in the chat, adds it for you, and hands control back: what next?"

---

## Beat 2 — Clean up: remove filler words (the `/` skills menu)
**Do:**
1. In the Underlord composer (left), type `/`.
2. The **skills menu** pops up (lightbulb + monospace names — same menu as the `+` add-tab). Pick **Remove filler words**.

**Shows:** jumps to the **Script** tab; filler words flash, then disappear; Underlord posts "Removed 9 filler words…".

**Say:** "Every AI action is a skill at your fingertips — slash to summon, pick one, done. The transcript tightens itself; you're editing by editing text."

---

## Beat 3 — Rearrange the story (Plan Mode) — HERO
**Do:**
1. In the composer, type: `Rearrange the story to be punchier` → Enter.
2. Underlord opens a **Plan tab** (and drops a linked plan card in chat). Click over to the **Plan** tab to show the ordered steps.
3. Push back — type: `Keep the audience question where it was` → Enter. The **Plan tab updates** to the revised plan.
4. Press **Go** (top-right of the Plan tab).

**Shows:** a real **Plan tab** with the steps; on Go the **script visibly reorders** (now opens on the boutique thesis, groups the tactics).

**Say:** "For bigger moves it doesn't just do — it plans. You steer the plan in plain language, approve it, and only then does it execute. That's the trust model: review before run."

**Then — review the changes:**
1. When the run finishes, Underlord's closing message has an action bar: **Revert · Review changes · 👍 👎**. Click **Review changes**.
2. A **Review changes** tab opens (in the left pane). Up top: a **Current | Prev | Show diff** toggle.
3. The **changes track** under the player shows each key moment as a colored chip (move/modify/insert = filled, delete = marker). Click a chip — the player **seeks to that moment** and the bullets below update to what changed there.
4. Toggle to **Prev** — the same moments shift to their old positions (longer timeline; the deleted bit shows as a filled block). Toggle to **Show diff** — **Before | After** side by side, with a "Removed"/"Added" placeholder on the side where the content doesn't exist.

**Say:** "And after it runs, you don't have to take it on faith. Every change is a key moment you can click through — before, after, or side-by-side — so you see exactly what it did and where."

---

## Beat 4 — Add chapters
**Do:**
1. In the composer, type: `Split this into chapters` → Enter.

**Shows:** chapter markers appear in the Script at the real moments — **Big is Your Engine** (0:00), **Boutique is Your Edge** (3:03), **Listing Resources** (8:31), **Open House Script** (12:49).

**Say:** "Structure on demand. It found the real topic shifts and dropped chapters right into the script."

---

## Closer — it's still a real editor
**Do:**
1. On the **Video** tab, click the clip, then click the scene chip — the floating **contextual toolbar** (bottom center) swaps its tools (clip tools vs scene tools), always keeping **Ask Underlord** on the right.
2. Click **Ask Underlord** on that toolbar — it expands in place into the mist chat prompt at the same spot (the same place `/` docks to after you send). Press **Esc** to collapse back to the toolbar.
3. Click the **Timeline** button (bottom center) to reveal the timeline.

**Shows:** the toolbar adapting to selection; Underlord opening from the toolbar; Descript-style scene strip (the four chapters as scenes) over A/V tracks (Neda / Ashley / Dialogue / Music / Titles), transport + Split + zoom.

**Say:** "The toolbar adapts to whatever you've selected — clip tools, scene tools — and Underlord is always right there. Click it and it becomes the prompt, docked exactly where the mist chat lands. Underneath the conversation it's still a full editor — scenes, tracks, the works."

---

## Quick reference — triggers
- File upload: paperclip / drag onto the box on Chatty Home.
- Filler removal: `/` → "Remove filler words" (only this skill is wired; others are realistic no-ops).
- Plan mode: any prompt containing rearrange / reorder / restructure; then any reply revises; "Go" executes.
- Chapters: any prompt containing the word "chapters".
- Mist chat: press `/` anywhere outside the composer to summon the floating Underlord (separate from the sidebar chat).
- Contextual toolbar: bottom-center; tools change with canvas selection (clip vs scene); "Ask Underlord" expands it in place into the mist prompt at the dock.
