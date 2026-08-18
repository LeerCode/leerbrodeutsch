// js/app.js

const defaultArticles = [
    { id: 1, title: "Vom Bett direkt zum Unterricht?", theme: "Bildung & Alltag", level: "A1", content: "Vom Bett direkt zum Unterricht? Das ist eine interessante Frage für Deutschlerner. Viele Schüler lernen heute online." },
    { id: 2, title: "Apfelküchle – Ein süßer Klassiker", theme: "Kultur & Essen", level: "A2", content: "Apfelküchle sind sehr lecker. Man isst sie oft in Süddeutschland mit Vanillesoße." },
    { id: 3, title: "Die Geschichte des Geldautomaten", theme: "Technologie & Wirtschaft", level: "C2", content: "Der Geldautomat hat die Art und Weise, wie wir auf unsere Finanzen zugreifen, revolutioniert." }
];

const defaultFlashcards = [
    { jerman: "haus", indo: "rumah", mastered: false },
    { jerman: "hund", indo: "anjing", mastered: false },
    { jerman: "katze", indo: "kucing", mastered: false }
];

let articlesData = [];
let flashcardsData = JSON.parse(localStorage.getItem('lbd_flashcards')) || defaultFlashcards;

document.addEventListener("DOMContentLoaded", async () => {
    const statsEl = document.getElementById('global-stats');

    try {
        if (typeof supabaseClient !== 'undefined') {
            const { data: articles, error } = await supabaseClient.from('articles').select('*').order('created_at', { ascending: false });
            
            if (error) throw error; 

            if (articles && articles.length > 0) {
                articlesData = articles;
                statsEl.innerHTML = `<span style="color: var(--success);">● Server Terhubung</span>`;
            } else {
                articlesData = defaultArticles;
                statsEl.innerText = `Data Server Kosong`;
            }
        } else {
            throw new Error("Supabase SDK tidak ditemukan");
        }
    } catch (err) {
        console.warn("Gagal terhubung ke Server. Mode Lokal.", err);
        articlesData = defaultArticles;
        statsEl.innerHTML = `<span style="color: var(--accent);">⚠️ Mode Lokal</span>`;
    }
    
    // Inisialisasi Fungsi
    renderArticles('all');
    renderFlashcards();
    muatPertanyaanKuis();
    
    document.getElementById("submit-btn")?.addEventListener("click", cekJawabanKuis);
});

// --- NAVIGASI ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');
    
    if (window.event && window.event.currentTarget) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        window.event.currentTarget.classList.add('active');
    }
}

// --- KUIS ENGINE ---
let currentQuizWord = null;
let streak = 0;

function muatPertanyaanKuis() {
    const questionEl = document.getElementById("question-text");
    if (!questionEl) return;

    if (flashcardsData.length === 0) {
        questionEl.innerText = "Flashcard kosong. Simpan kata dulu!";
        return;
    }
    currentQuizWord = flashcardsData[Math.floor(Math.random() * flashcardsData.length)];
    questionEl.innerText = `Jermannya "${currentQuizWord.indo}"?`;
    document.getElementById("user-answer").value = "";
    document.getElementById("feedback").innerText = "";
}

function cekJawabanKuis() {
    if (!currentQuizWord) return;
    const answer = document.getElementById("user-answer").value.trim().toLowerCase();
    const correct = currentQuizWord.jerman.toLowerCase().replace(/[.,!?]/g, ""); 

    if (answer === "") {
        document.getElementById("feedback").innerHTML = "<span style='color:var(--accent)'>Ketik jawaban dulu!</span>";
        return;
    }

    if (answer === correct) {
        streak++;
        const currentScore = parseInt(document.getElementById("score").innerText) || 0;
        document.getElementById("score").innerText = currentScore + 10;
        document.getElementById("streak-badge").innerText = `🔥 Streak: ${streak}`;
        document.getElementById("feedback").innerHTML = "<span style='color:var(--success)'>Mantap! Jawabanmu Benar.</span>";
        ucapkanKata(currentQuizWord.jerman); 
        setTimeout(muatPertanyaanKuis, 1200);
    } else {
        streak = 0;
        document.getElementById("streak-badge").innerText = `🔥 Streak: 0`;
        document.getElementById("feedback").innerHTML = `<span style='color:#ff7b72'>Salah: <b>${currentQuizWord.jerman}</b></span>`;
    }
}

function ucapkanKata(kata) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(kata);
        utterance.lang = 'de-DE';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

