// Supabase Bağlantı ve İstemci Yönetimi

// -------------------------------------------------------------------------
// NOT: Supabase URL ve Anon Key değerlerinizi buraya yazabilirsiniz.
// Alternatif olarak, tarayıcıda yerel test yaparken localStorage'dan da okunabilir.
// -------------------------------------------------------------------------
const SUPABASE_URL = "https://oguulmjusopukyptmqyt.supabase.co"; // Kendi Supabase URL'niz
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ndXVsbWp1c29wdWt5cHRtcXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDg3NTYsImV4cCI6MjA5NTgyNDc1Nn0.QykwiCbV8KahsCmBYjGExB4sng8cSVE0Gg_TGytaylE"; // Kullanıcının sağladığı Anon/Publishable Key

// LocalStorage Yedekleri (Geliştirme aşamasında kolaylık sağlamak için)
const getDbUrl = () => localStorage.getItem("supabase_url") || SUPABASE_URL;
const getDbKey = () => localStorage.getItem("supabase_anon_key") || SUPABASE_ANON_KEY;

// window.supabase global CDN değişkeni ile çakışmaması için yerel değişken adını supabaseClient yapıyoruz
let supabaseClient = null;

// İstemciyi Başlatma Fonksiyonu
function initSupabaseClient() {
    try {
        const url = getDbUrl();
        const key = getDbKey();
        
        if (url && url.indexOf("your-project") === -1 && key && key.indexOf("your-key") === -1) {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                supabaseClient = window.supabase.createClient(url, key);
                console.log("Supabase istemcisi başarıyla başlatıldı.");
                return true;
            }
        }
        console.warn("Supabase kimlik bilgileri yapılandırılmamış. Yerel modda (Offline) çalışacak.");
        supabaseClient = null;
        return false;
    } catch (err) {
        console.error("Supabase başlatılamadı:", err);
        supabaseClient = null;
        return false;
    }
}

// İlk başlatma denemesi
initSupabaseClient();

// Supabase Yapılandırmasını kaydetme arayüzü
window.setupSupabase = (url, key) => {
    localStorage.setItem("supabase_url", url.trim());
    localStorage.setItem("supabase_anon_key", key.trim());
    return initSupabaseClient();
};

// -------------------------------------------------------------------------
// VERİTABANI İŞLEMLERİ
// -------------------------------------------------------------------------

/**
 * Kullanıcı Girişi yapar veya Yeni Profil Oluşturur
 */
async function loginOrCreateProfile(username) {
    if (!supabaseClient) {
        // Çevrimdışı Mod Fallback (LocalStorage ile test)
        let localProfile = JSON.parse(localStorage.getItem("offline_profile")) || {
            username: username,
            total_points: 100, // Başlangıç hediyesi yerelde
            unlocked_skins: ['classic'],
            active_skin: 'classic'
        };
        localStorage.setItem("offline_profile", JSON.stringify(localProfile));
        return { data: localProfile, offline: true };
    }

    try {
        // Profili ara
        const { data: profile, error } = await supabaseClient
            .from("user_profiles")
            .select("*")
            .eq("username", username)
            .maybeSingle();

        if (error) throw error;

        if (profile) {
            // Kullanıcı var, bilgileri dön
            return { data: profile, offline: false };
        } else {
            // Yeni kullanıcı oluştur
            const { data: newProfile, error: createError } = await supabaseClient
                .from("user_profiles")
                .insert([{ username: username, total_points: 0, unlocked_skins: ['classic'], active_skin: 'classic' }])
                .select()
                .single();

            if (createError) throw createError;
            return { data: newProfile, offline: false };
        }
    } catch (err) {
        console.error("Giriş hatası:", err);
        throw err;
    }
}

/**
 * Liderlik Tablosunu Getirir (Top 10)
 */
async function fetchLeaderboard() {
    if (!supabaseClient) {
        // Çevrimdışı Fallback liderlik tablosu
        let offlineScores = JSON.parse(localStorage.getItem("offline_scores")) || [
            { username: "NeonSnake_Pro", score: 350 },
            { username: "Poyraz_Dev", score: 280 },
            { username: "Yilan_Avcisi", score: 180 }
        ];
        return offlineScores.sort((a,b) => b.score - a.score);
    }

    try {
        const { data, error } = await supabaseClient
            .from("leaderboard")
            .select("*")
            .order("score", { ascending: false })
            .limit(10);

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Liderlik tablosu çekilemedi:", err);
        return [];
    }
}

/**
 * Skor Gönderir ve Derece Kontrolü ile Bonus Puan Tanımlar
 */
