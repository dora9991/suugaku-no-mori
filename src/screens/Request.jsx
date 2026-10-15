// おねがい：住人が、自分の分野の問題を おねがいしてくる（1日3つ。さいごは とくべつ⭐）
import { useState } from "react";
import Art from "../ui/Art.jsx";
import { Dialogue } from "../ui/feel.jsx";
import ProblemCard, { Steps } from "../ui/ProblemCard.jsx";
import { Hearts } from "../ui/parts.jsx";
import { getVillager, line } from "../data/villagers.js";
import { ITEM_NAME } from "../data/items.js";
import { AREA_LABEL, LEVEL_LABEL } from "../content/index.js";
import { makeProblem } from "../engine/pick.js";
import {
  applyResult,
  requestsLeft,
  isSpecialNext,
  giveFish,
  spendHint,
} from "../engine/game.js";

export default function Request({ s, villagerId, act, go, r }) {
  const v = getVillager(villagerId);
  const make = (st) =>
    requestsLeft(st, v.id) > 0
      ? makeProblem(
          st,
          { area: v.area, mode: "request", special: isSpecialNext(st, v.id) },
          r,
        )
      : null;
  const [problem, setProblem] = useState(() => make(s));
  const [askLine, setAskLine] = useState(() => line(v.ask, s.name, r));
  const [done, setDone] = useState(null); // { correct, line, got, problem }
  const [showSteps, setShowSteps] = useState(false);

  const finish = (res) => {
    const events = act((st) =>
      applyResult(
        st,
        { mode: "request", villagerId: v.id, problem, ...res },
        r,
      ),
    );
    const reward = events.find((e) => e.type === "reward");
    setDone({
      ...res,
      problem,
      got: reward?.items || {},
      line: line(res.correct ? v.thanks : v.gaveUp, s.name, r),
    });
    setShowSteps(false);
  };

  const next = () => {
    setProblem(make(s));
    setAskLine(line(v.ask, s.name, r));
    setDone(null);
  };

  const tryHint = () => {
    if ((s.inv?.hirameki || 0) <= 0) return false;
    act((st) => spendHint(st).state);
    return true;
  };

  const header = (
    <div className="speaker">
      <Art
        name={v.art}
        size="xl"
        variant={done ? (done.correct ? "happy" : "worried") : undefined}
      />
      <div className="speaker-body">
        <div className="speaker-name">
          {v.name} <span className="speaker-area">{AREA_LABEL[v.area]}</span>
        </div>
        <Hearts points={s.friend?.[v.id] || 0} />
      </div>
    </div>
  );

  // きょうの おねがいは おしまい
  if (!problem && !done) {
    return (
      <main className="screen request">
        {header}
        <div className="bubble">
          <p>
            <Dialogue text={v.done} />
          </p>
        </div>
        {(s.inv?.sakana || 0) > 0 && (
          <button
            type="button"
            className="btn"
            onClick={() => act((st) => giveFish(st, v.id))}
          >
            <Art name="sakana" size="sm" /> さかなを あげる（のこり{" "}
            {s.inv.sakana}）
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => go("forest")}
        >
          もりに もどる
        </button>
      </main>
    );
  }

  if (done) {
    const left = requestsLeft(s, v.id);
    return (
      <main className="screen request">
        {header}
        <div className={`result ${done.correct ? "result-ok" : "result-try"}`}>
          <div className="result-title">
            {done.correct ? "せいかい！" : "ちょうせん ありがとう！"}
          </div>
          <p className="result-line">
            <Dialogue text={done.line} />
          </p>
          {Object.keys(done.got).length > 0 && (
            <div className="got">
              {Object.entries(done.got).map(([id, k]) => (
                <span key={id} className="got-item">
                  <Art name={id} size="md" /> {ITEM_NAME[id]} ×{k}
                </span>
              ))}
            </div>
          )}
          {!done.correct && (
            <p className="note">
              この もんだいは「たからのちず」に のったよ。あとで にている
              もんだいに ちょうせん できるよ。
            </p>
          )}
          {done.correct && (
            <>
              <button
                type="button"
                className="btn btn-small btn-ghost"
                onClick={() => setShowSteps(!showSteps)}
              >
                {showSteps ? "とき方を とじる" : "とき方を みる"}
              </button>
              {showSteps && <Steps problem={done.problem} />}
            </>
          )}
        </div>
        {left > 0 ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            つぎの おねがい（あと {left}）
          </button>
        ) : (
          <p className="note">{v.done}</p>
        )}
        <button type="button" className="btn" onClick={() => go("forest")}>
          もりに もどる
        </button>
      </main>
    );
  }

  return (
    <main className="screen request">
      <ProblemCard
        key={problem.key}
        problem={problem}
        header={
          <>
            {header}
            <p className="ask">
              {problem.special && (
                <span className="tag tag-special">
                  <Art name="star" size="xs" title="" /> とくべつな おねがい
                </span>
              )}
              <Dialogue text={askLine} />
            </p>
            <p className="level">{LEVEL_LABEL[problem.level]}</p>
          </>
        }
        retryText={line(v.retry, s.name, r)}
        hintCount={s.inv?.hirameki || 0}
        onUseHint={tryHint}
        speech={s.settings?.speech !== false}
        onFinish={finish}
      />
    </main>
  );
}
