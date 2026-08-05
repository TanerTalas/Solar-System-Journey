# Solar System Journey

Güneş'ten Neptün'e gerçek aralıklarla bir uçuş, ardından gövdeleri tek tek gezen bir keşif modu.
Next.js App Router + React Three Fiber ile yazıldı.

## Çalıştırma

```bash
npm install
npm run dev
```

<http://localhost:3000>

## Rotalar

| Rota | Ne yapar |
|---|---|
| `/` | Intro uçuşu: Güneş'ten Neptün'e, HUD'da kat edilen yol ve ışık hızının katı |
| `/explore/[slug]` | Tek gövde sahnesi, künye, ölçüler ve NASA arşivi |
| `/api/nasa/[body]` | NASA Image and Video Library araması, 24 saat cache'li |

## Dokular

Gezegen ve yıldız haritaları [Solar System Scope](https://www.solarsystemscope.com/textures/)
kaynaklıdır ve **CC BY 4.0** ile lisanslıdır. Depoda yalnızca türevleri duruyor:
`public/textures/4k` (masaüstü) ve `public/textures/2k` (mobil), webp'e çevrilmiş hâlde.

Yeniden üretmek için:

```bash
node scripts/build-textures.mjs
```

Script orijinalleri `.cache/textures` altına indirir (git'e girmez) ve iki boyutta webp üretir.

## Metin

Detay penceresindeki paragraf **en.wikipedia** özetinden geliyor ve build zamanında
`src/data/wiki-cache.json`'a yazılıyor — böylece pencere metinle birlikte açılıyor, ağ
olmadan da çalışıyor ve metnin ne dediği diff'te görünüyor. 700 karakterde, cümle
sonunda kırpılıyor; içinde bağlantı ya da işaretleme yok. Atıf (CC BY-SA 4.0) ve makale
bağlantısı pencerenin altında.

Tazelemek için:

```bash
node scripts/build-wiki.mjs
```

Bir gövdenin özeti gelmezse `bodies.ts` içindeki yazılı metin devreye girer.

## Yapı

```
src/
  app/                 rotalar, API route handler
  components/
    explore/           keşif kabuğu, gezegen canvas'ı, künye, overlay'ler
    journey/           intro uçuşunun sahnesi ve HUD'ı
    three/             paylaşılan 3D parçalar (gövde, yıldız alanı, yükleyici)
  data/bodies.ts       gövde verisi: metinler, ölçüler, yarıçap ve uzaklıklar
  styles/              tailwind v4 teması ve semantik component class'ları
```

## Notlar

- Tasarım prototipten birebir alındı; renkler, tipografi ve `clamp()` değerleri `src/styles` içinde.
- `prefers-reduced-motion` açıkken gövde dönüşü ve giriş animasyonları kapanır.
- Sahne mobilde 2k doku ve 32 segmentli küre, masaüstünde 4k doku ve 64 segment kullanır.
