/* ============================================================
   Tıklix — Oyun Kaydı (yalnızca meta veri; oyun kodu içermez)

   Yeni oyun eklemek için:
     1. games/<id>/ klasörünü oluştur:
        index.html + game.css + game.js + thumb.svg
     2. Bu diziye bir kayıt ekle. Portal ızgarası ve
        thumbnail (games/<id>/thumb.svg) otomatik bağlanır.
   ============================================================ */
window.TIKLIX_GAMES = [
  {
    id: "renk-farki",
    title: "Renk Farkı",
    desc: "Tonu farklı kareyi süre dolmadan bul. Her seviyede ızgara büyür, fark azalır.",
    category: "refleks",
    difficulty: "Orta",
    duration: "~2 dk",
    isNew: true,
  },
];

window.TIKLIX_CATEGORIES = [
  { id: "hepsi",   label: "Tümü" },
  { id: "refleks", label: "Refleks" },
  { id: "bulmaca", label: "Bulmaca" },
  { id: "hafiza",  label: "Hafıza" },
  { id: "arcade",  label: "Arcade" },
];
