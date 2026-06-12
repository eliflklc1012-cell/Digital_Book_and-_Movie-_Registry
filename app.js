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