// --- ARTIKEL RENDERING ---
function filterLevel(level) {
    if (window.event && window.event.target && window.event.target.tagName === 'BUTTON') {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        window.event.target.classList.add('active');
    }
    renderArticles(level);
}

function renderArticles(levelFilter) {
    const container = document.getElementById("article-list-container");
    if (!container) return;
    container.innerHTML = "";

    const filtered = levelFilter === 'all' 
        ? articlesData 
        : articlesData.filter(a => a.level.toLowerCase() === levelFilter.toLowerCase());
    
    if (filtered.length === 0) {
        container.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>Belum ada artikel.</p>";
        return;
    }

    filtered.forEach(art => {
        const timeRead = Math.max(1, Math.ceil(art.content.split(' ').length / 150)); 
        container.innerHTML += `
            <div class="article-item" onclick="bukaDetailArtikel('${art.id}')">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span class="badge">${art.level}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted)">⏱ ${timeRead} min</span>
                </div>
                <h3 style="margin:0 0 4px 0;">${art.title}</h3>
                <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">Tema: ${art.theme}</p>
            </div>
        `;
    });
}

function bukaDetailArtikel(id) {
    const art = articlesData.find(a => a.id == id);
    if (!art) return;

    document.getElementById("detail-title").innerText = art.title;
    document.getElementById("detail-theme").innerText = art.theme;
    
    const words = art.content.split(/\s+/);
    const clickableHtml = words.map(w => {
        const clean = w.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()"]/g, "").toLowerCase();
        return `<span class="clickable-word" onclick="bukaPopup('${clean}', '${w.replace(/'/g, "\\'")}')">${w}</span>`;
    }).join(" ");

    document.getElementById("detail-content").innerHTML = clickableHtml;
    
    document.getElementById("article-list-view").style.display = "none";
    document.getElementById("article-detail-view").style.display = "block";
}

function tutupArtikel() {
    document.getElementById("article-detail-view").style.display = "none";
    document.getElementById("article-list-view").style.display = "block";
    closePopup();
}

// --- POP-UP TERJEMAHAN ---
async function bukaPopup(searchWord, original) {
    const popup = document.getElementById("translation-popup");
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
            btnSimpan.innerText = "Tersimpan ✔";
            btnSimpan.style.background = "var(--success)";
            setTimeout(() => {
                btnSimpan.innerText = "💾 Simpan";
                btnSimpan.style.background = "var(--success)";
            }, 2000);
        }
    };

    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=id&dt=t&q=${encodeURIComponent(searchWord)}`);
        const data = await res.json();
        document.getElementById("popup-meaning").innerText = data[0][0][0];
    } catch(e) {
        document.getElementById("popup-meaning").innerText = "Gagal menerjemahkan.";
    }
}

function closePopup() { document.getElementById("translation-popup").style.display = "none"; }

// --- AI KAMUS ---
async function tanyaAI() {
    const q = document.getElementById("search-dict").value.trim();
    if(!q) return;
    const resBox = document.getElementById("dict-result");
    resBox.innerHTML = "<span style='color:var(--text-muted);'>Menerjemahkan... ⏳</span>";

    try {
        let res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(q)}`);
        let data = await res.json();
        let hasil = data[0][0][0];

        if (hasil.toLowerCase() === q.toLowerCase()) {
            res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=de&dt=t&q=${encodeURIComponent(q)}`);
            data = await res.json();
            hasil = data[0][0][0];
        }

        resBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:1.2rem; font-weight:bold; color:var(--success)">${hasil}</span>
                <button onclick="ucapkanKata('${hasil}')" class="btn-outline">🔊 Putar</button>
            </div>
        `;
    } catch(e) { 
        resBox.innerHTML = "<span style='color:var(--accent);'>Error API Translate.</span>"; 
    }
}

// --- RENDER FLASHCARD ---
function renderFlashcards() {
    const container = document.getElementById("flashcard-list");
    if (!container) return;
    
    container.innerHTML = "";
    document.getElementById("flashcard-count").innerText = `${flashcardsData.length} Kata`;

    flashcardsData.forEach((f) => {
        container.innerHTML += `
            <div class="card" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border-left: 4px solid var(--primary);">
                <div>
                    <h3 style="color:var(--text-main); margin:0 0 4px 0; text-transform:capitalize;">${f.jerman}</h3>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin:0;">${f.indo}</p>
                </div>
                <button onclick="ucapkanKata('${f.jerman}')" style="background:transparent; border:none; font-size:1.5rem; cursor:pointer; padding:0;">🔊</button>
            </div>
        `;
    });
}