async function submitScore(username, score) {
    let result = {
        scoreSubmitted: false,
        rank: null,
        bonusPoints: 0,
        newTotalPoints: 0,
        offline: false
    };

    if (!supabaseClient) {
        // Çevrimdışı Mod Skor & Derece Mantığı
        let offlineScores = JSON.parse(localStorage.getItem("offline_scores")) || [];
        offlineScores.push({ username: username, score: score });
        offlineScores.sort((a, b) => b.score - a.score);
        localStorage.setItem("offline_scores", JSON.stringify(offlineScores));

        // Derece kontrolü
        let rank = offlineScores.findIndex(s => s.username === username && s.score === score) + 1;
        let bonus = 0;
        if (rank === 1) bonus = 500;
        else if (rank === 2) bonus = 300;
        else if (rank === 3) bonus = 150;

        let profile = JSON.parse(localStorage.getItem("offline_profile")) || { username: username, total_points: 0 };
        profile.total_points += score + bonus;
        localStorage.setItem("offline_profile", JSON.stringify(profile));

        result.scoreSubmitted = true;
        result.rank = rank <= 3 ? rank : null;
        result.bonusPoints = bonus;
        result.newTotalPoints = profile.total_points;
        result.offline = true;
        return result;
    }

    try {
        // 1. Skoru Liderlik Tablosuna Ekle
        const { error: scoreError } = await supabaseClient
            .from("leaderboard")
            .insert([{ username: username, score: score }]);
        if (scoreError) throw scoreError;
        result.scoreSubmitted = true;

        // 2. Liderlik Tablosundaki Sıralamayı Çek (İlk 3 Dereceyi Bulmak İçin)
        const { data: topScores, error: leaderboardError } = await supabaseClient
            .from("leaderboard")
            .select("username, score")
            .order("score", { ascending: false })
            .limit(3);
        
        if (leaderboardError) throw leaderboardError;

        // Derece kontrolü
        let currentRank = null;
        for (let i = 0; i < topScores.length; i++) {
            if (topScores[i].username === username && topScores[i].score === score) {
                currentRank = i + 1;
                break;
            }
        }

        let bonus = 0;
        if (currentRank === 1) bonus = 500;
        else if (currentRank === 2) bonus = 300;
        else if (currentRank === 3) bonus = 150;

        result.rank = currentRank;
        result.bonusPoints = bonus;

        // 3. Kullanıcı Profilindeki Puanı Güncelle (Skor + Bonus)
        const { data: profile, error: profileFetchError } = await supabaseClient
            .from("user_profiles")
            .select("total_points")
            .eq("username", username)
            .single();

        if (profileFetchError) throw profileFetchError;

        const updatedPoints = profile.total_points + score + bonus;

        const { error: updateError } = await supabaseClient
            .from("user_profiles")
            .update({ total_points: updatedPoints })
            .eq("username", username);

        if (updateError) throw updateError;

        result.newTotalPoints = updatedPoints;
        return result;

    } catch (err) {
        console.error("Skor gönderim hatası:", err);
        return result;
    }
}

/**
 * Skin Satın Alma İşlemi
 */
async function buySkin(username, skinId, cost) {
    if (!supabaseClient) {
        let profile = JSON.parse(localStorage.getItem("offline_profile"));
        if (profile.total_points >= cost) {
            profile.total_points -= cost;
            profile.unlocked_skins.push(skinId);
            profile.active_skin = skinId;
            localStorage.setItem("offline_profile", JSON.stringify(profile));
            return { success: true, data: profile };
        }
        return { success: false, error: "Yetersiz Puan!" };
    }

    try {
        // Mevcut puan durumunu doğrula
        const { data: profile, error: fetchError } = await supabaseClient
            .from("user_profiles")
            .select("*")
            .eq("username", username)
            .single();

        if (fetchError) throw fetchError;

        if (profile.total_points < cost) {
            return { success: false, error: "Yetersiz Puan!" };
        }

        const newPoints = profile.total_points - cost;
        const newSkins = [...profile.unlocked_skins, skinId];

        const { data: updatedProfile, error: updateError } = await supabaseClient
            .from("user_profiles")
            .update({ total_points: newPoints, unlocked_skins: newSkins, active_skin: skinId })
            .eq("username", username)
            .select()
            .single();

        if (updateError) throw updateError;
        return { success: true, data: updatedProfile };

    } catch (err) {
        console.error("Skin satın alınamadı:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Skin Kuşanma İşlemi
 */
async function equipSkin(username, skinId) {
    if (!supabaseClient) {
        let profile = JSON.parse(localStorage.getItem("offline_profile"));
        profile.active_skin = skinId;
        localStorage.setItem("offline_profile", JSON.stringify(profile));
        return { success: true, data: profile };
    }

    try {
        const { data: updatedProfile, error } = await supabaseClient
            .from("user_profiles")
            .update({ active_skin: skinId })
            .eq("username", username)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: updatedProfile };
    } catch (err) {
        console.error("Skin kuşanma hatası:", err);
        return { success: false, error: err.message };
    }
}
