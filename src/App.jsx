// ============================================================
// App.jsx — 画面のつなぎ役（うすく）
//   セーブ（s）を持ち、画面に「act（セーブを変える）」と「go（画面をかえる）」をわたす。
//   ゲームのルールは engine/、問題は content/、見た目は ui/ と styles/。
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { load, save, clear, newSave, rollDay, todayStr, SAVE_KEY, DEMO_KEY } from "./engine/save.js";
import { makeDemo } from "./engine/demo.js";
import { randomR } from "./content/index.js";
import { getVillager } from "./data/villagers.js";
import { ITEM_NAME, FURNITURE_NAME, toolOfArea } from "./data/items.js";
import Art from "./ui/Art.jsx";
import { TopBar, Toasts, Modal } from "./ui/parts.jsx";
import Start from "./screens/Start.jsx";
import Forest from "./screens/Forest.jsx";
import Request from "./screens/Request.jsx";
import Fishing from "./screens/Fishing.jsx";
import Craft from "./screens/Craft.jsx";
import Camp from "./screens/Camp.jsx";
import Treasure from "./screens/Treasure.jsx";
import Bag from "./screens/Bag.jsx";
import Settings from "./screens/Settings.jsx";

const params = new URLSearchParams(window.location.search);
const DEMO = params.has("demo");
const DEMO_GRADE = (params.get("demo") || "E3").toUpperCase();
// デモは学年ごとに別の場所に保存（?demo=E1 と ?demo=E3 が まざらないように）
const KEY = DEMO ? `${DEMO_KEY}:${DEMO_GRADE}` : SAVE_KEY;

const TITLES = { forest: "もり", request: "おねがい", fish: "つり", craft: "つくる", camp: "キャンプ", treasure: "たからのちず", bag: "もちもの", settings: "せってい" };

let toastSeq = 0;
/** できごと → おしらせ（until … きえる時刻） */
function toToasts(events) {
  const out = [];
  for (const e of events) {
    if (e.type === "reward") for (const [id, k] of Object.entries(e.items)) out.push({ art: id, text: `${ITEM_NAME[id]} ＋${k}` });
    else if (e.type === "friendUp") {
      const v = getVillager(e.villager);
      out.push({ art: v?.art, text: `${v?.name}と もっと なかよしに なった！（ハート ${e.level}）`, big: true });
    } else if (e.type === "toolUp") {
      const t = toolOfArea(e.area);
      out.push({ art: t?.art, text: `${t?.name}が レベル${e.level}に なった！`, big: true });
    } else if (e.type === "furniture") out.push({ art: e.id, text: `${FURNITURE_NAME[e.id]}が できた！`, big: true });
    else if (e.type === "treasureAdd") out.push({ art: "map", text: "たからのちずが ふえた" });
    else if (e.type === "treasureClear") out.push({ art: "chest", text: "たからばこが ひらいた！", big: true });
  }
  const now = Date.now();
  return out.map((t, i) => ({ ...t, id: ++toastSeq, until: now + (t.big ? 3200 : 2000) + i * 300 }));
}

export default function App() {
  const [s, setS] = useState(() => {
    const saved = load(KEY);
    if (saved) return rollDay(saved, todayStr());
    return DEMO ? makeDemo(DEMO_GRADE) : null;
  });
  const [screen, setScreen] = useState({ name: "forest" });
  const [toasts, setToasts] = useState([]);
  const [goal, setGoal] = useState(null);
  const sRef = useRef(s);
  sRef.current = s;

  // セーブ
  useEffect(() => {
    if (s) save(s, KEY);
  }, [s]);

  // ひらきっぱなしで日付が かわったとき
  useEffect(() => {
    const id = setInterval(() => setS((x) => (x ? rollDay(x, todayStr()) : x)), 60_000);
    return () => clearInterval(id);
  }, []);

  /**
   * セーブを変える。fn は (s) => 新しいs、または (s) => { state, events }。
   * できごと（events）を おしらせにして、呼んだ画面にも返す。
   */
  const act = useCallback((fn) => {
    const out = fn(sRef.current);
    const hasEvents = out && typeof out === "object" && "state" in out;
    const next = hasEvents ? out.state : out;
    const events = hasEvents ? out.events || [] : [];
    sRef.current = next;
    setS(next);
    if (events.length) {
      const ts = toToasts(events);
      if (ts.length) setToasts((q) => [...q, ...ts]);
      const g = events.find((e) => e.type === "goal");
      if (g) setGoal(g);
    }
    return events;
  }, []);

  const go = useCallback((name, opt = {}) => {
    setScreen({ name, ...opt });
    window.scrollTo(0, 0);
  }, []);

  const dropToast = useCallback((id) => setToasts((q) => q.filter((t) => t.id !== id)), []);

  if (!s) {
    return <Start onStart={(name, grade) => setS(newSave({ name, grade }))} />;
  }

  const props = { s, act, go, r: randomR };
  let body;
  switch (screen.name) {
    case "request":
      body = <Request key={screen.villagerId} {...props} villagerId={screen.villagerId} />;
      break;
    case "fish":
      body = <Fishing {...props} />;
      break;
    case "craft":
      body = <Craft {...props} />;
      break;
    case "camp":
      body = <Camp {...props} />;
      break;
    case "treasure":
      body = <Treasure {...props} />;
      break;
    case "bag":
      body = <Bag {...props} />;
      break;
    case "settings":
      body = (
        <Settings
          {...props}
          demo={DEMO}
          onReset={() => {
            clear(KEY);
            setS(null);
            setScreen({ name: "forest" });
          }}
        />
      );
      break;
    default:
      body = <Forest {...props} />;
  }

  return (
    <div className={`app ${DEMO ? "is-demo" : ""}`}>
      <TopBar
        s={s}
        title={TITLES[screen.name] || ""}
        onBack={screen.name === "forest" ? null : () => go("forest")}
        onSettings={screen.name === "settings" ? null : () => go("settings")}
      />
      {body}
      <Toasts toasts={toasts} onDone={dropToast} />
      {goal && (
        <Modal onClose={() => setGoal(null)}>
          <Art name="party" size="xl" />
          <h2 className="h2">きょうの もくひょう たっせい！</h2>
          <p>きょうは {goal.solved}もん といたよ。よく がんばったね。</p>
          <p className="note">つづけても いいし、きょうは ここまでに しても いいよ。</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setGoal(null);
              go("camp");
            }}
          >
            キャンプを みて おわる
          </button>
          <button type="button" className="btn" onClick={() => setGoal(null)}>
            もうすこし あそぶ
          </button>
        </Modal>
      )}
      {DEMO && <div className="demo-flag">デモ</div>}
    </div>
  );
}
