/* Card pool: search + filters, card detail view, 3D foil card. */
(() => {
  const E = window.E;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const REDUCED = E.REDUCED;
  const hasGSAP = typeof gsap !== "undefined";
  const CARDS = window.CARDS || [];
  const BY_ID = Object.fromEntries(CARDS.map((c, i) => [c.id, Object.assign(c, { idx: i })]));
  E.CARDS = CARDS; E.BY_ID = BY_ID;
  E.img = c => `assets/cards/${c.id}.webp`;

  const TYPE = { unit: ["Unidad", "Unit"], event: ["Evento", "Event"], structure: ["Estructura", "Structure"], aspect: ["Aspecto", "Aspect"], source: ["Source", "Source"] };
  const TYPES_PL = { unit: ["Unidades", "Units"], event: ["Eventos", "Events"], structure: ["Estructuras", "Structures"], aspect: ["Aspectos", "Aspects"], source: ["Sources", "Sources"] };
  const IDENT = { r: ["Roja", "Red"], g: ["Verde", "Green"], b: ["Azul", "Blue"], n: ["Neutral", "Neutral"], m: ["Multicolor", "Multicolor"] };
  E.typeName = t => E.L(...TYPE[t]);
  E.typesName = t => E.L(...TYPES_PL[t]);
  E.identName = i => E.L(...IDENT[i]);
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  CARDS.forEach(c => { c._s = norm([c.n, c.x, c.st, c.sub || "", ...(TYPE[c.t] || [])].join(" ")); });

  /* ------------------------------------------------------------ */
  /* Pool grid + filters                                           */
  /* ------------------------------------------------------------ */
  const grid = $("#grid"), cnt = $("#poolCount"), q = $("#pq");
  const S = { q: "", type: "all", color: "all", cost: "all", kw: "all", sort: "pool", ld: "all" };
  let list = CARDS.slice();

  const allKw = [...new Set(CARDS.flatMap(c => c.k || []))].sort();
  const buildSelects = () => {
    const cost = $("#fCost"), kw = $("#fKw"), sort = $("#fSort"), ld = $("#fLD");
    cost.innerHTML = [["all", E.L("Cualquier coste", "Any cost")], ...["0", "1", "2", "3", "4", "5", "6"].map(v => [v, E.L("Coste ", "Cost ") + v]), ["7", E.L("Coste 7+", "Cost 7+")], ["X", E.L("Coste X", "Cost X")]]
      .map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    kw.innerHTML = `<option value="all">${E.L("Cualquier palabra clave", "Any keyword")}</option>` + allKw.map(k => `<option value="${E.esc(k)}">${E.esc(k)}</option>`).join("");
    sort.innerHTML = [["pool", E.L("Orden del card pool", "Card pool order")], ["cost", E.L("Por coste", "By cost")], ["name", E.L("Por nombre", "By name")]].map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    ld.innerHTML = [["all", E.L("Luz y oscuridad", "Light and dark")], ["L", E.L("Solo luz", "Light only")], ["D", E.L("Solo oscuridad", "Dark only")]].map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    cost.value = S.cost; kw.value = S.kw; sort.value = S.sort; ld.value = S.ld;
  };

  const matches = c => {
    if (S.type !== "all" && c.t !== S.type) return false;
    if (S.color !== "all" && c.ci !== S.color) return false;
    if (S.cost !== "all") {
      if (S.cost === "X") { if (c.c !== "X") return false; }
      else if (S.cost === "7") { if (c.c === "X" || c.c < 7) return false; }
      else if (c.c !== +S.cost) return false;
    }
    if (S.kw !== "all" && !(c.k || []).includes(S.kw)) return false;
    if (S.ld === "L" && !c.L) return false;
    if (S.ld === "D" && !c.D) return false;
    if (S.q) { const words = norm(S.q).split(/\s+/).filter(Boolean); if (!words.every(w => c._s.includes(w))) return false; }
    return true;
  };
  const costNum = c => (c.c === "X" ? 99 : c.c);

  const draw = animate => {
    list = CARDS.filter(matches);
    if (S.sort === "cost") list.sort((a, b) => costNum(a) - costNum(b) || a.n.localeCompare(b.n));
    else if (S.sort === "name") list.sort((a, b) => a.n.localeCompare(b.n));
    cnt.textContent = `${list.length} ${list.length === 1 ? E.L("carta", "card") : E.L("cartas", "cards")}`;
    grid.innerHTML = list.length
      ? list.map((c, i) => `<button class="card tilt" type="button" data-i="${i}" aria-label="${E.esc(c.n)}, ${E.esc(E.typeName(c.t))}"><span class="tilt-in" style="display:block"><img src="${E.img(c)}" alt="" loading="lazy" decoding="async" width="440" height="616"></span></button>`).join("")
      : `<div class="grid-empty"><p>${E.L("Ninguna carta cumple todos los filtros.", "No card matches every filter.")}</p><button class="btn btn-ghost" type="button" id="poolClear">${E.L("Quitar filtros", "Clear filters")}</button></div>`;
    $("#poolReset").hidden = !isFiltered();
    if (animate && hasGSAP && !REDUCED) gsap.from($$(".card", grid).slice(0, 24), { y: 36, opacity: 0, rotate: () => gsap.utils.random(-4, 4), duration: .8, ease: "expo.out", stagger: .02 });
  };
  const isFiltered = () => S.q || S.type !== "all" || S.color !== "all" || S.cost !== "all" || S.kw !== "all" || S.ld !== "all";
  const redraw = () => {
    if (hasGSAP && !REDUCED) gsap.to(grid, { opacity: 0, y: 10, duration: .16, onComplete: () => { draw(true); gsap.set(grid, { opacity: 1, y: 0 }); if (window.ScrollTrigger) ScrollTrigger.refresh(); } });
    else draw(false);
  };
  const resetFilters = () => {
    Object.assign(S, { q: "", type: "all", color: "all", cost: "all", kw: "all", ld: "all" });
    q.value = ""; buildSelects();
    $$("#fType button, #fColor button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === "all")));
    redraw();
  };
  const seg = (el, key) => el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", el).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    S[key] = b.dataset.k; redraw();
  });
  seg($("#fType"), "type"); seg($("#fColor"), "color");
  let qT;
  q.addEventListener("input", () => { clearTimeout(qT); qT = setTimeout(() => { S.q = q.value.trim(); redraw(); }, 160); });
  [["#fCost", "cost"], ["#fKw", "kw"], ["#fSort", "sort"], ["#fLD", "ld"]].forEach(([s, k]) => $(s).addEventListener("change", e => { S[k] = e.target.value; redraw(); }));
  $("#poolReset").addEventListener("click", resetFilters);
  grid.addEventListener("click", e => {
    if (e.target.closest("#poolClear")) return resetFilters();
    const b = e.target.closest(".card"); if (b) openCard(list[+b.dataset.i].id, list, b);
  });
  $("#poolTotal").textContent = CARDS.length;
  buildSelects(); draw(false);
  E.onLang(() => { buildSelects(); draw(false); if (!detail.hidden) renderInfo(); });
  E.setPoolFilter = (key, val) => { S[key] = val; };

  /* ------------------------------------------------------------ */
  /* 3D card (WebGL) with foil and back                            */
  /* ------------------------------------------------------------ */
  const Card3D = (() => {
    const canvas = $("#cardGL"), fallback = $("#dFallback");
    let ok = false, renderer, scene, camera, mesh, U, running = false, texCache = {};
    const rot = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, base: 0 };
    let dragging = false, last = null, idle = 0;
    const init = () => {
      if (ok || typeof THREE === "undefined") return ok;
      try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return false; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(30, 1, .1, 50); camera.position.z = 6.9;
      const loader = new THREE.TextureLoader();
      U = {
        uFront: { value: null }, uBack: { value: loader.load("assets/card-back.webp") }, uHasFront: { value: 0 },
        uTilt: { value: new THREE.Vector2() }, uTime: { value: 0 }, uFoil: { value: 1 }
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: U, transparent: true, side: THREE.DoubleSide,
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform sampler2D uFront, uBack; uniform float uHasFront, uTime, uFoil; uniform vec2 uTilt;
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q,0.)) + min(max(q.x,q.y),0.) - r; }
          void main(){
            bool front = dot(normalize(vN), normalize(vV)) >= 0.; // gl_FrontFacing is unreliable on some ANGLE drivers
            vec2 uv = front ? vUv : vec2(1. - vUv.x, vUv.y);
            vec2 p = (vUv - .5) * vec2(1., 1.4);
            float alpha = 1. - smoothstep(0., .004, sdRound(p, vec2(.5, .7), .046));
            vec4 tex = front ? texture2D(uFront, uv) : texture2D(uBack, uv);
            if (front && uHasFront < .5) tex = vec4(.1, .1, .11, 1.);
            vec3 n = normalize(vN); if (!front) n = -n;
            float facing = clamp(dot(n, normalize(vV)), 0., 1.);
            float phase = uv.x * 1.3 + uv.y * .9 + uTilt.x * 1.8 - uTilt.y * 1.2;
            vec3 rainbow = .5 + .5 * cos(6.2831 * (phase + vec3(0., .33, .67)));
            float bands = pow(.5 + .5 * sin(phase * 9. + uTime * .3), 3.);
            float lum = dot(tex.rgb, vec3(.299, .587, .114));
            vec3 col = tex.rgb + rainbow * (bands * .17 + .04) * uFoil * (.35 + lum);
            vec2 lp = vec2(.5) + vec2(-uTilt.x, uTilt.y) * .9;
            col += pow(max(0., 1. - length((uv - lp) * vec2(1., .7)) * 1.6), 4.) * .32;
            col *= .8 + .2 * facing;
            gl_FragColor = vec4(col, alpha * tex.a);
          }`
      });
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.08), mat);
      scene.add(mesh);
      const onDown = e => { dragging = true; last = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); idle = 0; };
      const onMove = e => {
        if (!dragging) {
          if (e.pointerType === "mouse") { const r = canvas.getBoundingClientRect(); rot.tx = ((e.clientY - r.top) / r.height - .5) * .5; rot.hy = ((e.clientX - r.left) / r.width - .5) * .6; }
          return;
        }
        const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
        rot.vy = dx * .012; rot.vx = dy * .008; rot.ty += rot.vy; rot.tx = Math.max(-.7, Math.min(.7, rot.tx + rot.vx));
      };
      const onUp = () => {
        if (!dragging) return; dragging = false;
        rot.ty += rot.vy * 8;
        rot.ty = Math.round(rot.ty / Math.PI) * Math.PI; // settle on a face
        rot.tx = 0;
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp);
      canvas.addEventListener("pointerleave", () => { if (!dragging) { rot.tx = 0; rot.hy = 0; } });
      ok = true;
      return ok;
    };
    const size = () => {
      const r = canvas.parentNode.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / Math.max(r.height, 1);
      camera.position.z = camera.aspect < .78 ? 6.9 * (.78 / camera.aspect) : 6.9;
      camera.updateProjectionMatrix();
    };
    const clock = typeof THREE !== "undefined" ? new THREE.Clock() : null;
    const loop = () => {
      if (!running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), .05);
      U.uTime.value += dt; idle += dt;
      const sway = (!dragging && !REDUCED) ? Math.sin(U.uTime.value * .7) * .12 : 0;
      const ky = 1 - Math.exp(-dt * (dragging ? 22 : 5.5)), kx = 1 - Math.exp(-dt * 6.5);
      rot.y += (rot.ty + (rot.hy || 0) + sway - rot.y) * ky;
      rot.x += (rot.tx + (REDUCED || dragging ? 0 : Math.sin(U.uTime.value * .5) * .05) - rot.x) * kx;
      mesh.rotation.set(rot.x, rot.y, 0);
      U.uTilt.value.set(Math.sin(rot.y), Math.sin(rot.x));
      renderer.render(scene, camera);
    };
    return {
      show(src) {
        if (!init()) { canvas.hidden = true; fallback.hidden = false; fallback.src = src; return false; }
        canvas.hidden = false; fallback.hidden = true;
        size();
        rot.ty = Math.round(rot.ty / (2 * Math.PI)) * 2 * Math.PI; // always land on the front
        const apply = t => { U.uFront.value = t; U.uHasFront.value = 1; };
        if (texCache[src]) apply(texCache[src]);
        else { U.uHasFront.value = 0; new THREE.TextureLoader().load(src, t => { t.anisotropy = 4; texCache[src] = t; apply(t); }); }
        if (!running) { running = true; clock.getDelta(); loop(); }
        return true;
      },
      intro() { if (!ok || REDUCED) return; rot.y = rot.ty - Math.PI * 1.2; rot.x = .35; },
      faceBack() { return ok && Math.cos(rot.ty) < 0; },
      flip() { if (ok) rot.ty += Math.PI; else fallback.classList.toggle("is-back"); },
      stop() { running = false; },
      resize() { if (ok && running) size(); }
    };
  })();
  addEventListener("resize", () => Card3D.resize());

  /* ------------------------------------------------------------ */
  /* Detail view                                                   */
  /* ------------------------------------------------------------ */
  const detail = $("#detail");
  let dList = [], dIdx = 0, lastFocus = null, returnHash = "cartas";
  const statLine = c => {
    if (c.t === "unit") return `<div class="stat"><span class="num">${c.a}</span><span class="label">${E.L("Fuerza", "Strength")}</span></div><div class="stat"><span class="num">${c.d}</span><span class="label">${E.L("Defensa", "Defense")}</span></div>`;
    if (c.i != null) return `<div class="stat"><span class="num">${c.i}</span><span class="label">${E.L("Integridad", "Integrity")}</span></div>`;
    return "";
  };
  const renderInfo = () => {
    const c = dList[dIdx];
    $("#dType").textContent = c.st + (c.sud ? " · Sudden" : "");
    $("#dName").textContent = c.n;
    $("#dCost").innerHTML = `<div class="stat"><span class="num">${c.c}</span><span class="label">${E.L("Coste", "Cost")}</span></div>`
      + (c.p.length ? `<div class="stat"><span class="d-pips" role="img" aria-label="${E.esc(E.pipsText(c.p))}">${E.pips(c.p)}</span><span class="label">${E.L("Requisito de entropía", "Entropy requirement")}</span></div>` : "")
      + statLine(c);
    $("#dText").innerHTML = c.x ? E.linkify(c.x) : `<span class="muted">${E.L("Sin texto de reglas.", "No rules text.")}</span>`;
    const ks = (c.k || []).filter(k => E.GLOSS[k]);
    $("#dKw").innerHTML = ks.length ? `<span class="label">${E.L("Palabras clave", "Keywords")}</span><dl>${ks.map(k => `<div><dt>${E.esc(k)}</dt><dd>${E.esc(E.L(...E.GLOSS[k]))}</dd></div>`).join("")}</dl>` : "";
    $("#dIndex").textContent = dList.length > 1 ? `${dIdx + 1} / ${dList.length}` : "";
    $("#dPrev").hidden = $("#dNext").hidden = dList.length < 2;
    $("#dAdd").innerHTML = c.t === "source" ? E.L("Añadir al Source Deck", "Add to Source Deck") : E.L("Añadir al Main Deck", "Add to Main Deck");
    const inDeck = E.Deck ? E.Deck.countOf(c.id) : 0;
    $("#dInDeck").textContent = inDeck ? E.L(`En tu mazo: ${inDeck}`, `In your deck: ${inDeck}`) : "";
  };
  const show = (i, fromEl) => {
    dIdx = (i + dList.length) % dList.length;
    const c = dList[dIdx];
    renderInfo();
    Card3D.show(E.img(c));
    flipLabel();
    try { history.replaceState(null, "", "#c." + c.id.replace("/", ".")); } catch (e) {}
    if (hasGSAP && !REDUCED) {
      gsap.fromTo(".d-info > *", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, ease: "expo.out", stagger: .03 });
      if (!fromEl) Card3D.intro();
    }
  };
  const openCard = (id, ctxList, fromEl) => {
    const c = BY_ID[id]; if (!c) return;
    dList = ctxList && ctxList.length ? ctxList : [c];
    const i = Math.max(0, dList.findIndex(x => x.id === id));
    lastFocus = fromEl || document.activeElement;
    const h = (location.hash || "").slice(1);
    if (detail.hidden) returnHash = h.startsWith("c.") ? "cartas" : (h || "cartas");
    detail.hidden = false;
    document.documentElement.classList.add("modal-open");
    E.Field.pause(true);
    if (E.lenis) E.lenis.stop();
    show(i);
    if (hasGSAP && !REDUCED) {
      gsap.fromTo(".d-scrim", { opacity: 0 }, { opacity: 1, duration: .4 });
      const stage = $(".d-stage");
      if (fromEl) {
        const a = fromEl.getBoundingClientRect(), b = stage.getBoundingClientRect();
        gsap.fromTo(stage, { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2), scale: Math.min(.6, a.height / b.height * 1.3), opacity: .4 },
          { x: 0, y: 0, scale: 1, opacity: 1, duration: .9, ease: "expo.out" });
      } else gsap.fromTo(stage, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .8, ease: "expo.out" });
    }
    $("#dClose").focus({ preventScroll: true });
  };
  const closeCard = () => {
    if (detail.hidden) return;
    const done = () => {
      detail.hidden = true; Card3D.stop(); if (hasGSAP) gsap.set(detail, { opacity: 1 });
      document.documentElement.classList.remove("modal-open");
    };
    if (hasGSAP && !REDUCED) gsap.to(detail, { opacity: 0, duration: .22, onComplete: done }); else done();
    E.Field.pause(false);
    if (E.lenis) E.lenis.start();
    try { history.replaceState(null, "", "#" + returnHash); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  E.openCard = openCard; E.closeCard = closeCard;
  detail.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeCard(); });
  $("#dPrev").addEventListener("click", () => show(dIdx - 1));
  $("#dNext").addEventListener("click", () => show(dIdx + 1));
  const flipLabel = () => {
    const back = Card3D.faceBack();
    $("#dFlip").innerHTML = back ? E.L("Ver el frente", "See the front") : E.L("Ver el dorso", "See the back");
  };
  $("#dFlip").addEventListener("click", () => { Card3D.flip(); flipLabel(); });
  E.onLang(() => { if (!detail.hidden) flipLabel(); });
  const add = zone => {
    const c = dList[dIdx]; if (!E.Deck) return;
    const msg = E.Deck.add(c.id, zone);
    E.toast(msg.text, msg.ok);
    renderInfo();
  };
  $("#dAdd").addEventListener("click", () => add("auto"));
  $("#dAddSide").addEventListener("click", () => add("side"));
  document.addEventListener("keydown", e => {
    if (detail.hidden) return;
    if (e.key === "Escape") closeCard();
    else if (e.key === "ArrowLeft" && !e.target.closest("input,select,textarea")) show(dIdx - 1);
    else if (e.key === "ArrowRight" && !e.target.closest("input,select,textarea")) show(dIdx + 1);
    else if (e.key === "Tab") { // keep focus inside the dialog
      const f = $$("button:not([hidden]), [href], input, select", detail).filter(x => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
})();
