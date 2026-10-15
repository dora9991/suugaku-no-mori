import test from "node:test";
import assert from "node:assert/strict";

// No real sound / timers / browser storage are used. These tests cover the
// lifecycle that can otherwise leak a music loop or play while muted/hidden.
async function setup({
  stored = null,
  blocked = false,
  unsupported = false,
} = {}) {
  const counts = { contexts: 0, resumes: 0, suspends: 0, oscillators: [] };
  const tasks = new Map(),
    handlers = new Map(),
    values = new Map();
  if (stored) values.set("suugaku-no-mori:sound:v1", stored);
  const original = Object.fromEntries(
    [
      "localStorage",
      "AudioContext",
      "document",
      "setTimeout",
      "clearTimeout",
    ].map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
  );
  let serial = 0;
  const param = () => ({
    value: 0,
    setValueAtTime(v) {
      this.value = v;
    },
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  class Audio {
    constructor() {
      counts.contexts++;
      this.currentTime = 0;
      this.state = "running";
      this.destination = {};
    }
    createGain() {
      return { gain: param(), connect() {}, disconnect() {} };
    }
    createOscillator() {
      const o = {
        frequency: param(),
        connect() {},
        disconnect() {},
        start() {},
        stops: 0,
        stop() {
          this.stops++;
        },
      };
      counts.oscillators.push(o);
      return o;
    }
    resume() {
      counts.resumes++;
      this.state = "running";
      return Promise.resolve();
    }
    suspend() {
      counts.suspends++;
      this.state = "suspended";
      return Promise.resolve();
    }
  }
  const doc = {
    hidden: false,
    addEventListener(k, fn) {
      handlers.set(k, fn);
    },
    removeEventListener(k) {
      handlers.delete(k);
    },
  };
  Object.defineProperties(globalThis, {
    localStorage: {
      configurable: true,
      value: {
        getItem(k) {
          if (blocked) throw Error("disabled");
          return values.get(k) ?? null;
        },
        setItem(k, v) {
          if (blocked) throw Error("disabled");
          values.set(k, v);
        },
      },
    },
    AudioContext: {
      configurable: true,
      value: unsupported ? undefined : Audio,
    },
    document: { configurable: true, value: doc },
    setTimeout: {
      configurable: true,
      value: (fn) => {
        const id = ++serial;
        tasks.set(id, fn);
        return id;
      },
    },
    clearTimeout: { configurable: true, value: (id) => tasks.delete(id) },
  });
  const module = await import(`../src/ui/sound.js?test=${Math.random()}`);
  return {
    module,
    counts,
    tasks,
    values,
    handlers,
    doc,
    cleanup() {
      module.setSoundEnabled(false);
      for (const [k, d] of Object.entries(original)) {
        if (d) Object.defineProperty(globalThis, k, d);
        else delete globalThis[k];
      }
    },
  };
}

test("音はゲームのセーブに触れず、ミュート・画面切替・非表示を守る", async (t) => {
  await t.test(
    "初回は無音で、効果音を呼んでも AudioContext を作らない",
    async () => {
      const h = await setup();
      try {
        h.module.playCue("correct");
        assert.equal(h.counts.contexts, 0);
        assert.equal(h.tasks.size, 0);
        assert.equal(h.module.soundEnabled(), false);
      } finally {
        h.cleanup();
      }
    },
  );
  await t.test(
    "ON/OFF は別キーに保存し、OFF で音楽の予約も止める",
    async () => {
      const h = await setup();
      try {
        let notifications = 0;
        const unsub = h.module.subscribeSound(() => notifications++);
        h.module.setSoundEnabled(true);
        assert.equal(h.counts.contexts, 1);
        assert.equal(h.tasks.size, 1);
        const music = [...h.counts.oscillators];
        h.module.playCue("correct");
        assert.equal(h.counts.oscillators.length, music.length + 3);
        h.module.setSoundEnabled(false);
        assert.equal(h.tasks.size, 0);
        assert.ok(music.every((o) => o.stops >= 2));
        assert.deepEqual([...h.values.keys()], ["suugaku-no-mori:sound:v1"]);
        assert.equal(h.values.values().next().value, "off");
        assert.equal(notifications, 2);
        unsub();
        const n = h.counts.oscillators.length;
        h.module.playCue("crafted");
        assert.equal(h.counts.oscillators.length, n);
      } finally {
        h.cleanup();
      }
    },
  );
  await t.test("ON を覚えていても、最初の操作までは音を出さない", async () => {
    const h = await setup({ stored: "on" });
    try {
      assert.equal(h.module.soundEnabled(), true);
      assert.equal(h.counts.contexts, 0);
      const stop = h.module.listenToGestures();
      h.handlers.get("pointerdown")({ target: { closest: () => null } });
      assert.equal(h.counts.contexts, 1);
      assert.equal(h.tasks.size, 1);
      stop();
      assert.equal(h.tasks.size, 0);
      assert.equal(h.handlers.size, 0);
    } finally {
      h.cleanup();
    }
  });
  await t.test(
    "問題中は BGM を止め、キャンプへの切替でループを増やさない",
    async () => {
      const h = await setup();
      try {
        h.module.setSoundEnabled(true);
        const music = [...h.counts.oscillators];
        h.module.setSoundScene("quiet");
        assert.equal(h.tasks.size, 0);
        assert.ok(music.every((o) => o.stops >= 2));
        const n = h.counts.oscillators.length;
        h.module.playCue("retry");
        assert.equal(h.counts.oscillators.length, n + 2);
        h.module.setSoundScene("camp");
        assert.equal(h.tasks.size, 1);
        h.module.setSoundScene("forest");
        assert.equal(h.tasks.size, 1);
      } finally {
        h.cleanup();
      }
    },
  );
  await t.test(
    "タブが非表示になったら止め、再表示で同じコンテキストを使う",
    async () => {
      const h = await setup();
      try {
        const stop = h.module.listenToGestures();
        h.module.setSoundEnabled(true);
        h.doc.hidden = true;
        h.handlers.get("visibilitychange")();
        assert.equal(h.tasks.size, 0);
        assert.equal(h.counts.suspends, 1);
        const n = h.counts.oscillators.length;
        h.module.playCue("bite");
        assert.equal(h.counts.oscillators.length, n);
        h.doc.hidden = false;
        h.handlers.get("visibilitychange")();
        assert.equal(h.tasks.size, 1);
        assert.equal(h.counts.contexts, 1);
        assert.equal(h.counts.resumes, 1);
        stop();
      } finally {
        h.cleanup();
      }
    },
  );
  await t.test("保存が拒否される環境でも、その場の ON/OFF は動く", async () => {
    const h = await setup({ blocked: true });
    try {
      assert.doesNotThrow(() => h.module.setSoundEnabled(true));
      assert.equal(h.module.soundEnabled(), true);
      assert.doesNotThrow(() => h.module.setSoundEnabled(false));
    } finally {
      h.cleanup();
    }
  });
  await t.test("WebAudio がない環境でもゲームを妨げない", async () => {
    const h = await setup({ unsupported: true });
    try {
      assert.doesNotThrow(() => h.module.setSoundEnabled(true));
      assert.doesNotThrow(() => h.module.playCue("level"));
      assert.equal(h.tasks.size, 0);
    } finally {
      h.cleanup();
    }
  });
});
