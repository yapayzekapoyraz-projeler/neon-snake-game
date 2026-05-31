# Ürün Gereksinimleri Dokümanı (PRD) - Modern Neon Yılan Oyunu

## 1. Proje Tanımı ve Hedefler
Bu proje, klasik Yılan Oyunu (Snake Game) mekaniklerini modern web teknolojileri, göz alıcı neon görsel estetik (dark mode/glassmorphism), Supabase veritabanı entegrasyonu, meyve tabanlı dinamik puanlama, yılan derisi (skin) mağazası ve Netlify dağıtımı ile harmanlayan tarayıcı tabanlı bir web uygulamasıdır.

### Temel Hedefler:
*   **Görsel Mükemmellik:** Klasik, basit yılan oyunlarının aksine, neon efektleri, yumuşak geçişler ve akıcı parçacık (particle) animasyonları ile premium bir his yaratmak.
*   **Zengin Oynanış ve Meyve Sistemi:** Yılanın yediği yemlerin farklı meyvelerden (Elma, Muz, Çilek, Karpuz vb.) oluşması ve her meyvenin farklı puan/özellik kazandırması.
*   **Deri (Skin) Mağazası:** Oyuncuların kazandıkları puanlarla yeni yılan derileri satın alıp oyun içinde kullanabilmesi.
*   **Supabase ile Bulut Liderlik Tablosu:** Skorların Supabase veritabanına kaydedilmesi, anlık liderlik tablosu (Leaderboard) sıralaması.
*   **Derece Ödülleri:** Liderlik tablosunda 1., 2. ve 3. sıraya yerleşen oyunculara mağazada harcayabilecekleri ekstra bonus puanlar tanımlanması.
*   **Netlify Dağıtımı:** Uygulamanın Netlify üzerinde sorunsuz çalışacak şekilde yapılandırılması.

---

## 2. Kullanıcı Deneyimi ve Tasarım Sistematiği (UI/UX)
Oyun arayüzü modern web tasarımı trendlerine uygun olarak tasarlanacaktır:
*   **Renk Paleti:**
    *   Arka Plan: Derin Koyu Gri/Siyah (`#0f172a` - Slate 900)
    *   Yılan: Canlı Neon Yeşil (`#22c55e` / `#4ade80`) veya mağazadan seçilen aktif skin rengi/deseni.
    *   Meyve Renkleri:
        *   Elma: Parlak Kırmızı (`#ef4444`)
        *   Muz: Canlı Sarı (`#eab308`)
        *   Çilek: Neon Pembe (`#ec4899`)
        *   Karpuz: Yeşil/Kırmızı Gradyan (`#10b981` ve `#f43f5e`)
    *   UI Panelleri: Yarı saydam beyaz/mavi cam efekti (Glassmorphism)
*   **Arayüz Elemanları:**
    *   **Giriş/Menü Ekranı:** Oyuncu adı girişi, oyun modları, Deri (Skin) Mağazası butonu ve Liderlik Tablosu butonu.
    *   **Deri (Skin) Mağazası Paneli:** Sahip olunan toplam puan, kilitli/açık yılan derileri ve skin satın alma/kuşanma arayüzü.
    *   **Oyun Alanı (Canvas):** Neon ışıma efektlerine sahip, net sınırlanmış oyun alanı.
    *   **Kontrol Paneli:** Anlık Skor, Toplam Biriken Puan, Pause/Resume (Duraklat) butonu ve Ses ayarları.
    *   **Oyun Bitti (Game Over) Ekranı:** Skor özeti, kazanılan toplam puan, ilk 3 derecesine göre verilen bonus puan uyarısı ve "Tekrar Oyna" butonu.

---

## 3. Fonksiyonel Gereksinimler

### 3.1. Yılan ve Hareket Mekanikleri
*   Yılan, grid tabanlı bir alanda sürekli hareket eder.
*   Yön tuşları (W, A, S, D veya Ok Tuşları) veya mobil kaydırma kontrolleri ile yönlendirilir.
*   Yılan her meyve yediğinde boyu 1 grid uzar ve skor meyvenin değerine göre artar.

