// ============================================================
// content/index.js — 小学校の単元（数学ラボ ソロの e1〜e6）を束ねる窓口
//
//  問題そのもの（テンプレート）は src/shared/ にある自動同期のコピー。ここでは、
//  かずの森の出題に必要な「単元の一覧・1問つくる・同じ型でもう1問・4択にする・答え合わせ」だけを用意する。
//  画面・エンジンは import { getUnit, genProblem, ... } from "../content" だけ使う。
//
//  単元の分野（area）と住人の対応：
//    num  … かず・けいさん（ムギ）
//    func … とけい・はかる・かわりかた（チクタ）
//    geo  … かたち（ルル）
//    data … しらべる（メモ）
// ============================================================
import { UNITS as E1 } from "../shared/elem/e1.js";
import { UNITS as E2 } from "../shared/elem/e2.js";
import { UNITS as E3 } from "../shared/elem/e3.js";
import { UNITS as E4 } from "../shared/elem/e4.js";
import { UNITS as E5 } from "../shared/elem/e5.js";
import { UNITS as E6 } from "../shared/elem/e6.js";
import { numChoices } from "../shared/kit.js";
import { checkAnswer as soloCheck, ansValue } from "../shared/answer.js";

export const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6"];
export const GRADE_LABEL = { E1: "1ねんせい", E2: "2ねんせい", E3: "3ねんせい", E4: "4ねんせい", E5: "5ねんせい", E6: "6ねんせい" };
export const gradeNum = (g) => Number(String(g).slice(1)) || 0;

export const AREAS = ["num", "func", "geo", "data"];
export const AREA_LABEL = { num: "かず・けいさん", func: "とけい・はかる", geo: "かたち", data: "しらべる" };

/** レベル（1〜4）の よびかた。4 は「とくべつ」（思考問題） */
export const LEVEL_LABEL = { 1: "きほん", 2: "ふつう", 3: "ちょっと むずかしい", 4: "とくべつ" };

export const UNITS = [...E1, ...E2, ...E3, ...E4, ...E5, ...E6].map((u) => ({
  ...u,
  gn: gradeNum(u.grade),
  maxLevel: Math.max(0, ...[1, 2, 3, 4].filter((L) => (u.levels?.[L] || []).length > 0)),
}));

const BY_ID = new Map(UNITS.map((u) => [u.id, u]));
export const getUnit = (id) => BY_ID.get(id) || null;
export const unitsOfGrade = (g) => UNITS.filter((u) => u.grade === g);

// ── 乱数 ────────────────────────────────────────────
//  テンプレートは r(min, max)（min 以上 max 以下の整数）を受け取って問題を作る。
/** ふつうの乱数 */
export const randomR = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
/** 種から決まる乱数（テスト・デモ用） */
export function seededR(seed = 1) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return (a, b) => a + Math.floor(next() * (b - a + 1));
}

/** 出せるレベル（指定レベルが無ければ、近い下のレベル → 上のレベル） */
export function usableLevel(u, level) {
  if ((u?.levels?.[level] || []).length) return level;
  for (let L = level - 1; L >= 1; L--) if ((u.levels?.[L] || []).length) return L;
  for (let L = level + 1; L <= 4; L++) if ((u?.levels?.[L] || []).length) return L;
  return 0;
}

function build(u, L, tpl, r) {
  for (let i = 0; i < 40; i++) {
    let p;
    try {
      p = tpl.build(r);
    } catch (e) {
      console.warn("問題の生成に失敗", tpl.id, e);
      return null;
    }
    if (!p || p.skip) continue;
    return { ...p, unitId: u.id, area: u.area, grade: u.grade, level: L, tplId: tpl.id, key: `${tpl.id}:${p.q}` };
  }
  return null;
}

/**
 * 1問つくる。
 * @param {string} unitId
 * @param {number} level 1〜4
 * @param {{ r?: Function, recent?: string[] }} opts recent … 直近に出したテンプレID（続けて同じ型を出さない）
 * @returns {object|null} { q, ans, choices?, unit?, hint, steps, unitId, area, grade, level, tplId, key }
 */
export function genProblem(unitId, level, { r = randomR, recent = [] } = {}) {
  const u = getUnit(unitId);
  if (!u) return null;
  const L = usableLevel(u, level);
  if (!L) return null;
  const pool = u.levels[L];
  const fresh = pool.filter((t) => !recent.includes(t.id));
  const list = fresh.length ? fresh : pool;
  for (let i = 0; i < 8; i++) {
    const p = build(u, L, list[r(0, list.length - 1)], r);
    if (p) return p;
  }
  return null;
}

/** 同じ型（テンプレート）で、数字を変えてもう1問（たからのちず用）。型が見つからなければ同じ単元・レベルから */
export function genSimilar(unitId, level, tplId, { r = randomR } = {}) {
  const u = getUnit(unitId);
  if (!u) return null;
  const L = usableLevel(u, level);
  const tpl = (u.levels[L] || []).find((t) => t.id === tplId);
  return (tpl && build(u, L, tpl, r)) || genProblem(unitId, level, { r });
}

/**
 * 4択にする（つり用）。もともと4択ならそのまま。答えが数なら、まわりの数で4択を作る。
 * 分数の答えなど、4択にできないときは null。
 */
export function toChoices(p, r = randomR) {
  if (!p) return null;
  if (Array.isArray(p.choices) && p.choices.length >= 2) return p;
  if (typeof p.ans === "number" && Number.isFinite(p.ans)) {
    const choices = numChoices(r, p.ans, []).filter((x) => !(typeof x === "number" && x < 0));
    if (choices.length >= 3 && choices.some((x) => x === p.ans)) return { ...p, choices };
  }
  return null;
}

/** 答え合わせ（数学ラボ ソロと同じ）：{ correct, note? } */
export function checkAnswer(p, input) {
  return soloCheck(p, input);
}

/** 正解の見せ方（単位つき） */
export function answerText(p) {
  if (!p) return "";
  const a = String(p.ans);
  return p.unit ? `${a} ${p.unit}` : a;
}

/**
 * 数字キーに「.」「/」を出すか。答えの形ではなく学年・単元で決める（キーで答えの形がばれないように）。
 *   小数は3年から。分数は3年から（2年は「分数のはじまり」の単元だけ）。
 */
export function keysFor(p) {
  if (!p || p.choices) return { dot: false, slash: false };
  const g = gradeNum(p.grade);
  const fracUnit = /分数/.test(getUnit(p.unitId)?.name || "");
  return { dot: g >= 3, slash: g >= 3 || fracUnit };
}

/** 正解の値（数値）。答えが "3/4" のような分数でも数で返す */
export const valueOf = (ans) => ansValue(ans);
