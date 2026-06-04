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

  // Beat 2: the "/" skills menu. Only `fn:"fillers"` is wired; the rest are decorative.
  skills: [
    { label: "Remove filler words", fn: "fillers" },
    { label: "Studio Sound" },
    { label: "Remove retakes" },
    { label: "Edit for clarity" },
    { label: "Eye Contact" },
    { label: "Center active speaker" },
    { label: "Create clips" },
    { label: "Add chapters" },
    { label: "Shorten word gaps" },
    { label: "Draft show notes" },
  ],
};

window.DEMO = DEMO;
