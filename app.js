// Yılan Oyunu Ana JS Dosyası (app.js)

// -------------------------------------------------------------
// 1. MAĞAZA VE DERİ (SKIN) TANIMLAMALARI
// -------------------------------------------------------------
const SKINS = [
    { id: 'classic', name: 'Klasik Yeşil', cost: 0, color: '#22c55e', colorEnd: '#4ade80', desc: 'Standart neon yeşili görünüm.' },
    { id: 'fire', name: 'Alev Deresi', cost: 500, color: '#f97316', colorEnd: '#ef4444', desc: 'Sıcak neon turuncu ve kırmızı gradyan.' },
    { id: 'ice', name: 'Buz Deresi', cost: 1000, color: '#06b6d4', colorEnd: '#3b82f6', desc: 'Soğuk neon mavi ve cam göbeği gradyan.' },
    { id: 'rainbow', name: 'Gökkuşağı', cost: 2500, color: 'rainbow', colorEnd: 'rainbow', desc: 'RGB döngülü sürekli renk değiştiren özel deri.' }
];

// -------------------------------------------------------------
// 2. KULLANICI VE OYUN EKRANI YÖNETİMİ
// -------------------------------------------------------------
let currentUser = {
    username: "",
    total_points: 0,
    unlocked_skins: ['classic'],
    active_skin: 'classic'
};

const screens = {
    auth: document.getElementById('auth-screen'),
    menu: document.getElementById('menu-screen'),
    game: document.getElementById('game-screen'),
    shop: document.getElementById('shop-screen'),
    leaderboard: document.getElementById('leaderboard-screen'),
    gameOver: document.getElementById('game-over-screen'),
    settings: document.getElementById('settings-screen')
};

function showScreen(screenKey) {
    Object.keys(screens).forEach(key => {
        if (key === screenKey) {
            screens[key].classList.remove('hidden');
            screens[key].classList.add('active');
        } else {
            screens[key].classList.add('hidden');
            screens[key].classList.remove('active');
        }
    });
}

