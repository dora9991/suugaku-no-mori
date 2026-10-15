// ============================================================
// pick.js — どの単元・どのレベルから出すかを決める
//
//  ・出すのは「いまの学年まで」で「習った」単元だけ（せっていで「まだ」にした単元は出さない）
//  ・いまの学年の単元を多めに（いまの学年 4：1つ下 2：それより前 1）
//  ・住人は自分の分野から出す。その分野の単元がまだ無いとき、その住人は「おでかけ中」
//  ・レベルは分野ごと。2回つづけて1回で正解すると上がり、2回つづけて とけないと下がる（1〜3）
//    住人の その日 さいごの おねがいは「とくべつ ⭐」で、1つ上のレベル（4まで）
// ============================================================
import { UNITS, gradeNum, genProblem, toChoices } from "../content/index.js";

/** 出してよい単元（学年まで・習った） */
export function learnedUnits(s) {
  const g = gradeNum(s.grade);
  const skip = new Set(s.unlearned || []);
  return UNITS.filter((u) => u.gn <= g && !skip.has(u.id));
}

export const areaUnits = (s, area) => learnedUnits(s).filter((u) => u.area === area);

/** 住人が森にいるか（その分野の単元を習っているか） */
export const isHere = (s, villager) => areaUnits(s, villager.area).length > 0;

function weight(s, u) {
  const d = gradeNum(s.grade) - u.gn;
  return d <= 0 ? 4 : d === 1 ? 2 : 1;
}

/** 単元を1つ選ぶ（area を省くと全分野から）。直近2つの単元は なるべく避ける */
export function chooseUnit(s, area, r) {
  let pool = area ? areaUnits(s, area) : learnedUnits(s);
  if (!pool.length) pool = learnedUnits(s);
  if (!pool.length) pool = UNITS.filter((u) => u.gn === 1);
  const recent = (s.recent?.unit || []).slice(-2);
  const fresh = pool.filter((u) => !recent.includes(u.id));
  const list = fresh.length ? fresh : pool;
  const total = list.reduce((t, u) => t + weight(s, u), 0);
  let x = r(1, total);
  for (const u of list) {
    x -= weight(s, u);
    if (x <= 0) return u;
  }
  return list[list.length - 1];
}

export const areaLevel = (s, area) => s.levels?.[area]?.L || 1;

/**
 * 1問つくる。
 * @param {object} s セーブ
 * @param {{ area?: string, mode: "request"|"craft"|"fish", special?: boolean }} opt
 * @param {Function} r 乱数 r(min,max)
 */
export function makeProblem(s, { area, mode, special = false }, r) {
  for (let i = 0; i < 12; i++) {
    const u = chooseUnit(s, area, r);
    const base = areaLevel(s, area || u.area);
    const level = mode === "fish" ? 1 : special ? Math.min(4, base + 1) : base;
    let p = genProblem(u.id, level, { r, recent: s.recent?.tpl || [] });
    if (p && mode === "fish") p = toChoices(p, r);
    if (p) return special ? { ...p, special: true } : p;
  }
  return null;
}

/** 2回つづけて1回で正解 → 上がる、2回つづけて とけない → 下がる（1〜3） */
export function nextLevelState(st = { L: 1, up: 0, down: 0 }, outcome) {
  let { L, up, down } = { L: 1, up: 0, down: 0, ...st };
  if (outcome === "success") {
    up += 1;
    down = 0;
    if (up >= 2 && L < 3) {
      L += 1;
      up = 0;
    }
  } else if (outcome === "fail") {
    down += 1;
    up = 0;
    if (down >= 2 && L > 1) {
      L -= 1;
      down = 0;
    }
  }
  return { L, up, down };
}
