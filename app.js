// ==========================================
// 1. DATA ARTIKEL & PENYIMPANAN LOCALSTORAGE
// ==========================================
const defaultArticles = [
    { id: 1, title: "Vom Bett direkt zum Unterricht?", theme: "Bildung & Alltag", level: "a1", content: "Vom Bett direkt zum Unterricht? Das ist eine interessante Frage für Deutschlerner. Viele Schüler lernen heute online." },
    { id: 2, title: "Apfelküchle – Ein süßer Klassiker", theme: "Kultur & Essen", level: "a2", content: "Apfelküchle sind sehr lecker. Man isst sie oft in Süddeutschland mit Vanillesoße." },
    { id: 3, title: "Die Geschichte des Geldautomaten", theme: "Technologie & Wirtschaft", level: "c2", content: "Der Geldautomat hat die Art und Weise, wie wir auf unsere Finanzen zugreifen, revolutioniert." }
];

// Ambil data dari localStorage atau gunakan default
let articlesData = JSON.parse(localStorage.getItem("leerbro_articles")) || defaultArticles;

const flashcardsData = [
    { jerman: "haus", indo: "rumah" },
    { jerman: "hund", indo: "anjing" },
    { jerman: "katze", indo: "kucing" },
    { jerman: "apfel", indo: "apel" },
    { jerman: "brot", indo: "roti" },
    { jerman: "wasser", indo: "air" },
    { jerman: "buch", indo: "buku" }
];

// ==========================================
// 2. ADMIN: TAMBAH ARTIKEL BARU
// ==========================================
function tambahArtikelBaru(event) {
    event.preventDefault();

    const level = document.getElementById("admin-level").value;
    const theme = document.getElementById("admin-theme").value.trim();
    const title = document.getElementById("admin-title").value.trim();
    const content = document.getElementById("admin-content").value.trim();
    const feedback = document.getElementById("admin-feedback");

    const artikelBaru = {
        id: Date.now(), // ID unik berdasarkan waktu
        title: title,
        theme: theme,
        level: level,
        content: content
    };

    // Masukkan ke array dan simpan ke localStorage
    articlesData.unshift(artikelBaru);
    localStorage.setItem("leerbro_articles", JSON.stringify(articlesData));

    feedback.innerText = "Berhasil! Artikel baru sukses dipublish ke web 🎉";
    feedback.style.color = "#3fb950";

    // Reset form
    document.getElementById("admin-form").reset();

    // Refresh daftar artikel di menu utama
    renderArticles('all');

    setTimeout(() => {
        feedback.innerText = "";
    }, 3000);
}

// ==========================================
// 3. RENDER & SORTIR ARTIKEL (Hanya Judul & Tema)
// ==========================================
function renderArticles(filter = 'all') {
    const container = document.getElementById("article-list-container");
    if (!container) return;
    
    container.innerHTML = ""; 
    const filteredArticles = filter === 'all' ? articlesData : articlesData.filter(art => art.level === filter);

    if (filteredArticles.length === 0) {
        container.innerHTML = "<p style='color: #8b949e; font-size: 0.85rem; text-align: center; padding: 20px;'>Belum ada artikel untuk level ini.</p>";
        return;
    }

    filteredArticles.forEach(art => {
        container.innerHTML += `
            <div class="article-card-item" onclick="bukaDetailArtikel(${art.id})">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span class="badge" style="background:#21262d; color:#c9d1d9; border:1px solid #30363d;">${art.level.toUpperCase()}</span>
                    <span class="theme-tag" style="margin:0;">🏷️ ${art.theme || 'General'}</span>
                </div>
                <h4 style="margin: 8px 0 0 0; color: #f0f6fc; font-size: 1rem;">${art.title}</h4>
            </div>
        `;
    });
}

function filterLevel(level) { 
    renderArticles(level); 
}

// Global variable untuk menyimpan isi artikel aktif (untuk suggestion translation)
let activeArticleContent = "";

function bukaDetailArtikel(id) {
    const artikel = articlesData.find(art => art.id === id);
    if (!artikel) return;

    document.getElementById("detail-title").innerText = artikel.title;
    document.getElementById("detail-theme").innerText = `🏷️ ${artikel.theme || 'General'}`;
    activeArticleContent = artikel.content; // Simpan teks asli

    // Sembunyikan kotak suggestion awal
    document.getElementById("suggestion-box").style.display = "none";
    document.getElementById("suggestion-text").innerText = "";
    
    // Bungkus setiap kata agar bisa diklik untuk pop-up terjemahan
    const words = artikel.content.split(/\s+/); 
    const wrappedHTML = words.map(word => {
        const cleanWordForSearch = word.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()"]/g, "").toLowerCase();
        return `<span class="clickable-word" onclick="translateWord('${cleanWordForSearch}', '${word.replace(/'/g, "\\'")}')">${word}</span>`;
    }).join(" ");

    document.getElementById("detail-content").innerHTML = wrappedHTML;
    document.getElementById("article-list-view").style.display = "none";
    document.getElementById("article-detail-view").style.display = "block";
}

function tutupArtikel() {
    document.getElementById("article-detail-view").style.display = "none";
    document.getElementById("article-list-view").style.display = "block";
    closePopup(); 
}

