/* ============================================================
   Tıklix — Oyun Kaydı
   Yeni oyun eklemek için bu diziye bir kayıt ekleyin ve
   games/<id>/index.html altında oyunu oluşturun.
   ============================================================ */
window.TIKLIX_GAMES = [
  {
    id: "renk-farki",
    title: "Renk Farkı",
    desc: "Farklı renkteki kareyi süre dolmadan bul. Her seviyede ızgara büyür, fark azalır!",
    category: "refleks",
    emoji: "🎨",
    gradient: "linear-gradient(135deg,#6C5CFF,#00C6FF)",
    isNew: true,
  },
];

window.TIKLIX_CATEGORIES = [
  { id: "hepsi",    label: "Hepsi",    emoji: "✨" },
  { id: "refleks",  label: "Refleks",  emoji: "⚡" },
  { id: "bulmaca",  label: "Bulmaca",  emoji: "🧩" },
  { id: "hafiza",   label: "Hafıza",   emoji: "🧠" },
  { id: "arcade",   label: "Arcade",   emoji: "🕹️" },
];
