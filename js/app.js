// js/app.js

// ==========================================
// 1. DATA (Lokal & Dummy Default)
// ==========================================
const defaultArticles = [
    { id: 1, title: "Mein Alltag", theme: "Alltag", level: "A1", content: "Ich heiße Anna. Ich wohne in Berlin. Ich lerne jeden Tag Deutsch. Berlin ist groß und schön." },
    { id: 2, title: "Reise nach München", theme: "Reisen", level: "A2", content: "Letztes Jahr bin ich nach München gereist. Das Wetter war sehr gut. Ich habe viele Brezeln gegessen." },
    { id: 3, title: "Die Zukunft der Technologie", theme: "Technologie", level: "B1", content: "Technologie verändert unser Leben schnell. Viele Menschen arbeiten heute im Homeoffice. Das spart Zeit." }
];

const grammarLessons = [
    { id: "g1", level: "A1", title: "Präsens (Kata Kerja)", explanation: "Kata kerja bahasa Jerman berakhiran -en. Saat digunakan dengan 'ich' (saya), akhirannya menjadi -e.", merke: "ich lerne, du lernst, er/sie/es lernt.", question: "Ich ___ aus Indonesien.", options: ["komme", "kommt", "kommen"], answer: 0 },
    { id: "g2", level: "A1", title: "Personalpronomen", explanation: "Kata ganti orang digunakan untuk menggantikan subjek. Ich (saya), du (kamu), er (dia laki), sie (dia perempuan).", merke: "Bentuk sopan (Anda) menggunakan 'Sie' dengan huruf S kapital.", question: "___ heiße Müller.", options: ["Er", "Ich", "Du"], answer: 1 },
    { id: "g3", level: "A2", title: "Perfekt (Masa Lalu)", explanation: "Masa lalu diucapkan menggunakan haben/sein + Partizip II (ge-).", merke: "Ich HABE einen Apfel GEGESSEN.", question: "Ich habe gestern Fußball ___.", options: ["spiele", "gespielt", "gespielen"], answer: 1 },
    { id: "g4", level: "B1", title: "Weil (Karena)", explanation: "Kata hubung 'weil' memindahkan kata kerja ke posisi paling akhir dalam kalimat.", merke: "Ich lerne Deutsch, WEIL ich in Deutschland leben MÖCHTE.", question: "Er ist müde, weil er viel ___.", options: ["arbeitet", "arbeiten", "gearbeitet hat"], answer: 2 }
];

let articlesData = [];
let flashcardsData = JSON.parse(localStorage.getItem('lbd_flashcards')) || [];
let userData = JSON.parse(localStorage.getItem('lbd_user')) || { xp: 0, streak: 0, lastActive: '', wordsLearned: 0, articlesRead: 0, grammarDone: 0 };

// ==========================================
// 2. INISIALISASI & FETCH
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    checkStreak();
    updateUserUI();

    const statsEl = document.getElementById('global-stats');

    try {
        if (typeof supabaseClient !== 'undefined') {
            const { data: articles, error } = await supabaseClient.from('articles').select('*').order('created_at', { ascending: false });
            if (error) throw error; 
            articlesData = (articles && articles.length > 0) ? articles : defaultArticles;
        } else {
            throw new Error("Supabase SDK tidak ditemukan");
        }
    } catch (err) {
        console.warn("Menggunakan Mode Lokal.");
        articlesData = defaultArticles;
    }
    
    renderArticles('all');
    renderGrammar('all');
    renderFlashcards();
    muatPertanyaanKuis();
    updateDashboardStats();
    
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) submitBtn.addEventListener("click", cekJawabanKuis);
});

// ==========================================
// 3. PROGRESS, XP, STREAK (GAMIFIKASI)
// ==========================================
function addXP(amount) {
    userData.xp += amount;
    saveUser();
    updateUserUI();
    
    const toast = document.getElementById('xp-toast');
    if(toast) {
        toast.innerText = `+${amount} XP ✨`;
        toast.classList.remove('show');
        void toast.offsetWidth; // trigger reflow
        toast.classList.add('show');
    }
}

