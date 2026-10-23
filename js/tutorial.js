/* Playable tutorial on a 5x4 board. Rows: 0 enemy back, 1 enemy forward, 2 your forward, 3 your back.
   Rules applied: deploy only on your tiles during Deployment; units can't move the turn they deploy;
   one tactical action per unit per turn; cardinal steps; Fast = up to 2 steps in a straight line;
   moving into an enemy tile engages; engaged units can only retreat; Battle: units sharing a tile
   deal damage equal to their strength; unengaged units on the enemy back line besiege the base. */
(() => {
  const E = window.E;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const REDUCED = E.REDUCED;
  const hasGSAP = typeof gsap !== "undefined";
  const field = $("#tField"), handEl = $("#tHand"), msg = $("#tMsg");
  if (!field) return;

  const PH = [["Despliegue", "Deployment"], ["Tácticas", "Tactics"], ["Batalla", "Battle"], ["Final", "End"]];
  const LINE = [["línea trasera rival", "enemy back line"], ["línea delantera rival", "enemy forward line"], ["tu línea delantera", "your forward line"], ["tu línea trasera", "your back line"]];
  let S, sel = null;

  const fresh = () => ({
    turn: 1, phase: 0, pop: 12,
    units: [
      { id: "regs", card: "unit_neutral/06", n: "Combat Regulars", side: "me", a: 2, d: 2, dmg: 0, on: false, x: 0, y: 0, dep: 0, acted: false },
      { id: "rangers", card: "unit_blue/04", n: "Selidhar Rangers", side: "me", a: 1, d: 1, dmg: 0, on: false, x: 0, y: 0, dep: 0, acted: false, fast: true },
      { id: "peons", card: "unit_neutral/02", n: "Peons", side: "foe", a: 1, d: 1, dmg: 0, on: true, x: 3, y: 1, dep: 0, acted: false }
    ],
    f: { back: false, engaged: false, kill: false }
  });

  /* ---------- board scaffolding ---------- */
  for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "tile" + (y < 2 ? " enemy" : "") + (y === 0 || y === 3 ? " back" : "");
    t.style.left = x * 20 + "%"; t.style.top = y * 25 + "%";
    t.dataset.x = x; t.dataset.y = y;
    t.innerHTML = "<i></i>";
    field.appendChild(t);
  }
  const mid = document.createElement("i"); mid.className = "midline"; field.appendChild(mid);
  const layer = document.createElement("div"); layer.className = "t-layer"; field.appendChild(layer);

  const U = id => S.units.find(u => u.id === id);
  const at = (x, y, side) => S.units.filter(u => u.on && u.x === x && u.y === y && (!side || u.side === side));
  const engaged = u => at(u.x, u.y, u.side === "me" ? "foe" : "me").length > 0;
  const say = (es, en, bad) => { msg.textContent = E.L(es, en); msg.classList.toggle("bad", !!bad); if (hasGSAP && !REDUCED) gsap.fromTo(msg, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .4 }); };

  /* ---------- legality ---------- */
  const deployTargets = () => {
    const out = [];
    for (let y = 2; y < 4; y++) for (let x = 0; x < 5; x++) if (!at(x, y).length) out.push([x, y]);
    return out;
  };
  const moveTargets = u => {
    const out = [], free = (x, y) => x >= 0 && x < 5 && y >= 0 && y < 4 && !at(x, y, "me").length;
    if (engaged(u)) {
      if (u.y < 3 && free(u.x, u.y + 1)) out.push([u.x, u.y + 1]);
      if (u.y === 3) [[u.x - 1, 3], [u.x + 1, 3]].forEach(([x, y]) => free(x, y) && out.push([x, y]));
      return out;
    }
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
      const x1 = u.x + dx, y1 = u.y + dy;
      if (!free(x1, y1)) return;
      out.push([x1, y1]);
      if (u.fast && !at(x1, y1).length && free(x1 + dx, y1 + dy)) out.push([x1 + dx, y1 + dy]);
    });
    return out;
  };
  const whyNot = u => {
    if (S.phase !== 1) return [`Las unidades se mueven en la fase de Tácticas. Ahora estás en ${PH[S.phase][0]}.`, `Units move in the Tactics phase. You're in ${E.L(...PH[S.phase])}.`];
    if (u.dep === S.turn) return ["Esta unidad se ha desplegado este turno: no puede moverse hasta el siguiente (salvo que tenga Haste).", "This unit deployed this turn: it can't move until next turn (unless it has Haste)."];
    if (u.acted) return ["Cada unidad tiene una sola acción táctica por turno.", "Each unit gets one tactical action per turn."];
    if (!moveTargets(u).length) return ["No hay ninguna casilla legal para esta unidad.", "There's no legal tile for this unit."];
    return null;
  };
  const targetsFor = s => {
    if (!s) return [];
    if (s.kind === "hand") return S.phase === 0 ? deployTargets() : [];
    const u = U(s.id); return whyNot(u) ? [] : moveTargets(u);
  };

  /* ---------- actions ---------- */
  const tryAct = (s, x, y) => {
    const legal = targetsFor(s).some(([a, b]) => a === x && b === y);
    if (s.kind === "hand") {
      if (S.phase !== 0) return say("Solo puedes desplegar en la fase de Despliegue.", "You can only deploy during the Deployment phase.", true), false;
      if (!legal) return say("Despliega en una casilla vacía de tu lado del tablero (las dos filas de abajo).", "Deploy on an empty tile on your side of the board (the two bottom rows).", true), false;
      const u = U(s.id); Object.assign(u, { on: true, x, y, dep: S.turn });
      say(`${u.n} desplegada en ${E.L(...LINE[y])}.`, `${u.n} deployed on ${E.L(...LINE[y])}.`);
      return true;
    }
    const u = U(s.id), why = whyNot(u);
    if (why) return say(...why, true), false;
    if (!legal) {
      return engaged(u)
        ? (say("Trabada en combate: solo puede retirarse una casilla hacia atrás.", "Engaged: it can only retreat one tile backwards.", true), false)
        : (say(u.fast ? "Con Fast puede avanzar una o dos casillas en línea recta, sin diagonales." : "Se mueve una casilla arriba, abajo, izquierda o derecha. No puede entrar donde hay una unidad aliada.", u.fast ? "With Fast it moves one or two tiles in a straight line, no diagonals." : "It moves one tile up, down, left or right. It can't enter a tile with a friendly unit.", true), false);
    }
    const dist = Math.abs(x - u.x) + Math.abs(y - u.y);
    Object.assign(u, { x, y, acted: true });
    if (at(x, y, "foe").length) {
      if (u.id === "regs") S.f.engaged = true;
      say(`${u.n} entra en la casilla de ${at(x, y, "foe")[0].n}: quedan trabadas en combate. Lucharán en la fase de Batalla.`, `${u.n} moves into ${at(x, y, "foe")[0].n}'s tile: they're engaged. They'll fight in the Battle phase.`);
    } else if (y === 0) {
      if (u.id === "rangers") S.f.back = true;
      if (dist === 2) say(`${u.n} llega a la línea trasera rival con Fast. Si sigue libre en la Batalla, asediará la base.`, `${u.n} reaches the enemy back line with Fast. If still unengaged in Battle, it besieges the base.`);
      else say(`${u.n} llega a la línea trasera rival. Si sigue libre en la Batalla, asediará la base.`, `${u.n} reaches the enemy back line. If still unengaged in Battle, it besieges the base.`);
    } else if (dist === 1) say(`${u.n} se mueve 1 casilla.`, `${u.n} moves 1 tile.`);
    else say(`${u.n} se mueve ${dist} casillas.`, `${u.n} moves ${dist} tiles.`);
    return true;
  };

  const battle = () => {
    const hits = [];
    const tiles = new Set(S.units.filter(u => u.on).map(u => u.x + "," + u.y));
    tiles.forEach(k => {
      const [x, y] = k.split(",").map(Number), me = at(x, y, "me"), foe = at(x, y, "foe");
      if (!me.length || !foe.length) return;
      const dMe = me.reduce((a, u) => a + u.a, 0), dFoe = foe.reduce((a, u) => a + u.a, 0);
      foe[0].dmg += dMe; me[0].dmg += dFoe; hits.push([foe[0], dMe], [me[0], dFoe]);
    });
    let siege = 0;
    S.units.filter(u => u.on && u.side === "me" && u.y === 0 && !engaged(u)).forEach(u => { siege += u.a; hits.push([u, 0, true]); });
    const dead = S.units.filter(u => u.on && u.dmg >= u.d);
    dead.forEach(u => { u.on = false; if (u.id === "peons") S.f.kill = true; });
    S.pop -= siege;
    render(hits, dead);
    const parts = [];
    if (dead.length) parts.push([`Destruidas: ${dead.map(u => u.n).join(", ")}.`, `Destroyed: ${dead.map(u => u.n).join(", ")}.`]);
    if (siege) parts.push([`Asedio: la base rival pierde ${siege} de población.`, `Siege: the enemy base loses ${siege} population.`]);
    if (!parts.length) parts.push(["No hay combates ni asedios este turno.", "No battles or sieges this turn."]);
    const text = parts.map(p => E.L(p[0], p[1])).join(" "); // translate each sentence, then join
    say(text, text);
    if (siege) { const b = $("#tBaseFoe"); b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit"); }
  };

  const nextPhase = () => {
    sel = null;
    if (S.phase === 3) {
      S.turn++; S.phase = 0; S.units.forEach(u => { u.acted = false; });
      say(`Turno ${S.turn}. Fase de Despliegue: tus unidades recuperan su acción táctica.`, `Turn ${S.turn}. Deployment phase: your units get their tactical action back.`);
    } else {
      S.phase++;
      if (S.phase === 1) say("Fase de Tácticas: arrastra una unidad para moverla.", "Tactics phase: drag a unit to move it.");
      if (S.phase === 2) { battle(); return; }
      if (S.phase === 3) { S.units.forEach(u => { u.dmg = 0; }); say("Fase Final: se retira el daño de todas las unidades.", "End phase: damage is removed from all units."); }
    }
    render();
  };

  /* ---------- objectives ---------- */
  const OBJ = [
    [() => U("regs").on && U("rangers").on || S.turn > 1, "Despliega Combat Regulars y Selidhar Rangers en tu lado del tablero.", "Deploy Combat Regulars and Selidhar Rangers on your side of the board."],
    [() => S.turn >= 2, "Pasa fases hasta el turno 2: lo recién desplegado no puede moverse.", "Advance phases to turn 2: freshly deployed units can't move."],
    [() => S.f.back, "Usa Fast: lleva a los Rangers dos casillas en línea recta hasta la línea trasera rival.", "Use Fast: take the Rangers two tiles in a straight line to the enemy back line."],
    [() => S.f.engaged, "Mueve Combat Regulars a la casilla de Peons para trabarlos en combate.", "Move Combat Regulars into Peons' tile to engage them."],
    [() => S.f.kill, "Pasa a la Batalla: Combat Regulars (2|2) destruye a Peons (1|1).", "Go to Battle: Combat Regulars (2|2) destroys Peons (1|1)."],
    [() => S.pop < 12, "Asedia la base: una unidad libre en la línea trasera rival le quita población.", "Besiege the base: an unengaged unit on the enemy back line removes population."]
  ];

  /* ---------- render ---------- */
  const render = (hits, dead) => {
    $("#tPhases").innerHTML = `<span class="label">${E.L("Turno", "Turn")} <b class="num">${S.turn}</b></span>` + PH.map((p, i) => `<span class="ph${i === S.phase ? " on" : ""}">${E.L(...p)}</span>`).join("");
    $("#tPopFoe").textContent = S.pop;
    $("#tNext").innerHTML = S.phase === 3 ? E.L(`Empezar turno ${S.turn + 1} <span class="arr">→</span>`, `Start turn ${S.turn + 1} <span class="arr">→</span>`) : E.L(`Ir a ${PH[S.phase + 1][0]} <span class="arr">→</span>`, `Go to ${E.L(...PH[S.phase + 1])} <span class="arr">→</span>`);
    // hand
    const inHand = S.units.filter(u => u.side === "me" && !u.on && u.dep === 0);
    handEl.innerHTML = inHand.length ? inHand.map(u => `<button type="button" class="t-hcard${sel && sel.id === u.id ? " sel" : ""}" data-hand="${u.id}" aria-label="${E.esc(E.L("Desplegar ", "Deploy ") + u.n)}"><img src="assets/cards/${u.card}.webp" alt="" draggable="false"></button>`).join("")
      : `<span class="muted">${E.L("Mano vacía.", "Hand empty.")}</span>`;
    // pieces
    const alive = S.units.filter(u => u.on);
    const keep = new Set(alive.map(u => u.id));
    $$(".piece", layer).forEach(p => { if (!keep.has(p.dataset.id) && !(dead || []).some(d => d.id === p.dataset.id)) p.remove(); });
    S.units.forEach(u => {
      let p = $(`.piece[data-id="${u.id}"]`, layer);
      const isDead = (dead || []).includes(u);
      if (!u.on && !isDead) return;
      if (!p) {
        p = document.createElement("button"); p.type = "button";
        p.className = "piece " + (u.side === "me" ? "ally" : "foe"); p.dataset.id = u.id;
        p.innerHTML = `<span class="card"><img src="assets/cards/${u.card}.webp" alt="" draggable="false"></span><span class="hp num"></span><span class="dmg"></span>`;
        layer.appendChild(p);
        // animate the inner card: the piece's own transform holds its board position
        if (hasGSAP && !REDUCED) gsap.from($(".card", p), { opacity: 0, scale: 1.25, duration: .5, ease: "expo.out" });
      }
      const eng = u.on && engaged(u);
      const nx = eng ? (u.side === "me" ? 13 : -13) : 0, ny = eng ? (u.side === "me" ? 11 : -11) : 0;
      p.style.transform = `translate(${u.x * 100 + nx}%, ${u.y * 100 + ny}%) scale(${eng ? .82 : 1})`;
      p.classList.toggle("sel", !!(sel && sel.id === u.id));
      p.classList.toggle("spent", u.side === "me" && (u.acted || u.dep === S.turn));
      $(".hp", p).textContent = `${u.a}|${Math.max(0, u.d - u.dmg)}`;
      p.setAttribute("aria-label", `${u.n}, ${u.a}|${u.d}, ${E.L("carril", "lane")} ${u.x + 1}, ${E.L(...LINE[u.y])}`);
      if (isDead) {
        if (hasGSAP && !REDUCED) gsap.to($(".card", p), { opacity: 0, rotate: -14, scale: .5, duration: .7, delay: .5, ease: "power3.in", onComplete: () => p.remove() });
        else p.remove();
      }
    });
    (hits || []).forEach(([u, n, siege]) => {
      const p = $(`.piece[data-id="${u.id}"]`, layer); if (!p) return;
      const d = $(".dmg", p); d.textContent = siege ? E.L(`asedio −${u.a}`, `siege −${u.a}`) : `−${n}`;
      if (hasGSAP && !REDUCED) gsap.fromTo(d, { opacity: 1, y: 0 }, { opacity: 0, y: -34, duration: 1.4, ease: "power2.out" });
    });
    // highlights
    const T = targetsFor(sel);
    $$(".tile", field).forEach(t => t.classList.toggle("legal", T.some(([x, y]) => x === +t.dataset.x && y === +t.dataset.y)));
    $$(".tile", field).forEach(t => t.setAttribute("aria-label", `${E.L("Carril", "Lane")} ${+t.dataset.x + 1}, ${E.L(...LINE[+t.dataset.y])}`));
    // objectives
    let firstOpen = -1;
    $("#tObjs").innerHTML = OBJ.map(([ok, es, en], i) => {
      const done = ok(); if (!done && firstOpen < 0) firstOpen = i;
      return `<li class="${done ? "done" : ""}${!done && firstOpen === i ? " now" : ""}"><i aria-hidden="true">${done ? "✓" : i + 1}</i><span>${E.L(es, en)}</span></li>`;
    }).join("");
    $("#tDone").hidden = firstOpen !== -1;
  };

  /* ---------- input: tap to select, tap to act; or drag ---------- */
  let drag = null;
  const pick = el => {
    const h = el.closest("[data-hand]"); if (h) return { kind: "hand", id: h.dataset.hand, el: h };
    const p = el.closest(".piece.ally"); if (p) return { kind: "unit", id: p.dataset.id, el: p };
    return null;
  };
  const select = s => {
    if (s && s.kind === "unit") { const why = whyNot(U(s.id)); if (why) { say(...why, true); sel = null; return render(); } }
    if (s && s.kind === "hand" && S.phase !== 0) { say("Las cartas de la mano se despliegan en la fase de Despliegue.", "Cards in hand deploy during the Deployment phase.", true); sel = null; return render(); }
    sel = s && sel && sel.id === s.id ? null : s; render();
  };
  const tileAt = (cx, cy) => {
    const r = field.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    return [Math.min(4, Math.floor((cx - r.left) / r.width * 5)), Math.min(3, Math.floor((cy - r.top) / r.height * 4))];
  };
  const onDown = e => {
    if (e.button > 0) return;
    const s = pick(e.target); if (!s) return;
    drag = { s, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
  };
  const onMove = e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7) return;
    if (!drag.moved) {
      drag.moved = true;
      if (drag.s.kind === "unit" && whyNot(U(drag.s.id))) { say(...whyNot(U(drag.s.id)), true); drag = null; return; }
      if (drag.s.kind === "hand" && S.phase !== 0) { say("Las cartas de la mano se despliegan en la fase de Despliegue.", "Cards in hand deploy during the Deployment phase.", true); drag = null; return; }
      sel = drag.s; render();
      const img = $("img", drag.s.el), g = document.createElement("div");
      g.className = "t-ghost"; g.innerHTML = `<img src="${img.src}" alt="">`;
      g.style.width = Math.min(110, field.getBoundingClientRect().width / 5) + "px";
      document.body.appendChild(g); drag.ghost = g; drag.s.el.classList.add("lift");
    }
    drag.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -60%) rotate(-4deg)`;
    const t = tileAt(e.clientX, e.clientY);
    $$(".tile", field).forEach(el => el.classList.toggle("hover", !!t && +el.dataset.x === t[0] && +el.dataset.y === t[1]));
    e.preventDefault();
  };
  const onUp = e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) { select(d.s); return; }
    d.ghost.remove(); d.s.el.classList.remove("lift");
    $$(".tile.hover", field).forEach(el => el.classList.remove("hover"));
    const t = tileAt(e.clientX, e.clientY);
    if (t) tryAct(d.s, t[0], t[1]);
    sel = null; render();
  };
  document.addEventListener("pointerdown", e => { if (e.target.closest && (e.target.closest("#tField") || e.target.closest("#tHand"))) onDown(e); });
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; });
  field.addEventListener("click", e => {
    const t = e.target.closest(".tile"); if (!t || !sel) return;
    if (tryAct(sel, +t.dataset.x, +t.dataset.y)) sel = null;
    render();
  });
  // keyboard: Enter on a piece/hand card selects it (handled by click->pointer path above for mouse); support keyboard select
  [handEl, layer].forEach(el => el.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const s = pick(e.target); if (s) { e.preventDefault(); select(s); }
  }));

  $("#tNext").addEventListener("click", nextPhase);
  $("#tReset").addEventListener("click", () => { start(); say("Tablero reiniciado.", "Board reset."); });
  const start = () => { S = fresh(); sel = null; $$(".piece", layer).forEach(p => p.remove()); render(); };
  start();
  say("Arrastra una carta de tu mano a una de las dos filas de abajo. También puedes tocar la carta y después la casilla.", "Drag a card from your hand onto one of the two bottom rows. You can also tap the card, then the tile.");
  E.onLang(() => { render(); msg.textContent = ""; });
})();
