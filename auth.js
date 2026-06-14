// --- KULLANICI DOĞRULAMA VE OTURUM YÖNETİMİ ---

window.onload = function() {
    checkSession();
};

function toggleAuthMode(mode) {
    if (mode === 'login') {
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
        document.getElementById('form-login').style.display = 'block';
        document.getElementById('form-register').style.display = 'none';
    } else {
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('form-register').style.display = 'block';
        document.getElementById('form-login').style.display = 'none';
    }
}

function checkSession() {  // checkSession fonksiyonu mevcut bir kullanıcı oturumunun olup olmadığını kontrol ediyor.
    const sessionActive = localStorage.getItem('archiveSessionActive');
    const currentUser = JSON.parse(localStorage.getItem('archiveMainUser'));

    if (sessionActive === 'true' && currentUser) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
        document.getElementById('sidebar-name').innerText = currentUser.name;
        document.getElementById('sidebar-img').src = currentUser.gender === 'kadın' ? 
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' : 
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200';
        
        // Eğer app.js yüklendiyse kütüphaneyi tetikle
        if (typeof renderLibrary === "function") {
            renderLibrary();
        }
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
}

function handleRegister() {//handleRegister fonksiyonu yeni kullanıcı kayıtlarını oluşturuyor.
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const gender = document.getElementById('reg-gender').value;

    if (!name || !email || !password) {
        alert('Lütfen tüm alanları eksiksiz doldurun!');
        return;
    }
    const userData = { name, email, password, gender };
    localStorage.setItem('archiveMainUser', JSON.stringify(userData));
    alert('Hesap oluşturuldu! Giriş yapabilirsiniz.');
    toggleAuthMode('login');
}

function handleLogin() { //handleLogin fonksiyonu kullanıcı giriş işlemlerini yönetiyor.
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const registeredUser = JSON.parse(localStorage.getItem('archiveMainUser'));

    if (registeredUser && registeredUser.email === email && registeredUser.password === password) {
        localStorage.setItem('archiveSessionActive', 'true');
        checkSession();
    } else {
        alert('Hatalı e-posta veya şifre!');
    }
}

function handleLogout() {
    localStorage.removeItem('archiveSessionActive');
    checkSession();
}