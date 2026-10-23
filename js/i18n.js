/* Languages: English (default), Spanish, French, Italian, German.
   - Markup carries English and Spanish side by side: <span lang="en">…</span><span lang="es">…</span>.
     CSS shows the Spanish ones only when <html data-src="es">.
   - French, Italian and German reuse the English elements and swap their content for the entry in
     window.I18N[lang] (js/locales/*.js), keyed by the English text.
   - Script strings go through E.L(es, en): Spanish returns es, English returns en, other languages
     look en up in the dictionary. Keys may contain {0}, {1}… placeholders for names and numbers. */
(() => {
  const E = (window.E = window.E || {});
  const LANGS = ["en", "es", "fr", "it", "de"];
  E.LANGS = LANGS;
  let lang = null;
  try { lang = localStorage.getItem("entropy.lang"); } catch (e) {}
  if (!LANGS.includes(lang)) lang = "en";

  // Motion is on by default; visitors can switch it off with the footer toggle (stored per browser).
  let motionOff = false;
  try { motionOff = localStorage.getItem("entropy.motion") === "off"; } catch (e) {}
  E.REDUCED = motionOff;
  document.documentElement.classList.toggle("reduce", motionOff);
  E.setMotion = on => {
    try { localStorage.setItem("entropy.motion", on ? "on" : "off"); } catch (e) {}
    location.reload();
  };

  /* ---------- dictionary lookup ---------- */
  const DICT = window.I18N || {};
  const norm = s => String(s).replace(/\s+/g, " ").trim();
  const templates = {};
  const compile = l => {
    if (templates[l]) return templates[l];
    const d = DICT[l] || {}, list = [];
    Object.keys(d).forEach(k => {
      if (!/\{\d\}/.test(k)) return;
      const order = [];
      const pat = k.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(\d)\}/g, (m, n) => { order.push(+n); return "([\\s\\S]*?)"; });
      list.push([new RegExp("^" + pat + "$"), order, d[k]]);
    });
    return (templates[l] = list);
  };
  const tr = (en, l = lang) => {
    if (l === "en" || l === "es" || en == null) return en;
    const d = DICT[l]; if (!d) return en;
    if (d[en] != null) return d[en];
    const nk = norm(en);
    if (d[nk] != null) return d[nk];
    for (const [re, order, val] of compile(l)) {
      const m = nk.match(re);
      if (m) { const v = {}; order.forEach((n, i) => { v[n] = m[i + 1]; }); return val.replace(/\{(\d)\}/g, (x, n) => (v[n] != null ? v[n] : x)); }
    }
    return en;
  };
  E.tr = tr;
  E.lang = () => lang;
  E.L = (es, en) => (lang === "es" ? es : lang === "en" ? en : tr(en));

  /* ---------- static markup ---------- */
  const ORIG = new WeakMap();
  const ATTRS = ["placeholder", "aria-label", "alt", "title"];
  const root = document.documentElement;
  // tag both language variants once, so switching never depends on the lang attribute we rewrite
  document.querySelectorAll('[lang="en"]:not(html)').forEach(el => el.classList.add("t-en"));
  document.querySelectorAll('[lang="es"]:not(html)').forEach(el => el.classList.add("t-es"));

  const applyStatic = () => {
    document.querySelectorAll(".t-en").forEach(el => {
      const words = el.hasAttribute("data-words");
      if (!ORIG.has(el)) ORIG.set(el, words ? el.textContent.trim() : el.innerHTML);
      const orig = ORIG.get(el);
      const out = lang === "en" || lang === "es" ? orig : tr(orig);
      if (words) { el.textContent = out; delete el.dataset.done; }
      else if (el.innerHTML !== out) el.innerHTML = out;
      el.setAttribute("lang", lang === "es" ? "en" : lang);
    });
    ATTRS.forEach(a => {
      document.querySelectorAll(`[data-en-${a}]`).forEach(el => {
        if (!el.hasAttribute(`data-es-${a}`)) el.setAttribute(`data-es-${a}`, el.getAttribute(a) || "");
        const en = el.getAttribute(`data-en-${a}`);
        el.setAttribute(a, lang === "es" ? el.getAttribute(`data-es-${a}`) : tr(en));
      });
    });
    root.lang = lang;
    root.dataset.src = lang === "es" ? "es" : "en";
  };
  E.applyAttrs = applyStatic;

  const subs = [];
  E.onLang = fn => subs.push(fn);
  E.setLang = l => {
    if (!LANGS.includes(l) || l === lang) return;
    lang = l;
    try { localStorage.setItem("entropy.lang", l); } catch (e) {}
    applyStatic();
    subs.forEach(fn => { try { fn(l); } catch (err) { console.error(err); } });
  };

  applyStatic();
})();