// ==========================================
// 4. FITUR SUGGESTION TRANSLATION & POP-UP KATA (API GOOGLE)
// ==========================================
async function toggleSuggestion() {
    const box = document.getElementById("suggestion-box");
    const textEl = document.getElementById("suggestion-text");

    if (box.style.display === "block") {
        box.style.display = "none";
        return;
    }

    box.style.display = "block";
    textEl.innerText = "Menerjemahkan seluruh paragraf... ⏳";

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=id&dt=t&q=${encodeURIComponent(activeArticleContent)}`;
        const response = await fetch(url);
        const data = await response.json();
        textEl.innerText = data[0][0][0];
    } catch (error) {
        textEl.innerText = "Gagal memuat terjemahan otomatis.";
    }
}

async function translateWord(searchWord, originalWord) {
  const popup = document.getElementById("translation-popup");
  const popupWord = document.getElementById("popup-word");
  const popupMeaning = document.getElementById("popup-meaning");

  if (!popup) return;

  popupWord.innerText = originalWord; 
  popupMeaning.innerText = "Menerjemahkan kata... ⏳";
  popup.style.display = "block";

  try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=id&dt=t&q=${encodeURIComponent(searchWord)}`;
      const response = await fetch(url);
      const data = await response.json();
      popupMeaning.innerText = data[0][0][0]; 
  } catch (error) {
      popupMeaning.innerText = "Gagal menerjemahkan (Cek internet).";
  }
}

function closePopup() {
  const popup = document.getElementById("translation-popup");
  if (popup) popup.style.display = "none";
}

// ==========================================
// 5. LOGIKA KUIS / WORTSCHATZ CHALLENGE
// ==========================================
let skorKuis = 0;
let jawabanBenarKuis = "";

function muatPertanyaanKuis() {
    const questionElement = document.getElementById("question-text");
    const answerInput = document.getElementById("user-answer");
    const feedbackElement = document.getElementById("feedback");

    if (!questionElement) return;

    if (answerInput) answerInput.value = "";
    if (feedbackElement) feedbackElement.innerText = "";

    const acak = Math.floor(Math.random() * flashcardsData.length);
    const soal = flashcardsData[acak];

    questionElement.innerText = `Apa bahasa Jermannya "${soal.indo}"?`;
    jawabanBenarKuis = soal.jerman;
}

function cekJawabanKuis() {
    const answerInput = document.getElementById("user-answer");
    const feedbackElement = document.getElementById("feedback");
    const scoreElement = document.getElementById("score");

    if (!answerInput || !feedbackElement) return;

    const jawabanUser = answerInput.value.trim().toLowerCase();

    if (jawabanUser === "") {
        feedbackElement.innerText = "Ketik jawabanmu dulu, bro!";
        feedbackElement.style.color = "#ffa657";
        return;
    }

    if (jawabanUser === jawabanBenarKuis) {
        skorKuis += 10;
        scoreElement.innerText = skorKuis;
        feedbackElement.innerText = "Mantap! Jawabanmu benar. 🔥";
        feedbackElement.style.color = "#3fb950";
        setTimeout(muatPertanyaanKuis, 1000); 
    } else {
        feedbackElement.innerText = `Kurang tepat. Jawaban yang benar: ${jawabanBenarKuis}`;
        feedbackElement.style.color = "#f38ba8";
    }
}

// ==========================================
// 6. RENDER FLASHCARD & NAVIGASI UTAMA & KAMUS
// ==========================================
function renderFlashcards() {
    const container = document.getElementById("flashcard-list");
    if (!container) return;

    container.innerHTML = ""; 
    flashcardsData.forEach(kata => {
        container.innerHTML += `
            <div class="mini-card" style="display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border-left: 4px solid #89b4fa;">
                <div style="font-weight: bold; color: #f0f6fc; font-size: 1.05rem; text-transform: capitalize;">🇩🇪 ${kata.jerman}</div>
                <div style="color: #a6adc8; font-size: 0.85rem;">🇮🇩 ${kata.indo}</div>
            </div>
        `;
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active-page');

    if (window.event && window.event.target && window.event.target.tagName === 'A') {
        document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
        window.event.target.classList.add('active');
    }
}

async function tanyaAI() {
    const query = document.getElementById("search-dict").value.trim();
    const resultBox = document.getElementById("dict-result");

    if (!query) {
        resultBox.innerHTML = "<span class='placeholder-text' style='color: #f38ba8;'>Masukkan kata terlebih dahulu!</span>";
        return;
    }

    resultBox.innerHTML = "<span class='placeholder-text'>AI sedang mencari di internet... 🌐</span>";

    try {
        let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(query)}`;
        let response = await fetch(url);
        let data = await response.json();
        let hasil = data[0][0][0];

        if (hasil.toLowerCase() === query.toLowerCase()) {
            url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=de&dt=t&q=${encodeURIComponent(query)}`;
            response = await fetch(url);
            data = await response.json();
            hasil = data[0][0][0];
        }

        resultBox.innerHTML = `
            <strong style="color: #89b4fa; font-size: 0.85rem;">Google Translate API:</strong><br><br>
            <span style="font-size: 1.1rem; color: #3fb950;">${hasil}</span>
        `;
    } catch (error) {
        resultBox.innerHTML = "<span style='color: #f38ba8;'>Gagal terhubung. Pastikan internetmu aktif!</span>";
    }
}

// ==========================================
// 7. INIT (SAAT APLIKASI DIBUKA)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("LeerBroDeutsch siap dengan Admin & Fitur Lengkap!");
    
    renderArticles('all');
    muatPertanyaanKuis();
    renderFlashcards();
    
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", cekJawabanKuis);
    }
});
