// ============================================================
// M.jsx — 数式つきの文の表示
//   "$...$" の中は KaTeX（分数など）、外はふつうの文字で表示する。
//   例 <M>{"$\\frac{3}{4}$ と $\\frac{1}{4}$ を たすと？"}</M>
// ============================================================
import katex from "katex";
import "katex/dist/katex.min.css";

const cache = new Map();
function texHtml(src) {
  if (cache.has(src)) return cache.get(src);
  let html;
  try {
    html = katex.renderToString(src, { throwOnError: false, strict: "ignore" });
  } catch {
    html = src;
  }
  if (cache.size > 1000) cache.clear();
  cache.set(src, html);
  return html;
}

export default function M({ children, className }) {
  const s = children == null ? "" : String(children);
  const parts = s.split("$");
  return (
    <span className={className}>
      {parts.map((p, i) =>
        i % 2 === 1 ? <span key={i} className="tex" dangerouslySetInnerHTML={{ __html: texHtml(p) }} /> : p ? <span key={i}>{p}</span> : null
      )}
    </span>
  );
}
