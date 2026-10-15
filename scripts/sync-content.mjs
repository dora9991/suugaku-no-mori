// ============================================================
// sync-content.mjs — 数学ラボ ソロ（math-dialogue/src/solo）の「小学校の問題テンプレート」を、
//   すうがくの森の src/shared/ に同期する。
//
//  ・単一の真実は math-dialogue/src/solo（共有元）。src/shared/ は直接編集しない。
//    問題を直したいときは共有元を直して、ここで npm run sync する。
//  ・実行：npm run sync                         → 隣のフォルダ ../math-dialogue/src/solo から
//          npm run sync -- --from <soloフォルダ> → 場所を指定して
//  ・コピーした .js の先頭に「自動同期」の印をつける。
//  ・閉包チェック：コピーした各 .js のローカル import が、同期リストに全部入っているか検査。
//    足りなければ止まるので FILES に足す（＝共有範囲を広げる手順）。
//  ・同期元のブランチ・コミットを src/shared/SOURCE.json に残す。
// ============================================================
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve, normalize, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DEST = join(ROOT, "src/shared");

const fromIdx = process.argv.indexOf("--from");
const SRC = fromIdx > 0 ? resolve(process.argv[fromIdx + 1]) : resolve(ROOT, "../math-dialogue/src/solo");

// 同期するファイル：[共有元（src/solo からの相対）, 同期先（src/shared からの相対）]
//   e1〜e6.js は "../kit.js" を import するので、kit.js を1つ上に置く（並びを共有元と同じにする）。
const FILES = [
  ["content/kit.js", "kit.js"],
  ["content/elem/e1.js", "elem/e1.js"],
  ["content/elem/e2.js", "elem/e2.js"],
  ["content/elem/e3.js", "elem/e3.js"],
  ["content/elem/e4.js", "elem/e4.js"],
  ["content/elem/e5.js", "elem/e5.js"],
  ["content/elem/e6.js", "elem/e6.js"],
  ["engine/answer.js", "answer.js"],
];

if (!existsSync(SRC)) {
  console.error(
    `共有元が見つかりません: ${SRC}\n` +
      "（suugaku-no-mori と math-dialogue を同じ親フォルダに置くか、--from で src/solo の場所を指定してください。\n" +
      "  数学ラボ ソロは、いまは math-dialogue のブランチ claude/keen-tesla-em1r7j にあります）"
  );
  process.exit(1);
}

// ── 閉包チェック：ローカル import の行き先が FILES に入っているか ──────────
const srcSet = new Set(FILES.map(([s]) => s));
const missing = [];
for (const [s] of FILES) {
  const text = readFileSync(join(SRC, s), "utf8");
  for (const m of text.matchAll(/^\s*import[^"']*["'](\.{1,2}\/[^"']+)["']/gm)) {
    const target = normalize(posix.join(posix.dirname(s), m[1])).split("\\").join("/");
    if (!srcSet.has(target)) missing.push(`${s} → ${target}`);
  }
}
if (missing.length) {
  console.error("同期リストに無いファイルを import しています。FILES に足してください：\n  " + missing.join("\n  "));
  process.exit(1);
}

// ── 同期元のバージョン（git が使えるときだけ） ──────────────────────
function git(args) {
  try {
    return execFileSync("git", ["-C", SRC, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}
const commit = git(["log", "-1", "--format=%h"]);
const commitDate = git(["log", "-1", "--format=%cs"]);
const subject = git(["log", "-1", "--format=%s"]);
let branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
if (!branch || branch === "HEAD") branch = git(["name-rev", "--name-only", "--exclude=tags/*", "HEAD"]);
if (branch) branch = branch.replace(/^remotes\/origin\//, "").replace(/[~^]\d+$/, "");

// ── コピー（同期先は毎回作り直す。消えたファイルが残らないように） ────────
rmSync(DEST, { recursive: true, force: true });
for (const [s, d] of FILES) {
  const body = readFileSync(join(SRC, s), "utf8");
  const banner = `// ⚠️ AUTO-SYNCED from math-dialogue/src/solo/${s} — 直接編集しないこと（npm run sync で再生成）\n`;
  const out = join(DEST, d);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, banner + body);
}

writeFileSync(
  join(DEST, "SOURCE.json"),
  JSON.stringify(
    {
      from: "math-dialogue/src/solo（数学ラボ ソロ）",
      branch: branch || "unknown",
      commit: commit || "unknown",
      commitDate: commitDate || "unknown",
      subject: subject || "",
      syncedAt: new Date().toISOString().slice(0, 10),
      files: FILES.map(([s, d]) => ({ from: s, to: d })),
    },
    null,
    2
  ) + "\n"
);

writeFileSync(
  join(DEST, "README.md"),
  `# src/shared — 自動同期フォルダ（直接編集しない）

数学ラボ ソロ（math-dialogue/src/solo）の、小学校の問題テンプレートと答え合わせを、そのままコピーしたもの。

- 問題を直す・足すときは、共有元（math-dialogue/src/solo/content/elem/）を直してから \`npm run sync\`。
- どのコミットから同期したかは \`SOURCE.json\`。
- すうがくの森の側で、出題のしかた（住人・分野・レベル）を決めているのは \`src/content/index.js\`。
`
);

console.log(`同期しました：${FILES.length} ファイル → src/shared/`);
console.log(`  共有元: ${SRC}`);
console.log(`  ブランチ: ${branch || "?"}  コミット: ${commit || "?"} (${commitDate || "?"}) ${subject || ""}`);
