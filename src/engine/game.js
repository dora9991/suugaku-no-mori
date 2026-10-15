// ============================================================
// game.js — 1問の結果や「つくる・おく・あげる」を、セーブに反映する（純関数）
//
//  どの関数も、もとのセーブは書きかえずに、新しいセーブを返す。
//  画面に出すできごと（もらった物・なかよしアップ・どうぐアップ…）は events で返す。
//
//  ごほうびの約束（数字はここだけで決める）
//   おねがい  正解 … 住人の素材 ×レベル（1回で・ヒントなしなら +1、とくべつ⭐なら +1 と ひらめきの み）
//                    なかよし +10（1回で・ヒントなし +5、とくべつ +10）、その分野のどうぐ +1
//             とけなかった … なかよし +2（ちょうせん ありがとう）、たからのちずへ。なにも へらない
//   つり      正解 … ひらめきの み 20%／さかな 35%／素材 45%。まちがい … たからのちずへ（時間切れは なにもなし）
//   つくる    正解 … 素材を つかって家具が1つ。とけなかった … 素材は へらない。たからのちずへ
//   たからのちず 正解 … 素材3つ＋ひらめきの み、その分野の住人と なかよし +10
// ============================================================
import { getVillager, villagerOfArea, REQUESTS_PER_DAY } from "../data/villagers.js";
import { MATERIALS, getRecipe, toolLevel, friendLevel, CAMP_W, CAMP_H } from "../data/items.js";
import { nextLevelState } from "./pick.js";

export const TREASURE_MAX = 30;
export const LOG_MAX = 300;
const MAT_IDS = MATERIALS.map((m) => m.id);

/** 住人の、きょうの のこりの おねがい */
export const requestsLeft = (s, vid) => Math.max(0, REQUESTS_PER_DAY - (s.today?.requests?.[vid] || 0));
/** 次の おねがいが、その日さいごの「とくべつ ⭐」か */
export const isSpecialNext = (s, vid) => requestsLeft(s, vid) === 1;

function clone(s) {
  return {
    ...s,
    inv: { ...s.inv },
    furn: { ...s.furn },
    camp: [...s.camp],
    friend: { ...s.friend },
    tools: { ...s.tools },
    levels: { ...s.levels },
    recent: { tpl: [...(s.recent?.tpl || [])], unit: [...(s.recent?.unit || [])] },
    treasure: [...s.treasure],
    stats: { ...s.stats },
    log: [...s.log],
    today: { ...s.today, requests: { ...(s.today?.requests || {}) } },
    settings: { ...s.settings },
    unlearned: [...(s.unlearned || [])],
  };
}

function addFriend(n, events, vid, pts) {
  if (!vid || !pts) return;
  const before = friendLevel(n.friend[vid] || 0);
  n.friend[vid] = (n.friend[vid] || 0) + pts;
  const after = friendLevel(n.friend[vid]);
  events.push({ type: "friend", villager: vid, points: pts });
  if (after > before) events.push({ type: "friendUp", villager: vid, level: after });
}

function addTool(n, events, area) {
  if (!area) return;
  const before = toolLevel(n.tools[area] || 0);
  n.tools[area] = (n.tools[area] || 0) + 1;
  const after = toolLevel(n.tools[area]);
  if (after > before) events.push({ type: "toolUp", area, level: after });
}

/** たからのちずに足す（同じ型は1枚にまとめる・30枚まで） */
function addTreasure(n, events, p) {
  if (!p?.unitId) return;
  const id = `${p.unitId}/${p.tplId}`;
  const i = n.treasure.findIndex((t) => t.id === id);
  const entry = { id, unitId: p.unitId, level: p.level, tplId: p.tplId, area: p.area, q: p.q, at: n.day };
  if (i >= 0) {
    n.treasure[i] = { ...n.treasure[i], ...entry };
    return;
  }
  n.treasure.push(entry);
  if (n.treasure.length > TREASURE_MAX) n.treasure.splice(0, n.treasure.length - TREASURE_MAX);
  events.push({ type: "treasureAdd" });
}

