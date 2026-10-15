// ============================================================
// demo.js — デザイン確認用のセーブ（URL に ?demo をつけると使う）
//   素材・かぐ・なかよし・たからのちず が そろった状態で、全画面を見られる。
//   ほんもののセーブとは別の場所（DEMO_KEY）に保存されるので、上書きしない。
//   ?demo=E1 のように学年も選べる（1年生だと メモは おでかけ中）。
// ============================================================
import { newSave, todayStr } from "./save.js";
import { genProblem, seededR, GRADES } from "../content/index.js";

export function makeDemo(grade = "E3") {
  const g = GRADES.includes(grade) ? grade : "E3";
  const r = seededR(99);
  const s = newSave({ name: "デモ", grade: g, today: todayStr() });
  s.inv = { maruta: 12, ishi: 8, keito: 9, hana: 6, sakana: 3, hirameki: 5 };
  s.friend = { mugi: 95, chikuta: 55, ruru: 25, memo: g === "E1" ? 0 : 10 };
  s.tools = { num: 32, func: 16, geo: 6, data: g === "E1" ? 0 : 2 };
  s.furn = { isu: 1, kadan: 1, lantern: 1 };
  s.camp = [
    { id: "takibi", x: 1, y: 1 },
    { id: "isu", x: 2, y: 1 },
    { id: "tent", x: 0, y: 3 },
  ];
  s.today = { ...s.today, solved: 4, correct: 3, requests: { mugi: 1, chikuta: 3, ruru: 0, memo: 2 } };
  s.stats = { solved: 120, correct: 96, treasureCleared: 7, crafted: 5, fish: 30 };
  s.playDays = 9;
  const ids = g === "E1" ? ["E1-tashi", "E1-tokei", "E1-katachi"] : ["E2-kuku", "E2-jikan", "E2-zukei"];
  for (const uid of ids) {
    const p = genProblem(uid, 1, { r });
    if (p) s.treasure.push({ id: `${p.unitId}/${p.tplId}`, unitId: p.unitId, level: p.level, tplId: p.tplId, area: p.area, q: p.q, at: s.day });
  }
  return s;
}