function checkStreak() {
    const today = new Date().toDateString();
    if (userData.lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (userData.lastActive !== yesterday.toDateString() && userData.lastActive !== '') {
            userData.streak = 0;
        }
        if(userData.lastActive !== '') {
           userData.streak += 1;
        } else {
           userData.streak = 1; 
        }
        userData.lastActive = today;
        saveUser();
    }
}

function saveUser() {
    localStorage.setItem('lbd_user', JSON.stringify(userData));
    updateDashboardStats();
}

function updateUserUI() {
    const navXp = document.getElementById('nav-xp');
    const navStreak = document.getElementById('nav-streak');
    const profXp = document.getElementById('prof-xp');
    const profStreak = document.getElementById('prof-streak');
    
    if(navXp) navXp.innerText = userData.xp;
    if(navStreak) navStreak.innerText = userData.streak;
    if(profXp) profXp.innerText = userData.xp;
    if(profStreak) profStreak.innerText = userData.streak;
}

function updateDashboardStats() {
    const dashWords = document.getElementById('dash-words');
    const dashArticles = document.getElementById('dash-articles');
    const dashGrammar = document.getElementById('dash-grammar');
    
    if(dashWords) dashWords.innerText = flashcardsData.length;
    if(dashArticles) dashArticles.innerText = userData.articlesRead || 0;
    if(dashGrammar) dashGrammar.innerText = userData.grammarDone || 0;
    
    const setRing = (sel, val) => {
        const el = document.querySelector(sel);
        if(el) { el.innerText = `${Math.min(val, 100)}%`; el.style.background = `conic-gradient(var(--primary) ${Math.min(val, 100)}%, transparent 0)`; }
    };
    setRing('.level-badge.a1 + h4 + p + .progress-ring', (userData.xp / 10));
    setRing('.level-badge.a2 + h4 + p + .progress-ring', (userData.xp > 500 ? (userData.xp - 500)/15 : 0));
}

// ==========================================
// 4. NAVIGATION
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId);
    if(targetPage) targetPage.classList.add('active-page');
    
    if (window.event && window.event.currentTarget && window.event.currentTarget.classList.contains('nav-item')) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        window.event.currentTarget.classList.add('active');
    }
    window.scrollTo(0,0);
}

function switchWortschatzTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-tab'));
    
    const targetTabBtn = document.getElementById(`tab-${tabName}`);
    const targetTabContent = document.getElementById(`w-${tabName}`);
    
    if(targetTabBtn) targetTabBtn.classList.add('active');
    if(targetTabContent) targetTabContent.classList.add('active-tab');
}

// ==========================================
// 5. GRAMMATIK (INTERACTIVE LERNEN)
// ==========================================
function filterGrammar(level) {
    if (window.event && window.event.target && window.event.target.classList.contains('filter-btn')) {
        const filterContainer = document.querySelector('#lernen .filter-container');
        if(filterContainer) {
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        }
        window.event.target.classList.add('active');
    }
    renderGrammar(level);
}

function renderGrammar(levelFilter) {
    const container = document.getElementById("grammar-list");
    if(!container) return;
    container.innerHTML = "";
    
    const filtered = levelFilter === 'all' ? grammarLessons : grammarLessons.filter(g => g.level.toUpperCase() === levelFilter.toUpperCase());
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state-container">📚<br>Belum ada materi untuk level ini.</div>`; return;
    }

    filtered.forEach(g => {
        container.innerHTML += `
            <div class="list-item" onclick="bukaGrammar('${g.id}')">
                <span class="level-badge ${g.level.toLowerCase()} mb-2" style="display:inline-block">${g.level}</span>
                <h3>${g.title}</h3>
                <p>Klik untuk mulai belajar →</p>
            </div>`;
    });
}

