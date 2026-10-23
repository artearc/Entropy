/* Persistent WebGL particle field: one ordered shape per tab, dissolving into entropy on scroll. */
(() => {
  const E = window.E;
  const REDUCED = E.REDUCED;
  const hasGSAP = typeof gsap !== "undefined";
  const canvas = document.getElementById("field");
  const noop = { morph() {}, intro() {}, setChaos() {}, setBase() {}, setAlpha() {}, pause() {} };
  if (typeof THREE === "undefined" || !canvas) { E.Field = noop; return; }

  const mobile = innerWidth < 760;
  const N = mobile ? 7000 : 14000;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch (e) { E.Field = noop; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rectEdge = (w, h) => {
    const t = rnd() * 2 * (w + h);
    if (t < w) return [-w / 2 + t, -h / 2];
    if (t < w + h) return [w / 2, -h / 2 + (t - w)];
    if (t < 2 * w + h) return [w / 2 - (t - w - h), h / 2];
    return [-w / 2, h / 2 - (t - 2 * w - h)];
  };

  const shapes = {};
  shapes.inicio = (() => {
    const L = window.LOGO_PTS || [], a = new Float32Array(N * 3), n = L.length / 2 || 1;
    for (let i = 0; i < N; i++) {
      const j = (i % n) * 2;
      a[i * 3] = (L[j] || (rnd() - .5)) + (rnd() - .5) * 0.01;
      a[i * 3 + 1] = (L[j + 1] || (rnd() - .5)) + (rnd() - .5) * 0.01;
      a[i * 3 + 2] = (rnd() - .5) * 0.12;
    }
    return a;
  })();
  shapes.jugar = (() => {
    const a = new Float32Array(N * 3), tw = .5, th = .62, gx = .58, gy = .7, cT = Math.cos(1.0), sT = Math.sin(1.0);
    for (let i = 0; i < N; i++) {
      const c = Math.floor(rnd() * 5), r = Math.floor(rnd() * 4);
      const cx = (c - 2) * gx, cy = (r - 1.5) * gy + (r > 1 ? -.05 : .05);
      let [x, y] = rnd() < .82 ? rectEdge(tw, th) : [(rnd() - .5) * tw, (rnd() - .5) * th];
      const X = cx + x, Y = cy + y;
      a[i * 3] = X * 1.05; a[i * 3 + 1] = Y * cT * 1.05; a[i * 3 + 2] = Y * sT;
    }
    return a;
  })();
  shapes.cartas = (() => {
    const a = new Float32Array(N * 3), w = .82, h = 1.15;
    for (let i = 0; i < N; i++) {
      const k = Math.floor(rnd() * 5), ang = (k - 2) * 0.24;
      let [x, y] = rnd() < .72 ? rectEdge(w, h) : [(rnd() - .5) * w * .86, (rnd() - .5) * h * .9];
      y += 1.65;
      const cs = Math.cos(-ang), sn = Math.sin(-ang);
      a[i * 3] = x * cs - y * sn; a[i * 3 + 1] = x * sn + y * cs - 1.55; a[i * 3 + 2] = k * .06 - .12 + (rnd() - .5) * .02;
    }
    return a;
  })();
  // A deck seen at an angle: stacked card outlines rising off the table
  shapes.mazos = (() => {
    const a = new Float32Array(N * 3), w = .95, h = 1.33, layers = 14;
    for (let i = 0; i < N; i++) {
      const k = Math.floor(Math.pow(rnd(), .6) * layers);
      let [x, y] = (k === layers - 1 || rnd() < .55) ? rectEdge(w, h) : (rnd() < .5 ? [(rnd() - .5) * w, -h / 2] : [w / 2, (rnd() - .5) * h]);
      if (k === layers - 1 && rnd() < .35) { x = (rnd() - .5) * w * .9; y = (rnd() - .5) * h * .9; }
      const off = k * .045;
      const ry = -0.5, rx = 0.55;
      let X = x + off * .55, Y = y + off, Z = k * .02;
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const x1 = X * cy + Z * sy, z1 = -X * sy + Z * cy;
      const y2 = Y * cx - z1 * sx, z2 = Y * sx + z1 * cx;
      a[i * 3] = x1; a[i * 3 + 1] = y2 - .25; a[i * 3 + 2] = z2;
    }
    return a;
  })();
  shapes.torneos = (() => {
    const a = new Float32Array(N * 3), cT = Math.cos(1.05), sT = Math.sin(1.05);
    for (let i = 0; i < N; i++) {
      const r = Math.pow(rnd(), .7) * 1.9, arm = Math.floor(rnd() * 3);
      const th = arm * 2.094 + r * 2.6 + (rnd() - .5) * (.25 + r * .12);
      const x = Math.cos(th) * r, y = Math.sin(th) * r;
      a[i * 3] = x; a[i * 3 + 1] = y * cT + (rnd() - .5) * .06; a[i * 3 + 2] = y * sT;
    }
    return a;
  })();

  const geo = new THREE.BufferGeometry();
  const from = new Float32Array(shapes.inicio), to = new Float32Array(shapes.inicio);
  const rs = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) rs[i] = rnd();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute("aFrom", new THREE.BufferAttribute(from, 3));
  geo.setAttribute("aTo", new THREE.BufferAttribute(to, 3));
  geo.setAttribute("aRnd", new THREE.BufferAttribute(rs, 4));

  const U = {
    uT: { value: 1 }, uTime: { value: 0 }, uChaos: { value: 1.6 }, uBurst: { value: 0 },
    uPix: { value: renderer.getPixelRatio() * innerHeight * .5 }, uSize: { value: mobile ? .024 : .022 },
    uMouse: { value: new THREE.Vector2(99, 99) }, uMouseOn: { value: 0 }, uAlpha: { value: 0 },
    uOffFrom: { value: new THREE.Vector3() }, uOffTo: { value: new THREE.Vector3() },
    uScFrom: { value: 1 }, uScTo: { value: 1 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aFrom; attribute vec3 aTo; attribute vec4 aRnd;
      uniform float uT,uTime,uChaos,uBurst,uPix,uSize,uMouseOn,uScFrom,uScTo;
      uniform vec3 uOffFrom,uOffTo; uniform vec2 uMouse;
      varying float vA; varying vec3 vC;
      float eio(float t){ return t<.5 ? 4.*t*t*t : 1.-pow(-2.*t+2.,3.)/2.; }
      void main(){
        float t = eio(clamp((uT - aRnd.x*.4)/.6, 0., 1.));
        vec3 p = mix(aFrom*uScFrom + uOffFrom, aTo*uScTo + uOffTo, t);
        vec3 dir = normalize(aRnd.yzw - .5 + 1e-4);
        p += dir * sin(t*3.14159) * (.7 + 1.8*aRnd.x) * uBurst;
        float c = uChaos * (.25 + 1.3*aRnd.y);
        p += c * vec3(sin(uTime*.21 + aRnd.x*31. + p.y*1.3), cos(uTime*.17 + aRnd.y*27. + p.x*1.1), sin(uTime*.15 + aRnd.z*23.)) * 1.25;
        p += dir * .01 * sin(uTime*1.6 + aRnd.w*40.);
        vec2 m = p.xy - uMouse; float md = length(m);
        p.xy += (m/(md+1e-3)) * smoothstep(.75, 0., md) * .32 * uMouseOn;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (.45 + aRnd.z*1.2) * uPix / -mv.z;
        vec3 col = vec3(.93,.91,.88);
        float k = aRnd.w;
        if (k > .9) col = vec3(1.,.38,.22); else if (k > .85) col = vec3(.98,.26,.46);
        else if (k > .79) col = vec3(.3,.52,1.); else if (k > .76) col = vec3(1.,.74,.32);
        vC = col; vA = (.45 + .75*aRnd.y) * (1. - .45*min(c,1.));
      }`,
    fragmentShader: `
      varying float vA; varying vec3 vC; uniform float uAlpha;
      void main(){ float r = length(gl_PointCoord - .5); float a = smoothstep(.5, .05, r); gl_FragColor = vec4(vC, a*vA*uAlpha); }`
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  const group = new THREE.Group();
  group.add(pts); scene.add(group);

  let halfW = 2, halfH = 2, current = "inicio", chaosBase = 0, chaosScroll = 0, paused = false;
  const place = name => {
    const narrow = innerWidth < 760, tight = innerWidth < 1100;
    const xr = narrow ? 0 : (tight ? .5 : .46);
    return {
      inicio: { x: halfW * xr, y: narrow ? halfH * .5 : 0, s: narrow ? .56 : 1.4 },
      jugar: { x: halfW * (narrow ? 0 : .5), y: narrow ? halfH * .45 : .35, s: narrow ? .5 : .66 },
      cartas: { x: halfW * xr, y: narrow ? halfH * .4 : .15, s: narrow ? .55 : .9 },
      mazos: { x: halfW * (narrow ? 0 : .5), y: narrow ? halfH * .42 : .2, s: narrow ? .5 : .9 },
      torneos: { x: halfW * xr, y: narrow ? halfH * .42 : .15, s: narrow ? .66 : 1 }
    }[name];
  };
  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(22.5)) * 5; halfW = halfH * camera.aspect;
    U.uPix.value = renderer.getPixelRatio() * h * .5;
    const c = place(current);
    U.uOffTo.value.set(c.x, c.y, 0); U.uScTo.value = c.s;
    if (U.uT.value >= 1) { U.uOffFrom.value.copy(U.uOffTo.value); U.uScFrom.value = c.s; }
  };
  addEventListener("resize", resize); resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0, wx: 99, wy: 99 };
  addEventListener("pointermove", e => {
    mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = -(e.clientY / innerHeight * 2 - 1);
    mouse.wx = mouse.tx * halfW; mouse.wy = mouse.ty * halfH;
    U.uMouseOn.value = e.pointerType === "mouse" ? 1 : 0;
  }, { passive: true });

  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener("visibilitychange", () => visible = !document.hidden);
  const loop = () => {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05);
    if (!visible || paused) return;
    U.uTime.value += REDUCED ? 0 : dt;
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    group.rotation.y = mouse.x * .22 + (REDUCED ? 0 : Math.sin(U.uTime.value * .15) * .06);
    group.rotation.x = -mouse.y * .12;
    U.uMouse.value.set(mouse.wx, mouse.wy);
    U.uChaos.value += (chaosBase + chaosScroll - U.uChaos.value) * (REDUCED ? 1 : .045);
    renderer.render(scene, camera);
  };
  loop();

  const morph = (name, instant) => {
    if (!shapes[name]) return;
    from.set(to);
    U.uOffFrom.value.copy(U.uOffTo.value); U.uScFrom.value = U.uScTo.value;
    to.set(shapes[name]);
    geo.getAttribute("aFrom").needsUpdate = true; geo.getAttribute("aTo").needsUpdate = true;
    current = name;
    const c = place(name);
    U.uOffTo.value.set(c.x, c.y, 0); U.uScTo.value = c.s;
    if (instant || REDUCED || !hasGSAP) { U.uT.value = 1; U.uBurst.value = 0; return; }
    U.uT.value = 0;
    gsap.killTweensOf(U.uT); gsap.killTweensOf(U.uBurst);
    gsap.to(U.uT, { value: 1, duration: 1.4, ease: "none" });
    gsap.fromTo(U.uBurst, { value: 0 }, { value: .7, duration: 1.4, ease: "none" });
  };
  const intro = () => {
    if (!hasGSAP || REDUCED) { U.uAlpha.value = 1; U.uChaos.value = 0; return; }
    gsap.to(U.uAlpha, { value: 1, duration: 1.6, ease: "power2.out" });
    U.uChaos.value = 2.2;
  };
  E.Field = {
    morph, intro,
    setChaos: v => { chaosScroll = v; },
    setBase: v => { chaosBase = v; },
    setAlpha: v => { canvas.style.opacity = v; },
    pause: v => { paused = v; }
  };
})();
