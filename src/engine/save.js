// ============================================================
// save.js — セーブデータの「形」と、読み書き（いまはブラウザの localStorage）
//
//  サーバー保存にするときは load / save を差しかえる（ゲーム本体は触らない）。
//  形を変えたら SAVE_VERSION を上げて、migrate() で古い形を直す。
// ============================================================
import { VILLAGERS } from "../data/villagers.js";
import { AREAS } from "../content/index.js";

export const SAVE_KEY = "suugaku-no-mori:v1";
/** デモ（?demo）用。ほんもののセーブを上書きしない */
export const DEMO_KEY = "suugaku-no-mori:demo";
export const SAVE_VERSION = 1;

/** 端末の日付で "YYYY-MM-DD" */
export function todayStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const byVillager = (v) => Object.fromEntries(VILLAGERS.map((x) => [x.id, v]));
const byArea = (f) => Object.fromEntries(AREAS.map((a) => [a, f()]));

/** その日の記録（日付が変わったら作り直す） */
export function freshToday() {
  return {
    solved: 0, //  きょう といた問題の数（1問1回）
    correct: 0,
    requests: byVillager(0), // 住人ごとに、きょう聞いた おねがいの数
    goalShown: false, // 「きょうの もくひょう たっせい」を出したか
  };
}

/**
 * はじめてのセーブ。
 *  grade     … "E1"〜"E6"
 *  unlearned … 「まだ ならっていない」単元の id（せっていで切りかえ）
 */
export function newSave({ name = "", grade = "E1", today = todayStr() } = {}) {
  return {
    v: SAVE_VERSION,
    createdAt: today,
    name,
    grade,
    unlearned: [],
    settings: { fishTimer: true, speech: true, dailyGoal: 10 },
    day: today,
    today: freshToday(),
    playDays: 1,
    inv: { maruta: 2, ishi: 1, keito: 0, hana: 0, sakana: 0, hirameki: 3 },
    furn: {}, // もっている家具（キャンプに おいていない数）
    camp: [], // キャンプに おいた家具 [{ id, x, y }]
    friend: byVillager(0), // なかよしポイント
    tools: byArea(() => 0), // 分野ごとの正解数（どうぐのレベルのもと）
    levels: byArea(() => ({ L: 1, up: 0, down: 0 })), // 分野ごとの いまのレベル（2回つづけて正解で上がる）
    recent: { tpl: [], unit: [] }, // 直近のテンプレ・単元（同じ型が続かないように）
    treasure: [], // たからのちず（まちがえた問題）
    stats: { solved: 0, correct: 0, treasureCleared: 0, crafted: 0, fish: 0 },
    log: [], // 1問ごとの記録（あとで保護者・先生向けの画面に使う）
  };
}

/** 足りない項目を、はじめの値でうめる（古いセーブを新しい形へ） */
export function migrate(raw) {
  if (!raw || typeof raw !== "object") return null;
  const base = newSave({ name: raw.name || "", grade: raw.grade || "E1", today: raw.day || todayStr() });
  const out = { ...base, ...raw, v: SAVE_VERSION };
  for (const k of ["settings", "inv", "friend", "tools", "levels", "recent", "stats"]) {
    out[k] = { ...base[k], ...(raw[k] || {}) };
  }
  out.today = { ...freshToday(), ...(raw.today || {}), requests: { ...freshToday().requests, ...(raw.today?.requests || {}) } };
  for (const k of ["unlearned", "camp", "treasure", "log"]) if (!Array.isArray(out[k])) out[k] = [];
  if (!out.furn || typeof out.furn !== "object") out.furn = {};
  return out;
}

/** 日付が変わっていたら、その日の記録をリセット */
export function rollDay(s, today = todayStr()) {
  if (!s || s.day === today) return s;
  return { ...s, day: today, today: freshToday(), playDays: (s.playDays || 0) + 1 };
}

// ── 読み書き ─────────────────────────────────────────
//  localStorage が使えない（プライベートモード等）ときは、その場だけのメモリに置く。
const memory = new Map();
export function safeStorage() {
  try {
    const k = "__mori_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k),
    };
  }
}

export function load(key = SAVE_KEY, storage = safeStorage()) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function save(state, key = SAVE_KEY, storage = safeStorage()) {
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clear(key = SAVE_KEY, storage = safeStorage()) {
  try {
    storage.removeItem(key);
  } catch {
    /* なにもしない */
  }
}
