// はじめに：なまえ（なくても よい）と学年をえらぶ
import { useState } from "react";
import Art from "../ui/Art.jsx";
import { GRADES, GRADE_LABEL } from "../content/index.js";
import { VILLAGERS } from "../data/villagers.js";

export default function Start({ onStart }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(null);
  return (
    <main className="screen start">
      <div className="start-hero">
        <div className="start-villagers">
          {VILLAGERS.map((v) => (
            <Art key={v.id} name={v.art} size="lg" />
          ))}
        </div>
        <h1 className="title">かずの もり</h1>
        <p className="lead">もんだいを といて、もりの なかまの おねがいを きこう。</p>
      </div>

      <section className="card">
        <label className="field">
          <span className="field-label">なまえ（なくても いいよ）</span>
          <input className="input" value={name} maxLength={12} placeholder="ニックネーム" onChange={(e) => setName(e.target.value)} />
        </label>
      </section>

      <section className="card">
        <div className="field-label">なんねんせい？</div>
        <div className="grade-grid">
          {GRADES.map((g) => (
            <button key={g} type="button" className={`btn btn-grade ${grade === g ? "is-on" : ""}`} aria-pressed={grade === g} onClick={() => setGrade(g)}>
              {GRADE_LABEL[g]}
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="btn btn-primary btn-big" disabled={!grade} onClick={() => onStart(name.trim(), grade)}>
        もりへ いく
      </button>
      <p className="note">きろくは この たんまつの なかだけに のこります。</p>
    </main>
  );
}
