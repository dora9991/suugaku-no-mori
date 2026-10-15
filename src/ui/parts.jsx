// ============================================================
// parts.jsx — 小さな共通部品（ハート・どうぐのバー・上のバー・おしらせ・ポップアップ）
// ============================================================
import { useEffect } from "react";
import Art from "./Art.jsx";
import { friendLevel, toolProgress } from "../data/items.js";

/** なかよしハート（0〜5） */
export function Hearts({ points = 0 }) {
  const lv = friendLevel(points);
  return (
    <span className="hearts" aria-label={`なかよし ${lv}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Art key={i} name={i < lv ? "heart" : "heartEmpty"} size="xs" title="" />
      ))}
    </span>
  );
}

/** どうぐのレベルと、次のレベルまでのバー */
export function ToolBar({ count = 0 }) {
  const { lv, have, next } = toolProgress(count);
  const prev = [0, 5, 15, 30, 50][lv - 1] || 0;
  const pct = next == null ? 100 : Math.round(((have - prev) / (next - prev)) * 100);
  return (
    <span className="toolbar">
      <span className="toolbar-lv">レベル{lv}</span>
      <span className="bar">
        <span className="bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="toolbar-next">{next == null ? "さいこう！" : `あと ${next - have}`}</span>
    </span>
  );
}

/** 上のバー：もどる・なまえ・ひらめきの み・きょうの もくひょう・せってい */
export function TopBar({ s, title, onBack, onSettings }) {
  const goal = s.settings?.dailyGoal || 10;
  const solved = s.today?.solved || 0;
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="btn btn-icon" onClick={onBack} aria-label="もどる">
          <Art name="back" size="sm" title="" />
        </button>
      ) : (
        <span className="topbar-name">{s.name || "きみ"}</span>
      )}
      <span className="topbar-title">{title}</span>
      <span className="topbar-stat" aria-label={`ひらめきの み ${s.inv?.hirameki || 0}こ`}>
        <Art name="hirameki" size="sm" title="" />
        {s.inv?.hirameki || 0}
      </span>
      <span className="topbar-stat" aria-label={`きょう ${solved}もん（もくひょう ${goal}もん）`}>
        <Art name="star" size="sm" title="" />
        {solved}/{goal}
      </span>
      {onSettings && (
        <button type="button" className="btn btn-icon" onClick={onSettings} aria-label="せってい">
          <Art name="settings" size="sm" title="" />
        </button>
      )}
    </header>
  );
}

/** おしらせ（もらった物など）。1つずつ、しばらくすると きえる（タップでも きえる） */
export function Toasts({ toasts, onDone }) {
  useEffect(() => {
    if (!toasts.length) return undefined;
    const now = Date.now();
    const ids = toasts.map((t) => setTimeout(() => onDone(t.id), Math.max(0, t.until - now)));
    return () => ids.forEach(clearTimeout);
  }, [toasts, onDone]);
  if (!toasts.length) return null;
  return (
    <div className="toasts" aria-live="polite">
      {toasts.slice(0, 3).map((t) => (
        <button type="button" key={t.id} className={`toast ${t.big ? "toast-big" : ""}`} onClick={() => onDone(t.id)}>
          {t.art && <Art name={t.art} size={t.big ? "md" : "sm"} title="" />}
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}

/** ポップアップ */
export function Modal({ children, onClose }) {
  return (
    <div className="modal-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/**
 * 素材などの「アイコン＋かず」。
 *   need があるとき（せっけいず）は「×2 ✓」「×3 あと1」の形（「7/2」だと分数に見えるので使わない）
 */
export function Count({ art, n, need, label }) {
  if (need == null) {
    return (
      <span className="count" aria-label={`${label || ""} ${n}こ`}>
        <Art name={art} size="sm" title="" />
        <span>×{n}</span>
      </span>
    );
  }
  const short = n < need;
  return (
    <span className={`count ${short ? "count-short" : "count-ok"}`} aria-label={`${label || ""} ${need}こ いる（もっている ${n}こ）`}>
      <Art name={art} size="sm" title="" />
      <span>×{need}</span>
      <span className="count-state">{short ? `あと${need - n}` : "✓"}</span>
    </span>
  );
}
