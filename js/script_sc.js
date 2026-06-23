import {
    update,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.currentScFilter = 'all';
window.isReverseSort = false;
window.displayLimit = 6;
window.isShowingAll = false;
window.currentlyPlayingVideoId = null;
window.lastScRenderState = null;
window.lastScrollY = 0;
window.scrollDirection = 'down';
window.animationFrameId = null;
window.observedCards = new Set();
window.cardObserver = null;

window.globalStats = { totalScripts: 0, totalDownloads: 0, totalViews: 0 };

function checkMaintenanceStatus() {
    if (typeof CONFIG !== 'undefined' && CONFIG.maintenanceConfig?.active) {
        if (CONFIG.maintenanceConfig.pages?.sc) {
            window.location.href = "maintenance.html";
        }
    }
}
checkMaintenanceStatus();

function formatCompactNumber(n) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(n);
}

function initCardScrollAnimations() {
    if (window.cardObserver) {
        window.cardObserver.disconnect();
    }

    const options = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    };

    window.cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const card = entry.target;
            const cardId = card.dataset.cardId || Math.random().toString(36).substr(2, 9);
            card.dataset.cardId = cardId;

            if (entry.isIntersecting) {
                if (!window.observedCards.has(cardId)) {
                    window.observedCards.add(cardId);
                    
                    card.classList.remove('scroll-exit-up', 'scroll-exit-down');
                    
                    if (window.scrollDirection === 'down') {
                        card.classList.add('scroll-enter-up');
                    } else {
                        card.classList.add('scroll-enter-down');
                    }
                    
                    card.classList.add('show');
                }
            } else {
                const rect = card.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                if (window.observedCards.has(cardId)) {
                    card.classList.remove('scroll-enter-up', 'scroll-enter-down', 'show');

                    if (rect.top > viewportHeight) {
                        card.classList.add('scroll-exit-down');
                    } else if (rect.bottom < 0) {
                        card.classList.add('scroll-exit-up');
                    }
                    
                    window.observedCards.delete(cardId);
                }
            }
        });
    }, options);

    document.querySelectorAll('.awang-card').forEach(card => {
        window.cardObserver.observe(card);
    });
}

function trackScrollDirection() {
    const currentScrollY = window.scrollY || window.pageYOffset;

    if (currentScrollY > window.lastScrollY + 5) {
        window.scrollDirection = 'down';
    } else if (currentScrollY < window.lastScrollY - 5) {
        window.scrollDirection = 'up';
    }
    
    window.lastScrollY = currentScrollY;
}

window.addEventListener('scroll', () => {
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
    }
    
    window.animationFrameId = requestAnimationFrame(() => {
        trackScrollDirection();
    });
}, { passive: true });

window.playInCard = (itemId, videoId) => {
    const thumbContainer = document.getElementById(`thumb-${itemId}`);
    if (!thumbContainer || !videoId) return;

    if (window.currentlyPlayingVideoId && window.currentlyPlayingVideoId !== itemId) {
        window.stopInCard(window.currentlyPlayingVideoId);
    }

    if (!thumbContainer.getAttribute('data-original')) {
        thumbContainer.setAttribute('data-original', thumbContainer.innerHTML);
    }

    thumbContainer.innerHTML = `
        <iframe class="video-frame"
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
        </iframe>
        
        <button class="stop-video-btn" onclick="event.stopPropagation(); stopInCard('${itemId}')">
            <i class="fas fa-stop"></i> Stop
        </button>
    `;

    window.currentlyPlayingVideoId = itemId;
};

window.stopInCard = (itemId) => {
    const thumbContainer = document.getElementById(`thumb-${itemId}`);
    if (!thumbContainer) return;

    const originalHtml = thumbContainer.getAttribute('data-original');
    if (originalHtml) thumbContainer.innerHTML = originalHtml;
    
    if (window.currentlyPlayingVideoId === itemId) {
        window.currentlyPlayingVideoId = null;
    }
};

