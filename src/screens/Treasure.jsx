// たからのちず：まちがえた もんだいの「にている もんだい」（同じ型・数字ちがい）を といて、たからばこを あける
import { useState } from "react";
import Art from "../ui/Art.jsx";
import ProblemCard from "../ui/ProblemCard.jsx";
import { ITEM_NAME } from "../data/items.js";
import { villagerOfArea } from "../data/villagers.js";
import { getUnit, genSimilar, GRADE_LABEL } from "../content/index.js";
import { applyResult, spendHint } from "../engine/game.js";

export default function Treasure({ s, act, go, r }) {
  const [open, setOpen] = useState(null); // { entry, problem }
  const [done, setDone] = useState(null); // { correct, got }

  const start = (entry) => {
    setDone(null);
    setOpen({
      entry,
      problem: genSimilar(entry.unitId, entry.level, entry.tplId, { r }),
    });
  };

  const finish = (res) => {
    const events = act((st) =>
      applyResult(
        st,
        {
          mode: "treasure",
          treasureId: open.entry.id,
          problem: { ...open.problem, area: open.entry.area },
          ...res,
        },
        r,
      ),
    );
    setDone({
      correct: res.correct,
      got: events.find((e) => e.type === "reward")?.items || {},
    });
    setOpen(null);
  };

  const tryHint = () => {
    if ((s.inv?.hirameki || 0) <= 0) return false;
    act((st) => spendHint(st).state);
    return true;
  };

  if (open?.problem) {
    const u = getUnit(open.entry.unitId);
    return (
      <main className="screen treasure">
        <ProblemCard
          key={open.problem.key}
          problem={open.problem}
          header={
            <div className="speaker">
              <Art name="map" size="xl" />
              <div className="speaker-body">
                <div className="speaker-name">にている もんだい</div>
                <p className="ask">
                  {GRADE_LABEL[u?.grade]}「{u?.name}」
                </p>
              </div>
            </div>
          }
          hintCount={s.inv?.hirameki || 0}
          onUseHint={tryHint}
          speech={s.settings?.speech !== false}
          onFinish={finish}
        />
      </main>
    );
  }

  return (
    <main className="screen treasure">
      {done && (
        <div className={`result ${done.correct ? "result-ok" : "result-try"}`}>
          <Art name={done.correct ? "chest" : "map"} size="xl" />
          <div className="result-title">
            {done.correct
              ? "たからばこが ひらいた！"
              : "おしい！ ちずは のこっているよ"}
          </div>
          <div className="got">
            {Object.entries(done.got).map(([id, k]) => (
              <span key={id} className="got-item">
                <Art name={id} size="md" /> {ITEM_NAME[id]} ×{k}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="page-heading">
        <Art name="map" size="xl" title="" />
        <div>
          <span className="eyebrow">まちがいは、たからの ありか</span>
          <h1>たからを みつけよう！</h1>
        </div>
      </div>
      <p className="lead">
        まちがえた もんだいは、たからの ありか。にている もんだいを
        とくと、たからばこが ひらくよ。
      </p>

      {s.treasure.length === 0 ? (
        <p className="note">
          いまは ちずが ないよ。まちがえても だいじょうぶ。ここに ちずが
          ふえるだけ！
        </p>
      ) : (
        <div className="maps">
          {[...s.treasure].reverse().map((t) => {
            const u = getUnit(t.unitId);
            const v = villagerOfArea(t.area);
            return (
              <button
                key={t.id}
                type="button"
                className="map-card"
                onClick={() => start(t)}
              >
                <Art name={v?.art || "map"} size="lg" />
                <span className="map-body">
                  <span className="map-unit">
                    {GRADE_LABEL[u?.grade]}「{u?.name}」
                  </span>
                  <span className="map-date">{t.at}</span>
                </span>
                <Art name="chest" size="md" />
              </button>
            );
          })}
        </div>
      )}

      <button type="button" className="btn" onClick={() => go("forest")}>
        もりに もどる
      </button>
    </main>
  );
}