// -------------------------------------------------------------
// 3. SES SENTEZLEYİCİ (WEB AUDIO API)
// -------------------------------------------------------------
let audioCtx = null;
let isMuted = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playEatSound() {
    if (isMuted) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playCrashSound() {
    if (isMuted) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playClickSound() {
    if (isMuted) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playRecordSound() {
    if (isMuted) return;
    initAudio();
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
        setTimeout(() => {
            if (isMuted) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        }, idx * 120);
    });
}

// -------------------------------------------------------------
// 4. OYUN ALANI VE CANAVAR FİZİĞİ
// -------------------------------------------------------------
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let dx = 0;
let dy = 0;

let score = 0;
let difficultySpeed = 100; // ms cinsinden
let gameMode = "classic"; // classic veya walls
let isPaused = false;
let gameInterval = null;

// Meyve Yapısı
let fruit = {
    x: 0,
    y: 0,
    type: "apple", // apple, banana, strawberry, watermelon
    points: 10,
    color: "#ef4444",
    spawnTime: 0,
    expires: false
};

// Parçacık Patlama Sistemi (Particles)
let particles = [];

function spawnParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + gridSize / 2,
            y: y + gridSize / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 3 + 1,
            color: color,
            alpha: 1,
            life: Math.random() * 20 + 20
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// -------------------------------------------------------------
// 5. MEYVE VE POZİSYONLAMA MANTIĞI
// -------------------------------------------------------------
const fruitsConfig = {
    apple: { points: 10, color: "#ef4444", name: "Elma" },
    banana: { points: 20, color: "#eab308", name: "Muz" },
    strawberry: { points: 30, color: "#ec4899", name: "Çilek" },
    watermelon: { points: 50, color: "#10b981", name: "Karpuz", expires: true, duration: 5000 }
};

function generateFruit() {
    // Rastgele meyve tipi belirle
    const roll = Math.random() * 100;
    let type = "apple";
    
    if (roll > 90) {
        type = "watermelon"; // %10 ihtimalle Karpuz
    } else if (roll > 75) {
        type = "strawberry"; // %15 ihtimalle Çilek
    } else if (roll > 50) {
        type = "banana"; // %25 ihtimalle Muz
    }
    // Kalan %50 Elma

    const conf = fruitsConfig[type];

    // Meyveyi yılanın gövdesinde olmayan rastgele bir yere koy
    let newX, newY;
    let onSnake = true;
    while (onSnake) {
        newX = Math.floor(Math.random() * tileCount);
        newY = Math.floor(Math.random() * tileCount);
        onSnake = snake.some(part => part.x === newX && part.y === newY);
    }

    fruit = {
        x: newX,
        y: newY,
        type: type,
        points: conf.points,
        color: conf.color,
        spawnTime: Date.now(),
        expires: conf.expires || false
    };
}

function checkFruitExpiration() {
    if (fruit.expires) {
        const elapsed = Date.now() - fruit.spawnTime;
        if (elapsed > 5000) {
            // Karpuz silindi, yeni meyve oluştur
            generateFruit();
        }
    }
}

// -------------------------------------------------------------
// 6. OYUN DÖNGÜSÜ (GAME LOOP)
// -------------------------------------------------------------
function resetGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    // Başlangıçta yukarı doğru hareket
    dx = 0;
    dy = -1;
    score = 0;
    isPaused = false;
    particles = [];
    document.getElementById('current-score').innerText = score;
    document.getElementById('game-active-skin').innerText = SKINS.find(s => s.id === currentUser.active_skin).name;
    
    // Canvas border rengini moduna göre ayarla
    if (gameMode === "walls") {
        canvas.style.borderColor = "var(--neon-red)";
        canvas.style.boxShadow = "0 0 20px var(--neon-red-glow)";
    } else {
        canvas.style.borderColor = "var(--neon-green)";
        canvas.style.boxShadow = "0 0 20px var(--neon-green-glow)";
    }

    generateFruit();
}

function startGameLoop() {
    if (gameInterval) clearInterval(gameInterval);
    resetGame();
    gameInterval = setInterval(gameStep, difficultySpeed);
}

function gameStep() {
    if (isPaused) return;

    // Karpuz süresini kontrol et
    checkFruitExpiration();

    // Yılan Kafasının Yeni Pozisyonu
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 1. Çarpışma Kontrolü (Duvarlar)
    if (gameMode === "walls") {
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            handleGameOver();
            return;
        }
    } else {
        // Klasik modda kenarlardan geçme
        if (head.x < 0) head.x = tileCount - 1;
        if (head.x >= tileCount) head.x = 0;
        if (head.y < 0) head.y = tileCount - 1;
        if (head.y >= tileCount) head.y = 0;
    }

    // 2. Kendi Kuyruğuna Çarpma Kontrolü
    const crashedSelf = snake.some((part, idx) => {
        // Yılanın kafasının yön değiştirdiğinde hemen kuyruğu ısırmaması için ilk 2 segmenti hariç tut
        return idx > 0 && part.x === head.x && part.y === head.y;
    });

    if (crashedSelf) {
        handleGameOver();
        return;
    }

    // Gövdenin başına kafayı ekle
    snake.unshift(head);

    // 3. Yem Yeme Kontrolü
    if (head.x === fruit.x && head.y === fruit.y) {
        playEatSound();
        score += fruit.points;
        document.getElementById('current-score').innerText = score;
        spawnParticles(fruit.x * gridSize, fruit.y * gridSize, fruit.color, 15);
        generateFruit();
    } else {
        // Yem yemediyse kuyruğu çıkar
        snake.pop();
    }

    // Parçacıkları güncelle
    updateParticles();

    // Çizim
    draw();
}

