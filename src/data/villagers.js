// ============================================================
// villagers.js — 森の住人（4人）。1人が1つの分野（area）を受けもつ。
//
//  area     … 出題する単元の分野（content/index.js の AREAS）
//  material … おねがいを聞いたお礼にくれる素材（data/items.js）
//  fav      … 好きな家具。キャンプに置いておくと よろこぶ
//  art      … 絵の名前（ui/Art.jsx）。絵はCodexが差しかえる
//  せりふは、小1でも読めるように ひらがな中心。{name} はプレイヤーの名前
//  ※ 名前・せいかくは仮。オリジナルのキャラクター（既存ゲームのキャラクターはまねしない）
// ============================================================

export const VILLAGERS = [
  {
    id: "mugi",
    name: "ムギ",
    animal: "くま",
    area: "num",
    material: "maruta",
    fav: "takibi",
    art: "mugi",
    trait: "くいしんぼう。おやつを かぞえたり わけたり するのが だいすき。",
    ask: ["ねえねえ、{name}。これ、わかる？", "おなか すいたなあ。その まえに、これを おしえて！", "かずの ことで こまってるんだ。"],
    retry: ["おしい！ もういちど いっしょに かんがえよう。", "うーん、ちがうみたい。ゆっくりで いいよ。"],
    thanks: ["やったあ！ ありがとう、{name}！", "わあ、すごい！ おれいに まるたを どうぞ。"],
    gaveUp: ["むずかしかったね。とき方を いっしょに みよう。", "ちょうせん してくれて ありがとう！"],
    done: "きょうの おねがいは おしまい。また あしたね！",
  },
  {
    id: "chikuta",
    name: "チクタ",
    animal: "りす",
    area: "func",
    material: "ishi",
    fav: "lantern",
    art: "chikuta",
    trait: "きっちりや。とけいと、ながさや おもさを はかるのが すき。",
    ask: ["チクタク チクタク。{name}、じかんが あったら これ おねがい！", "はかって みたいんだけど、てつだって くれる？", "これ、ぴったり わかるかな？"],
    retry: ["ちょっと ずれてる みたい。もういちど！", "おしい！ はかり なおして みよう。"],
    thanks: ["ぴったり！ ありがとう、{name}！", "かんぺき！ おれいに いしを どうぞ。"],
    gaveUp: ["だいじょうぶ。とき方を みて みよう。", "また こんど、いっしょに はかろうね。"],
    done: "きょうの おねがいは おしまい。また あした、ぴったりの じかんに！",
  },
  {
    id: "ruru",
    name: "ルル",
    animal: "うさぎ",
    area: "geo",
    material: "keito",
    fav: "tent",
    art: "ruru",
    trait: "おしゃれ。かたちを くみあわせて、かわいい ものを つくりたい。",
    ask: ["{name}、かたちの ことで そうだん したいの。", "かわいい ものを つくりたいの。これ わかる？", "ねえ、いっしょに かんがえて くれる？"],
    retry: ["あら、ちょっと ちがう みたい。もういちど！", "おしい！ かたちを よく みて みよう。"],
    thanks: ["すてき！ ありがとう、{name}！", "うれしい！ おれいに けいとを どうぞ。"],
    gaveUp: ["むずかしかったね。とき方を みて みようか。", "ちょうせん、かっこよかったよ。"],
    done: "きょうの おねがいは おしまい。また あした あそびに きてね。",
  },
  {
    id: "memo",
    name: "メモ",
    animal: "ねこ",
    area: "data",
    material: "hana",
    fav: "kadan",
    art: "memo",
    trait: "しらべものずき。しらべた ことを ひょうや グラフに するのが すき。",
    ask: ["{name}、しらべた ことを まとめたいの。てつだって！", "この きろく、どう よめば いいかな？", "ちょっと しらべものに つきあって くれる？"],
    retry: ["うーん、もういちど しらべて みよう。", "おしい！ よく みて みよう。"],
    thanks: ["なるほど！ ありがとう、{name}！", "たすかった！ おれいに はなを どうぞ。"],
    gaveUp: ["だいじょうぶ。とき方を いっしょに みよう。", "また いっしょに しらべようね。"],
    done: "きょうの おねがいは おしまい。また あしたね。",
  },
];

export const getVillager = (id) => VILLAGERS.find((v) => v.id === id) || null;
export const villagerOfArea = (area) => VILLAGERS.find((v) => v.area === area) || null;

/** せりふを1つ選んで {name} を入れる */
export function line(list, name, r = (a, b) => a + Math.floor(Math.random() * (b - a + 1))) {
  const arr = Array.isArray(list) ? list : [list];
  const s = arr[r(0, arr.length - 1)] || "";
  return s.replaceAll("{name}", name || "きみ");
}

/** 1人の住人が1日に出す おねがいの数 */
export const REQUESTS_PER_DAY = 3;
