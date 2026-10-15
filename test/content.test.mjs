// 問題テンプレート（数学ラボ ソロの小学校）が、かずの森の出題・答え合わせで使えるかを全部たしかめる。
//   node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNITS, GRADES, AREAS, getUnit, genProblem, genSimilar, toChoices, checkAnswer, keysFor, seededR, usableLevel,
} from "../src/content/index.js";

test("小1〜小6の単元がそろっていて、分野は4つのどれか", () => {
  assert.ok(UNITS.length >= 50, `単元が少ない: ${UNITS.length}`);
  for (const g of GRADES) assert.ok(UNITS.some((u) => u.grade === g), `${g} の単元がない`);
  for (const u of UNITS) assert.ok(AREAS.includes(u.area), `${u.id} の分野 ${u.area}`);
  for (const u of UNITS) for (const p of u.prereqs || []) assert.ok(getUnit(p), `${u.id} の前提 ${p} がない`);
});

test("すべてのテンプレートから問題が作れて、正解を入れると正解になる", () => {
  const bad = [];
  let n = 0;
  for (const u of UNITS) {
    for (const [L, tpls] of Object.entries(u.levels)) {
      for (const tpl of tpls) {
        for (let seed = 1; seed <= 4; seed++) {
          const r = seededR(seed * 7919 + n);
          let p = null;
          for (let i = 0; i < 80 && !p; i++) {
            const x = tpl.build(r);
            if (x && !x.skip) p = x;
          }
          n++;
          if (!p) {
            bad.push(`${tpl.id}: 作れない（skip が続く）`);
            break;
          }
          if (typeof p.q !== "string" || !p.q) bad.push(`${tpl.id}: 問題文がない`);
          if (p.choices) {
            if (!p.choices.some((c) => String(c) === String(p.ans))) bad.push(`${tpl.id}: 4択に正解がない`);
            if (!checkAnswer(p, p.ans).correct) bad.push(`${tpl.id}: 4択の正解が不正解になる`);
          } else if (!checkAnswer(p, String(p.ans)).correct) {
            bad.push(`${tpl.id}: 正解 ${p.ans} が不正解になる`);
          }
        }
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("genProblem は単元・分野・レベル・テンプレIDをつけて返す", () => {
  const r = seededR(42);
  for (const u of UNITS) {
    const p = genProblem(u.id, 2, { r });
    assert.ok(p, `${u.id} で問題が作れない`);
    assert.equal(p.unitId, u.id);
    assert.equal(p.area, u.area);
    assert.equal(p.level, usableLevel(u, 2));
    assert.ok(p.tplId && p.key);
  }
});

test("genSimilar は同じ型（テンプレート）で作る", () => {
  const r = seededR(7);
  const p = genProblem("E3-warizan", 1, { r });
  const q = genSimilar(p.unitId, p.level, p.tplId, { r });
  assert.equal(q.tplId, p.tplId);
});

test("toChoices：数の答えは4択にでき、正解が入っていて、マイナスは出ない", () => {
  const r = seededR(3);
  let made = 0;
  for (const u of UNITS) {
    for (let i = 0; i < 3; i++) {
      const p = genProblem(u.id, 1, { r });
      const c = toChoices(p, r);
      if (!c) continue;
      made++;
      assert.ok(c.choices.some((x) => String(x) === String(c.ans)), `${p.tplId} の4択に正解がない`);
      for (const x of c.choices) if (typeof x === "number") assert.ok(x >= 0, `${p.tplId} にマイナス ${x}`);
      assert.ok(checkAnswer(c, c.ans).correct);
    }
  }
  assert.ok(made > 100, `4択にできた問題が少ない: ${made}`);
});

test("数字キーの「.」「/」は学年で決まる（答えの形でばれない）", () => {
  const r = seededR(5);
  const p1 = genProblem("E1-tashi", 1, { r });
  assert.deepEqual(keysFor({ ...p1, choices: undefined }), { dot: false, slash: false });
  const p3 = genProblem("E3-warizan", 1, { r });
  assert.deepEqual(keysFor({ ...p3, choices: undefined }), { dot: true, slash: true });
});
