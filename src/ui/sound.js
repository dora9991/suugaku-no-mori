// Original pentatonic music / cues. This UI preference is separate from game saves.
export const SOUND_KEY = "suugaku-no-mori:sound:v1";
let enabled = true;
try {
  enabled = globalThis.localStorage?.getItem(SOUND_KEY) !== "off";
} catch {
  /* Keep the in-memory preference when storage is unavailable. */
}
let activated = false;
let ctx, master, musicGain, loop;
let scene = "forest",
  listening = false,
  duckUntil = 0;
const subscribers = new Set();
const musicVoices = new Set(),
  cueVoices = new Set();
export const soundEnabled = () => enabled;
export const subscribeSound = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
const notify = () => subscribers.forEach((fn) => fn());
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const CUES = {
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
function safe(operation) {
  try {
    return operation();
  } catch {
    return undefined;
  }
}
function settle(promise) {
  promise?.catch?.(() => {});
}
function audio() {
  if (!enabled || !activated) return null;
  let pending;
  try {
    if (!ctx || ctx.state === "closed") {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) return null;
      pending = new Audio();
      const nextMaster = pending.createGain(),
        nextMusic = pending.createGain();
      nextMaster.gain.value = 0.32;
      nextMaster.connect(pending.destination);
      nextMusic.gain.value = 1;
      nextMusic.connect(nextMaster);
      ctx = pending;
      master = nextMaster;
      musicGain = nextMusic;
      pending = null;
    }
    if (ctx.state === "suspended" || ctx.state === "interrupted")
      settle(ctx.resume());
    return ctx;
  } catch {
    if (pending) safe(() => settle(pending.close?.()));
    return null;
  }
}
function note(midi, at, duration, gain = 0.15, type = "sine", music = false) {
  if (!ctx || !enabled || !activated) return false;
  let oscillator, envelope;
  try {
    oscillator = ctx.createOscillator();
    envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = hz(midi);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(gain, at + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(music ? musicGain : master);
    const voices = music ? musicVoices : cueVoices;
    voices.add(oscillator);
    oscillator.onended = () => {
      voices.delete(oscillator);
      safe(() => oscillator.disconnect());
      safe(() => envelope.disconnect());
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
    return true;
  } catch {
    musicVoices.delete(oscillator);
    cueVoices.delete(oscillator);
    safe(() => oscillator?.stop());
    safe(() => oscillator?.disconnect());
    safe(() => envelope?.disconnect());
    return false;
  }
}
function stopVoices(voices) {
  for (const oscillator of voices) safe(() => oscillator.stop());
  voices.clear();
}
function stopMusic() {
  clearTimeout(loop);
  loop = null;
  stopVoices(musicVoices);
  if (musicGain && ctx)
    safe(() => {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setValueAtTime(0, ctx.currentTime);
    });
}
function startMusic() {
  stopMusic();
  if (
    !enabled ||
    !activated ||
    !ctx ||
    scene === "quiet" ||
    globalThis.document?.hidden
  )
    return;
  const phrase = () => {
    if (
      !enabled ||
      !activated ||
      !ctx ||
      scene === "quiet" ||
      globalThis.document?.hidden
    )
      return;
    safe(() => {
      const now = ctx.currentTime + 0.05;
      musicGain.gain.setValueAtTime(Date.now() < duckUntil ? 0.12 : 1, now);
      const camp = scene === "camp",
        beat = camp ? 0.64 : 0.5;
      const melody = camp
        ? [67, 71, 74, 71, 69, 67, 64, 62]
        : [72, 76, 79, 76, 74, 72, 67, 69];
      let scheduled = false;
      melody.forEach((n, i) => {
        scheduled =
          note(n, now + i * beat * 2, beat * 1.5, 0.055, "sine", true) ||
          scheduled;
        if (i % 2 === 0)
          scheduled =
            note(
              n - 24,
              now + i * beat * 2,
              beat * 3,
              0.06,
              "triangle",
              true,
            ) || scheduled;
      });
      if (scheduled) loop = setTimeout(phrase, beat * 16 * 1000);
    });
  };
  phrase();
}
// Called by the sound toggle, itself a user gesture.
export function setSoundEnabled(value) {
  enabled = !!value;
  try {
    globalThis.localStorage?.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    /* Keep the in-memory choice. */
  }
  if (enabled) {
    activated = true;
    if (audio()) {
      safe(() => master.gain.setValueAtTime(0.32, ctx.currentTime));
      startMusic();
    }
  } else {
    stopMusic();
    stopVoices(cueVoices);
    if (master && ctx)
      safe(() => master.gain.setValueAtTime(0, ctx.currentTime));
  }
  notify();
}
export function setSoundScene(value) {
  scene = value;
  if (ctx) startMusic();
}
export function duckMusic() {
  duckUntil = Date.now() + 10000;
  if (musicGain && ctx)
    safe(() => musicGain.gain.setValueAtTime(0.12, ctx.currentTime));
}
export function playCue(kind = "tap") {
  if (!enabled || !activated || globalThis.document?.hidden || !audio()) return;
  safe(() => {
    const now = ctx.currentTime;
    (CUES[kind] || CUES.tap).forEach(([n, delay, duration]) =>
      note(
        n,
        now + delay,
        duration,
        kind === "tap" ? 0.06 : 0.14,
        kind === "bite" ? "triangle" : "sine",
      ),
    );
  });
}
export function listenToGestures() {
  if (listening || !globalThis.document) return () => {};
  listening = true;
  const unlock = (e) => {
    if (!enabled || e.repeat || e.target?.closest?.("[data-sound-toggle]"))
      return;
    if (
      e.type === "keydown" &&
      !["Enter", " "].includes(e.key) &&
      !/^[0-9]$/.test(e.key || "")
    )
      return;
    const wasLocked = !activated || !ctx;
    activated = true;
    if (!audio()) return;
    if (wasLocked) startMusic();
    const button = e.target?.closest?.("button");
    if (button && !button.disabled) playCue("tap");
  };
  const visibility = () => {
    if (document.hidden) {
      stopMusic();
      stopVoices(cueVoices);
      if (ctx?.state === "running") safe(() => settle(ctx.suspend()));
    } else if (ctx && enabled && activated && audio()) startMusic();
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
