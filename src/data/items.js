// ============================================================
// items.js — 素材・どうぐ・家具（せっけいず）
//
//  素材は、住人のおねがいのお礼と、つりで手に入る。
//  どうぐは分野ごとに1つ。その分野の問題をとくほど育つ（レベル1〜5）。
//  家具は「せっけいず」の問題をとくと つくれる。どうぐのレベルが足りないと まだ つくれない。
//  絵の名前（art）は ui/Art.jsx と同じ。
// ============================================================

/** 素材（おねがいのお礼・つり） */
export const MATERIALS = [
  { id: "maruta", name: "まるた", art: "maruta" },
  { id: "ishi", name: "いし", art: "ishi" },
  { id: "keito", name: "けいと", art: "keito" },
  { id: "hana", name: "はな", art: "hana" },
];

/** つかうと へるもの */
export const CONSUMABLES = [
  { id: "hirameki", name: "ひらめきの み", art: "hirameki", desc: "こまった ときに、かんがえかたの ヒントが 1つ でる。" },
  { id: "sakana", name: "さかな", art: "sakana", desc: "すんでいる なかまに あげると、なかよしに なれる。" },
];

export const ITEM_NAME = Object.fromEntries([...MATERIALS, ...CONSUMABLES].map((x) => [x.id, x.name]));

/** どうぐ（分野ごと）。count … その分野で正解した数。lv … そこから決まるレベル */
export const TOOLS = [
  { area: "num", id: "kago", name: "かご", art: "kago" },
  { area: "func", id: "monosashi", name: "ものさし", art: "monosashi" },
  { area: "geo", id: "compass", name: "コンパス", art: "compass" },
  { area: "data", id: "mushimegane", name: "むしめがね", art: "mushimegane" },
];
export const toolOfArea = (area) => TOOLS.find((t) => t.area === area) || null;

/** どうぐのレベルが上がる正解数（レベル1は0問から） */
export const TOOL_STEPS = [0, 5, 15, 30, 50];
export function toolLevel(count = 0) {
  let lv = 1;
  TOOL_STEPS.forEach((n, i) => {
    if (count >= n) lv = i + 1;
  });
  return lv;
}
/** 次のレベルまで：{ lv, next(次に必要な数 or null), have } */
export function toolProgress(count = 0) {
  const lv = toolLevel(count);
  return { lv, have: count, next: TOOL_STEPS[lv] ?? null };
}

/**
 * 家具の せっけいず。
 *   need … 必要な素材、tool … [分野, 必要などうぐレベル]
 *   つくる ときに、その分野の「せっけいの もんだい」を1問とく。
 */
export const RECIPES = [
  { id: "isu", name: "まるたの いす", art: "isu", need: { maruta: 2 }, tool: ["num", 1] },
  { id: "takibi", name: "たきび", art: "takibi", need: { maruta: 2, ishi: 1 }, tool: ["func", 1] },
  { id: "tent", name: "テント", art: "tent", need: { keito: 3, maruta: 2 }, tool: ["geo", 1] },
  { id: "kadan", name: "はなだん", art: "kadan", need: { ishi: 2, hana: 2 }, tool: ["data", 1] },
  { id: "furin", name: "ふうりん", art: "furin", need: { ishi: 1, hana: 1 }, tool: ["func", 2] },
  { id: "tako", name: "たこ", art: "tako", need: { keito: 2, maruta: 1 }, tool: ["num", 2] },
  { id: "lantern", name: "ランタン", art: "lantern", need: { ishi: 2, keito: 1 }, tool: ["geo", 2] },
  { id: "telescope", name: "ぼうえんきょう", art: "telescope", need: { ishi: 2, maruta: 2 }, tool: ["data", 2] },
  { id: "sofa", name: "ふかふか ソファ", art: "sofa", need: { keito: 3, maruta: 3 }, tool: ["geo", 3] },
  { id: "koya", name: "きの こや", art: "koya", need: { maruta: 5, ishi: 3, keito: 2 }, tool: ["num", 3] },
];
export const getRecipe = (id) => RECIPES.find((x) => x.id === id) || null;
export const FURNITURE_NAME = Object.fromEntries(RECIPES.map((x) => [x.id, x.name]));

/** なかよしポイント → ハート（0〜5） */
export const FRIEND_STEPS = [20, 50, 90, 140, 200];
export function friendLevel(points = 0) {
  return FRIEND_STEPS.filter((n) => points >= n).length;
}

/** キャンプの広さ（よこ × たて） */
export const CAMP_W = 4;
export const CAMP_H = 4;
