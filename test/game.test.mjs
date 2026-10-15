// ゲームのしくみ（ごほうび・なかよし・どうぐ・つくる・おく・たからのちず・日付）をたしかめる。
import { test } from "node:test";
import assert from "node:assert/strict";
import { seededR, genProblem } from "../src/content/index.js";
import { newSave, rollDay, migrate } from "../src/engine/save.js";
import { learnedUnits, isHere, makeProblem, nextLevelState, chooseUnit } from "../src/engine/pick.js";
import {
  applyResult, requestsLeft, isSpecialNext, spendHint, giveFish, craftCheck, place, unplace, cellAt, toggleLearned, visitors, TREASURE_MAX,
} from "../src/engine/game.js";
import { VILLAGERS, getVillager } from "../src/data/villagers.js";
import { getRecipe, toolLevel, friendLevel } from "../src/data/items.js";

const r = seededR(2026);
const s0 = () => newSave({ name: "ゆい", grade: "E2", today: "2026-10-15" });

test("出す単元は、いまの学年までで、「まだ」にした単元は出さない", () => {
  const s = s0();
  const us = learnedUnits(s);
  assert.ok(us.every((u) => u.gn <= 2));
  assert.ok(us.some((u) => u.grade === "E2") && us.some((u) => u.grade === "E1"));
  const s2 = toggleLearned(s, "E2-kuku");
  assert.ok(!learnedUnits(s2).some((u) => u.id === "E2-kuku"));
  assert.ok(learnedUnits(toggleLearned(s2, "E2-kuku")).some((u) => u.id === "E2-kuku"));
});

test("1年生には「しらべる」の単元がないので、メモは おでかけ中", () => {
  const s = newSave({ grade: "E1" });
  assert.equal(isHere(s, getVillager("memo")), false);
  assert.equal(isHere(s, getVillager("mugi")), true);
  assert.equal(isHere(s0(), getVillager("memo")), true);
});

test("住人の分野から出題し、つりは4択", () => {
  const s = s0();
  for (const v of VILLAGERS) {
    const p = makeProblem(s, { area: v.area, mode: "request" }, r);
    assert.equal(p.area, v.area);
  }
  for (let i = 0; i < 20; i++) {
    const p = makeProblem(s, { area: "num", mode: "fish" }, r);
    assert.ok(Array.isArray(p.choices) && p.choices.length >= 3);
  }
  const sp = makeProblem(s, { area: "num", mode: "request", special: true }, r);
  assert.equal(sp.special, true);
  assert.equal(sp.level, 2);
});

test("chooseUnit は直近2つの単元を避ける", () => {
  const s = { ...s0(), recent: { tpl: [], unit: ["E2-kuku", "E2-hissan"] } };
  for (let i = 0; i < 30; i++) {
    const u = chooseUnit(s, "num", r);
    assert.ok(!["E2-kuku", "E2-hissan"].includes(u.id));
  }
});

test("おねがい：正解で素材・なかよし・どうぐ、のこりが1つへる", () => {
  const s = s0();
  const p = { ...genProblem("E2-kuku", 2, { r }), area: "num" };
  const { state, events } = applyResult(s, { mode: "request", villagerId: "mugi", problem: p, correct: true, firstTry: true, hints: 0 }, r);
  assert.equal(state.inv.maruta, s.inv.maruta + 2 + 1); // レベル2 ＋ 1回で・ヒントなし
  assert.equal(state.friend.mugi, 15);
  assert.equal(state.tools.num, 1);
  assert.equal(requestsLeft(state, "mugi"), 2);
  assert.equal(state.today.solved, 1);
  assert.ok(events.some((e) => e.type === "reward"));
  assert.equal(s.inv.maruta, 2, "もとのセーブは変わらない");
});

