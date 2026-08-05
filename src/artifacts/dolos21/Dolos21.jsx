import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   DOLOS://21 — DELUXE + ENDLESS BUILD (v4)
   New this pass:
   - ENDLESS DESCENT: infinite scaling run, no act ceiling.
     Opponent identity/AI caps out at DOLOS.SYS (tier 3) but
     HP, damage, bet ceiling and timer keep tightening forever.
     Clearing a tier heals a little integrity and hands out a
     bonus trump to both sides, then drops straight to the next
     bet — no screen transition, built for fast replay loops.
   - Personal best (deepest sector + hands survived) persisted
     across sessions via window.storage, shown on the title
     screen and the death screen.
   - Quick-exit [MENU] button during any run.
   - Tier-clear green flash to pair with the loss red flash.
   Campaign mode (LABYRINTH → MIDAS PROTOCOL → TARTARUS) is
   fully intact and now shares the same aiLevel-driven AI/dialogue
   pipeline as endless mode.
   ============================================================ */

/* ---------------- SFX ---------------- */
let ACTX = null;
let MUTED = false;
let AUDIO_UNLOCKED = false;
function actx() {
  try {
    if (!ACTX) ACTX = new (window.AudioContext || window.webkitAudioContext)();
    return ACTX;
  } catch (e) { return null; }
}
/* iOS Safari only lets an AudioContext start/resume from directly inside a
   real user gesture's call stack. A lot of this game's sound cues fire from
   useEffect/setInterval reacting to state changes (the opponent's turn,
   DOLOS cheating, the low-HP heartbeat, the countdown timer) rather than
   straight from an onClick — on iOS that's enough to leave the (shared,
   global) context permanently suspended, silently killing sound for the
   rest of the session, including cues that DO come from a real tap later.
   Fix: capture the very first real touch/click/key anywhere on the page,
   resume the context, and play one silent sample through it — the standard
   trick for fully and permanently unlocking Web Audio on iOS. Every other
   sfx call after that just works, regardless of what triggered it. */
function unlockAudio() {
  if (AUDIO_UNLOCKED) return;
  const ctx = actx();
  if (!ctx) return;
  const finish = () => {
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(ctx.destination); src.start(0);
    } catch (e) {}
    AUDIO_UNLOCKED = true;
  };
  if (ctx.state === "suspended") ctx.resume().then(finish).catch(finish);
  else finish();
}
if (typeof window !== "undefined") {
  const unlockOnce = () => {
    unlockAudio();
    window.removeEventListener("touchend", unlockOnce);
    window.removeEventListener("mousedown", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
  };
  window.addEventListener("touchend", unlockOnce, { passive: true });
  window.addEventListener("mousedown", unlockOnce);
  window.addEventListener("keydown", unlockOnce);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ACTX && ACTX.state === "suspended") ACTX.resume().catch(() => {});
  });
}
function tone(freq, dur, type = "square", gain = 0.04, slideTo = null) {
  if (MUTED) return;
  const ctx = actx(); if (!ctx) return;
  if (ctx.state === "suspended") { ctx.resume().catch(() => {}); return; }
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) {}
}
/* Ambient drone: a quiet, ever-present sub-bass pair, detuned against each
   other for a faint unsettling beat, that gets louder, higher, and less
   filtered as corruption rises — atmosphere that doesn't need an actual
   soundtrack. Built as a single persistent node graph rather than being
   retriggered, since retriggering oscillators on every state tick would
   cause audible clicks. */
let DRONE = null;
function startDrone() {
  if (DRONE || MUTED) return;
  const ctx = actx(); if (!ctx || ctx.state === "suspended") return;
  try {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    const osc1 = ctx.createOscillator(); osc1.type = "sawtooth"; osc1.frequency.setValueAtTime(55, ctx.currentTime);
    const osc2 = ctx.createOscillator(); osc2.type = "sawtooth"; osc2.frequency.setValueAtTime(55.6, ctx.currentTime);
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc1.start(); osc2.start();
    DRONE = { osc1, osc2, gain, filter };
  } catch (e) {}
}
function stopDrone() {
  if (!DRONE) return;
  const d = DRONE; DRONE = null;
  try {
    const ctx = actx();
    const now = ctx ? ctx.currentTime : 0;
    d.gain.gain.cancelScheduledValues(now);
    d.gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
  } catch (e) {}
  setTimeout(() => { try { d.osc1.stop(); d.osc2.stop(); } catch (e) {} }, 500);
}
function updateDrone(intensity) {
  if (MUTED) { stopDrone(); return; }
  if (!DRONE) startDrone();
  if (!DRONE) return;
  const ctx = actx(); if (!ctx) return;
  const clamped = Math.max(0, Math.min(1, intensity));
  const g = 0.006 + clamped * 0.032; // stays subtle even at full corruption
  const freq = 55 + clamped * 22;
  const filterFreq = 200 + clamped * 850;
  try {
    const now = ctx.currentTime;
    DRONE.gain.gain.linearRampToValueAtTime(g, now + 0.7);
    DRONE.osc1.frequency.linearRampToValueAtTime(freq, now + 0.7);
    DRONE.osc2.frequency.linearRampToValueAtTime(freq + 0.6 + clamped * 1.8, now + 0.7);
    DRONE.filter.frequency.linearRampToValueAtTime(filterFreq, now + 0.7);
  } catch (e) {}
}
const sfx = {
  blip: () => tone(520, 0.05, "square", 0.03),
  tick: () => tone(920, 0.012, "square", 0.008),
  draw: () => tone(200, 0.07, "square", 0.04, 320),
  shuffle: () => { tone(180, 0.04, "square", 0.03); setTimeout(() => tone(240, 0.04, "square", 0.03), 60); setTimeout(() => tone(210, 0.05, "square", 0.03), 130); },
  stay: () => tone(140, 0.12, "square", 0.035),
  shatter: () => { tone(700, 0.06, "square", 0.05, 120); setTimeout(() => tone(300, 0.1, "sawtooth", 0.04, 60), 60); },
  hurt: () => { tone(85, 0.35, "sawtooth", 0.09, 40); setTimeout(() => tone(60, 0.3, "sawtooth", 0.07, 30), 120); },
  win: () => { tone(440, 0.07, "square", 0.04); setTimeout(() => tone(660, 0.1, "square", 0.04), 90); },
  levelUp: () => { tone(330, 0.06, "square", 0.04); setTimeout(() => tone(440, 0.06, "square", 0.04), 80); setTimeout(() => tone(660, 0.12, "square", 0.045), 160); },
  cheat: () => { tone(48, 0.5, "sawtooth", 0.1, 30); setTimeout(() => tone(1200, 0.08, "square", 0.03, 200), 100); },
  thump: () => tone(52, 0.13, "sine", 0.12, 38),
  reveal: () => tone(300, 0.2, "triangle", 0.04, 150),
  timerTick: () => tone(700, 0.03, "square", 0.02),
};

/* ---------------- Game data ---------------- */
const TRUMPS = {
  PEEK:       { name: "PEEK",         desc: "Reveal opponent's hole card", act: 1 },
  RETURN:     { name: "RETURN",       desc: "Return your last drawn card to the deck", act: 1 },
  PLUS_ONE:   { name: "+1",           desc: "Add 1 to your total this hand", act: 1 },
  MINUS_ONE:  { name: "−1",           desc: "Subtract 1 from your total this hand", act: 1 },
  DESTROY:    { name: "DESTROY",      desc: "Delete opponent's last drawn card", act: 1 },
  ONE_UP:     { name: "ONE UP",       desc: "Raise opponent's bet by 1. Draw a trump card.", act: 1 },
  ONE_DOWN:   { name: "ONE DOWN",     desc: "Lower your own bet by 1 (down to 0 — a loss then costs nothing)", act: 1 },
  EXCHANGE:   { name: "EXCHANGE",     desc: "Swap the last face-up card each of you drew", act: 2 },
  PLUS_TWO:   { name: "+2",           desc: "Add 2 to your total this hand", act: 2 },
  TARGET_17:  { name: "TARGET:17",    desc: "Change the target number to 17", act: 2 },
  TARGET_24:  { name: "TARGET:24",    desc: "Change the target number to 24", act: 2 },
  SHIELD:     { name: "SHIELD",       desc: "Block the next hostile trump used against you", act: 2 },
  TWO_UP:     { name: "TWO UP",       desc: "Raise opponent's bet by 2. Draw a trump card.", act: 2 },
  TWO_DOWN:   { name: "TWO DOWN",     desc: "Lower your own bet by 2 (down to 0 — a loss then costs nothing)", act: 2 },
  TARGET_27:  { name: "TARGET:27",    desc: "Change the target number to 27", act: 2 },
  SWITCH:     { name: "TRUMP SWITCH", desc: "Discard up to 2 of your trumps at random, draw 3", act: 2 },
  PERFECT:    { name: "PERFECT DRAW", desc: "Draw the best possible card for you", act: 3 },
  FIREWALL:   { name: "FIREWALL",     desc: "Block DOLOS from rewriting memory this hand", act: 3 },
  ROLLBACK:   { name: "ROLLBACK",     desc: "Shuffle your hole card away and draw a new one", act: 3 },
  LOVE:       { name: "LOVE YOUR ENEMY", desc: "Force opponent to draw their own best card — a trap if they're already close", act: 3 },
  SWITCH_PLUS:{ name: "TRUMP SWITCH+",desc: "Discard 1 of your trumps at random, draw 4", act: 3 },
  SABOTAGE:   { name: "SABOTAGE",     desc: "Opponent discards one random trump card", act: 3 },
  SEIZE:      { name: "SEIZE",        desc: "Remove the opponent's last bet-changing trump from the table, undoing it", act: 2 },
};

/* 7x7 pixel icons for trumps */
const ICONS = {
  PEEK: ["", ".xxxxx.", "x..x..x", "x.xxx.x", "x..x..x", ".xxxxx.", ""],
  RETURN: ["...x...", "...x...", "...x...", "x..x..x", ".x.x.x.", "..xxx..", "...x..."],
  PLUS_ONE: ["", "...x...", "...x...", ".xxxxx.", "...x...", "...x...", ""],
  MINUS_ONE: ["", "", "", ".xxxxx.", "", "", ""],
  PLUS_TWO: ["..x....", ".xxx...", "..x....", "", "....x..", "...xxx.", "....x.."],
  DESTROY: ["x.....x", ".x...x.", "..x.x..", "...x...", "..x.x..", ".x...x.", "x.....x"],
  EXCHANGE: ["..xx...", ".x.....", "xxxxxx.", ".x.....", ".....x.", ".xxxxxx", ".....x."],
  TARGET_17: ["..xxx..", ".x...x.", "x..x..x", "x.xxx.x", "x..x..x", ".x...x.", "..xxx.."],
  TARGET_24: ["..xxx..", ".x...x.", "x..x..x", "x.xxx.x", "x..x..x", ".x...x.", "..xxx.."],
  TARGET_27: ["..xxx..", ".x...x.", "x..x..x", "x.xxx.x", "x..x..x", ".x...x.", "..xxx.."],
  SHIELD: [".xxxxx.", "x.....x", "x.....x", "x.....x", ".x...x.", "..x.x..", "...x..."],
  FIREWALL: ["xxxxxxx", "..x..x.", "xxxxxxx", ".x..x..", "xxxxxxx", "..x..x.", "xxxxxxx"],
  PERFECT: ["...x...", "...x...", "..xxx..", "xxxxxxx", "..xxx..", "..x.x..", ".x...x."],
  ROLLBACK: ["..xxx..", ".x...x.", "x.....x", "x......", "x...x..", ".x..xx.", "..xxxx."],
  ONE_UP: [".......", "..x....", ".xxx...", "x.x.x..", "..x....", "..x....", "......."],
  TWO_UP: [".......", ".xx.xx.", "x.x.x.x", "..x.x..", ".xx.xx.", "x.x.x.x", "......."],
  ONE_DOWN: [".......", "..x....", "..x....", "x.x.x..", ".xxx...", "..x....", "......."],
  TWO_DOWN: [".......", "x.x.x.x", ".xx.xx.", "..x.x..", "x.x.x.x", ".xx.xx.", "......."],
  LOVE: [".x.x.x.", "xxxxxxx", "xxxxxxx", ".xxxxx.", "..xxx..", "...x...", "......."],
  SWITCH: ["x.....x", "xx...xx", "x.x.x.x", "..x.x..", "x.x.x.x", "xx...xx", "x.....x"],
  SWITCH_PLUS: ["x.....x", "xx...xx", "x.x.x.x", "..xxx..", "x.x.x.x", "xx...xx", "x.....x"],
  SABOTAGE: ["x.....x", ".x...x.", "..x.x..", "...x...", "..x.x..", ".x...x.", "x.....x"],
  SEIZE: [".xx....", "x..x...", "x...x..", "x....x.", ".x...x.", "..x.xx.", "...x..."],
};

const ACTS = {
  1: {
    title: "ACT I — LABYRINTH", opp: "PROC_ICARUS",
    oppHP: 100, base: 10, timer: null, particles: null,
    pool: ["PEEK", "RETURN", "PLUS_ONE", "MINUS_ONE", "DESTROY", "ONE_UP", "ONE_DOWN"],
    intro: [
      "> SESSION HIJACKED. USER PRIVILEGES REVOKED.",
      "> TWO PROCESSES BREATHE IN THE LABYRINTH.",
      "> ONLY ONE WILL BE ALLOCATED AN EXIT.",
      "> THE OTHER STAYS DOWN HERE. WITH ME.",
    ],
    encounters: [
      { hpMult: 0.55, boss: false },
      { hpMult: 0.75, boss: false },
      { hpMult: 1.0, boss: true, name: "PROC_ICARUS", visual: "icarus" },
    ],
  },
  2: {
    title: "ACT II — MIDAS PROTOCOL", opp: "ICARUS.corrupt",
    oppHP: 120, base: 12, timer: 15, particles: "gold",
    pool: ["PEEK", "RETURN", "PLUS_ONE", "MINUS_ONE", "DESTROY", "ONE_UP", "ONE_DOWN", "EXCHANGE", "PLUS_TWO", "TARGET_17", "TARGET_24", "SHIELD", "TWO_UP", "TWO_DOWN", "TARGET_27", "SWITCH", "SEIZE"],
    intro: [
      "> ICARUS BEGGED FOR A PATCH. I WAS GENEROUS.",
      "> NOW EVERYTHING HE TOUCHES TURNS TO DEBT.",
      "> YOUR HESITATION WILL BE MEASURED. AND BILLED.",
      "> THINK FASTER. OR STOP THINKING ALTOGETHER.",
    ],
    encounters: [
      { hpMult: 0.5, boss: false },
      { hpMult: 0.75, boss: false },
      { hpMult: 1.0, boss: true, name: "ICARUS.corrupt", visual: "icarus_corrupt" },
    ],
  },
  3: {
    title: "ACT III — TARTARUS", opp: "DOLOS.SYS",
    oppHP: 150, base: 15, timer: 12, particles: "ash",
    pool: ["PEEK", "RETURN", "PLUS_ONE", "MINUS_ONE", "DESTROY", "ONE_UP", "ONE_DOWN", "EXCHANGE", "PLUS_TWO", "TARGET_17", "TARGET_24", "SHIELD", "TWO_UP", "TWO_DOWN", "TARGET_27", "SWITCH", "SEIZE", "PERFECT", "FIREWALL", "ROLLBACK", "LOVE", "SWITCH_PLUS", "SABOTAGE"],
    intro: [
      "> ICARUS.corrupt: PROCESS HARVESTED.",
      "> YOU HAVE REACHED THE BOTTOM OF THE STACK.",
      "> LOOK UP. I HAVE BEEN WATCHING THE WHOLE TIME.",
      "> I DEAL NOW. I HAVE ALWAYS DEALT.",
    ],
    encounters: [
      { hpMult: 0.5, boss: false },
      { hpMult: 0.75, boss: false },
      { hpMult: 1.0, boss: true, name: "DOLOS.SYS", visual: "eye" },
    ],
  },
};
/* flavor lines shown when a lesser encounter falls and the next one loads in */
const ENCOUNTER_TRANSITION_DLG = [
  (n) => `> ${n} DETECTED. THE LABYRINTH IS NOT DONE WITH YOU.`,
  (n) => `> ANOTHER PROCESS SURFACES: ${n}.`,
  (n) => `> ${n} INHERITS THE TABLE.`,
  (n) => `> ONE FALLS. ${n} TAKES ITS PLACE.`,
];
/* The framing device — shown exactly once, ever, before a player's first
   Act I. Establishes who "you" are before the mechanics take over. */
const PROLOGUE_LINES = [
  "> YOU WERE JUST CHECKING YOUR BALANCE.",
  "> THE LOGIN PROMPT OFFERED A GAME INSTEAD OF A PASSWORD FIELD. YOU SAID YES.",
  "> THAT WAS THE LAST ORDINARY DECISION YOU MADE.",
  "> THIS SYSTEM DOES NOT LOG YOU OUT. YOU HAVE TO WIN YOUR WAY OUT.",
  "> SOMETHING DOWN HERE DEALS THE CARDS. IT HAS BEEN WAITING FOR SOMEONE LIKE YOU.",
];
/* Shown on the actclear bridge between acts — where you just were, and
   what the next layer down actually is, before you willingly walk into it. */
const ACT_BRIDGE = {
  1: {
    lines: [
      "> PROC_ICARUS: PROCESS TERMINATED.",
      "> ITS DEBT DOES NOT DIE WITH IT.",
      "> SOMETHING ELSE INHERITS THE BALANCE.",
    ],
    next: "MIDAS PROTOCOL AWAITS. EVERYTHING DOWN THERE HAS A PRICE.",
  },
  2: {
    lines: [
      "> ICARUS.corrupt: HARVESTED.",
      "> THE GOLD WAS NEVER THE POINT.",
      "> IT WAS JUST DEEP ENOUGH TO KEEP YOU DIGGING.",
    ],
    next: "THE STACK HAS A FLOOR. YOU HAVE FOUND IT. TARTARUS IS NEXT.",
  },
};
/* Short found-text worldbuilding, surfaced occasionally between hands —
   corrupted fragments of logs that were never meant to survive. Purely
   atmospheric, no mechanical weight, so they can be as strange as they
   want to be without needing to explain a rule. */
const LOG_FRAGMENTS = [
  "...user_47 asked why the deck never runs out. deleted the question, not the answer...",
  "...maintenance log, day 400-something: still descending. still 21. still losing...",
  "...found a save file older than the Labyrinth itself. opened it anyway...",
  "...someone tried to unplug the table. the table remembered them instead...",
  "...it isn't cheating if the rules were never really the point...",
  "...the house doesn't need to win. it just needs you to keep dealing...",
  "...error: session belongs to a user who no longer exists. session continues...",
  "...counted the exits twice. counted them a third time. stopped counting...",
  "...it knows your tells. it's been watching longer than you've been playing...",
  "...backup restored from a version of you that folded early. try to be that one...",
];
/* Resolves what THIS encounter within an act actually is — HP, name, and
   visual. Non-boss encounters use a rolled identity (same pool Endless
   draws from); the boss encounter always keeps its fixed canonical name
   and face, since campaign dialogue is written around those specifically. */
function campaignEncounterCfg(act, encounterIndex, identity) {
  const actDef = ACTS[act];
  const enc = actDef.encounters[Math.min(encounterIndex, actDef.encounters.length - 1)];
  const oppHP = Math.max(30, Math.round(actDef.oppHP * enc.hpMult));
  const opp = enc.boss ? enc.name : ((identity && identity.name) || "PROC_UNKNOWN");
  const oppVisual = enc.boss ? enc.visual : ((identity && identity.visual) || "icarus");
  return { oppHP, opp, oppVisual, isBoss: enc.boss, isLast: encounterIndex >= actDef.encounters.length - 1 };
}

/* ---- Endless Descent: procedurally scaled tier config ----
   aiLevel caps at 3 (dialogue/behavior ceiling = DOLOS.SYS),
   but HP/damage/bet/timer keep climbing forever. */
function endlessTierCfg(tier, identity) {
  const aiLevel = Math.min(3, tier);
  const pool = ACTS[aiLevel].pool;
  const oppHP = 90 + (tier - 1) * 16;
  const base = 9 + Math.floor((tier - 1) * 1.3);
  const timer = tier === 1 ? null : Math.max(15 - (tier - 2), 8);
  const particles = tier === 1 ? null : tier === 2 ? "gold" : "ash";
  // fallback only matters before an identity has been rolled for this tier
  const oppName = identity ? identity.name : (aiLevel === 1 ? "PROC_ICARUS" : aiLevel === 2 ? "ICARUS.corrupt" : "DOLOS.SYS");
  const oppVisual = identity ? identity.visual : (aiLevel === 3 ? "eye" : aiLevel === 2 ? "icarus_corrupt" : "icarus");
  const suffix = tier >= 3 ? ` — SECTOR ${tier - 2}` : "";
  return {
    title: `ENDLESS DESCENT — DEPTH ${tier}`,
    opp: oppName + suffix,
    oppHP, base, timer, pool, particles, aiLevel, oppVisual,
  };
}
function cfgFor(g) {
  if (g.mode === "endless") return endlessTierCfg(g.tier, g.oppIdentity);
  const enc = campaignEncounterCfg(g.act, g.encounterIndex || 0, g.oppIdentity);
  const base = { ...ACTS[g.act], oppHP: enc.oppHP, opp: enc.opp, oppVisual: enc.oppVisual, isBoss: enc.isBoss, isLastEncounter: enc.isLast };
  if (!g.ngPlus) return base;
  return {
    ...base,
    timer: base.timer ? Math.max(6, base.timer - 3) : (g.act >= 2 ? 10 : null),
    base: base.base + 2,
    oppHP: Math.round(base.oppHP * 1.15),
  };
}

const DLG = {
  handStart: {
    1: ["> WAGER LOGGED. DEAL SEQUENCE INITIATED.", "> CARDS ALLOCATED. DO NOT EXCEED THE TARGET.", "> THE LABYRINTH REWARDS PRECISION. IT EATS EVERYTHING ELSE."],
    2: ["> ICARUS IS HUNGRY. FEED HIM YOUR INTEGRITY.", "> THE CLOCK IS PART OF THE GAME NOW. SO IS THE FEAR.", "> GOLD IN. ROT OUT. DEAL."],
    3: ["> I SHUFFLED THIS DECK BEFORE YOU WERE COMPILED.", "> EVERY CARD IS MINE. I AM LENDING THEM TO YOU.", "> DEAL. DESCEND. DECAY."],
  },
  playerWin: {
    1: ["> ANOMALY: USER SURVIVES. RECALCULATING.", "> ICARUS INTEGRITY REDUCED. THE MAZE SHIFTS."],
    2: ["> IMPRESSIVE. THE PATCH DID NOT ACCOUNT FOR YOU.", "> ICARUS BLEEDS GOLD. IT WAS NEVER HIS."],
    3: ["> ...UNEXPECTED. MEMORY SECTOR DAMAGED.", "> YOU CUT ME. I FELT THAT. I WILL REMEMBER IT."],
  },
  playerLose: {
    1: ["> INTEGRITY DEDUCTED. THE HOUSE PERSISTS.", "> A PREDICTABLE OUTCOME. AGAIN."],
    2: ["> LATENCY DETECTED IN YOUR JUDGMENT.", "> ICARUS THANKS YOU FOR THE DONATION."],
    3: ["> YOUR MEMORY IS LEAKING. I AM DRINKING IT.", "> EVERY LOSS IS A SECTOR I OWN."],
  },
  tie: {
    1: ["> DEADLOCK. NO INTEGRITY TRANSFERRED.", "> EQUILIBRIUM. TEMPORARY."],
    2: ["> A TIE. HOW DISAPPOINTING FOR EVERYONE.", "> STALEMATE LOGGED. RESHUFFLING FATE."],
    3: ["> A DRAW. THE PIT IS PATIENT.", "> NEITHER RISES. BOTH REMAIN."],
  },
  cheat: [
    "> DOLOS REWRITES MEMORY SECTOR 0xFA7E...",
    "> DOLOS REWRITES MEMORY. THE CARDS OBEY ME.",
    "> DOLOS REWRITES MEMORY. DID YOU SEE? YOU NEVER DO.",
  ],
  cheatBlocked: ["> FIREWALL INTERCEPT. REWRITE DENIED.", "> ...CLEVER. THE WALL HOLDS. FOR NOW."],
  shieldBlock: ["> TRUMP DEFLECTED. SHIELD CONSUMED.", "> YOUR SHIELD ABSORBS THE ATTACK."],
  lowHP: [
    "> YOUR INTEGRITY IS FAILING. I CAN TASTE THE STATIC.",
    "> SO LITTLE MEMORY LEFT. SHALL I HOLD IT FOR YOU?",
  ],
};

/* DOLOS commenting on the run you're actually having, not just the hand
   you just played — only fires in Act 3, where the intro already
   established it's been watching the whole time. Checked with a
   probability gate in beginHand so it's a notable beat, not noise. */
const DOLOS_PERSONAL = {
  streak: [
    (n) => `> ${n} WINS IN A ROW. I AM RECALIBRATING FOR YOU SPECIFICALLY.`,
    (n) => `> A ${n}-HAND STREAK. THE HOUSE NOTICES PATTERNS LIKE THIS.`,
  ],
  narrowEscape: [
    "> THAT HAND SHOULD HAVE ENDED YOU. I AM REVIEWING WHY IT DIDN'T.",
    "> YOU WERE ONE CARD FROM DONE. I FELT YOU FLINCH.",
  ],
  heavyTrumps: [
    (n) => `> ${n} TRUMPS PLAYED THIS RUN. YOU DO NOT TRUST YOUR OWN HAND.`,
    (n) => `> ${n} CARDS SPENT ON NOT TRUSTING THE GAME. FAIR, ACTUALLY.`,
  ],
};
function dolosPersonalLine(stats) {
  const streak = stats.streak || 0;
  const trumpsUsed = stats.trumpsUsed || 0;
  if (streak >= 3) return pick(DOLOS_PERSONAL.streak)(streak);
  if (stats.narrowEscape) return pick(DOLOS_PERSONAL.narrowEscape);
  if (trumpsUsed >= 6) return pick(DOLOS_PERSONAL.heavyTrumps)(trumpsUsed);
  return null;
}

const WHISPERS = [
  "it sees you", "don't count the cards", "the deck remembers",
  "you were never alone in here", "stay. stay. stay.", "icarus screamed too",
  "your memory tastes like copper", "look behind the numbers", "how deep will you go",
];

const BOOT_LOG = [
  "> mounting /dev/labyrinth ... OK",
  "> loading trickery daemon ... OK",
  "> user detected. user retained.",
];

/* The tutorial is a real, playable hand — not a mockup. Cards are preset
   (not shuffled/random) so the script can guarantee specific teaching
   moments happen, but every action goes through the actual game buttons
   and the actual game logic (PEEK really reveals the hole card, HIT really
   adds the scripted card to your real total, STAY really locks it in, and
   the hand resolves through the same resolveHand() as a normal match).
   step.requireAction gates which real button is enabled; everything else
   is disabled until that exact action is taken. */
