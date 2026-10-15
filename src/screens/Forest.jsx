// もり（ホーム）：住人4人と、つり・つくる・キャンプ・たからのちず・もちもの
import Art from "../ui/Art.jsx";
import { Hearts } from "../ui/parts.jsx";
import { VILLAGERS } from "../data/villagers.js";
import { AREA_LABEL, UNITS, gradeNum } from "../content/index.js";
import { isHere } from "../engine/pick.js";
import { requestsLeft, isSpecialNext } from "../engine/game.js";

function greeting(name) {
  const h = new Date().getHours();
  const who = name || "きみ";
  if (h < 10) return `おはよう、${who}！`;
  if (h < 17) return `こんにちは、${who}！`;
  return `こんばんは、${who}！`;
}

/** その分野が はじまる学年（おでかけ中の住人が いつ くるか） */
function firstGradeOf(area) {
  return Math.min(...UNITS.filter((u) => u.area === area).map((u) => u.gn));
}

export default function Forest({ s, go }) {
  const goal = s.settings?.dailyGoal || 10;
  const solved = s.today?.solved || 0;
  const pct = Math.min(100, Math.round((solved / goal) * 100));
  return (
    <main className="screen forest">
      <section className="forest-sky">
        <p className="greet">{greeting(s.name)}</p>
        <div className="goal">
          <span className="goal-label">きょうの もくひょう</span>
          <span className="bar bar-goal">
            <span className="bar-fill" style={{ width: `${pct}%` }} />
          </span>
          <span className="goal-num">
            {solved}/{goal}
          </span>
        </div>
      </section>

      <section className="villagers" aria-label="もりの なかま">
        {VILLAGERS.map((v) => {
          const here = isHere(s, v);
          const left = here ? requestsLeft(s, v.id) : 0;
          const special = here && isSpecialNext(s, v.id);
          return (
            <button key={v.id} type="button" className={`villager ${here ? "" : "is-away"}`} disabled={!here} onClick={() => go("request", { villagerId: v.id })}>
              {here && left > 0 && <span className={`badge ${special ? "badge-special" : ""}`}>{special ? "⭐" : "！"}</span>}
              <Art name={here ? v.art : "away"} size="xl" title={here ? undefined : `${v.name}は おでかけ中`} />
              <span className="villager-name">{v.name}</span>
              <span className="villager-area">{AREA_LABEL[v.area]}</span>
              {here ? (
                <>
                  <Hearts points={s.friend?.[v.id] || 0} />
                  <span className="villager-status">{left > 0 ? `おねがい あと ${left}` : "また あした"}</span>
                </>
              ) : (
                <span className="villager-status">
                  {firstGradeOf(v.area) > gradeNum(s.grade) ? `${firstGradeOf(v.area)}ねんせいに なったら くるよ` : "たんげんを ならったら くるよ"}
                </span>
              )}
            </button>
          );
        })}
      </section>

      <nav className="places" aria-label="ばしょ">
        <button type="button" className="place" onClick={() => go("fish")}>
          <Art name="fishing" size="lg" />
          <span>つり</span>
        </button>
        <button type="button" className="place" onClick={() => go("craft")}>
          <Art name="workshop" size="lg" />
          <span>つくる</span>
        </button>
        <button type="button" className="place" onClick={() => go("camp")}>
          <Art name="camp" size="lg" />
          <span>キャンプ</span>
        </button>
        <button type="button" className="place" onClick={() => go("treasure")}>
          {s.treasure.length > 0 && <span className="badge">{s.treasure.length}</span>}
          <Art name="map" size="lg" />
          <span>たからのちず</span>
        </button>
        <button type="button" className="place" onClick={() => go("bag")}>
          <Art name="bag" size="lg" />
          <span>もちもの</span>
        </button>
      </nav>
    </main>
  );
}
