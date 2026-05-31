# Neon Snake - Modern Yılan Oyunu

Bu proje, klasik yılan oyunu mekaniklerini modern neon görsel estetiği, meyve tabanlı puanlama, deri (skin) mağazası ve Supabase veritabanı (liderlik tablosu) ile birleştiren tarayıcı tabanlı bir web uygulamasıdır.

## 🚀 Hızlı Başlangıç (Yerel Çalıştırma)

Proje tamamen statik dosyalardan (HTML, CSS, JS) oluştuğu için yerelde çalıştırmak son derece basittir:

1.  Klasördeki `index.html` dosyasına çift tıklayarak tarayıcınızda oyunu anında açabilirsiniz.
2.  Herhangi bir sunucu kurulumu gerektirmez.

---

## ⚙️ Supabase Veritabanı Kurulumu

Oyundaki skorların bulutta saklanması, liderlik tablosu ve skin satın alımları için Supabase entegrasyonu gereklidir. Aşağıdaki adımları izleyin:

1.  [Supabase](https://supabase.com) üzerinde ücretsiz bir hesap ve yeni bir proje oluşturun.
2.  Projenizin panelinde **SQL Editor** kısmına gidin ve klasördeki [supabase_setup.sql](file:///c:/Users/Poyraz/OneDrive/Desktop/poyraz%20projeleri/y%C4%B1lan%20oyunu/supabase_setup.sql) dosyasının içeriğini yapıştırarak **Run** butonuna tıklayın. Bu işlem gerekli tabloları (`user_profiles` ve `leaderboard`) oluşturacaktır.
3.  **Project Settings > API** bölümünden projenizin **Project URL** ve **Anon public API Key** değerlerini kopyalayın.
4.  Oyunu tarayıcıda açtıktan sonra, giriş ekranındaki **⚙️ Supabase Bağlantısı** butonuna tıklayın.
5.  Kopyaladığınız URL ve Key bilgilerini yapıştırıp **Bağlantıyı Kaydet** deyin. Bilgiler tarayıcı hafızanıza (LocalStorage) kaydedilecek ve oyundaki veriler Supabase veritabanınız ile otomatik olarak senkronize olacaktır.

*Not: Eğer Supabase bağlantısı yapmazsanız, oyun otomatik olarak **Çevrimdışı (Offline) Modda** çalışacak, skorlarınızı ve skin satın alımlarınızı tarayıcı hafızasında (LocalStorage) saklayacaktır.*

---

## 🌐 Netlify Dağıtımı (Deployment)

Oyunu internette yayınlamak ve arkadaşlarınızla paylaşmak için Netlify'ı kullanabilirsiniz:

### Yöntem 1: Drag & Drop (Sürükle-Bırak - En Hızlısı)
1.  [Netlify](https://www.netlify.com) hesabınıza giriş yapın.
2.  Dashboard'da **Sites** sayfasına gidin.
3.  Sayfanın altındaki sürükle-bırak alanına bu **yılan oyunu** klasörünü bırakın. Birkaç saniye içinde oyununuz yayına alınacaktır.

### Yöntem 2: Git Entegrasyonu
1.  Projeyi bir GitHub/GitLab deposuna yükleyin.
2.  Netlify panelinde **Add New Site > Import from Git** seçeneğini kullanarak deponuzu bağlayın.
3.  Build command kısmını boş bırakın, publish directory kısmını `.` olarak ayarlayın ve dağıtımı başlatın.
