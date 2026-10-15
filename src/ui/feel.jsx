// Presentation only: does not read or write the game save or consume game RNG.
import { useEffect, useRef, useState } from "react";
import Art from "./Art.jsx";
import { playCue, setSoundScene, listenToGestures } from "./sound.js";

export function presentEvents(events) {
  window.dispatchEvent(new CustomEvent("mori:celebrate", { detail: events }));
}

export function Dialogue({ text }) {
  const [shown, setShown] = useState(0);
  const skipped = useRef(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return;
    }
    setShown(0);
    skipped.current = false;
    const start = performance.now();
    const timer = setInterval(() => {
      const n = Math.min(
        text.length,
        skipped.current
          ? text.length
          : Math.ceil((performance.now() - start) / 18),
      );
      setShown(n);
      if (n >= text.length) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [text]);
  return (
    <span
      className="dialogue"
      onPointerDown={() => {
        skipped.current = true;
        setShown(text.length);
      }}
    >
      <span className="sr-only">{text}</span>
      <span className="dialogue-reserve" aria-hidden="true">
        {text}
      </span>
      <span className="dialogue-ink" aria-hidden="true">
        {text.slice(0, shown)}
      </span>
    </span>
  );
}

export function CountUp({ value }) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (
      from === value ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(value);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 380);
      setShown(Math.round(from + (value - from) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span className="count-up" aria-hidden="true">
      {shown}
    </span>
  );
}

export function Soundscape({ scene }) {
  useEffect(() => listenToGestures(), []);
  useEffect(() => {
    setSoundScene(
      scene === "camp"
        ? "camp"
        : scene === "forest" || scene === "start"
          ? "forest"
          : "quiet",
    );
  }, [scene]);
  return null;
}

export function Celebration() {
  const [effect, setEffect] = useState(null);
  const serial = useRef(0);
  useEffect(() => {
    let timeout;
    const onEvent = ({ detail: events }) => {
      const big =
        events.find((e) => e.type === "furniture") ||
        events.find((e) => e.type === "treasureClear") ||
        events.find((e) => e.type === "toolUp") ||
        events.find((e) => e.type === "friendUp") ||
        events.find((e) => e.type === "goal");
      const reward = events.find((e) => e.type === "reward");
      if (!big && !reward) return;
      const target = document
        .querySelector("[data-bag-target]")
        ?.getBoundingClientRect();
      setEffect({
        id: ++serial.current,
        big,
        items: Object.keys(reward?.items || {}).slice(0, 4),
        x: target ? target.x + target.width / 2 : innerWidth - 40,
        y: target ? target.y + target.height / 2 : 40,
      });
      if (big) playCue(big.type === "furniture" ? "crafted" : "level");
      clearTimeout(timeout);
      timeout = setTimeout(() => setEffect(null), 1150);
    };
    window.addEventListener("mori:celebrate", onEvent);
    return () => {
      window.removeEventListener("mori:celebrate", onEvent);
      clearTimeout(timeout);
    };
  }, []);
  if (!effect) return null;
  const text = {
    furniture: "できた！",
    treasureClear: "たからばこが ひらいた！",
    toolUp: "どうぐが そだった！",
    friendUp: "もっと なかよし！",
    goal: "もくひょう たっせい！",
  }[effect.big?.type];
  return (
    <div key={effect.id} className="celebration" aria-hidden="true">
      <div className="confetti">
        {Array.from({ length: effect.big ? 24 : 12 }, (_, i) => (
          <i
            key={i}
            style={{
              "--x": `${((i * 137) % 100) - 50}vw`,
              "--y": `${-15 - ((i * 19) % 75)}vh`,
              "--r": `${i * 71}deg`,
              "--delay": `${(i % 4) * 30}ms`,
              "--color": ["#ebc56d", "#d88971", "#85ae88", "#f5e6b6"][i % 4],
            }}
          />
        ))}
      </div>
      {text && (
        <div className="celebration-title">
          <Art name="star" size="md" title="" />
          {text}
          <Art name="sparkle" size="md" />
        </div>
      )}
      {effect.items.map((id, i) => (
        <div
          key={id}
          className="flying-item"
          style={{
            "--dx": `${effect.x - innerWidth / 2}px`,
            "--dy": `${effect.y - innerHeight * 0.6}px`,
            "--delay": `${i * 100}ms`,
          }}
        >
          <Art name={id} size="lg" title="" />
        </div>
      ))}
    </div>
  );
}
