// もちもの：素材・つかうもの・かぐ・どうぐ・なかま
import Art from "../ui/Art.jsx";
import { Hearts, ToolBar, Count } from "../ui/parts.jsx";
import { MATERIALS, CONSUMABLES, TOOLS, RECIPES } from "../data/items.js";
import { VILLAGERS } from "../data/villagers.js";
import { AREA_LABEL } from "../content/index.js";
import { isHere } from "../engine/pick.js";
import { giveFish } from "../engine/game.js";

export default function Bag({ s, act, go }) {
  const furniture = RECIPES.map((rc) => ({
    rc,
    have: s.furn?.[rc.id] || 0,
    placed: s.camp.filter((c) => c.id === rc.id).length,
  })).filter((x) => x.have + x.placed > 0);
  return (
    <main className="screen bag">
      <div className="page-heading">
        <Art name="bag" size="lg" title="" />
        <div>
          <span className="eyebrow">ぼうけんの おみやげ</span>
          <h1>きみの もちもの</h1>
        </div>
      </div>
      <div className="bag-collection">
        <section className="card">
          <h2 className="h2">そざい</h2>
          <div className="counts">
            {MATERIALS.map((m) => (
              <Count
                key={m.id}
                art={m.art}
                n={s.inv?.[m.id] || 0}
                label={m.name}
              />
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="h2">つかうもの</h2>
          {CONSUMABLES.map((c) => (
            <div key={c.id} className="row">
              <Count art={c.art} n={s.inv?.[c.id] || 0} label={c.name} />
              <span className="row-text">
                <b>{c.name}</b> … {c.desc}
              </span>
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="h2">どうぐ</h2>
          {TOOLS.map((t) => (
            <div key={t.id} className="row">
              <Art name={t.art} size="md" />
              <span className="row-text">
                <b>{t.name}</b>（{AREA_LABEL[t.area]}）
              </span>
              <ToolBar count={s.tools?.[t.area] || 0} />
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="h2">なかま</h2>
          {VILLAGERS.map((v) => (
            <div key={v.id} className="row">
              <Art name={isHere(s, v) ? v.art : "away"} size="md" />
              <span className="row-text">
                <b>{v.name}</b>（{v.animal}）
                {isHere(s, v) ? "" : " … おでかけ中"}
                <br />
                <small>{v.trait}</small>
              </span>
              <span className="row-side">
                <Hearts points={s.friend?.[v.id] || 0} />
                {isHere(s, v) && (s.inv?.sakana || 0) > 0 && (
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => act((st) => giveFish(st, v.id))}
                  >
                    <Art name="sakana" size="xs" /> あげる
                  </button>
                )}
              </span>
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="h2">かぐ</h2>
          {furniture.length ? (
            <div className="counts">
              {furniture.map(({ rc, have, placed }) => (
                <span key={rc.id} className="count">
                  <Art name={rc.art} size="sm" /> {rc.name} ×{have + placed}
                </span>
              ))}
            </div>
          ) : (
            <p className="note">まだ ないよ。「つくる」で つくろう。</p>
          )}
        </section>
      </div>
      <button type="button" className="btn" onClick={() => go("forest")}>
        もりに もどる
      </button>
    </main>
  );
}
