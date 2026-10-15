// ============================================================
// speech.js — 問題の よみあげ（ブラウザの音声合成。使えない端末では ボタンを出さない）
// ============================================================

/** 数式・記号を、読める ことばに */
export function toSpeech(text) {
  let s = String(text || "");
  s = s.replace(/\$([^$]*)\$/g, (_, tex) => texToSpeech(tex));
  s = s
    .replace(/(\d)\s*[×✕]\s*(\d)/g, "$1 かける $2")
    .replace(/(\d)\s*÷\s*(\d)/g, "$1 わる $2")
    .replace(/(\d)\s*[+＋]\s*(\d)/g, "$1 たす $2")
    .replace(/(\d)\s*[−－-]\s*(\d)/g, "$1 ひく $2")
    .replace(/[=＝]/g, " は ")
    .replace(/□/g, " しかく ")
    .replace(/[×✕]/g, " かける ")
    .replace(/÷/g, " わる ");
  return s.replace(/\s+/g, " ").trim();
}

function texToSpeech(t) {
  return t
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => ` ${b}ぶんの${a} `)
    .replace(/\\times/g, " かける ")
    .replace(/\\div/g, " わる ")
    .replace(/\\square/g, " しかく ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}^_]/g, "");
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";

export function speak(text) {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(toSpeech(text));
    u.lang = "ja-JP";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* よみあげ できない端末では なにもしない */
  }
}
