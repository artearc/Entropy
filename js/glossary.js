/* Keyword glossary + card-text rendering + hover/tap tooltips.
   Definitions follow the Beta 0.2 rulebook and the reminder text printed on the cards. */
(() => {
  const E = window.E;

  // key: [es, en]
  const G = {
    "Haste": ["Puede moverse el mismo turno en que se despliega.", "This can move the turn it deploys."],
    "Fast": ["Como acción táctica, avanza hasta dos casillas en la misma dirección.", "As a tactical action, this moves up to two steps in the same direction."],
    "Fast Attack": ["Inflige su daño de batalla antes que el resto, en el subpaso de daño rápido.", "This deals battle damage first, in the Fast Damage substep."],
    "Swift": ["Puede moverse en diagonal como acción táctica.", "This can move diagonally as a tactical action."],
    "Taunt": ["Una unidad enemiga adyacente debe hacer un movimiento que la trabe con esta durante sus Tácticas, si puede.", "An adjacent enemy unit must take a move that engages this during its controller's Tactics, if able."],
    "Hold Back": ["No puede moverse ni desplegarse en casillas enemigas.", "This cannot move or deploy into enemy tiles."],
    "Remains": ["Remains X: al morir, se gira boca abajo y se convierte en una estructura con integridad X.", "Remains X: when this would die, turn it face down into a structure with X integrity."],
    "Mourning": ["Mourning X: cuando sale del campo, las unidades aliadas que comparten un tipo con ella retroceden X casillas.", "Mourning X: when this leaves the field, friendly units sharing a type with it move X steps backwards."],
    "Aggressive": ["Cuando se traba con una unidad enemiga, esa casilla combate en ese momento.", "When this engages an enemy unit, that tile battles."],
    "Frenzy": ["Inflige daño a la base también durante el turno rival.", "This deals base damage also during the enemy's turn."],
    "Regeneration": ["El daño no letal que recibe se reduce a 0.", "Non-lethal damage dealt to this is reduced to 0."],
    "Indestructible": ["Ignora los efectos de destrucción, incluido el daño letal. Sacrificar no es destruir.", "Destruction effects on this are ignored, including lethal damage. Sacrifice is not destruction."],
    "Retaliate": ["Cuando una unidad le hace daño de batalla, esta le devuelve la misma cantidad.", "When a unit deals battle damage to this, deal that much damage to that unit."],
    "Absorb": ["Absorb X: cuando recibe daño, Populate X.", "Absorb X: when this receives damage, Populate X."],
    "Stealth": ["No puede ser objetivo. La casilla que ocupa sí.", "This cannot be targeted. The tile it occupies still can."],
    "Conquest": ["Cuando destruye una unidad enemiga en batalla, avanza una casilla.", "When this destroys an enemy unit in battle, move it one step."],
    "Overrun": ["Overrun X: cuando destruye una unidad o estructura en batalla, hace X de daño a la estructura o base defensora.", "Overrun X: when this destroys an enemy unit or structure in battle, it deals X damage to the defending structure or base."],
    "Impact": ["Impact X: al entrar en una casilla ocupada, hace X de daño a los activos enemigos que haya.", "Impact X: when this moves into an occupied tile, it deals X damage to enemy assets there."],
    "Barrier": ["Barrier X: los eventos y acciones que la eligen como objetivo cuestan X de energía más.", "Barrier X: events and actions targeting this cost X more energy."],
    "Terror": ["Las unidades en su línea de visión no pueden moverse.", "Units in line of sight of this cannot move."],
    "Lethal": ["Cualquier daño que haga a una unidad cuenta como letal.", "Any damage this deals to a unit is treated as lethal."],
    "Upkeep": ["Coste que se paga en el paso de Preparación. Si no lo pagas, sacrificas el activo.", "A cost paid during the Preparation Step, otherwise this asset is sacrificed."],
    "Trespass": ["Entrar en una casilla enemiga vacía desde una casilla aliada.", "Move into an empty enemy tile from a friendly tile."],
    "Invade": ["Entrar en una casilla trasera enemiga vacía.", "Move into an empty enemy back tile."],
    "Return": ["Entrar en una casilla trasera aliada vacía.", "Move into an empty friendly back tile."],
    "Repeal": ["Devolver un activo a la mano de su propietario.", "Return an asset to its owner's hand."],
    "Deplete": ["Deplete X: poner X cartas de cualquiera de los dos mazos en el Waste.", "Deplete X: put X cards from either deck into the Waste."],
    "Populate": ["Populate X: sumar X de población repartida entre tus bases.", "Populate X: add X population points among friendly bases."],
    "Depopulate": ["Depopulate X: restar X de población repartida entre tus bases.", "Depopulate X: subtract X population points among friendly bases."],
    "Anchored": ["No puede moverse ni ser desplazada por ningún efecto.", "This cannot move or be displaced by any effect."],
    "Immobile": ["No puede moverse con una acción táctica, pero los efectos sí pueden desplazarla.", "This cannot move by tactical action; effects can still displace it."],
    "Intimidate": ["Las unidades con menos fuerza que esta no pueden entrar en su casilla.", "Units with less power than this cannot move into its tile."],
    "Permanence": ["No puede ser destruida, sacrificada ni enviada al Void.", "This cannot be destroyed, sacrificed or voided."],
    "Forward Deployment": ["Se despliega en las casillas delanteras.", "This deploys into forward tiles."],
    "Back Deployment": ["Se despliega en tu línea trasera.", "This deploys into your back line."],
    "Chaining": ["El efecto empieza en una casilla y salta en cadena a casillas adyacentes ocupadas.", "The effect starts on one tile and jumps in a chain to adjacent occupied tiles."],
    "Negative Entropy": ["Mientras este activo esté en juego, modifica tu estado de entropía en esa cantidad.", "While this asset is in play, your Entropy State is modified by this amount."],
    "Flip": ["Dar la vuelta a un Source Aspect. No sale del Domain.", "Turn over a Source Aspect. It does not leave the Domain."],
    "Search": ["Revisar un mazo buscando una carta. Después siempre se baraja.", "Look through a deck for a card. The deck is always shuffled afterwards."],
    "Void": ["Enviar una carta o activo a la zona Void, fuera de la partida.", "Put a card or asset into the Void zone."],
    "Sacrifice": ["Enviar un activo propio al Waste como coste o efecto. No es destruir.", "Put your own asset into the Waste, usually as a cost. It is not destruction."],
    "Destroy": ["Enviar un activo al Waste. El daño letal destruye.", "Put an asset into the Waste. Lethal damage destroys."],
    "Steal": ["Steal X: coger hasta X de energía de la reserva rival y añadirla a la tuya.", "Steal X: take up to X energy from the enemy reserve and add it to yours."],
    "Marker": ["Una característica que se coloca en una casilla. Algunas cartas solo afectan a casillas marcadas.", "A feature placed on a tile. Some cards only affect marked tiles."],
    "Unique": ["Solo puede haber un activo en juego con ese nombre. Si coinciden varios, van al Void.", "Only one asset with this name can be in play. If several occur, they are voided."],
    "Sudden": ["Se puede jugar siempre que tengas prioridad, también fuera de la fase de Despliegue.", "This can be played any time you have priority, including outside Deployment."],
    "Attachment": ["Un aspecto que se juega unido a otro aspecto de tu Domain. Si ese sale, este se destruye.", "An aspect played bound to another aspect in your Domain. If that one leaves, this is destroyed."],
    "Packet": ["Contador de energía almacenada en un aspecto Supply. Se gasta para pagar costes.", "A counter of stored energy on a Supply aspect. It can be spent to pay costs."],
    "Main Draw": ["Robar de la cima del Main Deck.", "Take cards from the top of the Main Deck."],
    "Source Draw": ["Robar de la cima del Source Deck.", "Take cards from the top of the Source Deck."],
    "Draw": ["Draw N: coge N cartas de la cima de tus dos mazos, una a una, en la combinación que quieras.", "Draw N: take N cards from the top of either deck, one by one, in any combination."],
    "Discard": ["Poner una carta de tu mano en el Waste.", "Put a card from your hand into the Waste."],
    "Cancel": ["Quitar una carta o acción de la pila antes de que se resuelva.", "Remove a card or action from the stack before it resolves."],
    "Exterminate": ["Eliminar una base por completo.", "Eliminate a base entirely."]
  };
  E.GLOSS = G;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  E.esc = esc;

  const keys = Object.keys(G).sort((a, b) => b.length - a.length);
  const byLower = Object.fromEntries(keys.map(k => [k.toLowerCase(), k]));
  const RE = new RegExp("\\b(" + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(s|es|ed|d|ing)?\\b", "gi");
  E.findKey = s => byLower[String(s).toLowerCase()] || null;

  const COLOR_NAME = { r: ["roja", "red"], g: ["verde", "green"], b: ["azul", "blue"], n: ["neutral", "neutral"], l: ["luz", "light"], d: ["oscuridad", "dark"] };
  E.pip = p => {
    const c = p[0], m = p[1];
    const mod = m === "+" ? " lt" : m === "-" ? " dk" : "";
    return `<i class="pip ${c}${mod}" aria-hidden="true"></i>`;
  };
  E.pips = arr => (arr || []).map(E.pip).join("");
  E.pipsText = arr => (arr || []).map(p => {
    const n = E.L(COLOR_NAME[p[0]][0], COLOR_NAME[p[0]][1]);
    return p[1] === "+" ? E.L(`${n} (luz)`, `${n} (light)`) : p[1] === "-" ? E.L(`${n} (oscuridad)`, `${n} (dark)`) : n;
  }).join(", ");

  const PIPW = { Red: "r", Green: "g", Blue: "b", Neutral: "n", Light: "l", Dark: "d" };
  E.linkify = text => {
    let h = esc(text).replace(/ \/ /g, "<br>");
    h = h.replace(/\((\d) (Red|Green|Blue|Light|Dark|Neutral)\)/g, (m, n, c) => E.pip(PIPW[c]).repeat(+n))
         .replace(/\((Red|Green|Blue|Light|Dark|Neutral)\)/g, (m, c) => E.pip(PIPW[c]));
    return h.split(/(<[^>]+>)/).map(part => part.startsWith("<") ? part : part.replace(RE, (m, k) => {
      if (k.toLowerCase() === "return" && m[0] !== "R") return m; // "return it to hand" is not the keyword
      return `<button type="button" class="kw" data-k="${byLower[k.toLowerCase()]}">${m}</button>`;
    })).join("");
  };

  /* ---------- tooltip ---------- */
  const tip = document.createElement("div");
  tip.id = "tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
  document.body.appendChild(tip);
  let cur = null;
  const place = el => {
    const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    const left = Math.min(Math.max(12, r.left + r.width / 2 - tw / 2), innerWidth - tw - 12);
    let top = r.top - th - 10;
    if (top < 12) top = r.bottom + 10;
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };
  const show = el => {
    const k = E.findKey(el.dataset.k);
    if (!k) return;
    const [es, en] = G[k];
    tip.innerHTML = `<b>${esc(k)}</b><span>${esc(E.L(es, en))}</span>`;
    tip.hidden = false; place(el);
    if (cur && cur !== el) cur.removeAttribute("aria-describedby");
    cur = el; el.setAttribute("aria-describedby", "tip");
  };
  const hide = () => { tip.hidden = true; if (cur) cur.removeAttribute("aria-describedby"); cur = null; };
  E.hideTip = hide;
  document.addEventListener("pointerover", e => { const el = e.target.closest && e.target.closest(".kw"); if (el && e.pointerType === "mouse") show(el); });
  document.addEventListener("pointerout", e => { const el = e.target.closest && e.target.closest(".kw"); if (el && e.pointerType === "mouse" && !el.contains(e.relatedTarget)) hide(); });
  document.addEventListener("focusin", e => { if (e.target.classList && e.target.classList.contains("kw")) show(e.target); });
  document.addEventListener("focusout", e => { if (e.target.classList && e.target.classList.contains("kw")) hide(); });
  document.addEventListener("click", e => {
    const el = e.target.closest && e.target.closest(".kw");
    if (el) { if (cur === el && !tip.hidden) hide(); else show(el); }
    else if (!(e.target.closest && e.target.closest("#tip"))) hide();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !tip.hidden) hide(); });
  addEventListener("scroll", () => { if (cur) hide(); }, { passive: true });
  E.onLang(() => { if (cur) show(cur); });
})();
