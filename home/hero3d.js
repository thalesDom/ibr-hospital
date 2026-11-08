/* ═══════════════════════════════════════════════════════════
   IBR HOSPITAL — hero3d.js
   Hero com carrossel 3D (Three.js):
     • As fotos dos slides viram cartas 3D em profundidade — a da
       frente inclina com o mouse (reflexo + brilho), as outras
       aparecem empilhadas atrás; na troca a carta sai voando.
     • Brilho suave atrás, cor acompanha o slide.
     • Chips de vidro flutuando na frente.
   Lê as imagens direto dos slides (inclusive os vindos da API).
   Respeita prefers-reduced-motion, pausa fora da tela e, sem WebGL,
   a hero volta ao card 2D normal.
═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const hero = document.getElementById('hero');
  if (!hero) return;

  const canvas   = document.getElementById('hero3d');
  const slidesEl = document.getElementById('heroSlides');
  const reduce      = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isSmall     = () => innerWidth < 900;

  /* ── Chips de vidro ─────────────────────────────────────── */
  const CHIPS = `
    <div class="hero-chip hero-chip--a" aria-hidden="true">
      <span class="hero-chip-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/></svg></span>
      <span class="hero-chip-txt"><b>35+</b><small>anos de história</small></span>
    </div>
    <div class="hero-chip hero-chip--b" aria-hidden="true">
      <span class="hero-chip-ico hero-chip-ico--live"><i></i></span>
      <span class="hero-chip-txt"><b>24h</b><small>Pronto-Socorro</small></span>
    </div>`;

  function decorate() {
    document.querySelectorAll('.hero-visual').forEach(v => {
      if (!v.querySelector('.hero-chip')) v.insertAdjacentHTML('beforeend', CHIPS);
    });
  }
  // Chips desativados a pedido (decorate() não é mais chamado).

  /* ── Mouse ──────────────────────────────────────────────── */
  const st = { tx: 0, ty: 0, x: 0, y: 0 };
  const tiltOn = finePointer;
  if (tiltOn) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      st.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      st.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { st.tx = 0; st.ty = 0; });
  }

  let lastVars = '';
  function applyTilt() {
    const ry = (st.x * 9).toFixed(2);
    const rx = (-st.y * 6).toFixed(2);
    const gx = (50 + st.x * 38).toFixed(1);
    const gy = (40 + st.y * 38).toFixed(1);
    const key = ry + rx + gx + gy;
    if (key === lastVars) return;
    lastVars = key;
    hero.style.setProperty('--ry', ry);
    hero.style.setProperty('--rx', rx);
    hero.style.setProperty('--gx', gx);
    hero.style.setProperty('--gy', gy);
  }

  /* ── Three.js ───────────────────────────────────────────── */
  const THREE = window.THREE;
  let gl = null;

  if (canvas && THREE) {
    try { gl = initThree(); } catch (err) { gl = null; }
    if (!gl) { canvas.remove(); hero.classList.remove('has-3d'); }
  } else if (canvas) {
    canvas.remove();
  }

  function initThree() {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 14;
    const root = new THREE.Group();
    scene.add(root);

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const mod = (a, n) => ((a % n) + n) % n;

    /* ── Cores por slide ── */
    const BASE = new THREE.Color(0x3f97d3);
    const ACCENTS = [0xd4a843, 0xe05c4c, 0x38beba].map(c => new THREE.Color(c));
    const accent = BASE.clone();
    const tmp = new THREE.Color();

    /* ── Brilho e sombra ── */
    function radialTex(stops) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(s => grd.addColorStop(s[0], s[1]));
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const unitPlane = new THREE.PlaneGeometry(1, 1);
    const glow = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: radialTex([[0, 'rgba(255,255,255,.95)'], [0.45, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]),
      color: BASE.clone(), transparent: true, opacity: 0.1, depthWrite: false
    }));
    glow.renderOrder = -10;
    const shadow = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: radialTex([[0, 'rgba(13,32,68,.6)'], [1, 'rgba(13,32,68,0)']]),
      transparent: true, opacity: 0.45, depthWrite: false
    }));
    shadow.renderOrder = -9;
    root.add(glow, shadow);
    glow.visible = false; // o brilho azul formava um arco claro atrás da foto

    /* ── Shader das cartas: cantos arredondados, cover, brilho, borda ── */
    const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
    const FRAG = `
      precision highp float;
      uniform sampler2D uMap;
      uniform float uCardAspect, uImgAspect, uRadius, uOpacity, uDim, uTime, uMode, uShine;
      uniform vec2 uObj, uLight;
      uniform vec3 uAccent;
      varying vec2 vUv;
      float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main(){
        vec2 p = (vUv - 0.5) * vec2(uCardAspect, 1.0);
        float d = sdRound(p, vec2(uCardAspect * 0.5, 0.5), uRadius);
        float alpha = 1.0 - smoothstep(-0.0025, 0.0025, d);
        float ring = 1.0 - smoothstep(0.0, 0.006, abs(d + 0.003));
        vec3 col; float a;
        if (uMode < 0.5) {
          float r = uCardAspect / uImgAspect;
          vec2 sc = r > 1.0 ? vec2(1.0, 1.0 / r) : vec2(r, 1.0);
          vec2 t = vec2(vUv.x, 1.0 - vUv.y);
          vec2 tuv = t * sc + uObj * (1.0 - sc);
          col = texture2D(uMap, vec2(tuv.x, 1.0 - tuv.y)).rgb;
          col = mix(vec3(1.0), col, uDim);
          col *= mix(0.8, 1.0, smoothstep(0.0, 0.55, vUv.y));
          float s = smoothstep(0.8, 0.0, distance(vUv, uLight));
          col += vec3(1.0) * s * 0.17 * uShine;
          float x = vUv.x + vUv.y * 0.55;
          float band = smoothstep(0.1, 0.0, abs(x - (fract(uTime * 0.1) * 2.5 - 0.5)));
          col += vec3(1.0) * band * 0.07 * uShine;
          col = mix(col, vec3(1.0), ring * 0.34);
          a = alpha;
        } else {
          col = mix(vec3(0.3, 0.55, 0.85), uAccent, 0.35);
          a = alpha * 0.05 + ring * 0.5;
        }
        gl_FragColor = vec4(col, a * uOpacity);
      }`;

    const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat);
    blank.needsUpdate = true;

    function makeMat(mode) {
      return new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: blank }, uCardAspect: { value: 0.8 }, uImgAspect: { value: 1.5 },
          uObj: { value: new THREE.Vector2(0.5, 0.5) }, uRadius: { value: 0.058 },
          uOpacity: { value: 1 }, uDim: { value: 1 }, uTime: { value: 0 }, uShine: { value: 1 },
          uLight: { value: new THREE.Vector2(0.5, 0.5) }, uAccent: { value: new THREE.Color() },
          uMode: { value: mode }
        },
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, depthWrite: false, side: THREE.DoubleSide
      });
    }

    /* ── Cartas (uma por slide) ── */
    const loader = new THREE.TextureLoader();
    let cards = [];
    let N = 0, p = 0, target = 0, curIdx = 0;

    function disposeCards() {
      cards.forEach(c => {
        root.remove(c.mesh, c.glass);
        c.mesh.material.dispose();
        c.glass.material.dispose();
        if (c.tex) c.tex.dispose();
      });
      cards = [];
    }

    function parseObj(img) {
      const m = (getComputedStyle(img).objectPosition || '').match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
      return m ? [parseFloat(m[1]) / 100, parseFloat(m[2]) / 100] : [0.5, 0.5];
    }

    function activeIdx() {
      const a = hero.querySelector('.hero-slide.active');
      return a ? (+a.dataset.slide || 0) : 0;
    }

    function buildCards() {
      disposeCards();
      const imgs = Array.from(hero.querySelectorAll('.hero-slide .hero-visual-frame img'));
      N = imgs.length;
      if (!N) { hero.classList.remove('has-3d'); return; }

      let pending = N;
      const done = () => {
        if (--pending > 0) return;
        hero.classList.add('has-3d');
        canvas.classList.add('is-ready');
        layout();
        if (reduce) render(0);
      };

      imgs.forEach(img => {
        const mesh = new THREE.Mesh(unitPlane, makeMat(0));
        const glass = new THREE.Mesh(unitPlane, makeMat(1));
        const c = { mesh, glass, tex: null, loaded: false };
        const o = parseObj(img);
        mesh.material.uniforms.uObj.value.set(o[0], o[1]);
        mesh.material.uniforms.uOpacity.value = 0;
        glass.material.uniforms.uOpacity.value = 0;

        c.tex = loader.load(img.currentSrc || img.src, t => {
          t.minFilter = THREE.LinearFilter;
          t.generateMipmaps = false;
          t.anisotropy = maxAniso;
          mesh.material.uniforms.uMap.value = t;
          mesh.material.uniforms.uImgAspect.value = t.image.width / t.image.height;
          c.loaded = true;
          done();
        }, undefined, () => done());

        root.add(glass, mesh);
        cards.push(c);
      });

      curIdx = activeIdx();
      p = target = curIdx;
      layout();
    }

    /* ── Layout: ancora as cartas no lugar da moldura da foto ── */
    let W = 4, H = 5, cxw = 3, cyw = 0, halfW = 8, halfH = 5, upp = 0.01, ox1 = 0.3, oy1 = 0.4;

    function layout() {
      const w = hero.clientWidth, h = hero.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      halfH = visH / 2;
      halfW = halfH * camera.aspect;
      upp = visH / h;

      let cx = w * 0.5, cy = h * 0.5, fw = 340, fh = 420;
      const frame = hero.querySelector('.hero-slide.active .hero-visual-frame') || hero.querySelector('.hero-visual-frame');
      if (frame) {
        const hr = hero.getBoundingClientRect();
        const r = frame.getBoundingClientRect();
        if (r.width) {
          cx = r.left - hr.left + r.width / 2;
          cy = r.top - hr.top + r.height / 2;
          fw = r.width; fh = r.height;
        }
      }
      W = fw * upp; H = fh * upp;
      cxw = (cx - w / 2) * upp;
      cyw = -(cy - h / 2) * upp;

      const room = Math.max(0, halfW - (cxw + W / 2));
      ox1 = Math.min(W * 0.075, room * 0.6);
      oy1 = H * 0.075;

      glow.scale.set(W * 2.5, H * 1.9, 1);
      glow.position.set(cxw, cyw, -4);
      shadow.scale.set(W * 0.95, H * 0.17, 1);
      shadow.position.set(cxw, cyw - H * 0.6, -0.6);

      cards.forEach(c => {
        const a = W / H;
        c.mesh.material.uniforms.uCardAspect.value = a;
        c.glass.material.uniforms.uCardAspect.value = a;
      });
    }

    /* ── Animação ── */
    let raf = 0, last = performance.now(), time = 0;

    function render(dt) {
      time += dt;

      st.x += (st.tx - st.x) * 0.07;
      st.y += (st.ty - st.y) * 0.07;
      if (tiltOn) applyTilt();

      // slide ativo mudou? anda pelo caminho mais curto
      if (N) {
        const idx = activeIdx();
        if (idx !== curIdx) {
          let delta = mod(idx - curIdx + N / 2, N) - N / 2;
          if (Math.abs(delta) < 0.5) delta = 0;
          target += Math.round(delta);
          curIdx = idx;
        }
        p += (target - p) * (1 - Math.exp(-dt * 5.5));
        if (dt === 0) p = target;
      }

      // cor de destaque
      tmp.copy(ACCENTS[curIdx % ACCENTS.length]).lerp(BASE, 0.45);
      accent.lerp(tmp, Math.min(1, dt * 3));
      glow.material.color.copy(accent);
      glow.material.opacity = 0.1 + Math.sin(time * 0.8) * 0.02;

      const sway = reduce ? 0 : 1;

      for (let i = 0; i < N; i++) {
        const c = cards[i];
        const d = mod(i - p + 1, N) - 1;      // -1 (saindo) … 0 (frente) … N-1 (fundo)
        const u = c.mesh.material.uniforms;
        const g = c.glass.material.uniforms;
        const wFront = Math.max(0, 1 - Math.abs(d));

        let x, y, z, ry, rx = 0, op, dim;

        if (d >= 0) {
          z = -d * 1.3;
          const f = camera.position.z / (camera.position.z - z);
          x = (cxw + d * ox1 - st.x * 0.12 * d) / f;
          y = (cyw + d * oy1) / f;
          ry = -d * 0.08;
          op = (1 - 0.42 * Math.min(d, 1.5)) * clamp(N - 1 - d, 0, 1);
          dim = 1 - 0.4 * Math.min(d, 1.5);
        } else {
          const e = -d;
          x = cxw - e * W * 0.62;
          y = cyw + e * H * 0.06;
          z = e * 1.1;
          ry = e * 0.75;
          op = Math.pow(1 - e, 1.6);
          dim = 1;
        }

        ry += wFront * (st.x * 0.17 + Math.sin(time * 0.5 + i) * 0.03 * sway);
        rx = wFront * (st.y * 0.1 + Math.cos(time * 0.4 + i) * 0.02 * sway);
        y += Math.sin(time * 0.8 + i * 1.3) * 0.07 * sway * (0.4 + wFront);

        c.mesh.position.set(x, y, z);
        c.mesh.rotation.set(rx, ry, 0);
        c.mesh.scale.set(W, H, 1);
        c.mesh.renderOrder = Math.round(50 - d * 10);

        c.glass.position.set(x - st.x * 0.14 * wFront, y + st.y * 0.1 * wFront, z - 0.22);
        c.glass.rotation.set(rx, ry, 0);
        c.glass.scale.set(W * 1.05, H * 1.035, 1);
        c.glass.renderOrder = c.mesh.renderOrder - 1;

        const vis = c.loaded ? op : 0;
        u.uOpacity.value = vis;
        g.uOpacity.value = vis * 0.9;
        u.uDim.value = dim;
        u.uTime.value = time;
        u.uShine.value = wFront;
        u.uLight.value.set(0.5 + st.x * 0.45, 0.55 - st.y * 0.45);
        g.uAccent.value.copy(accent);
      }

      renderer.render(scene, camera);
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      render(dt);
    }
    function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
    function stop()  { cancelAnimationFrame(raf); raf = 0; }

    layout();
    buildCards();
    render(0);

    let rt = 0;
    new ResizeObserver(() => {
      clearTimeout(rt);
      rt = setTimeout(() => { layout(); if (reduce) render(0); }, 100);
    }).observe(hero);
    window.addEventListener('load', () => { layout(); if (reduce) render(0); });

    // Slides recarregados pela API → reconstrói as cartas
    let bt = 0;
    if (slidesEl) new MutationObserver(() => { clearTimeout(bt); bt = setTimeout(buildCards, 150); }).observe(slidesEl, { childList: true });

    let inView = true;
    new IntersectionObserver(es => {
      inView = es[0].isIntersecting;
      inView && !document.hidden ? start() : stop();
    }, { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', () => { document.hidden || !inView ? stop() : start(); });

    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); hero.classList.remove('has-3d'); });
    canvas.addEventListener('webglcontextrestored', () => { buildCards(); start(); });

    start();
    return { stop, start };
  }

  /* Sem WebGL: continua a inclinação 3D da foto em CSS */
  if (!gl && tiltOn) {
    let raf = 0;
    const tick = () => {
      st.x += (st.tx - st.x) * 0.08;
      st.y += (st.ty - st.y) * 0.08;
      applyTilt();
      raf = requestAnimationFrame(tick);
    };
    new IntersectionObserver(es => {
      cancelAnimationFrame(raf);
      if (es[0].isIntersecting) raf = requestAnimationFrame(tick);
    }).observe(hero);
  }
})();
