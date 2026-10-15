// Original, quiet pentatonic music and cues synthesized with Web Audio.
// A separate UI preference: never added to the gameplay save.
export const SOUND_KEY = "suugaku-no-mori:sound:v1";
let enabled = false;
try {
  enabled = globalThis.localStorage?.getItem(SOUND_KEY) === "on";
} catch {
  /* Storage may be unavailable in private browsing. */
}
let ctx,
  master,
  musicGain,
  loop,
  scene = "forest",
  listening = false,
  duckUntil = 0;
const subscribers = new Set();
const musicVoices = new Set();
export const soundEnabled = () => enabled;
export const subscribeSound = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
const notify = () => subscribers.forEach((fn) => fn());
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
function audio() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) return null;
      ctx = new Audio();
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 1;
      musicGain.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}
function note(midi, at, duration, gain = 0.15, type = "sine", music = false) {
  if (!ctx || !enabled) return;
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = type;
  o.frequency.value = hz(midi);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.018);
  g.gain.exponentialRampToValueAtTime(0.001, at + duration);
  o.connect(g);
  g.connect(music ? musicGain : master);
  if (music) musicVoices.add(o);
  o.start(at);
  o.stop(at + duration + 0.03);
  o.onended = () => {
    musicVoices.delete(o);
    o.disconnect();
    g.disconnect();
  };
}
function stopMusic() {
  clearTimeout(loop);
  loop = null;
  for (const o of musicVoices) {
    try {
      o.stop();
    } catch {
      /* Already ended. */
    }
  }
  musicVoices.clear();
  if (musicGain && ctx) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(0, ctx.currentTime);
  }
}
function startMusic() {
  stopMusic();
  if (!enabled || !ctx || scene === "quiet" || globalThis.document?.hidden)
    return;
  const phrase = () => {
    if (!enabled || !ctx || scene === "quiet" || globalThis.document?.hidden)
      return;
    const now = ctx.currentTime + 0.05;
    musicGain.gain.setValueAtTime(Date.now() < duckUntil ? 0.12 : 1, now);
    const camp = scene === "camp",
      beat = camp ? 0.64 : 0.5;
    const melody = camp
      ? [67, 71, 74, 71, 69, 67, 64, 62]
      : [72, 76, 79, 76, 74, 72, 67, 69];
    melody.forEach((n, i) => {
      note(n, now + i * beat * 2, beat * 1.5, 0.055, "sine", true);
      if (i % 2 === 0)
        note(n - 24, now + i * beat * 2, beat * 3, 0.06, "triangle", true);
    });
    loop = setTimeout(phrase, beat * 16 * 1000);
  };
  phrase();
}
export function setSoundEnabled(value) {
  enabled = !!value;
  try {
    globalThis.localStorage?.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    /* Keep the in-memory choice. */
  }
  if (enabled) {
    audio();
    if (master && ctx) master.gain.setValueAtTime(0.32, ctx.currentTime);
    startMusic();
  } else {
    stopMusic();
    if (master && ctx) master.gain.setValueAtTime(0, ctx.currentTime);
  }
  notify();
}
export function setSoundScene(value) {
  scene = value;
  if (ctx) startMusic();
}
export function duckMusic() {
  duckUntil = Date.now() + 10000;
  if (musicGain && ctx) musicGain.gain.setValueAtTime(0.12, ctx.currentTime);
}
export function playCue(kind = "tap") {
  if (!enabled || globalThis.document?.hidden || !audio()) return;
  const scores = {
    tap: [[79, 0, 0.08]],
    correct: [
      [72, 0, 0.16],
      [76, 0.1, 0.18],
      [79, 0.2, 0.32],
    ],
    retry: [
      [67, 0, 0.18],
      [69, 0.15, 0.22],
    ],
    bite: [
      [81, 0, 0.1],
      [88, 0.12, 0.16],
    ],
    caught: [
      [76, 0, 0.14],
      [79, 0.1, 0.16],
      [84, 0.22, 0.38],
    ],
    crafted: [
      [60, 0, 0.18],
      [64, 0.12, 0.18],
      [67, 0.24, 0.2],
      [72, 0.36, 0.55],
    ],
    level: [
      [67, 0, 0.2],
      [72, 0.12, 0.2],
      [76, 0.24, 0.2],
      [79, 0.36, 0.6],
    ],
    place: [
      [60, 0, 0.1],
      [67, 0.07, 0.18],
    ],
  };
  const now = ctx.currentTime;
  (scores[kind] || scores.tap).forEach(([n, delay, d]) =>
    note(
      n,
      now + delay,
      d,
      kind === "tap" ? 0.06 : 0.14,
      kind === "bite" ? "triangle" : "sine",
    ),
  );
}
export function listenToGestures() {
  if (listening || !globalThis.document) return () => {};
  listening = true;
  const unlock = (e) => {
    if (!enabled || e.target.closest?.("[data-sound-toggle]")) return;
    const wasLocked = !ctx;
    audio();
    if (wasLocked) startMusic();
    const button = e.target.closest?.("button");
    if (button && !button.disabled) playCue("tap");
  };
  const visibility = () => {
    if (document.hidden) {
      stopMusic();
      if (ctx?.state === "running") ctx.suspend().catch(() => {});
    } else if (ctx && enabled) {
      audio();
      startMusic();
    }
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
  document.addEventListener("visibilitychange", visibility);
  return () => {
    listening = false;
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlock, true);
    document.removeEventListener("visibilitychange", visibility);
    stopMusic();
  };
}
