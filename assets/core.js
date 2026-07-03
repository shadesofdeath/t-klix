/* ============================================================
   Tıklix Çekirdeği — tüm oyunların paylaştığı yardımcılar.
   Oyun kodu içermez; her oyun kendi games/<id>/game.js
   dosyasında yaşar ve buradaki API'yi kullanır:

     Tiklix.store.get(key, fallback) / .set(key, value)
     Tiklix.audio.correct() .wrong() .level() .over() .tone(...)
     Tiklix.audio.muted / .setMuted(bool)
     Tiklix.vibrate(pattern)
     Tiklix.theme.init() / .toggle()
   ============================================================ */
window.Tiklix = (function () {
  "use strict";

  /* ---------- Kalıcı kayıt (localStorage, "tiklix:" öneki) ---------- */
  var store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem("tiklix:" + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem("tiklix:" + key, JSON.stringify(value)); } catch (e) {}
    }
  };

  /* ---------- Tema ---------- */
  var theme = {
    init: function () {
      var saved = store.get("theme", null);
      if (saved) document.documentElement.setAttribute("data-theme", saved);
    },
    toggle: function () {
      var root = document.documentElement;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("theme", next);
      return next;
    }
  };

  /* ---------- Ses (WebAudio — ses dosyası yok) ---------- */
  var actx = null;
  var muted = !!store.get("muted", false);

  function tone(freq, dur, type, vol) {
    if (muted) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      var osc = actx.createOscillator(), gain = actx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.12, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(); osc.stop(actx.currentTime + dur);
    } catch (e) {}
  }
  function seq(notes, gap, dur, type, vol) {
    notes.forEach(function (f, i) {
      setTimeout(function () { tone(f, dur, type, vol); }, i * gap);
    });
  }

  var audio = {
    tone: tone,
    correct: function () { tone(660, .1, "sine", .11); setTimeout(function(){ tone(880, .12, "sine", .09); }, 65); },
    wrong:   function () { tone(150, .22, "sawtooth", .09); },
    level:   function () { seq([523, 659, 784], 75, .12, "triangle", .1); },
    over:    function () { seq([440, 330, 220], 130, .18, "sine", .1); },
    get muted() { return muted; },
    setMuted: function (m) { muted = !!m; store.set("muted", muted); }
  };

  /* ---------- Titreşim ---------- */
  function vibrate(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  return { store: store, theme: theme, audio: audio, vibrate: vibrate };
})();