function bukaGrammar(id) {
    const g = grammarLessons.find(x => x.id === id);
    if (!g) return;
    
    const gLevel = document.getElementById('g-level');
    if(gLevel) {
        gLevel.className = `level-badge ${g.level.toLowerCase()}`;
        gLevel.innerText = g.level;
    }
    
    document.getElementById('g-title').innerText = g.title;
    document.getElementById('g-explanation').innerText = g.explanation;
    document.getElementById('g-merke').innerText = g.merke;
    document.getElementById('g-question').innerText = g.question;
    
    const opts = document.getElementById('g-options');
    opts.innerHTML = '';
    document.getElementById('g-feedback').innerText = '';
    
    g.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => cekGrammar(btn, index, g.answer);
        opts.appendChild(btn);
    });
    
    document.getElementById("grammar-list").style.display = "none";
    const filterContainer = document.querySelector("#lernen .filter-container");
    if(filterContainer) filterContainer.style.display = "none";
    document.getElementById("grammar-detail").style.display = "block";
}

function cekGrammar(btn, selected, correct) {
    const parent = btn.parentElement;
    Array.from(parent.children).forEach(b => b.disabled = true);
    
    const fb = document.getElementById('g-feedback');
    if (selected === correct) {
        btn.classList.add('correct');
        fb.innerHTML = `🎉 <b>Richtig!</b> +20 XP`; fb.style.color = 'var(--success)';
        addXP(20);
        userData.grammarDone = (userData.grammarDone || 0) + 1; saveUser();
    } else {
        btn.classList.add('wrong');
        parent.children[correct].classList.add('correct');
        fb.innerHTML = `❌ <b>Nicht ganz.</b> Coba ingat aturan di atas.`; fb.style.color = '#ff7b72';
    }
}

function tutupGrammar() {
    document.getElementById("grammar-detail").style.display = "none";
    document.getElementById("grammar-list").style.display = "grid";
    const filterContainer = document.querySelector("#lernen .filter-container");
    if(filterContainer) filterContainer.style.display = "flex";
}

// ==========================================
// 6. ARTIKEL & TERJEMAHAN PER KALIMAT
// ==========================================
let currentArticleRaw = "";

function filterLevel(level) {
    if (window.event && window.event.target && window.event.target.classList.contains('filter-btn')) {
        const filterContainer = document.querySelector('#lesen .filter-container');
        if(filterContainer) {
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        }
        window.event.target.classList.add('active');
    }
    renderArticles(level);
}

function renderArticles(levelFilter) {
    const container = document.getElementById("article-list-container");
    if(!container) return;
    container.innerHTML = "";
    const filtered = levelFilter === 'all' ? articlesData : articlesData.filter(a => a.level.toUpperCase() === levelFilter.toUpperCase());
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state-container">📚<br>Vielleicht kommt bald ein neuer Artikel.</div>`; return;
    }

    filtered.forEach(art => {
        const timeRead = Math.max(1, Math.ceil(art.content.split(' ').length / 150)); 
        container.innerHTML += `
            <div class="list-item" onclick="bukaDetailArtikel('${art.id}')">
                <div class="flex-between mb-2">
                    <span class="level-badge ${art.level.toLowerCase()}">${art.level}</span>
                    <span class="text-sm text-muted">⏱ ${timeRead} min</span>
                </div>
                <h3>${art.title}</h3>
                <p>Thema: ${art.theme}</p>
            </div>`;
    });
}

function bukaDetailArtikel(id) {
    const art = articlesData.find(a => a.id == id);
    if (!art) return;

    currentArticleRaw = art.content; 
    
    const detailLevel = document.getElementById("detail-level");
    if(detailLevel) {
        detailLevel.className = `level-badge ${art.level.toLowerCase()}`;
        detailLevel.innerText = art.level;
    }
    
    document.getElementById("detail-theme").innerText = art.theme;
    document.getElementById("detail-title").innerText = art.title;
    
    const gLink = document.getElementById("article-grammar-link");
    const matchedG = grammarLessons.find(g => g.level.toUpperCase() === art.level.toUpperCase());
    if (matchedG && gLink) {
        gLink.style.display = "flex";
        document.getElementById("hint-g-title").innerText = matchedG.title;
        gLink.onclick = () => { showPage('lernen'); bukaGrammar(matchedG.id); };
    } else if(gLink) { 
        gLink.style.display = "none"; 
    }

    renderKalimatJerman(currentArticleRaw);
    
    const toggle = document.getElementById('translate-toggle');
    if(toggle) toggle.checked = false;
    
    document.getElementById("article-list-view").style.display = "none";
    document.getElementById("article-detail-view").style.display = "block";
    
    addXP(5);
    userData.articlesRead = (userData.articlesRead || 0) + 1; saveUser();
}