// -------------------------------------------------------------
// 7. CANVAS ÇİZİM İŞLEMLERİ (AESTHETICS)
// -------------------------------------------------------------
function draw() {
    // Temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid Arka Plan Çizimi
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Yılan Çizimi (Skinler)
    const activeSkin = SKINS.find(s => s.id === currentUser.active_skin);
    
    snake.forEach((part, index) => {
        ctx.save();
        
        let color = activeSkin.color;
        let colorEnd = activeSkin.colorEnd;
        
        // Rainbow Skin Modu
        if (activeSkin.id === 'rainbow') {
            const hue = (index * 15 + Date.now() / 15) % 360;
            color = `hsl(${hue}, 100%, 55%)`;
            colorEnd = `hsl(${(hue + 20) % 360}, 100%, 55%)`;
        }

        // Gövde için neon parlama efekti (Sadece kafa ve ara ara parlama)
        ctx.shadowBlur = index === 0 ? 15 : 6;
        ctx.shadowColor = color;

        // Gradyan oluşturma
        if (activeSkin.id !== 'rainbow') {
            const grad = ctx.createLinearGradient(
                part.x * gridSize, part.y * gridSize, 
                (part.x + 1) * gridSize, (part.y + 1) * gridSize
            );
            grad.addColorStop(0, color);
            grad.addColorStop(1, colorEnd);
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = color;
        }

        // Yuvarlatılmış köşeli yılan çizimi
        ctx.beginPath();
        const r = index === 0 ? 6 : 4; // Kafa daha yuvarlak
        const x = part.x * gridSize + 1;
        const y = part.y * gridSize + 1;
        const w = gridSize - 2;
        const h = gridSize - 2;

        ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
        ctx.fill();

        // Kafa üzerine göz çizimi
        if (index === 0) {
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            
            // Yöne göre göz yerleşimi
            let eyeX1, eyeY1, eyeX2, eyeY2;
            if (dx === 0) { // Dikey hareket (Yukarı/Aşağı)
                eyeY1 = y + h/2;
                eyeY2 = y + h/2;
                eyeX1 = x + w/4;
                eyeX2 = x + 3*w/4;
            } else { // Yatay hareket (Sağ/Sol)
                eyeX1 = x + w/2;
                eyeX2 = x + w/2;
                eyeY1 = y + h/4;
                eyeY2 = y + 3*h/4;
            }

            ctx.arc(eyeX1, eyeY1, 2, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // Meyve Çizimi
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = fruit.color;
    ctx.fillStyle = fruit.color;

    const fx = fruit.x * gridSize + gridSize/2;
    const fy = fruit.y * gridSize + gridSize/2;
    const r = gridSize/2 - 2;

    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();

    // Özel meyve detayları
    if (fruit.type === "apple") {
        // Yeşil yaprak
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy - r);
        ctx.quadraticCurveTo(fx + 4, fy - r - 4, fx + 2, fy - r - 6);
        ctx.stroke();
    } else if (fruit.type === "banana") {
        // Muz ucu
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.arc(fx - 4, fy + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (fruit.type === "strawberry") {
        // Yeşil çilek sapı
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.moveTo(fx, fy - r);
        ctx.lineTo(fx - 3, fy - r + 3);
        ctx.lineTo(fx + 3, fy - r + 3);
        ctx.closePath();
        ctx.fill();
    } else if (fruit.type === "watermelon") {
        // Karpuz çizgileri çizimi (İçine küçük koyu yeşil çizgiler)
        ctx.strokeStyle = "#047857";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(fx, fy, r - 3, 0, Math.PI, true);
        ctx.stroke();
    }
    ctx.restore();

    // Patlama efektlerini çiz
    drawParticles();
}

// -------------------------------------------------------------
// 8. OYUN BİTTİ VE VERİTABANI GÖNDERİMİ
// -------------------------------------------------------------
async function handleGameOver() {
    playCrashSound();
    clearInterval(gameInterval);
    isPaused = false;
    
    // Yükleme ekranı gibi göster
    document.getElementById('summary-score').innerText = score;
    document.getElementById('summary-earned').innerText = score; // Alınan meyve puanı
    document.getElementById('summary-total-points').innerText = "...";
    document.getElementById('bonus-card').classList.add('hidden');
    showScreen('gameOver');

    // Skor ve Bonus Puanları Gönder
    try {
        const res = await submitScore(currentUser.username, score);
        
        // Kullanıcı nesnesini güncelle
        currentUser.total_points = res.newTotalPoints;
        document.getElementById('summary-total-points').innerText = res.newTotalPoints;
        
        // Derece kontrolü ve arayüzü
        if (res.rank) {
            playRecordSound(); // Özel rekor müziği çal
            document.getElementById('bonus-card').classList.remove('hidden');
            
            let rankText = res.rank === 1 ? "BİRİNCİ" : (res.rank === 2 ? "İKİNCİ" : "ÜÇÜNCÜ");
            document.getElementById('bonus-message').innerHTML = `Tebrikler! Liderlik tablosunda <strong>${rankText}</strong> oldunuz. <br>Harcayabileceğiniz <strong>+${res.bonusPoints} Ödül Puanı</strong> hesabınıza yüklendi!`;
        }
    } catch (err) {
        console.error("Skor kaydedilemedi:", err);
    }
}

// -------------------------------------------------------------
// 9. KONTROLLER & KLAVYE ETKİNLİKLERİ
// -------------------------------------------------------------
window.addEventListener('keydown', e => {
    // Sayfa kaydırma tuşlarını engelle (Yukarı, Aşağı vb.)
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(e.key) > -1) {
        e.preventDefault();
    }

    if (screens.game.classList.contains('hidden') || isPaused) return;

    switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case "ArrowDown":
        case "s":
        case "S":
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case "ArrowRight":
        case "d":
        case "D":
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
        case " ":
            togglePause();
            break;
    }
});

// Mobil Dokunmatik Yönlendirme (Swipe)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
    if (screens.game.classList.contains('hidden') || isPaused) return;

    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Yatay kaydırma
        if (diffX > 30 && dx !== -1) { dx = 1; dy = 0; }
        else if (diffX < -30 && dx !== 1) { dx = -1; dy = 0; }
    } else {
        // Dikey kaydırma
        if (diffY > 30 && dy !== -1) { dx = 0; dy = 1; }
        else if (diffY < -30 && dy !== 1) { dx = 0; dy = -1; }
    }
}, { passive: true });