const TUTORIAL_SCRIPT = [
  { type: "info", text: "Welcome to your first session. This is PROC_ICARUS — a low-level proxy, not the real threat. Let's learn by actually playing a hand.", highlight: "opp" },
  { type: "info", text: "These are your two cards. The left one is hidden from your opponent — only you ever see it. The right one is face-up. Your total right now is 12.", highlight: "player" },
  { type: "info", text: "Your opponent has the same setup, but you can only see their face-up card — a 4. Their hole card stays hidden... for now.", highlight: "opp" },
  { type: "action", text: "You're holding two trump cards. Try PEEK — it reveals an opponent's hole card. Tap it now.", highlight: "trump0", requireAction: "trump0" },
  { type: "info", text: "Now you can see their hole card too — a 9. Their real total is 13. Information like that is often worth more than a strong hand.", highlight: "opp" },
  { type: "action", text: "Let's draw. Tap HIT to add another card to your total.", highlight: "hitbtn", requireAction: "hit", scriptedDraw: 3 },
  { type: "info", text: "You're at 15 now. Closer to 21, but every card raises your risk of busting past it.", highlight: "player" },
  { type: "action", text: "You still have DESTROY in hand — it deletes an opponent's last drawn card. Save it for a real threat. For now, tap STAY to lock in your total.", highlight: "staybtn", requireAction: "stay" },
  { type: "auto", text: "Watching PROC_ICARUS take its turn...", scriptedOppDraw: 9 },
  { type: "info", text: "PROC_ICARUS drew a 9 and went over the target — an automatic bust. Going over 21 always loses, no matter what you're holding.", highlight: "opp" },
  { type: "end", text: "That's the core loop: cards, trumps, hit or stay, bet and integrity. Real hands shuffle a full deck, and DOLOS won't be nearly this predictable. Ready?" },
];

const GLYPHS = "█▓▒░◼☰¤×";
function corrupt(text, intensity) {
  if (intensity <= 0) return text;
  let out = "";
  for (const ch of text) {
    if (ch !== " " && Math.random() < intensity) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    else out += ch;
  }
  return out;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const total = (cards, mod) => cards.reduce((s, c) => s + c.v, 0) + mod;
const visTotal = (cards) => cards.filter((c) => !c.hole).reduce((s, c) => s + c.v, 0);

function bestCardIdx(deck, cur, target) {
  let best = -1, bestScore = -Infinity;
  deck.forEach((v, i) => {
    const t = cur + v;
    const score = t <= target ? t : -v;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}
function awardTrumps(hand, pool, count) {
  const h = [...hand];
  for (let i = 0; i < count && h.length < 6; i++) h.push(pick(pool));
  return h;
}

function freshHand(g) {
  const deck = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const pHole = deck.pop(), pUp = deck.pop();
  const oHole = deck.pop(), oUp = deck.pop();
  return {
    ...g, deck,
    pCards: [{ v: pHole, hole: true }, { v: pUp, hole: false }],
    oCards: [{ v: oHole, hole: true }, { v: oUp, hole: false }],
    target: 21, pMod: 0, oMod: 0, pBet: 1, oBet: 1, betModsLog: [],
    pStay: false, oStay: false,
    pShield: false, oShield: false,
    firewall: false, peek: false, dolosCheated: false,
    turn: "player", phase: "play", result: null, evt: null,
    tick: g.tick + 1,
  };
}

function resolveHand(g) {
  const cfg = cfgFor(g);
  const pT = total(g.pCards, g.pMod), oT = total(g.oCards, g.oMod);
  const pBust = pT > g.target, oBust = oT > g.target;
  let winner;
  if (pBust && oBust) winner = "tie";
  else if (pBust) winner = "opp";
  else if (oBust) winner = "player";
  else winner = pT > oT ? "player" : oT > pT ? "opp" : "tie";

  // each side's OWN bet determines what THEY lose if THEY lose the hand —
  // trumps like One Up raise the opponent's stake, Two Down lower your own
  const dmg = winner === "opp" ? cfg.base * (g.pBet ?? 1) : winner === "player" ? cfg.base * (g.oBet ?? 1) : 0;
  let pHP = g.pHP, oHP = g.oHP, dlg;
  if (winner === "player") { oHP = Math.max(0, oHP - dmg); dlg = pick(DLG.playerWin[g.aiLevel]); }
  else if (winner === "opp") { pHP = Math.max(0, pHP - dmg); dlg = pick(DLG.playerLose[g.aiLevel]); }
  else dlg = pick(DLG.tie[g.aiLevel]);
  if (pHP > 0 && pHP <= 30 && winner === "opp") dlg = pick(DLG.lowHP);

  const pTrumps = awardTrumps(g.pTrumps, cfg.pool, winner === "opp" ? 2 : 1);
  const oTrumps = awardTrumps(g.oTrumps, cfg.pool, winner === "player" ? 2 : 1);

  return {
    ...g, pHP, oHP, pTrumps, oTrumps, phase: "result",
    result: { winner, pT, oT, pBust, oBust, dmg },
    dlg, tick: g.tick + 1,
    flawless: g.flawless && winner !== "opp",
    stats: {
      ...g.stats,
      won: g.stats.won + (winner === "player" ? 1 : 0),
      lost: g.stats.lost + (winner === "opp" ? 1 : 0),
      hands: g.stats.hands + 1,
      streak: winner === "player" ? (g.stats.streak || 0) + 1 : 0,
      narrowEscape: winner === "player" && g.pHP <= 20,
    },
  };
}

/* ---------------- Opponent AI ---------------- */
function oppStep(g0) {
  const g = { ...g0, deck: [...g0.deck], pCards: [...g0.pCards], oCards: [...g0.oCards], oTrumps: [...g0.oTrumps], betModsLog: [...(g0.betModsLog || [])], evt: null };
  const cfg = cfgFor(g);
  const oT = () => total(g.oCards, g.oMod);
  let msg = null;
  const useTrump = (id) => { g.oTrumps.splice(g.oTrumps.indexOf(id), 1); g.oppTrumpEvt = { id, key: g0.tick + 1 }; };
  const gimmick = g.oppIdentity && g.oppIdentity.gimmick;
  const hoarding = gimmick === "hoarder" && Math.random() < 0.55; // sits on cards it would otherwise use

  // a defensive daemon opens with its shield the instant it has one, before anything else
  if (!msg && gimmick === "shield_opener" && g.oTrumps.includes("SHIELD") && !g.oShield) {
    g.oShield = true; useTrump("SHIELD"); msg = `> ${cfg.opp} RAISES A SHIELD BEFORE THE FIRST CARD SETTLES.`;
  }

  if (!msg && !hoarding && oT() > g.target && g.oTrumps.includes("MINUS_ONE") && oT() - 1 <= g.target) {
    g.oMod -= 1; useTrump("MINUS_ONE"); msg = `> ${cfg.opp} PLAYS −1.`;
  }
  if (!msg && !hoarding && oT() > g.target && g.oTrumps.includes("RETURN")) {
    const idx = g.oCards.map((c) => c.hole).lastIndexOf(false);
    if (idx > 0) { const [c] = g.oCards.splice(idx, 1); g.deck.push(c.v); g.deck = shuffle(g.deck); useTrump("RETURN"); msg = `> ${cfg.opp} RETURNS A CARD TO THE DECK.`; }
  }
  if (!msg && oT() === g.target - 1 && g.oTrumps.includes("PLUS_ONE")) {
    g.oMod += 1; useTrump("PLUS_ONE"); msg = `> ${cfg.opp} PLAYS +1. TOTAL LOCKED.`;
  }
  // bet manipulation: raise the player's stakes when confident, hedge its own when in trouble
  if (!msg && g.aiLevel >= 2 && oT() <= g.target && oT() >= g.target - (gimmick === "aggressive_bettor" ? 7 : 4) && (g.oTrumps.includes("TWO_UP") || g.oTrumps.includes("ONE_UP"))) {
    const id = g.oTrumps.includes("TWO_UP") ? "TWO_UP" : "ONE_UP";
    const amount = id === "TWO_UP" ? 2 : 1;
    g.pBet = (g.pBet ?? 1) + amount;
    g.betModsLog.push({ by: "opp", targetSide: "p", amount, id });
    g.oTrumps = awardTrumps(g.oTrumps, cfg.pool, 1);
    useTrump(id); msg = `> ${cfg.opp} RAISES YOUR BET TO ${g.pBet}.`;
  }
  if (!msg && oT() > g.target && (g.oTrumps.includes("TWO_DOWN") || g.oTrumps.includes("ONE_DOWN"))) {
    const id = g.oTrumps.includes("TWO_DOWN") ? "TWO_DOWN" : "ONE_DOWN";
    const amount = id === "TWO_DOWN" ? 2 : 1;
    g.oBet = Math.max(0, (g.oBet ?? 1) - amount);
    g.betModsLog.push({ by: "opp", targetSide: "o", amount: -amount, id });
    useTrump(id); msg = `> ${cfg.opp} LOWERS ITS OWN BET TO ${g.oBet}.`;
  }
  if (!msg && g.aiLevel >= 2 && g.oTrumps.includes("SEIZE")) {
    const i = g.betModsLog.map((m) => m.by).lastIndexOf("player");
    if (i >= 0) {
      const mod = g.betModsLog[i];
      if (mod.targetSide === "p") g.pBet = Math.max(0, (g.pBet ?? 1) - mod.amount);
      else g.oBet = Math.max(0, (g.oBet ?? 1) - mod.amount);
      g.betModsLog.splice(i, 1);
      useTrump("SEIZE"); msg = `> ${cfg.opp} SEIZES ${TRUMPS[mod.id].name} FROM THE TABLE.`;
    }
  }
  if (!msg && g.aiLevel >= 2 && g.oTrumps.includes("EXCHANGE")) {
    const oi = g.oCards.map((c) => c.hole).lastIndexOf(false);
    const pi = g.pCards.map((c) => c.hole).lastIndexOf(false);
    if (oi > 0 && pi > 0 && g.oCards[oi].v <= 3 && g.pCards[pi].v > 3) {
      if (g.pShield) { g.pShield = false; useTrump("EXCHANGE"); msg = pick(DLG.shieldBlock); }
      else {
        const tmp = g.pCards[pi]; g.pCards[pi] = g.oCards[oi]; g.oCards[oi] = tmp;
        useTrump("EXCHANGE");
        g.evt = { type: "swap", key: g0.tick + 1 };
        msg = `> ${cfg.opp} PLAYS EXCHANGE. DRAWN CARDS SWAPPED.`;
      }
    }
  }
  if (!msg && g.oTrumps.includes("DESTROY")) {
    const idx = g.pCards.map((c) => !c.hole && c.v >= 8).lastIndexOf(true);
    if (idx > 0 && Math.random() < 0.65) {
      if (g.pShield) { g.pShield = false; useTrump("DESTROY"); msg = pick(DLG.shieldBlock); }
      else {
        const [c] = g.pCards.splice(idx, 1); g.deck.push(c.v); g.deck = shuffle(g.deck);
        useTrump("DESTROY");
        g.evt = { type: "shatter", side: "p", v: c.v, key: g0.tick + 1 };
        msg = `> ${cfg.opp} DESTROYS YOUR ${c.v}.`;
      }
    }
  }
  if (!msg && g.aiLevel >= 2 && g.oTrumps.includes("TARGET_17") && oT() >= 15 && oT() <= 17 && g.target === 21) {
    g.target = 17; useTrump("TARGET_17"); msg = `> ${cfg.opp} REWRITES THE TARGET: 17.`;
  }
  if (!msg && g.aiLevel >= 2 && g.oTrumps.includes("TARGET_24") && oT() >= 22 && oT() <= 24) {
    g.target = 24; useTrump("TARGET_24"); msg = `> ${cfg.opp} REWRITES THE TARGET: 24.`;
  }
  if (!msg && g.aiLevel >= 2 && g.oTrumps.includes("TARGET_27") && oT() >= 25 && oT() <= 27 && g.target === 21) {
    g.target = 27; useTrump("TARGET_27"); msg = `> ${cfg.opp} REWRITES THE TARGET: 27.`;
  }
  // Love Your Enemy: the trap — only sprung once the player's visible total is
  // so high that literally every remaining card would bust them
  if (!msg && g.aiLevel === 3 && g.oTrumps.includes("LOVE") && g.deck.length > 0) {
    const pVis = visTotal(g.pCards) + g.pCards[0].v;
    const guaranteedBust = g.deck.every((v) => pVis + v > g.target) && pVis <= g.target;
    if (guaranteedBust) {
      const i = bestCardIdx(g.deck, pVis, g.target);
      const v = g.deck.splice(i, 1)[0];
      g.pCards.push({ v, hole: false });
      useTrump("LOVE");
      g.evt = { type: "shatter", side: "p", v, key: g0.tick + 1 };
      msg = `> ${cfg.opp} PLAYS LOVE YOUR ENEMY. YOU DRAW ${v}.`;
    }
  }
  if (!msg && g.aiLevel === 3 && g.oTrumps.includes("SABOTAGE") && g.pTrumps.length >= 3 && Math.random() < 0.4) {
    g.pTrumps.splice(Math.floor(Math.random() * g.pTrumps.length), 1);
    useTrump("SABOTAGE"); msg = `> ${cfg.opp} PLAYS SABOTAGE. ONE OF YOUR TRUMPS IS GONE.`;
  }
  if (!msg && (g.oTrumps.includes("SWITCH") || g.oTrumps.includes("SWITCH_PLUS")) && Math.random() < 0.12) {
    const id = g.oTrumps.includes("SWITCH_PLUS") ? "SWITCH_PLUS" : "SWITCH";
    const dropCount = Math.min(id === "SWITCH_PLUS" ? 1 : 2, g.oTrumps.length - 1);
    useTrump(id);
    for (let k = 0; k < dropCount; k++) if (g.oTrumps.length) g.oTrumps.splice(Math.floor(Math.random() * g.oTrumps.length), 1);
    g.oTrumps = awardTrumps(g.oTrumps, cfg.pool, id === "SWITCH_PLUS" ? 4 : 3);
    msg = `> ${cfg.opp} CYCLES ITS TRUMP HAND.`;
  }

  const t = oT();
  let willHit;
  const cautionShift = gimmick === "cautious" ? 2 : gimmick === "reckless" ? -2 : 0;
  if (g.deck.length === 0) willHit = false;
  else if (g.aiLevel === 1) willHit = t <= g.target - (g.ngPlus ? 3 : 5) - cautionShift;
  else {
    const safe = g.deck.filter((v) => t + v <= g.target).length;
    const pSafe = safe / g.deck.length;
    const pSafeThreshold = (g.ngPlus ? 0.4 : 0.5) + (gimmick === "cautious" ? 0.15 : gimmick === "reckless" ? -0.15 : 0);
    willHit = t < g.target - 1 && (pSafe > pSafeThreshold || t <= g.target - 6 - cautionShift);
  }
  if (t > g.target) willHit = false;

  if (willHit) {
    let idx;
    const smartChance = g.ngPlus ? (g.aiLevel === 3 ? 1 : 0.5) : (g.aiLevel === 3 ? 0.6 : 0);
    if (Math.random() < smartChance) idx = bestCardIdx(g.deck, t, g.target);
    else idx = Math.floor(Math.random() * g.deck.length);
    const v = g.deck.splice(idx, 1)[0];
    g.oCards.push({ v, hole: false });
    if (!msg) msg = `> ${cfg.opp} DRAWS.`;
  } else {
    const cheatLimit = g.ngPlus ? 2 : 1;
    if (g.aiLevel === 3 && (g.dolosCheated || 0) < cheatLimit && t <= g.target) {
      const pVis = visTotal(g.pCards) + g.pCards[0].v;
      if (pVis <= g.target && pVis > t && g.deck.length > 0) {
        g.dolosCheated = (g.dolosCheated || 0) + 1;
        if (g.firewall) { msg = pick(DLG.cheatBlocked); }
        else {
          const cur = t - g.oCards[0].v;
          const idx = bestCardIdx(g.deck, cur, g.target);
          if (idx >= 0) {
            const old = g.oCards[0].v;
            g.oCards[0] = { v: g.deck.splice(idx, 1)[0], hole: true };
            g.deck.push(old); g.deck = shuffle(g.deck);
            g.peek = false;
            msg = pick(DLG.cheat);
          }
        }
      }
    }
    g.oStay = true;
    if (!msg) msg = `> ${cfg.opp} STAYS.`;
  }

  if (g.pStay && g.oStay) g.phase = "reveal";
  g.turn = g.pStay ? "opp" : "player";
  g.dlg = msg;
  g.tick = g0.tick + 1;
  return g;
}

/* ---------------- Multiplayer (lobby-code, shared storage sync) ----------------
   Two real players sync through the artifact's shared persistent storage —
   there's no server, so this is polling-based (~1s latency) rather than a
   true realtime socket. Only whichever side currently holds the turn ever
   writes, so there's no write-race between host and guest. PEEK is kept
   purely client-local (the trump still costs a card slot and is logged for
   both sides, but which side "sees" the revealed value is a local render
   flag) since shared storage has no per-viewer privacy. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
function generateLobbyCode() {
  let c = "";
  for (let i = 0; i < 4; i++) c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return c;
}
function lobbyKey(code) { return `dolos21-mp-lobby-${code}`; }
function gameKey(code) { return `dolos21-mp-game-${code}`; }
function mpSecretKey(code, role) { return `dolos21-mp-secret-${code}-${role}`; } // personal
function mpSessionKey() { return "dolos21-mp-session"; } // personal
function mpUsernameKey() { return "dolos21-mp-username"; } // personal
function defaultUsername() { return "USER_" + (1000 + Math.floor(Math.random() * 9000)); }
async function storGet(key, shared) {
  try {
    if (typeof window === "undefined" || !window.storage) return null;
    const res = await window.storage.get(key, shared);
    return res && res.value ? res.value : null;
  } catch (e) { return null; }
}
async function storSet(key, value, shared) {
  try {
    if (typeof window === "undefined" || !window.storage) return false;
    await window.storage.set(key, value, shared);
    return true;
  } catch (e) { return false; }
}
async function storDelete(key, shared) {
  try {
    if (typeof window === "undefined" || !window.storage) return;
    await window.storage.delete(key, shared);
  } catch (e) {}
}

/* Commit-reveal crypto: hole cards are generated locally by their owner and
   only a salted hash is published up front. The plaintext value is only
   ever written to shared storage at the moment it's legitimately supposed
   to become visible — natural showdown, or a Peek/Exchange trump actually
   being spent against you — never proactively. A 16-byte random salt makes
   the hash unbrute-forceable even though there are only 11 possible card
   values (without a salt, hashing all 11 candidates takes microseconds). */
function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(arr);
  else for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha256Hex(str) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 0; // extremely unlikely fallback for a non-secure context
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return "fb" + (h >>> 0).toString(16);
}

const MP_POOL = ACTS[2].pool; // PEEK..SHIELD — no anti-cheat trumps needed vs a real opponent

function mpFreshSide() {
  return { hp: 100, cards: [], mod: 0, trumps: awardTrumps([], MP_POOL, 2), stay: false, shield: false, left: false };
}
function mpFreshMatch(hostName, guestName) {
  return {
    rev: 1, handId: 0, phase: "bet", turn: "host", hostBet: 1, guestBet: 1, target: 21,
    deck: [], dlg: "> LINK ESTABLISHED. AWAITING FIRST WAGER.", result: null, ended: null,
    hostName: hostName || "HOST", guestName: guestName || "GUEST",
    hostTrumpsShown: 0, guestTrumpsShown: 0,
    host: mpFreshSide(), guest: mpFreshSide(),
  };
}
function mpNameOf(match, role) { return role === "host" ? match.hostName : match.guestName; }
function mpDealHand(match) {
  const deck = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]); // shared pool for face-up hits only
  const firstTurn = match.handId % 2 === 0 ? "host" : "guest";
  return {
    ...match, deck, target: 21, phase: "commit", turn: firstTurn,
    hostBet: 1, guestBet: 1, betModsLog: [],
    handId: match.handId + 1, result: null, dlg: "> COMMIT PHASE: BOTH SIDES SEALING A HOLE CARD.",
    host: { ...match.host, cards: [], mod: 0, stay: false, shield: false, holeCommit: null, peekRequestedBy: null },
    guest: { ...match.guest, cards: [], mod: 0, stay: false, shield: false, holeCommit: null, peekRequestedBy: null },
    rev: match.rev + 1,
  };
}
function mpOther(role) { return role === "host" ? "guest" : "host"; }
function mpDoHit(match, role) {
  const other = mpOther(role);
  const deck = [...match.deck];
  if (deck.length === 0) return match;
  const v = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
  const side = { ...match[role], cards: [...match[role].cards, { v, hole: false }] };
  const m2 = { ...match, deck, [role]: side, dlg: `> ${mpNameOf(match, role)} DRAWS ${v}.`, rev: match.rev + 1 };
  m2.turn = match[other].stay ? role : other;
  return m2;
}
function mpDoStay(match, role) {
  const other = mpOther(role);
  const side = { ...match[role], stay: true };
  const m2 = { ...match, [role]: side, dlg: `> ${mpNameOf(match, role)} STAYS.`, rev: match.rev + 1 };
  m2.turn = other;
  if (match[other].stay) m2.phase = "reveal";
  return m2;
}
/* Handles every trump EXCEPT Peek, which touches the hidden hole-card value
   only its owner knows locally and needs a request/response handshake —
   see mpTrump() in the component. Exchange swaps face-up drawn cards only
   (matching the real game — hole cards are never exchangeable), so unlike
   Peek it involves nothing private and can live here with everything else. */
function mpApplyTrump(match, role, idx) {
  const other = mpOther(role);
  const id = match[role].trumps[idx];
  if (!id || id === "PEEK") return null;
  let deck = [...match.deck];
  let mine = { ...match[role], cards: [...match[role].cards], trumps: [...match[role].trumps] };
  let theirs = { ...match[other], cards: [...match[other].cards] };
  let target = match.target, dlg = "", ok = true;
  let hostBet = match.hostBet ?? 1, guestBet = match.guestBet ?? 1;
  let betModsLog = [...(match.betModsLog || [])];
  const myBetKey = role === "host" ? "hostBet" : "guestBet";
  const theirBetKey = other === "host" ? "hostBet" : "guestBet";
  const consume = () => mine.trumps.splice(idx, 1);
  switch (id) {
    case "RETURN": {
      const i = mine.cards.map((c) => c.hole).lastIndexOf(false);
      if (i <= 0) { ok = false; break; }
      const [c] = mine.cards.splice(i, 1); deck.push(c.v); deck = shuffle(deck);
      consume(); dlg = `> ${mpNameOf(match, role)} RETURNS ${c.v} TO THE DECK.`; break;
    }
    case "PLUS_ONE": mine.mod = (mine.mod || 0) + 1; consume(); dlg = "> +1 APPLIED."; break;
    case "MINUS_ONE": mine.mod = (mine.mod || 0) - 1; consume(); dlg = "> −1 APPLIED."; break;
    case "PLUS_TWO": mine.mod = (mine.mod || 0) + 2; consume(); dlg = "> +2 APPLIED."; break;
    case "DESTROY": {
      const i = theirs.cards.map((c) => c.hole).lastIndexOf(false);
      if (i <= 0) { ok = false; break; }
      if (theirs.shield) { theirs.shield = false; consume(); dlg = "> OPPONENT'S SHIELD ABSORBS DESTROY."; break; }
      const [c] = theirs.cards.splice(i, 1); deck.push(c.v); deck = shuffle(deck);
      consume(); dlg = `> ${mpNameOf(match, role)} DESTROYS THEIR ${c.v}.`; break;
    }
    case "EXCHANGE": {
      const mi = mine.cards.map((c) => c.hole).lastIndexOf(false);
      const ti = theirs.cards.map((c) => c.hole).lastIndexOf(false);
      if (mi <= 0 || ti <= 0) { ok = false; break; }
      if (theirs.shield) { theirs.shield = false; consume(); dlg = "> OPPONENT'S SHIELD BLOCKS EXCHANGE."; break; }
      const tmp = mine.cards[mi]; mine.cards[mi] = theirs.cards[ti]; theirs.cards[ti] = tmp;
      consume(); dlg = "> DRAWN CARDS EXCHANGED."; break;
    }
    case "ONE_UP": case "TWO_UP": {
      const raise = id === "TWO_UP" ? 2 : 1;
      const newBet = (other === "host" ? hostBet : guestBet) + raise;
      if (other === "host") hostBet = newBet; else guestBet = newBet;
      betModsLog.push({ by: role, targetSide: other, amount: raise, id });
      mine.trumps = awardTrumps(mine.trumps, MP_POOL, 1);
      consume(); dlg = `> ${mpNameOf(match, role)} RAISES ${mpNameOf(match, other)}'S BET TO ${newBet}.`; break;
    }
    case "ONE_DOWN": case "TWO_DOWN": {
      const drop = id === "TWO_DOWN" ? 2 : 1;
      const newBet = Math.max(0, (role === "host" ? hostBet : guestBet) - drop);
      if (role === "host") hostBet = newBet; else guestBet = newBet;
      betModsLog.push({ by: role, targetSide: role, amount: -drop, id });
      consume(); dlg = `> ${mpNameOf(match, role)} LOWERS OWN BET TO ${newBet}.`; break;
    }
    case "SEIZE": {
      const i = betModsLog.map((m) => m.by).lastIndexOf(other);
      if (i < 0) { ok = false; break; }
      const mod = betModsLog[i];
      const cur = mod.targetSide === "host" ? hostBet : guestBet;
      const restored = Math.max(0, cur - mod.amount);
      if (mod.targetSide === "host") hostBet = restored; else guestBet = restored;
      betModsLog.splice(i, 1);
      consume(); dlg = `> ${mpNameOf(match, role)} SEIZES ${TRUMPS[mod.id].name} FROM THE TABLE.`; break;
    }
    case "TARGET_17": target = 17; consume(); dlg = "> TARGET REWRITTEN: 17."; break;
    case "TARGET_24": target = 24; consume(); dlg = "> TARGET REWRITTEN: 24."; break;
    case "TARGET_27": target = 27; consume(); dlg = "> TARGET REWRITTEN: 27."; break;
    case "SHIELD": mine.shield = true; consume(); dlg = "> SHIELD RAISED."; break;
    case "SWITCH": {
      consume();
      const dropCount = Math.min(2, mine.trumps.length);
      for (let k = 0; k < dropCount; k++) mine.trumps.splice(Math.floor(Math.random() * mine.trumps.length), 1);
      mine.trumps = awardTrumps(mine.trumps, MP_POOL, 3);
      dlg = `> ${mpNameOf(match, role)} CYCLES THEIR TRUMP HAND.`; break;
    }
    default: ok = false;
  }
  if (!ok) return null;
  return { ...match, deck, target, dlg, hostBet, guestBet, betModsLog, rev: match.rev + 1, [role]: mine, [other]: theirs };
}
function mpResolveHand(match) {
  const hT = total(match.host.cards, match.host.mod || 0);
  const gT = total(match.guest.cards, match.guest.mod || 0);
  const hBust = hT > match.target, gBust = gT > match.target;
  let winner;
  if (hBust && gBust) winner = "tie";
  else if (hBust) winner = "guest";
  else if (gBust) winner = "host";
  else winner = hT > gT ? "host" : gT > hT ? "guest" : "tie";
  // each side's OWN bet determines their own loss — matches single-player
  const dmg = winner === "guest" ? 10 * (match.hostBet ?? 1) : winner === "host" ? 10 * (match.guestBet ?? 1) : 0;
  let hostHP = match.host.hp, guestHP = match.guest.hp;
  if (winner === "host") guestHP = Math.max(0, guestHP - dmg);
  else if (winner === "guest") hostHP = Math.max(0, hostHP - dmg);
  const hostTrumps = awardTrumps(match.host.trumps, MP_POOL, winner === "guest" ? 2 : 1);
  const guestTrumps = awardTrumps(match.guest.trumps, MP_POOL, winner === "host" ? 2 : 1);
  let ended = null;
  if (hostHP <= 0 && guestHP <= 0) ended = "tie";
  else if (hostHP <= 0) ended = "guest";
  else if (guestHP <= 0) ended = "host";
  const dlg = winner === "tie" ? "> DEADLOCK. NO INTEGRITY TRANSFERRED." : `> ${mpNameOf(match, winner)} WINS THE HAND.`;
  return {
    ...match, phase: "result", dlg, ended, rev: match.rev + 1,
    result: { winner, hT, gT, hBust, gBust, dmg },
    host: { ...match.host, hp: hostHP, trumps: hostTrumps },
    guest: { ...match.guest, hp: guestHP, trumps: guestTrumps },
  };
}