### 3.2. Meyve ve Puanlama Sistemi
Oyunda farklı koordinatlarda rastgele beliren meyveler ve özellikleri:
1.  **Elma (Apple):** En sık çıkan meyvedir. **+10 Puan** verir.
2.  **Muz (Banana):** Orta sıklıkta çıkar. **+20 Puan** verir.
3.  **Çilek (Strawberry):** Nadir çıkar. **+30 Puan** verir.
4.  **Karpuz (Watermelon):** Çok nadir çıkar ve 5 saniye sonra kaybolur. **+50 Puan** verir.

### 3.3. Deri (Skin) Mağazası
*   Oyuncunun her oyun sonunda kazandığı puanlar hesabındaki "Toplam Puan" bakiyesine eklenir.
*   Oyuncu bu puanları mağazada harcayabilir.
*   **Kullanılabilir Skinler:**
    *   *Klasik Neon:* Ücretsiz (Varsayılan Yeşil).
    *   *Ateş Derisi (Neon Turuncu/Kırmızı Gradyan):* 500 Puan.
    *   *Buz Derisi (Neon Mavi/Cam Göbeği Gradyan):* 1000 Puan.
    *   *Gökkuşağı Derisi (Sürekli renk değiştiren RGB efekti):* 2500 Puan.
*   Satın alınan skinler hesaba kalıcı olarak kaydedilir ve "Kuşan" butonu ile aktif edilebilir.

### 3.4. Supabase Liderlik Tablosu ve Derece Ödülleri
*   **Veritabanı:** Supabase üzerinde `leaderboard` ve `user_profiles` tabloları kurulacaktır.
*   Oyuncu skorları oyun bittiğinde otomatik olarak Supabase'e gönderilir.
*   **Derece Bonus Puan Ödülleri:**
    *   Her oyun sonu veya güncellenen periyotlarda liderlik tablosundaki ilk 3 oyuncu tespit edilir.
    *   Bu derecelere giren oyunculara mağazada harcayabilecekleri ekstra bonus puanlar tanımlanır:
        *   **1.lik Ödülü (Birinci):** +500 Ekstra Puan
        *   **2.lik Ödülü (İkinci):** +300 Ekstra Puan
        *   **3.lük Ödülü (Üçüncü):** +150 Ekstra Puan
    *   Bonus puan ödülü oyun bitti ekranında animasyonla kullanıcıya bildirilir ve Supabase'deki profil bakiyesine yansıtılır.

---

## 4. Teknik Gereksinimler ve Mimarisi
Proje, performansı en üst seviyede tutmak için **HTML5 Canvas, CSS ve Vanilla JavaScript** ile geliştirilecektir. Supabase entegrasyonu CDN veya Supabase JS istemcisi üzerinden sağlanacaktır.

*   **Veritabanı ve Auth:** Supabase (PostgreSQL).
    *   `user_profiles` tablosu: `id`, `username`, `total_points`, `unlocked_skins`, `active_skin`.
    *   `leaderboard` tablosu: `id`, `user_id`, `username`, `score`, `created_at`.
*   **Dağıtım (Deployment):** Netlify.
    *   Supabase API anahtarları Netlify panelindeki `Environment Variables` kısmında (`SUPABASE_URL` ve `SUPABASE_ANON_KEY`) güvenli şekilde saklanacaktır.
    *   Projeye Netlify yönlendirmeleri ve build ayarları için bir `netlify.toml` dosyası eklenecektir.

*   **Dosya Yapısı:**
    *   `index.html` - Arayüz şablonu, Canvas alanı, Mağaza ve Liderlik panelleri.
    *   `index.css` - Neon teması, cam efekti (glassmorphism), buton ve geçiş animasyonları.
    *   `app.js` - Oyun döngüsü, yılan ve meyve fizikleri, parçacık efektleri.
    *   `supabase-client.js` - Supabase bağlantı tanımları, skor kaydetme, veri çekme ve skin satın alma API çağrıları.
    *   `netlify.toml` - Netlify yapılandırma dosyası.