// Mobil Ekran Buton Kontrolleri
document.getElementById('ctrl-up').addEventListener('click', () => { if (dy !== 1) { dx = 0; dy = -1; } });
document.getElementById('ctrl-down').addEventListener('click', () => { if (dy !== -1) { dx = 0; dy = 1; } });
document.getElementById('ctrl-left').addEventListener('click', () => { if (dx !== 1) { dx = -1; dy = 0; } });
document.getElementById('ctrl-right').addEventListener('click', () => { if (dx !== -1) { dx = 1; dy = 0; } });

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('btn-pause').innerText = isPaused ? "▶" : "⏸";
}

// -------------------------------------------------------------
// 10. MAĞAZA ARAYÜZÜNÜN RENDER EDİLMESİ
// -------------------------------------------------------------
function renderShop() {
    const container = document.getElementById('skins-container');
    container.innerHTML = "";
    
    document.getElementById('shop-points').innerText = currentUser.total_points;

    SKINS.forEach(skin => {
        const unlocked = currentUser.unlocked_skins.includes(skin.id);
        const active = currentUser.active_skin === skin.id;

        const card = document.createElement('div');
        card.className = "skin-card";

        // Preview stili
        let previewStyle = `background: ${skin.color};`;
        if (skin.id === 'rainbow') {
            previewStyle = `background: linear-gradient(45deg, red, orange, yellow, green, blue, purple);`;
        } else if (skin.colorEnd) {
            previewStyle = `background: linear-gradient(135deg, ${skin.color}, ${skin.colorEnd});`;
        }

        // Buton yapısı
        let btnHTML = "";
        if (active) {
            btnHTML = `<button class="btn btn-skin-action active" disabled>Kuşanıldı</button>`;
        } else if (unlocked) {
            btnHTML = `<button class="btn btn-skin-action equip" onclick="handleEquipSkin('${skin.id}')">Kuşan</button>`;
        } else {
            btnHTML = `<button class="btn btn-skin-action buy" onclick="handleBuySkin('${skin.id}', ${skin.cost})">${skin.cost} Puan</button>`;
        }

        card.innerHTML = `
            <div class="skin-card-left">
                <div class="skin-preview" style="${previewStyle}"></div>
                <div class="skin-info">
                    <span class="skin-name">${skin.name}</span>
                    <span class="skin-cost">${skin.desc}</span>
                </div>
            </div>
            ${btnHTML}
        `;

        container.appendChild(card);
    });
}

