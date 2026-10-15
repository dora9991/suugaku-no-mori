// つり（ミニゲーム）：うきが しずんだら、4択の けいさんを すばやく。1回 5ひき まで
//   正解 → さかな・素材・ひらめきの み。まちがい → たからのちずへ。時間切れ → なにもなし
import { useEffect, useState } from "react";
import Art from "../ui/Art.jsx";
import { playCue } from "../ui/sound.js";
import ProblemCard from "../ui/ProblemCard.jsx";
import { ITEM_NAME } from "../data/items.js";
import { makeProblem } from "../engine/pick.js";
import { applyResult } from "../engine/game.js";

const CASTS = 5;
const TIMER = 20; // びょう（せっていで なしにできる）

export default function Fishing({ s, act, go, r }) {
  const [cast, setCast] = useState(0); // なげた回数
  const [phase, setPhase] = useState("ready"); // ready | wait | bite | caught | end
  const [problem, setProblem] = useState(null);
  const [last, setLast] = useState(null); // { correct, timeout, got }
  const [haul, setHaul] = useState({}); // この回で とれた物

  // うきが しずむまで すこし まつ
  useEffect(() => {
    if (phase !== "wait") return undefined;
    const id = setTimeout(
      () => {
        setProblem(makeProblem(s, { area: "num", mode: "fish" }, r));
        setPhase("bite");
      },
      900 + r(0, 900),
    );
    return () => clearTimeout(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "bite") playCue("bite");
    if ((phase === "caught" || phase === "end") && last?.correct)
      playCue("caught");
  }, [phase]);

  const throwRod = () => {
    setCast((c) => c + 1);
    setLast(null);
    setPhase("wait");
  };

  const finish = (res) => {
    const events = act((st) =>
      applyResult(st, { mode: "fish", problem, ...res }, r),
    );
    const got = events.find((e) => e.type === "reward")?.items || {};
    setHaul((h) => {
      const n = { ...h };
      for (const [k, v] of Object.entries(got)) n[k] = (n[k] || 0) + v;
      return n;
    });
    setLast({ ...res, got });
    setPhase(cast >= CASTS ? "end" : "caught");
  };

  return (
    <main className={`screen fishing phase-${phase}`}>
      <div className="page-heading">
        <span className="eyebrow">みずべの ひとやすみ</span>
        <h1>ひだまりの いけ</h1>
      </div>
      <div className="pond" aria-label="いけ">
        <span className="water-ripple ripple-one" aria-hidden="true" />
        <span className="fishing-line" aria-hidden="true" />
        <span className="water-ripple ripple-two" aria-hidden="true" />
        <Art
          name={
            last?.correct && (phase === "caught" || phase === "end")
              ? "sakana"
              : "bobber"
          }
          size="lg"
          className={
            phase === "wait"
              ? "is-floating"
              : phase === "bite"
                ? "is-biting"
                : last?.correct
                  ? "fish-leap"
                  : ""
          }
        />
        {phase === "bite" && (
          <span className="bite-mark" aria-hidden="true">
            ！
          </span>
        )}
        <span className="pond-reeds" aria-hidden="true" />
      </div>
      <p className="cast-count">
        <span className="cast-dots" aria-hidden="true">
          {Array.from({ length: CASTS }, (_, i) => (
            <i key={i} className={i < cast ? "is-used" : ""} />
          ))}
        </span>
        のこり {Math.max(0, CASTS - cast)} かい
      </p>

      {phase === "ready" && (
        <>
          <p className="lead">うきが しずんだら、すばやく こたえよう！</p>
          <button
            type="button"
            className="btn btn-primary btn-big"
            onClick={throwRod}
          >
            <Art name="fishing" size="md" /> つりざおを なげる
          </button>
        </>
      )}

      {phase === "wait" && <p className="lead wait">…じっと まとう…</p>}

      {phase === "bite" && problem && (
        <ProblemCard
          key={problem.key}
          problem={problem}
          tries={1}
          timerSec={s.settings?.fishTimer === false ? 0 : TIMER}
          header={<p className="ask">かかった！ どれかな？</p>}
          speech={s.settings?.speech !== false}
          revealLabel="つぎへ"
          onFinish={finish}
        />
      )}

      {phase === "bite" && !problem && (
        <p className="lead">いまは つれないみたい…</p>
      )}

      {(phase === "caught" || phase === "end") && last && (
        <div className={`result ${last.correct ? "result-ok" : "result-try"}`}>
          <div className="result-title">
            {last.correct
              ? "つれた！"
              : last.timeout
                ? "にげられちゃった"
                : "おしかった！"}
          </div>
          {Object.entries(last.got).map(([id, k]) => (
            <span key={id} className="got-item">
              <Art name={id} size="md" /> {ITEM_NAME[id]} ×{k}
            </span>
          ))}
        </div>
      )}

      {phase === "caught" && (
        <button
          type="button"
          className="btn btn-primary btn-big"
          onClick={throwRod}
        >
          もういちど なげる
        </button>
      )}

      {phase === "end" && (
        <div className="card">
          <div className="result-title">きょうの つり おしまい</div>
          {Object.keys(haul).length ? (
            <div className="got">
              {Object.entries(haul).map(([id, k]) => (
                <span key={id} className="got-item">
                  <Art name={id} size="md" /> {ITEM_NAME[id]} ×{k}
                </span>
              ))}
            </div>
          ) : (
            <p>こんどは きっと つれるよ。</p>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              setCast(0);
              setHaul({});
              setLast(null);
              setPhase("ready");
            }}
          >
            もう 1かい つりを する
          </button>
        </div>
      )}

      <button type="button" className="btn" onClick={() => go("forest")}>
        もりに もどる
      </button>
    </main>
  );
}