/**
 * 1問の結果を反映する。
 * @param {object} s セーブ
 * @param {object} res
 *   mode      "request" | "fish" | "craft" | "treasure"
 *   problem   出した問題（content の genProblem の形）
 *   correct   さいごに正解できたか
 *   firstTry  1回目で正解か
 *   hints     ひらめきの み を使った数
 *   timeout   つりで時間切れ
 *   villagerId / recipeId / treasureId … モードごとの相手
 * @param {Function} r 乱数 r(min,max)
 * @returns {{ state: object, events: object[] }}
 */
export function applyResult(s, res, r) {
  const n = clone(s);
  const events = [];
  const got = {};
  const p = res.problem || {};
  const correct = !!res.correct;
  const firstTry = !!res.firstTry;
  const hints = res.hints || 0;
  const clean = correct && firstTry && hints === 0;
  const add = (id, k) => {
    if (!k) return;
    n.inv[id] = (n.inv[id] || 0) + k;
    got[id] = (got[id] || 0) + k;
  };

  // 1問の記録
  n.today.solved += 1;
  n.stats.solved += 1;
  if (correct) {
    n.today.correct += 1;
    n.stats.correct += 1;
  }
  n.log.push({ t: res.at ?? Date.now(), day: n.day, mode: res.mode, unitId: p.unitId, level: p.level, tplId: p.tplId, ok: correct, firstTry, hints, timeout: !!res.timeout });
  if (n.log.length > LOG_MAX) n.log.splice(0, n.log.length - LOG_MAX);
  if (p.tplId) n.recent.tpl = [...n.recent.tpl, p.tplId].slice(-12);
  if (p.unitId) n.recent.unit = [...n.recent.unit, p.unitId].slice(-6);

  let actArea = p.area || null; // レベルを動かす分野（おねがい＝住人の分野、つくる＝せっけいずの分野）

  if (res.mode === "request") {
    const v = getVillager(res.villagerId);
    actArea = v?.area || actArea;
    if (v) n.today.requests[v.id] = (n.today.requests[v.id] || 0) + 1;
    if (correct) {
      add(v?.material || "maruta", (p.level || 1) + (clean ? 1 : 0) + (p.special ? 1 : 0));
      if (p.special) add("hirameki", 1);
      addFriend(n, events, v?.id, 10 + (clean ? 5 : 0) + (p.special ? 10 : 0));
      addTool(n, events, actArea);
    } else {
      addFriend(n, events, v?.id, 2);
      addTreasure(n, events, p);
    }
  } else if (res.mode === "fish") {
    if (correct) {
      n.stats.fish += 1;
      const x = r(1, 100);
      if (x <= 20) add("hirameki", 1);
      else if (x <= 55) add("sakana", 1);
      else add(MAT_IDS[r(0, MAT_IDS.length - 1)], 1);
      addTool(n, events, p.area);
    } else if (!res.timeout) {
      addTreasure(n, events, p);
    }
  } else if (res.mode === "craft") {
    const rc = getRecipe(res.recipeId);
    actArea = rc?.tool[0] || actArea;
    if (correct && rc) {
      for (const [id, k] of Object.entries(rc.need)) n.inv[id] = Math.max(0, (n.inv[id] || 0) - k);
      n.furn[rc.id] = (n.furn[rc.id] || 0) + 1;
      n.stats.crafted += 1;
      events.push({ type: "furniture", id: rc.id });
      addTool(n, events, actArea);
    } else if (!correct) {
      addTreasure(n, events, p);
    }
  } else if (res.mode === "treasure") {
    if (correct) {
      n.treasure = n.treasure.filter((t) => t.id !== res.treasureId);
      for (let i = 0; i < 3; i++) add(MAT_IDS[r(0, MAT_IDS.length - 1)], 1);
      add("hirameki", 1);
      n.stats.treasureCleared += 1;
      events.push({ type: "treasureClear" });
      addFriend(n, events, villagerOfArea(p.area)?.id, 10);
      addTool(n, events, p.area);
    }
  }

  // 分野のレベル（つりは いつも きほん なので動かさない）
  if (res.mode !== "fish" && actArea) {
    const outcome = correct && firstTry ? "success" : correct ? "same" : "fail";
    n.levels[actArea] = nextLevelState(n.levels[actArea], outcome);
  }

  // きょうの もくひょう
  const goal = n.settings?.dailyGoal || 10;
  if (!n.today.goalShown && n.today.solved >= goal) {
    n.today.goalShown = true;
    events.push({ type: "goal", solved: n.today.solved });
  }

  if (Object.keys(got).length) events.unshift({ type: "reward", items: got });
  return { state: n, events };
}

