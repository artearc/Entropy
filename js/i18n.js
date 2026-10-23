/* Language switching.
   Static copy is written twice in the markup: <span lang="es">…</span><span lang="en">…</span>;
   CSS hides whichever language is not on <html lang>. Attributes use data-en-<attr>.
   Script-generated strings go through E.L(es, en) and re-render on E.onLang. */
(() => {
  const E = (window.E = window.E || {});
  const guess = () => ((navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en");
  let lang;
  try { lang = localStorage.getItem("entropy.lang") || guess(); } catch (e) { lang = guess(); }
  if (lang !== "es" && lang !== "en") lang = "es";
  document.documentElement.lang = lang;

  // Motion is on by default; visitors can switch it off with the footer toggle (stored per browser).
  let motionOff = false;
  try { motionOff = localStorage.getItem("entropy.motion") === "off"; } catch (e) {}
  E.REDUCED = motionOff;
  document.documentElement.classList.toggle("reduce", motionOff);
  E.setMotion = on => {
    try { localStorage.setItem("entropy.motion", on ? "on" : "off"); } catch (e) {}
    location.reload();
  };

  const subs = [];
  const ATTRS = ["placeholder", "aria-label", "alt", "title"];

  E.lang = () => lang;
  E.L = (es, en) => (lang === "en" ? en : es);
  E.onLang = fn => subs.push(fn);

  E.applyAttrs = (root = document) => {
    ATTRS.forEach(a => {
      root.querySelectorAll(`[data-en-${a}]`).forEach(el => {
        if (!el.hasAttribute(`data-es-${a}`)) el.setAttribute(`data-es-${a}`, el.getAttribute(a) || "");
        el.setAttribute(a, lang === "en" ? el.getAttribute(`data-en-${a}`) : el.getAttribute(`data-es-${a}`));
      });
    });
  };

  E.setLang = l => {
    if (l === lang) return;
    lang = l;
    document.documentElement.lang = l;
    try { localStorage.setItem("entropy.lang", l); } catch (e) {}
    E.applyAttrs();
    subs.forEach(fn => { try { fn(l); } catch (err) { console.error(err); } });
  };
})();
