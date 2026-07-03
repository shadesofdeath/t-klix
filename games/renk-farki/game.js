/* ============================================================
   Renk Farkı — oyun mantığı
   Ortak yardımcılar (ses, kayıt, titreşim, tema) Tiklix
   çekirdeğinden gelir: assets/core.js
   ============================================================ */
(function () {
  "use strict";

  Tiklix.theme.init();

  var S = {
    playing: false, level: 1, score: 0, combo: 1, lives: 3,
    oddIndex: -1, roundTime: 0, timeLeft: 0, raf: 0, lastTs: 0,
    best: Tiklix.store.get("renk-farki:best", 0)
  };

  var $ = function (id) { return document.getElementById(id); };
  var board = $("board"), timefill = $("timefill");

  /* ---------- Ses düğmesi ---------- */
  var soundBtn = $("soundBtn");
  function syncSound() {
    $("soundOn").classList.toggle("hidden", Tiklix.audio.muted);
    $("soundOff").classList.toggle("hidden", !Tiklix.audio.muted);
  }
  soundBtn.addEventListener("click", function () {
    Tiklix.audio.setMuted(!Tiklix.audio.muted);
    syncSound();
  });
  syncSound();

  /* ---------- Seviye eğrisi ---------- */
  function gridSize(lv) {          /* 2×2 → 6×6 */
    if (lv < 3) return 2;
    if (lv < 6) return 3;
    if (lv < 10) return 4;
    if (lv < 16) return 5;
    return 6;
  }
  function colorDelta(lv) {        /* açıklık farkı: %26 → %5 */
    return Math.max(26 - lv * 1.1, 5);
  }
  function roundSeconds(lv) {      /* tur süresi: 3.5 sn → 1.6 sn */
    return Math.max(3.5 - lv * 0.07, 1.6);
  }

  /* ---------- HUD ---------- */
  var livesEl = $("lives");
  livesEl.innerHTML = "<i></i><i></i><i></i>";
  function syncHud() {
    $("score").textContent = S.score;
    $("level").textContent = S.level;
    var c = $("combo");
    c.textContent = "×" + S.combo;
    c.classList.toggle("combo-hot", S.combo >= 4);
    Array.prototype.forEach.call(livesEl.children, function (dot, i) {
      dot.classList.toggle("off", i >= S.lives);
    });
  }

  /* ---------- Tur kurulumu ---------- */
  function newRound() {
    var n = gridSize(S.level);
    var total = n * n;
    S.oddIndex = Math.floor(Math.random() * total);

    var hue = Math.floor(Math.random() * 360);
    var sat = 60 + Math.floor(Math.random() * 24);
    var light = 42 + Math.floor(Math.random() * 18);
    var delta = colorDelta(S.level) * (Math.random() < 0.5 ? -1 : 1);
    var oddLight = Math.min(88, Math.max(12, light + delta));
    var base = "hsl(" + hue + "," + sat + "%," + light + "%)";
    var odd = "hsl(" + hue + "," + sat + "%," + oddLight + "%)";

    board.classList.remove("reveal");
    board.style.gridTemplateColumns = "repeat(" + n + ",1fr)";
    board.innerHTML = "";
    for (var i = 0; i < total; i++) {
      var t = document.createElement("button");
      t.className = "tile" + (i === S.oddIndex ? " odd" : "");
      t.style.background = i === S.oddIndex ? odd : base;
      t.dataset.i = i;
      board.appendChild(t);
    }

    S.roundTime = roundSeconds(S.level);
    S.timeLeft = S.roundTime;
    S.lastTs = 0;
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(tick);
  }

  /* ---------- Zamanlayıcı ---------- */
  function tick(ts) {
    if (!S.playing) return;
    if (!S.lastTs) S.lastTs = ts;
    var dt = (ts - S.lastTs) / 1000;
    S.lastTs = ts;
    if (!document.hidden) S.timeLeft -= dt;

    var ratio = Math.max(S.timeLeft / S.roundTime, 0);
    timefill.style.transform = "scaleX(" + ratio + ")";
    timefill.classList.toggle("low", ratio < 0.35);

    if (S.timeLeft <= 0) { loseLife(true); return; }
    S.raf = requestAnimationFrame(tick);
  }

  /* ---------- Etkileşim ---------- */
  board.addEventListener("pointerdown", function (e) {
    if (!S.playing) return;
    var t = e.target.closest(".tile");
    if (!t) return;
    if (+t.dataset.i === S.oddIndex) onCorrect(t); else onWrong(t);
  });

  function onCorrect(tile) {
    cancelAnimationFrame(S.raf);
    tile.classList.add("correct");
    Tiklix.audio.correct();
    Tiklix.vibrate(20);

    var timeBonus = Math.round((S.timeLeft / S.roundTime) * 10);
    var gained = (10 + timeBonus) * S.combo;
    S.score += gained;
    S.combo = Math.min(S.combo + 1, 9);
    flyScore(tile, "+" + gained);

    var prevSize = gridSize(S.level);
    S.level++;
    if (gridSize(S.level) !== prevSize) {
      toast("Seviye " + S.level + " — ızgara büyüdü");
      Tiklix.audio.level();
    }
    syncHud();
    setTimeout(newRound, 260);
  }

  function onWrong(tile) {
    tile.classList.add("wrong");
    Tiklix.audio.wrong();
    Tiklix.vibrate([40, 40, 40]);
    S.combo = 1;
    loseLife(false);
  }

  function loseLife(timedOut) {
    cancelAnimationFrame(S.raf);
    S.lives--;
    if (timedOut) { S.combo = 1; Tiklix.audio.wrong(); Tiklix.vibrate(80); }
    syncHud();
    if (S.lives <= 0) { gameOver(); return; }
    board.classList.add("reveal"); /* doğru kareyi kısaca göster */
    toast(timedOut ? "Süre doldu" : "Yanlış kare");
    setTimeout(newRound, 800);
  }

  /* ---------- Görsel geri bildirim ---------- */
  var toastTimer = 0;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 1100);
  }
  function flyScore(tile, text) {
    var wrap = board.parentElement;
    var r = tile.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    var f = document.createElement("span");
    f.className = "fly";
    f.textContent = text;
    f.style.left = (r.left - wr.left + r.width / 2 - 16) + "px";
    f.style.top = (r.top - wr.top) + "px";
    wrap.appendChild(f);
    setTimeout(function () { f.remove(); }, 660);
  }

  /* ---------- Oyun akışı ---------- */
  function start() {
    S.playing = true; S.level = 1; S.score = 0; S.combo = 1; S.lives = 3;
    $("startScreen").classList.add("hidden");
    $("endScreen").classList.add("hidden");
    syncHud();
    newRound();
  }

  function gameOver() {
    S.playing = false;
    cancelAnimationFrame(S.raf);
    Tiklix.audio.over();
    Tiklix.vibrate([60, 60, 120]);
    board.classList.add("reveal");

    var isRecord = S.score > S.best;
    if (isRecord) {
      S.best = S.score;
      Tiklix.store.set("renk-farki:best", S.best);
    }
    $("finalScore").textContent = S.score;
    $("finalScore").classList.toggle("new-record", isRecord);
    $("bestEnd").textContent = "Rekor · " + S.best;
    $("endTitle").textContent = isRecord ? "Yeni rekor" : "Oyun bitti";
    $("endMsg").textContent = "Seviye " + S.level + "'e ulaştın." +
      (isRecord ? "" : " Rekoru geçmek için tekrar dene.");
    $("endScreen").classList.remove("hidden");
  }

  $("bestStart").textContent = "Rekor · " + S.best;
  $("startBtn").addEventListener("click", start);
  $("retryBtn").addEventListener("click", start);

  $("shareBtn").addEventListener("click", function () {
    var text = "Renk Farkı'nda " + S.score + " puan yaptım. Sen de dene: " + location.href;
    if (navigator.share) {
      navigator.share({ title: "Tıklix — Renk Farkı", text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast("Panoya kopyalandı"); });
    }
  });

  syncHud();
})();