function renderKalimatJerman(text) {
    const container = document.getElementById("detail-content");
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let html = "";
    sentences.forEach((sentence, idx) => {
        const wordsHtml = sentence.split(/\s+/).map(w => {
            const clean = w.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()"]/g, "").toLowerCase();
            return `<span class="clickable-word" onclick="bukaPopup('${clean}', '${w.replace(/'/g, "\\'")}')">${w}</span>`;
        }).join(" ");
        
        html += `
            <div class="translation-pair" id="pair-${idx}">
                <p class="de-text">${wordsHtml}</p>
                <p class="id-text" style="display:none;"></p>
            </div>
        `;
    });
    if(container) container.innerHTML = html;
}

async function toggleTranslation(checkbox) {
    const pairs = document.querySelectorAll('.translation-pair');
    
    if (!checkbox.checked) {
        pairs.forEach(p => { 
            const idText = p.querySelector('.id-text');
            if(idText) idText.style.display = 'none'; 
        });
        return;
    }

    pairs.forEach(p => { 
        const idText = p.querySelector('.id-text');
        if(idText) {
            idText.style.display = 'block';
            if(idText.innerText === "") idText.innerHTML = "<em>Menerjemahkan... ⏳</em>"; 
        }
    });

    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=id&dt=t&q=${encodeURIComponent(currentArticleRaw)}`);
        const data = await res.json();
        
        let segmentIndex = 0;
        pairs.forEach((p, idx) => {
            const idText = p.querySelector('.id-text');
            if(idText) {
                if(data[0] && data[0][segmentIndex]) {
                     idText.innerText = "🇮🇩 " + data[0][segmentIndex][0];
                     segmentIndex++;
                } else {
                     idText.innerText = "Gagal memetakan terjemahan.";
                }
            }
        });
    } catch(e) {
        pairs.forEach(p => {
            const idText = p.querySelector('.id-text');
            if(idText) idText.innerText = "Koneksi terjemahan gagal.";
        });
    }
}

function tutupArtikel() {
    document.getElementById("article-detail-view").style.display = "none";
    document.getElementById("article-list-view").style.display = "block";
    closePopup();
}

// ==========================================
// 7. POP-UP TERJEMAHAN KATA
// ==========================================
async function bukaPopup(searchWord, original) {
    const popup = document.getElementById("translation-popup");
    if(!popup) return;
    
    document.getElementById("popup-word").innerText = original;
    document.getElementById("popup-meaning").innerText = "Mencari...";
    popup.style.display = "block";

    document.getElementById("btn-suara").onclick = () => ucapkanKata(searchWord);
    
    document.getElementById("btn-simpan").onclick = () => {
        const arti = document.getElementById("popup-meaning").innerText;
        if (arti.includes("Mencari") || arti.includes("Gagal")) return;
        
        if (!flashcardsData.find(f => f.jerman === searchWord)) {
            flashcardsData.unshift({ jerman: searchWord, indo: arti, mastered: false });
            localStorage.setItem('lbd_flashcards', JSON.stringify(flashcardsData));
            renderFlashcards();
            muatPertanyaanKuis();
            
            const btnSimpan = document.getElementById("btn-simpan");
            if(btnSimpan) {
                btnSimpan.innerText = "Tersimpan ✔";
                btnSimpan.style.background = "var(--success)";
                addXP(2); 
                setTimeout(() => { btnSimpan.innerText = "💾 Speichern"; btnSimpan.style.background = "var(--success)"; }, 2000);
            }
        }
    };

    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=id&dt=t&q=${encodeURIComponent(searchWord)}`);
        const data = await res.json();
        document.getElementById("popup-meaning").innerText = data[0][0][0];
    } catch(e) { document.getElementById("popup-meaning").innerText = "Gagal menerjemahkan."; }
}

