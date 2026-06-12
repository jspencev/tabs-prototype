// demo.jsx — seeded project data + scripted "agent" beats for the guided rough-cut demo.
// All AI is faked: beats are triggered by skill selection / keywords / plan approval and
// run canned, timed responses. No real LLM, no media processing.
// Content borrowed from Jovo's NUI prototype ("AI for Product Marketing") — internal
// asset, safe to show in user testing.

const DEMO = {
  projectTitle: "AI for Product Marketing",
  fileName: "AI for Product Marketing.mov",
  duration: "12:24",

  speakers: {
    "Jordan": { initials: "JM", color: "linear-gradient(135deg,#6a8dd5,#3a558b)" },
  },

  chapters: [
    { name: "Introduction",                  ts: "0:00" },
    { name: "Competitive Research",          ts: "0:58" },
    { name: "Customer & Persona Research",   ts: "2:32" },
    { name: "Messaging & Positioning",       ts: "4:55" },
    { name: "Launch Planning & GTM",         ts: "6:30" },
    { name: "Content Creation & Enablement", ts: "7:58" },
    { name: "Analytics & Performance",       ts: "10:10" },
    { name: "Wrap-Up",                       ts: "11:06" },
  ],

  // Transcript paragraphs. A token is a string, or { f: "..." } for a filler word/false start.
  // chapterStart marks the first paragraph under each chapter.
  transcript: [
    { id: "p1", speaker: "Jordan", ts: "0:00", chapterStart: "Introduction", tokens: [
      { f: "Um, " },
      "hey everyone. Welcome. ",
      { f: "Uh, " },
      "thanks for joining me today. My name is Jordan, and I\u2019m a product marketer at a fast-moving tech company. And today I want to talk about something that has genuinely changed the way I work over the past year: using AI to become a more effective tech product marketer." ] },
    { id: "p2", speaker: "Jordan", ts: "0:38", tokens: [
      "I use it every single day now, and I honestly don\u2019t know how I\u2019d keep up without it. Let\u2019s get into it." ] },
    { id: "p3", speaker: "Jordan", ts: "0:58", chapterStart: "Competitive Research", tokens: [
      "The first area where AI has made a massive difference is competitive research. As a product marketer, you\u2019re expected to know your competitive landscape cold. And, ",
      { f: "uh, " },
      "that used to take hours every week. Reading blog posts, scanning press releases, digging through G2 reviews." ] },
    { id: "p4", speaker: "Jordan", ts: "1:50", tokens: [
      "Now I paste in a competitor\u2019s website copy or their latest press release, ask AI to summarize their positioning, flag their weaknesses, and identify target personas. What used to take three or four hours I can now do in under an hour." ] },
    { id: "p5", speaker: "Jordan", ts: "2:32", chapterStart: "Customer & Persona Research", tokens: [
      "The second area is customer and persona research. ",
      { f: "Um, " },
      "one of the hardest things in product marketing is deeply understanding your buyer. What language do they use? What keeps them up at night? What does success look like in their role?" ] },
    { id: "p6", speaker: "Jordan", ts: "3:18", tokens: [
      "I take transcripts from customer interviews, sales calls, and support tickets, and I feed them to AI to extract recurring themes and pull out exact phrases customers use. That last part is huge for copywriting. When your messaging uses your customer\u2019s own words, everything lands better." ] },
    { id: "p7", speaker: "Jordan", ts: "4:05", tokens: [
      "I\u2019ve also started using AI to stress-test personas. I describe a persona and ask the AI what objections they\u2019d raise, what would make them skeptical, what they\u2019d need before taking a meeting. It\u2019s like having a sparring partner who\u2019s read every B2B buyer study ever written." ] },
    { id: "p8", speaker: "Jordan", ts: "4:55", chapterStart: "Messaging & Positioning", tokens: [
      "Okay, third area: messaging and positioning. AI is a fantastic thought partner here, but, ",
      { f: "you know, " },
      "the key is bringing real context. I don\u2019t just say write me a tagline. That produces generic garbage. Instead, I give it the product, the persona, the competition, the key differentiators, and ask for five or six positioning angles targeting different emotional drivers." ] },
    { id: "p9", speaker: "Jordan", ts: "5:48", tokens: [
      "Reacting to a set of options is faster than creating from scratch, and I end up with sharper positioning in a fraction of the time. The AI acts like a well-read editor throughout the whole messaging process." ] },
    { id: "p10", speaker: "Jordan", ts: "6:30", chapterStart: "Launch Planning & GTM", tokens: [
      "Fourth area: launch planning and go-to-market strategy. I use AI to pressure-test GTM plans. Right channels, sequencing, key risks, success metrics. ",
      { f: "Um, " },
      "it doesn\u2019t replace strategic thinking, but it surfaces blind spots and asks clarifying questions in ways that push me to think more rigorously." ] },
    { id: "p11", speaker: "Jordan", ts: "7:25", tokens: [
      "Launch calendars, stakeholder briefing docs, creative briefs. AI takes a lot of that scaffolding off my plate." ] },
    { id: "p12", speaker: "Jordan", ts: "7:58", chapterStart: "Content Creation & Enablement", tokens: [
      "Fifth area: content creation and sales enablement. Blog posts, battlecards, email sequences, LinkedIn content. AI helps with all of it. But the best results come when I bring real substance and use AI to shape it, not when I ask it to write from scratch." ] },
    { id: "p13", speaker: "Jordan", ts: "8:46", tokens: [
      "My workflow is: I do the thinking first. I jot down the key points, the stories, the data. Then I use AI to structure it, smooth the prose, and repurpose it for different formats. A long-form post becomes a LinkedIn thread becomes a sales email. That repurposing is where AI saves me the most time." ] },
    { id: "p14", speaker: "Jordan", ts: "9:35", tokens: [
      { f: "Ah, " },
      "and sales enablement specifically. Writing battlecards is tedious. Feed AI your product strengths, competitor weaknesses, and win-loss patterns, and you\u2019ve got a solid first draft in minutes." ] },
    { id: "p15", speaker: "Jordan", ts: "10:10", chapterStart: "Analytics & Performance", tokens: [
      "Sixth, and final area: analytics and performance. I\u2019m not a data analyst. I can pull numbers, but I don\u2019t always know what story they\u2019re telling. I paste campaign performance data into AI and ask: what patterns do you see here? What explains this drop in conversion? What would you test to improve it? It consistently surfaces hypotheses I wouldn\u2019t have found on my own." ] },
    { id: "p16", speaker: "Jordan", ts: "11:06", chapterStart: "Wrap-Up", tokens: [
      "Okay, let me bring it together. ",
      { f: "Um, " },
      "AI isn\u2019t replacing product marketers. What it\u2019s doing is eliminating the slow, grind-y parts of the job so you can spend more time on things that actually require judgment. Building relationships with customers, making strategic bets, crafting a point of view that\u2019s genuinely differentiated." ] },
    { id: "p17", speaker: "Jordan", ts: "11:48", tokens: [
      "The marketers I see struggling are spending forty hours on things that could take fifteen. The ones thriving have learned to collaborate with these tools. So if you\u2019re not already experimenting, start small. Pick one workflow. Try it. You might be surprised." ] },
    { id: "p18", speaker: "Jordan", ts: "12:10", tokens: [
      "Alright, that\u2019s it from me. Thanks for watching, and, ",
      { f: "uh, " },
      "I\u2019ll see you in the next one." ] },
  ],

  // Beat 3: a believable reordering (lead with the payoff, then proof, then tactics).
  rearrangedOrder: ["p16", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p12", "p13", "p14", "p10", "p11", "p15", "p17", "p18"],

  // Beat 3: plan-mode cards.
  plan: {
    initial: {
      title: "Plan — restructure into a payoff-first story",
      steps: [
        "Open on the payoff: AI removes the grind so marketers can focus on judgment (move the wrap-up thesis up front).",
        "Follow with Jordan\u2019s intro and the daily-use hook.",
        "Group the research sections (competitive + persona) back-to-back.",
        "Move content creation & enablement ahead of launch planning (stronger examples first).",
        "Close on the call to action: start small, pick one workflow.",
      ],
    },
    revised: {
      title: "Updated plan — keep launch planning where it was",
      steps: [
        "Open on the payoff: AI removes the grind so marketers can focus on judgment.",
        "Follow with Jordan\u2019s intro and the daily-use hook.",
        "Group the research sections (competitive + persona) back-to-back.",
        "Keep launch planning in its original spot (not moved down).",
        "Close on the call to action: start small, pick one workflow.",
      ],
    },
  },

  // Beat 3 review: a faked before/after diff. Each key moment is one logical change
  // that knows its position in BOTH timelines, so it renders at different spots per view.
  // kind: move | delete | insert | modify. delete -> filled block in prev, marker in current.
  // insert -> marker in prev, filled block in current.
  reviewDiff: {
    durationSec: 744,        // after / current timeline (12:24)
    prevDurationSec: 790,    // before timeline (longer — implies removed content)
    afterRef: "a1b2c3d4e5f6",
    beforeRef: "9f8e7d6c5b4a",
    keyMoments: [
      { id: "m1", label: "Payoff thesis moved up", kind: "move",
        prev: { start: 666, end: 700 }, current: { start: 0, end: 34 },
        changes: [
          "Pulled the “AI isn’t replacing product marketers” payoff to the very top.",
          "Cut now opens on the core message instead of the welcome.",
        ] },
      { id: "m2", label: "Title card added", kind: "insert",
        prev: { start: 666, end: 666 }, current: { start: 34, end: 46 },
        changes: [
          "Added a 12s title card introducing the thesis.",
          "New lower-third over the opening line.",
        ] },
      { id: "m3", label: "Rambling welcome trimmed", kind: "delete",
        prev: { start: 30, end: 76 }, current: { start: 58, end: 58 },
        changes: [
          "Deleted the repeated welcome and setup (~46s).",
          "Removed the “thanks for joining” preamble.",
        ] },
      { id: "m4", label: "Research sections grouped", kind: "modify",
        prev: { start: 58, end: 290 }, current: { start: 100, end: 305 },
        changes: [
          "Grouped competitive and persona research back-to-back.",
          "Trimmed two asides mid-paragraph.",
        ] },
    ],
  },

  // Timeline model (seconds). Scenes from the chapters; pins are overlays
  // (lower-thirds = vector, b-roll = media, music = audio — the draggable hero);
  // script = the dialogue waveform + a representative wordbar.
  timeline: {
    durationSec: 744,
    scenes: [
      { name: "Introduction",                  startSec: 0,   durSec: 58 },
      { name: "Competitive Research",          startSec: 58,  durSec: 94 },
      { name: "Customer & Persona Research",   startSec: 152, durSec: 143 },
      { name: "Messaging & Positioning",       startSec: 295, durSec: 95 },
      { name: "Launch Planning & GTM",         startSec: 390, durSec: 88 },
      { name: "Content Creation & Enablement", startSec: 478, durSec: 132 },
      { name: "Analytics & Performance",       startSec: 610, durSec: 56 },
      { name: "Wrap-Up",                       startSec: 666, durSec: 78 },
    ],
    pins: [
      { id: "lt1",   kind: "vector", title: "LT: Jordan",              startSec: 6,   durSec: 30 },
      { id: "broll", kind: "media",  title: "B-roll — workspace typing", startSec: 480, durSec: 90 },
      // The music bed lands offset from the start on purpose: the timeline task
      // is dragging it back so it begins with the intro.
      { id: "music", kind: "audio",  title: "Upbeat acoustic — bed",   startSec: 90,  durSec: 560 },
    ],
    script: {
      segments: [
        { speaker: "Jordan", startSec: 0, durSec: 744 },
      ],
      words: [
        { t: "hey everyone",            startSec: 2,   durSec: 9 },
        { t: "My name is Jordan",       startSec: 14,  durSec: 11 },
        { t: "competitive research",    startSec: 62,  durSec: 16 },
        { t: "under an hour",           startSec: 132, durSec: 13 },
        { t: "customer\u2019s own words", startSec: 205, durSec: 16 },
        { t: "messaging and positioning", startSec: 300, durSec: 18 },
        { t: "go-to-market",            startSec: 396, durSec: 14 },
        { t: "battlecards",             startSec: 580, durSec: 12 },
        { t: "start small",             startSec: 700, durSec: 11 },
      ],
    },
  },

  // Stock library (canned Storyblocks-style results for the Media browser).
  stock: {
    videos: [
      { t: "Team brainstorm timelapse",  d: "0:14" },
      { t: "Laptop dashboard close-up",  d: "0:11" },
      { t: "Whiteboard sprint planning", d: "0:18" },
      { t: "Office walkthrough",         d: "0:22" },
      { t: "Typing close-up",            d: "0:08" },
      { t: "City commute aerial",        d: "0:15" },
    ],
    images: [
      { t: "Startup office" },
      { t: "Sticky-note wall" },
      { t: "Analytics dashboard" },
      { t: "Podcast setup" },
      { t: "Team standup" },
      { t: "Product mockups" },
    ],
    music: [
      { t: "Upbeat acoustic — bed", d: "2:40" },
      { t: "Ambient bed — Loop 2",  d: "3:05" },
      { t: "Soft piano focus",      d: "2:12" },
      { t: "Indie pop sting",       d: "0:32" },
    ],
    sfx: [
      { t: "Door open",        d: "0:02" },
      { t: "Camera shutter",   d: "0:01" },
      { t: "Notification pop", d: "0:01" },
      { t: "Crowd ambience",   d: "0:45" },
    ],
  },

  // Compositions: the main video plus the clips "Create clips" produces. Clips
  // open as their own tabs (the tabbed answer to Descript's composition switcher).
  compositions: {
    main: { id: "main", name: "Main video", duration: "12:24" },
    clipsFolder: "Clips from “AI for Product Marketing”",
    clips: [
      { id: "clip1", name: "AI changed how I work",                  duration: "0:32", startSec: 20 },
      { id: "clip2", name: "Competitive research in under an hour",  duration: "0:41", startSec: 110 },
      { id: "clip3", name: "Use your customer\u2019s own words",      duration: "0:38", startSec: 210 },
      { id: "clip4", name: "Forty hours vs. fifteen",                duration: "0:45", startSec: 690 },
    ],
  },

  // The "/" skills menu. `fn` entries are wired; the rest are decorative.
  skills: [
    { label: "Remove filler words", fn: "fillers" },
    { label: "Create clips", fn: "clips" },
    { label: "Studio Sound", fn: "studioSound" },
    { label: "Remove retakes" },
    { label: "Edit for clarity" },
    { label: "Eye Contact" },
    { label: "Center active speaker" },
    { label: "Add chapters" },
    { label: "Shorten word gaps" },
    { label: "Draft show notes" },
  ],
};

window.DEMO = DEMO;
