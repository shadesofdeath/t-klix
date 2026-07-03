/* ============================================================
   2048 — oyun mantığı
   Ortak yardımcılar (ses, kayıt, titreşim, tema) Tiklix
   çekirdeğinden gelir: assets/core.js
   ============================================================ */
(function () {
  "use strict";

  Tiklix.theme.init();

  var SIZE = 4;
  var $ = function (id) { return document.getElementById(id); };
  var tilesEl = $("tiles");

  var S = {
    grid: [],          /* SIZE×SIZE: null | {id, v} */
    score: 0,
    best: Tiklix.store.get("2048:best", 0),
    over: false,
    won: false,        /* 2048'e ulaşıldı mı (devam edilebilir) */
    moving: false,
    nextId: 1
  };

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

  /* ---------- Arka plan hücreleri ---------- */
  (function drawCells() {
    var cells = $("cells");
    for (var i = 0; i < SIZE * SIZE; i++) {
      var d = document.createElement("div");
      d.className = "cell";
      cells.appendChild(d);
    }
  })();

  /* ---------- Yardımcılar ---------- */
  function eachCell(fn) {
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++) fn(r, c, S.grid[r][c]);
  }
  function emptyCells() {
    var list = [];
    eachCell(function (r, c, t) { if (!t) list.push({ r: r, c: c }); });
    return list;
  }
  function canMove() {
    if (emptyCells().length) return true;
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++) {
        var v = S.grid[r][c].v;
        if (r + 1 < SIZE && S.grid[r + 1][c].v === v) return true;
        if (c + 1 < SIZE && S.grid[r][c + 1].v === v) return true;
      }
    return false;
  }

  /* ---------- DOM ---------- */
  function makeTileEl(tile, r, c) {
    var el = document.createElement("div");
    el.className = "tile spawn";
    el.dataset.v = tile.v;
    el.dataset.id = tile.id;
    el.textContent = tile.v;
    el.style.setProperty("--r", r);
    el.style.setProperty("--c", c);
    tilesEl.appendChild(el);
    return el;
  }
  function tileEl(id) {
    return tilesEl.querySelector('[data-id="' + id + '"]');
  }

  function spawnTile() {
    var empt = emptyCells();
    if (!empt.length) return;
    var cell = empt[Math.floor(Math.random() * empt.length)];
    var tile = { id: S.nextId++, v: Math.random() < 0.9 ? 2 : 4 };
    S.grid[cell.r][cell.c] = tile;
    makeTileEl(tile, cell.r, cell.c);
  }

  function syncHud() {
    $("score").textContent = S.score;
    $("best").textContent = S.best;
  }

  /* ---------- Hamle ----------
     dir: 0=sol 1=yukarı 2=sağ 3=aşağı
     Her satır/sütun hedef yöne doğru taranır; kayan karolar
     CSS left/top geçişiyle animasyonlanır, birleşenler animasyon
     bitiminde tek karoya indirgenir. */
  function move(dir) {
    if (S.over || S.moving) return;

    var vec = [{ r: 0, c: -1 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }][dir];
    var range = [];
    for (var i = 0; i < SIZE; i++) range.push(i);
    var rows = vec.r === 1 ? range.slice().reverse() : range;
    var cols = vec.c === 1 ? range.slice().reverse() : range;

    var moved = false;
    var merges = [];   /* {into, from, r, c, v} — animasyon sonrası uygulanır */
    var gained = 0;

    rows.forEach(function (r) {
      cols.forEach(function (c) {
        var tile = S.grid[r][c];
        if (!tile) return;

        /* Hedef yönde gidebildiği kadar ilerle */
        var nr = r, nc = c;
        while (true) {
          var tr = nr + vec.r, tc = nc + vec.c;
          if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) break;
          if (S.grid[tr][tc]) break;
          nr = tr; nc = tc;
        }

        /* Bir sonraki hücreyle birleşme kontrolü */
        var mr = nr + vec.r, mc = nc + vec.c;
        var target = (mr >= 0 && mr < SIZE && mc >= 0 && mc < SIZE) ? S.grid[mr][mc] : null;
        if (target && target.v === tile.v && !target.merging) {
          target.merging = true;               /* aynı turda ikinci birleşmeyi engelle */
          S.grid[r][c] = null;
          merges.push({ into: target, from: tile, r: mr, c: mc, v: tile.v * 2 });
          gained += tile.v * 2;
          slideEl(tile.id, mr, mc);
          moved = true;
        } else if (nr !== r || nc !== c) {
          S.grid[r][c] = null;
          S.grid[nr][nc] = tile;
          slideEl(tile.id, nr, nc);
          moved = true;
        }
      });
    });

    eachCell(function (r, c, t) { if (t) delete t.merging; });
    if (!moved) return;

    S.moving = true;
    Tiklix.vibrate(10);

    setTimeout(function () {
      /* Birleşmeleri uygula: iki DOM karosu → tek karo */
      merges.forEach(function (m) {
        var fromEl = tileEl(m.from.id);
        if (fromEl) fromEl.remove();
        m.into.v = m.v;
        var el = tileEl(m.into.id);
        if (el) {
          el.dataset.v = m.v;
          el.textContent = m.v;
          el.classList.remove("spawn");
          el.classList.add("merged");
          setTimeout(function () { el.classList.remove("merged"); }, 200);
        }
        if (m.v === 2048 && !S.won) { S.won = true; showWin(); }
      });

      if (gained) {
        S.score += gained;
        if (S.score > S.best) { S.best = S.score; Tiklix.store.set("2048:best", S.best); }
        Tiklix.audio.correct();
      }
      spawnTile();
      syncHud();
      S.moving = false;

      if (!canMove()) gameOver();
    }, 130);
  }

  function slideEl(id, r, c) {
    var el = tileEl(id);
    if (!el) return;
    el.classList.remove("spawn");
    el.style.setProperty("--r", r);
    el.style.setProperty("--c", c);
  }

  /* ---------- Oyun akışı ---------- */
  function newGame() {
    S.grid = [];
    for (var r = 0; r < SIZE; r++) S.grid.push([null, null, null, null]);
    S.score = 0; S.over = false; S.won = false; S.moving = false;
    tilesEl.innerHTML = "";
    $("endScreen").classList.add("hidden");
    spawnTile(); spawnTile();
    syncHud();
  }

  function gameOver() {
    S.over = true;
    Tiklix.audio.over();
    Tiklix.vibrate([60, 60, 120]);
    $("endTitle").textContent = "Hamle kalmadı";
    $("finalScore").textContent = S.score;
    $("finalScore").classList.remove("win");
    $("endMsg").textContent = S.score >= S.best && S.score > 0
      ? "Yeni rekor! Daha da ileri gidebilirsin."
      : "Rekor: " + S.best + ". Tekrar dene.";
    $("continueBtn").classList.add("hidden");
    $("endScreen").classList.remove("hidden");
  }

  function showWin() {
    Tiklix.audio.level();
    Tiklix.vibrate([40, 40, 40, 40, 80]);
    $("endTitle").textContent = "2048'e ulaştın";
    $("finalScore").textContent = "2048";
    $("finalScore").classList.add("win");
    $("endMsg").textContent = "Tebrikler! Devam edip daha büyük karolar yapabilirsin.";
    $("continueBtn").classList.remove("hidden");
    $("endScreen").classList.remove("hidden");
  }

  $("newBtn").addEventListener("click", newGame);
  $("retryBtn").addEventListener("click", newGame);
  $("continueBtn").addEventListener("click", function () {
    $("endScreen").classList.add("hidden");
  });

  /* ---------- Girdi: klavye ---------- */
  var KEYS = {
    ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3,
    a: 0, w: 1, d: 2, s: 3
  };
  document.addEventListener("keydown", function (e) {
    var dir = KEYS[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    move(dir);
  });

  /* ---------- Girdi: dokunma / sürükleme ---------- */
  var wrap = $("boardWrap");
  var sx = 0, sy = 0, tracking = false;
  wrap.addEventListener("pointerdown", function (e) {
    tracking = true; sx = e.clientX; sy = e.clientY;
  });
  wrap.addEventListener("pointerup", function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 2 : 0);
    else move(dy > 0 ? 3 : 1);
  });
  wrap.addEventListener("pointercancel", function () { tracking = false; });

  /* Test/hata ayıklama kancası */
  window.__t2048 = { state: S, move: move, newGame: newGame };

  newGame();
})();
