import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite の設定。
// 公開（build）のときの base は GitHub Pages のリポジトリ名と完全一致させる（公開URL github.io/suugaku-no-mori/）。
// ※ ここがズレると公開時に真っ白になる。リポジトリ名を変えたらここも直すこと。
// 開発（npm run dev）は http://localhost:5185/ で開く。
// 公開と同じ形の確認（npm run build → npm run preview）は http://localhost:5185/suugaku-no-mori/ で開く。
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/suugaku-no-mori/" : "/",
  plugins: [react()],
  server: { port: 5185 },
  preview: { port: 5185 },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // 問題テンプレ（小1〜小6）・数式表示・React を別のファイルに分けて、更新時のダウンロードを小さくする
        manualChunks(id) {
          if (id.includes("/src/shared/")) return "problems";
          if (id.includes("node_modules/katex")) return "katex";
          if (id.includes("node_modules/react")) return "react";
          return undefined;
        },
      },
    },
  },
}));
