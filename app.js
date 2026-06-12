// --- MODAL VE KOLEKSİYON YÖNETİMİ MOTORU ---

let currentEditingId = null;
let currentEditingType = null;
let currentRating = 0;

function switchPage(pageId, element) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-menu .nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    if(pageId === 'page-library') renderLibrary();
    if(pageId === 'page-accounts') renderAccounts();
}

// --- DİNAMİK VE GERÇEK ZAMANLI API MOTORU ---
async function searchMedia() {
    const query = document.getElementById('search-query').value.trim();
    const type = document.getElementById('search-type').value;
    const container = document.getElementById('search-results');
    if (!query) return alert('Aramak istediğiniz kelimeyi yazın!');

    container.innerHTML = '<p style="color: #aaa;">Arşiv taranıyor ve sezon bilgileri doğrulanıyor...</p>';
    
    try {
        if (type === 'book') {
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`);
            const data = await res.json();
            container.innerHTML = '';

            if (data.docs && data.docs.length > 0) {
                data.docs.forEach(book => {
                    const id = (book.key ? book.key.replace('/works/', '') : Math.random().toString()).replace(/'/g, "");
                    const title = book.title || 'Bilinmeyen Kitap';
                    const img = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 
                        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300';
                    const aut = book.author_name ? book.author_name[0] : 'Bilinmeyen Yazar';
                    
                    createCard(id, title, img, aut, 'book', container, true, 0);
                });
            } else {
                container.innerHTML = '<p style="color: #aaa;">Aradığınız kitap bulunamadı.</p>';
            }
        } else {
            const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            container.innerHTML = '';

            if (data && data.length > 0) {
                for (let item of data) {
                    const show = item.show;
                    const id = show.id.toString();
                    const title = show.name || 'Belirtilmemiş';
                    const img = show.image ? show.image.medium : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300';
                    const year = show.premiered ? show.premiered.split('-')[0] : 'Belirtilmemiş';
                    
                    let realSeasons = 0;
                    
                    if (type === 'series') {
                        try {
                            const epRes = await fetch(`https://api.tvmaze.com/shows/${id}/episodes`);
                            const episodes = await epRes.json();
                            if (episodes && episodes.length > 0) {
                                realSeasons = Math.max(...episodes.map(e => e.season || 1));
                            } else {
                                realSeasons = 3; 
                            }
                        } catch (err) {
                            realSeasons = 3; 
                        }
                    }

                    createCard(id, title, img, year, type, container, true, realSeasons);
                }
            } else {
                container.innerHTML = `<p style="color: #aaa;">Aradığınız ${type === 'movie' ? 'film' : 'dizi'} bulunamadı.</p>`;
            }
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color: #ff7675;">Bağlantı hatası oluştu.</p>';
    }
}

