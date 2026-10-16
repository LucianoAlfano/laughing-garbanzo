/* ===========================================================
   NextDay Digital — ambient backgrounds, themed cursors, click bursts
   Theme is detected from the page's theme-*.css link, so one file
   serves every page. No dependencies, no tracking, no assets.

   Backgrounds are per-theme "scenes" with depth parallax, flow-field
   motion and sprite-cached glows. Quality adapts to the device.
   =========================================================== */
(function () {
  'use strict';
  if (window.__ndFx) return;
  window.__ndFx = true;

  var root = document.documentElement;
  var link = document.querySelector('link[rel="stylesheet"][href*="theme-"]');
  var found = link && /theme-([a-z]+)\.css/.exec(link.getAttribute('href'));
  var theme = found ? found[1] : 'nextday';
  root.setAttribute('data-fx', theme);

  var motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  var fineQuery   = matchMedia('(hover: hover) and (pointer: fine)');
  var reduce = motionQuery.matches;
  var fine   = fineQuery.matches;

  var TAU = Math.PI * 2, R = Math.random;
  function rand(a, b) { return a + R() * (b - a); }
  function pick(a) { return a[(R() * a.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- colours ---------- */
  var SECOND = {
    restaurant: [217, 184, 106], landscape: [150, 190, 120], auto: [200, 214, 208],
    bakery: [236, 186, 120], fitness: [255, 106, 94], salon: [232, 170, 185],
    contractor: [90, 140, 200], professional: [176, 141, 68], nextday: [160, 205, 110]
  };
  var col = { a: [128, 128, 128], f: [20, 20, 20], w: SECOND[theme] || [180, 180, 180], bg: [245, 244, 238] };
  var dark = false, colourKey = '';

  function parse(v) {
    v = (v || '').trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
    if (!m) {
      var r = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(v);
      return r ? [+r[1], +r[2], +r[3]] : null;
    }
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function luma(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function C(k) { return k === 'a' ? col.a : k === 'f' ? col.f : col.w; }
  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + clamp(a, 0, 1).toFixed(3) + ')';
  }
  function readColors() {
    var cs = getComputedStyle(root);
    col.a = parse(cs.getPropertyValue('--accent')) || col.a;
    col.f = parse(cs.getPropertyValue('--fg')) || col.f;
    col.bg = parse(cs.getPropertyValue('--bg')) || col.bg;
    dark = luma(col.bg) < 0.45;
    var key = col.a.join() + col.f.join() + col.bg.join();
    if (key !== colourKey) { colourKey = key; sprites = {}; tiles = {}; }
  }

  /* ---------- cheap value noise, for wind and silk ---------- */
  var SEEDS = new Float32Array(256);
  for (var si = 0; si < 256; si++) SEEDS[si] = R();
  function hash2(x, y) { return SEEDS[((x * 73 + y * 151) % 256 + 256) % 256]; }
  function noise(x, y) {
    var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    var a = hash2(x0, y0), b = hash2(x0 + 1, y0), c = hash2(x0, y0 + 1), d = hash2(x0 + 1, y0 + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function flow(x, y, t) { return (noise(x * 0.0013, y * 0.0013 + t * 0.00007) - 0.5) * TAU * 1.6; }

  /* ===========================================================
     CURSORS — 48×48 artwork, tools drawn upright then rotated
     so the working end points to the top-left hotspot.
     =========================================================== */
  var TILT = 'transform="rotate(-45 24 24)"';
  var CURSORS = {
    restaurant: { hs: [9, 9], svg: // fork
      '<g ' + TILT + '><path class="fx-sb" stroke-width="2.4" stroke-linecap="round" d="M19 3v10M24 3v10M29 3v10M19 12.5c0 4.5 2.2 6.5 5 6.5s5-2 5-6.5"/>' +
      '<rect class="fx-a" x="21.6" y="18.5" width="4.8" height="27" rx="2.4"/></g>' },
    landscape: { hs: [9, 9], svg: // pruning shears
      '<g ' + TILT + '><path class="fx-b fx-blade-a" d="M22.5 25 L19 4.5 Q21 2.5 23.8 4.6 L25.6 25 Z"/>' +
      '<path class="fx-b fx-blade-b" d="M25.5 25 L29 4.5 Q27 2.5 24.2 4.6 L22.4 25 Z"/>' +
      '<path class="fx-sa" stroke-width="3.2" stroke-linecap="round" d="M23 25 L17 36 M25 25 L31 36"/>' +
      '<circle class="fx-sa" stroke-width="3" cx="15.5" cy="40" r="4.3"/><circle class="fx-sa" stroke-width="3" cx="32.5" cy="40" r="4.3"/>' +
      '<circle class="fx-a" cx="24" cy="25" r="2.1"/></g>' },
    contractor: { hs: [9, 9], svg: // hammer
      '<g ' + TILT + '><rect class="fx-a" x="21.5" y="12" width="5" height="33" rx="2.2"/>' +
      '<rect class="fx-b" x="11" y="3" width="22" height="9" rx="1.6"/><rect class="fx-b" x="7.5" y="4.2" width="4.5" height="6.6" rx="1"/>' +
      '<path class="fx-b" d="M32.5 4 q6.5 .8 7.8 5.6 l-2.2 .6 q-2-2.8-5.6-2.6z"/><rect class="fx-b" x="20.5" y="11" width="7" height="4" rx="1"/></g>' },
    auto: { hs: [9, 9], svg: // wrench
      '<g ' + TILT + '><path class="fx-sb" stroke-width="5" stroke-linecap="round" d="M19.2 4.2 A8 8 0 1 0 28.8 4.2"/>' +
      '<rect class="fx-b" x="21.5" y="17" width="5" height="28" rx="2.5"/><rect class="fx-a" x="21.5" y="33" width="5" height="10" rx="2"/></g>' },
    bakery: { hs: [9, 9], svg: // whisk
      '<g ' + TILT + '><g class="fx-sb" stroke-width="1.8"><path d="M24 22 C14 16 16 2 24 2 C32 2 34 16 24 22Z"/>' +
      '<path d="M24 22 C18.5 16 19.5 3 24 2 C28.5 3 29.5 16 24 22Z"/><path d="M24 22V2"/></g>' +
      '<rect class="fx-a" x="21.6" y="21" width="4.8" height="24" rx="2.4"/></g>' },
    fitness: { hs: [9, 9], svg: // dumbbell
      '<g ' + TILT + '><rect class="fx-b" x="22.6" y="6" width="2.8" height="36" rx="1.2"/>' +
      '<rect class="fx-a" x="15" y="3" width="18" height="6" rx="1.5"/><rect class="fx-a" x="17" y="9" width="14" height="4" rx="1.2"/>' +
      '<rect class="fx-a" x="17" y="35" width="14" height="4" rx="1.2"/><rect class="fx-a" x="15" y="39" width="18" height="6" rx="1.5"/></g>' },
    salon: { hs: [9, 9], svg: // comb
      '<g ' + TILT + '><rect class="fx-a" x="18" y="3" width="7" height="42" rx="3"/>' +
      '<path class="fx-sb" stroke-width="1.6" stroke-linecap="round" d="M25 6h6M25 9.5h6M25 13h6M25 16.5h6M25 20h6M25 23.5h6M25 27h6M25 30.5h6M25 34h6M25 37.5h6M25 41h6"/></g>' },
    professional: { hs: [9, 9], svg: // fountain pen
      '<g ' + TILT + '><path class="fx-a" d="M24 2 L18.5 15 H29.5 Z"/><path class="fx-sb" stroke-width="1.1" d="M24 6.5v7"/>' +
      '<rect class="fx-b" x="18.5" y="15" width="11" height="29" rx="4"/><rect class="fx-a" x="18.5" y="20" width="11" height="2.5"/></g>' },
    nextday: { hs: [8, 6], svg: // pointer
      '<path class="fx-a" d="M8 6 L8 37 L16.5 29 L22 41.5 L27.5 39 L22 27 L33.5 27 Z"/>' }
  };

  var cursorEl = null, hx = 0, hy = 0;
  if (fine) {
    var def = CURSORS[theme] || CURSORS.nextday;
    var SIZE = 40;
    hx = def.hs[0] * SIZE / 48;
    hy = def.hs[1] * SIZE / 48;
    cursorEl = document.createElement('div');
    cursorEl.className = 'fx-cursor';
    cursorEl.setAttribute('aria-hidden', 'true');
    cursorEl.style.setProperty('--fx-hx', hx + 'px');
    cursorEl.style.setProperty('--fx-hy', hy + 'px');
    cursorEl.innerHTML = '<div class="fx-cursor-hover"><div class="fx-cursor-inner">' +
      '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">' + def.svg + '</svg></div></div>';
    document.body.appendChild(cursorEl);
    root.classList.add('fx-has-cursor');

    var mx = -100, my = -100, moveRaf = 0, clickTimer = 0;
    var NATIVE = 'input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select,[contenteditable="true"]';
    var HOVER = 'a,button,summary,label,[role="button"],.tcard,.card,.theme-card';
    function place() {
      moveRaf = 0;
      cursorEl.style.transform = 'translate3d(' + (mx - hx) + 'px,' + (my - hy) + 'px,0)';
    }
    addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      pointer.tx = (mx / Math.max(1, W)) * 2 - 1;
      pointer.ty = (my / Math.max(1, H)) * 2 - 1;
      pointer.px = mx; pointer.py = my; pointer.live = true;
      cursorEl.classList.add('is-visible');
      if (!moveRaf) moveRaf = requestAnimationFrame(place);
      var t = e.target && e.target.closest ? e.target : null;
      var native = !!(t && t.closest(NATIVE));
      cursorEl.classList.toggle('is-native', native);
      cursorEl.classList.toggle('is-hover', !native && !!(t && t.closest(HOVER)));
    }, { passive: true });
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) { cursorEl.classList.remove('is-visible'); pointer.live = false; }
    });
    addEventListener('pointerdown', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (e.button !== 0) return;
      cursorEl.classList.remove('is-click');
      void cursorEl.offsetWidth;
      cursorEl.classList.add('is-click');
      clearTimeout(clickTimer);
      clickTimer = setTimeout(function () { cursorEl.classList.remove('is-click'); }, 520);
    }, { passive: true });
  }

  /* ===========================================================
     CANVASES
     =========================================================== */
  var bg = document.createElement('canvas');
  bg.className = 'fx-bg';
  bg.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(bg, document.body.firstChild);

  var fx = document.createElement('canvas');
  fx.className = 'fx-burst';
  fx.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fx);

  var ctx = bg.getContext && bg.getContext('2d');
  var fctx = fx.getContext && fx.getContext('2d');
  if (!ctx || !fctx) { bg.remove(); fx.remove(); return; }

  var W = 1, H = 1, DPR = 1, parts = [], sparks = [], extras = [], burstDirty = false;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -999, py: -999, live: false };
  var scrollShift = 0, scrollTarget = 0;

  /* ---------- sprite caches (far cheaper than per-frame gradients) ---------- */
  var sprites = {}, tiles = {};
  function glowSprite(c, soft) {
    var key = c.join('_') + (soft ? 's' : 'h');
    if (sprites[key]) return sprites[key];
    var size = 128, cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var g = cv.getContext('2d');
    if (!g) return null;
    var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, rgba(c, 1));
    grd.addColorStop(soft ? 0.45 : 0.22, rgba(c, soft ? 0.34 : 0.5));
    grd.addColorStop(1, rgba(c, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    sprites[key] = cv;
    return cv;
  }
  function glow(x, y, r, c, a, soft) {
    if (!(r > 0) || !(a > 0)) return;
    var s = glowSprite(c, soft);
    if (!s) return;
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  }
  function carbonTile() {
    if (tiles.carbon) return tiles.carbon;
    var s = 18, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    var g = cv.getContext('2d');
    if (!g) return null;
    g.fillStyle = rgba(col.f, dark ? 0.16 : 0.05);
    g.fillRect(0, 0, s / 2, s / 2);
    g.fillRect(s / 2, s / 2, s / 2, s / 2);
    g.fillStyle = rgba(col.w, dark ? 0.05 : 0.03);
    g.fillRect(s / 2, 0, s / 2, s / 2);
    g.fillRect(0, s / 2, s / 2, s / 2);
    tiles.carbon = cv;
    return cv;
  }

  /* ---------- shape helpers ---------- */
  function leafShape(c, x, y, s, rot, squash, fill, rib) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(clamp(squash, 0.12, 1), 1);
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(0, -s);
    c.quadraticCurveTo(s * 0.78, 0, 0, s);
    c.quadraticCurveTo(-s * 0.78, 0, 0, -s);
    c.fill();
    if (rib) {
      c.strokeStyle = fill;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(0, -s);
      c.lineTo(0, s * 1.25);
      c.stroke();
    }
    c.restore();
  }
  function starShape(c, x, y, s, rot, fill, points) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = fill;
    c.beginPath();
    var n = (points || 4) * 2;
    for (var i = 0; i < n; i++) {
      var r = i % 2 ? s * 0.3 : s * 1.45, a = i * Math.PI / (n / 2);
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    c.restore();
  }
  function ring(c, x, y, r, colour, alpha, width) {
    if (!(r > 0)) return;
    c.strokeStyle = rgba(colour, alpha);
    c.lineWidth = width || 1.4;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.stroke();
  }

  /* ===========================================================
     SCENES — one ambient composition per theme
     =========================================================== */
  var SYS = {

    /* Candlelight: layered bokeh, drifting embers, breathing vignette */
    restaurant: {
      density: 20, additive: true,
      spawn: function (p, init) {
        p.depth = R();
        p.r = rand(40, 150) * (0.55 + p.depth);
        p.x = rand(-60, W + 60);
        p.y = init ? rand(-40, H + 40) : H + p.r;
        p.vx = rand(-0.06, 0.06);
        p.vy = -rand(0.05, 0.2) * (0.5 + p.depth);
        p.al = rand(0.05, 0.13) * (0.45 + p.depth);
        p.ph = rand(0, TAU);
        p.ck = R() < 0.62 ? 'w' : 'a';
        p.ember = R() < 0.3;
        if (p.ember) { p.r = rand(1.6, 3.4); p.al = rand(0.4, 0.9); p.vy = -rand(0.25, 0.75); }
      },
      step: function (p, dt, t) {
        p.x += (p.vx + Math.sin(t * 0.0005 + p.ph) * 0.14) * dt;
        p.y += p.vy * dt;
      },
      paint: function (p, t) {
        var flicker = 0.62 + 0.38 * Math.sin(t * (p.ember ? 0.012 : 0.0011) + p.ph);
        if (p.ember) {
          glow(p.rx, p.ry, p.r * 5, C(p.ck), p.al * flicker * 0.5, true);
          ctx.fillStyle = rgba(C(p.ck), p.al * flicker);
          ctx.beginPath();
          ctx.arc(p.rx, p.ry, p.r, 0, TAU);
          ctx.fill();
          return;
        }
        glow(p.rx, p.ry, p.r, C(p.ck), p.al * flicker, true);
      },
      backdrop: function (t) {
        var big = Math.max(W, H);
        glow(W * 0.22 + Math.sin(t * 0.00012) * 70, H * 0.3, big * 0.42, col.w, dark ? 0.1 : 0.06, true);
        glow(W * 0.8 + Math.cos(t * 0.0001) * 60, H * 0.78, big * 0.34, col.a, dark ? 0.08 : 0.05, true);
      }
    },

    /* Garden wind: flow-field leaves that flutter, seeds, soft sun shafts */
    landscape: {
      density: 26,
      spawn: function (p, init) {
        p.depth = R();
        p.seed = R() < 0.42;
        p.s = (p.seed ? rand(1.4, 2.8) : rand(6, 15)) * (0.6 + p.depth * 0.7);
        p.x = init ? rand(0, W) : rand(-80, W * 0.7);
        p.y = init ? rand(0, H) : rand(-120, -20);
        p.vy = (p.seed ? rand(0.12, 0.3) : rand(0.22, 0.6)) * (0.6 + p.depth);
        p.vx = rand(0.02, 0.22);
        p.rot = rand(0, TAU);
        p.vr = rand(-0.02, 0.02);
        p.ph = rand(0, TAU);
        p.al = rand(0.12, 0.26) * (0.5 + p.depth * 0.8);
        p.ck = R() < 0.55 ? 'a' : 'w';
      },
      step: function (p, dt, t) {
        var angle = flow(p.x, p.y, t);
        var gust = 0.45 + 0.55 * noise(t * 0.0004, p.depth * 7);
        p.x += (Math.cos(angle) * 0.9 * gust + p.vx + Math.sin(t * 0.0009 + p.ph) * 0.3) * dt;
        p.y += (p.vy + Math.sin(angle) * 0.35) * dt;
        p.rot += p.vr * dt;
      },
      paint: function (p, t) {
        var fill = rgba(C(p.ck), p.al);
        if (p.seed) {
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(p.rx, p.ry, p.s, 0, TAU);
          ctx.fill();
          return;
        }
        leafShape(ctx, p.rx, p.ry, p.s, p.rot, Math.abs(Math.cos(t * 0.0022 + p.ph)) * 0.85 + 0.15, fill, true);
      },
      backdrop: function (t) {
        if (!rich) return;
        for (var i = 0; i < 3; i++) {
          var x = W * (0.12 + i * 0.33) + Math.sin(t * 0.00008 + i) * 60;
          var g = ctx.createLinearGradient(x, -40, x + W * 0.22, H + 40);
          var a = (0.05 + 0.03 * Math.sin(t * 0.0003 + i * 2)) * (dark ? 0.8 : 1);
          g.addColorStop(0, rgba(col.w, 0));
          g.addColorStop(0.45, rgba(col.w, a));
          g.addColorStop(1, rgba(col.w, 0));
          ctx.fillStyle = g;
          ctx.fillRect(x - W * 0.12, -40, W * 0.3, H + 80);
        }
      }
    },

    /* Detailing bay: carbon weave, specular sweeps, metallic flake */
    auto: {
      density: 30, additive: true,
      spawn: function (p, init) {
        p.depth = R();
        p.flake = R() < 0.7;
        p.s = p.flake ? rand(0.8, 2.2) : rand(2, 4);
        p.x = rand(0, W);
        p.y = init ? rand(0, H) : rand(-40, H);
        p.vx = rand(-0.05, 0.05);
        p.vy = rand(-0.05, 0.05);
        p.ph = rand(0, TAU);
        p.al = rand(0.25, 0.75);
        p.ck = R() < 0.45 ? 'a' : 'w';
      },
      step: function (p, dt) { p.x += p.vx * dt; p.y += p.vy * dt; },
      paint: function (p, t) {
        var twinkle = Math.pow(Math.abs(Math.sin(t * 0.0016 + p.ph)), 6);
        var a = p.al * (0.1 + twinkle);
        if (twinkle > 0.45 && rich) starShape(ctx, p.rx, p.ry, p.s * 1.6, t * 0.0005 + p.ph, rgba(C(p.ck), a * 0.8), 4);
        ctx.fillStyle = rgba(C(p.ck), a);
        ctx.beginPath();
        ctx.arc(p.rx, p.ry, p.s, 0, TAU);
        ctx.fill();
      },
      backdrop: function (t) {
        var tile = carbonTile();
        if (tile && rich) {
          var pat = ctx.createPattern(tile, 'repeat');
          if (pat) {
            ctx.save();
            ctx.translate(-((t * 0.004) % 18), -((t * 0.002) % 18));
            ctx.fillStyle = pat;
            ctx.fillRect(0, 0, W + 24, H + 24);
            ctx.restore();
          }
        }
        for (var i = 0; i < 3; i++) {
          var span = W + H;
          var pos = ((t * 0.045 + i * span / 3) % (span * 1.5)) - span * 0.25;
          var g = ctx.createLinearGradient(pos - 160, -80, pos + 160, H + 80);
          var c = i === 1 ? col.a : col.w;
          g.addColorStop(0, rgba(c, 0));
          g.addColorStop(0.5, rgba(c, dark ? 0.1 : 0.06));
          g.addColorStop(1, rgba(c, 0));
          ctx.fillStyle = g;
          ctx.fillRect(pos - 200, -80, 400, H + 160);
        }
      },
      overlay: function (t) {
        var y = (t * 0.08) % (H + 160) - 80;
        var g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
        g.addColorStop(0, rgba(col.a, 0));
        g.addColorStop(0.5, rgba(col.a, dark ? 0.07 : 0.04));
        g.addColorStop(1, rgba(col.a, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, y - 60, W, 120);
      }
    },

    /* Warm kitchen: oven glow, flour motes, rising steam ribbons */
    bakery: {
      density: 54,
      spawn: function (p, init) {
        p.depth = R();
        p.s = rand(0.8, 2.6) * (0.6 + p.depth);
        p.x = rand(0, W);
        p.y = init ? rand(0, H) : H + 12;
        p.vy = -rand(0.07, 0.3) * (0.5 + p.depth);
        p.ph = rand(0, TAU);
        p.al = rand(0.16, 0.42);
        p.ck = R() < 0.7 ? 'w' : 'a';
      },
      step: function (p, dt, t) {
        p.y += p.vy * dt;
        p.x += (Math.sin(t * 0.0007 + p.ph) * 0.24 + (noise(p.x * 0.004, t * 0.0005) - 0.5) * 0.5) * dt;
      },
      paint: function (p) {
        ctx.fillStyle = rgba(C(p.ck), p.al);
        ctx.beginPath();
        ctx.arc(p.rx, p.ry, p.s, 0, TAU);
        ctx.fill();
      },
      backdrop: function (t) {
        var big = Math.max(W, H);
        glow(W * 0.16 + Math.sin(t * 0.00022) * 60, H * 0.26, big * 0.38, col.w, dark ? 0.12 : 0.09, true);
        glow(W * 0.86 + Math.cos(t * 0.00017) * 70, H * 0.8, big * 0.3, col.a, dark ? 0.1 : 0.07, true);
      },
      overlay: function (t) {
        if (!rich) return;
        for (var i = 0; i < 3; i++) {
          var baseX = W * (0.2 + i * 0.3);
          ctx.beginPath();
          for (var k = 0; k <= 16; k++) {
            var prog = k / 16;
            var y = H - prog * H * 0.95;
            var x = baseX + Math.sin(prog * 3.4 + t * 0.0009 + i * 1.7) * (28 + prog * 70) +
                    (noise(prog * 3 + i, t * 0.0004) - 0.5) * 40;
            if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgba(col.w, 0.05 + 0.02 * Math.sin(t * 0.0006 + i));
          ctx.lineWidth = 16;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
    },

    /* Training floor: speed streaks, chevrons and a heartbeat shockwave */
    fitness: {
      density: 22, additive: true,
      spawn: function (p, init) {
        p.depth = R();
        p.len = rand(60, 220) * (0.5 + p.depth);
        p.x = init ? rand(0, W) : W + rand(20, 420);
        p.y = rand(-20, H + 20);
        p.v = (rand(2.2, 5.2)) * (0.55 + p.depth);
        p.w = rand(1.2, 4) * (0.5 + p.depth);
        p.al = rand(0.07, 0.2) * (0.5 + p.depth);
        p.ck = R() < 0.7 ? 'a' : 'w';
      },
      step: function (p, dt) { p.x -= p.v * dt; },
      out: function (p) { return p.x < -p.len - 120; },
      paint: function (p) {
        var g = ctx.createLinearGradient(p.rx, p.ry, p.rx + p.len, p.ry);
        g.addColorStop(0, rgba(C(p.ck), 0));
        g.addColorStop(0.55, rgba(C(p.ck), p.al));
        g.addColorStop(1, rgba(C(p.ck), 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = p.w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.rx, p.ry);
        ctx.lineTo(p.rx + p.len, p.ry);
        ctx.stroke();
      },
      backdrop: function (t) {
        var beat = (t % 1150) / 1150;
        var pulse = Math.exp(-Math.pow((beat - 0.08) * 13, 2)) + 0.55 * Math.exp(-Math.pow((beat - 0.26) * 13, 2));
        glow(W * 0.78, H * 0.68, Math.max(W, H) * 0.46, col.a, 0.035 + 0.075 * pulse, true);
        if (!rich) return;
        ctx.lineWidth = 2;
        for (var i = 0; i < 7; i++) {
          var x = ((t * 0.06 + i * 190) % (W + 420)) - 210;
          ctx.strokeStyle = rgba(col.a, 0.05);
          ctx.beginPath();
          ctx.moveTo(x, H * 0.5 - 130);
          ctx.lineTo(x + 56, H * 0.5);
          ctx.lineTo(x, H * 0.5 + 130);
          ctx.stroke();
        }
      },
      beat: function (t) {
        extras.push({ kind: 'wave', x: W * 0.78, y: H * 0.68, r: 10, life: 1 });
      },
      interval: 1150
    },

    /* Quiet luxury: silk ribbons, petals and soft shimmer */
    salon: {
      density: 24,
      spawn: function (p, init) {
        p.depth = R();
        p.petal = R() < 0.5;
        p.r = (p.petal ? rand(5, 15) : rand(4, 16)) * (0.55 + p.depth * 0.8);
        p.x = rand(0, W);
        p.y = init ? rand(0, H) : H + 30;
        p.vy = -rand(0.1, 0.32) * (0.5 + p.depth);
        p.ph = rand(0, TAU);
        p.rot = rand(0, TAU);
        p.vr = rand(-0.01, 0.01);
        p.al = rand(0.1, 0.22) * (0.55 + p.depth * 0.7);
        p.ck = R() < 0.58 ? 'w' : 'a';
      },
      step: function (p, dt, t) {
        p.y += p.vy * dt;
        p.x += Math.sin(t * 0.0007 + p.ph) * 0.34 * dt;
        p.rot += p.vr * dt;
      },
      paint: function (p, t) {
        var c = C(p.ck);
        if (p.petal) {
          leafShape(ctx, p.rx, p.ry, p.r, p.rot, Math.abs(Math.cos(t * 0.0016 + p.ph)) * 0.8 + 0.2, rgba(c, p.al), false);
          return;
        }
        ring(ctx, p.rx, p.ry, p.r, c, p.al * 1.3, 1);
        glow(p.rx - p.r * 0.25, p.ry - p.r * 0.25, p.r * 1.1, c, p.al * 0.5, true);
      },
      overlay: function (t) {
        if (!rich) return;
        for (var i = 0; i < 3; i++) {
          ctx.beginPath();
          for (var k = 0; k <= 22; k++) {
            var prog = k / 22;
            var x = prog * (W + 160) - 80;
            var y = H * (0.26 + i * 0.26) +
                    Math.sin(prog * 3.1 + t * 0.00042 + i * 2.1) * (60 + i * 26) +
                    (noise(prog * 2.4 + i * 5, t * 0.00022) - 0.5) * 90;
            if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgba(i === 1 ? col.a : col.w, dark ? 0.1 : 0.075);
          ctx.lineWidth = 26 - i * 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
    },

    /* Blueprint: scrolling grid, self-drawing detail lines, survey marks */
    contractor: {
      density: 9,
      spawn: function (p, init) {
        p.depth = R();
        p.s = rand(10, 24) * (0.6 + p.depth);
        p.x = rand(0, W);
        p.y = init ? rand(0, H) : H + 40;
        p.vy = -rand(0.05, 0.16) * (0.5 + p.depth);
        p.rot = rand(0, TAU);
        p.vr = rand(-0.004, 0.004);
        p.al = rand(0.16, 0.32);
      },
      step: function (p, dt) { p.y += p.vy * dt; p.rot += p.vr * dt; },
      paint: function (p) {
        ctx.save();
        ctx.translate(p.rx, p.ry);
        ctx.rotate(p.rot);
        ctx.strokeStyle = rgba(col.a, p.al);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, p.s, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(-p.s * 1.5, 0); ctx.lineTo(p.s * 1.5, 0);
        ctx.moveTo(0, -p.s * 1.5); ctx.lineTo(0, p.s * 1.5);
        ctx.stroke();
        ctx.restore();
      },
      backdrop: function (t) {
        var step = 48, off = (t * 0.006) % step, i, x, y;
        ctx.lineWidth = 1;
        for (i = 0, x = -step + off; x < W + step; x += step, i++) {
          ctx.strokeStyle = rgba(col.w, i % 4 === 0 ? 0.12 : 0.055);
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (i = 0, y = -step + off; y < H + step; y += step, i++) {
          ctx.strokeStyle = rgba(col.w, i % 4 === 0 ? 0.12 : 0.055);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
      },
      overlay: function (t) {
        if (!rich) return;
        for (var i = 0; i < drafts.length; i++) {
          var d = drafts[i];
          var x2 = d.x1 + (d.x2 - d.x1) * d.draw, y2 = d.y1 + (d.y2 - d.y1) * d.draw;
          ctx.strokeStyle = rgba(col.a, 0.3 * d.fade);
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(x2, y2); ctx.stroke();
          if (d.draw > 0.02) {
            ctx.fillStyle = rgba(col.a, 0.5 * d.fade);
            ctx.fillRect(x2 - 2.5, y2 - 2.5, 5, 5);
          }
        }
      }
    },

    /* Ledger: ruled paper, drifting figures, a quietly growing chart */
    professional: {
      density: 18,
      spawn: function (p, init) {
        p.depth = R();
        p.s = rand(13, 30) * (0.6 + p.depth * 0.7);
        p.x = rand(0, W);
        p.y = init ? rand(0, H) : H + 30;
        p.vy = -rand(0.05, 0.15) * (0.5 + p.depth);
        p.ph = rand(0, TAU);
        p.ch = pick(['$', '%', '§', '¶', '+', '=', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
        p.al = rand(0.05, 0.1) * (0.6 + p.depth);
        p.ck = R() < 0.5 ? 'f' : 'w';
      },
      step: function (p, dt, t) {
        p.y += p.vy * dt;
        p.x += Math.sin(t * 0.0004 + p.ph) * 0.1 * dt;
      },
      paint: function (p) {
        ctx.fillStyle = rgba(C(p.ck), p.al);
        ctx.font = '300 ' + p.s.toFixed(0) + 'px Merriweather, Georgia, serif';
        ctx.fillText(p.ch, p.rx, p.ry);
      },
      backdrop: function (t) {
        var step = 34, off = (t * 0.008) % step;
        ctx.strokeStyle = rgba(col.f, 0.045);
        ctx.lineWidth = 1;
        for (var y = -off; y < H; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.strokeStyle = rgba(col.w, 0.16);
        ctx.beginPath(); ctx.moveTo(W * 0.07, 0); ctx.lineTo(W * 0.07, H); ctx.stroke();
      },
      overlay: function (t) {
        if (!rich || chart.points.length < 2) return;
        var n = chart.points.length;
        var shown = clamp(chart.progress, 0, 1) * (n - 1);
        var baseY = H * 0.82, spanY = H * 0.3, spanX = W * 0.76, startX = W * 0.12;
        ctx.beginPath();
        for (var i = 0; i < n; i++) {
          if (i > shown) break;
          var x = startX + (i / (n - 1)) * spanX;
          var y = baseY - chart.points[i] * spanY;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(col.a, 0.3 * chart.fade);
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        var last = Math.min(Math.floor(shown), n - 1);
        var lx = startX + (last / (n - 1)) * spanX, ly = baseY - chart.points[last] * spanY;
        glow(lx, ly, 26, col.a, 0.24 * chart.fade, true);
      }
    },

    /* Agency: aurora drift with a quiet constellation that follows the cursor */
    nextday: {
      density: 20, additive: true,
      spawn: function (p, init) {
        p.depth = R();
        p.s = rand(1.4, 3);
        p.x = rand(0, W);
        p.y = rand(0, H);
        p.vx = rand(-0.22, 0.22);
        p.vy = rand(-0.18, 0.18);
        p.al = rand(0.22, 0.5);
        p.ck = R() < 0.5 ? 'a' : 'w';
      },
      step: function (p, dt) {
        if (pointer.live) {
          var dx = pointer.px - p.x, dy = pointer.py - p.y, d2 = dx * dx + dy * dy;
          if (d2 > 1 && d2 < 52900) {
            var pull = 0.16 / Math.sqrt(d2);
            p.vx += dx * pull; p.vy += dy * pull;
          }
        }
        p.vx = clamp(p.vx * 0.994, -1.1, 1.1);
        p.vy = clamp(p.vy * 0.994, -1.1, 1.1);
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > W) { p.vx *= -1; p.x = clamp(p.x, 0, W); }
        if (p.y < 0 || p.y > H) { p.vy *= -1; p.y = clamp(p.y, 0, H); }
      },
      out: function () { return false; },
      paint: function (p) {
        ctx.fillStyle = rgba(C(p.ck), p.al);
        ctx.beginPath();
        ctx.arc(p.rx, p.ry, p.s, 0, TAU);
        ctx.fill();
      },
      backdrop: function (t) {
        var big = Math.max(W, H);
        for (var i = 0; i < 3; i++) {
          var x = W * (0.25 + 0.25 * i) + Math.sin(t * 0.00009 + i * 2.2) * W * 0.2;
          var y = H * (0.34 + 0.18 * Math.sin(t * 0.00013 + i)) ;
          glow(x, y, big * (0.3 + i * 0.07), i === 1 ? col.a : col.w, dark ? 0.1 : 0.07, true);
        }
      },
      overlay: function () {
        if (!rich) return;
        for (var i = 0; i < parts.length; i++) {
          for (var j = i + 1; j < parts.length; j++) {
            var a = parts[i], b = parts[j];
            var dx = a.rx - b.rx, dy = a.ry - b.ry, d2 = dx * dx + dy * dy;
            if (d2 > 34000) continue;
            ctx.strokeStyle = rgba(col.a, 0.16 * (1 - d2 / 34000));
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.rx, a.ry);
            ctx.lineTo(b.rx, b.ry);
            ctx.stroke();
          }
        }
      }
    }
  };

  var sys = SYS[theme] || SYS.nextday;
  var drafts = [], chart = { points: [], progress: 0, fade: 1, hold: 0 };

  function resetDrafts() {
    drafts = [];
    for (var i = 0; i < 4; i++) {
      drafts.push({
        x1: rand(0, W), y1: rand(0, H), x2: rand(0, W), y2: rand(0, H),
        draw: 0, speed: rand(0.004, 0.011), fade: 1, hold: rand(60, 220)
      });
    }
  }
  function resetChart() {
    chart.points = [];
    var v = rand(0.15, 0.4);
    for (var i = 0; i < 13; i++) {
      v = clamp(v + rand(-0.08, 0.16), 0.05, 1);
      chart.points.push(v);
    }
    chart.progress = 0;
    chart.fade = 1;
    chart.hold = 0;
  }

  function stepExtras(dt, t) {
    var i, d;
    if (theme === 'contractor') {
      if (!drafts.length) resetDrafts();
      for (i = 0; i < drafts.length; i++) {
        d = drafts[i];
        if (d.draw < 1) d.draw = Math.min(1, d.draw + d.speed * dt);
        else if (d.hold > 0) d.hold -= dt;
        else {
          d.fade -= 0.012 * dt;
          if (d.fade <= 0) {
            d.x1 = rand(0, W); d.y1 = rand(0, H);
            d.x2 = rand(0, W); d.y2 = rand(0, H);
            d.draw = 0; d.fade = 1; d.hold = rand(60, 220);
          }
        }
      }
    }
    if (theme === 'professional') {
      if (!chart.points.length) resetChart();
      if (chart.progress < 1) chart.progress += 0.0035 * dt;
      else if (chart.hold < 150) chart.hold += dt;
      else {
        chart.fade -= 0.01 * dt;
        if (chart.fade <= 0) resetChart();
      }
    }
    for (i = extras.length - 1; i >= 0; i--) {
      var e = extras[i];
      e.r += 3.4 * dt;
      e.life -= 0.016 * dt;
      if (e.life <= 0) extras.splice(i, 1);
    }
  }
  function paintExtras() {
    for (var i = 0; i < extras.length; i++) {
      var e = extras[i];
      ring(ctx, e.x, e.y, e.r, col.a, 0.3 * e.life, 2.5);
      ring(ctx, e.x, e.y, e.r * 0.62, col.w, 0.16 * e.life, 1.4);
    }
  }

  /* ===========================================================
     ENGINE
     =========================================================== */
  var quality = 1, rich = true, frameSamples = [], lastBeat = 0;

  function areaScale() {
    return clamp((W * H) / (1440 * 900), 0.4, 1.5);
  }
  function seed() {
    var count = Math.max(4, Math.round(sys.density * areaScale() * quality));
    parts = [];
    for (var i = 0; i < count; i++) {
      var p = {};
      sys.spawn(p, true);
      p.rx = p.x; p.ry = p.y;
      parts.push(p);
    }
    if (theme === 'contractor') resetDrafts();
    if (theme === 'professional') resetChart();
  }
  function outside(p) {
    var m = (p.r || p.s || p.len || 24) + 90;
    return p.x < -m || p.x > W + m || p.y < -m || p.y > H + m;
  }
  function project(p) {
    var depth = 0.35 + (p.depth || 0.5);
    p.rx = p.x + pointer.x * 26 * depth;
    p.ry = p.y + pointer.y * 18 * depth + scrollShift * depth * 0.35;
    if (!isFinite(p.rx)) p.rx = p.x;
    if (!isFinite(p.ry)) p.ry = p.y;
  }

  function drawBg(t, dt) {
    ctx.clearRect(0, 0, W, H);

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, 0.045 * dt);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, 0.045 * dt);
    scrollShift += (scrollTarget - scrollShift) * Math.min(1, 0.06 * dt);

    if (sys.backdrop) sys.backdrop(t);

    if (sys.interval && dt > 0 && t - lastBeat >= sys.interval) {
      lastBeat = t;
      if (sys.beat) sys.beat(t);
    }
    if (dt > 0) stepExtras(dt, t);

    if (sys.additive && dark) ctx.globalCompositeOperation = 'lighter';
    var move = sys.step, out = sys.out || outside;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (dt > 0 && move) {
        move(p, dt, t);
        if (out(p)) { sys.spawn(p, false); }
      }
      project(p);
      sys.paint(p, t);
    }
    ctx.globalCompositeOperation = 'source-over';

    paintExtras();
    if (sys.overlay) sys.overlay(t);
  }

  /* ===========================================================
     CLICK BURSTS
     =========================================================== */
  var BURST = {
    restaurant:   { shape: 'dot',      n: 12, ck: 'w', g: 0.05,  sp: [1, 3.2] },
    landscape:    { shape: 'leaf',     n: 9,  ck: 'a', g: 0.04,  sp: [1, 2.8] },
    contractor:   { shape: 'spark',    n: 16, ck: 'a', g: 0.13,  sp: [2, 5.4] },
    auto:         { shape: 'star',     n: 9,  ck: 'a', g: 0,     sp: [0.8, 2.6] },
    bakery:       { shape: 'confetti', n: 16, ck: 'w', g: 0.14,  sp: [1.2, 3.6] },
    fitness:      { shape: 'spark',    n: 12, ck: 'a', g: 0,     sp: [3, 6.4] },
    salon:        { shape: 'star',     n: 10, ck: 'a', g: -0.01, sp: [0.8, 2.4] },
    professional: { shape: 'dot',      n: 8,  ck: 'f', g: 0.08,  sp: [0.6, 2.2] },
    nextday:      { shape: 'dot',      n: 12, ck: 'a', g: 0,     sp: [1, 3.2] }
  };
  function burst(x, y) {
    if (reduce) return;
    var b = BURST[theme] || BURST.nextday;
    if (sparks.length > 220) sparks.splice(0, sparks.length - 220);
    sparks.push({ ring: true, x: x, y: y, r: 4, life: 1 });
    sparks.push({ ring: true, x: x, y: y, r: 0, life: 1, slow: true });
    var n = Math.max(4, Math.round(b.n * quality));
    for (var i = 0; i < n; i++) {
      var a = rand(0, TAU), s = rand(b.sp[0], b.sp[1]);
      sparks.push({
        x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: b.g,
        life: 1, decay: rand(0.016, 0.03), s: rand(2, 5.5),
        rot: rand(0, TAU), vr: rand(-0.26, 0.26), shape: b.shape, ck: b.ck
      });
    }
  }
  addEventListener('pointerdown', function (e) {
    if (e.button === 0 || (e.pointerType && e.pointerType !== 'mouse')) burst(e.clientX, e.clientY);
  }, { passive: true });

  function drawBurst(dt) {
    if (!sparks.length) {
      if (burstDirty) { fctx.clearRect(0, 0, W, H); burstDirty = false; }
      return;
    }
    burstDirty = true;
    fctx.clearRect(0, 0, W, H);
    if (dark) fctx.globalCompositeOperation = 'lighter';
    for (var i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i];
      if (p.ring) {
        p.r += (p.slow ? 1.1 : 2.6) * dt;
        p.life -= (p.slow ? 0.03 : 0.05) * dt;
      } else {
        p.vy += p.g * dt;
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= p.decay * dt;
      }
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      if (p.ring) {
        ring(fctx, p.x, p.y, p.r, p.slow ? col.w : col.a, p.life * (p.slow ? 0.3 : 0.55), p.slow ? 1 : 1.6);
        continue;
      }
      var fill = rgba(C(p.ck), p.life * 0.9);
      if (p.shape === 'leaf') leafShape(fctx, p.x, p.y, p.s * 1.6, p.rot, 0.7, fill, true);
      else if (p.shape === 'star') starShape(fctx, p.x, p.y, p.s, p.rot, fill, 4);
      else if (p.shape === 'confetti') {
        fctx.save();
        fctx.translate(p.x, p.y);
        fctx.rotate(p.rot);
        fctx.fillStyle = fill;
        fctx.fillRect(-p.s * 0.6, -p.s * 0.3, p.s * 1.2, p.s * 0.6);
        fctx.restore();
      } else if (p.shape === 'spark') {
        fctx.strokeStyle = fill;
        fctx.lineWidth = 2;
        fctx.lineCap = 'round';
        fctx.beginPath();
        fctx.moveTo(p.x, p.y);
        fctx.lineTo(p.x - p.vx * 3.2, p.y - p.vy * 3.2);
        fctx.stroke();
      } else {
        fctx.fillStyle = fill;
        fctx.beginPath();
        fctx.arc(p.x, p.y, p.s * 0.7, 0, TAU);
        fctx.fill();
      }
    }
    fctx.globalCompositeOperation = 'source-over';
  }

  /* ===========================================================
     QUALITY, LOOP, RESIZE, VISIBILITY
     =========================================================== */
  function tune(dt) {
    frameSamples.push(dt);
    if (frameSamples.length < 50) return;
    var total = 0;
    for (var i = 0; i < frameSamples.length; i++) total += frameSamples[i];
    var avg = total / frameSamples.length;
    frameSamples.length = 0;
    if (avg > 1.5 && quality > 0.45) { quality = Math.max(0.45, quality - 0.25); rich = quality >= 0.75; seed(); }
    else if (avg < 1.12 && quality < 1) { quality = Math.min(1, quality + 0.25); rich = quality >= 0.75; seed(); }
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, innerWidth);
    H = Math.max(1, innerHeight);
    [bg, fx].forEach(function (c) {
      c.width = Math.round(W * DPR);
      c.height = Math.round(H * DPR);
    });
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
    if (reduce) drawBg(0, 0);
  }

  var running = false, last = 0, handle = 0;
  function queue() { if (!handle) handle = requestAnimationFrame(frame); }
  function frame(now) {
    handle = 0;
    if (!running || reduce || document.hidden) return;
    var dt = clamp((now - last) / 16.667, 0, 3);
    last = now;
    tune(dt);
    drawBg(now, dt);
    drawBurst(dt);
    queue();
  }
  function start() {
    if (reduce || document.hidden) return;
    running = true;
    last = performance.now();
    queue();
  }
  function stop() { running = false; }

  var resizeTimer = 0;
  addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  addEventListener('scroll', function () {
    scrollTarget = clamp(scrollY * 0.03, -60, 60);
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  new MutationObserver(function () {
    readColors();
    if (reduce) drawBg(0, 0);
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  function motionChanged() {
    reduce = motionQuery.matches;
    sparks.length = 0;
    extras.length = 0;
    fctx.clearRect(0, 0, W, H);
    if (reduce) { stop(); drawBg(0, 0); } else start();
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', motionChanged);
  else if (motionQuery.addListener) motionQuery.addListener(motionChanged);

  try {
    if (navigator.connection && navigator.connection.saveData) { quality = 0.45; rich = false; }
  } catch (e) {}

  readColors();
  resize();
  start();
})();