function closePopup() { 
    const popup = document.getElementById("translation-popup");
    if(popup) popup.style.display = "none"; 
}

// ==========================================
// ==========================================
// 8. WORTSCHATZ (KUIS, FLASHCARD, KAMUS)
// ==========================================
function renderFlashcards() {
    const container = document.getElementById("flashcard-list");
    if (!container) return;
    
    container.innerHTML = "";
    
    const countEl = document.getElementById("flashcard-count");
    if(countEl) countEl.innerText = `${flashcardsData.length} Wörter gespeichert`;
    
    const dashWordsEl = document.getElementById("dash-words");
    if(dashWordsEl) dashWordsEl.innerText = flashcardsData.length; 

    if (flashcardsData.length === 0) {
        container.innerHTML = `<div class="empty-state-container">🧠<br>Kosakatamu masih kosong. Klik kata di artikel untuk menyimpan.</div>`;
        return;
    }

    flashcardsData.forEach((f) => {
        container.innerHTML += `
            <div class="list-item flex-between" style="border-left: 4px solid var(--primary);">
                <div>
                    <h3 style="margin:0 0 2px 0; text-transform:capitalize;">${f.jerman}</h3>
                    <p style="margin:0;">${f.indo}</p>
                </div>
                <button onclick="ucapkanKata('${f.jerman}')" class="btn-small">🔊</button>
            </div>
        `;
    });
}

function muatPertanyaanKuis() {
    const questionEl = document.getElementById("question-text");
    if (!questionEl) return;
    if (flashcardsData.length === 0) { questionEl.innerText = "Belum ada kata disimpan."; return; }
    
    currentQuizWord = flashcardsData[Math.floor(Math.random() * flashcardsData.length)];
    questionEl.innerHTML = `Wie sagt man <br> <span style="color:var(--primary)">"${currentQuizWord.indo}"</span> <br> auf Deutsch?`;
    document.getElementById("user-answer").value = "";
    document.getElementById("feedback").innerText = "";
}

function cekJawabanKuis() {
    if (!currentQuizWord) return;
    const answer = document.getElementById("user-answer").value.trim().toLowerCase();
    const correct = currentQuizWord.jerman.toLowerCase().replace(/[.,!?]/g, "");

    const fb = document.getElementById("feedback");
    if (!fb) return;

    if (answer === "") { fb.innerHTML = "<span style='color:var(--accent)'>Ketik jawaban dulu!</span>"; return; }

    if (answer === correct) {
        fb.innerHTML = "<span style='color:var(--success)'>🎉 Richtig!</span>";
        ucapkanKata(currentQuizWord.jerman); 
        addXP(10);
        setTimeout(muatPertanyaanKuis, 1200);
    } else {
        fb.innerHTML = `<span style='color:#ff7b72'>❌ Falsch. Jawaban: <b>${currentQuizWord.jerman}</b></span>`;
    }
}

async function tanyaAI() {
    const q = document.getElementById("search-dict").value.trim();
    if(!q) return;
    const resBox = document.getElementById("dict-result");
    if(!resBox) return;
    
    resBox.innerHTML = "<span class='text-muted'>Menerjemahkan... ⏳</span>";

    try {
        let res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(q)}`);
        let data = await res.json();
        let hasil = data[0][0][0];

        if (hasil.toLowerCase() === q.toLowerCase()) {
            res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=de&dt=t&q=${encodeURIComponent(q)}`);
            data = await res.json(); hasil = data[0][0][0];
        }

        resBox.innerHTML = `
            <div class="flex-between">
                <span style="font-size:1.2rem; font-weight:bold; color:var(--success)">${hasil}</span>
                <button onclick="ucapkanKata('${hasil}')" class="btn-outline">🔊 Hören</button>
            </div>
        `;
    } catch(e) { resBox.innerHTML = "<span style='color:var(--accent);'>Error API Translate.</span>"; }
}

function ucapkanKata(kata) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(kata);
        utterance.lang = 'de-DE'; utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}