// Global olarak eşleme (onclick çağrıları için)
window.handleBuySkin = async (skinId, cost) => {
    playClickSound();
    if (currentUser.total_points < cost) {
        alert("Yetersiz Puan! Oyun oynayarak daha fazla puan kazanın.");
        return;
    }
    
    if (confirm(`${cost} Puan harcayarak bu deriyi açmak istiyor musunuz?`)) {
        const res = await buySkin(currentUser.username, skinId, cost);
        if (res.success) {
            currentUser = res.data;
            renderShop();
            document.getElementById('menu-points').innerText = currentUser.total_points;
        } else {
            alert(res.error);
        }
    }
};

window.handleEquipSkin = async (skinId) => {
    playClickSound();
    const res = await equipSkin(currentUser.username, skinId);
    if (res.success) {
        currentUser = res.data;
        renderShop();
    } else {
        alert(res.error);
    }
};

// -------------------------------------------------------------
// 11. LİDERLİK TABLOSUNUN RENDER EDİLMESİ
// -------------------------------------------------------------
async function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Yükleniyor...</td></tr>`;

    try {
        const data = await fetchLeaderboard();
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Henüz skor bulunamadı.</td></tr>`;
            return;
        }

        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            
            // Sıra rozeti stili
            let rankBadge = "";
            let rewardBonus = "-";
            
            if (index === 0) {
                rankBadge = `<span class="rank-badge rank-1">1</span>`;
                rewardBonus = `👑 +500 Puan`;
            } else if (index === 1) {
                rankBadge = `<span class="rank-badge rank-2">2</span>`;
                rewardBonus = `🥈 +300 Puan`;
            } else if (index === 2) {
                rankBadge = `<span class="rank-badge rank-3">3</span>`;
                rewardBonus = `🥉 +150 Puan`;
            } else {
                rankBadge = `<span class="rank-badge rank-other">${index + 1}</span>`;
            }

            tr.innerHTML = `
                <td>${rankBadge}</td>
                <td style="font-weight:600;">${row.username}</td>
                <td class="green-text" style="font-weight:700;">${row.score}</td>
                <td class="yellow-text" style="font-weight:600;">${rewardBonus}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--neon-red);">Yükleme hatası!</td></tr>`;
    }
}

// -------------------------------------------------------------
// 12. MENÜ BUTONLARI VE ETKİNLİK DİNLEYİCİLERİ
// -------------------------------------------------------------

// Oyuna Giriş Butonu
document.getElementById('btn-login').addEventListener('click', async () => {
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    const errorText = document.getElementById('auth-error');

    if (!username) {
        errorText.innerText = "Lütfen geçerli bir isim girin.";
        return;
    }
    
    errorText.innerText = "Giriş yapılıyor...";
    playClickSound();

    try {
        const res = await loginOrCreateProfile(username);
        currentUser = res.data;
        
        // Menü verilerini güncelle
        document.getElementById('menu-username').innerText = currentUser.username;
        document.getElementById('menu-points').innerText = currentUser.total_points;
        
        showScreen('menu');
    } catch (err) {
        errorText.innerText = "Giriş başarısız oldu. Lütfen tekrar deneyin.";
    }
});