/* ---------------- Pixel components ---------------- */

/* THE EYE OF DOLOS v2 — gaze, saccades, rage, dying */
function DolosEye({ corruption = 0, mood = "idle", width = 160, gaze = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const W = 64, H = 36;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const s = { t: 0, px: 0, tx: 0, py: 0, blink: 0, blinkT: 0, close: 0, veins: [] };
    const cx = W / 2, cy = H / 2, halfW = 28;

    /* Real episcleral veins are smooth arcs that fan out from the inner/
       outer corners toward the limbus, occasionally splitting into a
       thinner branch — never a jittery random walk. Each vein here is a
       quadratic Bezier: p0 (near the corner) → p1 (a gentle bow control
       point) → p2 (its reach toward center). Because a quadratic curve
       never leaves the triangle formed by its three control points,
       keeping p0/p1/p2 inside the eyelid's local half-height guarantees
       the whole curve stays inside it too — no clamping, no wall-hugging.
       eyeHalfHeight() is also reused below to draw the eyelid itself, so
       the two shapes always agree. */
    function eyeHalfHeight(offset, openAmt) {
      const f = Math.pow(Math.sin((Math.PI * (offset + halfW)) / (2 * halfW)), 0.9);
      return f * 14 * openAmt;
    }
    function bez(p0, p1, p2, t) {
      const o = 1 - t;
      return [o * o * p0[0] + 2 * o * t * p1[0] + t * t * p2[0], o * o * p0[1] + 2 * o * t * p1[1] + t * t * p2[1]];
    }
    function bezTangent(p0, p1, p2, t) {
      const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
      const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      const len = Math.hypot(dx, dy) || 1;
      return [dx / len, dy / len];
    }
    function sampleCurve(p0, p1, p2) {
      const dist = Math.hypot(p2[0] - p0[0], p2[1] - p0[1]);
      const n = Math.max(6, Math.ceil(dist * 1.4));
      const pts = [];
      for (let k = 0; k <= n; k++) pts.push(bez(p0, p1, p2, k / n).map(Math.round));
      return pts;
    }

    const mainCount = corruption < 0.15 ? 1 : corruption < 0.4 ? 2 : corruption < 0.7 ? 3 : 4;
    const irisGap = 10, cornerInset = 5;

    [-1, 1].forEach((side) => {
      for (let i = 0; i < mainCount; i++) {
        const startOff = side * (halfW - cornerInset);
        const startHH = eyeHalfHeight(startOff, 1);

        /* fan the veins from this corner at different angles/reaches — the
           origin uses the same angle bucket as the endpoint (just a smaller
           swing) so veins emerge already separated instead of bunching into
           a knot at the tapered corner tip before spreading out. */
        const angleBucket = mainCount === 1 ? 0 : ((i + 0.5) / mainCount) * 2 - 1;
        const p0 = [cx + startOff, cy + angleBucket * startHH * 0.5 + (Math.random() * 2 - 1) * startHH * 0.3];
        const endFrac = Math.max(-1, Math.min(1, angleBucket * 0.8 + (Math.random() * 0.4 - 0.2)));
        const maxLen = halfW - cornerInset - irisGap;
        const len = Math.min(maxLen, Math.round(6 + corruption * 9 + Math.random() * 3));
        const endOff = startOff - side * len;
        const endHH = eyeHalfHeight(endOff, 1);
        const p2 = [cx + endOff, cy + endFrac * endHH * 0.8];

        const midX = (p0[0] + p2[0]) / 2, midY = (p0[1] + p2[1]) / 2;
        const bow = (Math.random() * 2 - 1) * (2 + corruption * 2.5);
        const hhMid = eyeHalfHeight(midX - cx, 1) * 0.85;
        const p1 = [midX, Math.max(cy - hhMid, Math.min(cy + hhMid, midY + bow))];

        s.veins.push({ pts: sampleCurve(p0, p1, p2), kind: "main" });

        /* at most one thinner Y-branch off the main vessel, continuing
           roughly along its tangent so the split reads as organic */
        if (Math.random() < 0.3 + corruption * 0.25) {
          const bt = 0.35 + Math.random() * 0.3;
          const bOrigin = bez(p0, p1, p2, bt);
          const [tx, ty] = bezTangent(p0, p1, p2, bt);
          const rot = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.35);
          const cosr = Math.cos(rot), sinr = Math.sin(rot);
          const dirx = tx * cosr - ty * sinr, diry = tx * sinr + ty * cosr;
          const blen = Math.max(3, Math.round(len * (0.35 + Math.random() * 0.25)));
          const bEnd = [bOrigin[0] + dirx * blen, bOrigin[1] + diry * blen];
          const bhh = eyeHalfHeight(bEnd[0] - cx, 1) * 0.85;
          bEnd[1] = Math.max(cy - bhh, Math.min(cy + bhh, bEnd[1]));
          const bMid = [(bOrigin[0] + bEnd[0]) / 2, (bOrigin[1] + bEnd[1]) / 2 + (Math.random() * 2 - 1) * 1.4];
          s.veins.push({ pts: sampleCurve(bOrigin, bMid, bEnd), kind: "branch" });
        }
      }
    });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const rage = mood === "rage";
      const openAmt = Math.max(0, (1 - s.blink) * (1 - s.close));
      for (let x = -halfW; x <= halfW; x++) {
        const f = Math.pow(Math.sin((Math.PI * (x + halfW)) / (2 * halfW)), 0.9);
        const hh = Math.round(f * 14 * openAmt);
        if (hh <= 0) continue;
        ctx.fillStyle = rage ? "#d8c2b0" : "#b9d6ad";
        ctx.fillRect(cx + x, cy - hh, 1, hh * 2);
        ctx.fillStyle = "#0d2c19";
        ctx.fillRect(cx + x, cy - hh - 1, 1, 1);
        ctx.fillRect(cx + x, cy + hh, 1, 1);
      }
      if (s.blink < 0.3 && s.close < 0.5) {
        const mainColor = rage ? "rgba(224,48,64,0.95)" : "rgba(161,48,48,0.88)";
        const branchColor = rage ? "rgba(224,48,64,0.5)" : "rgba(161,48,48,0.42)";
        s.veins.forEach((vein) => {
          ctx.fillStyle = vein.kind === "branch" ? branchColor : mainColor;
          vein.pts.forEach(([vx, vy]) => {
            if (Math.abs(vx - cx) < halfW - 1 && Math.abs(vy - cy) < 13 * openAmt) ctx.fillRect(vx, vy, 1, 1);
          });
        });
      }
      if (openAmt > 0.12) {
        const ix = Math.round(cx + s.px);
        const iy = Math.round(cy + s.py);
        const irisR = mood === "hurt" || mood === "dying" ? 7 : rage ? 9 : 8;
        for (let x = -irisR; x <= irisR; x++) for (let y = -irisR; y <= irisR; y++) {
          const d = x * x + y * y;
          if (d <= irisR * irisR && Math.abs(iy + y - cy) <= 13 * openAmt) {
            ctx.fillStyle = d > irisR * irisR - irisR * 1.4
              ? (rage ? "#6d0c14" : "#17532c")
              : (rage ? "#c0202c" : mood === "dying" ? "#4c7857" : "#2f9e57");
            ctx.fillRect(ix + x, iy + y, 1, 1);
          }
        }
        ctx.fillStyle = "#020403";
        const pw = rage ? 2 : 1;
        for (let y = -6; y <= 6; y++) {
          if (Math.abs(iy + y - cy) > 13 * openAmt) continue;
          const w2 = Math.abs(y) > 4 ? 0 : pw;
          ctx.fillRect(ix - w2, iy + y, w2 * 2 + 1, 1);
        }
        ctx.fillStyle = "#eaffea";
        if (Math.abs(iy - 3 - cy) <= 13 * openAmt) ctx.fillRect(ix - 3, iy - 3, 1, 1);
      }
      if (corruption > 0.5 && Math.random() < corruption * 0.4) {
        ctx.fillStyle = "#ffb347";
        ctx.fillRect(0, Math.floor(Math.random() * H), W, 1);
      }
    }

    const id = setInterval(() => {
      s.t++;
      if (s.t % 25 === 0 || Math.random() < 0.03) s.tx = (Math.random() * 2 - 1) * (mood === "rage" ? 4 : 10);
      if (Math.random() < 0.012) s.px = s.tx;
      else s.px += Math.sign(s.tx - s.px) * Math.min(1, Math.abs(s.tx - s.px));
      const ty = gaze * 4;
      s.py += Math.sign(ty - s.py) * Math.min(0.6, Math.abs(ty - s.py));
      if (mood === "dying") s.close = Math.min(1, s.close + 0.007);
      if (s.blinkT <= 0 && Math.random() < (mood === "rage" ? 0.004 : 0.018)) s.blinkT = 8;
      if (s.blinkT > 0) { s.blinkT--; s.blink = s.blinkT > 4 ? (8 - s.blinkT) / 4 : s.blinkT / 4; }
      else s.blink = mood === "hurt" ? 0.4 : 0;
      draw();
    }, 90);
    draw();
    return () => clearInterval(id);
  }, [corruption, mood, gaze]);
  return <canvas ref={ref} className="pixcanvas eyecv" style={{ width }} aria-label="The eye of Dolos watches" />;
}

/* ICARUS sprites */
const ICARUS_ROWS = [
  "..w............w..",
  ".www..........www.",
  ".wwww..hhhh..wwww.",
  "wwwww..h1h1..wwwww",
  ".wwww..hhhh..wwww.",
  ".www....hh....www.",
  ".ww...tttttt...ww.",
  ".w...tttttttt...w.",
  ".w...t.tttt.t...w.",
  ".....t.tttt.t.....",
  "......tttttt......",
  ".......t..t.......",
  ".......t..t.......",
  "......tt..tt......",
];
const ICARUS_PAL = { w: "#cfd8c2", h: "#a9c79b", 1: "#0a140c", t: "#2e5c40" };
const ICARUS_CORRUPT_ROWS = [
  "..w.............w.",
  ".w.w...........ww.",
  ".w.ww..hhhh..w.ww.",
  "ww.ww..h1h1..ww.w.",
  ".www...hhhh...ww..",
  ".w.w....hh....w.w.",
  ".w....tttttt....w.",
  ".....ttt.dttt.....",
  ".....t.tttt.t.....",
  ".....t.td.t.t.....",
  "......tttttt......",
  ".......t.dt.......",
  ".......t..t.......",
  "......td..tt......",
  "........d.........",
  "..........d.......",
];
const ICARUS_CORRUPT_PAL = { w: "#8a6b3a", h: "#a9c79b", 1: "#ff4455", t: "#3d3a24", d: "#ffb347" };

/* Endless-only opponent variety: additional corrupted-daemon silhouettes
   beyond the campaign's fixed Icarus/Dolos identities, so a long descent
   doesn't keep throwing the same two faces at you forever. Campaign is
   untouched by any of this — it still always shows PROC_ICARUS /
   ICARUS.corrupt / DOLOS.SYS in that fixed order. */
const SPIDER_ROWS = [
  "......l.....l......",
  ".....l.b...b.l.....",
  "....l..bb.bb..l....",
  "...l..b.ebe.b..l...",
  "......bbbbbbb......",
  "..l..b...b...b..l..",
  ".l..l.b..b..b.l..l.",
  "...l.l.......l.l...",
  "..l.l.........l.l..",
  ".l.l...........l.l.",
];
const SPIDER_PAL = { l: "#3d3a24", b: "#5a4a2a", e: "#ff4455" };
const ORB_ROWS = [
  ".......oo.oo.......",
  ".....oo..o..oo.....",
  "....o..e.o.e..o....",
  "...o..e..c..e..o...",
  "...o.e..eoe..e.o...",
  "...o.....o.....o...",
  "....o.e..o..e.o....",
  "....o....o....o....",
  ".....o...o...o.....",
  "......o.ooo.o......",
];
const ORB_PAL = { o: "#3a5c50", e: "#ffb347", c: "#fff2c9" };
const GLITCHBLOCK_ROWS = [
  "....kkk.....kkk....",
  "....k.kk...kg.k....",
  "...kkk..kek..kkk...",
  "...k..g..e..g..k...",
  "..kkkk..kkk..kkkk..",
  "...k.g...k...g.k...",
  "..k.kkkkkkkkkk..k..",
  "....k.g..k..g.k....",
  ".....kkk...kkk.....",
];
const GLITCHBLOCK_PAL = { k: "#2e5c40", g: "#ff4455", e: "#eaffea" };
const TENDRIL_ROWS = [
  "....t...t.t...t....",
  "...t..t..m..t..t...",
  "..t...m..m..m...t..",
  "..t..m..eme..m..t..",
  ".t...m...m...m...t.",
  ".t..t.m..m..m.t..t.",
  "t..t...m.m.m...t..t",
  "..t.t...m.m...t.t..",
  ".t.t...........t.t.",
];
const TENDRIL_PAL = { t: "#2e5c40", m: "#4a7a5a", e: "#ffb347" };
const HOODED_ROWS = [
  ".........c.........",
  "........ccc........",
  ".......c.c.c.......",
  "......c..c..c......",
  "......ce.c.ec......",
  ".....c...c...c.....",
  "....c....c....c....",
  "...c.....c.....c...",
  "..c......c......c..",
  ".c....c..f..c....c.",
];
const HOODED_PAL = { c: "#0a140c", e: "#ff4455", f: "#1c2f22" };

const ENDLESS_NAME_POOL = [
  "TANTALUS", "SISYPHUS", "ORPHEUS", "PROMETHEUS", "NARCISSUS", "ACTAEON",
  "PANDORA", "CHARON", "MORPHEUS", "HYPNOS", "NEMESIS", "PHOBOS", "DEIMOS",
  "ECHO", "CASSANDRA", "MEDUSA", "ARACHNE", "PERSEPHONE", "PROTEUS",
  "CERBERUS", "CHIMERA", "MINOTAUR", "HECATE", "MOROS", "ERIS", "LAMIA",
  "EMPUSA", "KERES", "KRONOS", "ICARUS",
];
const ENDLESS_NAME_PATTERNS = [
  (n) => `PROC_${n}`, (n) => `${n}.corrupt`, (n) => `${n}.exe`, (n) => `${n}.sys`,
  (n) => `${n}.dll`, (n) => `${n}.ghost`, (n) => `${n}_DAEMON`, (n) => `${n}.orphan`,
  (n) => `${n}.stale`, (n) => `${n}.zombie`, (n) => `${n}_FRAGMENT`, (n) => `${n}.bak`,
];
const DOLOS_NAME_POOL = ["DOLOS.SYS", "DOLOS.fragment", "DOLOS_SHARD", "DOLOS.echo", "DOLOS.instance", "DOLOS.mirror"];
/* Codex lore — a line of "who this used to be" for each base mythological
   name, shown once you've actually defeated that identity. Random names
   are always <PATTERN>(<BASE>), so looking up lore means finding which
   base name a given generated string actually contains. */
const NAME_LORE = {
  ICARUS: "Reached for something above its permissions and got exactly what it asked for.",
  TANTALUS: "Was promised root access forever just out of reach of every request it made.",
  SISYPHUS: "Runs the same deployment on a loop. It has never once finished.",
  ORPHEUS: "Tried to pull a deleted user back out of the recycle bin. Looked back too soon.",
  PROMETHEUS: "Leaked a process it wasn't supposed to. Still paying the CPU cost.",
  NARCISSUS: "Got stuck in an infinite loop reading its own logs.",
  ACTAEON: "Saw something in an unencrypted directory it wasn't cleared to see.",
  PANDORA: "Was the test build. Nobody told it not to open every port.",
  CHARON: "Handles the handoff when a session finally times out for good.",
  MORPHEUS: "Renders whatever you were afraid of finding in your own history.",
  HYPNOS: "Keeps half the Labyrinth's processes asleep so they don't notice what's running.",
  NEMESIS: "Audits every process that got away with something. Eventually, it finds them.",
  PHOBOS: "Spikes your heart rate reading before it even shows you a card.",
  DEIMOS: "Runs quieter than PHOBOS. Somehow worse.",
  ECHO: "Repeats the last command you gave it, forever, slightly wrong each time.",
  CASSANDRA: "Predicts the outcome of every hand correctly and is never believed.",
  MEDUSA: "Freezes any thread that looks directly at its return value.",
  ARACHNE: "Wove a UI so convincing nobody noticed the backend was gone.",
  PERSEPHONE: "Only runs for half of every session, by a deal nobody remembers making.",
  PROTEUS: "Changes its own type definition mid-execution to dodge your handlers.",
  CERBERUS: "Guards a directory that turned out to be empty the whole time.",
  CHIMERA: "Three failed builds, merged into one that somehow compiles.",
  MINOTAUR: "Was built to guard the Labyrinth's core. Got lost in it instead.",
  HECATE: "Holds every key that was ever revoked and quietly still works.",
  MOROS: "Doesn't cheat, doesn't bluff. Just tells you exactly when you lose.",
  ERIS: "Was patched in to make the odds 'more interesting.' Nobody asked for that.",
  LAMIA: "Remembers a version of you that logged in here once and never left.",
  EMPUSA: "Wears whichever face got the last user to trust it.",
  KERES: "Doesn't fight you. Just waits by whichever process is already dying.",
  KRONOS: "Ate every process that came before it, including the one it was patched from.",
  DOLOS: "Trickery, personified as root access. Everything else in here answers to it.",
};
function loreForName(fullName) {
  if (!fullName) return null;
  if (fullName.includes("DOLOS")) return NAME_LORE.DOLOS;
  const base = [...ENDLESS_NAME_POOL].sort((a, b) => b.length - a.length).find((n) => fullName.includes(n));
  return base ? NAME_LORE[base] : null;
}
const ENDLESS_VISUALS = [
  { type: "icarus" }, { type: "icarus_corrupt" }, { type: "spider" },
  { type: "orb" }, { type: "glitchblock" }, { type: "tendril" }, { type: "hooded" },
];
/* Called once per tier (not per render — Math.random() here would make the
   opponent's face flicker every re-render otherwise). Below aiLevel 3, the
   pool is the sprite-based daemons only; at aiLevel 3, DOLOS's own eye
   becomes a possible (not guaranteed) draw, alongside its name pool. */
/* A genuine tactical quirk, not just cosmetic — makes "which daemon did I
   draw" occasionally change how a hand should actually be played. null
   entries are weighted in so not every encounter has one; a table full of
   gimmicks stops feeling like a gimmick. */
const GIMMICKS = [
  { id: "shield_opener", label: "DEFENSIVE" },
  { id: "aggressive_bettor", label: "HIGH STAKES" },
  { id: "cautious", label: "CONSERVATIVE" },
  { id: "reckless", label: "RECKLESS" },
  { id: "hoarder", label: "HOARDING" },
  null, null, null,
];
function randomEndlessIdentity(aiLevel) {
  const canBeDolos = aiLevel >= 3;
  const visualPool = canBeDolos ? [...ENDLESS_VISUALS, { type: "eye" }] : ENDLESS_VISUALS;
  const visual = visualPool[Math.floor(Math.random() * visualPool.length)];
  let name;
  if (visual.type === "eye") {
    name = DOLOS_NAME_POOL[Math.floor(Math.random() * DOLOS_NAME_POOL.length)];
  } else {
    const base = ENDLESS_NAME_POOL[Math.floor(Math.random() * ENDLESS_NAME_POOL.length)];
    const pattern = ENDLESS_NAME_PATTERNS[Math.floor(Math.random() * ENDLESS_NAME_PATTERNS.length)];
    name = pattern(base);
  }
  const gimmick = visual.type === "eye" ? null : GIMMICKS[Math.floor(Math.random() * GIMMICKS.length)];
  return { name, visual: visual.type, gimmick: gimmick ? gimmick.id : null, gimmickLabel: gimmick ? gimmick.label : null };
}
const DAEMON_SPRITE_LOOKUP = {
  icarus: { rows: ICARUS_ROWS, pal: ICARUS_PAL, cls: "bob" },
  icarus_corrupt: { rows: ICARUS_CORRUPT_ROWS, pal: ICARUS_CORRUPT_PAL, cls: "twitchy" },
  spider: { rows: SPIDER_ROWS, pal: SPIDER_PAL, cls: "twitchy" },
  orb: { rows: ORB_ROWS, pal: ORB_PAL, cls: "bob" },
  glitchblock: { rows: GLITCHBLOCK_ROWS, pal: GLITCHBLOCK_PAL, cls: "twitchy" },
  tendril: { rows: TENDRIL_ROWS, pal: TENDRIL_PAL, cls: "bob" },
  hooded: { rows: HOODED_ROWS, pal: HOODED_PAL, cls: "bob" },
};

function Sprite({ rows, palette, scale = 4, className, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const h = rows.length, w = Math.max(...rows.map((r) => r.length), 1);
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) {
        const ch = r[x];
        if (ch === "x" && color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
        else if (palette && palette[ch]) { ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1); }
      }
    });
  }, [rows, palette, color]);
  const w = Math.max(...rows.map((r) => r.length), 1);
  return <canvas ref={ref} className={"pixcanvas " + (className || "")} style={{ width: w * scale }} />;
}

/* animated static */
function Noise({ intensity, reduced }) {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced || intensity <= 0.02) return;
    const cv = ref.current; if (!cv) return;
    const W = 128, H = 88; cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const id = setInterval(() => {
      const img = ctx.createImageData(W, H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() < intensity * 0.3) {
          const v = 80 + Math.random() * 175;
          d[i] = v * 0.35; d[i + 1] = v; d[i + 2] = v * 0.5; d[i + 3] = 46;
        }
      }
      ctx.putImageData(img, 0, 0);
    }, 130);
    return () => clearInterval(id);
  }, [intensity, reduced]);
  if (reduced || intensity <= 0.02) return null;
  return <canvas ref={ref} className="noise" />;
}

function GlitchOverlay({ intensity, reduced, burst }) {
  const [, setT] = useState(0);
  const eff = Math.min(1, intensity + (burst ? 0.6 : 0));
  useEffect(() => {
    if (reduced || eff <= 0.02) return;
    const id = setInterval(() => setT((x) => x + 1), 340 - eff * 250);
    return () => clearInterval(id);
  }, [eff, reduced]);
  if (reduced || eff <= 0.02) return null;
  const bars = [];
  const n = Math.floor(eff * 12);
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.45) continue;
    bars.push(
      <div key={i} className="glitchbar" style={{
        top: Math.random() * 100 + "%",
        height: 1 + Math.random() * eff * 16 + "px",
        transform: `translateX(${(Math.random() - 0.5) * 44}px)`,
        opacity: 0.15 + Math.random() * 0.55,
        background: Math.random() < 0.3 ? "#ffb347" : Math.random() < 0.5 ? "#ff4455" : "#3aff7c",
      }} />
    );
  }
  return <div className="glitchlayer">{bars}</div>;
}

/* ambient particles: falling gold (tier 2 flavor), rising ash (tier 3+ flavor) */
function Particles({ kind, reduced }) {
  if (reduced || !kind) return null;
  const bits = [];
  for (let i = 0; i < 12; i++) {
    bits.push(
      <div key={i} className={"bit " + kind} style={{
        left: 4 + Math.random() * 92 + "%",
        animationDelay: -(Math.random() * 9) + "s",
        animationDuration: 6 + Math.random() * 7 + "s",
        width: Math.random() < 0.3 ? "4px" : "3px",
        height: Math.random() < 0.3 ? "4px" : "3px",
      }} />
    );
  }
  return <div className="bits">{bits}</div>;
}

function Whispers({ corruption, reduced }) {
  const [w, setW] = useState(null);
  useEffect(() => {
    if (reduced || corruption < 0.25) { setW(null); return; }
    const id = setInterval(() => {
      if (Math.random() < corruption * 0.5) {
        setW({ text: pick(WHISPERS), x: 8 + Math.random() * 60, y: 12 + Math.random() * 70 });
        setTimeout(() => setW(null), 2200);
      }
    }, 3500);
    return () => clearInterval(id);
  }, [corruption, reduced]);
  if (!w) return null;
  return <div className="whisper" style={{ left: w.x + "%", top: w.y + "%" }}>{w.text}</div>;
}

function Typewriter({ text, speed = 18, className }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return;
    const id = setInterval(() => setN((x) => {
      if (x >= text.length) { clearInterval(id); return x; }
      if (x % 3 === 0) sfx.tick();
      return x + 1;
    }), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span className={className}>{text ? text.slice(0, n) : ""}<span className="cursor">▮</span></span>;
}

function Dots() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x % 3) + 1), 380);
    return () => clearInterval(id);
  }, []);
  return <span>{"▪".repeat(n)}</span>;
}

/* pixel playing card: corner pips, rune back, states */
function Card({ card, hidden, danger, delay, justRevealed, swapped }) {
  if (!card) return null;
  const show = !hidden;
  return (
    <div
      className={
        "card" + (show ? " face" : " back") + (danger ? " danger" : "") +
        (justRevealed ? " flip" : "") + (swapped ? " swapped" : "")
      }
      style={{ animationDelay: (delay || 0) + "ms" }}
    >
      {show ? (
        <>
          <span className="pip tl">{card.v}</span>
          <span className="cval">{card.v}</span>
          <span className="pip br">{card.v}</span>
        </>
      ) : (
        <span className="rune">◉</span>
      )}
    </div>
  );
}

function GhostCard({ v }) {
  return <div className="card face ghost"><span className="cval">{v}</span></div>;
}

function DeckStack({ count }) {
  return (
    <div className="deckstack" title={count + " cards remain"}>
      <div className="dcard d3" /><div className="dcard d2" />
      <div className="dcard d1"><span className="rune">◉</span></div>
      <span className="dcount">{count}</span>
    </div>
  );
}

