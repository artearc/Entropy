/* Router, page choreography, small widgets. Runs last. */
(() => {
  "use strict";
  const E = window.E;
  const REDUCED = E.REDUCED;
  const hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const card = (dir, n) => `assets/cards/${dir}/${String(n).padStart(2, "0")}.webp`;

  /* ---------- smooth scroll ---------- */
  // Native scrolling: a JS smooth-scroll layer swallowed mouse-wheel input on some setups.
  const lenis = null;
  E.lenis = null;
  const scrollTop = () => (lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0));

  /* ---------- toast ---------- */
  const toastEl = $("#toast"); let toastT;
  E.toast = (text, ok = true) => {
    if (!text) return;
    toastEl.textContent = text; toastEl.classList.toggle("bad", !ok); toastEl.hidden = false;
    if (hasGSAP && !REDUCED) gsap.fromTo(toastEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: "expo.out" });
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2600);
  };

  /* ---------- tilt + holo sheen ---------- */
  if (matchMedia("(hover:hover)").matches && !REDUCED) {
    let active = null;
    document.addEventListener("pointermove", e => {
      const el = e.target.closest && e.target.closest(".tilt");
      if (active && active !== el) { active.classList.remove("is-on"); active.style.setProperty("--rx", "0deg"); active.style.setProperty("--ry", "0deg"); active = null; }
      if (!el) return;
      active = el; el.classList.add("is-on");
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", ((px - .5) * 18).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((.5 - py) * 18).toFixed(2) + "deg");
      el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    }, { passive: true });
  }

  /* ---------- marquee strip ---------- */
  (() => {
    const picks = [["unit_red", 3], ["unit_blue", 22], ["unit_green", 5], ["unit_multi", 2], ["event_red", 2], ["unit_neutral", 2], ["structures", 2], ["unit_green", 10], ["unit_blue", 9], ["aspects", 1], ["unit_red", 22], ["sources", 10], ["unit_multi", 4], ["event_blue", 6]];
    const html = picks.map(([d, n]) => `<div class="card tilt"><div class="tilt-in"><img src="${card(d, n)}" alt="" loading="lazy" width="440" height="616"></div></div>`).join("");
    $("#mq").innerHTML = html + html;
  })();

  /* ---------- entropy calculator ---------- */
  (() => {
    const HAND = ["unit_green/18", "event_green/04", "unit_blue/16", "unit_red/15", "unit_multi/02", "event_red/12"].map(id => E.BY_ID[id]);
    let state = ["b", "g", "g"], energy = 7;
    const stateEl = $("#state"), handEl = $("#hand"), eVal = $("#eVal");
    handEl.innerHTML = HAND.map((c, i) => `<div class="hcard" data-i="${i}"><button type="button" class="card tilt" data-open aria-label="${E.esc(c.n)}"><span class="tilt-in" style="display:block"><img src="${E.img(c)}" alt="" loading="lazy" width="440" height="616"></span></button><span class="st"></span></div>`).join("");
    const NAME = { r: ["roja", "red"], g: ["verde", "green"], b: ["azul", "blue"] };
    const render = () => {
      stateEl.innerHTML = state.length ? state.map((c, i) => `<button type="button" class="pip ${c}" data-i="${i}" aria-label="${E.L("Quitar entropía " + NAME[c][0], "Remove " + NAME[c][1] + " entropy")}"></button>`).join("") : `<span class="empty">${E.L("Sin entropía. Añade algún Source.", "No entropy. Add a source.")}</span>`;
      eVal.textContent = energy;
      const have = { r: 0, g: 0, b: 0 }; state.forEach(c => have[c]++);
      $$(".hcard", handEl).forEach(el => {
        const c = HAND[+el.dataset.i], need = { r: 0, g: 0, b: 0 };
        c.p.forEach(p => { if (need[p[0]] != null) need[p[0]]++; });
        const miss = Object.keys(need).flatMap(k => Array(Math.max(0, need[k] - have[k])).fill(k));
        const ok = !miss.length && energy >= c.c;
        el.classList.toggle("ok", ok); el.classList.toggle("no", !ok);
        $(".st", el).innerHTML = ok ? E.L(`Jugable. Pagas ${c.c} de energía.`, `Playable. You pay ${c.c} energy.`)
          : miss.length ? E.L("Te falta ", "Missing ") + miss.map(E.pip).join(" ")
          : E.L(`Necesitas ${c.c} de energía.`, `You need ${c.c} energy.`);
      });
    };
    stateEl.onclick = e => { const b = e.target.closest("[data-i]"); if (!b) return; state.splice(+b.dataset.i, 1); render(); };
    $$("[data-add]").forEach(b => b.onclick = () => { if (state.length < 8) { state.push(b.dataset.add); state.sort((a, c) => "rgb".indexOf(a) - "rgb".indexOf(c)); render(); } });
    $("#eMinus").onclick = () => { energy = Math.max(0, energy - 1); render(); };
    $("#ePlus").onclick = () => { energy = Math.min(12, energy + 1); render(); };
    handEl.addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) E.openCard(HAND[+b.closest(".hcard").dataset.i].id, HAND, b); });
    render(); E.onLang(render);
  })();

  /* ---------- glossary section ---------- */
  (() => {
    const list = $("#gList"), q = $("#gQ");
    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const draw = () => {
      const w = norm(q.value.trim());
      const keys = Object.keys(E.GLOSS).sort((a, b) => a.localeCompare(b)).filter(k => !w || norm(k + " " + E.GLOSS[k].join(" ")).includes(w));
      list.innerHTML = keys.length ? keys.map(k => {
        const n = E.CARDS.filter(c => (c.k || []).includes(k)).length;
        return `<div class="g-item"><dt>${E.esc(k)}</dt><dd>${E.esc(E.L(...E.GLOSS[k]))}</dd>${n ? `<button type="button" class="g-see" data-k="${E.esc(k)}">${E.L(`Ver ${n} ${n === 1 ? "carta" : "cartas"}`, `See ${n} ${n === 1 ? "card" : "cards"}`)} →</button>` : ""}</div>`;
      }).join("") : `<p class="muted">${E.L("Ningún término coincide.", "No term matches.")}</p>`;
    };
    q.addEventListener("input", draw);
    list.addEventListener("click", e => {
      const b = e.target.closest(".g-see"); if (!b) return;
      const sel = $("#fKw"); sel.value = b.dataset.k; sel.dispatchEvent(new Event("change"));
      go("cartas", { x: e.clientX, y: e.clientY });
    });
    draw(); E.onLang(draw);
  })();

  /* ---------- page modules ---------- */
  const splitWords = el => {
    if (el.dataset.done) return;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");
    el.dataset.done = 1;
  };
  const commonReveals = root => {
    if (!REDUCED) $$("[data-reveal]", root).forEach(el => {
      gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    if (!REDUCED) $$("[data-par] img", root).forEach(img => {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
    ScrollTrigger.create({ start: 0, end: () => innerHeight * 1.4, onUpdate: s => {
      E.Field.setChaos(s.progress * 1.1);
      E.Field.setAlpha((1 - s.progress * .72).toFixed(3));
    } });
  };
  const pageEnter = root => {
    if (REDUCED || !hasGSAP) return;
    const lines = $$("[data-split] .line-mask > span", root).filter(el => el.offsetParent);
    gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: .8, ease: "expo.out", stagger: .06, delay: .08 });
    gsap.fromTo($$("[data-enter]", root), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: "expo.out", stagger: .05, delay: .18 });
  };

  const modules = {
    inicio(root) {
      const mm = gsap.matchMedia();
      commonReveals(root);
      $$("[data-words]", root).forEach(words => {
        splitWords(words);
        gsap.to($$(".w", words), { opacity: 1, stagger: .05, ease: "none", scrollTrigger: { trigger: words.closest(".manifesto"), start: "top 70%", end: "bottom 60%", scrub: true } });
      });
      mm.add("(min-width: 900px)", () => {
        const track = $(".f-track", root);
        const dist = () => track.scrollWidth - innerWidth;
        const tween = gsap.to(track, { x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: "#factions", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
        $$(".fan", root).forEach(f => {
          gsap.fromTo(f, { rotate: 6, y: 40 }, { rotate: -4, y: -20, ease: "none",
            scrollTrigger: { trigger: f.closest(".f-panel"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        });
      });
      mm.add("(max-width: 899px)", () => {
        $$(".fan", root).forEach(f => gsap.from(f, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 85%", once: true } }));
      });
      const frame = $("#boardFrame", root);
      gsap.fromTo(frame, { clipPath: "inset(12% 14% 12% 14% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", ease: "none", scrollTrigger: { trigger: frame, start: "top 85%", end: "center 55%", scrub: true } });
      gsap.fromTo($("img", frame), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } });
      $$("[data-count]", root).forEach(el => {
        const n = +el.dataset.count, o = { v: 0 };
        gsap.to(o, { v: n, duration: 1.6, ease: "power3.out", onUpdate: () => el.textContent = Math.round(o.v), scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
      const mq = $("#mq", root);
      const loop = gsap.to(mq, { xPercent: -50, ease: "none", duration: 70, repeat: -1 });
      ScrollTrigger.create({ trigger: mq, start: "top bottom", end: "bottom top", onUpdate: s => {
        const v = gsap.utils.clamp(-6, 6, s.getVelocity() / 300);
        gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: .3, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1.2, delay: .3 });
      } });
      return () => mm.revert();
    },
    jugar(root) {
      commonReveals(root);
      const ph = $$(".phase", root), mm = gsap.matchMedia();
      mm.add("(min-width: 761px)", () => {
        ph.forEach((p, i) => {
          if (i === ph.length - 1) return;
          gsap.to(p, { scale: .93, opacity: .45, ease: "none", scrollTrigger: { trigger: ph[i + 1], start: "top 85%", end: "top 25%", scrub: true } });
        });
      });
      gsap.from($$(".deck", root), { y: 80, rotate: i => i ? 8 : -8, opacity: 0, duration: 1.3, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: "#decks", start: "top 80%", once: true } });
      return () => mm.revert();
    },
    cartas(root) { commonReveals(root); return () => {}; },
    mazos(root) { commonReveals(root); return () => {}; },
    torneos(root) { commonReveals(root); return () => {}; }
  };

  // in-page scroll links
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-scroll]"); if (!a) return;
    e.preventDefault(); const t = $(a.dataset.scroll);
    lenis ? lenis.scrollTo(t, { offset: -80, duration: 1.4 }) : t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
  });

  /* ---------- router + diamond veil ---------- */
  // "torneos" is switched off while the game moves to digital; add it back here and in the nav to restore it.
  const PAGES = ["inicio", "jugar", "cartas", "mazos"];
  const TITLES = { inicio: ["Entropy", "Entropy"], jugar: ["Aprende a jugar", "Learn to play"], cartas: ["Card pool", "Card pool"], mazos: ["Mazos", "Decks"], torneos: ["Torneos", "Events"] };
  const veil = $("#veil"), veilT = $(".veil-t", veil), pill = $(".tab-pill");
  let current = null, ctx = null, busy = false;

  const movePill = instant => {
    const a = $(`.tab[data-go="${current}"]`); if (!a) return;
    const r = a.getBoundingClientRect(), p = a.parentNode.getBoundingClientRect(), sl = a.parentNode.scrollLeft;
    const props = { x: r.left - p.left + sl, width: r.width };
    if (hasGSAP && !instant && !REDUCED) gsap.to(pill, { ...props, duration: .7, ease: "expo.inOut" });
    else if (hasGSAP) gsap.set(pill, props);
    else { pill.style.width = r.width + "px"; pill.style.transform = `translateX(${props.x}px)`; }
    if (a.parentNode.scrollWidth > a.parentNode.clientWidth) a.scrollIntoView({ block: "nearest", inline: "center", behavior: instant ? "auto" : "smooth" });
  };
  addEventListener("resize", () => movePill(true));
  const setTitle = () => { document.title = current === "inicio" ? "Entropy TCG" : `${E.L(...TITLES[current])} | Entropy TCG`; };

  const mount = name => {
    $$(".page").forEach(p => p.hidden = p.dataset.page !== name);
    $$(".tab").forEach(t => t.removeAttribute("aria-current"));
    const tab = $(`.tab[data-go="${name}"]`); tab && tab.setAttribute("aria-current", "page");
    current = name; document.body.dataset.page = name;
    movePill(); setTitle();
    scrollTop();
    if (!hasGSAP) return;
    if (ctx) ctx.revert();
    const root = $(`#p-${name}`);
    ctx = gsap.context(() => (REDUCED ? commonReveals(root) : modules[name](root)), root);
    E.Field.setBase(name === "inicio" ? 0 : .04);
    E.Field.setChaos(0); E.Field.setAlpha(1);
    // refresh() restores the old scroll position; a new tab always starts at the top
    ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory("manual");
    requestAnimationFrame(() => { ScrollTrigger.refresh(); window.scrollTo(0, 0); });
    pageEnter(root);
  };

  /* Tab change: a slanted band sweeps across in the direction of travel (≈0.55s, faster when hopping
     tabs quickly). Clicks during a sweep are not ignored: the last one wins and runs right after. */
  let pending = null, lastSwitch = 0;
  const band = (lead, trail, dir) => {
    const W = innerWidth, H = innerHeight, S = H * .35;
    const X = x => (dir > 0 ? x : W - x);
    return `polygon(${X(trail)}px 0px, ${X(lead)}px 0px, ${X(lead - S)}px ${H}px, ${X(trail - S)}px ${H}px)`;
  };
  const go = (name, origin, after) => {
    if (!PAGES.includes(name)) name = "inicio";
    if (busy) { pending = [name, after]; return; }
    if (name === current) {
      // same tab (e.g. the logo while on Inicio): go back to the top
      window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
      if (after) after(); return;
    }
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
    if (!current || !hasGSAP || REDUCED) { mount(name); E.Field.morph(name, !current); if (after) after(); return; }
    busy = true;
    const now = performance.now(), quick = now - lastSwitch < 1200; lastSwitch = now;
    const dir = PAGES.indexOf(name) >= PAGES.indexOf(current) ? 1 : -1;
    const W = innerWidth, S = innerHeight * .35, END = W + S;
    const tIn = quick ? .2 : .28, tOut = quick ? .26 : .36;
    const s = { lead: 0, trail: 0 };
    veilT.textContent = "";
    E.Field.morph(name);
    const draw = () => { veil.style.clipPath = band(s.lead, s.trail, dir); };
    const tl = gsap.timeline({ onComplete: () => {
      clearTimeout(safety);
      busy = false; veil.style.clipPath = "polygon(0 0,0 0,0 0)";
      if (after) after();
      if (pending) { const [n, a] = pending; pending = null; go(n, null, a); }
    } })
      .to(s, { lead: END, duration: tIn, ease: "power3.in", onUpdate: draw })
      .add(() => mount(name))
      .to(s, { trail: END, duration: tOut, ease: "power3.out", onUpdate: draw });
    // if animation frames stall (background tab), finish the switch anyway
    const safety = setTimeout(() => tl.progress(1), 1200);
  };
  E.go = go;

  document.addEventListener("click", e => {
    const a = e.target.closest("[data-go]"); if (!a) return;
    e.preventDefault();
    go(a.dataset.go, { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 });
  });

  const route = (h, first) => {
    if (h.startsWith("c.")) {
      const id = h.slice(2).replace(/\.(\d+)$/, "/$1");
      go("cartas", null, () => E.openCard(id));
      return;
    }
    if (h.startsWith("mazo.")) {
      const ok = E.importDeck(h.slice(5));
      go("mazos", null, () => E.toast(ok ? E.L("Mazo cargado desde el enlace.", "Deck loaded from the link.") : E.L("El enlace del mazo no es válido.", "The deck link isn't valid."), ok));
      return;
    }
    if (!first && E.closeCard) E.closeCard();
    go(PAGES.includes(h) ? h : "inicio");
  };
  addEventListener("hashchange", () => {
    const h = location.hash.slice(1);
    if (h.startsWith("c.") && !$("#detail").hidden) return; // card navigation inside the dialog
    route(h);
  });

  /* ---------- language toggle ---------- */
  const langBtn = $("#langBtn");
  const setLangBtn = () => { langBtn.textContent = E.lang() === "es" ? "EN" : "ES"; };
  langBtn.addEventListener("click", () => E.setLang(E.lang() === "es" ? "en" : "es"));
  E.onLang(() => {
    setLangBtn(); setTitle(); movePill(true);
    $$("[data-words]").forEach(el => { if (el.offsetParent) splitWords(el); });
    if (hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
  });
  E.applyAttrs(); setLangBtn();

  /* ---------- motion toggle (footer) ---------- */
  const motionBtn = $("#motionBtn");
  const setMotionBtn = () => { motionBtn.textContent = REDUCED ? E.L("Activar animaciones", "Turn animations on") : E.L("Desactivar animaciones", "Turn animations off"); };
  motionBtn.addEventListener("click", () => E.setMotion(REDUCED));
  setMotionBtn(); E.onLang(setMotionBtn);

  route(location.hash.slice(1), true);
  E.Field.intro();
  if (document.fonts) document.fonts.ready.then(() => { movePill(true); hasGSAP && ScrollTrigger.refresh(); });
})();
