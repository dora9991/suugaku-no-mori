// ============================================================
// ProblemCard.jsx — 1問をとく部品（おねがい・つり・つくる・たからのちず で共通）
//
//  ・4択（choices あり）か、数字キー（choices なし）
//  ・まちがえたら「おしい！」で もう1回（tries=2）。それでも とけなければ、こたえと とき方を見せる
//  ・ひらめきの み（ヒント）は1問に1回。使うと onUseHint() が呼ばれる（へらせたら true を返す）
//  ・timerSec があると、うきの時間（つり）。時間切れは「にげちゃった」
//  ・終わったら onFinish({ correct, firstTry, hints, gaveUp?, timeout? })
//  ※ 問題が かわるときは、親が key={problem.key} で作りなおす
// ============================================================
import { useEffect, useRef, useState } from "react";
import M from "./M.jsx";
import Art, { Expression } from "./Art.jsx";
import { playCue, duckMusic } from "./sound.js";
import Keypad from "./Keypad.jsx";
import { checkAnswer, answerText, keysFor } from "../content/index.js";
import { speak, canSpeak, toSpeech } from "./speech.js";

/** とき方（steps） */
export function Steps({ problem }) {
  if (!problem?.steps?.length) return null;
  return (
    <ol className="steps">
      {problem.steps.map((t, i) => (
        <li key={i}>
          <M>{t}</M>
        </li>
      ))}
    </ol>
  );
}

/** 数学ラボ ソロの答え合わせの ことばを、小学生むけに */
function kidNote(note) {
  if (/約分/.test(note || "")) return "あたいは あってるよ。やくぶん しよう！";
  return "すうじで こたえてね。";
}