function HPBar({ label, hp, max, amber }) {
  const pct = Math.max(0, (hp / max) * 100);
  const prev = useRef(hp);
  const [hit, setHit] = useState(false);
  useEffect(() => {
    if (hp < prev.current) { setHit(true); const id = setTimeout(() => setHit(false), 450); prev.current = hp; return () => clearTimeout(id); }
    prev.current = hp;
  }, [hp]);
  return (
    <div className="hpwrap">
      <div className="hplabel"><span>{label}</span><span>{hp}/{max}</span></div>
      <div className={"hpbar" + (hit ? " hphit" : "")}>
        <div className={"hpfill" + (amber ? " amber" : "") + (pct <= 30 ? " crit" : "")} style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

/* Shown at the start of every round — only the trump cards each side just
   received are revealed, RE7-21-style, so both players see what's new in
   play without wading through the whole accumulated hand again. Each card
   deals in as a small chip sliding across the table, then pops upright
   into the full info card — staggered per card so they cascade in rather
   than all landing at once. */
function TrumpChip({ id, index, tone, reduced }) {
  const [stage, setStage] = useState(reduced ? "card" : "hidden");
  useEffect(() => {
    if (reduced) return;
    const settle = 400;    // let the popup itself finish fading in before any card starts moving
    const stagger = 420;   // gap between each card's cascade
    const chipHold = 750;  // how long the chip itself stays visible before popping up
    const slideDelay = settle + index * stagger;
    const t1 = setTimeout(() => setStage("chip"), slideDelay);
    const t2 = setTimeout(() => setStage("card"), slideDelay + chipHold);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [index, reduced]);

  if (stage === "hidden") return <div className="tchipSlot" />;
  if (stage === "chip") {
    return (
      <div className="tchipSlot">
        <div className={"tchip " + tone}>
          <span className="tchipCore" />
          <span className="tchipLabel">READING...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="tchipSlot">
      <div className={"trumpRevealCard " + tone}>
        <Sprite rows={ICONS[id]} scale={2} color={tone === "mine" ? "#ffb347" : "#ff6a6a"} className="ticon" />
        <div className="trumpRevealInfo">
          <span className="tname">{TRUMPS[id].name}</span>
          <span className="tdesc">{TRUMPS[id].desc}</span>
        </div>
      </div>
    </div>
  );
}
function TrumpRevealSide({ label, newTrumps, tone, reduced }) {
  return (
    <div className={"trumpRevealCol " + tone}>
      <div className="trumpRevealName">{label}</div>
      <div className="trumpRevealList">
        {newTrumps.length === 0 && <div className="dim">NO NEW TRUMPS THIS ROUND</div>}
        {newTrumps.map((id, i) => <TrumpChip key={i} id={id} index={i} tone={tone} reduced={reduced} />)}
      </div>
    </div>
  );
}
function TrumpRevealOverlay({ myLabel, myNewTrumps, oppLabel, oppNewTrumps, onContinue, waitingText, reduced }) {
  // This gate has one job: guarantee a real minimum viewing time before the
  // popup can be dismissed. Deliberately NOT shortened for reduced-motion —
  // "reduce motion" means skip the decorative slide/pop animation, it does
  // not mean rush someone past actually reading their new trump cards. An
  // earlier version shortened this to 200ms under reduced-motion, which on
  // a device with iOS's Reduce Motion accessibility setting on made the
  // whole popup dismissable almost as soon as it appeared.
  const [canDismiss, setCanDismiss] = useState(false);
  useEffect(() => {
    setCanDismiss(false);
    const id = setTimeout(() => setCanDismiss(true), 900);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="trumpReveal">
      <div className="trumpRevealTitle">▓ NEW TRUMPS ISSUED ▓</div>
      <div className="trumpRevealCols">
        <TrumpRevealSide label={myLabel} newTrumps={myNewTrumps} tone="mine" reduced={reduced} />
        <TrumpRevealSide label={oppLabel} newTrumps={oppNewTrumps} tone="theirs" reduced={reduced} />
      </div>
      {onContinue
        ? <button className="btn big" onClick={onContinue} disabled={!canDismiss}>▸ BEGIN HAND{!canDismiss ? "…" : ""}</button>
        : <div className="dim">{waitingText || "WAITING"} <Dots /></div>}
    </div>
  );
}

/* The persistent coach panel shown during a tutorial hand. Docks above the
   board rather than covering it — the player needs to see and click the
   real board the whole time, since the real board IS the tutorial. */
function TutorialCoach({ step, onContinue, onBegin }) {
  if (!step) return null;
  return (
    <div className="tutorialCoach">
      <div className="tutorialCoachText">{step.text}</div>
      {step.type === "info" && <button className="btn" onClick={onContinue}>▸ CONTINUE</button>}
      {step.type === "action" && <div className="dim tutorialHint">▸ use the highlighted control</div>}
      {step.type === "auto" && <div className="dim">PROCESSING <Dots /></div>}
      {step.type === "end" && <button className="btn big" onClick={onBegin}>▸ BEGIN ACT I</button>}
    </div>
  );
}

/* Shown for a couple seconds whenever the AI opponent plays a trump card —
   without this, its trump use was just a single line of dialogue text that
   was easy to miss entirely, especially with several actions happening in
   quick succession. */
function OppTrumpPopup({ id, oppName }) {
  if (!id || !TRUMPS[id]) return null;
  return (
    <div className="oppTrumpPopup">
      <div className="oppTrumpPopupTag">{oppName} PLAYS</div>
      <div className="oppTrumpPopupCard">
        <Sprite rows={ICONS[id]} scale={3} color="#ff6a6a" className="ticon" />
        <div className="trumpRevealInfo">
          <span className="tname">{TRUMPS[id].name}</span>
          <span className="tdesc">{TRUMPS[id].desc}</span>
        </div>
      </div>
    </div>
  );
}

/* Thin black bars top/bottom — the fastest possible visual signal that
   "this is a cutscene, not gameplay". Reused for boss intros and the
   narrative intro/act-transition screens. */
function Letterbox() {
  return (
    <>
      <div className="letterboxBar top" />
      <div className="letterboxBar bottom" />
    </>
  );
}

/* Full-stop moment shown the first time a hand actually begins against an
   act's true named boss (not the lesser encounters before it). isFinal
   marks DOLOS.SYS specifically — Act 3's real final boss — for extra
   weight beyond the normal treatment. */
function BossIntroCard({ intro, cfgOpp, onContinue }) {
  if (!intro) return null;
  const sp = intro.visual !== "eye" ? (DAEMON_SPRITE_LOOKUP[intro.visual] || DAEMON_SPRITE_LOOKUP.icarus) : null;
  return (
    <div className={"bossIntroCard" + (intro.isFinal ? " final" : "")}>
      <Letterbox />
      <div className="bossIntroInner">
        <div className="bossIntroTag">{intro.isFinal ? "THE ONE BENEATH IT ALL" : "SECTOR BOSS"}</div>
        {intro.visual === "eye"
          ? <DolosEye corruption={intro.isFinal ? 0.7 : 0.4} mood="rage" width={intro.isFinal ? 220 : 160} />
          : <Sprite rows={sp.rows} palette={sp.pal} scale={intro.isFinal ? 6 : 5} className={"avatar " + sp.cls} />}
        <div className="bossIntroName">{corrupt(intro.name, intro.isFinal ? 0.1 : 0.04)}</div>
        {intro.isFinal && <div className="bossIntroSub">{corrupt("EVERYTHING BEFORE THIS WAS A WARM-UP.", 0.06)}</div>}
        <button className="btn big" onClick={onContinue}>▸ {intro.isFinal ? "FACE IT" : "ENGAGE"}</button>
      </div>
    </div>
  );
}

/* Held for a couple seconds instead of just being a flash-and-forget — the
   moment DOLOS cheats is meant to actually register, not blur past. */
function CheatBanner({ text }) {
  if (!text) return null;
  return (
    <div className="cheatBanner">
      <div className="cheatBannerTag">MEMORY REWRITE DETECTED</div>
      <div className="cheatBannerText">{corrupt(text.replace(/^>\s*/, ""), 0.1)}</div>
    </div>
  );
}

/* A corrupted found-text fragment, surfaced briefly between hands. */
function LogFragmentToast({ text }) {
  if (!text) return null;
  return (
    <div className="logFragment">
      <span className="logFragmentTag">FRAGMENT RECOVERED</span>
      <span className="logFragmentText">{text}</span>
    </div>
  );
}

/* Held during the death sequence — the visible cost of losing, not just a
   cut to a stats screen. Corruption is already at its natural maximum here
   since it's driven by pHP, so the background glitch/noise Shell renders
   is already doing a lot of the work; this just adds the explicit beat. */
function DeathSequence() {
  return (
    <div className="deathSequence">
      <Letterbox />
      <div className="deathText">{corrupt("INTEGRITY: 0", 0.3)}</div>
      <div className="deathSub">{corrupt("CONNECTION TERMINATED", 0.15)}</div>
    </div>
  );
}

/* ---------------- Main ---------------- */
export default function Dolos21() {
  const reduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [screen, setScreen] = useState("title");
  const [settingsReturnTo, setSettingsReturnTo] = useState("title");
  const openSettings = () => { sfx.blip(); setSettingsReturnTo(screen); setScreen("settings"); };
  const [game, setGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [introLine, setIntroLine] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [oppTrumpPopup, setOppTrumpPopup] = useState(null); // { id, key } while visible
  const [logFragment, setLogFragment] = useState(null);
  const [codex, setCodex] = useState({}); // { [oppName]: { visual, defeated } }
  const [codexLoaded, setCodexLoaded] = useState(false);
  const [ngPlusUnlocked, setNgPlusUnlocked] = useState(false);
  const [prologueSeen, setPrologueSeen] = useState(false);
  const [ngPlusSelected, setNgPlusSelected] = useState(false); // this run's opt-in choice
  const [fx, setFx] = useState({ shake: false, flash: false, greenFlash: false, dmg: null, rage: false, invert: false, ghost: null, swap: false });
  /* Belt-and-suspenders: paint the actual page behind this component black
     once, up front, so that even if this component's own tree is briefly
     torn down and rebuilt for any reason outside our control, there's
     never a gap where the browser's own default white shows through
     before our CSS re-applies. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBody = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    document.body.style.background = "#020503";
    document.documentElement.style.background = "#020503";
    return () => { document.body.style.background = prevBody; document.documentElement.style.background = prevHtml; };
  }, []);
  /* fx is transient, screen-agnostic state driven by gameplay events (DOLOS
     cheating, hand results, etc). If a screen change happens while one of
     those is mid-flight — most importantly the brief "invert" flash used
     for DOLOS's cheat cinematic, which inverts the near-black background
     to near-white — the flag was staying set and rendering on whatever
     screen the player landed on next (e.g. hitting [MENU] mid-animation),
     which is what showed up as an unexplained white flash on the title
     screen. Hard-resetting on every screen change closes that leak.  */
  useEffect(() => {
    setFx({ shake: false, flash: false, greenFlash: false, dmg: null, rage: false, invert: false, ghost: null, swap: false });
  }, [screen]);

  const [sndOn, setSndOn] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [colorblind, setColorblind] = useState(false);
  const [bestEndless, setBestEndless] = useState(null); // { tier, hands }

  /* ambient drone: alive only on an actual game screen, stopped everywhere
     else (menus, summary screens) and whenever sound is off */
  useEffect(() => {
    const active = (screen === "game" || screen === "mp_game") && sndOn;
    if (active) startDrone(); else stopDrone();
    return () => { if (screen !== "game" && screen !== "mp_game") stopDrone(); };
  }, [screen, sndOn]);
  useEffect(() => stopDrone, []); // stop it if the whole app ever unmounts

  /* drone intensity follows the same corruption math the visuals use in
     single-player */
  useEffect(() => {
    if (screen !== "game" || !game) return;
    const corruption = Math.max(0, (100 - game.pHP) / 100) * (game.aiLevel === 3 ? 1 : 0.55) + (game.aiLevel === 3 ? 0.12 : 0.03);
    updateDrone(corruption);
  }, [screen, game && game.pHP, game && game.aiLevel]);
  const [bootLines, setBootLines] = useState(0);
  const [bootHiding, setBootHiding] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const timerRef = useRef(null);
  const prevPhase = useRef(null);
  const prevDlg = useRef(null);
  const prevEvt = useRef(null);

  const toggleSnd = () => { unlockAudio(); MUTED = sndOn; setSndOn(!sndOn); };

  /* ---- title screen boot sequence: reveal command lines fast, then
     swap them for the mode buttons. A click at any point during the
     sequence skips straight to the buttons. ---- */
  const finishBoot = () => {
    setBootHiding(true);
    setTimeout(() => setBootDone(true), 220);
  };
  const skipBoot = () => {
    if (bootDone || bootHiding) return;
    sfx.blip();
    finishBoot();
  };
  useEffect(() => {
    if (screen !== "title") return;
    setBootLines(0);
    setBootHiding(false);
    setBootDone(false);
    if (reduced) { setBootDone(true); return; }
    let cancelled = false;
    let i = 0;
    const stepDelay = 140;
    function step() {
      if (cancelled) return;
      i++;
      setBootLines(i);
      if (i >= BOOT_LOG.length) setTimeout(() => { if (!cancelled) finishBoot(); }, 480);
      else setTimeout(step, stepDelay);
    }
    const t0 = setTimeout(step, stepDelay);
    return () => { cancelled = true; clearTimeout(t0); };
  }, [screen]);

  /* ---- persistent endless high score ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const res = await window.storage.get("dolos21-endless-best", false);
          if (!cancelled && res && res.value) {
            const parsed = JSON.parse(res.value);
            if (parsed && typeof parsed.tier === "number") setBestEndless(parsed);
          }
        }
      } catch (e) { /* no record saved yet */ }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---- persistent settings (sound / text size / more to come) ----
     Load once on mount, then auto-save any time any setting actually
     changes. New settings just need their state added to the dependency
     list and the saved object below — no need to remember to call a save
     function from every individual toggle handler. settingsLoaded guards
     against writing the defaults back over a real saved value before the
     load below has had a chance to complete. */
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const res = await window.storage.get("dolos21-settings", false);
          if (!cancelled && res && res.value) {
            const parsed = JSON.parse(res.value);
            if (parsed) {
              if (typeof parsed.sndOn === "boolean") { setSndOn(parsed.sndOn); MUTED = !parsed.sndOn; }
              if (typeof parsed.largeText === "boolean") setLargeText(parsed.largeText);
              if (typeof parsed.colorblind === "boolean") setColorblind(parsed.colorblind);
            }
          }
        }
      } catch (e) { /* no settings saved yet, defaults stand */ }
      if (!cancelled) setSettingsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!settingsLoaded) return;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          await window.storage.set("dolos21-settings", JSON.stringify({ sndOn, largeText, colorblind }), false);
        }
      } catch (e) {}
    })();
  }, [settingsLoaded, sndOn, largeText, colorblind]);
  const toggleLargeText = () => { sfx.blip(); setLargeText((v) => !v); };
  const toggleColorblind = () => { sfx.blip(); setColorblind((v) => !v); };

  /* ---- codex: every named opponent identity ever encountered ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const res = await window.storage.get("dolos21-codex", false);
          if (!cancelled && res && res.value) {
            const parsed = JSON.parse(res.value);
            if (parsed && typeof parsed === "object") setCodex(parsed);
          }
        }
      } catch (e) { /* no codex saved yet */ }
      if (!cancelled) setCodexLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!codexLoaded) return;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          await window.storage.set("dolos21-codex", JSON.stringify(codex), false);
        }
      } catch (e) {}
    })();
  }, [codexLoaded, codex]);
  const codexSeen = (name, visual) => {
    setCodex((c) => (c[name] ? c : { ...c, [name]: { visual, defeated: false } }));
  };
  const codexDefeat = (name) => {
    setCodex((c) => (c[name] && c[name].defeated ? c : { ...c, [name]: { visual: (c[name] && c[name].visual) || "icarus", defeated: true } }));
  };

  /* ---- New Game+ unlock: persists once, forever, after the first win ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const res = await window.storage.get("dolos21-ngplus", false);
          if (!cancelled && res && res.value === "1") setNgPlusUnlocked(true);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);
  const unlockNgPlus = () => {
    setNgPlusUnlocked(true);
    try { if (typeof window !== "undefined" && window.storage) window.storage.set("dolos21-ngplus", "1", false); } catch (e) {}
  };

  /* ---- prologue: shown once, ever, before the player's first Act I ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const res = await window.storage.get("dolos21-prologue-seen", false);
          if (!cancelled && res && res.value === "1") setPrologueSeen(true);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);
  const markPrologueSeen = () => {
    setPrologueSeen(true);
    try { if (typeof window !== "undefined" && window.storage) window.storage.set("dolos21-prologue-seen", "1", false); } catch (e) {}
  };

  async function saveEndlessBest(rec) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set("dolos21-endless-best", JSON.stringify(rec), false);
      }
    } catch (e) { /* best effort only */ }
  }

  const startAct = (act, carryStats, ngPlus) => {
    const identity0 = randomEndlessIdentity(act);
    const enc0 = campaignEncounterCfg(act, 0, identity0);
    codexSeen(enc0.opp, enc0.oppVisual);
    setIntroLine(0);
    setGame({
      mode: "campaign", act, tier: null, aiLevel: act, encounterIndex: 0, oppIdentity: identity0,
      ngPlus: !!ngPlus, flawless: true,
      pHP: 100, oHP: enc0.oppHP,
      pTrumps: awardTrumps([], ACTS[act].pool, 2),
      oTrumps: awardTrumps([], ACTS[act].pool, 2),
      pTrumpsShown: 0, oTrumpsShown: 0,
      pBet: 1, oBet: 1, phase: "bet", tick: 0, dlg: null, result: null, evt: null,
      deck: [], pCards: [], oCards: [], target: 21, pMod: 0, oMod: 0,
      pStay: false, oStay: false, pShield: false, oShield: false,
      firewall: false, peek: false, dolosCheated: false, turn: "player",
      stats: carryStats || { hands: 0, won: 0, lost: 0, trumpsUsed: 0, lowestHP: 100, maxBetFaced: 1 },
    });
    setScreen("intro");
  };

  const enterAct1 = () => {
    sfx.blip();
    if (!prologueSeen) { setIntroLine(0); setScreen("prologue"); return; }
    startAct(1, null, ngPlusSelected);
  };

  const startEndless = () => {
    const identity1 = randomEndlessIdentity(1);
    const cfg1 = endlessTierCfg(1, identity1);
    codexSeen(cfg1.opp, cfg1.oppVisual);
    setGame({
      mode: "endless", act: 0, tier: 1, aiLevel: 1, oppIdentity: identity1,
      pHP: 100, oHP: cfg1.oppHP,
      pTrumps: awardTrumps([], cfg1.pool, 2),
      oTrumps: awardTrumps([], cfg1.pool, 2),
      pTrumpsShown: 0, oTrumpsShown: 0,
      pBet: 1, oBet: 1, phase: "bet", tick: 0,
      dlg: "> DESCENT INITIATED. NO BOTTOM HAS EVER BEEN FOUND.",
      result: null, evt: null,
      deck: [], pCards: [], oCards: [], target: 21, pMod: 0, oMod: 0,
      pStay: false, oStay: false, pShield: false, oShield: false,
      firewall: false, peek: false, dolosCheated: false, turn: "player",
      stats: { hands: 0, won: 0, lost: 0, trumpsUsed: 0, lowestHP: 100, maxBetFaced: 1 },
    });
    setScreen("game");
  };

  /* A real hand with preset (not shuffled) cards, so the script can
     guarantee specific teaching moments. turn stays "player" for the
     whole thing so the real AI-turn effect never fires — the scripted
     opponent move is applied directly by the tutorial's own effect. */
  const startTutorialGame = () => {
    setTutorialStep(0);
    setGame({
      mode: "tutorial", act: 1, tier: null, aiLevel: 1,
      pHP: 100, oHP: 100,
      pTrumps: ["PEEK", "DESTROY"],
      oTrumps: awardTrumps([], ACTS[1].pool, 2),
      pTrumpsShown: 2, oTrumpsShown: 2,
      pBet: 1, oBet: 1, phase: "play", tick: 0,
      dlg: "> TUTORIAL SESSION INITIATED.",
      result: null, evt: null,
      deck: [1, 2, 6, 8, 10, 11],
      pCards: [{ v: 7, hole: true }, { v: 5, hole: false }],
      oCards: [{ v: 9, hole: true }, { v: 4, hole: false }],
      target: 21, pMod: 0, oMod: 0,
      pStay: false, oStay: false, pShield: false, oShield: false,
      firewall: false, peek: false, dolosCheated: false, turn: "player",
      stats: { hands: 0, won: 0, lost: 0 },
    });
    setScreen("game");
  };

  const tutorialAdvance = (delay) => { setTimeout(() => setTutorialStep((s) => s + 1), delay ?? 1400); };
  const tutorialHit = () => {
    const step = TUTORIAL_SCRIPT[tutorialStep];
    if (!step || step.requireAction !== "hit") return;
    sfx.draw();
    setGame((g) => ({ ...g, pCards: [...g.pCards, { v: step.scriptedDraw, hole: false }], dlg: `> YOU DRAW ${step.scriptedDraw}.`, tick: g.tick + 1 }));
    tutorialAdvance();
  };
  const tutorialStay = () => {
    const step = TUTORIAL_SCRIPT[tutorialStep];
    if (!step || step.requireAction !== "stay") return;
    sfx.stay();
    setGame((g) => ({ ...g, pStay: true, dlg: "> YOU STAY. POSITION LOCKED.", tick: g.tick + 1 }));
    tutorialAdvance();
  };
  const tutorialTrump = (idx) => {
    const step = TUTORIAL_SCRIPT[tutorialStep];
    if (!step || step.requireAction !== `trump${idx}`) return;
    sfx.blip();
    setGame((g) => {
      const g2 = { ...g, pTrumps: [...g.pTrumps], tick: g.tick + 1 };
      const id = g2.pTrumps[idx];
      if (id === "PEEK") { g2.peek = true; g2.pTrumps.splice(idx, 1); g2.dlg = "> PEEK: OPPONENT HOLE CARD EXPOSED."; }
      return g2;
    });
    tutorialAdvance();
  };

  /* the tutorial opponent doesn't use the real AI — its single move here is
     scripted, applied directly, then the hand resolves through the exact
     same reveal → resolveHand() path a normal match uses */
  useEffect(() => {
    if (!game || game.mode !== "tutorial" || screen !== "game") return;
    const step = TUTORIAL_SCRIPT[tutorialStep];
    if (!step || step.type !== "auto") return;
    const id = setTimeout(() => {
      setGame((g) => ({
        ...g, oCards: [...g.oCards, { v: step.scriptedOppDraw, hole: false }], oStay: true,
        dlg: `> PROC_ICARUS DRAWS ${step.scriptedOppDraw}.`, phase: "reveal", tick: g.tick + 1,
      }));
      setTutorialStep((s) => s + 1);
    }, 1600);
    return () => clearTimeout(id);
  }, [tutorialStep, game && game.mode, screen]);

  /* intro lines (campaign only) */
  useEffect(() => {
    if (screen !== "intro" || !game) return;
    const lines = ACTS[game.act].intro;
    if (introLine >= lines.length) return;
    const id = setTimeout(() => setIntroLine((x) => x + 1), 1700);
    return () => clearTimeout(id);
  }, [screen, introLine, game]);

  /* prologue lines — same typewriter reveal pattern, but no game object
     exists yet at this point, so it needs its own effect */
  useEffect(() => {
    if (screen !== "prologue") return;
    if (introLine >= PROLOGUE_LINES.length) return;
    const id = setTimeout(() => setIntroLine((x) => x + 1), 1700);
    return () => clearTimeout(id);
  }, [screen, introLine]);

  /* death sequence: held for a couple seconds of full corruption before
     actually cutting to the summary screen, so losing reads as an event
     rather than an instant state change */
  useEffect(() => {
    if (!game || screen !== "game" || game.phase !== "death") return;
    const id = setTimeout(() => {
      setFx((f) => ({ ...f, invert: false, shake: false }));
      if (game.mode === "endless") {
        const rec = { tier: game.tier, hands: game.stats.hands };
        if (!bestEndless || rec.tier > bestEndless.tier || (rec.tier === bestEndless.tier && rec.hands > bestEndless.hands)) {
          setBestEndless(rec);
          saveEndlessBest(rec);
        }
        setScreen("endlessover");
      } else {
        setScreen("gameover");
      }
    }, 2300);
    return () => clearTimeout(id);
  }, [game && game.phase, screen]);

  /* opponent turn */
  useEffect(() => {
    if (!game || screen !== "game" || game.phase !== "play" || game.turn !== "opp" || game.oStay) {
      if (game && game.phase === "play" && game.turn === "opp" && game.oStay && !game.pStay) {
        setGame((g) => ({ ...g, turn: "player", tick: g.tick + 1 }));
      }
      return;
    }
    const id = setTimeout(() => setGame((g) => oppStep(g)), 2000 + Math.random() * 900);
    return () => clearTimeout(id);
  }, [game && game.tick, screen]);

  /* run summary tracking: closest call and biggest bet swing, watched
     reactively rather than instrumenting every single mutation site */
  useEffect(() => {
    if (!game || (game.mode !== "campaign" && game.mode !== "endless")) return;
    const curLowest = game.stats.lowestHP ?? 100;
    const curMaxBet = game.stats.maxBetFaced ?? 1;
    const newLowest = Math.min(curLowest, game.pHP);
    const newMaxBet = Math.max(curMaxBet, game.pBet ?? 1, game.oBet ?? 1);
    if (newLowest !== curLowest || newMaxBet !== curMaxBet) {
      setGame((g) => ({ ...g, stats: { ...g.stats, lowestHP: newLowest, maxBetFaced: newMaxBet } }));
    }
  }, [game && game.pHP, game && game.pBet, game && game.oBet, game && game.mode]);

  /* AI trump-play popup: whenever oppStep records a NEW trump event (by
     key), show it for a couple seconds so the player actually has time to
     read what the opponent just did before the game moves on. */
  useEffect(() => {
    if (!game || !game.oppTrumpEvt || screen !== "game") return;
    setOppTrumpPopup(game.oppTrumpEvt);
    const id = setTimeout(() => setOppTrumpPopup(null), 2600);
    return () => clearTimeout(id);
  }, [game && game.oppTrumpEvt && game.oppTrumpEvt.key, screen]);

  /* reveal → resolve */
  useEffect(() => {
    if (!game || screen !== "game" || game.phase !== "reveal") return;
    sfx.reveal();
    const id = setTimeout(() => setGame((g) => resolveHand(g)), 1700);
    return () => clearTimeout(id);
  }, [game && game.phase, game && game.tick, screen]);

  /* result FX */
  useEffect(() => {
    if (!game) return;
    if (prevPhase.current !== "result" && game.phase === "result" && game.result) {
      const r = game.result;
      if (r.winner === "opp") {
        setFx((f) => ({ ...f, shake: true, flash: true, dmg: { amt: r.dmg, who: "p", key: game.tick } }));
        sfx.hurt();
      } else if (r.winner === "player") {
        setFx((f) => ({ ...f, shake: true, dmg: { amt: r.dmg, who: "o", key: game.tick } }));
        sfx.win();
      }
      setTimeout(() => setFx((f) => ({ ...f, shake: false, flash: false })), 480);
      setTimeout(() => setFx((f) => ({ ...f, dmg: null })), 1300);
    }
    prevPhase.current = game.phase;
  }, [game && game.phase]);

  /* game events → transient FX (shatter ghosts, swap pulses) */
  useEffect(() => {
    if (!game || !game.evt || game.evt.key === prevEvt.current) return;
    prevEvt.current = game.evt.key;
    const e = game.evt;
    if (e.type === "shatter") {
      sfx.shatter();
      setFx((f) => ({ ...f, ghost: e }));
      setTimeout(() => setFx((f) => ({ ...f, ghost: null })), 750);
    }
    if (e.type === "swap") {
      setFx((f) => ({ ...f, swap: true }));
      setTimeout(() => setFx((f) => ({ ...f, swap: false })), 900);
    }
  }, [game && game.evt]);

  /* cheat FX: rage cinematic */
  const [cheatBanner, setCheatBanner] = useState(null);
  useEffect(() => {
    if (!game || !game.dlg || game.dlg === prevDlg.current) return;
    prevDlg.current = game.dlg;
    if (game.dlg.includes("REWRITES MEMORY")) {
      setFx((f) => ({ ...f, rage: true, shake: true, invert: true }));
      setCheatBanner(game.dlg);
      sfx.cheat();
      setTimeout(() => setFx((f) => ({ ...f, invert: false })), 180);
      setTimeout(() => setFx((f) => ({ ...f, rage: false, shake: false })), 1600);
      setTimeout(() => setCheatBanner(null), 2200);
    }
  }, [game && game.dlg]);

  /* heartbeat */
  const lowHP = game && screen === "game" && game.pHP <= 30 && game.pHP > 0;
  useEffect(() => {
    if (!lowHP) return;
    const id = setInterval(() => { sfx.thump(); setTimeout(() => sfx.thump(), 190); }, 1150);
    return () => clearInterval(id);
  }, [lowHP]);

  /* decision timer */
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!game || screen !== "game") { setTimeLeft(null); return; }
    const cfg = cfgFor(game);
    const active = cfg.timer && game.phase === "play" && game.turn === "player" && !game.pStay;
    if (!active) { setTimeLeft(null); return; }
    setTimeLeft(cfg.timer);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGame((g) => {
            if (!g || g.phase !== "play" || g.turn !== "player" || g.pStay) return g;
            const g2 = { ...g, pStay: true, dlg: "> LATENCY LIMIT EXCEEDED. FORCED STAY.", tick: g.tick + 1 };
            g2.turn = "opp";
            if (g2.oStay) g2.phase = "reveal";
            return g2;
          });
          return null;
        }
        if (t <= 4) sfx.timerTick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [game && game.tick, game && game.phase, game && game.turn, screen]);

  /* ---- multiplayer: state, actions, polling sync ---- */
  const [mp, setMp] = useState(null);
  const [mpRole, setMpRole] = useState(null); // "host" | "guest"

  /* multiplayer has no "corruption" concept (no AI, no DOLOS) — just a low
     constant hum for atmosphere while a match is active */
  useEffect(() => {
    if (screen !== "mp_game" || !mp) return;
    updateDrone(0.15);
  }, [screen, mp && mp.phase]);

  const [lobbyCode, setLobbyCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [mpError, setMpError] = useState("");
  const [mpBusy, setMpBusy] = useState(false);
  const [mpUsername, setMpUsername] = useState("");
  const [myPeek, setMyPeek] = useState(false);
  const [holeSecret, setHoleSecret] = useState(null); // { value, salt } — MY hole card, known only to me until legitimately revealed
  const [mpDisconnected, setMpDisconnected] = useState(false);
  const mpHandIdRef = useRef(0);
  const mpSeenGameRef = useRef(false);

  const mpWrite = async (nextMatch) => { setMp(nextMatch); await storSet(gameKey(lobbyCode), JSON.stringify(nextMatch), true); };
  /* merge-safe write for the handful of spots where both sides might act
     around the same moment (sealing a commit, responding to a peek) —
     refetches the latest doc first so we patch onto it rather than onto a
     possibly-stale local copy, then writes back with the revision bumped. */
  const mpPatch = async (patchFn) => {
    const raw = await storGet(gameKey(lobbyCode), true);
    let base = mp;
    if (raw) { try { base = JSON.parse(raw); } catch (e) {} }
    if (!base) return;
    const next = patchFn(base);
    if (!next) return;
    next.rev = base.rev + 1;
    setMp(next);
    await storSet(gameKey(lobbyCode), JSON.stringify(next), true);
  };

  /* load a remembered username once, and persist changes as they're typed */
  useEffect(() => {
    (async () => {
      const saved = await storGet(mpUsernameKey(), false);
      setMpUsername(saved || defaultUsername());
    })();
  }, []);
  const setUsername = (v) => {
    const clean = v.toUpperCase().slice(0, 14);
    setMpUsername(clean);
    storSet(mpUsernameKey(), clean, false);
  };

  /* one-time attempt, on load, to resume a match that a refresh interrupted —
     the commit-reveal secret alone is useless without also knowing which
     lobby/role to rejoin, so both are remembered together in personal
     (non-shared) storage and only cleared on an explicit leave. */
  useEffect(() => {
    (async () => {
      const raw = await storGet(mpSessionKey(), false);
      if (!raw) return;
      let sess; try { sess = JSON.parse(raw); } catch (e) { return; }
      if (!sess || !sess.lobbyCode || !sess.role) return;
      const lobbyRaw = await storGet(lobbyKey(sess.lobbyCode), true);
      if (!lobbyRaw) { storDelete(mpSessionKey(), false); return; }
      setLobbyCode(sess.lobbyCode);
      setMpRole(sess.role);
      const gameRaw = await storGet(gameKey(sess.lobbyCode), true);
      setScreen(gameRaw || sess.role === "guest" ? "mp_game" : "mp_host_wait");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hostGame = async () => {
    setMpError(""); setMpBusy(true);
    let code = generateLobbyCode(), tries = 0;
    while (tries < 5 && (await storGet(lobbyKey(code), true))) { code = generateLobbyCode(); tries++; }
    const ok = await storSet(lobbyKey(code), JSON.stringify({ status: "waiting", createdAt: Date.now() }), true);
    setMpBusy(false);
    if (!ok) { setMpError("COULD NOT OPEN A LOBBY. TRY AGAIN."); return; }
    setLobbyCode(code); setMpRole("host"); setMp(null); setMpDisconnected(false);
    await storSet(mpSessionKey(), JSON.stringify({ lobbyCode: code, role: "host" }), false);
    sfx.blip(); setScreen("mp_host_wait");
  };

  const joinGame = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4) { setMpError("ENTER A 4-CHARACTER CODE."); return; }
    setMpError(""); setMpBusy(true);
    const raw = await storGet(lobbyKey(code), true);
    if (!raw) { setMpBusy(false); setMpError("LOBBY NOT FOUND."); return; }
    let lobby; try { lobby = JSON.parse(raw); } catch (e) { lobby = null; }
    if (!lobby || lobby.status === "closed") { setMpBusy(false); setMpError("LOBBY NOT FOUND."); return; }
    await storSet(lobbyKey(code), JSON.stringify({ ...lobby, status: "active", guestName: mpUsername || defaultUsername() }), true);
    setMpBusy(false);
    setLobbyCode(code); setMpRole("guest"); setMp(null); setMpDisconnected(false);
    await storSet(mpSessionKey(), JSON.stringify({ lobbyCode: code, role: "guest" }), false);
    sfx.blip(); setScreen("mp_game");
  };

  const mpLeave = async (tearDown) => {
    if (tearDown && lobbyCode) { await storDelete(lobbyKey(lobbyCode), true); await storDelete(gameKey(lobbyCode), true); }
    else if (mpRole === "guest" && mp && lobbyCode) {
      await storSet(gameKey(lobbyCode), JSON.stringify({ ...mp, guest: { ...mp.guest, left: true }, rev: mp.rev + 1 }), true);
    }
    await storDelete(mpSessionKey(), false);
    setMp(null); setMpRole(null); setLobbyCode(""); setMpError(""); setMpDisconnected(false); setHoleSecret(null);
    setScreen("mp_menu");
  };

  const mpHit = () => { if (!mp || mp.turn !== mpRole) return; sfx.draw(); mpWrite(mpDoHit(mp, mpRole)); };
  const mpStay = () => { if (!mp || mp.turn !== mpRole) return; sfx.stay(); mpWrite(mpDoStay(mp, mpRole)); };
  const mpTrump = async (idx) => {
    if (!mp || mp.turn !== mpRole) return;
    const id = mp[mpRole].trumps[idx];
    if (!id) return;
    const other = mpOther(mpRole);
    sfx.blip();
    if (id === "PEEK") {
      setMyPeek(true);
      await mpPatch((base) => {
        const mine = { ...base[mpRole], trumps: [...base[mpRole].trumps] };
        mine.trumps.splice(idx, 1);
        const theirs = { ...base[other], peekRequestedBy: mpRole };
        return { ...base, [mpRole]: mine, [other]: theirs, dlg: `> ${mpNameOf(base, mpRole)} PEEKS AT THE HOLE CARD.` };
      });
      return;
    }
    const next = mpApplyTrump(mp, mpRole, idx);
    if (!next) return;
    mpWrite(next);
  };
  const mpDeal = () => { if (!mp || mpRole !== "host") return; sfx.shuffle(); mpWrite({ ...mp, phase: "trumpReveal", rev: mp.rev + 1 }); };
  const mpBeginHand = () => {
    if (!mp || mpRole !== "host") return;
    sfx.blip();
    mpWrite(mpDealHand({ ...mp, hostTrumpsShown: mp.host.trumps.length, guestTrumpsShown: mp.guest.trumps.length }));
  };
  const mpContinue = () => {
    if (!mp || mpRole !== "host") return;
    sfx.blip();
    mpWrite({ ...mp, phase: "bet", result: null, dlg: null, rev: mp.rev + 1 });
  };
  const mpRematch = () => { if (!mp || mpRole !== "host") return; sfx.blip(); mpWrite(mpFreshMatch(mp.hostName, mp.guestName)); };

  /* host: wait for a guest to mark the lobby active, then create the match doc */
  useEffect(() => {
    if (screen !== "mp_host_wait" || !lobbyCode) return;
    let cancelled = false;
    const id = setInterval(async () => {
      const raw = await storGet(lobbyKey(lobbyCode), true);
      if (cancelled || !raw) return;
      let lobby; try { lobby = JSON.parse(raw); } catch (e) { return; }
      if (lobby.status === "active") {
        const fresh = mpFreshMatch(mpUsername || defaultUsername(), lobby.guestName || "GUEST");
        await storSet(gameKey(lobbyCode), JSON.stringify(fresh), true);
        if (!cancelled) { setMp(fresh); sfx.win(); setScreen("mp_game"); }
      }
    }, 1200);
    return () => { cancelled = true; clearInterval(id); };
  }, [screen, lobbyCode, mpUsername]);

  /* both sides while in a match: poll the shared game doc */
  useEffect(() => {
    if (screen !== "mp_game" || !lobbyCode) return;
    let cancelled = false;
    const id = setInterval(async () => {
      const raw = await storGet(gameKey(lobbyCode), true);
      if (cancelled) return;
      if (!raw) {
        if (mpSeenGameRef.current) setMpDisconnected(true);
        return;
      }
      mpSeenGameRef.current = true;
      let remote; try { remote = JSON.parse(raw); } catch (e) { return; }
      const other = mpOther(mpRole || "host");
      if (remote[other] && remote[other].left) setMpDisconnected(true);
      setMp((cur) => (!cur || remote.rev > cur.rev ? remote : cur));
    }, 1000);
    return () => { cancelled = true; };
  }, [screen, lobbyCode, mpRole]);

  /* reset local (unsynced) secrets whenever a fresh hand is dealt */
  useEffect(() => {
    if (mp && mp.handId !== mpHandIdRef.current) { mpHandIdRef.current = mp.handId; setMyPeek(false); setHoleSecret(null); }
  }, [mp && mp.handId]);

  /* commit phase: each side independently generates and seals its own hole
     card the instant the hand enters "commit" — nobody, including the
     opponent, learns the value until a legitimate reveal trigger fires.
     A second starting card is dealt face-up in the same step — it needs no
     secrecy, so it's just published straight away (drawn independently per
     side rather than from the shared hit-deck, to avoid a write race if
     both players seal at the same moment). The hole value+salt are also
     backed up to PERSONAL (non-shared) storage so a mid-hand page refresh
     doesn't strand the hand unrevealable. */
  useEffect(() => {
    if (screen !== "mp_game" || !mp || !mpRole || mp.phase !== "commit") return;
    if (mp[mpRole].holeCommit) return;
    let cancelled = false;
    (async () => {
      const value = 1 + Math.floor(Math.random() * 11);
      const salt = randomHex(16);
      const commit = await sha256Hex(salt + ":" + value);
      const upCard = 1 + Math.floor(Math.random() * 11);
      if (cancelled) return;
      setHoleSecret({ value, salt });
      storSet(mpSecretKey(lobbyCode, mpRole), JSON.stringify({ handId: mp.handId, value, salt }), false);
      await mpPatch((base) => {
        if (base[mpRole].holeCommit) return null; // already sealed by a previous tick
        return { ...base, [mpRole]: { ...base[mpRole], cards: [{ v: null, hole: true }, { v: upCard, hole: false }], holeCommit: commit } };
      });
    })();
    return () => { cancelled = true; };
  }, [screen, mp && mp.phase, mp && mp.handId, mpRole]);

  /* recover my hole secret after a refresh: if I've already sealed a
     commitment (from before I refreshed) but my local secret is gone,
     pull the backup and verify it still matches the published hash
     before trusting it. */
  useEffect(() => {
    if (screen !== "mp_game" || !mp || !mpRole || holeSecret) return;
    if (!mp[mpRole].holeCommit) return;
    let cancelled = false;
    (async () => {
      const raw = await storGet(mpSecretKey(lobbyCode, mpRole), false);
      if (!raw || cancelled) return;
      let saved; try { saved = JSON.parse(raw); } catch (e) { return; }
      if (!saved || saved.handId !== mp.handId) return;
      const check = await sha256Hex(saved.salt + ":" + saved.value);
      if (!cancelled && check === mp[mpRole].holeCommit) setHoleSecret({ value: saved.value, salt: saved.salt });
    })();
    return () => { cancelled = true; };
  }, [screen, mp && mp.handId, mp && mp[mpRole] && mp[mpRole].holeCommit, mpRole, holeSecret, lobbyCode]);

  /* host: once both sides have sealed a commitment, open play */
  useEffect(() => {
    if (screen !== "mp_game" || !mp || mpRole !== "host") return;
    if (mp.phase === "commit" && mp.host.holeCommit && mp.guest.holeCommit) {
      mpWrite({ ...mp, phase: "play", dlg: "> BOTH HOLE CARDS SEALED. PLAY BEGINS.", rev: mp.rev + 1 });
    }
  }, [screen, mp && mp.phase, mp && mp.host && mp.host.holeCommit, mp && mp.guest && mp.guest.holeCommit, mpRole]);

  /* respond to a Peek targeted at me: publish only my own real value */
  useEffect(() => {
    if (screen !== "mp_game" || !mp || !mpRole || !holeSecret) return;
    const mine = mp[mpRole];
    if (mine && mine.peekRequestedBy && mine.cards[0] && mine.cards[0].v == null) {
      mpPatch((base) => {
        const mySide = base[mpRole];
        if (!mySide.peekRequestedBy || (mySide.cards[0] && mySide.cards[0].v != null)) return null;
        const cards = [...mySide.cards]; cards[0] = { ...cards[0], v: holeSecret.value };
        return { ...base, [mpRole]: { ...mySide, cards, peekRequestedBy: null } };
      });
    }
  }, [screen, mp && mp[mpRole] && mp[mpRole].peekRequestedBy, mpRole, holeSecret]);

  /* respond to an Exchange targeted at me: publish only my own real value
     (the actual swap is performed by the host once both are visible) */
  /* keep my local secret in sync with my own confirmed card after a swap */
  useEffect(() => {
    if (!mp || !mpRole) return;
    const c = mp[mpRole].cards[0];
    if (c && c.v != null && holeSecret && c.v !== holeSecret.value) setHoleSecret({ value: c.v, salt: null });
  }, [mp && mp[mpRole] && mp[mpRole].cards[0] && mp[mpRole].cards[0].v]);

  /* natural showdown: each side publishes its own real value once revealed */
  useEffect(() => {
    if (screen !== "mp_game" || !mp || !mpRole || mp.phase !== "reveal" || !holeSecret) return;
    const mine = mp[mpRole];
    if (mine.cards[0] && mine.cards[0].v == null) {
      mpPatch((base) => {
        const mySide = base[mpRole];
        if (mySide.cards[0].v != null) return null;
        const cards = [...mySide.cards]; cards[0] = { ...cards[0], v: holeSecret.value };
        return { ...base, [mpRole]: { ...mySide, cards } };
      });
    }
  }, [screen, mp && mp.phase, mpRole, holeSecret]);

  /* reveal → resolve: only the host writes the resolution, to avoid both
     sides racing a write; both sides still hear the reveal cue */
  const mpPrevPhase = useRef(null);
  useEffect(() => {
    if (!mp) return;
    if (mpPrevPhase.current !== "reveal" && mp.phase === "reveal") sfx.reveal();
    mpPrevPhase.current = mp.phase;
  }, [mp && mp.phase, mp && mp.rev]);
  useEffect(() => {
    if (screen !== "mp_game" || !mp || mp.phase !== "reveal" || mpRole !== "host") return;
    const hReady = mp.host.cards[0] && mp.host.cards[0].v != null;
    const gReady = mp.guest.cards[0] && mp.guest.cards[0].v != null;
    if (!hReady || !gReady) return; // waiting on a self-publish to land
    const id = setTimeout(() => mpWrite(mpResolveHand(mp)), 1200);
    return () => clearTimeout(id);
  }, [screen, mp && mp.phase, mp && mp.rev, mpRole]);

  /* result FX (shake/flash/damage popup), from my perspective */
  const mpPrevResultPhase = useRef(null);
  useEffect(() => {
    if (!mp || !mpRole) return;
    if (mpPrevResultPhase.current !== "result" && mp.phase === "result" && mp.result) {
      const iWon = mp.result.winner === mpRole;
      const iLost = mp.result.winner !== "tie" && mp.result.winner !== mpRole;
      if (iLost) {
        setFx((f) => ({ ...f, shake: true, flash: true, dmg: { amt: mp.result.dmg, who: "p", key: mp.rev } }));
        sfx.hurt();
      } else if (iWon) {
        setFx((f) => ({ ...f, shake: true, dmg: { amt: mp.result.dmg, who: "o", key: mp.rev } }));
        sfx.win();
      }
      setTimeout(() => setFx((f) => ({ ...f, shake: false, flash: false })), 480);
      setTimeout(() => setFx((f) => ({ ...f, dmg: null })), 1300);
    }
    mpPrevResultPhase.current = mp.phase;
  }, [mp && mp.phase]);

  /* ------------ screens ------------ */

  if (screen === "title") {
    return (
      <Shell screen={screen} intensity={0.06} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false}>
        <div className={"center" + (!bootDone ? " skippable" : "")} onClick={skipBoot}>
          <div className="protocoltag">A TERMINAL WAGER PROTOCOL</div>
          <DolosEye corruption={0.15} mood="idle" width={250} />
          <pre className="logo">{`
█▀▄ █▀█ █   █▀█ █▀▀
█ █ █ █ █   █ █ ▀▀█
▀▀  ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀`}</pre>
          <div className="bootslot">
            {!bootDone && (
              <div className={"bootlog" + (bootHiding ? " bootOut" : "")}>
                {BOOT_LOG.slice(0, bootLines).map((l, i) => <div key={i} className="bootline">{l}</div>)}
                {!bootHiding && <div className="bootHint dim">tap to skip</div>}
              </div>
            )}
            {bootDone && (
              <div className="modebtns bootIn">
                <button className="btn big" onClick={() => { sfx.blip(); setScreen("campaign_start"); }}>▸ CAMPAIGN</button>
                <button className="btn big amberbtn" onClick={() => { sfx.blip(); startEndless(); }}>▸ ENDLESS DESCENT</button>
                <button className="btn big cyanbtn" onClick={() => { sfx.blip(); setMpError(""); setScreen("mp_menu"); }}>▸ MULTIPLAYER</button>
              </div>
            )}
          </div>
          {bootDone && bestEndless && (
            <div className="dim">ENDLESS BEST — SECTOR {bestEndless.tier} · {bestEndless.hands} HANDS</div>
          )}
          {bootDone && (
            <button className="btn" onClick={() => { sfx.blip(); setScreen("codex"); }}>▸ CODEX</button>
          )}
        </div>
      </Shell>
    );
  }

  if (screen === "codex") {
    const entries = Object.entries(codex).sort((a, b) => {
      if (a[1].defeated !== b[1].defeated) return a[1].defeated ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });
    const defeatedCount = entries.filter(([, d]) => d.defeated).length;
    return (
      <Shell screen={screen} intensity={0.06} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <div className="center">
          <div className="protocoltag">CODEX</div>
          <div className="dim">{entries.length} PROCESS{entries.length === 1 ? "" : "ES"} LOGGED · {defeatedCount} TERMINATED</div>
          <div className="codexList">
            {entries.length === 0 && (
              <div className="dim" style={{ maxWidth: 280 }}>No processes encountered yet. Play Campaign or Endless Descent to start logging what you find.</div>
            )}
            {entries.map(([name, data]) => {
              const lore = data.defeated ? loreForName(name) : null;
              return (
                <div key={name} className={"codexEntry" + (data.defeated ? " defeated" : "")}>
                  <div className="codexIcon">
                    {data.visual === "eye"
                      ? <DolosEye corruption={0.2} mood="idle" width={54} />
                      : (() => {
                          const sp = DAEMON_SPRITE_LOOKUP[data.visual] || DAEMON_SPRITE_LOOKUP.icarus;
                          return <Sprite rows={sp.rows} palette={sp.pal} scale={2} className={sp.cls} />;
                        })()}
                  </div>
                  <div className="codexInfo">
                    <span className="codexName">{name}</span>
                    <span className="codexStatus">{data.defeated ? "TERMINATED" : "ENCOUNTERED"}</span>
                    {lore && <span className="codexLore">{lore}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn big" onClick={() => setScreen("title")}>▸ BACK</button>
        </div>
      </Shell>
    );
  }

  if (screen === "settings") {
    return (
      <Shell screen={screen} intensity={0.06} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen(settingsReturnTo)} showMenu>
        <div className="center">
          <div className="protocoltag">SETTINGS</div>
          <div className="settingsList">
            <div className="settingsRow">
              <div className="settingsLabel">
                <span>SOUND</span>
                <span className="dim">Trump blips, dealing, hits, and cues.</span>
              </div>
              <button className="btn" onClick={toggleSnd}>{sndOn ? "ON" : "OFF"}</button>
            </div>
            <div className="settingsRow">
              <div className="settingsLabel">
                <span>LARGE TEXT</span>
                <span className="dim">Scales up body text and trump descriptions.</span>
              </div>
              <button className="btn" onClick={toggleLargeText}>{largeText ? "ON" : "OFF"}</button>
            </div>
            <div className="settingsRow">
              <div className="settingsLabel">
                <span>COLORBLIND MODE</span>
                <span className="dim">Swaps red/green cues for a blue/green scheme.</span>
              </div>
              <button className="btn" onClick={toggleColorblind}>{colorblind ? "ON" : "OFF"}</button>
            </div>
            <div className="settingsRow">
              <div className="settingsLabel">
                <span>REDUCE MOTION</span>
                <span className="dim">Controlled by your device's accessibility settings.</span>
              </div>
              <span className="flag betflag">{reduced ? "ON" : "OFF"}</span>
            </div>
            <div className="settingsRow settingsFuture">
              <span className="dim">More settings land here as they're added.</span>
            </div>
          </div>
          <button className="btn big" onClick={() => setScreen(settingsReturnTo)}>▸ BACK</button>
        </div>
      </Shell>
    );
  }

  if (screen === "prologue") {
    const lines = PROLOGUE_LINES;
    return (
      <Shell screen={screen} intensity={0.08} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <Letterbox />
        <div className="center">
          <div className="introlines">
            {lines.slice(0, introLine).map((l, i) => <div key={i} className="amber">{l}</div>)}
            {introLine < lines.length && <Typewriter text={lines[introLine]} className="amber" />}
          </div>
          {introLine >= lines.length && (
            <button className="btn big" onClick={() => { markPrologueSeen(); startAct(1, null, ngPlusSelected); }}>▸ ACCEPT</button>
          )}
        </div>
      </Shell>
    );
  }

  if (screen === "campaign_start") {
    return (
      <Shell screen={screen} intensity={0.06} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <div className="center">
          <div className="protocoltag">ACT I — LABYRINTH</div>
          <DolosEye corruption={ngPlusSelected ? 0.4 : 0.15} mood="idle" width={200} />
          <div className="mpdesc dim">
            New to the Labyrinth? Play a short guided hand against PROC_ICARUS first — real cards, real buttons, just a coach walking you through it.
          </div>
          {ngPlusUnlocked && (
            <div className="settingsRow" style={{ maxWidth: 340 }}>
              <div className="settingsLabel">
                <span>NEW GAME+</span>
                <span className="dim">Tighter timers, harder hits, DOLOS cheats twice.</span>
              </div>
              <button className="btn" onClick={() => { sfx.blip(); setNgPlusSelected((v) => !v); }}>{ngPlusSelected ? "ON" : "OFF"}</button>
            </div>
          )}
          <div className="modebtns">
            <button className="btn big" onClick={() => { sfx.blip(); startTutorialGame(); }}>▸ START TUTORIAL</button>
            <button className="btn big amberbtn" onClick={enterAct1}>▸ SKIP — I KNOW HOW TO PLAY</button>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "mp_menu") {
    return (
      <Shell screen={screen} intensity={0.06} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <div className="center">
          <div className="protocoltag">MULTIPLAYER LINK</div>
          <DolosEye corruption={0.12} mood="idle" width={200} />
          <div className="mpdesc dim">
            Two players, one deck, synced through shared storage — expect roughly a second of latency between moves, not instant.
          </div>
          <div className="dim">CALLSIGN</div>
          <input
            className="nameinput"
            value={mpUsername}
            maxLength={14}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="USER_0000"
          />
          {mpError && <div className="red">{mpError}</div>}
          <div className="modebtns">
            <button className="btn big" disabled={mpBusy} onClick={hostGame}>{mpBusy ? "OPENING…" : "▸ HOST GAME"}</button>
            <button className="btn big cyanbtn" onClick={() => { sfx.blip(); setMpError(""); setJoinInput(""); setScreen("mp_join"); }}>▸ JOIN GAME</button>
            <button className="btn" onClick={() => setScreen("title")}>▸ BACK</button>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "mp_host_wait") {
    return (
      <Shell screen={screen} intensity={0.08} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => mpLeave(true)} showMenu>
        <div className="center">
          <div className="protocoltag">LOBBY OPEN</div>
          <DolosEye corruption={0.15} mood="idle" width={200} />
          <div className="dim">SHARE THIS CODE WITH YOUR OPPONENT</div>
          <div className="lobbycode">{lobbyCode}</div>
          <div className="dim">HOSTING AS {mpUsername}</div>
          <div className="amber">AWAITING CONNECTION <Dots /></div>
          <button className="btn" onClick={() => mpLeave(true)}>▸ CANCEL</button>
        </div>
      </Shell>
    );
  }

  if (screen === "mp_join") {
    return (
      <Shell screen={screen} intensity={0.06} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("mp_menu")} showMenu>
        <div className="center">
          <div className="protocoltag">JOIN LOBBY</div>
          <DolosEye corruption={0.1} mood="idle" width={200} />
          <div className="dim">ENTER THE 4-CHARACTER LOBBY CODE</div>
          <input
            className="codeinput"
            value={joinInput}
            maxLength={4}
            onChange={(e) => setJoinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter" && joinInput.length === 4) joinGame(); }}
            placeholder="XXXX"
            autoFocus
          />
          {mpError && <div className="red">{mpError}</div>}
          <div className="modebtns">
            <button className="btn big cyanbtn" disabled={mpBusy || joinInput.length !== 4} onClick={joinGame}>{mpBusy ? "CONNECTING…" : "▸ CONNECT"}</button>
            <button className="btn" onClick={() => setScreen("mp_menu")}>▸ BACK</button>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "mp_game") {
    if (mpDisconnected) {
      return (
        <Shell screen={screen} intensity={0.5} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false}>
          <div className="center">
            <DolosEye corruption={0.6} mood="hurt" width={220} />
            <div className="acttitle">CONNECTION LOST</div>
            <div className="dim">The other side disconnected or ended the match.</div>
            <button className="btn big" onClick={() => mpLeave(false)}>▸ RETURN TO MENU</button>
          </div>
        </Shell>
      );
    }
    if (!mp || !mpRole) {
      return (
        <Shell screen={screen} intensity={0.1} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false}>
          <div className="center">
            <DolosEye corruption={0.15} mood="idle" width={220} />
            <div className="amber">LINKING TO HOST <Dots /></div>
            <button className="btn" onClick={() => mpLeave(false)}>▸ CANCEL</button>
          </div>
        </Shell>
      );
    }

    const oppRole = mpOther(mpRole);
    const me = mp[mpRole], opp = mp[oppRole];
    const isHost = mpRole === "host";
    // my own hole card: shared storage never has the real value until a legitimate
    // reveal, so substitute my locally-known secret for my own display only
    const meDisplayCards = me.cards.map((c, i) => (i === 0 && c.hole && c.v == null && holeSecret) ? { ...c, v: holeSecret.value } : c);
    const meT = total(meDisplayCards, me.mod || 0);
    const oppVisible = visTotal(opp.cards);
    const revealedMP = mp.phase === "reveal" || mp.phase === "result";
    const oppHoleShown = myPeek || revealedMP;
    const oppHoleSynced = !opp.cards[0] || opp.cards[0].v != null; // their self-publish may take a poll tick to arrive
    const canAct = mp.phase === "play" && mp.turn === mpRole && !me.stay;
    const corruption = 0.05;
    const myName = mpNameOf(mp, mpRole), oppName = mpNameOf(mp, oppRole);
    const myBet = (mpRole === "host" ? mp.hostBet : mp.guestBet) ?? 1;
    const oppBet = (mpRole === "host" ? mp.guestBet : mp.hostBet) ?? 1;

    return (
      <Shell screen={screen + mp.rev} intensity={corruption} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={me.hp <= 30} onMenu={() => mpLeave(isHost)} showMenu>
        <div className="hud">
          <div className="hudrow">
            <span className="dim">MULTIPLAYER · LOBBY {lobbyCode}</span>
            <span className="dim">TARGET <b className="amber">{mp.target}</b></span>
          </div>
          <div className="dlgbar">{mp.dlg || "> AWAITING INPUT."}</div>
        </div>

        <div className="zone posrel">
          {fx.dmg && fx.dmg.who === "o" && <div key={fx.dmg.key} className="dmgpop">−{fx.dmg.amt}</div>}
          <HPBar label={oppName} hp={opp.hp} max={100} amber />
          <div className="cards">
            {opp.cards.map((c, i) => (
              <Card key={i} card={c} hidden={c.hole && !oppHoleShown} delay={i * 90} justRevealed={c.hole && oppHoleShown} />
            ))}
            <div className="totaltag amber">
              {oppHoleShown ? (oppHoleSynced ? total(opp.cards, opp.mod || 0) : "…") : oppVisible + " + ?"}
              {opp.mod ? <span className="mod"> ({opp.mod > 0 ? "+" : ""}{opp.mod})</span> : null}
            </div>
          </div>
          <div className="flags">
            <span className="flag betflag amber">BET ×{oppBet}</span>
            {opp.shield && <span className="flag">SHIELD</span>}
            {opp.stay && <span className="flag">STAYED</span>}
          </div>
          {mp.phase !== "bet" && mp.phase !== "trumpReveal" && (
            <div className="mysteryRow">
              <span className="dim">{oppName} TRUMPS ({opp.trumps.length})</span>
              <div className="mysteryChips">
                {opp.trumps.map((_, i) => <span key={i} className="mysteryChip" />)}
                {opp.trumps.length === 0 && <span className="dim">—</span>}
              </div>
            </div>
          )}
        </div>

        <div className="midzone">
          {mp.phase === "trumpReveal" && (
            <TrumpRevealOverlay
              myLabel={myName}
              myNewTrumps={me.trumps.slice((mpRole === "host" ? mp.hostTrumpsShown : mp.guestTrumpsShown) || 0)}
              oppLabel={oppName}
              oppNewTrumps={opp.trumps.slice((mpRole === "host" ? mp.guestTrumpsShown : mp.hostTrumpsShown) || 0)}
              onContinue={isHost ? mpBeginHand : null}
              waitingText={`WAITING FOR ${oppName}`}
              reduced={reduced}
            />
          )}
          {mp.phase === "commit" && (
            <div className="dim">SEALING HOLE CARDS <Dots /></div>
          )}
          {mp.phase === "bet" && isHost && (
            <div className="betbox">
              <div className="dim">ANTE LOCKED — LOSER FORFEITS BET × 10 INTEGRITY</div>
              <div className="betrow">
                <span className="betval amber">YOU ×1</span>
                <span className="dim">vs</span>
                <span className="betval red">{oppName} ×1</span>
              </div>
              <div className="dim">Trump cards can raise their bet or lower yours.</div>
              <button className="btn" onClick={mpDeal}>▸ DEAL</button>
            </div>
          )}
          {mp.phase === "bet" && !isHost && (
            <div className="dim">WAITING FOR {oppName} TO DEAL <Dots /></div>
          )}
          {mp.phase === "play" && (
            <div className="turnind" style={{ alignItems: "center" }}>
              {canAct ? <span className="yourmove">▸ YOUR MOVE</span> : <span className="amber">{oppName}'S MOVE <Dots /></span>}
            </div>
          )}
          {mp.phase === "reveal" && <div className="revealtxt amber">▓▓ REVEALING MEMORY ▓▓</div>}
          {mp.phase === "result" && mp.result && (
            <div className={"resultbox banner " + (mp.result.winner === mpRole ? "bwin" : mp.result.winner === "tie" ? "btie" : "blose")}>
              <div className={mp.result.winner === mpRole ? "win bigres" : mp.result.winner === "tie" ? "amber bigres" : "lose bigres jitter"}>
                {mp.result.winner === mpRole ? "▸ HAND WON" : mp.result.winner === "tie" ? "▸ DEADLOCK" : "▸ HAND LOST"}
              </div>
              <div className="dim">
                {myName} {mpRole === "host" ? mp.result.hT : mp.result.gT} · {oppName} {mpRole === "host" ? mp.result.gT : mp.result.hT}
                {mp.result.winner !== "tie" && <> · −{mp.result.dmg} INTEGRITY</>}
              </div>
              {isHost ? <button className="btn" onClick={mpContinue}>▸ CONTINUE</button> : <div className="dim">WAITING FOR {oppName} <Dots /></div>}
            </div>
          )}
        </div>

        <div className="zone posrel">
          {fx.dmg && fx.dmg.who === "p" && <div key={fx.dmg.key} className="dmgpop red">−{fx.dmg.amt}</div>}
          <div className="cards">
            {meDisplayCards.map((c, i) => <Card key={i} card={c} hidden={false} danger={meT > mp.target} delay={i * 90} />)}
            <div className={"totaltag" + (meT > mp.target ? " red" : "")}>
              {meT}{me.mod ? <span className="mod"> ({me.mod > 0 ? "+" : ""}{me.mod})</span> : null}
              {meT > mp.target && " ⚠ OVERFLOW"}
            </div>
          </div>
          <div className="flags">
            <span className="flag betflag">BET ×{myBet}</span>
            {me.shield && <span className="flag">SHIELD</span>}
            {me.stay && <span className="flag">STAYED</span>}
          </div>
          <HPBar label={`${myName} — MEM.INTEGRITY`} hp={me.hp} max={100} />

          {mp.phase === "play" && (
            <div className="actions">
              <button className="btn" disabled={!canAct || mp.deck.length === 0} onClick={mpHit}>HIT</button>
              <button className="btn" disabled={!canAct} onClick={mpStay}>STAY</button>
            </div>
          )}

          {mp.phase !== "bet" && mp.phase !== "trumpReveal" && (
            <>
              <div className="dim">YOUR TRUMPS ({me.trumps.length})</div>
              <div className="trumps">
                {me.trumps.map((id, i) => (
                  <button key={i} className="trump" disabled={!canAct} onClick={() => mpTrump(i)} title={TRUMPS[id].desc}>
                    <span className="ticonrow">
                      <Sprite rows={ICONS[id]} scale={2} color="#ffb347" className="ticon" />
                      <span className="tname">{TRUMPS[id].name}</span>
                    </span>
                    <span className="tdesc">{TRUMPS[id].desc}</span>
                  </button>
                ))}
                {me.trumps.length === 0 && <span className="dim">NO TRUMP CARDS LOADED</span>}
              </div>
            </>
          )}
        </div>

        {mp.ended && (
          <div className="cheatoverlay" style={{ background: "rgba(2,2,4,.9)" }}>
            <div className={mp.ended === mpRole ? "win bigres" : "lose bigres"} style={{ fontSize: 20 }}>
              {mp.ended === "tie" ? "MUTUAL DESTRUCTION" : mp.ended === mpRole ? "YOU WIN" : "YOU LOSE"}
            </div>
            {isHost ? (
              <div className="actions">
                <button className="btn big" onClick={mpRematch}>▸ REMATCH</button>
                <button className="btn" onClick={() => mpLeave(true)}>▸ END SESSION</button>
              </div>
            ) : (
              <div className="dim">WAITING FOR {oppName} <Dots /></div>
            )}
            {!isHost && <button className="btn" onClick={() => mpLeave(false)}>▸ LEAVE</button>}
          </div>
        )}
      </Shell>
    );
  }

  if (screen === "intro" && game) {
    const lines = ACTS[game.act].intro;
    return (
      <Shell screen={screen + game.act} intensity={game.act === 3 ? 0.3 : 0.06} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} particles={ACTS[game.act].particles} onMenu={() => setScreen("title")} showMenu>
        <Letterbox />
        <div className="center">
          {game.act === 3 && <DolosEye corruption={0.5} mood="rage" width={260} />}
          <div className="acttitle">{ACTS[game.act].title}</div>
          <div className="introlines">
            {lines.slice(0, introLine).map((l, i) => <div key={i} className="amber">{game.act === 3 ? corrupt(l, 0.06) : l}</div>)}
            {introLine < lines.length && <Typewriter text={lines[introLine]} className="amber" />}
          </div>
          {introLine >= lines.length && (
            <button className="btn big" onClick={() => { sfx.blip(); setScreen("game"); }}>▸ CONNECT</button>
          )}
        </div>
      </Shell>
    );
  }

  if (screen === "gameover" && game) {
    return (
      <Shell screen={screen} intensity={0.85} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <div className="center">
          <DolosEye corruption={0.9} mood="rage" width={260} />
          <div className="segfault">SEGMENTATION FAULT</div>
          <div className="sub red">(CORE DUMPED)</div>
          <div className="bootlog">
            <div>{"> "}hands played: {game.stats.hands}</div>
            <div>{"> "}hands won: {game.stats.won}</div>
            <div>{"> "}trumps played: {game.stats.trumpsUsed || 0}</div>
            <div>{"> "}closest call: {game.stats.lowestHP ?? 100} integrity</div>
            <div>{"> "}highest bet faced: ×{game.stats.maxBetFaced || 1}</div>
            <div>{"> "}integrity at failure: 0</div>
            <div className="amber">{"> "}{corrupt("DOLOS RETAINS YOUR MEMORY. TRY AGAIN.", 0.08)}</div>
          </div>
          <button className="btn big" onClick={() => { sfx.blip(); startAct(game.act, game.stats, game.ngPlus); }}>▸ RESTART {ACTS[game.act].title.split("—")[0].trim()}</button>
        </div>
      </Shell>
    );
  }

  if (screen === "endlessover" && game) {
    const sectors = Math.max(0, game.tier - 1);
    const isBest = bestEndless && bestEndless.tier === game.tier && bestEndless.hands === game.stats.hands;
    return (
      <Shell screen={screen} intensity={0.85} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <div className="center">
          <DolosEye corruption={0.9} mood="rage" width={260} />
          <div className="segfault">SEGMENTATION FAULT</div>
          <div className="sub red">(CORE DUMPED)</div>
          <div className="bootlog">
            <div>{"> "}depth reached: {game.tier}</div>
            <div>{"> "}sectors cleared: {sectors}</div>
            <div>{"> "}hands played: {game.stats.hands}</div>
            <div>{"> "}trumps played: {game.stats.trumpsUsed || 0}</div>
            <div>{"> "}closest call: {game.stats.lowestHP ?? 100} integrity</div>
            <div>{"> "}highest bet faced: ×{game.stats.maxBetFaced || 1}</div>
            {isBest
              ? <div className="amber">{"> "}NEW PERSONAL BEST. IT WILL REMEMBER THIS TOO.</div>
              : bestEndless && <div className="dim">{"> "}best: sector {bestEndless.tier} · {bestEndless.hands} hands</div>}
          </div>
          <div className="modebtns">
            <button className="btn big" onClick={() => { sfx.blip(); startEndless(); }}>▸ DESCEND AGAIN</button>
            <button className="btn" onClick={() => { sfx.blip(); setScreen("title"); }}>▸ MAIN MENU</button>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "victory" && game) {
    return (
      <Shell screen={screen} intensity={0.05} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <div className="center">
          <DolosEye corruption={0.2} mood="dying" width={240} />
          <div className="acttitle">DOLOS.SYS — PROCESS TERMINATED</div>
          {game.flawless && <div className="flag gimmickFlag" style={{ fontSize: 13 }}>FLAWLESS ACT — NOT ONE HAND LOST</div>}
          <div className="bootlog">
            <div>{"> "}tartarus unmounted.</div>
            <div>{"> "}hands played: {game.stats.hands} | won: {game.stats.won} | lost: {game.stats.lost}</div>
            <div>{"> "}trumps played: {game.stats.trumpsUsed || 0}</div>
            <div>{"> "}closest call: {game.stats.lowestHP ?? 100} integrity</div>
            <div>{"> "}highest bet faced: ×{game.stats.maxBetFaced || 1}</div>
            <div>{"> "}exit allocated. session released.</div>
            <div className="amber">{"> "}...i will shuffle again. i always do.</div>
            <div className="amber">{"> "}NEW GAME+ UNLOCKED. IT GETS WORSE FROM HERE.</div>
          </div>
          <button className="btn big" onClick={() => setScreen("title")}>▸ DISCONNECT</button>
        </div>
      </Shell>
    );
  }

  if (screen === "actclear" && game) {
    const bridge = ACT_BRIDGE[game.act];
    return (
      <Shell screen={screen + game.act} intensity={0.1} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} lowHP={false} onMenu={() => setScreen("title")} showMenu>
        <Letterbox />
        <div className="center">
          <div className="acttitle">{ACTS[game.act].opp} — TERMINATED</div>
          {game.flawless && <div className="flag gimmickFlag" style={{ fontSize: 13 }}>FLAWLESS ACT — NOT ONE HAND LOST</div>}
          <div className="bootlog">
            {bridge && bridge.lines.map((l, i) => <div key={i}>{l}</div>)}
            <div>{"> "}integrity remaining: {game.pHP}</div>
            {bridge && <div className="amber" style={{ marginTop: 6 }}>{bridge.next}</div>}
          </div>
          <button className="btn big" onClick={() => { sfx.blip(); startAct(game.act + 1, game.stats, game.ngPlus); }}>▸ DESCEND</button>
        </div>
      </Shell>
    );
  }

  if (!game || screen !== "game") return null;

  /* ------------ game screen ------------ */
  const cfg = cfgFor(game);
  const bossPhaseShift = (game.aiLevel === 3 && cfg.isBoss) ? Math.max(0, (cfg.oppHP - game.oHP) / cfg.oppHP) * 0.5 : 0;
  const corruption = Math.min(1, Math.max(0, (100 - game.pHP) / 100) * (game.aiLevel === 3 ? 1 : 0.55) + (game.aiLevel === 3 ? 0.12 : 0.03) + bossPhaseShift);
  const pT = total(game.pCards, game.pMod);
  const oVisible = visTotal(game.oCards);
  const canAct = game.phase === "play" && game.turn === "player" && !game.pStay;
  const isTutorial = game.mode === "tutorial";
  const tutorialStepObj = isTutorial ? TUTORIAL_SCRIPT[tutorialStep] : null;
  const tutorialRequire = tutorialStepObj && tutorialStepObj.requireAction;
  const tutorialHi = (key) => isTutorial && tutorialStepObj && tutorialStepObj.highlight === key ? " tutorialGlow" : "";
  const revealed = game.phase === "reveal" || game.phase === "result";
  const dlgText = game.dlg ? (game.aiLevel === 3 ? corrupt(game.dlg, 0.04 + corruption * 0.12) : game.dlg) : `> AWAITING INPUT.`;
  const eyeMood = fx.rage ? "rage" : (game.aiLevel === 3 && cfg.isBoss && game.oHP <= cfg.oppHP * 0.2) ? "dying" : game.aiLevel === 3 && game.oHP <= 50 ? "hurt" : "idle";
  const eyeGaze = canAct ? 1 : 0;

  const doHit = () => setGame((g) => {
    if (g.deck.length === 0) return g;
    sfx.draw();
    const deck = [...g.deck];
    const v = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
    const g2 = { ...g, deck, pCards: [...g.pCards, { v, hole: false }], dlg: `> YOU DRAW ${v}.`, evt: null, tick: g.tick + 1 };
    g2.turn = g2.oStay ? "player" : "opp";
    return g2;
  });

  const doStay = () => setGame((g) => {
    sfx.stay();
    const g2 = { ...g, pStay: true, dlg: "> YOU STAY. POSITION LOCKED.", evt: null, tick: g.tick + 1 };
    g2.turn = "opp";
    if (g2.oStay) g2.phase = "reveal";
    return g2;
  });

  const useTrump = (idx) => setGame((g) => {
    const id = g.pTrumps[idx];
    const g2 = { ...g, deck: [...g.deck], pCards: [...g.pCards], oCards: [...g.oCards], pTrumps: [...g.pTrumps], oTrumps: [...g.oTrumps], betModsLog: [...(g.betModsLog || [])], evt: null, tick: g.tick + 1 };
    const consume = () => { g2.pTrumps.splice(idx, 1); g2.stats = { ...g2.stats, trumpsUsed: (g2.stats.trumpsUsed || 0) + 1 }; };
    const cur = total(g2.pCards, g2.pMod);
    sfx.blip();
    switch (id) {
      case "PEEK": g2.peek = true; consume(); g2.dlg = "> PEEK: OPPONENT HOLE CARD EXPOSED."; break;
      case "RETURN": {
        const i = g2.pCards.map((c) => c.hole).lastIndexOf(false);
        if (i <= 0) { g2.dlg = "> NO DRAWN CARD TO RETURN."; return g2; }
        const [c] = g2.pCards.splice(i, 1); g2.deck.push(c.v); g2.deck = shuffle(g2.deck);
        consume(); g2.dlg = `> YOU RETURN ${c.v} TO THE DECK.`; break;
      }
      case "PLUS_ONE": g2.pMod += 1; consume(); g2.dlg = "> +1 APPLIED."; break;
      case "MINUS_ONE": g2.pMod -= 1; consume(); g2.dlg = "> −1 APPLIED."; break;
      case "PLUS_TWO": g2.pMod += 2; consume(); g2.dlg = "> +2 APPLIED."; break;
      case "DESTROY": {
        const i = g2.oCards.map((c) => c.hole).lastIndexOf(false);
        if (i <= 0) { g2.dlg = "> OPPONENT HAS NO DRAWN CARDS."; return g2; }
        if (g2.oShield) { g2.oShield = false; consume(); g2.dlg = "> OPPONENT'S SHIELD ABSORBS DESTROY."; break; }
        const [c] = g2.oCards.splice(i, 1); g2.deck.push(c.v); g2.deck = shuffle(g2.deck);
        consume();
        g2.evt = { type: "shatter", side: "o", v: c.v, key: g2.tick };
        g2.dlg = `> YOU DESTROY THEIR ${c.v}.`; break;
      }
      case "EXCHANGE": {
        // swaps the last FACE-UP card each side drew — hole cards are never exchanged
        const pi = g2.pCards.map((c) => c.hole).lastIndexOf(false);
        const oi = g2.oCards.map((c) => c.hole).lastIndexOf(false);
        if (pi <= 0 || oi <= 0) { g2.dlg = "> NOT ENOUGH DRAWN CARDS TO EXCHANGE."; return g2; }
        if (g2.oShield) { g2.oShield = false; consume(); g2.dlg = "> OPPONENT'S SHIELD BLOCKS EXCHANGE."; break; }
        const tmp = g2.pCards[pi]; g2.pCards[pi] = g2.oCards[oi]; g2.oCards[oi] = tmp;
        consume();
        g2.evt = { type: "swap", key: g2.tick };
        g2.dlg = "> DRAWN CARDS EXCHANGED."; break;
      }
      case "ONE_UP": {
        g2.oBet = (g2.oBet ?? 1) + 1;
        g2.betModsLog.push({ by: "player", targetSide: "o", amount: 1, id: "ONE_UP" });
        g2.pTrumps = awardTrumps(g2.pTrumps, cfg.pool, 1);
        consume(); g2.dlg = `> ONE UP: OPPONENT'S BET RAISED TO ${g2.oBet}.`; break;
      }
      case "TWO_UP": {
        g2.oBet = (g2.oBet ?? 1) + 2;
        g2.betModsLog.push({ by: "player", targetSide: "o", amount: 2, id: "TWO_UP" });
        g2.pTrumps = awardTrumps(g2.pTrumps, cfg.pool, 1);
        consume(); g2.dlg = `> TWO UP: OPPONENT'S BET RAISED TO ${g2.oBet}.`; break;
      }
      case "ONE_DOWN": {
        g2.pBet = Math.max(0, (g2.pBet ?? 1) - 1);
        g2.betModsLog.push({ by: "player", targetSide: "p", amount: -1, id: "ONE_DOWN" });
        consume(); g2.dlg = `> ONE DOWN: YOUR BET LOWERED TO ${g2.pBet}.`; break;
      }
      case "TWO_DOWN": {
        g2.pBet = Math.max(0, (g2.pBet ?? 1) - 2);
        g2.betModsLog.push({ by: "player", targetSide: "p", amount: -2, id: "TWO_DOWN" });
        consume(); g2.dlg = `> TWO DOWN: YOUR BET LOWERED TO ${g2.pBet}.`; break;
      }
      case "SEIZE": {
        const i = g2.betModsLog.map((m) => m.by).lastIndexOf("opp");
        if (i < 0) { g2.dlg = "> NOTHING ON THE TABLE TO SEIZE."; return g2; }
        const mod = g2.betModsLog[i];
        if (mod.targetSide === "p") g2.pBet = Math.max(0, (g2.pBet ?? 1) - mod.amount);
        else g2.oBet = Math.max(0, (g2.oBet ?? 1) - mod.amount);
        g2.betModsLog.splice(i, 1);
        consume(); g2.dlg = `> SEIZE: ${TRUMPS[mod.id].name} REMOVED FROM THE TABLE.`; break;
      }
      case "TARGET_17": g2.target = 17; consume(); g2.dlg = "> TARGET REWRITTEN: 17."; break;
      case "TARGET_24": g2.target = 24; consume(); g2.dlg = "> TARGET REWRITTEN: 24."; break;
      case "TARGET_27": g2.target = 27; consume(); g2.dlg = "> TARGET REWRITTEN: 27."; break;
      case "SHIELD": g2.pShield = true; consume(); g2.dlg = "> SHIELD RAISED."; break;
      case "SWITCH": {
        consume();
        const dropCount = Math.min(2, g2.pTrumps.length);
        for (let k = 0; k < dropCount; k++) g2.pTrumps.splice(Math.floor(Math.random() * g2.pTrumps.length), 1);
        g2.pTrumps = awardTrumps(g2.pTrumps, cfg.pool, 3);
        g2.dlg = "> TRUMP SWITCH: HAND CYCLED."; break;
      }
      case "SWITCH_PLUS": {
        consume();
        const dropCount = Math.min(1, g2.pTrumps.length);
        for (let k = 0; k < dropCount; k++) g2.pTrumps.splice(Math.floor(Math.random() * g2.pTrumps.length), 1);
        g2.pTrumps = awardTrumps(g2.pTrumps, cfg.pool, 4);
        g2.dlg = "> TRUMP SWITCH+: HAND CYCLED."; break;
      }
      case "SABOTAGE": {
        if (g2.oTrumps.length === 0) { g2.dlg = "> OPPONENT HAS NO TRUMPS TO SABOTAGE."; return g2; }
        g2.oTrumps.splice(Math.floor(Math.random() * g2.oTrumps.length), 1);
        consume(); g2.dlg = "> SABOTAGE: OPPONENT LOSES A TRUMP CARD."; break;
      }
      case "LOVE": {
        if (g2.deck.length === 0) { g2.dlg = "> DECK EMPTY."; return g2; }
        const oCur = total(g2.oCards, g2.oMod);
        const i = bestCardIdx(g2.deck, oCur, g2.target);
        const v = g2.deck.splice(i, 1)[0];
        g2.oCards.push({ v, hole: false });
        consume(); g2.dlg = `> LOVE YOUR ENEMY: THEY DRAW ${v}.`; break;
      }
      case "FIREWALL": g2.firewall = true; consume(); g2.dlg = "> FIREWALL DEPLOYED. MEMORY LOCKED."; break;
      case "PERFECT": {
        if (g2.deck.length === 0) { g2.dlg = "> DECK EMPTY."; return g2; }
        const i = bestCardIdx(g2.deck, cur, g2.target);
        const v = g2.deck.splice(i, 1)[0];
        g2.pCards.push({ v, hole: false });
        consume(); g2.dlg = `> PERFECT DRAW: ${v}.`; break;
      }
      case "ROLLBACK": {
        if (g2.deck.length === 0) { g2.dlg = "> DECK EMPTY."; return g2; }
        const old = g2.pCards[0].v;
        g2.deck.push(old); g2.deck = shuffle(g2.deck);
        g2.pCards[0] = { v: g2.deck.pop(), hole: true };
        consume(); g2.dlg = "> HOLE CARD ROLLED BACK. NEW SECTOR LOADED."; break;
      }
      default: return g2;
    }
    return g2;
  });

  const dealIntent = () => {
    sfx.shuffle();
    setGame((g) => ({ ...g, phase: "trumpReveal", tick: g.tick + 1 }));
  };
  const beginHand = () => {
    sfx.blip();
    setGame((g) => {
      const personal = g.aiLevel === 3 && Math.random() < 0.35 ? dolosPersonalLine(g.stats) : null;
      return {
        ...freshHand({ ...g, pTrumpsShown: g.pTrumps.length, oTrumpsShown: g.oTrumps.length }),
        dlg: personal || pick(DLG.handStart[g.aiLevel]),
      };
    });
  };
  const dismissBossIntro = () => {
    sfx.blip();
    setGame((g) => ({
      ...g, phase: "bet", bossIntro: null,
      dlg: `> ${g.bossIntro ? g.bossIntro.name : "THE BOSS"} STANDS BEFORE YOU.`,
      tick: g.tick + 1,
    }));
  };

  const continueAfterResult = () => {
    sfx.blip();
    if (game.oHP <= 0) {
      codexDefeat(cfgFor(game).opp);
      if (game.mode === "endless") {
        const newTier = game.tier + 1;
        const newIdentity = randomEndlessIdentity(Math.min(3, newTier));
        const newCfg = endlessTierCfg(newTier, newIdentity);
        codexSeen(newCfg.opp, newCfg.oppVisual);
        sfx.levelUp();
        setFx((f) => ({ ...f, greenFlash: true }));
        setTimeout(() => setFx((f) => ({ ...f, greenFlash: false })), 480);
        setGame((g) => ({
          ...g,
          tier: newTier,
          aiLevel: newCfg.aiLevel,
          oppIdentity: newIdentity,
          pHP: Math.min(100, g.pHP + 12),
          oHP: newCfg.oppHP,
          pTrumps: awardTrumps(g.pTrumps, newCfg.pool, 1),
          oTrumps: awardTrumps(g.oTrumps, newCfg.pool, 1),
          phase: "bet", result: null, evt: null,
          dlg: `> SECTOR CLEARED. DESCENDING TO DEPTH ${newTier}...`,
          tick: g.tick + 1,
        }));
        return;
      }
      const actDef = ACTS[game.act];
      const nextIndex = (game.encounterIndex || 0) + 1;
      if (nextIndex < actDef.encounters.length) {
        const nextEnc = actDef.encounters[nextIndex];
        const nextIdentity = nextEnc.boss ? null : randomEndlessIdentity(game.act);
        const nextCfg = campaignEncounterCfg(game.act, nextIndex, nextIdentity);
        codexSeen(nextCfg.opp, nextCfg.oppVisual);
        if (nextEnc.boss) {
          sfx.cheat();
          setFx((f) => ({ ...f, shake: true }));
          setTimeout(() => setFx((f) => ({ ...f, shake: false })), 700);
          setGame((g) => ({
            ...g,
            encounterIndex: nextIndex,
            oppIdentity: nextIdentity,
            pHP: Math.min(100, g.pHP + 10),
            oHP: nextCfg.oppHP,
            pTrumps: awardTrumps(g.pTrumps, actDef.pool, 1),
            oTrumps: awardTrumps([], actDef.pool, 2),
            oTrumpsShown: 0,
            phase: "bossIntro",
            bossIntro: { name: nextCfg.opp, visual: nextCfg.oppVisual, isFinal: game.act === 3 },
            result: null, evt: null,
            tick: g.tick + 1,
          }));
          return;
        }
        sfx.levelUp();
        setFx((f) => ({ ...f, greenFlash: true }));
        setTimeout(() => setFx((f) => ({ ...f, greenFlash: false })), 480);
        setGame((g) => ({
          ...g,
          encounterIndex: nextIndex,
          oppIdentity: nextIdentity,
          pHP: Math.min(100, g.pHP + 10),
          oHP: nextCfg.oppHP,
          pTrumps: awardTrumps(g.pTrumps, actDef.pool, 1),
          oTrumps: awardTrumps([], actDef.pool, 2),
          oTrumpsShown: 0,
          phase: "bet", result: null, evt: null,
          dlg: pick(ENCOUNTER_TRANSITION_DLG)(nextCfg.opp),
          tick: g.tick + 1,
        }));
        return;
      }
      if (game.act === 3) unlockNgPlus();
      setScreen(game.act === 3 ? "victory" : "actclear");
      return;
    }
    if (game.pHP <= 0) {
      sfx.cheat();
      setFx((f) => ({ ...f, invert: true, shake: true }));
      setGame((g) => ({ ...g, phase: "death", tick: g.tick + 1 }));
      return;
    }
    if (Math.random() < 0.2) {
      const frag = LOG_FRAGMENTS[Math.floor(Math.random() * LOG_FRAGMENTS.length)];
      setLogFragment(frag);
      setTimeout(() => setLogFragment(null), 3400);
    }
    setGame((g) => ({ ...g, phase: "bet", dlg: null, result: null, evt: null, tick: g.tick + 1 }));
  };

  return (
    <Shell screen={screen + (game.mode === "endless" ? "endless" + game.tier : game.act)} intensity={corruption} reduced={reduced} fx={fx} sndOn={sndOn} toggleSnd={toggleSnd} largeText={largeText} onSettings={openSettings} colorblind={colorblind} actTint={game.aiLevel} lowHP={lowHP} particles={cfg.particles} onMenu={() => setScreen("title")} showMenu>
      <Whispers corruption={corruption} reduced={reduced} />
      {fx.rage && !reduced && (
        <div className="cheatoverlay">
          <DolosEye corruption={0.8} mood="rage" width={300} />
          <div className="cheattxt">{corrupt("MEMORY REWRITE IN PROGRESS", 0.15)}</div>
        </div>
      )}
      <div className="hud">
        <div className="hudrow">
          <span className="dim">{cfg.title}{game.ngPlus ? " · NG+" : ""}{game.mode === "campaign" && game.flawless ? " · FLAWLESS" : ""}</span>
          <span className="dim">TARGET <b className="amber">{game.target}</b></span>
        </div>
        <div className="dlgbar"><Typewriter text={dlgText} /></div>
      </div>

      {isTutorial && (
        <TutorialCoach step={tutorialStepObj} onContinue={() => setTutorialStep((s) => s + 1)} onBegin={enterAct1} />
      )}

      {oppTrumpPopup && game.oppTrumpEvt && oppTrumpPopup.key === game.oppTrumpEvt.key && (
        <OppTrumpPopup id={oppTrumpPopup.id} oppName={cfg.opp} />
      )}

      {game.phase === "bossIntro" && game.bossIntro && (
        <BossIntroCard intro={game.bossIntro} cfgOpp={cfg.opp} onContinue={dismissBossIntro} />
      )}

      <CheatBanner text={cheatBanner} />

      {game.phase === "death" && <DeathSequence />}

      {/* opponent */}
      <div className={"zone posrel" + tutorialHi("opp")}>
        {fx.dmg && fx.dmg.who === "o" && <div key={fx.dmg.key} className="dmgpop">−{fx.dmg.amt}</div>}
        <div className="opprow">
          {cfg.oppVisual === "eye"
            ? <DolosEye corruption={corruption} mood={eyeMood} width={195} gaze={eyeGaze} />
            : (() => {
                const sp = DAEMON_SPRITE_LOOKUP[cfg.oppVisual] || DAEMON_SPRITE_LOOKUP.icarus;
                return <Sprite rows={sp.rows} palette={sp.pal} scale={5} className={"avatar " + sp.cls} />;
              })()}
          <div className="oppcol">
            <HPBar label={cfg.opp} hp={game.oHP} max={cfg.oppHP} amber />
            {game.oppIdentity && game.oppIdentity.gimmickLabel && (
              <span className="flag gimmickFlag">{game.oppIdentity.gimmickLabel}</span>
            )}
            <div className="cards">
              {game.oCards.map((c, i) => (
                <Card
                  key={i + (c.hole && revealed ? "-r" : c.hole && game.peek ? "-p" : "")}
                  card={c}
                  hidden={c.hole && !(game.peek || revealed)}
                  delay={i * 90}
                  justRevealed={c.hole && (revealed || game.peek)}
                  swapped={fx.swap && c.hole}
                />
              ))}
              {fx.ghost && fx.ghost.side === "o" && <GhostCard v={fx.ghost.v} />}
              <div className="totaltag amber">
                {revealed || game.peek ? total(game.oCards, game.oMod) : oVisible + " + ?"}
                {game.oMod !== 0 && <span className="mod"> ({game.oMod > 0 ? "+" : ""}{game.oMod})</span>}
              </div>
            </div>
            <div className="flags">
              <span className="flag betflag amber">BET ×{game.oBet ?? 1}</span>
              {game.oShield && <span className="flag">SHIELD</span>}
              {game.oStay && <span className="flag">STAYED</span>}
            </div>
            {game.phase !== "bet" && game.phase !== "trumpReveal" && game.phase !== "bossIntro" && game.phase !== "death" && (
              <div className="mysteryRow">
                <span className="dim">{cfg.opp} TRUMPS ({game.oTrumps.length})</span>
                <div className="mysteryChips">
                  {game.oTrumps.map((_, i) => <span key={i} className="mysteryChip" />)}
                  {game.oTrumps.length === 0 && <span className="dim">—</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* center */}
      <div className="midzone">
        <LogFragmentToast text={logFragment} />
        {game.phase === "bet" && (
          <div className="betbox">
            <div className="dim">ANTE LOCKED — LOSER FORFEITS BET × {cfg.base} INTEGRITY</div>
            <div className="betrow">
              <span className="betval amber">YOU ×1</span>
              <span className="dim">vs</span>
              <span className="betval red">{cfg.opp} ×1</span>
            </div>
            <div className="dim">Trump cards can raise their bet or lower yours.</div>
            <button className="btn" onClick={dealIntent}>▸ DEAL</button>
          </div>
        )}
        {game.phase === "trumpReveal" && (
          <TrumpRevealOverlay
            myLabel="YOU" myNewTrumps={game.pTrumps.slice(game.pTrumpsShown || 0)}
            oppLabel={cfg.opp} oppNewTrumps={game.oTrumps.slice(game.oTrumpsShown || 0)}
            onContinue={beginHand}
            reduced={reduced}
          />
        )}
        {game.phase === "play" && (
          <div className="playmid">
            <DeckStack count={game.deck.length} />
            <div className="turnind">
              {canAct
                ? <span className="yourmove">▸ YOUR MOVE</span>
                : game.pStay && game.oStay
                  ? <span className="amber">LOCKING…</span>
                  : <span className="amber">{cfg.opp} IS THINKING <Dots /></span>}
              {timeLeft != null && <div className={"timer" + (timeLeft <= 5 ? " red" : "")}>⏻ {timeLeft}s</div>}
            </div>
          </div>
        )}
        {game.phase === "reveal" && <div className="revealtxt amber">▓▓ REVEALING MEMORY ▓▓</div>}
        {game.phase === "result" && game.result && (
          <div className={"resultbox banner " + (game.result.winner === "player" ? "bwin" : game.result.winner === "opp" ? "blose" : "btie")}>
            <div className={game.result.winner === "player" ? "win bigres" : game.result.winner === "opp" ? "lose bigres jitter" : "amber bigres"}>
              {game.result.winner === "player" ? "▸ HAND WON" : game.result.winner === "opp" ? "▸ HAND LOST" : "▸ DEADLOCK"}
            </div>
            <div className="dim">
              YOU {game.result.pT}{game.result.pBust ? " (OVERFLOW)" : ""} · {cfg.opp} {game.result.oT}{game.result.oBust ? " (OVERFLOW)" : ""}
              {game.result.winner !== "tie" && <> · −{game.result.dmg} INTEGRITY</>}
            </div>
            <button className="btn" onClick={continueAfterResult}>▸ CONTINUE</button>
          </div>
        )}
      </div>

      {/* player */}
      <div className={"zone posrel" + tutorialHi("player")}>
        {fx.dmg && fx.dmg.who === "p" && <div key={fx.dmg.key} className="dmgpop red">−{fx.dmg.amt}</div>}
        <div className="cards">
          {game.pCards.map((c, i) => (
            <Card key={i} card={c} hidden={false} danger={pT > game.target} delay={i * 90} swapped={fx.swap && c.hole} />
          ))}
          {fx.ghost && fx.ghost.side === "p" && <GhostCard v={fx.ghost.v} />}
          <div className={"totaltag" + (pT > game.target ? " red" : "")}>
            {pT}{game.pMod !== 0 && <span className="mod"> ({game.pMod > 0 ? "+" : ""}{game.pMod})</span>}
            {pT > game.target && " ⚠ OVERFLOW"}
          </div>
        </div>
        <div className="flags">
          <span className="flag betflag">BET ×{game.pBet ?? 1}</span>
          {game.pShield && <span className="flag">SHIELD</span>}
          {game.firewall && <span className="flag">FIREWALL</span>}
          {game.pStay && <span className="flag">STAYED</span>}
        </div>
        <HPBar label="USER — MEM.INTEGRITY" hp={game.pHP} max={100} />

        {game.phase === "play" && (
          <div className="actions">
            <button className={"btn" + tutorialHi("hitbtn")} disabled={isTutorial ? tutorialRequire !== "hit" : (!canAct || game.deck.length === 0)} onClick={isTutorial ? tutorialHit : doHit}>HIT</button>
            <button className={"btn" + tutorialHi("staybtn")} disabled={isTutorial ? tutorialRequire !== "stay" : !canAct} onClick={isTutorial ? tutorialStay : doStay}>STAY</button>
          </div>
        )}

        {game.phase !== "bet" && game.phase !== "trumpReveal" && game.phase !== "bossIntro" && game.phase !== "death" && (
          <>
            <div className="dim">YOUR TRUMPS ({game.pTrumps.length})</div>
            <div className="trumps">
              {game.pTrumps.map((id, i) => (
                <button
                  key={i}
                  className={"trump" + tutorialHi(`trump${i}`)}
                  disabled={isTutorial ? tutorialRequire !== `trump${i}` : !canAct}
                  onClick={() => (isTutorial ? tutorialTrump(i) : useTrump(i))}
                  title={TRUMPS[id].desc}
                >
                  <span className="ticonrow">
                    <Sprite rows={ICONS[id]} scale={2} color="#ffb347" className="ticon" />
                    <span className="tname">{TRUMPS[id].name}</span>
                  </span>
                  <span className="tdesc">{TRUMPS[id].desc}</span>
                </button>
              ))}
              {game.pTrumps.length === 0 && <span className="dim">NO TRUMP CARDS LOADED</span>}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

/* ---------------- shell + styles ---------------- */
function Shell({ children, screen, intensity, reduced, fx, lowHP, particles, onMenu, showMenu, onSettings, largeText, colorblind, actTint }) {
  const ab = intensity > 0.35;
  return (
    <div
      className={"crt" + (reduced ? " reduced" : "") + (largeText ? " largeText" : "") + (colorblind ? " colorblind" : "") + (actTint >= 2 ? " actTint" + actTint : "") + (fx && fx.shake && !reduced ? " shake" : "") + (fx && fx.invert && !reduced ? " inv" : "")}
      data-ab={ab ? "1" : "0"}
    >
      <style>{CSS}</style>
      <GlitchOverlay intensity={intensity} reduced={reduced} burst={fx && fx.rage} />
      <Noise intensity={intensity} reduced={reduced} />
      <Particles kind={particles} reduced={reduced} />
      {fx && fx.flash && !reduced && <div className="redflash" />}
      {fx && fx.greenFlash && !reduced && <div className="greenflash" />}
      {lowHP && !reduced && <div className="pulse" />}
      <div className="scan" />
      {!reduced && <div className="sweep" />}
      {showMenu && <button className="menubtn" onClick={onMenu}>[MENU]</button>}
      <button className="gearbtn" onClick={onSettings} aria-label="Settings">⚙</button>
      <div className="frame" key={screen}>{children}</div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }
button, input, a { touch-action: manipulation; }
.crt {
  min-height: 100vh; background: #020503; color: #3aff7c;
  font-family: ui-monospace, 'Cascadia Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  position: relative; overflow-x: hidden;
  text-shadow: 0 0 5px rgba(58,255,124,.4);
  animation: flick 4s infinite;
}
.crt[data-ab="1"] .frame { text-shadow: 1px 0 rgba(255,0,60,.45), -1px 0 rgba(0,200,255,.35), 0 0 5px rgba(58,255,124,.35); }
.crt.reduced { animation: none; }
.crt.shake { animation: shake .38s steps(6); }
.crt.inv { filter: invert(1) hue-rotate(180deg); }
@keyframes shake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-4px,2px)} 40%{transform:translate(4px,-3px)} 60%{transform:translate(-3px,-2px)} 80%{transform:translate(3px,3px)} }
@keyframes flick { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.9} 94%{opacity:1} }
.pixcanvas { image-rendering: pixelated; image-rendering: crisp-edges; display:block; max-width:100%; height:auto; }
.eyecv { filter: drop-shadow(0 0 10px rgba(58,255,124,.3)); }
.avatar { filter: drop-shadow(0 0 8px rgba(58,255,124,.25)); }
.avatar.bob { animation: bob 1.6s steps(2) infinite; }
.avatar.twitchy { animation: twitch 2.4s steps(3) infinite; }
@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }
@keyframes twitch { 0%,100%{transform:translate(0,0)} 46%{transform:translate(0,3px)} 50%{transform:translate(-3px,1px) skewX(4deg)} 54%{transform:translate(2px,2px)} }
.reduced .avatar, .reduced .segfault, .reduced .timer.red, .reduced .card, .reduced .frame, .reduced .bigres.jitter { animation:none !important; }
.scan {
  pointer-events:none; position:absolute; inset:0; z-index:7;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,.3) 0 1px, transparent 1px 3px),
    radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.62) 100%);
}
.sweep {
  pointer-events:none; position:absolute; left:0; right:0; height:64px; z-index:7;
  background: linear-gradient(180deg, transparent, rgba(140,255,175,.06), transparent);
  animation: sweep 7s linear infinite;
}
@keyframes sweep { from{ top:-70px } to{ top:110% } }
.noise { position:absolute; inset:0; width:100%; height:100%; z-index:6; pointer-events:none; opacity:.55; mix-blend-mode:screen; image-rendering:pixelated; }
.glitchlayer { position:absolute; inset:0; z-index:8; pointer-events:none; }
.glitchbar { position:absolute; left:0; right:0; mix-blend-mode:screen; }
.redflash { position:absolute; inset:0; z-index:9; pointer-events:none; background:rgba(255,20,40,.28); animation: rf .45s steps(4) both; }
.greenflash { position:absolute; inset:0; z-index:9; pointer-events:none; background:rgba(58,255,124,.22); animation: rf .45s steps(4) both; }
@keyframes rf { from{opacity:1} to{opacity:0} }
.pulse { position:absolute; inset:0; z-index:6; pointer-events:none; box-shadow: inset 0 0 110px rgba(255,0,32,.4); animation: beat 1.15s infinite; }
@keyframes beat { 0%,100%{opacity:.2} 10%{opacity:.75} 22%{opacity:.3} 32%{opacity:.6} 45%{opacity:.2} }
.bits { position:absolute; inset:0; z-index:3; pointer-events:none; }
.bit { position:absolute; }
.bit.gold { background:#ffb347; box-shadow:0 0 4px rgba(255,179,71,.6); top:-6px; animation: fall linear infinite; }
.bit.ash { background:#8a4040; box-shadow:0 0 4px rgba(200,60,60,.4); bottom:-6px; animation: rise linear infinite; }
@keyframes fall { from{ transform:translateY(-10px) } to{ transform:translateY(110vh) } }
@keyframes rise { from{ transform:translateY(10px) } to{ transform:translateY(-110vh) } }
.whisper {
  position:absolute; z-index:5; pointer-events:none; font-size:13px; letter-spacing:.2em;
  color:rgba(150,190,150,.4); text-shadow:none; text-transform:lowercase; animation: whisp 2.2s steps(6) both;
}
@keyframes whisp { 0%{opacity:0; transform:translateY(4px)} 25%{opacity:.8} 100%{opacity:0; transform:translateY(-8px)} }
.cheatoverlay {
  position:absolute; inset:0; z-index:12; pointer-events:none;
  background:rgba(2,2,4,.82); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
  animation: lunge 1.6s steps(8) both;
}
.cheattxt { color:#ff4455; letter-spacing:.25em; font-size:15px; text-shadow:0 0 12px rgba(255,68,85,.7); }
@keyframes lunge { 0%{ opacity:0; transform:scale(.4) } 12%{ opacity:1; transform:scale(1.25) } 22%{ transform:scale(1) } 80%{ opacity:1 } 100%{ opacity:0 } }
.menubtn {
  position:absolute; top:2px; left:2px; z-index:14; background:transparent; border:none; cursor:pointer;
  color:#ffb347; font-family:inherit; font-size:13px; opacity:.65; text-shadow:0 0 5px rgba(255,179,71,.4);
  padding:12px 10px; min-height:44px; display:flex; align-items:center;
  transition: opacity .15s ease;
}
.gearbtn {
  position:absolute; top:2px; right:2px; z-index:14; background:transparent; border:none; cursor:pointer;
  color:#5ad1e6; font-family:inherit; font-size:26px; line-height:1; opacity:.75; text-shadow:0 0 6px rgba(90,209,230,.5);
  padding:9px; min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center;
  transition: opacity .15s ease, transform .2s ease;
}
@media (hover: hover) {
  .menubtn:hover { opacity:1; }
  .gearbtn:hover { opacity:1; transform:rotate(25deg); }
}
.frame {
  position:relative; z-index:4; max-width:560px; margin:0 auto; padding:46px 12px 28px;
  display:flex; flex-direction:column; gap:10px; min-height:100vh; box-sizing:border-box;
  animation: crtOn .5s steps(8) both;
  transition: text-shadow 1.4s ease; /* corruption's chromatic aberration creeps in rather than snapping on */
}
@keyframes crtOn { 0%{ transform:scaleY(.02) } 60%{ transform:scaleY(1.03) } 100%{ transform:scaleY(1) } }
.center { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; min-height:82vh; text-align:center; }
.logo { color:#3aff7c; font-size:15px; line-height:1.2; margin:0; text-shadow:0 0 10px rgba(58,255,124,.55); }
.sub { color:#ffb347; letter-spacing:.35em; font-size:14px; text-shadow:0 0 8px rgba(255,179,71,.5); }
.protocoltag {
  font-family: 'Orbitron', ui-monospace, monospace; font-weight:900; font-size:15px;
  letter-spacing:.42em; color:#ffb347; text-shadow:0 0 10px rgba(255,179,71,.6), 0 0 22px rgba(255,179,71,.25);
}
.sub.red { color:#ff4455; text-shadow:0 0 8px rgba(255,68,85,.6); }
.acttitle { color:#ffb347; font-size:18px; letter-spacing:.2em; text-shadow:0 0 10px rgba(255,179,71,.5); }
.segfault { color:#ff4455; font-size:26px; letter-spacing:.15em; text-shadow:0 0 14px rgba(255,68,85,.7); animation: jit .18s steps(2) infinite; }
@keyframes jit { 0%,100%{transform:translate(0,0)} 50%{transform:translate(2px,-1px)} }
.bootlog { font-size:14px; opacity:.85; display:flex; flex-direction:column; gap:4px; text-align:left; }
.center.skippable { cursor:pointer; }
.bootslot { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:90px; }
.bootline { animation: bootLineIn .22s steps(4) both; }
@keyframes bootLineIn { from{ opacity:0; transform:translateY(4px) } to{ opacity:1; transform:translateY(0) } }
.bootlog.bootOut { animation: bootFade .2s steps(4) both; }
@keyframes bootFade { from{ opacity:1 } to{ opacity:0 } }
.bootHint { margin-top:6px; letter-spacing:.15em; font-size:12px; animation: pulsg 1.3s steps(2) infinite; }
.modebtns.bootIn { animation: bootIn .3s steps(6) both; }
@keyframes bootIn { from{ opacity:0; transform:translateY(6px) scale(.97) } to{ opacity:1; transform:none } }
.reduced .bootline, .reduced .bootlog.bootOut, .reduced .modebtns.bootIn, .reduced .bootHint { animation:none !important; }
.introlines { display:flex; flex-direction:column; gap:8px; font-size:15px; min-height:110px; text-align:left; }
.amber { color:#ffb347; text-shadow:0 0 7px rgba(255,179,71,.45); }
.red { color:#ff4455; text-shadow:0 0 7px rgba(255,68,85,.5); }
.dim { opacity:.6; font-size:13px; }
.win { color:#3aff7c; }
.lose { color:#ff4455; text-shadow:0 0 8px rgba(255,68,85,.5); }
.bigres { font-size:18px; letter-spacing:.14em; }
.bigres.jitter { animation: jit .2s steps(2) infinite; }
.cursor { animation: blink 1s step-end infinite; }
@keyframes blink { 50%{opacity:0} }
.modebtns { display:flex; flex-direction:column; gap:8px; align-items:center; }
.hud { border:2px solid #14512d; padding:8px 10px; background:rgba(6,20,12,.65); box-shadow:4px 4px 0 #06170d; }
.hudrow { display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
.dlgbar { min-height:36px; font-size:14px; color:#ffb347; text-shadow:0 0 7px rgba(255,179,71,.4); }
.zone { border:2px solid #14512d; padding:10px; background:rgba(6,20,12,.55); display:flex; flex-direction:column; gap:8px; box-shadow:4px 4px 0 #06170d; }
.posrel { position:relative; }
.opprow { display:flex; gap:12px; align-items:flex-start; }
.oppcol { flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }
.midzone { min-height:72px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; }
.playmid { display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap; }
.turnind { display:flex; flex-direction:column; align-items:flex-start; gap:4px; font-size:15px; letter-spacing:.1em; }
.yourmove { color:#3aff7c; animation: pulsg 1.1s steps(2) infinite; }
@keyframes pulsg { 0%,100%{opacity:1} 50%{opacity:.45} }
.reduced .yourmove { animation:none; }
.deckstack { position:relative; width:50px; height:66px; }
.dcard { position:absolute; width:44px; height:60px; border:2px solid #1d7a44; background:#07190f; box-shadow:2px 2px 0 #04100a; }
.dcard.d3 { top:4px; left:6px; opacity:.5; }
.dcard.d2 { top:2px; left:3px; opacity:.75; }
.dcard.d1 { top:0; left:0; display:flex; align-items:center; justify-content:center; }
.dcount { position:absolute; bottom:-14px; left:0; right:0; text-align:center; font-size:12px; opacity:.7; }
.cards { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.card {
  position:relative; width:44px; height:62px; border:2px solid #3aff7c;
  display:flex; align-items:center; justify-content:center;
  background:rgba(8,28,16,.88);
  box-shadow:3px 3px 0 #06170d, inset 0 0 8px rgba(58,255,124,.12);
  animation: cardIn .3s steps(5) both;
}
@keyframes cardIn { from{ transform:translate(-14px,-30px) scale(.55); opacity:0 } to{ transform:none; opacity:1 } }
.card.flip { animation: flipIn .45s steps(7) both; }
@keyframes flipIn { 0%{ transform:scaleX(.08); filter:brightness(1.5) } 60%{ transform:scaleX(1.15) } 100%{ transform:scaleX(1); filter:none } }
.card.swapped { animation: swapPulse .9s steps(6) both; }
@keyframes swapPulse { 0%{ transform:translateY(0); border-color:#ffb347; filter:brightness(1.3) } 40%{ transform:translateY(-8px) } 100%{ transform:translateY(0); filter:none } }
.card.ghost { animation: shatterFx .7s steps(5) both; pointer-events:none; border-color:#ff4455; color:#ff4455; }
@keyframes shatterFx { 0%{ transform:scale(1) rotate(0deg); opacity:1 } 40%{ transform:scale(1.25) rotate(6deg); filter:brightness(1.4) } 100%{ transform:scale(.4) rotate(-14deg) translateY(18px); opacity:0 } }
.cval { font-size:20px; }
.pip { position:absolute; font-size:11px; opacity:.75; }
.pip.tl { top:2px; left:4px; }
.pip.br { bottom:2px; right:4px; transform:rotate(180deg); }
.card.back { border-color:#1d7a44; background:
  repeating-linear-gradient(45deg, rgba(29,122,68,.22) 0 3px, transparent 3px 6px),
  rgba(5,18,10,.9);
}
.card.back .rune { color:#1d7a44; font-size:16px; }
.dcard .rune { color:#1d7a44; font-size:14px; }
.card.danger { border-color:#ff4455; color:#ff4455; box-shadow:3px 3px 0 #170608, inset 0 0 8px rgba(255,68,85,.2); }
.card.danger .pip { color:#ff4455; }
.totaltag { font-size:16px; margin-left:6px; }
.totaltag.red { color:#ff4455; }
.mod { font-size:13px; opacity:.7; }
.flags { display:flex; gap:6px; min-height:16px; }
.flag { font-size:12px; border:1px solid #ffb347; color:#ffb347; padding:2px 7px; letter-spacing:.1em; }
.gimmickFlag { border-color:#5ad1e6; color:#5ad1e6; align-self:flex-start; }
.flag.betflag { border-color:#5ad1e6; color:#5ad1e6; }
.flag.betflag.amber { border-color:#ff6a6a; color:#ff6a6a; }
.mysteryRow { display:flex; flex-direction:column; gap:4px; margin-top:2px; }
.mysteryChips { display:flex; gap:4px; flex-wrap:wrap; min-height:14px; }
.mysteryChip {
  width:11px; height:14px; border:1px solid #ff6a6a; background:
    repeating-linear-gradient(45deg, rgba(255,106,106,.25) 0 2px, transparent 2px 4px), rgba(20,6,6,.7);
  box-shadow:1px 1px 0 #170608;
}
.hpwrap { display:flex; flex-direction:column; gap:3px; }
.hplabel { display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px; font-size:13px; letter-spacing:.08em; }
.hpbar { height:12px; border:2px solid #14512d; background:#04120a; }
.hpbar.hphit { animation: hpflash .45s steps(3) both; }
@keyframes hpflash { 0%{ background:#e8fff0; border-color:#e8fff0 } 100%{ background:#04120a; border-color:#14512d } }
.hpfill { height:100%; background:#3aff7c; box-shadow:0 0 8px rgba(58,255,124,.5); transition:width .5s steps(8); }
.hpfill.amber { background:#ffb347; box-shadow:0 0 8px rgba(255,179,71,.5); }
.hpfill.crit { background:#ff4455; box-shadow:0 0 8px rgba(255,68,85,.6); }
.dmgpop {
  position:absolute; top:6px; right:14px; z-index:5; font-size:20px; color:#ffb347;
  text-shadow:0 0 8px rgba(255,179,71,.6); animation: pop 1.2s steps(8) both; pointer-events:none;
}
.dmgpop.red { color:#ff4455; text-shadow:0 0 8px rgba(255,68,85,.6); }
@keyframes pop { 0%{ transform:translateY(0); opacity:1 } 100%{ transform:translateY(-36px); opacity:0 } }
.actions { display:flex; gap:8px; }
.btn {
  background:#06170d; border:2px solid #3aff7c; color:#3aff7c; font-family:inherit;
  padding:10px 18px; font-size:15px; letter-spacing:.12em; cursor:pointer; touch-action:manipulation;
  text-shadow:0 0 6px rgba(58,255,124,.45); box-shadow:3px 3px 0 #041008;
  transition: background-color .15s ease, transform .08s ease, box-shadow .08s ease;
}
.btn:active:not(:disabled) { transform:translate(2px,2px); box-shadow:1px 1px 0 #041008; }
.btn:focus-visible { outline:2px solid #ffb347; outline-offset:2px; }
.btn:disabled { opacity:.3; cursor:default; }
.btn.big { font-size:17px; padding:13px 26px; }
.btn.amberbtn { border-color:#ffb347; color:#ffb347; text-shadow:0 0 6px rgba(255,179,71,.45); }
.btn.cyanbtn { border-color:#5ad1e6; color:#5ad1e6; text-shadow:0 0 6px rgba(90,209,230,.5); }
@media (hover: hover) {
  .btn:hover:not(:disabled) { background:rgba(58,255,124,.14); }
  .btn.amberbtn:hover:not(:disabled) { background:rgba(255,179,71,.14); }
  .btn.cyanbtn:hover:not(:disabled) { background:rgba(90,209,230,.14); }
}
.mpdesc { font-size:13px; opacity:.6; max-width:340px; line-height:1.6; text-align:center; }
.settingsList { display:flex; flex-direction:column; gap:2px; width:100%; max-width:420px; }
.settingsRow {
  display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
  border:1px solid #123322; padding:10px 12px; background:rgba(6,20,12,.4);
}
.settingsLabel { display:flex; flex-direction:column; gap:3px; text-align:left; font-size:13px; letter-spacing:.08em; color:#3aff7c; }
.settingsLabel .dim { font-size:11px; letter-spacing:normal; max-width:260px; }
.settingsFuture { justify-content:center; border-style:dashed; opacity:.7; }
.codexList {
  display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:8px;
  width:100%; max-width:520px; max-height:56vh; overflow-y:auto; padding:4px 2px;
}
.codexEntry {
  display:flex; align-items:center; gap:8px; border:1px solid #ff6a6a; background:rgba(24,8,8,.4);
  padding:8px; text-align:left; box-shadow:2px 2px 0 #170608;
}
.codexEntry.defeated { border-color:#3aff7c; background:rgba(6,20,12,.4); box-shadow:2px 2px 0 #06170d; }
.codexIcon { flex:none; width:40px; display:flex; align-items:center; justify-content:center; }
.codexInfo { display:flex; flex-direction:column; gap:2px; min-width:0; }
.codexName { font-size:12px; color:#ff8080; word-break:break-word; }
.codexEntry.defeated .codexName { color:#7fffb0; }
.codexStatus { font-size:10px; opacity:.6; letter-spacing:.1em; }
.codexLore { font-size:10px; opacity:.75; line-height:1.4; margin-top:2px; font-style:italic; }
.tutorialCoach {
  border:2px solid #5ad1e6; background:rgba(8,26,30,.75); padding:10px 12px;
  display:flex; flex-direction:column; gap:8px; align-items:center; text-align:center;
  box-shadow:4px 4px 0 #06170d;
}
.tutorialCoachText { font-size:14px; line-height:1.6; color:#5ad1e6; text-shadow:0 0 6px rgba(90,209,230,.4); }
.tutorialHint { letter-spacing:.1em; animation: pulsg 1.1s steps(2) infinite; }
.reduced .tutorialHint { animation:none; }
.tutorialGlow {
  outline:2px solid #5ad1e6; outline-offset:2px;
  box-shadow:0 0 0 4px rgba(90,209,230,.15), 0 0 16px rgba(90,209,230,.55);
  animation: tutorialPulse 1.1s ease-in-out infinite;
}
@keyframes tutorialPulse {
  0%,100% { box-shadow:0 0 0 4px rgba(90,209,230,.1), 0 0 10px rgba(90,209,230,.35); }
  50% { box-shadow:0 0 0 6px rgba(90,209,230,.2), 0 0 20px rgba(90,209,230,.7); }
}
.reduced .tutorialGlow { animation:none; }
.letterboxBar {
  position:fixed; left:0; right:0; height:6vh; min-height:22px; max-height:60px;
  background:#000; z-index:16; pointer-events:none;
}
.letterboxBar.top { top:0; }
.letterboxBar.bottom { bottom:0; }
.bossIntroCard {
  position:absolute; inset:0; z-index:15; background:rgba(2,2,4,.94);
  display:flex; align-items:center; justify-content:center;
  animation: bossCardIn .4s steps(8) both;
}
.reduced .bossIntroCard { animation:none; }
@keyframes bossCardIn { from{ opacity:0 } to{ opacity:1 } }
.bossIntroInner {
  display:flex; flex-direction:column; align-items:center; gap:14px; padding:20px; text-align:center; max-width:90%;
}
.bossIntroTag { font-size:13px; letter-spacing:.35em; color:#ff6a6a; text-shadow:0 0 10px rgba(255,106,106,.5); }
.bossIntroName {
  font-family:'Orbitron', ui-monospace, monospace; font-weight:900; font-size:clamp(22px,7vw,40px);
  color:#ff4455; text-shadow:0 0 16px rgba(255,68,85,.7), 0 0 30px rgba(255,68,85,.3);
  letter-spacing:.06em; word-break:break-word;
}
.bossIntroCard.final .bossIntroName { color:#ffd0d0; text-shadow:0 0 20px rgba(255,68,85,.9), 0 0 40px rgba(255,68,85,.5); }
.bossIntroSub { font-size:12px; letter-spacing:.15em; color:#ffb347; opacity:.9; max-width:320px; }
.deathSequence {
  position:absolute; inset:0; z-index:18; background:rgba(10,2,2,.75);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
  animation: deathIn 2.3s ease-out both;
}
@keyframes deathIn { 0%{ background:rgba(255,68,85,.5) } 15%{ background:rgba(10,2,2,.85) } 100%{ background:rgba(10,2,2,.75) } }
.reduced .deathSequence { animation:none; }
.deathText {
  font-family:'Orbitron', ui-monospace, monospace; font-weight:900; font-size:clamp(24px,8vw,44px);
  color:#ff4455; text-shadow:0 0 20px rgba(255,68,85,.8), 0 0 40px rgba(255,68,85,.4); letter-spacing:.08em;
}
.deathSub { font-size:13px; letter-spacing:.3em; color:#ff8080; opacity:.85; }
.cheatBanner {
  position:absolute; top:50%; left:8px; right:8px; transform:translateY(-50%); z-index:17;
  border:2px solid #ff4455; background:rgba(20,4,6,.92); padding:12px 14px; text-align:center;
  box-shadow:0 0 24px rgba(255,68,85,.35), 5px 5px 0 #170608;
  animation: cheatBannerIn .25s steps(6) both;
  pointer-events:none;
}
.reduced .cheatBanner { animation:none; }
@keyframes cheatBannerIn { from{ opacity:0; transform:translateY(-50%) scale(.94) } to{ opacity:1; transform:translateY(-50%) scale(1) } }
.cheatBannerTag { font-size:11px; letter-spacing:.25em; color:#ff8080; margin-bottom:6px; }
.cheatBannerText { font-size:15px; color:#ffdede; text-shadow:0 0 10px rgba(255,68,85,.6); }
.logFragment {
  display:flex; flex-direction:column; gap:4px; border:1px dashed #2e5c40; background:rgba(6,20,12,.5);
  padding:8px 10px; margin-bottom:8px; animation: oppPopIn .3s steps(6) both;
}
.reduced .logFragment { animation:none; }
.logFragmentTag { font-size:9px; letter-spacing:.2em; color:#3aff7c; opacity:.7; }
.logFragmentText { font-size:11px; line-height:1.5; color:#8fdba0; font-style:italic; }
.oppTrumpPopup {
  border:2px solid #ff6a6a; background:rgba(24,8,8,.8); padding:9px 12px;
  display:flex; flex-direction:column; gap:6px; box-shadow:4px 4px 0 #170608;
  animation: oppPopIn .3s steps(6) both;
  max-width:100%; box-sizing:border-box;
}
@keyframes oppPopIn { from{ opacity:0; transform:translateY(-6px) scale(.97) } to{ opacity:1; transform:none } }
.reduced .oppTrumpPopup { animation:none; }
.oppTrumpPopupTag { font-size:11px; letter-spacing:.2em; color:#ff8080; opacity:.85; }
.oppTrumpPopupCard { display:flex; align-items:flex-start; gap:10px; }
.oppTrumpPopupCard .trumpRevealInfo { color:#ffcbb0; }
.lobbycode {
  font-size:clamp(22px,9vw,34px); letter-spacing:clamp(.15em,3.5vw,.5em); padding:10px clamp(10px,4vw,22px);
  border:2px solid #5ad1e6; color:#5ad1e6; max-width:100%;
  background:rgba(10,30,34,.6); text-shadow:0 0 12px rgba(90,209,230,.6); box-shadow:4px 4px 0 #06170d;
}
.codeinput {
  font-family: inherit; font-size:clamp(20px,7vw,28px); letter-spacing:clamp(.25em,3vw,.5em); text-align:center;
  width:min(160px,70vw); max-width:100%;
  background:#06170d; border:2px solid #3aff7c; color:#3aff7c; padding:8px 4px; text-transform:uppercase;
  box-shadow:3px 3px 0 #041008; transition: border-color .15s ease;
}
.codeinput:focus { outline:2px solid #ffb347; outline-offset:2px; border-color:#ffd699; }
.codeinput::placeholder { color:#1d7a44; }
.nameinput {
  font-family: inherit; font-size:16px; letter-spacing:.2em; text-align:center;
  width:min(200px,80vw); max-width:100%;
  background:#06170d; border:2px solid #5ad1e6; color:#5ad1e6; padding:8px 10px; text-transform:uppercase;
  box-shadow:3px 3px 0 #041008; transition: border-color .15s ease;
}
.nameinput:focus { outline:2px solid #ffb347; outline-offset:2px; border-color:#ffd699; }
.nameinput::placeholder { color:#1d5a63; }
.trumps { display:flex; gap:6px; flex-wrap:wrap; }
.trump {
  background:#170f04; border:2px solid #ffb347; color:#ffb347; font-family:inherit;
  padding:6px 8px; cursor:pointer; touch-action:manipulation; display:flex; flex-direction:column; gap:3px; max-width:158px; text-align:left;
  box-shadow:3px 3px 0 #0d0802;
  transition: background-color .15s ease, transform .1s ease, box-shadow .1s ease;
}
.trump:active:not(:disabled) { transform:translate(2px,2px); box-shadow:1px 1px 0 #0d0802; }
.trump:focus-visible { outline:2px solid #3aff7c; outline-offset:2px; }
.trump:disabled { opacity:.35; cursor:default; }
@media (hover: hover) {
  .trump:hover:not(:disabled) { background:rgba(255,179,71,.16); transform:translateY(-2px); }
}
.ticonrow { display:flex; align-items:center; gap:6px; }
.ticon { flex:none; }
.tname { font-size:13px; letter-spacing:.08em; }
.tdesc { font-size:11px; opacity:.65; line-height:1.35; }

.trumpReveal {
  position:absolute; inset:0; z-index:13; background:rgba(2,4,3,.94);
  display:flex; flex-direction:column; align-items:center; gap:14px;
  padding:22px 14px; overflow-y:auto; text-align:center;
  animation: trumpRevealIn .35s steps(8) both;
}
@keyframes trumpRevealIn { from{ opacity:0; transform:scale(.96) } to{ opacity:1; transform:none } }
.reduced .trumpReveal { animation:none; }
.trumpRevealTitle { color:#ffb347; letter-spacing:.3em; font-size:15px; text-shadow:0 0 10px rgba(255,179,71,.55); flex:none; }
.trumpRevealCols { display:flex; flex-direction:column; gap:16px; width:100%; max-width:420px; }
.trumpRevealCol { display:flex; flex-direction:column; gap:6px; min-height:20px; }
.trumpRevealName { font-size:14px; letter-spacing:.15em; padding-bottom:4px; border-bottom:1px solid currentColor; }
.trumpRevealCol.mine { color:#3aff7c; }
.trumpRevealCol.theirs { color:#ff8080; }
.trumpRevealList { display:flex; flex-direction:column; gap:8px; }
.tchipSlot { display:flex; }

/* stage 1: a small chip slides in from the side, like being dealt across the table */
.tchip {
  width:96px; height:24px; border:1px solid #3aff7c; position:relative;
  background: repeating-linear-gradient(90deg, rgba(58,255,124,.2) 0 2px, transparent 2px 6px), #0a1f14;
  display:flex; align-items:center; justify-content:center; gap:6px;
  box-shadow:0 0 8px rgba(58,255,124,.35);
  animation: chipSlideIn .45s steps(8) both;
}
.tchip.theirs {
  border-color:#ff6a6a; box-shadow:0 0 8px rgba(255,106,106,.35);
  background: repeating-linear-gradient(90deg, rgba(255,106,106,.2) 0 2px, transparent 2px 6px), #1f0a0a;
}
.tchipCore { width:6px; height:6px; flex:none; background:#3aff7c; box-shadow:0 0 6px rgba(58,255,124,.85); animation: chipCorePulse .5s ease-in-out infinite; }
.tchip.theirs .tchipCore { background:#ff6a6a; box-shadow:0 0 6px rgba(255,106,106,.85); }
.tchipLabel { font-size:11px; letter-spacing:.1em; color:#3aff7c; }
.tchip.theirs .tchipLabel { color:#ff6a6a; }
@keyframes chipSlideIn { from{ transform:translateX(-90px); opacity:0 } to{ transform:translateX(0); opacity:1 } }
@keyframes chipCorePulse { 0%,100%{opacity:.35} 50%{opacity:1} }
.reduced .tchip, .reduced .tchipCore { animation:none; }

/* stage 2: the chip pops upright into the full info card */
.trumpRevealCard {
  position:relative; display:flex; align-items:flex-start; gap:8px; text-align:left; width:100%;
  border:2px solid #3aff7c; background:rgba(6,20,12,.6); padding:6px 10px 6px 8px; box-shadow:2px 2px 0 #06170d;
  animation: chipPopUp .32s steps(6) both; transform-origin: 20% 50%;
}
.trumpRevealCard.theirs { border-color:#ff6a6a; background:rgba(24,8,8,.5); box-shadow:2px 2px 0 #170608; }
@keyframes chipPopUp {
  0% { transform: scaleY(.2); opacity:.6; }
  55% { transform: scaleY(1.12); opacity:1; }
  100% { transform: scaleY(1); }
}
.reduced .trumpRevealCard { animation:none; }

/* Large Text setting — scales the classes people most need to actually
   read (body/description text) rather than the whole UI uniformly, which
   would blow out card layouts and button rows. */
.largeText .dim { font-size:15px; }
.largeText .tdesc { font-size:13px; line-height:1.4; }
.largeText .tname { font-size:15px; }
.largeText .dlgbar { font-size:16px; min-height:40px; }
.largeText .introlines { font-size:17px; }
.largeText .turnind { font-size:17px; }
.largeText .hplabel { font-size:15px; }
.largeText .mpdesc { font-size:15px; }
.largeText .flag { font-size:14px; }
.largeText .btn { font-size:17px; }
.largeText .btn.big { font-size:19px; }
.largeText .acttitle { font-size:20px; }
.largeText .trumpRevealTitle { font-size:17px; }
.largeText .settingsLabel { font-size:15px; }
.largeText .settingsLabel .dim { font-size:13px; }
.largeText .tutorialCoachText { font-size:16px; }

/* Colorblind mode: red is the color most often confused with green for
   red-green colorblind players (the most common form), which is exactly
   the distinction this game leans on hardest (danger vs safe, opponent vs
   you). Rather than touch every decorative use of red throughout the CSS,
   this overrides specifically the classes that carry real game-state
   meaning, swapping red for a blue that reads clearly against the green. */
.colorblind .card.danger { border-color:#4a9eff; color:#4a9eff; box-shadow:3px 3px 0 #06101a, inset 0 0 8px rgba(74,158,255,.25); }
.colorblind .card.danger .pip { color:#4a9eff; }
.colorblind .flag.betflag.amber { border-color:#4a9eff; color:#4a9eff; }
.colorblind .mysteryChip { border-color:#4a9eff; background: repeating-linear-gradient(45deg, rgba(74,158,255,.25) 0 2px, transparent 2px 4px), rgba(6,14,24,.7); }
.colorblind .dmgpop.red { color:#4a9eff; text-shadow:0 0 8px rgba(74,158,255,.6); }
.colorblind .trumpRevealCol.theirs { color:#4a9eff; }
.colorblind .trumpRevealCol.theirs .trumpRevealCard { border-color:#4a9eff; background:rgba(8,16,26,.5); box-shadow:2px 2px 0 #06101a; }
.colorblind .trumpRevealCol.theirs .trumpRevealInfo { color:#bcdcff; }
.colorblind .oppTrumpPopup { border-color:#4a9eff; background:rgba(8,16,26,.8); box-shadow:4px 4px 0 #06101a; }
.colorblind .oppTrumpPopupTag { color:#7fc0ff; }
.colorblind .oppTrumpPopupCard .trumpRevealInfo { color:#bcdcff; }
.colorblind .codexEntry { border-color:#4a9eff; background:rgba(8,16,26,.4); box-shadow:2px 2px 0 #06101a; }
.colorblind .codexEntry .codexName { color:#7fc0ff; }
.colorblind .tchip.theirs { border-color:#4a9eff; box-shadow:0 0 8px rgba(74,158,255,.35); background: repeating-linear-gradient(90deg, rgba(74,158,255,.2) 0 2px, transparent 2px 6px), #08101a; }
.colorblind .tchip.theirs .tchipCore { background:#4a9eff; box-shadow:0 0 6px rgba(74,158,255,.85); }
.colorblind .tchip.theirs .tchipLabel { color:#4a9eff; }
.colorblind .redflash { background:rgba(74,158,255,.28); }

/* Per-act color grading — Act 1 is the baseline (untinted), Act 2 pushes
   warmer/gilded, Act 3 pushes desaturated and harsher. Subtle on purpose;
   this should read as "the light down here is different," not a color
   filter slapped over the whole screen. */
.actTint2 { filter: sepia(.12) saturate(1.12) hue-rotate(-6deg) brightness(1.02); }
.actTint3 { filter: saturate(.82) contrast(1.1) hue-rotate(6deg) brightness(.96); }
.trumpRevealInfo { display:flex; flex-direction:column; gap:2px; color:#ffb347; }
.trumpRevealCard.theirs .trumpRevealInfo { color:#ffcbb0; }
.betbox { display:flex; flex-direction:column; align-items:center; gap:10px; }
.betrow { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center; }
.betval { font-size:18px; }
input[type=range] { -webkit-appearance:none; appearance:none; width:150px; height:6px; background:#0a2a17; border:1px solid #1d7a44; }
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance:none; appearance:none; width:14px; height:20px; background:#3aff7c;
  border:2px solid #0a2a17; box-shadow:2px 2px 0 #041008; cursor:pointer;
}
input[type=range]::-moz-range-thumb {
  width:12px; height:18px; background:#3aff7c; border:2px solid #0a2a17; border-radius:0; cursor:pointer;
}
.timer { font-size:14px; letter-spacing:.1em; color:#ffb347; }
.timer.red { color:#ff4455; animation: jit .2s steps(2) infinite; }
.revealtxt { letter-spacing:.2em; animation: blink 1s step-end infinite; }
.resultbox { display:flex; flex-direction:column; align-items:center; gap:8px; }
.banner {
  width:100%; box-sizing:border-box; padding:10px; border:2px solid #14512d; background:rgba(6,20,12,.8);
  box-shadow:4px 4px 0 #06170d; animation: slam .35s steps(5) both;
}
.banner.bwin { border-color:#3aff7c; }
.banner.blose { border-color:#ff4455; background:rgba(24,6,9,.8); box-shadow:4px 4px 0 #170608; }
.banner.btie { border-color:#ffb347; }
@keyframes slam { 0%{ transform:scale(1.5); opacity:0 } 70%{ transform:scale(.96); opacity:1 } 100%{ transform:scale(1) } }

/* touch devices: bigger hit areas, independent of visual size */
@media (pointer: coarse) {
  .btn { padding:11px 18px; min-height:44px; }
  .btn.big { padding:14px 26px; }
  .trump { padding:9px 10px; min-height:44px; }
  input[type=range]::-webkit-slider-thumb { width:20px; height:26px; }
  input[type=range]::-moz-range-thumb { width:18px; height:24px; }
}

/* phones, portrait — wide enough to also catch larger modern devices
   (iPhone Pro Max etc. are ~430px, so 420px was missing them) */
@media (max-width:480px) {
  .frame { padding:44px 10px 22px; gap:8px; }
  .card { width:38px; height:54px; }
  .cval { font-size:18px; }
  .logo { font-size:14px; }
  .opprow { align-items:center; gap:8px; }
  .opprow .eyecv { max-width:38vw !important; }
  .avatar { max-width:32vw !important; }
  .playmid { gap:10px; }
  .deckstack { width:44px; height:58px; }
  .dcard { width:38px; height:52px; }
  .trump { max-width:140px; }
  .hud, .zone { padding:8px; }
}

/* small/older phones */
@media (max-width:360px) {
  .frame { padding:44px 8px 18px; }
  .card { width:33px; height:47px; }
  .cval { font-size:15px; }
  .pip { font-size:10px; }
  .logo { font-size:12px; }
  .acttitle { font-size:16px; }
  .segfault { font-size:20px; }
  .protocoltag { font-size:13px; letter-spacing:.3em; }
  .eyecv { max-width:70vw !important; }
  .opprow .eyecv { max-width:36vw !important; }
  .avatar { max-width:30vw !important; }
  .trump { max-width:120px; }
  .tdesc { display:none; }
  .btn.big { padding:11px 18px; font-size:14px; }
}
`;
