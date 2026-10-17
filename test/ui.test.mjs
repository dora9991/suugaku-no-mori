import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild"; // Already installed through the existing Vite dependency.

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const built = await build({
  stdin: {
    contents: `export {default as Forest} from './src/screens/Forest.jsx'; export {default as Keypad} from './src/ui/Keypad.jsx'; export {default as ProblemCard} from './src/ui/ProblemCard.jsx'; export {default as Art} from './src/ui/Art.jsx'; export {makeDemo} from './src/engine/demo.js';`,
    resolveDir: root,
    loader: "jsx",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  jsx: "automatic",
  write: false,
  loader: { ".css": "empty" },
  // SSR checks markup and accessible names; CSS is verified in the browser.
  plugins: [
    {
      name: "browser-styles-in-node-test",
      setup(bundler) {
        bundler.onResolve({ filter: /\.css$/ }, (args) => ({
          path: args.path,
          namespace: "ui-test-css",
        }));
        bundler.onLoad({ filter: /.*/, namespace: "ui-test-css" }, () => ({
          contents: "",
          loader: "js",
        }));
      },
    },
  ],
  define: {
    "import.meta.env.BASE_URL": JSON.stringify("/"),
    "import.meta.env.DEV": "false",
  },
  logLevel: "silent",
});
const bundle = { exports: {} };
new Function("require", "module", "exports", built.outputFiles[0].text)(
  require,
  bundle,
  bundle.exports,
);
const { Forest, Keypad, ProblemCard, Art, makeDemo } = bundle.exports;
const render = (Component, props) =>
  renderToStaticMarkup(React.createElement(Component, props));
const buttons = (html) =>
  [...html.matchAll(/<button\b([^>]*)>/g)].map((m) => m[1]);
const byId = (html, id) =>
  buttons(html).find((attrs) => attrs.includes(`data-testid="${id}"`));

test("主なゲーム操作のテスト用セレクターと読み上げ名を維持する", async (t) => {
  await t.test(
    "住人4人と森の5か所を同じIDで選べる（1年生のおでかけ状態も維持）",
    () => {
      const html = render(Forest, { s: makeDemo("E1"), go: () => {} });
      for (const id of ["mugi", "chikuta", "ruru", "memo"]) {
        assert.ok(byId(html, `villager-${id}`));
        assert.match(byId(html, `villager-${id}`), /class="villager /);
      }
      assert.match(byId(html, "villager-memo"), /disabled/);
      for (const id of ["fish", "craft", "camp", "treasure", "bag"]) {
        assert.match(byId(html, `place-${id}`), /class="place /);
      }
    },
  );
  await t.test(
    "数字キー・消す・小数・分数・回答ボタンのIDと既存クラスを維持する",
    () => {
      const html = render(Keypad, {
        value: "0",
        onChange: () => {},
        onSubmit: () => {},
        dot: true,
        slash: true,
      });
      for (let n = 0; n < 10; n++)
        assert.match(byId(html, `key-${n}`), /class="key"/);
      for (const id of ["key-delete", "key-decimal", "key-fraction"])
        assert.ok(byId(html, id));
      assert.match(byId(html, "answer-submit"), /btn-answer/);
      assert.doesNotMatch(byId(html, "answer-submit"), /disabled/);
    },
  );
  await t.test(
    "選択肢の0を空の名前にせず、分数は読める名前と大きな数式で表示する",
    () => {
      const problem = {
        key: "ui-choice",
        grade: "E3",
        unitId: "E3-bunsu",
        q: "どれかな？",
        ans: 0,
        choices: [0, 1, "$\\frac{2}{3}$", 3],
      };
      const html = render(ProblemCard, {
        problem,
        onFinish: () => {},
        speech: false,
      });
      for (let n = 0; n < 4; n++)
        assert.match(byId(html, `choice-${n}`), /class="choice"/);
      assert.match(byId(html, "choice-0"), /aria-label="0"/);
      assert.match(byId(html, "choice-2"), /aria-label="3ぶんの2"/);
      assert.match(html, /mfrac/);
      const happy = render(Art, { name: "mugi", variant: "happy" });
      assert.match(happy, /art-mood-happy/);
      assert.match(happy, /art\/mugi-happy.svg/);
    },
  );
});