export default function ProblemCard({
  problem,
  tries = 2,
  timerSec = 0,
  hintCount = 0,
  onUseHint,
  onFinish,
  speech = true,
  header = null,
  retryText = "おしい！ もういちど かんがえて みよう。",
  revealLabel = "わかった",
}) {
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [wrongChoices, setWrongChoices] = useState([]);
  const [hintShown, setHintShown] = useState(false);
  const [msg, setMsg] = useState(null); // { kind: "wrong" | "note", text }
  const [phase, setPhase] = useState("ask"); // ask | reveal | timeout
  const [left, setLeft] = useState(timerSec);
  const finished = useRef(false);
  const inputRef = useRef("");
  inputRef.current = input;
  const keys = keysFor(problem);

  // 開発中だけ：ブラウザでの通し確認（Playwright）が いまの問題を読めるように
  useEffect(() => {
    if (import.meta.env.DEV) window.__moriProblem = problem;
  }, [problem]);

  // つりの時間
  useEffect(() => {
    if (!timerSec || phase !== "ask") return undefined;
    const start = Date.now();
    const id = setInterval(() => {
      const remain = Math.max(0, timerSec - (Date.now() - start) / 1000);
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(id);
        setPhase("timeout");
      }
    }, 100);
    return () => clearInterval(id);
  }, [timerSec, phase]);

  const finish = (res) => {
    if (finished.current) return;
    finished.current = true;
    onFinish({ hints: hintShown ? 1 : 0, ...res });
  };

  const submit = (val) => {
    if (phase !== "ask" || finished.current) return;
    if (val === "" || val == null) return;
    const res = checkAnswer(problem, val);
    if (res.correct) {
      playCue("correct");
      finish({ correct: true, firstTry: attempt === 1 });
      return;
    }
    playCue("retry");
    if (res.note && !problem.choices) {
      setMsg({ kind: "note", text: kidNote(res.note) }); // 約分・入れ方のまちがいは、回数を へらさない
      return;
    }
    if (problem.choices) setWrongChoices((w) => [...w, String(val)]);
    if (attempt < tries) {
      setAttempt(attempt + 1);
      setInput("");
      setMsg({ kind: "wrong", text: retryText });
    } else {
      setMsg(null);
      setPhase("reveal");
    }
  };

  // パソコン・Chromebook のキーボードでも入れられるように
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    if (problem.choices || phase !== "ask") return undefined;
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const v = inputRef.current;
      if (/^[0-9]$/.test(e.key) && v.length < 9) setInput(v + e.key);
      else if (e.key === "." && keys.dot && !/[./]/.test(v)) setInput(v + ".");
      else if (e.key === "/" && keys.slash && v && !/[./]/.test(v))
        setInput(v + "/");
      else if (e.key === "Backspace") setInput(v.slice(0, -1));
      else if (e.key === "Enter") submitRef.current(v);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [problem, phase, keys.dot, keys.slash]);

  const askHint = () => {
    if (hintShown || !problem.hint) return;
    if (onUseHint && onUseHint()) setHintShown(true);
  };

  return (
    <div className={`problem ${msg ? "is-thinking" : ""} phase-${phase}`}>
      <Expression.Provider
        value={msg || phase === "reveal" ? "worried" : "normal"}
      >
        <div className="problem-header">{header}</div>
      </Expression.Provider>
      <div className="bubble">
        <div className="q-label">もんだい</div>
        <div className="q">
          <M>{problem.q}</M>
        </div>
        <div className="q-tools">
          {speech && canSpeak() && (
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => {
                duckMusic();
                speak(problem.q);
              }}
            >
              <Art name="speaker" size="sm" /> よむ
            </button>
          )}
          {onUseHint && problem.hint && phase === "ask" && (
            <button
              type="button"
              className="btn btn-small btn-hint"
              disabled={hintShown || hintCount <= 0}
              onClick={askHint}
            >
              <Art name="hirameki" size="sm" /> ひらめき（{hintCount}）
            </button>
          )}
        </div>
        {hintShown && (
          <div className="hint">
            <Art name="hirameki" size="sm" /> <M>{problem.hint}</M>
          </div>
        )}
        {timerSec > 0 && phase === "ask" && (
          <div
            className={`timer ${left <= 5 ? "is-low" : ""}`}
            role="progressbar"
            aria-label="のこりじかん"
            aria-valuemin={0}
            aria-valuemax={timerSec}
            aria-valuenow={Math.ceil(left)}
          >
            <div
              className="timer-bar"
              style={{ width: `${(left / timerSec) * 100}%` }}
            />
            <span className="timer-number">あと {Math.ceil(left)} びょう</span>
          </div>
        )}
      </div>

      {msg && phase === "ask" && (
        <div role="status" className={`msg msg-${msg.kind}`}>
          {msg.text}
        </div>
      )}

      {phase === "ask" &&
        (problem.choices ? (
          <div className="choices">
            {problem.choices.map((c, i) => (
              <button
                key={i}
                type="button"
                className="choice"
                aria-label={toSpeech(c)}
                disabled={wrongChoices.includes(String(c))}
                onClick={() => submit(c)}
              >
                <M>{String(c)}</M>
              </button>
            ))}
          </div>
        ) : (
          <Keypad
            value={input}
            onChange={setInput}
            onSubmit={() => submit(input)}
            dot={keys.dot}
            slash={keys.slash}
            unit={problem.unit}
          />
        ))}

      {(phase === "reveal" || phase === "timeout") && (
        <div className="reveal">
          <div className="reveal-title">
            {phase === "timeout"
              ? "あっ、にげちゃった…"
              : "こたえと とき方を みて みよう"}
          </div>
          <div className="reveal-answer">
            こたえ：<M>{answerText(problem)}</M>
          </div>
          <Steps problem={problem} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              finish(
                phase === "timeout"
                  ? { correct: false, firstTry: false, timeout: true }
                  : { correct: false, firstTry: false, gaveUp: true },
              )
            }
          >
            {revealLabel}
          </button>
        </div>
      )}
    </div>
  );
}
