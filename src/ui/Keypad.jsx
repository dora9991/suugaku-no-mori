// ============================================================
// Keypad.jsx — こたえを入れる数字キー（小数点・分数は学年に応じて出す）
//   分数は「3/4」の形で入る。入れている間は たての分数で見せる。
// ============================================================

const MAX = 9;

/** 入力中の文字を見せる（"3/4" は たての分数に） */
export function AnswerValue({ value }) {
  if (!value) return <span className="answer-placeholder">？</span>;
  const i = value.indexOf("/");
  if (i < 0) return <span className="answer-val">{value}</span>;
  return (
    <span className="answer-val answer-frac" aria-label={`${value.slice(i + 1) || "□"}ぶんの${value.slice(0, i) || "□"}`}>
      <span className="frac-num">{value.slice(0, i) || " "}</span>
      <span className="frac-bar" />
      <span className="frac-den">{value.slice(i + 1) || " "}</span>
    </span>
  );
}

export default function Keypad({ value, onChange, onSubmit, dot = false, slash = false, unit }) {
  const add = (k) => {
    if (value.length >= MAX) return;
    if (k === "." && (value.includes(".") || value.includes("/"))) return;
    if (k === "/" && (value.includes("/") || value.includes(".") || !value)) return;
    onChange(value + k);
  };
  return (
    <div className="keypad">
      <div className="answer-box" aria-live="polite">
        <AnswerValue value={value} />
        {unit && <span className="answer-unit">{unit}</span>}
      </div>
      <div className="keys">
        {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((k) => (
          <button key={k} type="button" className="key" onClick={() => add(k)}>
            {k}
          </button>
        ))}
        {dot ? (
          <button type="button" className="key key-sub" onClick={() => add(".")} aria-label="てん">
            .
          </button>
        ) : (
          <span className="key key-blank" aria-hidden="true" />
        )}
        <button type="button" className="key" onClick={() => add("0")}>
          0
        </button>
        <button type="button" className="key key-sub" onClick={() => onChange(value.slice(0, -1))} aria-label="1もじ けす">
          ⌫
        </button>
      </div>
      {slash && (
        <button type="button" className="key key-frac" onClick={() => add("/")}>
          ぶんすうに する（うえ ／ した）
        </button>
      )}
      <button type="button" className="btn btn-primary btn-answer" disabled={!value} onClick={onSubmit}>
        こたえる
      </button>
    </div>
  );
}
