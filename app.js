// ==========================================
// 1. NAVIGASI ANTAR HALAMAN
// ==========================================
function showPage(pageId) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    // Tampilkan halaman yang dituju
    document.getElementById(pageId).classList.add('active-page');

    // Atur tombol navigasi yang aktif
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    // Refresh data jika membuka halaman tertentu
    if (pageId === 'flashcard') loadFlashcards();
    if (pageId === 'home') loadQuestion();
}

// ==========================================
// 2. LOGIKA KUIS (DINAMIS DARI FLASHCARD)
// ==========================================
const defaultQuiz = [
    { question: "Terjemahan ke Jerman: Kucing", answer: "katze" },
    { question: "Terjemahan ke Jerman: Rumah", answer: "haus" },
    { question: "Terjemahan ke Jerman: Air", answer: "wasser" }
];
let currentQuestion = 0;
let score = 0;

function loadQuestion() {
    const qText = document.getElementById("question-text");
    const uAnswer = document.getElementById("user-answer");
    const feed = document.getElementById("feedback");
    
    let savedWords = JSON.parse(localStorage.getItem('mySavedWords')) || [];
    // Gunakan kata dari flashcard jika ada minimal 2 kata, jika tidak pakai kuis bawaan
    let dataSource = savedWords.length >= 2 ? savedWords : defaultQuiz; 

    if (currentQuestion < dataSource.length) {
        if (savedWords.length >= 2) {
            qText.textContent = `Apa bahasa Jermannya: "${dataSource[currentQuestion].id}"?`;
            qText.dataset.answer = dataSource[currentQuestion].de.toLowerCase();
        } else {
            qText.textContent = dataSource[currentQuestion].question;
            qText.dataset.answer = dataSource[currentQuestion].answer;
        }
        uAnswer.value = "";
        feed.textContent = "";
        uAnswer.style.display = "block";
        document.getElementById("submit-btn").style.display = "block";
    } else {
        qText.textContent = "🎉 Selesai! Kamu sudah menguji semua kata.";
        uAnswer.style.display = "none";
        document.getElementById("submit-btn").style.display = "none";
        currentQuestion = 0; // Reset
    }
}

document.getElementById("submit-btn").addEventListener("click", checkAnswer);
document.getElementById("user-answer").addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
});

function checkAnswer() {
    const answer = document.getElementById("user-answer").value.trim().toLowerCase();
    const correctAnswer = document.getElementById("question-text").dataset.answer;
    const feed = document.getElementById("feedback");

    if (answer === correctAnswer) {
        feed.textContent = "Richtig! Mantap 🔥";
        feed.style.color = "#3fb950";
        score += 10;
        document.getElementById("score").textContent = score;
        currentQuestion++;
        setTimeout(loadQuestion, 1200);
    } else {
        feed.textContent = `Falsch. (Jawaban: ${correctAnswer}) ❌`;
        feed.style.color = "#ff7b72";
    }
}

// ==========================================
// 3. AI KAMUS INTERAKTIF
// ==========================================
let lastQueriedWord = { de: "", id: "" };

async function tanyaAI() {
    const query = document.getElementById("search-dict").value.trim();
    const resContainer = document.getElementById("dict-result");

    if (!query) return alert("Ketik kata terlebih dahulu!");
    resContainer.innerHTML = "<span style='color: #8b949e;'>🤖 Menerjemahkan... ⏳</span>";

    try {
        const urlDe = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=de|id`;
        const urlId = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=id|de`;

        const [res1, res2] = await Promise.all([ fetch(urlDe).then(r=>r.json()), fetch(urlId).then(r=>r.json()) ]);
        let hasilDe = res1.responseData ? res1.responseData.translatedText : "Tidak ditemukan";
        let hasilId = res2.responseData ? res2.responseData.translatedText : "Tidak ditemukan";

        let finalGerman = query.toLowerCase() === hasilDe.toLowerCase() ? hasilId : query;
        lastQueriedWord = { de: finalGerman, id: hasilDe };

        resContainer.innerHTML = `
            <div style='font-size: 0.9rem;'>
                <div style='background: #161b22; padding: 10px; border-radius: 8px; border: 1px solid #30363d;'>
                    <p style='margin: 0 0 4px 0;'>🇩🇪 <strong style='color: #58a6ff;'>${finalGerman}</strong></p>
                    <p style='margin: 0;'>🇮🇩 <strong style='color: #3fb950;'>${hasilDe}</strong></p>
                </div>
                <button onclick="simpanKata()" style='margin-top: 10px; width: 100%; background: #238636; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 600; cursor: pointer;'>+ Simpan ke Flashcard</button>
            </div>
        `;
    } catch (e) {
        resContainer.innerHTML = "<span style='color: #ff7b72;'>Gagal terhubung ke server terjemahan.</span>";
    }
}

function simpanKata() {
    let savedWords = JSON.parse(localStorage.getItem('mySavedWords')) || [];
    if (!savedWords.some(item => item.de === lastQueriedWord.de)) {
        savedWords.push(lastQueriedWord);
        localStorage.setItem('mySavedWords', JSON.stringify(savedWords));
        alert("Berhasil disimpan ke Flashcard! 🎉");
    } else {
        alert("Kata sudah ada di Flashcard.");
    }
}

const searchInput = document.getElementById("search-dict");
if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") tanyaAI();
    });
}