test("おねがい：とけなくても なにも へらず、なかよし +2、たからのちずへ", () => {
  const s = s0();
  const p = genProblem("E2-kuku", 1, { r });
  const { state } = applyResult(s, { mode: "request", villagerId: "mugi", problem: p, correct: false, firstTry: false, hints: 1 }, r);
  assert.deepEqual(state.inv, s.inv);
  assert.equal(state.friend.mugi, 2);
  assert.equal(state.treasure.length, 1);
  assert.equal(state.treasure[0].tplId, p.tplId);
});

test("その日 さいごの おねがいは とくべつ⭐（素材+1・ひらめきの み）", () => {
  let s = s0();
  s = { ...s, today: { ...s.today, requests: { ...s.today.requests, ruru: 2 } } };
  assert.equal(isSpecialNext(s, "ruru"), true);
  const p = { ...genProblem("E2-zukei", 2, { r }), special: true };
  const { state } = applyResult(s, { mode: "request", villagerId: "ruru", problem: p, correct: true, firstTry: false, hints: 0 }, r);
  assert.equal(state.inv.keito, s.inv.keito + 2 + 1);
  assert.equal(state.inv.hirameki, s.inv.hirameki + 1);
  assert.equal(state.friend.ruru, 20);
  assert.equal(requestsLeft(state, "ruru"), 0);
});

test("たからのちず：同じ型は1枚にまとめ、30枚まで", () => {
  let s = s0();
  const p = genProblem("E2-kuku", 1, { r });
  s = applyResult(s, { mode: "fish", problem: p, correct: false }, r).state;
  s = applyResult(s, { mode: "fish", problem: p, correct: false }, r).state;
  assert.equal(s.treasure.length, 1);
  const t = applyResult(s, { mode: "fish", problem: p, correct: false, timeout: true }, r).state;
  assert.equal(t.treasure.length, 1, "時間切れは たからのちずに入れない");
  for (let i = 0; i < 40; i++) s = applyResult(s, { mode: "fish", problem: { ...p, tplId: `x${i}` }, correct: false }, r).state;
  assert.equal(s.treasure.length, TREASURE_MAX);
});

test("たからのちず：正解で消えて、素材3つ＋ひらめきの み、なかよし +10", () => {
  let s = s0();
  const p = genProblem("E2-nagasa", 1, { r });
  s = applyResult(s, { mode: "request", villagerId: "chikuta", problem: p, correct: false }, r).state;
  const tr = s.treasure[0];
  const before = Object.values(s.inv).reduce((a, b) => a + b, 0);
  const { state, events } = applyResult(s, { mode: "treasure", treasureId: tr.id, problem: { ...p, area: tr.area }, correct: true, firstTry: true }, r);
  assert.equal(state.treasure.length, 0);
  assert.equal(Object.values(state.inv).reduce((a, b) => a + b, 0), before + 4);
  assert.equal(state.friend.chikuta, s.friend.chikuta + 10);
  assert.ok(events.some((e) => e.type === "treasureClear"));
});

test("つくる：素材とどうぐのレベルが足りれば、正解で家具ができて素材がへる", () => {
  let s = s0();
  const isu = getRecipe("isu");
  assert.equal(craftCheck(s, isu).ok, true);
  const p = genProblem("E2-kuku", 1, { r });
  const fail = applyResult(s, { mode: "craft", recipeId: "isu", problem: p, correct: false }, r).state;
  assert.equal(fail.inv.maruta, s.inv.maruta, "失敗では素材は へらない");
  s = applyResult(s, { mode: "craft", recipeId: "isu", problem: p, correct: true, firstTry: true }, r).state;
  assert.equal(s.furn.isu, 1);
  assert.equal(s.inv.maruta, 0);
  assert.equal(craftCheck(s, isu).ok, false);
  assert.deepEqual(craftCheck(s, isu).lacking, { maruta: 2 });
  assert.equal(craftCheck({ ...s, inv: { ...s.inv, keito: 9, maruta: 9 } }, getRecipe("sofa")).toolOk, false);
});

