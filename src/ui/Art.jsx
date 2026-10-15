// ============================================================
// Art.jsx — 絵の「差しかえ口」
//
//  いまは絵文字で仮置きしている。デザイン（Codex）は、ここを SVG や画像にかえる。
//  画面のほうは <Art name="mugi" size="lg" /> のように名前で呼ぶだけなので、
//  name（下の ART のキー）は変えないこと。大きさは size（sm / md / lg / xl）で。
// ============================================================

export const ART = {
  // 住人
  mugi: { emoji: "🐻", label: "ムギ（くま）" },
  chikuta: { emoji: "🐿️", label: "チクタ（りす）" },
  ruru: { emoji: "🐰", label: "ルル（うさぎ）" },
  memo: { emoji: "🐱", label: "メモ（ねこ）" },
  player: { emoji: "🧒", label: "じぶん" },
  // 素材
  maruta: { emoji: "🪵", label: "まるた" },
  ishi: { emoji: "🪨", label: "いし" },
  keito: { emoji: "🧶", label: "けいと" },
  hana: { emoji: "🌼", label: "はな" },
  // つかうもの
  hirameki: { emoji: "💡", label: "ひらめきの み" },
  sakana: { emoji: "🐟", label: "さかな" },
  // どうぐ（分野ごと）
  kago: { emoji: "🧺", label: "かご" },
  monosashi: { emoji: "📏", label: "ものさし" },
  compass: { emoji: "🧭", label: "コンパス" },
  mushimegane: { emoji: "🔍", label: "むしめがね" },
  // 家具
  isu: { emoji: "🪑", label: "まるたの いす" },
  takibi: { emoji: "🔥", label: "たきび" },
  tent: { emoji: "⛺", label: "テント" },
  kadan: { emoji: "🌷", label: "はなだん" },
  furin: { emoji: "🎐", label: "ふうりん" },
  tako: { emoji: "🪁", label: "たこ" },
  lantern: { emoji: "🏮", label: "ランタン" },
  telescope: { emoji: "🔭", label: "ぼうえんきょう" },
  sofa: { emoji: "🛋️", label: "ふかふか ソファ" },
  koya: { emoji: "🛖", label: "きの こや" },
  // 場所・しるし
  forest: { emoji: "🌳", label: "もり" },
  fishing: { emoji: "🎣", label: "つり" },
  workshop: { emoji: "🔨", label: "つくる" },
  camp: { emoji: "🏕️", label: "キャンプ" },
  map: { emoji: "🗺️", label: "たからのちず" },
  chest: { emoji: "🎁", label: "たからばこ" },
  bag: { emoji: "🎒", label: "もちもの" },
  settings: { emoji: "⚙️", label: "せってい" },
  speaker: { emoji: "🔊", label: "よみあげ" },
  heart: { emoji: "❤️", label: "なかよし" },
  heartEmpty: { emoji: "🤍", label: "" },
  star: { emoji: "⭐", label: "とくべつ" },
  sparkle: { emoji: "✨", label: "" },
  party: { emoji: "🎉", label: "おめでとう" },
  moon: { emoji: "🌙", label: "よる" },
  sun: { emoji: "☀️", label: "ひる" },
  wave: { emoji: "🌊", label: "いけ" },
  bobber: { emoji: "🔴", label: "うき" },
  away: { emoji: "🧳", label: "おでかけ中" },
  lock: { emoji: "🔒", label: "まだ つくれない" },
  back: { emoji: "◀", label: "もどる" },
};

export default function Art({ name, size = "md", className = "", title }) {
  const a = ART[name] || { emoji: "❔", label: name };
  const label = title ?? a.label;
  return (
    <span
      className={`art art-${size} art-${name} ${className}`.trim()}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {a.emoji}
    </span>
  );
}
