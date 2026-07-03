# Tıklix 🕹️

**Tıklix** — ücretsiz, mobil öncelikli tarayıcı oyunları sitesi. İndirme yok, kayıt yok: tıkla ve oyna!

## Yapı

Tamamen statik site (GitHub Pages uyumlu), framework yok, derleme adımı yok.

```
├── index.html              # Ana sayfa (oyun portalı: arama, kategoriler, ızgara)
├── assets/theme.css        # Ortak tasarım sistemi (renkler, butonlar, kartlar, açık/koyu tema)
├── games/
│   ├── data.js             # Oyun kaydı — yeni oyunlar buraya eklenir
│   └── renk-farki/         # 🎨 Renk Farkı (ilk oyun)
│       └── index.html
├── manifest.webmanifest    # PWA manifest
├── icon.svg                # Uygulama ikonu
├── 404.html
├── robots.txt
└── sitemap.xml
```

## Yeni oyun ekleme

1. `games/<oyun-id>/index.html` oluştur (kendi içinde bağımsız, `../../assets/theme.css`'i kullan).
2. `games/data.js` içindeki `TIKLIX_GAMES` dizisine kaydını ekle:

```js
{
  id: "oyun-id",              // klasör adıyla aynı olmalı
  title: "Oyun Adı",
  desc: "Kısa açıklama…",
  category: "refleks",        // refleks | bulmaca | hafiza | arcade
  emoji: "🎯",
  gradient: "linear-gradient(135deg,#FF4D8D,#FF8A3D)",
  isNew: true,
}
```

3. `sitemap.xml`'e URL'yi ekle. Bu kadar — ana sayfa ızgarası otomatik güncellenir.

## Oyunlar

| Oyun | Kategori | Açıklama |
|------|----------|----------|
| 🎨 Renk Farkı | Refleks | Farklı renkteki kareyi süre dolmadan bul. Izgara büyür, fark azalır! |

## Geliştirme

Herhangi bir statik sunucu yeterli:

```bash
python3 -m http.server 8080
```