/** ひらめきの み を1つ使う */
export function spendHint(s) {
  if ((s.inv?.hirameki || 0) <= 0) return { state: s, ok: false };
  const n = clone(s);
  n.inv.hirameki -= 1;
  return { state: n, ok: true };
}

/** さかなを あげる（なかよし +5） */
export function giveFish(s, vid) {
  if ((s.inv?.sakana || 0) <= 0 || !getVillager(vid)) return { state: s, events: [] };
  const n = clone(s);
  const events = [];
  n.inv.sakana -= 1;
  addFriend(n, events, vid, 5);
  return { state: n, events };
}

/** つくれるか：{ ok, toolOk, toolLv, needLv, lacking: { 素材: 足りない数 } } */
export function craftCheck(s, rc) {
  const lacking = {};
  for (const [id, k] of Object.entries(rc.need)) {
    const have = s.inv?.[id] || 0;
    if (have < k) lacking[id] = k - have;
  }
  const [area, needLv] = rc.tool;
  const toolLv = toolLevel(s.tools?.[area] || 0);
  const toolOk = toolLv >= needLv;
  return { ok: toolOk && Object.keys(lacking).length === 0, toolOk, toolLv, needLv, lacking };
}

// ── キャンプ ───────────────────────────────────────
export const cellAt = (s, x, y) => s.camp.find((c) => c.x === x && c.y === y) || null;

/** 家具を (x, y) に おく */
export function place(s, id, x, y) {
  if (!((s.furn?.[id] || 0) > 0) || cellAt(s, x, y)) return s;
  if (x < 0 || y < 0 || x >= CAMP_W || y >= CAMP_H) return s;
  const n = clone(s);
  n.furn[id] -= 1;
  n.camp.push({ id, x, y });
  return n;
}

/** (x, y) の家具を しまう */
export function unplace(s, x, y) {
  const c = cellAt(s, x, y);
  if (!c) return s;
  const n = clone(s);
  n.camp = n.camp.filter((e) => !(e.x === x && e.y === y));
  n.furn[c.id] = (n.furn[c.id] || 0) + 1;
  return n;
}

/** キャンプに あそびに くる住人（なかよしハート1つ以上）。好きな家具が おいてあれば fav: true */
export function visitors(s, villagers) {
  return villagers
    .filter((v) => friendLevel(s.friend?.[v.id] || 0) >= 1)
    .map((v) => ({ villager: v, fav: s.camp.some((c) => c.id === v.fav) }));
}

// ── せってい ─────────────────────────────────────
export function setGrade(s, grade) {
  return { ...s, grade };
}

/** 単元の「ならった／まだ」を切りかえる */
export function toggleLearned(s, unitId) {
  const has = (s.unlearned || []).includes(unitId);
  return { ...s, unlearned: has ? s.unlearned.filter((x) => x !== unitId) : [...(s.unlearned || []), unitId] };
}

export function setSetting(s, key, value) {
  return { ...s, settings: { ...s.settings, [key]: value } };
}

export function setName(s, name) {
  return { ...s, name: String(name || "").slice(0, 12) };
}
