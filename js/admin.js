// js/admin.js

// Cek status sesi saat admin.html dibuka
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'grid';
        loadServerArticles();
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
    }
});

async function loginAdmin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    
    errorEl.innerText = "Memproses login...";
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        // KODE YANG DIUBAH: Sekarang akan menampilkan error asli dari database!
        errorEl.innerText = "Error: " + error.message;
        console.error("Supabase Error Detail:", error);
    } else {
        errorEl.innerText = "";
    }
}

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
}

// Tambah Data
async function publishArticle(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-publish');
    btn.innerText = "Mengirim...";

    const newArticle = {
        level: document.getElementById('art-level').value,
        theme: document.getElementById('art-theme').value,
        title: document.getElementById('art-title').value,
        content: document.getElementById('art-content').value
    };

    const { error } = await supabaseClient.from('articles').insert([newArticle]);
    
    if (error) {
        alert("Gagal mem-publish. Pastikan role kamu adalah ADMIN/OWNER di Supabase.");
        console.error(error);
    } else {
        alert("Artikel berhasil dipublish ke Server!");
        document.getElementById('form-artikel').reset();
        loadServerArticles();
    }
    btn.innerText = "Publish ke Server 🚀";
}

// Muat daftar
async function loadServerArticles() {
    const { data, error } = await supabaseClient.from('articles').select('id, title, level').order('created_at', { ascending: false });
    const container = document.getElementById('server-articles');
    
    if (data) {
        container.innerHTML = data.map(art => `
            <div style="border-bottom: 1px solid var(--border); padding: 10px 0; display:flex; justify-content:space-between;">
                <span><b>[${art.level}]</b> ${art.title}</span>
                <button onclick="hapusArtikel('${art.id}')" style="color:#ff7b72; background:transparent; border:none; cursor:pointer;">Hapus</button>
            </div>
        `).join('');
    }
}

async function hapusArtikel(id) {
    if(confirm("Yakin ingin menghapus artikel ini dari publik?")) {
        await supabaseClient.from('articles').delete().eq('id', id);
        loadServerArticles();
    }
}
