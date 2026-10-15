// キャンプ：つくった家具を ますに おいて かざる。なかよしに なった なかまが あそびに くる
import { useState } from "react";
import Art from "../ui/Art.jsx";
import { playCue } from "../ui/sound.js";
import { FURNITURE_NAME, CAMP_W, CAMP_H } from "../data/items.js";
import { VILLAGERS } from "../data/villagers.js";
import { place, unplace, cellAt, visitors } from "../engine/game.js";

export default function Camp({ s, act, go }) {
  const [pick, setPick] = useState(null); // おこうとしている家具
  const owned = Object.entries(s.furn || {}).filter(([, k]) => k > 0);
  const guests = visitors(s, VILLAGERS);
  // A development-only view override for checking the night artwork in daylight.
  const night =
    new Date().getHours() >= 18 ||
    (import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get("look") === "night");

  const tapCell = (x, y) => {
    const c = cellAt(s, x, y);
    if (c || pick) playCue("place");
    if (c) {
      act((st) => unplace(st, x, y));
      return;
    }
    if (pick) {
      act((st) => place(st, pick, x, y));
      if ((s.furn?.[pick] || 0) <= 1) setPick(null);
    }
  };

  return (
    <main className={`screen camp ${night ? "is-night" : ""}`}>
      <h2 className="h2">
        <Art name={night ? "moon" : "sun"} size="sm" />{" "}
        {s.name ? `${s.name}の キャンプ` : "キャンプ"}
      </h2>

      <p className="lead">おいて、かざって。すこしずつ、きみの ばしょに。</p>
      <div className="camp-layout">
        <div className="camp-lawn">
          <div className="camp-guests" aria-label="あそびに きている なかま">
            {guests.length ? (
              guests.map(({ villager, fav }) => (
                <span key={villager.id} className="guest">
                  <Art name={villager.art} size="lg" />
                  <span className="guest-name">
                    {villager.name}
                    {fav && (
                      <Art name="heart" size="xs" title="すきな かぐが ある" />
                    )}
                  </span>
                </span>
              ))
            ) : (
              <p className="note">
                なかまと なかよしに なると、あそびに きてくれるよ。
              </p>
            )}
          </div>

          <div
            className="camp-grid"
            style={{ gridTemplateColumns: `repeat(${CAMP_W}, 1fr)` }}
          >
            {Array.from({ length: CAMP_H }).flatMap((_, y) =>
              Array.from({ length: CAMP_W }).map((__, x) => {
                const c = cellAt(s, x, y);
                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    className={`cell ${c ? "is-filled" : ""} ${pick && !c ? "is-target" : ""}`}
                    aria-label={
                      c
                        ? `${FURNITURE_NAME[c.id]}（タップで しまう）`
                        : pick
                          ? "ここに おく"
                          : "あき"
                    }
                    onClick={() => tapCell(x, y)}
                  >
                    {c && <Art name={c.id} size="lg" title="" />}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <div className="camp-shelf">
          <h3 className="h2">もっている かぐ</h3>
          <p className="note">かぐを えらんで、ますを タップ。</p>
          <div className="tray" aria-label="もっている かぐ">
            {owned.length ? (
              owned.map(([id, k]) => (
                <button
                  key={id}
                  type="button"
                  className={`tray-item ${pick === id ? "is-on" : ""}`}
                  aria-pressed={pick === id}
                  onClick={() => setPick(pick === id ? null : id)}
                >
                  <Art name={id} size="lg" />
                  <span>
                    {FURNITURE_NAME[id]} ×{k}
                  </span>
                </button>
              ))
            ) : (
              <p className="note">
                {s.camp.length
                  ? "おいた かぐを タップすると しまえるよ。"
                  : "まだ かぐが ないよ。「つくる」で つくろう。"}
              </p>
            )}
          </div>
        </div>
      </div>
      {pick && <p className="note">おきたい ますを タップしてね。</p>}

      <button type="button" className="btn" onClick={() => go("forest")}>
        もりに もどる
      </button>
    </main>
  );
}