// --- GÜVENLİ KART OLUŞTURUCU ---
function createCard(id, title, img, meta, type, container, isSearch, totalSeasons = 0) {
    const card = document.createElement('div');
    card.className = 'media-card';
    
    let badgeClass = 'badge-film';
    let badgeText = 'Film';
    if (type === 'book') {
        badgeClass = 'badge-kitap';
        badgeText = 'Kitap';
    } else if (type === 'series') {
        badgeClass = 'badge-film';
        badgeText = 'Dizi';
    }
    
    const badge = `<span class="badge ${badgeClass}">${badgeText}</span>`;
    const clickHandler = !isSearch ? `onclick="openDetailModal('${id}', '${type}')"` : '';

    const cleanTitle = title.replace(/'/g, "").replace(/"/g, "");
    const cleanMeta = meta.replace(/'/g, "").replace(/"/g, "");

    card.innerHTML = `
        ${badge}
        <div class="card-img-wrapper" ${clickHandler}>
            <img src="${img}" class="card-img" alt="${cleanTitle}">
        </div>
        <div class="card-info">
            <div>
                <div class="card-title" title="${cleanTitle}" ${clickHandler}>${cleanTitle}</div>
                <div class="card-meta">${cleanMeta}</div>
            </div>
            ${isSearch ?
                `<button class="btn-card-action btn-add" onclick="saveItem('${id}','${cleanTitle}','${img}','${cleanMeta}','${type}', ${totalSeasons})">Koleksiyona Ekle</button>` : 
                `<button class="btn-card-action btn-remove" onclick="deleteItem('${id}','${type}'); event.stopPropagation();">Kaldır</button>`
            }
        </div>
    `;
    container.appendChild(card);
}
function saveItem(id, title, img, meta, type, totalSeasons) {
    let lib = JSON.parse(localStorage.getItem('myDigitalLibrary')) || [];
    if (lib.some(i => i.id === id && i.type === type)) return alert('Bu eser zaten kütüphanenizde ekli!');

    lib.push({
        id, title, imgUrl: img, meta, type,
        userRating: 0, userComment: "", userDate: "", userQuote: "",
        bookPage: "", movieTime: "", watchedSeasons: [],
        totalSeasons: totalSeasons || 0
    });
    localStorage.setItem('myDigitalLibrary', JSON.stringify(lib));
    alert('Koleksiyonunuza başarıyla dahil edildi!');
    renderLibrary();
}

function deleteItem(id, type) {
    let lib = JSON.parse(localStorage.getItem('myDigitalLibrary')) || [];
    lib = lib.filter(i => !(i.id === id && i.type === type));
    localStorage.setItem('myDigitalLibrary', JSON.stringify(lib));
    renderLibrary();
}

function renderLibrary() {
    const bookContainer = document.getElementById('library-books');
    const movieContainer = document.getElementById('library-movies');
    const seriesContainer = document.getElementById('library-series');
    
    if(!bookContainer || !movieContainer || !seriesContainer) return;
    
    bookContainer.innerHTML = '';
    movieContainer.innerHTML = '';
    seriesContainer.innerHTML = '';
    
    const lib = JSON.parse(localStorage.getItem('myDigitalLibrary')) || [];
    let bCount = 0, mCount = 0, sCount = 0;

    lib.forEach(item => {
        if(item.type === 'book') {
            bCount++;
            createCard(item.id, item.title, item.imgUrl, item.meta, item.type, bookContainer, false, item.totalSeasons);
        } else if(item.type === 'movie') {
            mCount++;
            createCard(item.id, item.title, item.imgUrl, item.meta, item.type, movieContainer, false, item.totalSeasons);
        } else if(item.type === 'series') {
            sCount++;
            createCard(item.id, item.title, item.imgUrl, item.meta, item.type, seriesContainer, false, item.totalSeasons);
        }
    });
    
    document.getElementById('book-count').innerText = bCount;
    document.getElementById('movie-count').innerText = mCount;
    document.getElementById('series-count').innerText = sCount;

    if(bCount === 0) bookContainer.innerHTML = '<p style="color: #777; font-size:0.9rem; padding-left:5px;">Henüz kayıtlı kitap yok.</p>';
    if(mCount === 0) movieContainer.innerHTML = '<p style="color: #777; font-size:0.9rem; padding-left:5px;">Henüz kayıtlı film yok.</p>';
    if(sCount === 0) seriesContainer.innerHTML = '<p style="color: #777; font-size:0.9rem; padding-left:5px;">Henüz kayıtlı dizi yok.</p>';
}

// --- DİNAMİK VE KUSURSUZ MODAL ALTI YÖNETİCİSİ ---
function openDetailModal(id, type) {
    currentEditingId = id;
    currentEditingType = type;
    const lib = JSON.parse(localStorage.getItem('myDigitalLibrary')) || [];
    const item = lib.find(i => i.id === id && i.type === type);
    if (!item) return;

    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-meta').innerText = item.meta;
    document.getElementById('modal-img').src = item.imgUrl;
    
    const badge = document.getElementById('modal-type-badge');
    badge.innerText = type === 'book' ? 'Kitap' : (type === 'series' ? 'Dizi' : 'Film');
    badge.className = `badge ${type === 'book' ? 'badge-kitap' : 'badge-film'}`;

    document.getElementById('user-date').value = item.userDate || "";
    document.getElementById('user-comment').value = item.userComment || "";
    document.getElementById('user-quote').value = item.userQuote || "";
    setRating(item.userRating || 0);

    const bookArea = document.getElementById('book-details-area');
    const movieArea = document.getElementById('movie-details-area');
    const seasonContainer = document.getElementById('season-selector');

    let seasonLabel = null;
    if (movieArea) {
        const labels = movieArea.getElementsByTagName('label');
        for (let l of labels) {
            if (l.innerText.includes("Sezon")) {
                seasonLabel = l;
                break;
            }
        }
    }

    if (type === 'book') {
        if (bookArea) bookArea.style.display = 'block';
        if (movieArea) movieArea.style.display = 'none';
        document.getElementById('book-page').value = item.bookPage || "";
        document.getElementById('quote-label').innerText = "Kitaptan Unutulmaz Alıntı & Sayfası";
    } 
    else if (type === 'series') {
        if (bookArea) bookArea.style.display = 'none';
        if (movieArea) movieArea.style.display = 'block';
        
        if (seasonLabel) seasonLabel.style.display = 'block';
        if (seasonContainer) seasonContainer.style.display = 'flex';
        
        document.getElementById('movie-time').value = item.movieTime || "";
        document.getElementById('quote-label').innerText = "Diziden Unutulmaz Replik / Dakika";
        
        const maxSeasons = item.totalSeasons && item.totalSeasons > 0 ? item.totalSeasons : 3;
        buildSeasonSelector(item.watchedSeasons || [], maxSeasons);
    } 
    else if (type === 'movie') {
        if (bookArea) bookArea.style.display = 'none';
        if (movieArea) movieArea.style.display = 'block';
        
        if (seasonLabel) seasonLabel.style.display = 'none';
        if (seasonContainer) {
            seasonContainer.innerHTML = '';
            seasonContainer.style.display = 'none';
        }
        
        document.getElementById('movie-time').value = item.movieTime || "";
        document.getElementById('quote-label').innerText = "Filmden Unutulmaz Replik / Dakika";
    }
    
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

function buildSeasonSelector(watchedSeasons, maxSeasons) {
    const container = document.getElementById('season-selector');
    if(!container) return;
    container.innerHTML = ''; 
    
    for (let i = 1; i <= maxSeasons; i++) {
        const badge = document.createElement('span');
        badge.className = `season-badge ${watchedSeasons.includes(i) ? 'watched' : ''}`;
        badge.innerText = `${i}. Sezon`;
        badge.onclick = function() {
            this.classList.toggle('watched');
        };
        container.appendChild(badge);
    }
}

function saveModalData() {
    let lib = JSON.parse(localStorage.getItem('myDigitalLibrary')) || [];
    const index = lib.findIndex(i => i.id === currentEditingId && i.type === currentEditingType);
    
    if (index !== -1) {
        lib[index].userDate = document.getElementById('user-date').value;
        lib[index].userComment = document.getElementById('user-comment').value.trim();
        lib[index].userQuote = document.getElementById('user-quote').value.trim();
        lib[index].userRating = currentRating;

        if (currentEditingType === 'book') {
            lib[index].bookPage = document.getElementById('book-page').value.trim();
            lib[index].watchedSeasons = [];
        } else if (currentEditingType === 'movie') {
            lib[index].movieTime = document.getElementById('movie-time').value.trim();
            lib[index].watchedSeasons = [];
        } else if (currentEditingType === 'series') {
            lib[index].movieTime = document.getElementById('movie-time').value.trim();
            
            const seasons = [];
            const badges = document.querySelectorAll('#season-selector .season-badge');
            badges.forEach((badge, idx) => {
                if (badge.classList.contains('watched')) {
                    seasons.push(idx + 1);
                }
            });
            lib[index].watchedSeasons = seasons;
        }

        localStorage.setItem('myDigitalLibrary', JSON.stringify(lib));
        alert('Değişiklikler başarıyla kaydedildi!');
        closeModal();
        renderLibrary();
    }
}