test("キャンプ：おく・しまう", () => {
  let s = { ...s0(), furn: { isu: 1 } };
  s = place(s, "isu", 1, 2);
  assert.equal(cellAt(s, 1, 2).id, "isu");
  assert.equal(s.furn.isu, 0);
  assert.equal(place(s, "isu", 0, 0), s, "もっていない家具は おけない");
  s = unplace(s, 1, 2);
  assert.equal(s.camp.length, 0);
  assert.equal(s.furn.isu, 1);
});

test("なかよし・どうぐのレベルアップを知らせる", () => {
  let s = { ...s0(), friend: { ...s0().friend, mugi: 18 }, tools: { ...s0().tools, num: 4 } };
  const p = genProblem("E2-kuku", 1, { r });
  const { state, events } = applyResult(s, { mode: "request", villagerId: "mugi", problem: p, correct: true, firstTry: true }, r);
  assert.ok(events.some((e) => e.type === "friendUp" && e.villager === "mugi" && e.level === 1));
  assert.ok(events.some((e) => e.type === "toolUp" && e.area === "num" && e.level === 2));
  assert.equal(friendLevel(state.friend.mugi), 1);
  assert.equal(toolLevel(state.tools.num), 2);
  assert.equal(visitors(state, VILLAGERS).length, 1);
});

test("きょうの もくひょう：とどいた ときに1回だけ知らせる", () => {
  let s = { ...s0(), settings: { ...s0().settings, dailyGoal: 2 } };
  const p = genProblem("E1-tashi", 1, { r });
  let ev = applyResult(s, { mode: "fish", problem: p, correct: true }, r);
  assert.ok(!ev.events.some((e) => e.type === "goal"));
  ev = applyResult(ev.state, { mode: "fish", problem: p, correct: true }, r);
  assert.ok(ev.events.some((e) => e.type === "goal"));
  ev = applyResult(ev.state, { mode: "fish", problem: p, correct: true }, r);
  assert.ok(!ev.events.some((e) => e.type === "goal"));
});

test("レベル：2回つづけて1回で正解で上がり、2回つづけて とけないと下がる", () => {
  let st = { L: 1, up: 0, down: 0 };
  st = nextLevelState(st, "success");
  st = nextLevelState(st, "success");
  assert.equal(st.L, 2);
  st = nextLevelState(st, "fail");
  st = nextLevelState(st, "fail");
  assert.equal(st.L, 1);
  assert.equal(nextLevelState({ L: 3, up: 1, down: 0 }, "success").L, 3, "3より上には上がらない");
});

test("ひらめきの み・さかな", () => {
  let s = s0();
  s = spendHint(s).state;
  assert.equal(s.inv.hirameki, 2);
  assert.equal(spendHint({ ...s, inv: { ...s.inv, hirameki: 0 } }).ok, false);
  const g = giveFish({ ...s, inv: { ...s.inv, sakana: 1 } }, "memo");
  assert.equal(g.state.inv.sakana, 0);
  assert.equal(g.state.friend.memo, 5);
});

test("日付が変わると、その日の記録だけリセット", () => {
  let s = s0();
  s = applyResult(s, { mode: "request", villagerId: "mugi", problem: genProblem("E2-kuku", 1, { r }), correct: true }, r).state;
  const t = rollDay(s, "2026-10-16");
  assert.equal(t.today.solved, 0);
  assert.equal(requestsLeft(t, "mugi"), 3);
  assert.equal(t.inv.maruta, s.inv.maruta);
  assert.equal(t.playDays, 2);
  assert.equal(rollDay(t, "2026-10-16"), t);
});

test("古いセーブ（項目が足りない）を読める形に直す", () => {
  const m = migrate({ v: 1, name: "けん", grade: "E4", inv: { maruta: 5 } });
  assert.equal(m.inv.maruta, 5);
  assert.equal(m.inv.hirameki, 3);
  assert.ok(Array.isArray(m.treasure));
  assert.equal(m.levels.geo.L, 1);
});