// Menü Seçimleri (Zorluk)
const diffButtons = document.querySelectorAll('.btn-diff');
diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        playClickSound();
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficultySpeed = parseInt(btn.getAttribute('data-speed'));
    });
});

// Menü Seçimleri (Mod)
const modeButtons = document.querySelectorAll('.btn-mode');
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        playClickSound();
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.getAttribute('data-mode');
    });
});

// Oyun Duraklatma ve Mute Butonları
document.getElementById('btn-pause').addEventListener('click', () => {
    playClickSound();
    togglePause();
});

document.getElementById('btn-mute').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('btn-mute').innerText = isMuted ? "🔇" : "🔊";
});

// Oyundan Çıkma Butonları
document.getElementById('btn-quit').addEventListener('click', () => {
    playClickSound();
    if (confirm("Oyundan çıkmak istediğinize emin misiniz? İlerlemeniz kaydedilmeyecektir.")) {
        clearInterval(gameInterval);
        document.getElementById('menu-points').innerText = currentUser.total_points;
        showScreen('menu');
    }
});

// Arayüz Geçiş Butonları
document.getElementById('btn-start-game').addEventListener('click', () => {
    playClickSound();
    showScreen('game');
    startGameLoop();
});

document.getElementById('btn-open-shop').addEventListener('click', () => {
    playClickSound();
    renderShop();
    showScreen('shop');
});

document.getElementById('btn-close-shop').addEventListener('click', () => {
    playClickSound();
    showScreen('menu');
});

document.getElementById('btn-open-leaderboard').addEventListener('click', () => {
    playClickSound();
    renderLeaderboard();
    showScreen('leaderboard');
});

document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
    playClickSound();
    showScreen('menu');
});

document.getElementById('btn-restart').addEventListener('click', () => {
    playClickSound();
    showScreen('game');
    startGameLoop();
});

document.getElementById('btn-game-over-menu').addEventListener('click', () => {
    playClickSound();
    document.getElementById('menu-points').innerText = currentUser.total_points;
    showScreen('menu');
});

// Supabase Ayarları Ekranı Event Dinleyicileri
document.getElementById('btn-open-settings').addEventListener('click', () => {
    playClickSound();
    document.getElementById('setting-url-input').value = localStorage.getItem("supabase_url") || "";
    document.getElementById('setting-key-input').value = localStorage.getItem("supabase_anon_key") || "";
    document.getElementById('settings-status').innerText = "";
    showScreen('settings');
});

document.getElementById('btn-close-settings').addEventListener('click', () => {
    playClickSound();
    showScreen('auth');
});

document.getElementById('btn-save-settings').addEventListener('click', () => {
    playClickSound();
    const url = document.getElementById('setting-url-input').value.trim();
    const key = document.getElementById('setting-key-input').value.trim();
    const statusText = document.getElementById('settings-status');

    if (!url || !key) {
        statusText.style.color = "var(--neon-red)";
        statusText.innerText = "Lütfen her iki alanı da doldurun.";
        return;
    }

    statusText.style.color = "var(--text-primary)";
    statusText.innerText = "Bağlantı kuruluyor...";

    const success = window.setupSupabase(url, key);
    if (success) {
        statusText.style.color = "var(--neon-green)";
        statusText.innerText = "Bağlantı Başarılı! 1.5 saniye içinde geri dönülüyor...";
        setTimeout(() => {
            showScreen('auth');
        }, 1500);
    } else {
        statusText.style.color = "var(--neon-red)";
        statusText.innerText = "Hata: Bağlantı kurulamadı. URL veya Key geçersiz.";
    }
});