window.renderScPageScripts = (data) => {
    window.isScriptRendered = true;
    
    const list = document.getElementById('scriptList');
    const paginationContainer = document.getElementById('scPaginationBtn');
    const searchInput = document.getElementById('scriptSearch');

    if (!list) return;

    if (window.cardObserver) {
        window.cardObserver.disconnect();
    }
    window.observedCards.clear();

    const currentKeyword = searchInput && searchInput.value ? searchInput.value.trim() : "";
    const currentState = `${window.currentScFilter}_${currentKeyword}_${window.isShowingAll}`;

    window.lastScRenderState = currentState;

    window.globalStats.totalScripts = data.length;
    window.globalStats.totalDownloads = 0;

    data.forEach(item => {
        const dl = (window.siteData?.scriptDownloads && window.siteData.scriptDownloads[item.id]) || 0;
        window.globalStats.totalDownloads += dl;
    });

    let filteredData = [...data];

    if (searchInput && searchInput.value.trim() !== "") {
        const keyword = searchInput.value.trim();

        if (typeof Fuse !== 'undefined') {
            const fuseOptions = {
                isCaseSensitive: false,
                includeScore: true,
                shouldSort: true,
                threshold: 0.4, 
                keys: ['title', 'description', 'tags']
            };

            const fuse = new Fuse(filteredData, fuseOptions);
            const fuseResults = fuse.search(keyword);
            filteredData = fuseResults.map(result => result.item);

        } else {
            const lowerKeyword = keyword.toLowerCase();

            filteredData = filteredData.filter(item => {
                const title = (item.title || "").toLowerCase();
                const desc = (item.description || "").toLowerCase();
                const tags = item.tags ? item.tags.join(" ").toLowerCase() : "";
                return title.includes(lowerKeyword) || desc.includes(lowerKeyword) || tags.includes(lowerKeyword);
            });
        }
    } else {
        if (window.currentScFilter === 'new') {
            filteredData = filteredData.filter(item => isRecent(item.uploadedAt));
        }
        else if (window.currentScFilter === 'update') {
            filteredData = filteredData.filter(item => (item.tags && item.tags.some(t => t.toLowerCase().includes('update') || t.toLowerCase().includes('fix'))) || (item.version && item.version.toLowerCase().includes('fix')));
        }
        else if (window.currentScFilter === 'error') {
            filteredData = filteredData.filter(item => item.tags && item.tags.some(t => t.toLowerCase().includes('error') || t.toLowerCase().includes('bug')));
        }
        else if (window.currentScFilter === 'popular') {
            const downloads = window.siteData?.scriptDownloads || {};
            filteredData.sort((a, b) => (downloads[b.id] || 0) - (downloads[a.id] || 0));
        }
    }

    if (window.currentScFilter !== 'popular' && (!searchInput || searchInput.value.trim() === "")) {
        filteredData.sort((a, b) => {
            const dateA = new Date(a.uploadedAt);
            const dateB = new Date(b.uploadedAt);
            return window.isReverseSort ? dateA - dateB : dateB - dateA;
        });
    }

    if (!filteredData || filteredData.length === 0) {
        list.className = "flex w-full min-h-[300px]";

        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 opacity-70 w-full animate-fade-in">
                <div class="w-16 h-16 bg-[#1e293b] rounded-full flex items-center justify-center mb-4 border border-[#334155]">
                    <i class="fas fa-box-open text-2xl text-gray-500"></i>
                </div>
                <p class="text-[#94a3b8] font-bold text-xs uppercase tracking-widest">Data Tidak Ditemukan</p>
            </div>`;

        if(paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = filteredData.length;
    const currentLimit = window.isShowingAll ? totalItems : window.displayLimit;
    const slicedData = filteredData.slice(0, currentLimit);

    list.removeAttribute('class');

    const htmlContent = slicedData.map((item, index) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = item.thumbnail.match(regExp);
        const videoId = (match && match[7].length == 11) ? match[7] : false;

        const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : item.thumbnail;
        const fallbackUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://placehold.co/600x337/1f2937/60a5fa?text=No+Image';

        if(videoId) setTimeout(() => getRealYoutubeStats(videoId, item.id), index * 200);

        const title = item.title;
        const desc = item.description || "Script bot WhatsApp multi device fitur lengkap.";
        const date = window.formatUploadDate(item.uploadedAt);
        const version = item.version || "v1.0";
        const tags = item.tags || ["Bot"];

        const dlReal = (window.siteData?.scriptDownloads && window.siteData.scriptDownloads[item.id]) || 0;
        const dlFormatted = formatCompactNumber(dlReal);

        let rating = (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1);

        let badgeHtml = '';
        if (isRecent(item.uploadedAt)) badgeHtml = `<div class="status-badge badge-new">NEW</div>`;
        else if (item.tags.some(t => t.toLowerCase().includes('update') || t.toLowerCase().includes('fix'))) badgeHtml = `<div class="status-badge badge-update">UPDATE</div>`;

        let videoHintHtml = '';
        if (videoId) videoHintHtml = `<div class="video-hint-badge"><i class="fas fa-play-circle text-[10px]"></i> PLAY VIDEO</div>`;

        const tagsHtml = tags.slice(0, 3).map(t => `<span class="tag-pill">${t}</span>`).join('');

        return `
        <div class="awang-card">
            <div class="awang-thumb" id="thumb-${item.id}">
                ${badgeHtml}
                ${videoHintHtml}
                <img src="${thumbUrl}" loading="lazy" onerror="this.src='${fallbackUrl}'" onclick="playInCard('${item.id}', '${videoId}')">
               
                <div class="thumb-overlay" onclick="playInCard('${item.id}', '${videoId}')">
                    <i class="fas fa-play-circle text-4xl text-white opacity-90 drop-shadow-lg transition-transform hover:scale-110"></i>
                    <span class="overlay-text">Tap to Preview</span>
                </div>
            </div>

            <div class="awang-body">
                <div class="card-header">
                    <h3 class="card-title" title="${title}">${title}</h3>
                    <span class="version-badge">${version}</span>
                </div>

                <p class="card-desc">${desc}</p>

                <div class="card-info-row">
                    <div class="card-date"><i class="far fa-calendar-alt text-[#fbbf24]"></i> ${date}</div>
                    <div class="card-rating text-[10px] font-bold text-[#fbbf24]"><i class="fas fa-star"></i> ${rating}</div>
                </div>

                <div class="card-tags">${tagsHtml}</div>

                <div class="card-stats">
                    <div class="stat-item text-blue" id="likes-${item.id}"><i class="fas fa-thumbs-up"></i> 0</div>
                    <div class="stat-item text-view" id="views-${item.id}"><i class="fas fa-eye"></i> ...</div>
                    <div class="stat-item text-green transition-all duration-300" id="sc-dl-${item.id}"><i class="fas fa-download"></i> ${dlFormatted}</div>
                </div>

                <div class="card-actions">
                    <button onclick="window.initUnlockProcess('${item.id}', '${item.downloadLink}'); playSfx('pop')" class="btn-dl">
                        <i class="fas fa-download"></i> DOWNLOAD
                    </button>
                    <button onclick="shareScriptById('${item.id}'); playSfx('pop')" class="btn-share" title="Bagikan">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button onclick="window.open('https://wa.me/?text=Download ${encodeURIComponent(title)} di ${window.location.href}', '_blank')" class="btn-icon whatsapp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button onclick="window.open('https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}', '_blank')" class="btn-icon telegram">
                        <i class="fab fa-telegram-plane"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    list.innerHTML = htmlContent;
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            initCardScrollAnimations();
        });
    });

    if (paginationContainer) {
        if (totalItems > window.displayLimit) {
            paginationContainer.innerHTML = window.isShowingAll
                ? `<button onclick="toggleShowAll()" class="load-more-btn"><span>TAMPILKAN LEBIH SEDIKIT</span><i class="fas fa-chevron-up"></i></button>`
                : `<button onclick="toggleShowAll()" class="load-more-btn"><span>TAMPILKAN SEMUA (${totalItems - window.displayLimit} lagi)</span><i class="fas fa-chevron-down animate-bounce"></i></button>`;
        } else {
            paginationContainer.innerHTML = `<div class="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-6 opacity-50">- MENAMPILKAN SELURUH DATA -</div>`;
        }
    }
};

