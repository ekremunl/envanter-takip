# Gunluk Envanter ve Tuketim Takibi

Next.js, Tailwind CSS ve Lucide React ile hazirlanmis, Turkce arayuzlu gunluk tuketim ve envanter takip uygulamasi.

## Ozellikler

- 5 ana kategori:
  - Kahvalti
  - Ogle Yemegi
  - Aksam Yemegi
  - Ara Ogun
  - Firin Urunleri (Borek, Ekmek, Simit, Pogaca)
- Her kayitta urun adi, miktar ve birim (Gram / Adet)
- Yeni urun adlarini otomatik urun havuzuna ekleme
- localStorage ile istemci tarafli veri saklama
- Sadece son 10 gunun kayitlarini koruma
- Secili tarih icin tek sayfada gunluk rapor
- Yazdir / PDF olarak kaydet akisi
- GitHub Pages icin static export yapilandirmasi

## Gelistirme

```bash
npm install
npm run dev
```

## Kalite Kontrolleri

```bash
npm run lint
npm run typecheck
npm run build
```

## GitHub Pages

Proje `output: "export"` ile statik olarak uretilir. GitHub Actions workflow dosyasi, `main` branch'ine yapilan push sonrasinda uygulamayi GitHub Pages'e deploy eder.
