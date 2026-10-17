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
      <div className="forest-scene">
        <div className="forest-welcome">
          <p className="greet">{greeting(s.name)}</p>
          <h1>もりで、なにしよう？</h1>
          <p>なかまに はなしかけて みよう！</p>
        </div>
        <div className="forest-quest">
          <Art name="star" size="md" title="" />
          <div>
            <span className="goal-label">きょうの もくひょう</span>
            <span
              className="bar bar-goal"
              role="progressbar"
              aria-label="きょうの もくひょう"
              aria-valuenow={solved}
              aria-valuemin={0}
              aria-valuemax={Math.max(solved, goal)}
            >
              <span className="bar-fill" style={{ width: `${pct}%` }} />
            </span>
          </div>
          <strong className="goal-num">
            {solved}
            <small> / {goal}</small>
          </strong>
        </div>
        <div className="forest-drift" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <section className="villagers" aria-label="もりの なかま">
          {VILLAGERS.map((v) => {
            const here = isHere(s, v);
            const left = here ? requestsLeft(s, v.id) : 0;
            const special = here && isSpecialNext(s, v.id);
            return (
              <button
                key={v.id}
                type="button"
                className={`villager villager-${v.id} ${here ? "" : "is-away"}`}
                data-testid={`villager-${v.id}`}
                disabled={!here}
                onClick={() => go("request", { villagerId: v.id })}
              >
                {here && left > 0 && (
                  <span className={`badge ${special ? "badge-special" : ""}`}>
                    {special ? (
                      <Art name="star" size="sm" title="とくべつ" />
                    ) : (
                      "！"
                    )}
                  </span>
                )}
                <Art
                  name={here ? v.art : "away"}
                  size="xl"
                  title={here ? undefined : `${v.name}は おでかけ中`}
                />
                <span className="villager-sign">
                  <span className="villager-name">{v.name}</span>
                  <Hearts points={s.friend?.[v.id] || 0} />
                </span>
                <span className="villager-area">{AREA_LABEL[v.area]}</span>
                <span className="villager-status">
                  {here
                    ? left > 0
                      ? `おねがい あと ${left}`
                      : "また あした"
                    : firstGradeOf(v.area) > gradeNum(s.grade)
                      ? `${firstGradeOf(v.area)}ねんせいに なったら くるよ`
                      : "たんげんを ならったら くるよ"}
                </span>
              </button>
            );
          })}
        </section>
        <nav className="places" aria-label="ばしょ">
          {[
            ["fish", "fishing", "つり", "なにが つれるかな？"],
            ["craft", "workshop", "つくる", "そざいを あつめよう"],
            ["camp", "camp", "キャンプ", "きみだけの ばしょ"],
            ["treasure", "map", "たからのちず", "たからを みつけよう"],
            ["bag", "bag", "もちもの", "なにが あつまった？"],
          ].map(([to, art, label, sub]) => (
            <button
              key={to}
              type="button"
              className={`place place-${to}`}
              data-testid={`place-${to}`}
              onClick={() => go(to)}
            >
              {to === "treasure" && s.treasure.length > 0 && (
                <span className="badge">{s.treasure.length}</span>
              )}
              <Art name={art} size="xl" title="" />
              <span className="place-sign">{label}</span>
              <span className="place-sub">{sub}</span>
            </button>
          ))}
        </nav>
        <span className="forest-entry" aria-hidden="true">
          すうがくの もり
        </span>
      </div>
      <p className="forest-tip">
        <Art name="hirameki" size="sm" title="" />
        もんだいを とくと、もりの くらしが そだつよ。
      </p>
    </main>
  );
}