function isRecent(d) {
    return Math.ceil(Math.abs(new Date() - new Date(d)) / (86400000)) <= 7;
}

async function getRealYoutubeStats(videoId, elementId) {
    if(!videoId) return;
    
    if(!navigator.onLine) return;

    try {
        const apiKey = CONFIG.firebase.apiKey;
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);

        const data = await response.json();

        if (data.items?.[0]?.statistics) {
            const s = data.items[0].statistics;
            const vEl = document.getElementById(`views-${elementId}`);
            const lEl = document.getElementById(`likes-${elementId}`);
            if(vEl) vEl.innerHTML = `<i class="fas fa-eye"></i> ${formatCompactNumber(s.viewCount)}`;
            if(lEl) lEl.innerHTML = `<i class="fas fa-thumbs-up"></i> ${formatCompactNumber(s.likeCount)}`;
        }
    } catch (e) {}
}

window.toggleShowAll = () => {
    window.isShowingAll = !window.isShowingAll;
    window.renderScPageScripts(CONFIG.items);
    if(typeof playSfx === 'function') playSfx('pop');
};

window.applyScFilter = (filterType, btnElement) => {
    window.currentScFilter = filterType;
    window.isShowingAll = false;

    document.querySelectorAll('.filter-opt-btn').forEach(b => b.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    window.renderScPageScripts(CONFIG.items);
    if(typeof playSfx === 'function') playSfx('pop');

    const drop = document.getElementById('filterDropdown');
    if (drop) drop.classList.remove('show');
};

window.filterScripts = () => {
    window.isShowingAll = false;
    window.renderScPageScripts(CONFIG.items);
};

window.shareScriptById = (id) => {
    const item = CONFIG.items.find(i => i.id === id);

    if (navigator.share && item) {
        navigator.share({
            title: item.title,
            text: item.description,
            url: window.location.href
        }).catch(()=>{});
    } else {
        navigator.clipboard.writeText(window.location.href);
        if(typeof showToast === 'function') showToast("Link halaman disalin!", "success");
    }
};

window.toggleFilterMenu = (e) => {
    if (e) e.stopPropagation();
    const drop = document.getElementById('filterDropdown');
    if (drop) {
        if (drop.classList.contains('show')) {
            drop.classList.remove('show');
        } else {
            drop.classList.add('show');
            if(typeof playSfx === 'function') playSfx('pop');
        }
    }
};

document.addEventListener('click', (e) => {
    const drop = document.getElementById('filterDropdown');
    if (drop && drop.classList.contains('show') && !e.target.closest('#filterDropdown') && !e.target.closest('button[onclick="toggleFilterMenu(event)"]')) {
        drop.classList.remove('show');
    }
});

window.updateOnlyScriptStats = () => {
    if (typeof CONFIG === 'undefined' || !CONFIG.items) return;
    CONFIG.items.forEach(item => {
        const dlReal = (window.siteData?.scriptDownloads && window.siteData.scriptDownloads[item.id]) || 0;
        const dlFormatted = formatCompactNumber(dlReal);
        const dlEl = document.getElementById(`sc-dl-${item.id}`);
        
        if (dlEl) {
            const currentText = dlEl.innerText.trim();
            if (!currentText.includes(dlFormatted)) {
                dlEl.innerHTML = `<i class="fas fa-download"></i> ${dlFormatted}`;
                dlEl.style.transform = 'scale(1.1)';
                dlEl.style.color = '#34d399';
                setTimeout(() => {
                    dlEl.style.transform = 'scale(1)';
                    dlEl.style.color = '';
                }, 300);
            }
        }
    });
};

if (typeof CONFIG !== 'undefined' && CONFIG.items) {
    if (!window.isScriptRendered) {
        window.renderScPageScripts(CONFIG.items);
    } else if (typeof window.updateOnlyScriptStats === 'function') {
        window.updateOnlyScriptStats();
    }
}
