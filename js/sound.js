// Sound effects made with the Web Audio API (no audio files needed)
// + optional voice that reads the monkey's jokes (Speech Synthesis).
const Sound = (function () {
  const SPEAK = true;           // set false to stop the monkey from reading jokes aloud
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem("rm-muted") === "1"; } catch {}

  // Browsers only allow audio after a click/key press, so we create the context lazily.
  function ac() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch { return null; }
  }
  function unlock() { if (!muted) ac(); }
  ["pointerdown", "keydown"].forEach((ev) => window.addEventListener(ev, unlock, { once: true }));

  // one pitch-sweeping squeak
  function squeak(t0, from, to, dur, type, vol) {
    const c = ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(from, t0);
    o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    f.type = "lowpass"; f.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f); f.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  // "ooh ooh aah aah!"
  function monkey() {
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    squeak(t,        380, 760, 0.16, "triangle", 0.28);
    squeak(t + 0.20, 400, 800, 0.16, "triangle", 0.28);
    squeak(t + 0.45, 700, 1250, 0.12, "sawtooth", 0.14);
    squeak(t + 0.60, 650, 1300, 0.12, "sawtooth", 0.14);
    squeak(t + 0.75, 900, 500, 0.22, "triangle", 0.22);
  }

  // short pop when something appears
  function pop() {
    const c = ac(); if (!c) return;
    squeak(c.currentTime, 300, 900, 0.09, "sine", 0.3);
  }

  // low thud when something lands
  function thud() {
    const c = ac(); if (!c) return;
    squeak(c.currentTime, 150, 45, 0.14, "sine", 0.35);
  }

  // cha-ching for add to cart
  function cart() {
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    squeak(t,        1318, 1318, 0.09, "square", 0.08);
    squeak(t + 0.09, 1760, 1760, 0.30, "square", 0.08);
  }

  // looping white-noise source (used by rain + whoosh)
  let noiseBuf = null;
  function noiseSrc(c) {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    return s;
  }

  // steady rain hiss, fades in; rainStop() fades it out
  let rainNodes = null;
  function rainStart() {
    const c = ac(); if (!c || rainNodes) return;
    const s = noiseSrc(c), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain();
    hp.type = "highpass"; hp.frequency.value = 900;
    lp.type = "lowpass";  lp.frequency.value = 7000;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.1, c.currentTime + 0.8);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(c.destination);
    s.start();
    rainNodes = { s, g };
  }
  function rainStop() {
    if (!rainNodes || !ctx) return;
    const { s, g } = rainNodes; rainNodes = null;
    try {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      s.stop(t + 0.65);
    } catch {}
  }

  // quick swish (shoe kick)
  function whoosh() {
    const c = ac(); if (!c) return;
    const t = c.currentTime, s = noiseSrc(c), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2500, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    s.connect(bp); bp.connect(g); g.connect(c.destination);
    s.start(t); s.stop(t + 0.35);
  }

  // spooky wobble (haunted pen)
  function eerie() {
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    squeak(t,        220, 196, 1.3, "sine", 0.15);
    squeak(t + 0.03, 233, 207, 1.3, "sine", 0.12);
  }

  // crackling fire: low rumble + random pops; fireStop() fades it out
  let fireNodes = null, fireTimer = 0;
  function crackle() {
    if (!ctx || muted || Math.random() < 0.45) return;
    const t = ctx.currentTime, s = noiseSrc(ctx), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = "highpass"; hp.frequency.value = 1500 + Math.random() * 3000;
    g.gain.setValueAtTime(0.05 + Math.random() * 0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.05);
    s.connect(hp); hp.connect(g); g.connect(ctx.destination);
    s.start(t, Math.random() * 1.8); s.stop(t + 0.12);
  }
  function fireStart() {
    const c = ac(); if (!c || fireNodes) return;
    const s = noiseSrc(c), lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass"; lp.frequency.value = 500;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, c.currentTime + 1);
    s.connect(lp); lp.connect(g); g.connect(c.destination);
    s.start();
    fireNodes = { s, g };
    fireTimer = setInterval(crackle, 90);
  }
  function fireStop() {
    clearInterval(fireTimer); fireTimer = 0;
    if (!fireNodes || !ctx) return;
    const { s, g } = fireNodes; fireNodes = null;
    try {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      s.stop(t + 0.85);
    } catch {}
  }

  // read the joke aloud
  function say(text) {
    if (muted || !SPEAK || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\uFE0F]/gu, ""));
      const voices = speechSynthesis.getVoices();
      const v = voices.find((x) => x.lang === "hi-IN") || voices.find((x) => x.lang.startsWith("hi")) || voices.find((x) => x.lang.startsWith("en-IN"));
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "hi-IN"; }
      u.pitch = 1.8;   // squeaky monkey voice
      u.rate = 1.1;
      setTimeout(() => speechSynthesis.speak(u), 900); // after the "ooh ooh"
    } catch {}
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem("rm-muted", m ? "1" : "0"); } catch {}
    if (m && "speechSynthesis" in window) speechSynthesis.cancel();
    if (m) { rainStop(); fireStop(); }
    if (!m) ac();
  }

  return { monkey, pop, thud, cart, whoosh, eerie, rainStart, rainStop, fireStart, fireStop, say, setMuted, isMuted: () => muted };
})();
