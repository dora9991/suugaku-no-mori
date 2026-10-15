# src/shared — 自動同期フォルダ（直接編集しない）

数学ラボ ソロ（math-dialogue/src/solo）の、小学校の問題テンプレートと答え合わせを、そのままコピーしたもの。

- 問題を直す・足すときは、共有元（math-dialogue/src/solo/content/elem/）を直してから `npm run sync`。
- どのコミットから同期したかは `SOURCE.json`。
- かずの森の側で、出題のしかた（住人・分野・レベル）を決めているのは `src/content/index.js`。