// ==========================================
// 4. HALAMAN FLASHCARD
// ==========================================
function loadFlashcards() {
    const list = document.getElementById("flashcard-list");
    let savedWords = JSON.parse(localStorage.getItem('mySavedWords')) || [];
    list.innerHTML = "";

    if (savedWords.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#8b949e; font-size:0.9rem; margin-top:20px;'>Kamusmu masih kosong.<br>Cari kata dan simpan!</p>";
        return;
    }

    savedWords.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "mini-card";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";
        card.innerHTML = `
            <div>
                <h3 style="color:#58a6ff; margin:0 0 4px 0; font-size:1rem;">🇩🇪 ${item.de}</h3>
                <p style="color:#c9d1d9; margin:0; font-size:0.8rem;">🇮🇩 ${item.id}</p>
            </div>
            <div>
                <button onclick="hapusFlashcard(${index})" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">🗑️</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function hapusFlashcard(index) {
    let savedWords = JSON.parse(localStorage.getItem('mySavedWords')) || [];
    savedWords.splice(index, 1);
    localStorage.setItem('mySavedWords', JSON.stringify(savedWords));
    loadFlashcards(); 
}

// ==========================================
// 5. RENDER ARTIKEL & SUGGESTED TRANSLATION
// ==========================================
window.onload = function() {
    loadArticleList();
    loadQuestion();
};

function loadArticleList() {
    const container = document.getElementById("article-list-container");
    if (!container || typeof articlesData === 'undefined') return;

    container.innerHTML = "";

    articlesData.forEach((art) => {
        let borderColor = "#3fb950"; 
        if (art.level === "a2") borderColor = "#58a6ff";
        if (art.level === "b1") borderColor = "#ffa657";
        if (art.level === "b2") borderColor = "#bc8cff";
        if (art.level === "c1") borderColor = "#ff7b72";
        if (art.level === "c2") borderColor = "#d2a8ff";

        const card = document.createElement("div");
        card.className = "mini-card title-card";
        card.setAttribute("data-level", art.level);
        card.style.cssText = `border-left: 4px solid ${borderColor}; cursor: pointer; margin-bottom: 8px;`;
        
        card.addEventListener("click", () => bukaArtikel(art.title, art.german, art.indo));

        card.innerHTML = `
            <span style="font-size: 0.55rem; color: ${borderColor}; font-weight: bold; text-transform: uppercase;">Level ${art.level}</span>
            <h3 style="color: #f0f6fc; font-size: 0.9rem; margin: 2px 0;">${art.title}</h3>
        `;
        container.appendChild(card);
    });
}

function bukaArtikel(judul, arrayJerman, arrayIndo) {
    document.getElementById("article-list-view").style.display = "none";
    document.getElementById("article-detail-view").style.display = "block";
    document.getElementById("detail-title").textContent = judul;
    
    // Pastikan saklar translation mati saat artikel baru dibuka
    document.getElementById("toggleTrans").checked = false;

    const contentBox = document.getElementById("detail-content");
    contentBox.innerHTML = ""; 

    // --- TAMPILAN 1: Paragraf Normal (Digabung jadi satu) ---
    let teksUtuh = arrayJerman.join(" ");
    let tampilanNormal = `
        <div id="view-normal" style="display: block; border-left: 3px solid #58a6ff; padding-left: 12px; margin-bottom: 20px;">
            <p style="font-size: 0.95rem; line-height: 1.6; color: #c9d1d9; margin-top: 0;">${teksUtuh}</p>
        </div>
    `;

    // --- TAMPILAN 2: Terjemahan Terpisah Per Kalimat (Disembunyikan di awal) ---
    let tampilanTerpisah = `<div id="view-translated" style="display: none;">`;
    for (let i = 0; i < arrayJerman.length; i++) {
        tampilanTerpisah += `
            <div class="story-block" style="border-left: 3px solid #58a6ff; margin-bottom: 10px; padding: 10px; background: #161b22; border-radius: 8px;">
                <p class="german-text" style="font-size: 0.9rem; color: #f0f6fc; margin: 0 0 6px 0; line-height:1.4;">${arrayJerman[i]}</p>
                <div class="trans-box" style="font-size: 0.8rem; color: #3fb950; background: rgba(35, 134, 54, 0.1); padding: 6px; border-radius: 4px; display: block;">${arrayIndo[i]}</div>
            </div>
        `;
    }
    tampilanTerpisah += `</div>`;

    // Masukkan kedua tampilan ke dalam wadah konten
    contentBox.innerHTML = tampilanNormal + tampilanTerpisah;
}

function toggleTranslation() {
    const isChecked = document.getElementById("toggleTrans").checked;
    const viewNormal = document.getElementById("view-normal");
    const viewTranslated = document.getElementById("view-translated");

    if (isChecked) {
        // Tampilkan versi terpisah per kalimat
        viewNormal.style.display = "none";
        viewTranslated.style.display = "block";
    } else {
        // Tampilkan versi paragraf utuh
        viewNormal.style.display = "block";
        viewTranslated.style.display = "none";
    }
}

function tutupArtikel() {
    document.getElementById("article-detail-view").style.display = "none";
    document.getElementById("article-list-view").style.display = "block";
}

function filterLevel(level) {
    document.querySelectorAll('.title-card').forEach(card => {
        card.style.display = (level === 'all' || card.getAttribute('data-level') === level) ? "block" : "none";
    });
}
