/* Deck builder. Rules from the Beta 0.2 rulebook:
   Main Deck >= 40 non-source cards; Source Deck exactly 21 sources; optional Side Deck up to 10 cards;
   at most 3 copies of a non-source card across Main + Side (unless the card says otherwise); sources unlimited. */
(() => {
  const E = window.E;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const REDUCED = E.REDUCED;
  const hasGSAP = typeof gsap !== "undefined";
  const CARDS = E.CARDS, BY = E.BY_ID;
  const KEY = "entropy.deck";
  const ZONES = ["main", "src", "side"];
  const ZONE_NAME = { main: ["Main", "Main"], src: ["Source", "Source"], side: ["Side", "Side"] };
  const TYPE_ORDER = ["unit", "event", "structure", "aspect", "source"];

  const SAMPLE = {
    sample: true,
    name: ["Ejemplo: Goblongs rojos", "Sample: Red Goblongs"],
    main: { "unit_red/05": 3, "unit_red/09": 3, "unit_red/15": 3, "unit_red/06": 3, "unit_red/14": 3, "unit_red/22": 3, "unit_red/23": 2, "unit_red/26": 3, "unit_red/29": 2, "unit_neutral/06": 3, "unit_neutral/12": 1, "event_red/02": 3, "event_red/06": 3, "event_red/07": 2, "event_red/03": 3 },
    src: { "sources/02": 12, "sources/01": 4, "sources/33": 3, "sources/22": 2 },
    side: { "event_red/21": 2, "event_nm/31": 2 }
  };
  const blank = () => ({ name: "", main: {}, src: {}, side: {} });
  const fromSample = () => ({ name: E.L(...SAMPLE.name), sample: true, main: { ...SAMPLE.main }, src: { ...SAMPLE.src }, side: { ...SAMPLE.side } });

  let deck;
  try { deck = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { deck = null; }
  if (!deck || !deck.main) deck = fromSample();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(deck)); } catch (e) {} };

  const total = z => Object.values(deck[z]).reduce((a, b) => a + b, 0);
  const copies = id => (deck.main[id] || 0) + (deck.side[id] || 0);
  const countOf = id => (deck.main[id] || 0) + (deck.src[id] || 0) + (deck.side[id] || 0);

  const add = (id, zone = "auto") => {
    const c = BY[id]; if (!c) return { ok: false, text: "" };
    const z = zone === "auto" ? (c.t === "source" ? "src" : "main") : zone;
    if (z === "main" && c.t === "source") return { ok: false, text: E.L("Los Sources van al Source Deck.", "Sources go in the Source Deck.") };
    if (z === "src" && c.t !== "source") return { ok: false, text: E.L("Solo los Sources van al Source Deck.", "Only sources go in the Source Deck.") };
    if (z === "src" && total("src") >= 21) return { ok: false, text: E.L("El Source Deck ya tiene 21 cartas.", "The Source Deck already has 21 cards.") };
    if (z === "side" && total("side") >= 10) return { ok: false, text: E.L("El Side Deck ya tiene 10 cartas.", "The Side Deck already has 10 cards.") };
    if (c.t !== "source" && !c.inf && copies(id) >= 3) return { ok: false, text: E.L(`Ya tienes 3 copias de ${c.n} entre Main y Side.`, `You already have 3 copies of ${c.n} across Main and Side.`) };
    deck[z][id] = (deck[z][id] || 0) + 1;
    deck.sample = false; save(); render();
    return { ok: true, text: E.L(`${c.n} añadida al ${ZONE_NAME[z][0]} Deck (${total(z)}).`, `${c.n} added to the ${ZONE_NAME[z][1]} Deck (${total(z)}).`) };
  };
  const remove = (id, z) => {
    if (!deck[z][id]) return;
    if (--deck[z][id] <= 0) delete deck[z][id];
    deck.sample = false; save(); render();
  };
  E.Deck = { add, countOf };

  /* ---------- share code ---------- */
  const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
  const encode = () => {
    const out = [1];
    ZONES.forEach(z => {
      const ent = Object.entries(deck[z]).filter(([id]) => BY[id]);
      out.push(ent.length);
      ent.forEach(([id, n]) => { const i = BY[id].idx; out.push(i >> 8, i & 255, Math.min(n, 255)); });
    });
    return "E" + b64(out);
  };
  const decode = code => {
    const s = String(code).trim().replace(/^.*#mazo\./, "").replace(/^E/, "");
    const b = unb64(s); let p = 1;
    if (b[0] !== 1) throw new Error("version");
    const d = blank();
    ZONES.forEach(z => {
      const n = b[p++];
      for (let k = 0; k < n; k++) { const i = (b[p++] << 8) | b[p++], cnt = b[p++]; const c = CARDS[i]; if (!c || !cnt) throw new Error("card"); d[z][c.id] = cnt; }
    });
    return d;
  };
  E.importDeck = code => {
    try { const d = decode(code); d.name = E.L("Mazo importado", "Imported deck"); deck = d; save(); render(); return true; }
    catch (e) { return false; }
  };

  /* ---------- left list ---------- */
  const listEl = $("#dbList"), qEl = $("#dbQ");
  const F = { q: "", type: "all", color: "all" };
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let rows = [];
  const drawList = () => {
    const words = norm(F.q).split(/\s+/).filter(Boolean);
    rows = CARDS.filter(c => (F.type === "all" || c.t === F.type) && (F.color === "all" || c.ci === F.color) && words.every(w => c._s.includes(w)));
    listEl.innerHTML = rows.length ? rows.map(c => `
      <div class="db-row" data-id="${c.id}">
        <button type="button" class="db-thumb" data-open aria-label="${E.esc(E.L("Ver carta ", "View card ") + c.n)}"><img src="${E.img(c)}" alt="" loading="lazy" decoding="async" width="440" height="616"></button>
        <div class="db-meta"><b>${E.esc(c.n)}</b><span>${E.esc(E.typeName(c.t))} · ${E.L("coste", "cost")} ${c.c}${c.a != null ? ` · ${c.a}|${c.d}` : ""}</span></div>
        <span class="db-pips" role="img" aria-label="${E.esc(E.pipsText(c.p))}">${E.pips(c.p)}</span>
        <span class="db-n num" aria-hidden="true">${countOf(c.id) || ""}</span>
        <button type="button" class="db-add" data-add aria-label="${E.esc(E.L("Añadir ", "Add ") + c.n)}">+</button>
      </div>`).join("")
      : `<p class="db-empty">${E.L("Ninguna carta con esos filtros.", "No cards match those filters.")}</p>`;
    $("#dbListCount").textContent = `${rows.length} ${E.L("cartas", "cards")}`;
  };
  const refreshCounts = () => $$(".db-row", listEl).forEach(r => { $(".db-n", r).textContent = countOf(r.dataset.id) || ""; });
  let qT;
  qEl.addEventListener("input", () => { clearTimeout(qT); qT = setTimeout(() => { F.q = qEl.value; drawList(); }, 140); });
  const seg = (el, key) => el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", el).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    F[key] = b.dataset.k; drawList();
  });
  seg($("#dbType"), "type"); seg($("#dbColor"), "color");
  listEl.addEventListener("click", e => {
    const row = e.target.closest(".db-row"); if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest("[data-open]")) return E.openCard(id, rows, e.target.closest("[data-open]"));
    if (e.target.closest("[data-add]")) {
      const m = add(id, "auto");
      if (!m.ok) E.toast(m.text, false);
      else if (hasGSAP && !REDUCED) gsap.fromTo($(".db-n", row), { scale: 1.8 }, { scale: 1, duration: .5, ease: "back.out(3)" });
    }
  });

  // hover preview (desktop)
  const prev = $("#dbPreview");
  if (matchMedia("(hover:hover)").matches) {
    listEl.addEventListener("pointerover", e => {
      const row = e.target.closest(".db-row"); if (!row) return;
      prev.src = E.img(BY[row.dataset.id]); prev.hidden = false;
      const r = row.getBoundingClientRect(), lr = listEl.getBoundingClientRect();
      const top = Math.min(Math.max(80, r.top + r.height / 2 - 154), innerHeight - 320);
      prev.style.transform = `translate(${Math.round(lr.right + 16)}px, ${Math.round(top)}px)`;
    });
    listEl.addEventListener("pointerleave", () => { prev.hidden = true; });
  }

  /* ---------- deck panel ---------- */
  let zone = "main";
  const nameEl = $("#dbName");
  nameEl.addEventListener("input", () => { deck.name = nameEl.value; deck.sample = false; save(); });
  $("#dbZones").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    zone = b.dataset.z; renderZone();
  });
  $("#dbCards").addEventListener("click", e => {
    const row = e.target.closest("[data-id]"); if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest("[data-minus]")) remove(id, zone);
    else if (e.target.closest("[data-plus]")) { const m = add(id, zone); if (!m.ok) E.toast(m.text, false); }
    else if (e.target.closest("[data-open]")) E.openCard(id, null, e.target.closest("[data-open]"));
  });

  const renderZone = () => {
    $$("#dbZones button").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.z === zone));
      $(".num", b).textContent = total(b.dataset.z);
    });
    const ent = Object.entries(deck[zone]).map(([id, n]) => [BY[id], n]).filter(([c]) => c);
    if (!ent.length) {
      $("#dbCards").innerHTML = `<p class="db-empty">${zone === "src"
        ? E.L("Sin Sources. Filtra por Sources a la izquierda y pulsa + para añadirlos.", "No sources yet. Filter by Sources on the left and press + to add them.")
        : zone === "side" ? E.L("El Side Deck es opcional: hasta 10 cartas. Añádelas desde la ficha de cada carta.", "The Side Deck is optional: up to 10 cards. Add them from each card's detail view.")
        : E.L("Mazo vacío. Pulsa + en cualquier carta de la lista para añadirla.", "Empty deck. Press + on any card in the list to add it.")}</p>`;
      return;
    }
    const groups = TYPE_ORDER.map(t => [t, ent.filter(([c]) => c.t === t).sort((a, b) => (a[0].c === "X" ? 99 : a[0].c) - (b[0].c === "X" ? 99 : b[0].c) || a[0].n.localeCompare(b[0].n))]).filter(([, g]) => g.length);
    $("#dbCards").innerHTML = groups.map(([t, g]) => `
      <div class="db-group"><span class="label">${E.typesName(t)} · ${g.reduce((a, [, n]) => a + n, 0)}</span>
      ${g.map(([c, n]) => `<div class="db-line" data-id="${c.id}">
        <span class="num db-x">${n}</span>
        <button type="button" class="db-lname" data-open>${E.esc(c.n)}</button>
        <span class="db-pips">${E.pips(c.p)}</span>
        <span class="num db-cost">${c.c}</span>
        <button type="button" class="db-step" data-minus aria-label="${E.esc(E.L("Quitar una ", "Remove one ") + c.n)}">−</button>
        <button type="button" class="db-step" data-plus aria-label="${E.esc(E.L("Añadir una ", "Add one ") + c.n)}">+</button>
      </div>`).join("")}</div>`).join("");
  };

  const PROVIDES = { r: /\(Red\)/g, g: /\(Green\)/g, b: /\(Blue\)/g, l: /\(Light\)/g, d: /\(Dark\)/g };
  const analyse = () => {
    const main = Object.entries(deck.main).map(([id, n]) => [BY[id], n]).filter(([c]) => c);
    const src = Object.entries(deck.src).map(([id, n]) => [BY[id], n]).filter(([c]) => c);
    const need = { r: 0, g: 0, b: 0, l: 0, d: 0 };
    main.forEach(([c]) => {
      const cnt = { r: 0, g: 0, b: 0, l: 0, d: 0 };
      c.p.forEach(p => { if (cnt[p[0]] != null) cnt[p[0]]++; if (p[1] === "+") cnt.l++; if (p[1] === "-") cnt.d++; });
      Object.keys(need).forEach(k => { need[k] = Math.max(need[k], cnt[k]); });
    });
    const have = { r: 0, g: 0, b: 0, l: 0, d: 0 };
    src.forEach(([c, n]) => Object.entries(PROVIDES).forEach(([k, re]) => { const m = c.x.match(re); if (m) have[k] += m.length * n; }));
    const curve = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, "7+": 0, X: 0 };
    main.forEach(([c, n]) => { const k = c.c === "X" ? "X" : c.c >= 7 ? "7+" : c.c; curve[k] += n; });
    const types = {}; main.forEach(([c, n]) => { types[c.t] = (types[c.t] || 0) + n; });
    const over = Object.keys({ ...deck.main, ...deck.side }).filter(id => BY[id] && BY[id].t !== "source" && !BY[id].inf && copies(id) > 3);
    const wrongZone = [...Object.keys(deck.main).filter(id => BY[id] && BY[id].t === "source"), ...Object.keys(deck.src).filter(id => BY[id] && BY[id].t !== "source")];
    return { need, have, curve, types, over, wrongZone };
  };

  const renderStats = () => {
    const A = analyse(), m = total("main"), s = total("src"), sd = total("side");
    const chip = (ok, label, v) => `<span class="chk ${ok ? "ok" : "bad"}"><i aria-hidden="true">${ok ? "✓" : "!"}</i>${label} <b class="num">${v}</b></span>`;
    $("#dbChecks").innerHTML = chip(m >= 40, "Main", `${m}/40+`) + chip(s === 21, "Source", `${s}/21`) + chip(sd <= 10, "Side", `${sd}/10`);
    const max = Math.max(1, ...Object.values(A.curve));
    $("#dbCurve").innerHTML = Object.entries(A.curve).map(([k, v]) => `<div class="bar"><span class="num v">${v || ""}</span><i style="height:${v / max * 100}%"></i><span class="num k">${k}</span></div>`).join("");
    $("#dbTypes").innerHTML = TYPE_ORDER.filter(t => A.types[t]).map(t => `<span>${E.typesName(t)} <b class="num">${A.types[t]}</b></span>`).join("") || `<span class="muted">${E.L("Sin cartas en el Main Deck.", "No cards in the Main Deck.")}</span>`;
    const ROW = { r: ["Roja", "Red"], g: ["Verde", "Green"], b: ["Azul", "Blue"], l: ["Luz", "Light"], d: ["Oscuridad", "Dark"] };
    const shown = Object.keys(ROW).filter(k => A.need[k] || A.have[k]);
    $("#dbEntropy").innerHTML = shown.length ? shown.map(k => {
      const bad = A.need[k] && !A.have[k];
      return `<div class="ent-row${bad ? " bad" : ""}"><i class="pip ${k}"></i><span>${E.L(...ROW[k])}</span>
        <span class="num">${A.need[k] ? E.L(`pide hasta ${A.need[k]}`, `up to ${A.need[k]} needed`) : E.L("no se pide", "not needed")}</span>
        <span class="num">${E.L(`${A.have[k]} en Sources`, `${A.have[k]} from sources`)}</span></div>`;
    }).join("") : `<p class="muted">${E.L("Añade cartas para ver qué entropía necesita el mazo.", "Add cards to see which entropy the deck needs.")}</p>`;
    const W = [];
    if (m < 40) W.push(E.L(`Faltan ${40 - m} cartas para llegar al mínimo de 40 en el Main Deck.`, `${40 - m} more cards needed to reach the 40-card Main Deck minimum.`));
    if (s !== 21) W.push(s < 21 ? E.L(`Faltan ${21 - s} Sources: el Source Deck tiene exactamente 21.`, `${21 - s} more sources needed: the Source Deck is exactly 21.`) : E.L(`Sobran ${s - 21} Sources.`, `${s - 21} sources too many.`));
    if (sd > 10) W.push(E.L("El Side Deck admite como mucho 10 cartas.", "The Side Deck allows at most 10 cards."));
    A.over.forEach(id => W.push(E.L(`${BY[id].n}: más de 3 copias entre Main y Side.`, `${BY[id].n}: more than 3 copies across Main and Side.`)));
    A.wrongZone.forEach(id => W.push(E.L(`${BY[id].n} está en el mazo equivocado.`, `${BY[id].n} is in the wrong deck.`)));
    Object.keys(ROW).forEach(k => { if (A.need[k] && !A.have[k]) W.push(E.L(`Tus cartas piden entropía ${ROW[k][0].toLowerCase()}, pero ningún Source la aporta.`, `Your cards need ${ROW[k][1].toLowerCase()} entropy, but no source provides it.`)); });
    $("#dbWarn").innerHTML = W.length ? `<ul>${W.map(w => `<li>${E.esc(w)}</li>`).join("")}</ul>` : `<p class="ok-line">${E.L("El mazo cumple las reglas de construcción.", "The deck meets the construction rules.")}</p>`;
    $("#dbBar").innerHTML = `<span>Main <b class="num">${m}/40</b></span><span>Source <b class="num">${s}/21</b></span><span>Side <b class="num">${sd}/10</b></span>`;
  };

  const render = () => {
    if (document.activeElement !== nameEl) nameEl.value = deck.sample ? E.L(...SAMPLE.name) : (deck.name || "");
    $("#dbSampleNote").hidden = !deck.sample;
    renderZone(); renderStats(); refreshCounts();
  };

  /* ---------- actions ---------- */
  const copy = async (text, okMsg, field) => {
    try { await navigator.clipboard.writeText(text); E.toast(okMsg, true); }
    catch (e) { if (field) { field.hidden = false; field.value = text; field.focus(); field.select(); } E.toast(E.L("No se pudo copiar. Selecciona el texto y cópialo.", "Copy failed. Select the text and copy it."), false); }
  };
  $("#dbShare").addEventListener("click", () => {
    const code = encode(); const f = $("#dbCodeOut");
    f.hidden = false; f.value = code;
    copy(code, E.L("Código del mazo copiado.", "Deck code copied."), f);
  });
  $("#dbCopyList").addEventListener("click", () => {
    const lines = [deck.name || E.L("Mazo sin nombre", "Untitled deck")];
    ZONES.forEach(z => {
      lines.push("", `${ZONE_NAME[z][1]} (${total(z)})`);
      Object.entries(deck[z]).filter(([id]) => BY[id]).sort((a, b) => BY[a[0]].n.localeCompare(BY[b[0]].n)).forEach(([id, n]) => lines.push(`${n} ${BY[id].n}`));
    });
    copy(lines.join("\n"), E.L("Lista copiada.", "List copied."), $("#dbCodeOut"));
  });
  $("#dbImportForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = $("#dbCode").value.trim(), err = $("#dbCodeErr");
    if (!v) { err.textContent = E.L("Pega un código de mazo.", "Paste a deck code."); return; }
    if (E.importDeck(v)) { err.textContent = ""; $("#dbCode").value = ""; E.toast(E.L("Mazo cargado.", "Deck loaded."), true); }
    else err.textContent = E.L("Ese código no es válido. Comprueba que lo has copiado entero.", "That code isn't valid. Check you copied all of it.");
  });
  let armed = null;
  $("#dbClear").addEventListener("click", e => {
    const b = e.currentTarget;
    if (armed) { clearTimeout(armed); armed = null; deck = blank(); save(); render(); b.classList.remove("armed"); setClearLabel(); E.toast(E.L("Mazo vaciado.", "Deck cleared."), true); return; }
    b.classList.add("armed"); b.textContent = E.L("Pulsa otra vez para vaciar", "Press again to clear");
    armed = setTimeout(() => { armed = null; b.classList.remove("armed"); setClearLabel(); }, 3000);
  });
  const setClearLabel = () => { $("#dbClear").textContent = E.L("Vaciar", "Clear"); };
  $("#dbSample").addEventListener("click", () => { deck = fromSample(); save(); render(); E.toast(E.L("Mazo de ejemplo cargado.", "Sample deck loaded."), true); });

  // floating summary bar on phones while the deck panel is off screen
  const bar = $("#dbBar"), panel = $("#dbDeck");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => { bar.classList.toggle("on", !en.isIntersecting && document.body.dataset.page === "mazos"); }, { threshold: 0 }).observe(panel);
  }
  bar.addEventListener("click", () => { E.lenis ? E.lenis.scrollTo(panel, { offset: -80 }) : panel.scrollIntoView({ behavior: "smooth" }); });

  drawList(); render(); setClearLabel();
  E.onLang(() => { drawList(); render(); setClearLabel(); });
})();
