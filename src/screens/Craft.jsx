// つくる：せっけいずを えらび、素材がそろっていれば「せっけいの もんだい」を といて家具をつくる
//   どうぐのレベルが足りない せっけいずは まだ つくれない（その分野の問題を とくと どうぐが育つ）
import { useState } from "react";
import Art from "../ui/Art.jsx";
import ProblemCard from "../ui/ProblemCard.jsx";
import { Count } from "../ui/parts.jsx";
import { RECIPES, ITEM_NAME, toolOfArea } from "../data/items.js";
import { AREA_LABEL } from "../content/index.js";
import { makeProblem } from "../engine/pick.js";
import { applyResult, craftCheck, spendHint } from "../engine/game.js";

export default function Craft({ s, act, go, r }) {
  const [making, setMaking] = useState(null); // { recipe, problem }
  const [done, setDone] = useState(null); // { recipe, correct }

  const start = (recipe) => {
    setDone(null);
    setMaking({
      recipe,
      problem: makeProblem(s, { area: recipe.tool[0], mode: "craft" }, r),
    });
  };

  const finish = (res) => {
    act((st) =>
      applyResult(
        st,
        {
          mode: "craft",
          recipeId: making.recipe.id,
          problem: making.problem,
          ...res,
        },
        r,
      ),
    );
    setDone({ recipe: making.recipe, correct: res.correct });
    setMaking(null);
  };

  const tryHint = () => {
    if ((s.inv?.hirameki || 0) <= 0) return false;
    act((st) => spendHint(st).state);
    return true;
  };

  if (making?.problem) {
    const rc = making.recipe;
    return (
      <main className="screen craft">
        <ProblemCard
          key={making.problem.key}
          problem={making.problem}
          header={
            <div className="speaker">
              <Art name={rc.art} size="xl" />
              <div className="speaker-body">
                <div className="speaker-name">{rc.name}の せっけいず</div>
                <p className="ask">
                  せっけいの もんだいを とくと できあがるよ。
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
    <main className="screen craft">
      {done && (
        <div
          className={`result workbench-result ${done.correct ? "result-ok" : "result-try"}`}
        >
          <Art name={done.correct ? done.recipe.art : "workshop"} size="xl" />
          <div className="result-title">
            {done.correct
              ? `${done.recipe.name}が できた！`
              : "ざんねん、こんどは できるよ"}
          </div>
          {done.correct ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => go("camp")}
            >
              キャンプに おきに いく
            </button>
          ) : (
            <p className="note">
              そざいは へっていないよ。もんだいは「たからのちず」に のったよ。
            </p>
          )}
        </div>
      )}

      <div className="page-heading">
        <Art name="workshop" size="lg" title="" />
        <div>
          <span className="eyebrow">もりの さぎょうだい</span>
          <h1>なにを つくろう？</h1>
          <p>あつめた そざいが、きみの かぐに。</p>
        </div>
      </div>
      <h2 className="h2">せっけいず</h2>
      <div className="recipes">
        {RECIPES.map((rc) => {
          const c = craftCheck(s, rc);
          const tool = toolOfArea(rc.tool[0]);
          return (
            <div
              key={rc.id}
              className={`recipe ${c.ok ? "is-ready" : ""} ${c.toolOk ? "" : "is-locked"}`}
            >
              <Art
                name={c.toolOk ? rc.art : "lock"}
                size="lg"
                title={c.toolOk ? undefined : `${rc.name}（まだ つくれない）`}
              />
              <div className="recipe-body">
                {c.ok && <span className="recipe-ready">✓ つくれる！</span>}
                <div className="recipe-name">
                  {rc.name}
                  {(s.furn?.[rc.id] || 0) +
                    s.camp.filter((x) => x.id === rc.id).length >
                    0 && <span className="tag">もってる</span>}
                </div>
                <div className="recipe-need">
                  {Object.entries(rc.need).map(([id, k]) => (
                    <Count
                      key={id}
                      art={id}
                      n={s.inv?.[id] || 0}
                      need={k}
                      label={ITEM_NAME[id]}
                    />
                  ))}
                </div>
                <div className={`recipe-tool ${c.toolOk ? "" : "is-short"}`}>
                  <Art name={tool.art} size="xs" title="" /> {tool.name} レベル
                  {c.needLv}から（{AREA_LABEL[rc.tool[0]]}）
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-small"
                disabled={!c.ok}
                onClick={() => start(rc)}
              >
                つくる
              </button>
            </div>
          );
        })}
      </div>
      <p className="note">
        そざいは、なかまの おねがいと つりで あつまるよ。どうぐは、その なかまの
        もんだいを とくほど そだつよ。
      </p>
      <button type="button" className="btn" onClick={() => go("forest")}>
        もりに もどる
      </button>
    </main>
  );
}
