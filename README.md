# Tıklix

**Tıklix** — tarayıcıda anında açılan, mobil öncelikli mini oyunlar sitesi. İndirme yok, kayıt yok.

## Mimari

Tamamen statik (GitHub Pages uyumlu), framework ve derleme adımı yok. Oyunlar birbirinden tamamen bağımsızdır: portal hiçbir oyunun kodunu yüklemez, her oyun yalnızca kendi kodunu ve ortak çekirdeği yükler.

```
├── index.html                # Portal (oyun ızgarası, kategori sekmeleri, arama)
├── assets/
│   ├── theme.css             # Tasarım sistemi: renk token'ları, buton/kart/chip bileşenleri, açık-koyu tema
│   └── core.js               # Tiklix çekirdeği: localStorage kaydı, WebAudio sesleri, titreşim, tema
├── games/
│   ├── data.js               # Oyun kaydı — YALNIZCA meta veri (başlık, kategori, zorluk…)
│   └── renk-farki/           # Her oyun kendi klasöründe, kendi dosyalarıyla
│       ├── index.html        #   İskelet + SEO
│       ├── game.css          #   Oyuna özel stiller
│       ├── game.js           #   Oyun mantığı (Tiklix API'sini kullanır)
│       └── thumb.svg         #   Portal kartındaki kapak görseli
├── manifest.webmanifest      # PWA
├── icon.svg
├── 404.html · robots.txt · sitemap.xml
```

### Neden bu yapı?

- **Oyun başına klasör:** Her oyun yüzlerce satır olacağı için kod tek dosyada toplanmaz; `game.js` büyüdükçe aynı klasör içinde bölünebilir (ör. `levels.js`, `render.js`).
- **`games/data.js` sadece manifest:** Portal, oyun listesini bu hafif dosyadan okur. Bir oyunun kodundaki hata portalı asla bozamaz.
- **`assets/core.js` ortak çekirdek:** Ses, kayıt, titreşim ve tema her oyunda aynı — kopyalanmaz, tek yerden yönetilir.
- **`assets/theme.css` tasarım sistemi:** Tüm oyunlar aynı görsel kimliği token'lardan alır; tema (açık/koyu) her sayfada otomatik çalışır.

## Yeni oyun ekleme

1. `games/<oyun-id>/` klasörünü oluştur: `index.html`, `game.css`, `game.js`, `thumb.svg` (400×260).
2. `games/data.js` içindeki `TIKLIX_GAMES` dizisine kaydı ekle:

```js
{
  id: "oyun-id",              // klasör adıyla aynı olmalı
  title: "Oyun Adı",
  desc: "Kısa açıklama…",
  category: "refleks",        // refleks | bulmaca | hafiza | arcade
  difficulty: "Orta",
  duration: "~2 dk",
  isNew: true,
}
```

3. `sitemap.xml`'e URL'yi ekle. Portal ızgarası otomatik güncellenir.

**Çekirdek API** (`assets/core.js`, her oyunda hazır):

```js
Tiklix.store.get("oyun-id:best", 0)      // kalıcı kayıt (localStorage)
Tiklix.store.set("oyun-id:best", 120)
Tiklix.audio.correct() / .wrong() / .level() / .over()
Tiklix.audio.tone(660, .1, "sine", .12)  // özel ses
Tiklix.vibrate(20)                        // titreşim
Tiklix.theme.init()                       // kayıtlı temayı uygula (her sayfada çağır)
```

## Oyunlar

| Oyun | Kategori | Açıklama |
|------|----------|----------|
| Renk Farkı | Refleks | Tonu farklı kareyi süre dolmadan bul. Izgara büyür, fark azalır. |
| 2048 | Bulmaca | Kaydır, aynı sayıları birleştir, 2048 karosuna ulaş. |
| Flappy Kuş | Arcade | Dokun, zıpla, boruların arasından geç. |

## Geliştirme

```bash
python3 -m http.server 8080
```
