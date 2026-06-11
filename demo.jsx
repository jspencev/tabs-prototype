// demo.jsx — seeded project data + scripted "agent" beats for the guided rough-cut demo.
// All AI is faked: beats are triggered by skill selection / keywords / plan approval and
// run canned, timed responses. No real LLM, no media processing.

const DEMO = {
  projectTitle: "Neda Navab — Strategies to Elevate the Client Experience",
  fileName: "MM 3.2.26 _ Ashley Donat & Neda Navab.mp4",
  duration: "20:50",

  speakers: {
    "Neda Navab":  { initials: "NN", color: "linear-gradient(135deg,#d58c6a,#8b3a5a)" },
    "Ashley Donat":{ initials: "AD", color: "linear-gradient(135deg,#a3a3ee,#6f58bd)" },
  },

  // Real chapter names + timecodes captured from Underlord's own suggestions.
  chapters: [
    { name: "Big is Your Engine",    ts: "0:00" },
    { name: "Boutique is Your Edge", ts: "3:03" },
    { name: "Listing Resources",     ts: "8:31" },
    { name: "Open House Script",      ts: "12:49" },
  ],

  // Transcript paragraphs. A token is a string, or { f: "..." } for a filler word/false start.
  // chapterStart marks the first paragraph under each chapter.
  transcript: [
    { id: "p1", speaker: "Neda Navab", ts: "0:00", chapterStart: "Big is Your Engine", tokens: [
      "What I say is that Big is your engine, but being boutique is your edge. So what do I mean by Big is your engine? Being a part of Compass, which now, ",
      { f: "uh, " },
      "probably in all of your markets finally after years, has real credibility and name recognition — the thing that, in the living room, gives you authority with your clients." ] },
    { id: "p2", speaker: "Neda Navab", ts: "0:41", tokens: [
      "What do I mean by that? You can go on the app, sign them up for Compass One right there in the living room with a prospective buyer, ",
      { f: "you know, " },
      "have them download the app and say, \u201cI\u2019ve already added three PDFs into your Compass One that are tailored to you, Ashley.\u201d" ] },
    { id: "p3", speaker: "Neda Navab", ts: "1:20", tokens: [
      "You\u2019re a first-time buyer, so I have a PDF to explain all the closing costs. I also have a neighborhood guide because I know you\u2019re moving from the city to the suburbs. Whatever those things are that you typically, ",
      { f: "you know, " },
      "might remember to give \u2014 you might put it in a folder that gets lost in the back of an Uber, who knows?" ] },
    { id: "p4", speaker: "Neda Navab", ts: "2:05", tokens: [
      "Now, the professionalism of something like the Compass One app that you can leave with them, that they always know where to go back to \u2014 that\u2019s the power of Big. Reverse prospecting is the power of Big, ",
      { f: "right? " },
      "It lets you have more intentional conversations that result in time savings and quicker opportunities to get deals." ] },
    { id: "p5", speaker: "Neda Navab", ts: "2:40", tokens: [
      "Having Robert as the, ",
      { f: "you know, " },
      "the voice of real estate on CNBC and Bloomberg. It\u2019s the black-and-white yard signs in so many neighborhoods that give you that instant authority \u2014 that you are part of the best of the best." ] },
    { id: "p6", speaker: "Ashley Donat", ts: "3:03", chapterStart: "Boutique is Your Edge", tokens: [
      "Amazing. I\u2019m gonna ask our audience \u2014 put in the chat, what is your favorite component of Big? Is it the tech? Is it the brand? Is it the referral network?" ] },
    { id: "p7", speaker: "Neda Navab", ts: "3:35", tokens: [
      "For me it\u2019s the technology. I talk about it over ",
      { f: "and over " },
      "again, because it really is the thing that helps us all as real estate professionals and business owners get back more time in the day." ] },
    { id: "p8", speaker: "Neda Navab", ts: "4:10", tokens: [
      { f: "So, " },
      "boutique is your edge. At the end of the day it\u2019s why your clients hire you. Clients are not hiring Compass \u2014 Compass gives you credibility, but it is you who they seek out and hire." ] },
    { id: "p9", speaker: "Neda Navab", ts: "8:31", chapterStart: "Listing Resources", tokens: [
      "In my travels these last few weeks I\u2019ve seen agents leverage this authentically. ",
      { f: "Um, " },
      "Melissa Mayer from New England was on a panel saying she wants to be the authority on everything in her local neighborhood \u2014 so she attends the chamber of commerce meetings and the town hall gatherings." ] },
    { id: "p10", speaker: "Neda Navab", ts: "12:49", chapterStart: "Open House Script", tokens: [
      "She is the first to know what\u2019s happening in town \u2014 whether a new park is opening or ",
      { f: "s- the, the s- " },
      "school board is changing something. That is how you become the boutique expert your clients can\u2019t replace." ] },
  ],

  // Beat 3: a believable reordering (lead with the thesis, then proof, then tactics).
  rearrangedOrder: ["p8", "p1", "p7", "p6", "p2", "p3", "p4", "p5", "p9", "p10"],

  // Beat 3: plan-mode cards.
  plan: {
    initial: {
      title: "Plan — restructure into a tight client-experience story",
      steps: [
        "Open on the thesis: \u201cBig is your engine, boutique is your edge\u201d (move the boutique line up front).",
        "Follow with the tech proof point (more time back in your day).",
        "Bring Ashley\u2019s audience question in as the transition.",
        "Group the Compass One / listing-resources tactics together.",
        "Close on the Open House authority story (Melissa Mayer).",
      ],
    },
    revised: {
      title: "Updated plan — keep the audience question where it was",
      steps: [
        "Open on the thesis: \u201cBig is your engine, boutique is your edge.\u201d",
        "Follow with the tech proof point (more time back in your day).",
        "Keep Ashley\u2019s audience question in its original spot (not moved up).",
        "Group the Compass One / listing-resources tactics together.",
        "Close on the Open House authority story (Melissa Mayer).",
      ],
    },
  },

  // Beat 3 review: a faked before/after diff. Each key moment is one logical change
  // that knows its position in BOTH timelines, so it renders at different spots per view.
  // kind: move | delete | insert | modify. delete -> filled block in prev, marker in current.
  // insert -> marker in prev, filled block in current.
  reviewDiff: {
    durationSec: 1250,       // after / current timeline (20:50)
    prevDurationSec: 1310,   // before timeline (longer — implies removed content)
    afterRef: "a1b2c3d4e5f6",
    beforeRef: "9f8e7d6c5b4a",
    keyMoments: [
      { id: "m1", label: "Boutique thesis moved up", kind: "move",
        prev: { start: 250, end: 285 }, current: { start: 0, end: 35 },
        changes: [
          "Pulled the “boutique is your edge” thesis to the very top.",
          "Cut now opens on the core message instead of the Big setup.",
        ] },
      { id: "m2", label: "Title card added", kind: "insert",
        prev: { start: 250, end: 250 }, current: { start: 35, end: 47 },
        changes: [
          "Added a 12s title card introducing the thesis.",
          "New lower-third over the opening line.",
        ] },
      { id: "m3", label: "Intro aside deleted", kind: "delete",
        prev: { start: 41, end: 95 }, current: { start: 60, end: 60 },
        changes: [
          "Deleted a redundant intro aside (~54s).",
          "Removed the repeated “Big is your engine” setup.",
        ] },
      { id: "m4", label: "Compass One walkthrough tightened", kind: "modify",
        prev: { start: 360, end: 470 }, current: { start: 300, end: 395 },
        changes: [
          "Grouped the Compass One / listing-resources tactics together.",
          "Trimmed two “you know” asides mid-paragraph.",
        ] },
    ],
  },

  // Timeline model (seconds). Scenes from the chapters; pins are overlays
  // (lower-thirds = vector, b-roll = media, music = audio — the draggable hero);
  // script = the dialogue waveform + a representative wordbar.
  timeline: {
    durationSec: 1250,
    scenes: [
      { name: "Big is Your Engine",    startSec: 0,   durSec: 183 },
      { name: "Boutique is Your Edge", startSec: 183, durSec: 328 },
      { name: "Listing Resources",     startSec: 511, durSec: 258 },
      { name: "Open House Script",     startSec: 769, durSec: 481 },
    ],
    pins: [
      { id: "lt1",   kind: "vector", title: "LT: Neda Navab",       startSec: 8,   durSec: 44 },
      { id: "lt2",   kind: "vector", title: "LT: Ashley Donat",     startSec: 188, durSec: 34 },
      { id: "broll", kind: "media",  title: "B-roll — listing walk", startSec: 540, durSec: 150 },
      { id: "music", kind: "audio",  title: "Ambient bed — Loop 2",  startSec: 0,   durSec: 1000 },
    ],
    script: {
      segments: [
        { speaker: "Neda Navab",   startSec: 0,   durSec: 183 },
        { speaker: "Ashley Donat", startSec: 183, durSec: 32  },
        { speaker: "Neda Navab",   startSec: 215, durSec: 1035 },
      ],
      words: [
        { t: "What I say is",        startSec: 2,   durSec: 12 },
        { t: "Big is your engine",   startSec: 16,  durSec: 22 },
        { t: "boutique is your edge", startSec: 40, durSec: 24 },
        { t: "Compass One",          startSec: 80,  durSec: 26 },
        { t: "first-time buyer",     startSec: 120, durSec: 28 },
        { t: "the power of Big",     startSec: 170, durSec: 22 },
        { t: "the technology",       startSec: 220, durSec: 24 },
        { t: "Melissa Mayer",        startSec: 520, durSec: 30 },
        { t: "town hall gatherings", startSec: 560, durSec: 30 },
      ],
    },
  },

  // Stock library (canned Storyblocks-style results for the Media browser).
  stock: {
    videos: [
      { t: "City skyline timelapse",  d: "0:14" },
      { t: "Suburban street aerial",  d: "0:22" },
      { t: "Handshake close-up",      d: "0:09" },
      { t: "Modern kitchen pan",      d: "0:12" },
      { t: "Open house welcome",      d: "0:18" },
      { t: "Keys on the table",       d: "0:07" },
    ],
    images: [
      { t: "Craftsman exterior" },
      { t: "Living room staging" },
      { t: "Neighborhood park" },
      { t: "Coffee meeting" },
      { t: "For-sale sign" },
      { t: "Front porch detail" },
    ],
    music: [
      { t: "Ambient bed — Loop 2", d: "2:40" },
      { t: "Upbeat acoustic",      d: "3:05" },
      { t: "Soft piano focus",     d: "2:12" },
      { t: "Indie pop sting",      d: "0:32" },
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
    main: { id: "main", name: "Main video", duration: "20:50" },
    clipsFolder: "Clips from “Neda Navab”",
    clips: [
      { id: "clip1", name: "Big is your engine, boutique is your edge", duration: "0:38", startSec: 16 },
      { id: "clip2", name: "Compass One in the living room",            duration: "0:52", startSec: 80 },
      { id: "clip3", name: "Clients hire you, not Compass",             duration: "0:41", startSec: 248 },
      { id: "clip4", name: "Become the boutique expert",                duration: "0:47", startSec: 769 },
    ],
  },

  // The "/" skills menu. `fn` entries are wired; the rest are decorative.
  skills: [
    { label: "Remove filler words", fn: "fillers" },
    { label: "Create clips", fn: "clips" },
    { label: "Studio Sound" },
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
