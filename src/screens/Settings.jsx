// せってい（おうちのかた・先生むけ）：なまえ・学年・習った単元・つりの時間・よみあげ・1日のもくひょう・きろく・データをけす
import { useState } from "react";
import { GRADES, GRADE_LABEL, unitsOfGrade, AREA_LABEL } from "../content/index.js";
import { setGrade, toggleLearned, setSetting, setName } from "../engine/game.js";

export default function Settings({ s, act, go, onReset, demo }) {
  const [confirm, setConfirm] = useState(false);
  const units = unitsOfGrade(s.grade);
  const rate = s.stats.solved ? Math.round((s.stats.correct / s.stats.solved) * 100) : 0;
  const set = (k, v) => act((st) => setSetting(st, k, v));
  return (
    <main className="screen settings">
      <h2 className="h2">せってい（おうちの かた・せんせいへ）</h2>

      <section className="card">
        <label className="field">
          <span className="field-label">なまえ</span>
          <input className="input" value={s.name} maxLength={12} onChange={(e) => act((st) => setName(st, e.target.value))} />
        </label>
      </section>

      <section className="card">
        <div className="field-label">がくねん</div>
        <div className="grade-grid">
          {GRADES.map((g) => (
            <button key={g} type="button" className={`btn btn-grade ${s.grade === g ? "is-on" : ""}`} aria-pressed={s.grade === g} onClick={() => act((st) => setGrade(st, g))}>
              {GRADE_LABEL[g]}
            </button>
          ))}
        </div>
        <p className="note">その学年までの単元から出題します（いまの学年を多めに、前の学年は復習として）。</p>
      </section>

      <section className="card">
        <div className="field-label">{GRADE_LABEL[s.grade]}の たんげん（まだ ならっていない たんげんは「まだ」に）</div>
        <div className="unit-list">
          {units.map((u) => {
            const learned = !(s.unlearned || []).includes(u.id);
            return (
              <button key={u.id} type="button" className={`unit-toggle ${learned ? "is-on" : ""}`} aria-pressed={learned} onClick={() => act((st) => toggleLearned(st, u.id))}>
                <span className="unit-name">{u.name}</span>
                <span className="unit-area">{AREA_LABEL[u.area]}</span>
                <span className="unit-state">{learned ? "ならった" : "まだ"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="field-label">あそびかた</div>
        <label className="switch">
          <input type="checkbox" checked={s.settings.fishTimer !== false} onChange={(e) => set("fishTimer", e.target.checked)} />
          <span>つりの じかん（20びょう）</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={s.settings.speech !== false} onChange={(e) => set("speech", e.target.checked)} />
          <span>もんだいの よみあげボタン</span>
        </label>
        <div className="field-label">1にちの もくひょう</div>
        <div className="grade-grid">
          {[5, 10, 15, 20].map((n) => (
            <button key={n} type="button" className={`btn btn-grade ${s.settings.dailyGoal === n ? "is-on" : ""}`} aria-pressed={s.settings.dailyGoal === n} onClick={() => set("dailyGoal", n)}>
              {n}もん
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="field-label">きろく</div>
        <ul className="stats">
          <li>あそんだ日：{s.playDays}日</li>
          <li>といた もんだい：{s.stats.solved}もん（せいかい {rate}%）</li>
          <li>たからのちずを とりもどした：{s.stats.treasureCleared}かい</li>
          <li>つくった かぐ：{s.stats.crafted}こ</li>
        </ul>
        <p className="note">記録はこの端末（ブラウザ）の中だけに保存されます。広告・課金・外部への送信はありません。</p>
      </section>

      <section className="card">
        {!confirm ? (
          <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>
            {demo ? "デモの データを けす" : "データを ぜんぶ けす"}
          </button>
        ) : (
          <div className="confirm">
            <p>ほんとうに けしますか？ もとに もどせません。</p>
            <button type="button" className="btn btn-danger" onClick={onReset}>
              けす
            </button>
            <button type="button" className="btn" onClick={() => setConfirm(false)}>
              やめる
            </button>
          </div>
        )}
      </section>

      <button type="button" className="btn" onClick={() => go("forest")}>
        もりに もどる
      </button>
    </main>
  );
}
