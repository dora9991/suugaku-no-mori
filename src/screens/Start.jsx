// はじめに：なまえ（なくても よい）と学年をえらぶ
import { useState } from "react";
import Art from "../ui/Art.jsx";
import { GRADES, GRADE_LABEL } from "../content/index.js";
import { SoundButton } from "../ui/parts.jsx";
import { Soundscape } from "../ui/feel.jsx";
import { VILLAGERS } from "../data/villagers.js";

export default function Start({ onStart }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(null);
  return (
    <main className="screen start">
      <Soundscape scene="start" />
      <div className="start-sound">
        <SoundButton />
      </div>
      <div className="start-hero">
        <span className="start-eyebrow">
          <Art name="forest" size="sm" title="" /> きみの「わかった」で そだつ
          もり
        </span>
        <h1 className="title">
          <span>すうがくの</span>もり
        </h1>
        <p className="lead">といて、つくって、なかよく なって。</p>
        <div className="start-villagers">
          {VILLAGERS.map((v) => (
            <Art key={v.id} name={v.art} size="lg" />
          ))}
        </div>
        <div className="start-invite">きみが くるのを まっていたよ！</div>
      </div>

      <div className="start-passport">
        <h2 className="h2">
          <Art name="map" size="md" title="" /> もりへの きっぷ
        </h2>
        <section>
          <label className="field">
            <span className="field-label">なまえ（なくても いいよ）</span>
            <input
              className="input"
              value={name}
              maxLength={12}
              placeholder="ニックネーム"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </section>

        <section>
          <div className="field-label">なんねんせい？</div>
          <div className="grade-grid">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                className={`btn btn-grade ${grade === g ? "is-on" : ""}`}
                aria-pressed={grade === g}
                onClick={() => setGrade(g)}
              >
                {GRADE_LABEL[g]}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="btn btn-primary btn-big"
          disabled={!grade}
          onClick={() => onStart(name.trim(), grade)}
        >
          もりへ いく <span aria-hidden="true">→</span>
        </button>
        <p className="note">きろくは この たんまつの なかだけに のこります。</p>
      </div>
    </main>
  );
}
