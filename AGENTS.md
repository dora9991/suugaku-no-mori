# AGENTS.md — このリポジトリで作業する AI（Codex・Claude など）へ

すうがくの森：算数をとくと森のくらしが育つ、小学生向けのゲーム（Vite + React）。
全体の説明は [README.md](README.md)、設計は [docs/設計.md](docs/設計.md)。

## デザインの作業

- [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) に従う。いちばんの目的は「ゲームらしさ」（子どもが やりたくなる見た目と手ざわり）。変えるのは見た目と演出（絵・アニメーション・音）。
- 絵は `src/ui/Art.jsx` の name で呼んでいる。name は変えずに中身（絵）を差しかえる。
- 終わったら `docs/DESIGN_CHANGELOG.md` に変更の要約を書く。

## 守ること

- `src/shared/` は **編集しない**（数学ラボ ソロからの自動同期。`npm run sync` で上書きされる）。
- `src/engine/`（ルール・ごほうびの数字・セーブ）、`src/content/`（出題）、`src/data/` の id と数値、セーブのキー（`suugaku-no-mori:v1`）は、デザインの作業では変えない。変えたいときは人に相談する。
- 既存のゲームのキャラクター・名前・ロゴ・UI をまねしない（オリジナルで）。
- 画面の文言は ひらがな中心（小学1年生も読む）。
- このリポジトリの外（ほかのリポジトリ・フォルダ）は触らない。

## コマンド

```bash
npm install
npm run dev      # http://localhost:5185/ （?demo で全部そろった状態、?demo=E1 で1年生）
npm test         # かならず通す
npm run build    # かならず通す
```
