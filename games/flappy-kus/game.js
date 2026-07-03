/* ============================================================
   Flappy Kuş — oyun mantığı (canvas)
   Ortak yardımcılar (ses, kayıt, titreşim, tema) Tiklix
   çekirdeğinden gelir: assets/core.js
   ============================================================ */
(function () {
  "use strict";

  Tiklix.theme.init();

  var $ = function (id) { return document.getElementById(id); };
  var wrap = $("canvasWrap");
  var canvas = $("game");
  var ctx = canvas.getContext("2d");

  /* ---------- Ses düğmesi ---------- */
  function syncSound() {
    $("soundOn").classList.toggle("hidden", Tiklix.audio.muted);
    $("soundOff").classList.toggle("hidden", !Tiklix.audio.muted);
  }
  $("soundBtn").addEventListener("click", function () {
    Tiklix.audio.setMuted(!Tiklix.audio.muted);
    syncSound();
  });
  syncSound();

  /* ---------- Boyutlandırma ----------
     Fizik sabitleri k = yükseklik/600 ile ölçeklenir; böylece
     oyun her ekran boyutunda aynı hissettirir. */
  var W = 0, H = 0, k = 1, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth; H = wrap.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    k = H / 600;
    makeStars();
  }
  window.addEventListener("resize", resize);

  /* ---------- Durum ---------- */
  var S = {
    state: "ready",            /* ready | play | dying | over */
    score: 0,
    best: Tiklix.store.get("flappy-kus:best", 0),
    bird: { y: 0, vy: 0, wing: 0 },
    pipes: [],                 /* {x, gapY, passed} */
    t: 0
  };

  /* ---------- Sabitler (k ile ölçekli kullanılır) ---------- */
  var GRAVITY = 1750, FLAP = -430, BIRD_R = 13, BIRD_X = 0.3;
  var PIPE_W = 62, GROUND = 44;
  function gapSize() { return Math.max(168 - S.score * 1.2, 140); }
  function speed()   { return Math.min(160 + S.score * 2.2, 235); }

  /* ---------- Arka plan yıldızları ---------- */
  var stars = [];
  function makeStars() {
    stars = [];
    for (var i = 0; i < 42; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * (H - GROUND * k),
        r: Math.random() * 1.6 + .4,
        depth: Math.random() < .5 ? .25 : .55,   /* paralaks katmanı */
        a: Math.random() * .5 + .15
      });
    }
  }

  /* ---------- HUD ---------- */
  function syncHud() {
    $("score").textContent = S.score;
    $("best").textContent = S.best;
  }

  /* ---------- Oyun akışı ---------- */
  function reset() {
    S.score = 0;
    S.bird.y = H * .45; S.bird.vy = 0; S.bird.wing = 0;
    S.pipes = [];
    syncHud();
  }
  function start() {
    reset();
    S.state = "play";
    $("startScreen").classList.add("hidden");
    $("endScreen").classList.add("hidden");
    flap();
  }
  function flap() {
    S.bird.vy = FLAP * k;
    S.bird.wing = 1;
    Tiklix.audio.tone(520, .07, "sine", .08);
    Tiklix.vibrate(8);
  }
  function die() {
    S.state = "dying";
    S.bird.vy = Math.max(S.bird.vy, 60 * k);
    Tiklix.audio.wrong();
    Tiklix.vibrate([50, 40, 80]);
  }
  function gameOver() {
    S.state = "over";
    var isRecord = S.score > S.best;
    if (isRecord) { S.best = S.score; Tiklix.store.set("flappy-kus:best", S.best); }
    syncHud();
    $("endTitle").textContent = isRecord ? "Yeni rekor" : "Oyun bitti";
    $("finalScore").textContent = S.score;
    $("finalScore").classList.toggle("new-record", isRecord);
    $("bestEnd").textContent = "Rekor · " + S.best;
    $("endScreen").classList.remove("hidden");
    Tiklix.audio.over();
  }

  /* ---------- Güncelleme ---------- */
  function update(dt) {
    S.t += dt;
    var b = S.bird;

    if (S.state === "ready") {
      b.y = H * .45 + Math.sin(S.t * 2.4) * 9 * k;   /* bekleme salınımı */
      return;
    }
    if (S.state === "over") return;                  /* bitti: dünya donar */

    b.vy += GRAVITY * k * dt;
    b.y += b.vy * dt;
    b.wing = Math.max(0, b.wing - dt * 5);

    var groundY = H - GROUND * k;

    if (S.state === "dying") {
      if (b.y + BIRD_R * k >= groundY) { b.y = groundY - BIRD_R * k; gameOver(); }
      return;
    }

    /* Borular */
    var sp = speed() * k;
    S.pipes.forEach(function (p) { p.x -= sp * dt; });
    if (S.pipes.length && S.pipes[0].x < -PIPE_W * k) S.pipes.shift();
    var last = S.pipes[S.pipes.length - 1];
    if (!last || last.x < W - 215 * k) {
      var margin = 70 * k, g = gapSize() * k;
      S.pipes.push({
        x: W + PIPE_W * k,
        gapY: margin + Math.random() * (groundY - margin * 2 - g),
        passed: false
      });
    }

    /* Skor + çarpışma */
    var bx = W * BIRD_X, br = BIRD_R * k;
    for (var i = 0; i < S.pipes.length; i++) {
      var p = S.pipes[i], pw = PIPE_W * k, g2 = gapSize() * k;
      if (!p.passed && p.x + pw < bx) {
        p.passed = true; S.score++;
        syncHud();
        Tiklix.audio.tone(880, .08, "triangle", .09);
      }
      if (bx + br > p.x && bx - br < p.x + pw) {
        if (b.y - br < p.gapY || b.y + br > p.gapY + g2) { die(); return; }
      }
    }
    if (b.y - br < 0) { b.y = br; b.vy = 0; }
    if (b.y + br >= groundY) { b.y = groundY - br; die(); }
  }

  /* ---------- Çizim ---------- */
  function draw() {
    /* Gökyüzü */
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#151936");
    sky.addColorStop(1, "#0E1020");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* Yıldızlar (paralaks) */
    var drift = (S.state === "play" || S.state === "dying") ? speed() * k : 24 * k;
    stars.forEach(function (s) {
      s.x -= drift * s.depth / 60;
      if (s.x < -2) s.x = W + 2;
      ctx.globalAlpha = s.a;
      ctx.fillStyle = "#8E93A3";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    var groundY = H - GROUND * k;

    /* Borular */
    var pw = PIPE_W * k, lip = 9 * k, g = gapSize() * k;
    S.pipes.forEach(function (p) {
      var grad = ctx.createLinearGradient(p.x, 0, p.x + pw, 0);
      grad.addColorStop(0, "#4A56E2");
      grad.addColorStop(1, "#3A44B8");
      ctx.fillStyle = grad;
      rounded(p.x, -8, pw, p.gapY + 8, 8 * k); ctx.fill();
      rounded(p.x, p.gapY + g, pw, groundY - p.gapY - g + 8, 8 * k); ctx.fill();
      /* boru ağzı */
      ctx.fillStyle = "#5B67F5";
      rounded(p.x - lip / 2, p.gapY - 14 * k, pw + lip, 14 * k, 6 * k); ctx.fill();
      rounded(p.x - lip / 2, p.gapY + g, pw + lip, 14 * k, 6 * k); ctx.fill();
    });

    /* Zemin */
    ctx.fillStyle = "#0B0C16";
    ctx.fillRect(0, groundY, W, GROUND * k);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(0, groundY, W, 1);

    /* Kuş */
    var b = S.bird, bx = W * BIRD_X, br = BIRD_R * k;
    var angle = S.state === "ready" ? Math.sin(S.t * 2.4) * .08
      : Math.max(-.45, Math.min(1.25, b.vy / (450 * k)));
    ctx.save();
    ctx.translate(bx, b.y);
    ctx.rotate(angle);
    /* gövde */
    ctx.fillStyle = "#E0A63F";
    ctx.beginPath(); ctx.arc(0, 0, br, 0, 7); ctx.fill();
    /* kanat */
    ctx.fillStyle = "#B9822B";
    ctx.save();
    ctx.rotate(b.wing > .4 ? -.9 : .15);
    ctx.beginPath(); ctx.ellipse(-br * .25, br * .25, br * .62, br * .4, 0, 0, 7); ctx.fill();
    ctx.restore();
    /* göz */
    ctx.fillStyle = "#EDEEF3";
    ctx.beginPath(); ctx.arc(br * .42, -br * .3, br * .3, 0, 7); ctx.fill();
    ctx.fillStyle = "#14172A";
    ctx.beginPath(); ctx.arc(br * .52, -br * .3, br * .14, 0, 7); ctx.fill();
    /* gaga */
    ctx.fillStyle = "#F0546C";
    ctx.beginPath();
    ctx.moveTo(br * .8, br * .05);
    ctx.lineTo(br * 1.45, br * .28);
    ctx.lineTo(br * .72, br * .5);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    /* Canlı skor */
    if (S.state === "play" || S.state === "dying") {
      ctx.font = "700 " + Math.round(46 * k) + "px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(237,238,243,.85)";
      ctx.fillText(S.score, W / 2, 74 * k);
    }
  }
  function rounded(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- Döngü ---------- */
  var lastTs = 0;
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, .05);   /* sekme geri gelince sıçramayı önle */
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", function () { lastTs = 0; });

  /* ---------- Girdi ---------- */
  function onTap(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (S.state === "play") flap();
  }
  wrap.addEventListener("pointerdown", onTap);
  document.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      if (S.state === "ready") start();
      else onTap();
    }
  });

  $("startBtn").addEventListener("click", start);
  $("retryBtn").addEventListener("click", start);
  $("shareBtn").addEventListener("click", function () {
    var text = "Flappy Kuş'ta " + S.score + " boru geçtim. Sen de dene: " + location.href;
    if (navigator.share) {
      navigator.share({ title: "Tıklix — Flappy Kuş", text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  });

  /* Test/hata ayıklama kancası */
  window.__tflappy = { state: S, start: start, flap: flap };

  resize();
  reset();
  requestAnimationFrame(loop);
})();
