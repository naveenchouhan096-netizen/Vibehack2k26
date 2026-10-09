(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  const COOKIE_TYPES = ["Cookies (Crunchy)","Cookies (Soft-baked)","Tracking your snacks","Remember your sins","Third-party crumbs","Analytics of feelings","Ads for things you own","Biscuits (British)","Emotional cookies","Cookie of the Month Club"];
  const GARY_JOKES = ["Have you tried turning your wallet off and on?","I'm just a chatbot. I don't know things.","Great question! Anyway, buy a Square Wheel.","Error 418: I'm a teapot.","Per my calculations: maybe."];
  const GARY_REAL = "Real answer: everything here is satire. Press the 'Help me, I'm lost' button for Sanity Mode.";
  const FOOTER = ["About Regret","Careers (unpaid)","Returns (no)","Track Order (lol)","Shipping to Nowhere","Gift Cards for Nothing","Privacy? Ha","Terms & Confusions","Investor Apologies","Press (any button)","Sitemap (lost)","Contact Gary","Accessibility","Help Centre (closed)","Affiliate Regrets","Blog of Sorrows","Bulk Disappointment","Store Locator (none)"];

  // ---------- State ----------
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cart = {};
  try { cart = JSON.parse(store.get("rm-cart") || "{}"); } catch {}
  let sanity = store.get("rm-sanity") === "1" || new URLSearchParams(location.search).get("sanity") === "1";
  let query = "";
  let sort = "best";
  let seconds = 0;
  const dodgeTries = {}; // per-element dodge counts (Rule of Three)

  const chaos = () => !sanity && !reduced;

  // ---------- Static content ----------
  $("#marquee-a").textContent = $("#marquee-b").textContent = "BUY BUY BUY (but why) ★ ".repeat(8);
  $("#footer-links").innerHTML = FOOTER.map((l) => `<a href="#">${l}</a>`).join("");
  $("#cookie-list").innerHTML = COOKIE_TYPES.map((c) => `<label>${c}<input type="checkbox" /></label>`).join("");

  // ---------- Dodge: runs away from cursor up to 3 times ----------
  function attachDodge(el, key) {
    el.addEventListener("mouseenter", () => {
      if (!chaos()) return;
      dodgeTries[key] = dodgeTries[key] || 0;
      if (dodgeTries[key] >= 3) { el.style.transform = "none"; return; }
      dodgeTries[key]++;
      el.style.transition = "transform .2s";
      el.style.transform = `translate(${(Math.random() - 0.5) * 140}px, ${(Math.random() - 0.5) * 60}px)`;
    });
  }

  // ---------- Cart / dashboard ----------
  function cartStats() {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    const total = Object.entries(cart).reduce((s, [id, q]) => s + ((PRODUCTS.find((p) => p.id === id) || {}).price || 0) * q, 0);
    return { count, total };
  }

  function updateDashboard() {
    const { count, total } = cartStats();
    const meter = Math.min(100, count * 12);
    $("#cart-roman").textContent = toRoman(count);
    $("#cart-link").setAttribute("aria-label", `Cart: ${count} items`);
    $("#cart-tip").textContent = `Actually ${count} · ${inr(total)}`;
    $("#meter-fill").style.width = meter + "%";
    $("#meter-text").textContent = meter;
    $("#stat-count").textContent = count;
    $("#stat-total").textContent = inr(total);
    $("#stat-points").textContent = Math.max(0, 100 - count * 7);
  }

  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    store.set("rm-cart", JSON.stringify(cart));
    const badge = document.querySelector(`[data-qty="${id}"]`);
    if (badge) { badge.textContent = "×" + cart[id]; badge.hidden = false; }
    updateDashboard();
    if (!sanity) Sound.cart();
    if (typeof monkeySay === "function" && Math.random() < 0.5) monkeySay(pick(MONKEY_CART_JOKES), 3500);
  }

  // ---------- Products ----------
  function visibleProducts() {
    let l = PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    // INTENTIONALLY TERRIBLE: "Best" = lowest rated first; search ranks by name length
    if (sort === "best") l = [...l].sort((a, b) => a.rating - b.rating);
    if (sort === "price") l = [...l].sort((a, b) => a.price - b.price);
    if (query) l = [...l].sort((a, b) => b.name.length - a.name.length);
    return l;
  }

  function renderGrid() {
    const grid = $("#grid");
    const list = visibleProducts();
    $("#empty").hidden = list.length !== 0;
    grid.innerHTML = "";
    const tilts = ["rot1", "rotm1", "rot0", "rot2"];
    list.forEach((p, i) => {
      const stars = Math.round(p.rating);
      const card = document.createElement("article");
      card.className = `brut card-lift product bg-card ${tilts[i % 4]}`;
      card.innerHTML = `
        <div class="product-img ${p.bg}">
          <span aria-hidden="true">${p.emoji}</span>
          <span class="sticker abs claim bg-card">${p.claim}</span>
        </div>
        <div class="product-body">
          <h3>${p.name}</h3>
          <p class="small">${"★".repeat(stars)}${"☆".repeat(5 - stars)} ${p.rating}</p>
          <p class="price price-lg" title="Real price: ${inr(p.price)}"><span class="${chaos() ? "wobble" : ""}">${inr(p.price)}</span></p>
          <div class="product-foot">
            <button class="btn-brut bg-rad sm" aria-label="Add ${p.name} to cart">Add to Cart</button>
            <span class="sticker bg-yel" data-qty="${p.id}" ${cart[p.id] ? "" : "hidden"}>×${cart[p.id] || 0}</span>
          </div>
        </div>`;
      const btn = card.querySelector("button");
      btn.addEventListener("click", () => addToCart(p.id));
      attachDodge(btn, p.id);
      grid.appendChild(card);
    });
    refreshReveal();
    refreshGravity();
    refreshRain();
    refreshFire();
  }

  $("#search").addEventListener("input", (e) => { query = e.target.value; renderGrid(); });
  $("#sort").addEventListener("change", (e) => { sort = e.target.value; renderGrid(); });

  // ---------- Sanity mode ----------
  function applySanity() {
    document.documentElement.classList.toggle("sanity", sanity);
    $("#sanity-bar").hidden = !sanity;
    $("#gary").hidden = sanity;
    if (sanity && gravityOn) setGravity(false);
    if (sanity && rainOn) setRain(false, true);
    if (sanity && fireOn) setFire(false, true, true);
    if (sanity) { monkey.hidden = true; monkey.className = "monkey"; monkeyBusy = false; }
    renderGrid(); // re-render so price wobble class matches mode
  }

  function toggleSanity() {
    sanity = !sanity;
    store.set("rm-sanity", sanity ? "1" : "0");
    if (sanity) { $("#splash").hidden = true; $("#cookies").hidden = true; }
    applySanity();
  }
  document.querySelectorAll("[data-toggle-sanity]").forEach((b) => b.addEventListener("click", toggleSanity));

  // Konami code toggles sanity too
  let k = 0;
  window.addEventListener("keydown", (e) => {
    k = e.key === KONAMI[k] ? k + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (k === KONAMI.length) { k = 0; toggleSanity(); }
  });

  // ---------- Splash (10s max) ----------
  let splashTimer;
  function closeSplash() {
    $("#splash").hidden = true;
    clearTimeout(splashTimer);
    if (!sanity && !store.get("rm-cookies")) $("#cookies").hidden = false;
    setTimeout(() => { lastJoke = 0; monkeySay(MONKEY_JOKES[0]); }, 600);
  }
  $("#splash-x").addEventListener("click", closeSplash);
  $("#splash-claim").addEventListener("click", closeSplash);
  $("#splash-decline").addEventListener("click", closeSplash);
  attachDodge($("#splash-x"), "splash-x");

  // ---------- Cookies ----------
  document.querySelectorAll("[data-cookie-done]").forEach((b) =>
    b.addEventListener("click", () => { store.set("rm-cookies", "1"); $("#cookies").hidden = true; })
  );

  // ---------- Gary ----------
  const msgsEl = $("#gary-msgs");
  let garyCount = 0;
  function addMsg(text, me) {
    const p = document.createElement("p");
    p.className = "brut-sm msg " + (me ? "me bg-cya" : "bg-yel");
    p.textContent = text;
    msgsEl.appendChild(p);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  addMsg("Hi, I'm Gary. I'm unhelpful. Ask away!", false);
  $("#gary-toggle").addEventListener("click", () => { const p = $("#gary-panel"); p.hidden = !p.hidden; });
  $("#gary-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#gary-input");
    if (!input.value.trim()) return;
    garyCount++;
    // INTENTIONALLY TERRIBLE: real answer only 1 in 4 times
    const reply = garyCount % 4 === 0 ? GARY_REAL : GARY_JOKES[Math.floor(Math.random() * GARY_JOKES.length)];
    addMsg(input.value, true);
    addMsg(reply, false);
    input.value = "";
  });

  // ---------- Bandar the monkey ----------
  const MONKEY_JOKES = [
    "Oye! Shopping karne aaye ho? 🐒",
    "Ye product tumhe sach mein chahiye? 😂",
    "Cart mein daalo, phir sochna!",
    "Delivery? Mera bandar bhi nahi jaanta! 📦",
    "Welcome to the world's worst store!",
    "Checkout button dhoondh ke dikhao! 🙈",
  ];
  const MONKEY_CART_JOKES = [
    "Cart mein daal diya? Ab pachtao! 😂",
    "Wah! Ek aur bekaar cheez! 👏",
    "Mere paas bhi ek Square Wheel hai. Chalta nahi. 🛞",
  ];
  const MONKEY_ACTIONS = ["wave", "dance", "jump"];
  const monkey = $("#monkey");
  let monkeyBusy = false, monkeyHide, monkeyLoop, lastJoke = -1;

  function pick(list) {
    let i; do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === lastJoke);
    lastJoke = i; return list[i];
  }

  function monkeySay(text, ms) {
    if (sanity || !text) return;
    ms = ms || 5000;
    clearTimeout(monkeyHide);
    monkey.hidden = false;
    monkey.className = "monkey"; void monkey.offsetWidth;        // restart animation
    $("#monkey-bubble").textContent = text;
    monkey.classList.add("show", "talk", MONKEY_ACTIONS[Math.floor(Math.random() * MONKEY_ACTIONS.length)]);
    monkeyBusy = true;
    Sound.pop(); Sound.monkey(); Sound.say(text);
    monkeyHide = setTimeout(() => {
      monkey.classList.remove("show", "talk", ...MONKEY_ACTIONS);
      monkeyBusy = false;
    }, ms);
  }

  function startMonkeyLoop() {
    clearInterval(monkeyLoop);
    monkeyLoop = setInterval(() => { if (!monkeyBusy && !sanity && $("#splash").hidden) monkeySay(pick(MONKEY_JOKES)); }, 14000);
  }

  $("#monkey-img").addEventListener("click", () => monkeySay(pick(MONKEY_JOKES)));

  // ---------- Mute button ----------
  const muteBtn = $("#mute");
  const paintMute = () => { muteBtn.textContent = Sound.isMuted() ? "🔇" : "🔊"; };
  muteBtn.addEventListener("click", () => { Sound.setMuted(!Sound.isMuted()); paintMute(); if (rainOn) Sound.rainStart(); if (fireOn) Sound.fireStart(); });
  paintMute();

  // ---------- Reveal Mode: X-ray for dark patterns ----------
  const PATTERNS = {
    urgency:  { icon: "⏰", name: "Fake urgency",       real: "Countdowns that restart on refresh, or a sale that is always 'ending today'." },
    scarcity: { icon: "📉", name: "Fake scarcity",      real: "'Only 1 left!' with no real stock number behind it, to rush you into buying." },
    runaway:  { icon: "🏃", name: "Bhaagta button",     real: "Buttons that are tiny, faint or hard to hit, like the close button on a pop-up ad." },
    shame:    { icon: "😢", name: "Confirmshaming",     real: "The 'no' option is worded to make you feel bad: 'No thanks, I hate saving money'." },
    cookie:   { icon: "🍪", name: "Cookie overload",    real: "Dozens of toggles, and refusing takes far more clicks than 'Accept all'." },
    popup:    { icon: "🎁", name: "Fake prize pop-up",  real: "'You won!' windows that block the page and exist only to grab your details." },
    social:   { icon: "👥", name: "Fake social proof",  real: "Invented reviews, visitor counts and 'someone just bought this' messages." },
    trust:    { icon: "🛡️", name: "Fake trust badge",   real: "'Verified' and 'Secure' stickers that no one has actually checked." },
    rigged:   { icon: "🎲", name: "Rigged sorting",     real: "'Best' or 'Recommended' ordering that favours what the seller wants to push." },
    hidden:   { icon: "🙈", name: "Hidden costs",       real: "The real total is hard to see until late, so you commit before you notice." },
    trap:     { icon: "🪤", name: "Roach motel",        real: "Easy to get in, hard to get out: subscriptions that renew forever, returns and help buried." },
    support:  { icon: "🤖", name: "Fake support",       real: "Chatbots built to deflect you, with no way to reach a human." },
    noise:    { icon: "📢", name: "Visual noise",       real: "Constant flashing and shouting to hijack your attention while you decide." },
  };

  const TARGETS = [
    { key: "noise",    sel: ".marquee-wrap",                  label: "Visual noise" },
    { key: "urgency",  sel: ".sale",                          label: "Fake urgency: sale ends yesterday" },
    { key: "trust",    sel: ".hero-art .s1, .hero-art .s2",   label: "Fake trust badge" },
    { key: "popup",    sel: "#splash .splash-box",            label: "Fake prize pop-up" },
    { key: "runaway",  sel: "#splash-x",                      label: "Bhaagta button: the close ×" },
    { key: "shame",    sel: "#splash-decline",                label: "Confirmshaming" },
    { key: "cookie",   sel: "#cookies",                       label: "Cookie overload" },
    { key: "hidden",   sel: "#cart-link",                     label: "Hidden count: Roman numerals" },
    { key: "hidden",   sel: "#cart-modal .cart-total",        label: "Hidden costs: the price grows at checkout" },
    { key: "rigged",   sel: "#search, #sort",                 label: "Rigged search and sort" },
    { key: "social",   sel: ".stat.bg-ora",                   label: "Fake live visitors" },
    { key: "scarcity", sel: ".product .claim",                label: "Fake scarcity: Only 1 left!", test: (t) => /only \d|\bremaining\b/i.test(t) },
    { key: "trap",     sel: ".product .claim",                label: "Subscription trap", test: (t) => /renews/i.test(t) },
    { key: "runaway",  sel: ".product .btn-brut",             label: "Bhaagta button" },
    { key: "social",   sel: ".reviews .review",               label: "Fake reviews" },
    { key: "trap",     sel: "#footer-links",                  label: "Roach motel: returns 'no', help 'closed'" },
    { key: "support",  sel: "#gary-toggle",                   label: "Fake support" },
  ];

  const layer = document.createElement("div");
  layer.className = "dp-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.hidden = true;
  document.body.appendChild(layer);

  const COVER_PTS = [[.5, .5], [.15, .5], [.85, .5], [.5, .2], [.5, .8]];
  let revealOn = false, marks = [], revealRaf = 0, revealTick = 0;

  // field guide cards (static, built once)
  $("#guide-grid").innerHTML = Object.values(PATTERNS).map((p) =>
    `<article class="brut-sm bg-card guide-card"><p class="guide-name"><span aria-hidden="true">${p.icon}</span> ${p.name}</p><p>${p.real}</p></article>`
  ).join("");

  function buildMarks() {
    layer.textContent = "";
    marks = [];
    revealTick = 0;
    TARGETS.forEach((t) => document.querySelectorAll(t.sel).forEach((el) => {
      if (t.test && !t.test(el.textContent)) return;
      const box = document.createElement("div");
      const tag = document.createElement("span");
      const ico = document.createElement("b");
      const txt = document.createElement("span");
      box.className = "dp-box";
      tag.className = "dp-tag";
      ico.textContent = PATTERNS[t.key].icon;
      txt.textContent = t.label;
      tag.append(ico, txt);
      box.appendChild(tag);
      layer.appendChild(box);
      marks.push({ el, box, tag, key: t.key, label: t.label });
    }));
    $("#reveal-count").textContent = new Set(marks.map((m) => m.key)).size;
  }

  // Follow each target every frame, so labels stay glued to moving, dodging and scrolling elements.
  function revealFrame() {
    const vw = window.innerWidth, vh = window.innerHeight, seen = new Set();
    const checkCover = revealTick++ % 6 === 0;   // hit-test every few frames is plenty
    for (const m of marks) {
      const r = m.el.getBoundingClientRect();
      let vis = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
      if (vis && checkCover) {
        // hide labels for things covered by something else (e.g. behind the splash pop-up)
        // sample a few points: partly covered things still get a label
        const l = Math.max(r.left, 0), t = Math.max(r.top, 0), w = Math.min(r.right, vw) - l, h = Math.min(r.bottom, vh) - t;
        m.covered = !COVER_PTS.some(([fx, fy]) => {
          const hit = document.elementFromPoint(l + w * fx, t + h * fy);
          return hit && (m.el.contains(hit) || hit.contains(m.el));
        });
      }
      if (m.covered) vis = false;
      m.box.style.display = vis ? "" : "none";
      if (!vis) continue;
      const s = m.box.style;
      s.left = r.left + "px"; s.top = r.top + "px"; s.width = r.width + "px"; s.height = r.height + "px";
      m.tag.classList.toggle("short", seen.has(m.label));   // repeat labels shrink to just the icon
      m.tag.classList.toggle("inside", r.top < 26);
      m.tag.classList.toggle("flip", r.left > vw * 0.55);
      seen.add(m.label);
    }
    revealRaf = requestAnimationFrame(revealFrame);
  }

  function refreshReveal() { if (revealOn) buildMarks(); }

  function setReveal(on, quiet) {
    revealOn = on;
    cancelAnimationFrame(revealRaf);
    document.documentElement.classList.toggle("reveal", on);
    const btn = $("#reveal");
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "🔍 Hide" : "🔍 Reveal";
    $("#reveal-bar").hidden = !on;
    $("#guide").hidden = !on;
    layer.hidden = !on;
    if (on) {
      buildMarks();
      revealFrame();
      if (!quiet) monkeySay("Arre! Mera raaz khol diya tumne! 🙈", 4500);
    } else {
      layer.textContent = "";
      marks = [];
    }
  }

  $("#reveal").addEventListener("click", () => setReveal(!revealOn));
  document.querySelectorAll("[data-reveal-off]").forEach((b) => b.addEventListener("click", () => setReveal(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && revealOn) setReveal(false); });

  // ---------- Gravity: click the logo and everything falls ----------
  const GRAVITY_SEL = ".hero .sticker, .hero h1, .hero .lead, .hero-btns > *, .sale, .hero-art > *, .section-title, .stat, .product, .review, .shop-head label";
  const GRAVITY = 2600;                       // px/s²
  let gravityOn = false, gItems = [], gRaf = 0, gLast = 0, lastThud = 0;
  const rand = (a, b) => a + Math.random() * (b - a);

  function paintFall(it) {
    it.el.style.translate = it.x.toFixed(1) + "px " + it.y.toFixed(1) + "px";
    it.el.style.rotate = it.rot.toFixed(1) + "deg";
  }

  // Everything that is on screen (or above) falls to the bottom of the current view.
  function gravityCollect() {
    gItems = gItems.filter((it) => it.el.isConnected);
    const floor = window.scrollY + window.innerHeight - 6;
    const vw = document.documentElement.clientWidth;
    document.querySelectorAll(GRAVITY_SEL).forEach((el) => {
      if (gItems.some((it) => it.el === el)) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.top + window.scrollY >= floor) return;            // already below the floor
      const dist = Math.max(0, floor - (r.bottom + window.scrollY));
      const dx = Math.max(-r.left, Math.min(vw - r.right, rand(-70, 70)));
      const it = { el, y: 0, vy: 0, x: 0, dx, rot: 0, rotT: rand(-28, 28), dist, delay: reduced ? 0 : rand(0, 700), done: false };
      el.classList.add("fallen");
      if (reduced) { it.y = it.dist; it.x = dx; it.rot = it.rotT; it.done = true; paintFall(it); }
      gItems.push(it);
    });
    if (!gRaf && gItems.some((it) => !it.done)) { gLast = performance.now(); gRaf = requestAnimationFrame(gravityFrame); }
  }

  function gravityFrame(now) {
    const dt = Math.min(0.033, (now - gLast) / 1000 || 0.016);
    gLast = now;
    let active = 0;
    for (const it of gItems) {
      if (it.done) continue;
      it.delay -= dt * 1000;
      if (it.delay > 0) { active++; continue; }
      it.vy += GRAVITY * dt;
      it.y += it.vy * dt;
      if (it.y >= it.dist) {                                  // hit the floor: bounce, then settle
        it.y = it.dist;
        if (it.vy > 400 && now - lastThud > 80) { lastThud = now; if (!sanity) Sound.thud(); }
        it.vy = it.vy > 120 ? -it.vy * 0.32 : 0;
      }
      it.x += (it.dx - it.x) * Math.min(1, dt * 2.5);
      it.rot += (it.rotT - it.rot) * Math.min(1, dt * 3);
      paintFall(it);
      if (it.vy === 0 && it.y >= it.dist && Math.abs(it.rotT - it.rot) < 0.3 && Math.abs(it.dx - it.x) < 0.5) it.done = true;
      else active++;
    }
    gRaf = active ? requestAnimationFrame(gravityFrame) : 0;
  }

  function refreshGravity() { if (gravityOn) gravityCollect(); }

  function setGravity(on) {
    if (on === gravityOn || (on && sanity)) return;
    gravityOn = on;
    $("#logo").setAttribute("aria-pressed", String(on));
    $("#gravity-reset").hidden = !on;
    if (on) {
      gravityCollect();
      monkeySay("Gravity aa gayi! Ab sab neeche, jaise tumhara bank balance 📉", 5000);
    } else {
      cancelAnimationFrame(gRaf); gRaf = 0;
      const items = gItems; gItems = [];
      items.forEach((it) => {                                  // glide everything back home
        it.el.classList.remove("fallen");
        it.el.style.transition = "translate .6s ease, rotate .6s ease";
        it.el.style.translate = "0px 0px";
        it.el.style.rotate = "0deg";
      });
      setTimeout(() => items.forEach((it) => { it.el.style.translate = ""; it.el.style.rotate = ""; it.el.style.transition = ""; }), 700);
      monkeySay("Phew! Sab wapas upar ✨", 3500);
    }
  }

  $("#logo").addEventListener("click", (e) => { e.preventDefault(); setGravity(!gravityOn); });
  $("#gravity-reset").addEventListener("click", () => setGravity(false));

  // ---------- Hero items: each one does what its icon does ----------
  // 🫙 opens (nothing comes out) · ☂️ rain · 👟 kicks · ⬛ tries to roll · 🖊️ writes by itself
  const WET_SEL = ".hero-art .brut, .product";
  const rainCv = document.createElement("canvas");
  rainCv.className = "rain-canvas";
  rainCv.setAttribute("aria-hidden", "true");
  rainCv.hidden = true;
  document.body.appendChild(rainCv);
  const rctx = rainCv.getContext("2d");
  let rainOn = false, rainRaf = 0, rLast = 0, rainHide = 0, dryTimers = [];
  let drops = [], splashes = [];

  function sizeRain() {
    const dpr = window.devicePixelRatio || 1;
    rainCv.width = Math.round(window.innerWidth * dpr);
    rainCv.height = Math.round(window.innerHeight * dpr);
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => { if (rainOn) sizeRain(); });

  function newDrop(h, anywhere) {
    return { x: rand(-120, window.innerWidth + 40), y: anywhere ? rand(0, h) : rand(-80, 0), len: rand(12, 26), v: rand(900, 1400) };
  }

  function rainFrame(now) {
    const dt = Math.min(0.033, (now - rLast) / 1000 || 0.016);
    rLast = now;
    const w = window.innerWidth, h = window.innerHeight;
    rctx.clearRect(0, 0, w, h);
    rctx.fillStyle = "rgba(25,45,90,.10)";            // stormy tint
    rctx.fillRect(0, 0, w, h);
    rctx.lineWidth = 1.6; rctx.lineCap = "round"; rctx.strokeStyle = "rgba(70,130,230,.65)";
    rctx.beginPath();
    for (const d of drops) {
      d.y += d.v * dt; d.x += d.v * 0.2 * dt;           // slanted fall
      if (d.y > h) {
        if (splashes.length < 60 && Math.random() < 0.25) splashes.push({ x: d.x, age: 0 });
        Object.assign(d, newDrop(h, false));
      }
      rctx.moveTo(d.x, d.y);
      rctx.lineTo(d.x - d.len * 0.2, d.y - d.len);
    }
    rctx.stroke();
    rctx.strokeStyle = "rgba(70,130,230,.5)"; rctx.lineWidth = 1.2;
    splashes = splashes.filter((sp) => (sp.age += dt) < 0.25);
    for (const sp of splashes) {
      const r = 3 + sp.age * 60;
      rctx.globalAlpha = 1 - sp.age / 0.25;
      rctx.beginPath(); rctx.ellipse(sp.x, h - 2, r, r * 0.3, 0, 0, Math.PI * 2); rctx.stroke();
    }
    rctx.globalAlpha = 1;
    rainRaf = requestAnimationFrame(rainFrame);
  }

  // everything on the page that counts as an "item" gets wet
  function wetAll() {
    document.querySelectorAll(WET_SEL).forEach((el) => { el.classList.remove("drying"); el.classList.add("wet"); });
  }
  function dryAll(instant) {
    dryTimers.forEach(clearTimeout); dryTimers = [];
    const els = document.querySelectorAll(".wet");
    const finish = () => els.forEach((el) => el.classList.remove("wet", "drying"));
    if (instant || reduced) { finish(); return; }
    dryTimers.push(setTimeout(() => {
      els.forEach((el) => el.classList.add("drying"));
      dryTimers.push(setTimeout(finish, 1500));
    }, 3000));
  }
  function refreshRain() { if (rainOn) wetAll(); }   // cards re-rendered (search/sort) stay wet

  function setRain(on, instant) {
    if (on === rainOn || (on && sanity)) return;
    rainOn = on;
    clearTimeout(rainHide);
    $("#rain-reset").hidden = !on;
    $(".hero-art .f2").setAttribute("aria-pressed", String(on));
    if (on) {
      if (fireOn) setFire(false, true);                    // rain puts the fire out
      dryTimers.forEach(clearTimeout); dryTimers = [];
      wetAll();
      if (!reduced) {
        sizeRain();
        const h = window.innerHeight, n = Math.min(260, Math.floor(window.innerWidth / 5));
        drops = Array.from({ length: n }, () => newDrop(h, true));
        splashes = [];
        rainCv.hidden = false; void rainCv.offsetWidth; rainCv.classList.add("on");
        rLast = performance.now(); cancelAnimationFrame(rainRaf); rainRaf = requestAnimationFrame(rainFrame);
      }
      Sound.rainStart();
      monkeySay("Barish shuru! Sab kuch geela ho gaya ☔", 4500);
    } else {
      rainCv.classList.remove("on");
      rainHide = setTimeout(() => { cancelAnimationFrame(rainRaf); rainRaf = 0; rainCv.hidden = true; rctx.clearRect(0, 0, rainCv.width, rainCv.height); }, instant ? 0 : 900);
      Sound.rainStop();
      dryAll(instant);
      if (!instant) monkeySay("Barish ruk gayi. Sab sookh jayega... shayad 🌤️", 4000);
    }
  }

  // little helpers for the item animations
  function bubble(tile, text, ms, typed) {
    tile.querySelectorAll(".fx-bubble").forEach((b) => b.remove());
    const b = document.createElement("span");
    b.className = "sticker fx-bubble bg-card " + (tile.matches(".f4, .f5") ? "up" : "down");
    tile.appendChild(b);
    b.animate([{ opacity: 0, translate: "0 6px" }, { opacity: 1, translate: "0 0" }], { duration: 200, fill: "both" });
    let iv = 0;
    if (typed) { let i = 0; iv = setInterval(() => { b.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(iv); }, 55); }
    else b.textContent = text;
    setTimeout(() => {
      clearInterval(iv);
      b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).onfinish = () => b.remove();
    }, ms);
  }

  function burst(tile, chars, n, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "fx-part";
      p.textContent = chars[i % chars.length];
      tile.appendChild(p);
      const dx = (Math.random() - 0.5) * (o.spread || 120), dy = -(o.rise || 60) - Math.random() * 40;
      p.animate(
        [{ opacity: 0, translate: "0 0", scale: 0.5 }, { opacity: 1, offset: 0.2 }, { opacity: 0, translate: `${dx}px ${dy}px`, scale: 1.2 }],
        { duration: 1100 + Math.random() * 300, delay: i * 90, easing: "ease-out", fill: "both" }
      ).onfinish = () => p.remove();
    }
  }

  const PEN_LINES = ["I am not a pen.", "help. I'm trapped in here", "write me a sad poem", "he's behind you 👻", "I wrote this myself"];

  const ITEM_ACTIONS = {
    // 🫙 shake the lid off... and nothing comes out
    f1(tile, ico) {
      ico.animate([
        { transform: "rotate(0)" }, { transform: "rotate(-14deg) translateY(-6px)" }, { transform: "rotate(14deg)" },
        { transform: "rotate(-10deg)" }, { transform: "rotate(8deg)" }, { transform: "rotate(0)" },
      ], { duration: 700 });
      Sound.pop();
      setTimeout(() => {
        burst(tile, ["∅"], 4, { rise: 50, spread: 80 });
        bubble(tile, "Opened. Nothing came out. Exactly as advertised.", 2800);
      }, 600);
      return 1000;
    },
    // ☂️ opens up, then it rains on everything
    f2(tile, ico) {
      ico.animate([
        { transform: "scale(1) rotate(0)" }, { transform: "scale(1.3) rotate(-12deg)" }, { transform: "scale(1) rotate(0)" },
      ], { duration: 500 });
      setRain(!rainOn);
      return 0;
    },
    // 👟 winds up and kicks
    f3(tile, ico) {
      ico.animate([
        { transform: "rotate(0) translate(0,0)" },
        { transform: "rotate(28deg) translate(-14px,4px)", offset: 0.3 },
        { transform: "rotate(-50deg) translate(46px,-18px)", offset: 0.5 },
        { transform: "rotate(-20deg) translate(20px,-6px)", offset: 0.75 },
        { transform: "rotate(0) translate(0,0)" },
      ], { duration: 900, easing: "ease-in-out" });
      setTimeout(Sound.whoosh, 260);
      setTimeout(() => { burst(tile, ["💨"], 3, { rise: 20, spread: 140 }); Sound.thud(); }, 450);
      bubble(tile, "Left foot. Right shoe. Kicked anyway.", 2600);
      return 1000;
    },
    // ⬛ four bumpy "rolls" and it ends up exactly where it started
    f4(tile, ico) {
      const steps = 4, dur = 1600, kf = [{ transform: "rotate(0deg) translateY(0)", offset: 0, easing: "ease-out" }];
      for (let i = 1; i <= steps; i++) {
        kf.push({ transform: `rotate(${(i - 0.5) * 90}deg) translateY(-16px)`, offset: (i - 0.5) / steps, easing: "ease-in" });
        kf.push({ transform: `rotate(${i * 90}deg) translateY(0)`, offset: i / steps, easing: "ease-out" });
        setTimeout(Sound.thud, (i / steps) * dur);
      }
      ico.animate(kf, { duration: dur });
      bubble(tile, "Rolled 0 cm. Square wheel, square deal.", 2800);
      return dur + 100;
    },
    // 🖊️ scribbles on its own and says something spooky
    f5(tile, ico) {
      const kf = [{ transform: "rotate(0)" }];
      for (let i = 0; i < 10; i++) kf.push({ transform: `rotate(${-30 + (i % 2 ? 12 : -4)}deg) translate(${(i % 2 ? -1 : 1) * 12}px, ${(i % 3 - 1) * 6}px)` });
      kf.push({ transform: "rotate(0)" });
      ico.animate(kf, { duration: 2200 });
      Sound.eerie();
      bubble(tile, PEN_LINES[Math.floor(Math.random() * PEN_LINES.length)], 3200, true);
      return 2300;
    },
  };

  document.querySelectorAll(".hero-art .brut[role=\"button\"]").forEach((tile) => {
    const key = ["f1", "f2", "f3", "f4", "f5"].find((c) => tile.classList.contains(c));
    const act = ITEM_ACTIONS[key];
    if (!act) return;
    const run = () => {
      if (sanity || tile.dataset.busy) return;            // Sanity Mode: boring on purpose
      const ms = act(tile, tile.querySelector(".ico"));
      if (ms) { tile.dataset.busy = "1"; setTimeout(() => { delete tile.dataset.busy; }, ms); }
    };
    tile.addEventListener("click", run);
    tile.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
  });
  $("#rain-reset").addEventListener("click", () => setRain(false));

  // ---------- Fire: 🔥 in the header sets everything alight, fills the site with smoke, and drops it all ----------
  const FIRE_SEL = ".hero-art .brut, .product, .stat, .review";
  const smokeCv = document.createElement("canvas");
  smokeCv.className = "smoke-canvas";
  smokeCv.setAttribute("aria-hidden", "true");
  smokeCv.hidden = true;
  document.body.appendChild(smokeCv);
  const sctx = smokeCv.getContext("2d");
  let fireOn = false, smokeRaf = 0, sLast = 0, smokeLevel = 0, puffs = [], smokeSprite = null;

  function makeSprite() {                                   // one soft grey puff, reused for every particle
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d"), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(60,58,58,.9)");
    gr.addColorStop(0.5, "rgba(60,58,58,.4)");
    gr.addColorStop(1, "rgba(60,58,58,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    return c;
  }
  function sizeSmoke() { smokeCv.width = window.innerWidth; smokeCv.height = window.innerHeight; }
  window.addEventListener("resize", () => { if (!smokeCv.hidden) { sizeSmoke(); if (reduced) drawSmoke(0); } });

  function newPuff(atPeak) {
    const w = smokeCv.width, h = smokeCv.height, life = rand(3, 6);
    return {
      x: rand(-0.1, 1.1) * w, y: rand(0.15, 1.05) * h, r: rand(150, 380) * (0.5 + Math.min(1, w / 1200) * 0.5),
      vx: rand(-15, 15), vy: -rand(20, 60), life, age: atPeak ? life / 2 : 0,
    };
  }

  function drawSmoke(dt) {
    const w = smokeCv.width, h = smokeCv.height;
    sctx.clearRect(0, 0, w, h);
    sctx.globalAlpha = 1;
    sctx.fillStyle = `rgba(40,36,36,${(0.5 * smokeLevel).toFixed(3)})`;       // haze over everything
    sctx.fillRect(0, 0, w, h);
    const glow = sctx.createLinearGradient(0, h * 0.65, 0, h);                // firelight from below
    glow.addColorStop(0, "rgba(255,110,0,0)");
    glow.addColorStop(1, `rgba(255,110,0,${(0.22 * smokeLevel).toFixed(3)})`);
    sctx.fillStyle = glow; sctx.fillRect(0, h * 0.65, w, h * 0.35);
    const want = Math.floor(smokeLevel * Math.min(70, w / 16));
    puffs = puffs.filter((p) => p.age < p.life);
    while (puffs.length < want) puffs.push(newPuff(reduced));
    for (const p of puffs) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      sctx.globalAlpha = Math.max(0, Math.sin(Math.PI * Math.min(1, p.age / p.life))) * 0.55 * Math.min(1, smokeLevel * 1.3);
      sctx.drawImage(smokeSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    sctx.globalAlpha = 1;
  }

  function smokeFrame(now) {
    const dt = Math.min(0.033, (now - sLast) / 1000 || 0.016);
    sLast = now;
    smokeLevel = fireOn ? Math.min(1, smokeLevel + dt / 6) : Math.max(0, smokeLevel - dt / 2.2);   // fills up in ~6s, clears in ~2s
    if (!fireOn && smokeLevel <= 0) { stopSmoke(); return; }
    drawSmoke(dt);
    smokeRaf = requestAnimationFrame(smokeFrame);
  }
  function startSmoke() {
    if (!smokeSprite) smokeSprite = makeSprite();
    sizeSmoke();
    smokeCv.hidden = false;
    cancelAnimationFrame(smokeRaf);
    if (reduced) { smokeLevel = 1; puffs = []; drawSmoke(0); return; }   // static haze, no motion
    sLast = performance.now();
    smokeRaf = requestAnimationFrame(smokeFrame);
  }
  function stopSmoke() {
    cancelAnimationFrame(smokeRaf); smokeRaf = 0;
    smokeLevel = 0; puffs = [];
    sctx.clearRect(0, 0, smokeCv.width, smokeCv.height);
    smokeCv.hidden = true;
  }

  function igniteAll() {
    document.querySelectorAll(FIRE_SEL).forEach((el) => {
      if (el.classList.contains("burning")) return;
      el.classList.add("burning");
      ["", " low"].forEach((extra, row) => {
        const f = document.createElement("span");
        f.className = "flames" + extra;
        f.setAttribute("aria-hidden", "true");
        f.innerHTML = Array.from({ length: row ? 5 : 6 }, (_, i) => `<i style="--i:${i + row * 3}">🔥</i>`).join("");
        el.appendChild(f);
      });
    });
  }
  function extinguishAll() {
    document.querySelectorAll(".burning").forEach((el) => {
      el.classList.remove("burning");
      el.querySelectorAll(":scope > .flames").forEach((f) => f.remove());
    });
  }
  function refreshFire() { if (fireOn) igniteAll(); }          // cards re-rendered (search/sort) keep burning

  function setFire(on, quiet, instant) {
    if (on === fireOn || (on && sanity)) return;
    fireOn = on;
    const btn = $("#fire");
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "🧯" : "🔥";
    btn.title = on ? "Put out the fire" : "Set everything on fire";
    btn.setAttribute("aria-label", btn.title);
    if (on) {
      if (rainOn) setRain(false, true);                         // fire beats rain
      dryAll(true);
      igniteAll();
      startSmoke();
      Sound.whoosh(); Sound.fireStart();
      setGravity(true);                                         // everything falls to the bottom
      monkeySay("Aag lag gayi! Sab jal raha hai, ab neeche gir bhi raha hai 🔥", 5000);
    } else {
      extinguishAll();
      Sound.fireStop();
      if (instant) stopSmoke();                                 // otherwise the smoke fades out by itself
      else if (reduced) stopSmoke();
      if (!quiet) monkeySay("Aag bujh gayi. Raakh bhi nahi bachi 🧯", 4000);
    }
  }

  $("#fire").addEventListener("click", () => setFire(!fireOn));
  // while it burns, items that scroll into view fall too
  let fireScrollQueued = false;
  window.addEventListener("scroll", () => {
    if (!fireOn || !gravityOn || fireScrollQueued) return;
    fireScrollQueued = true;
    requestAnimationFrame(() => { fireScrollQueued = false; if (fireOn && gravityOn) gravityCollect(); });
  }, { passive: true });

  // ---------- Cart list: 🛒 in the header opens the full list ----------
  const cartModal = $("#cart-modal");
  let tickRaf = 0, tickTimer = 0;

  // The list shows a bigger price than the product page did (checkout "overprice"), and says why.
  // Sanity Mode shows honest prices instead.
  function checkoutQuote() {
    const rows = Object.entries(cart)
      .map(([id, q]) => ({ p: PRODUCTS.find((x) => x.id === id), q }))
      .filter((r) => r.p && r.q > 0)
      .map(({ p, q }) => {
        const op = OVERPRICE[p.id] || { pct: 0, why: "" };
        const unit = sanity ? p.price : Math.round(p.price * (1 + op.pct / 100));
        return { p, q, pct: sanity ? 0 : op.pct, why: op.why, unit, line: unit * q, was: p.price * q };
      });
    const was = rows.reduce((a, r) => a + r.was, 0);
    const items = rows.reduce((a, r) => a + r.line, 0);
    const fees = sanity ? [] : CHECKOUT_FEES.map((f) => ({ name: f.pct ? `${f.name} (${f.pct}%)` : f.name, amount: f.flat || Math.round(items * f.pct / 100) }));
    const total = items + fees.reduce((a, f) => a + f.amount, 0);
    // everything that made the price bigger, so we can name the biggest culprit
    const culprits = [
      ...rows.filter((r) => r.line > r.was).map((r) => ({ name: r.p.name, amount: r.line - r.was })),
      ...fees.map((f) => ({ name: f.name, amount: f.amount })),
    ].sort((a, b) => b.amount - a.amount);
    return { rows, fees, was, total, count: rows.reduce((a, r) => a + r.q, 0), culprits };
  }

  function tickTotal(from, to) {
    const el = $("#cart-sum");
    cancelAnimationFrame(tickRaf); clearTimeout(tickTimer);
    el.classList.remove("ticking");
    el.textContent = inr(from);
    if (reduced || from === to) { el.textContent = inr(to); return; }
    tickTimer = setTimeout(() => {                                 // first show the "nice" price, then let it climb
      const t0 = performance.now(), dur = 1500;
      el.classList.add("ticking");
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = inr(Math.round(from + (to - from) * e));
        if (k < 1) tickRaf = requestAnimationFrame(step);
        else { el.classList.remove("ticking"); if (!sanity) Sound.thud(); }
      };
      tickRaf = requestAnimationFrame(step);
    }, 500);
  }

  function openCart() {
    const q = checkoutQuote();
    const over = q.total - q.was;
    $("#cart-empty").hidden = q.rows.length > 0;
    $("#cart-items").innerHTML = q.rows.map((r, i) => `
      <li class="cart-row brut-sm" style="--i:${i}">
        <span class="cart-emoji ${r.p.bg}" aria-hidden="true">${r.p.emoji}</span>
        <span class="cart-name">${r.p.name}<span class="cart-each">${r.pct ? `${inr(r.p.price)} → ${inr(r.unit)} each` : `${inr(r.p.price)} each`}</span>${r.pct ? `<span class="cart-why">+${r.pct}% · ${r.why}</span>` : ""}</span>
        <span class="sticker bg-yel">×${r.q}</span>
        <span class="cart-line">${r.pct ? `<s>${inr(r.was)}</s>` : ""}<span class="price now" ${r.pct ? "" : 'style="color:inherit;animation:none"'}>${inr(r.line)}</span></span>
      </li>`).join("");
    $("#cart-extras").hidden = q.fees.length === 0 || q.rows.length === 0;
    $("#cart-fees").innerHTML = q.fees.map((f, i) => `<li style="--i:${i}"><span>${f.name}</span><b>+${inr(f.amount)}</b></li>`).join("");
    $("#cart-count-line").textContent = `${q.count} ${q.count === 1 ? "item" : "items"}`;
    const was = $("#cart-was");
    was.hidden = !(over > 0 && q.rows.length);
    was.textContent = inr(q.was);
    const note = $("#cart-over");
    if (over > 0 && q.rows.length) {
      note.hidden = false;
      note.innerHTML = `<span class="sticker bg-rad">+${Math.round(over / q.was * 100)}% overpriced</span> <span>Biggest culprit: <b>${q.culprits[0].name}</b> (+${inr(q.culprits[0].amount)})</span>`;
    } else note.hidden = true;
    cartModal.hidden = false;
    $("#cart-x").focus();
    tickTotal(over > 0 ? q.was : q.total, q.total);
  }
  function closeCart() {
    if (cartModal.hidden) return;
    cancelAnimationFrame(tickRaf); clearTimeout(tickTimer);
    cartModal.hidden = true;
    $("#cart-link").focus();
  }
  $("#cart-link").addEventListener("click", (e) => { e.preventDefault(); openCart(); });
  $("#cart-x").addEventListener("click", closeCart);
  $("#cart-close").addEventListener("click", closeCart);
  cartModal.addEventListener("click", (e) => { if (e.target === cartModal) closeCart(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  // Vibehack'26 banner: freeze the line animation for people who prefer reduced motion
  if (reduced) { const v = document.getElementById("vibe-svg"); if (v && v.pauseAnimations) v.pauseAnimations(); }

  // ---------- Timer ----------
  setInterval(() => {
    seconds++;
    $("#stat-time").textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
  }, 1000);

  // ---------- Init ----------
  updateDashboard();
  applySanity();
  startMonkeyLoop();
  if (new URLSearchParams(location.search).get("reveal") === "1") setReveal(true, true);
  if (!sanity) {
    $("#splash").hidden = false;
    splashTimer = setTimeout(closeSplash, 10000);
  }
})();
