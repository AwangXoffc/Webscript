// =========================================
// FILE: js/script_sc.js
// =========================================

import {
    update,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.currentScFilter = 'all';
window.isReverseSort = false;
window.displayLimit = 6;
window.isShowingAll = false;
window.activeVideoId = null; 

window.globalStats = { totalScripts: 0, totalDownloads: 0, totalViews: 0 };

// =========================================
// MAINTENANCE CHECK (SECURITY)
// =========================================
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

// =========================================
// INFINITE WATERFALL ENGINE
// =========================================
const animationQueue = [];
let isAnimating = false;
let observer;

function processAnimationQueue() {
    if (animationQueue.length === 0) {
        isAnimating = false;
        return;
    }

    isAnimating = true;
    const card = animationQueue.shift();

    if(card && document.body.contains(card)) {
        card.classList.add('show');
    }

    setTimeout(processAnimationQueue, 70); 
}

function initWaterfallObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const target = entry.target;
            if (entry.isIntersecting) {
                if (!target.classList.contains('show') && !animationQueue.includes(target)) {
                    animationQueue.push(target);
                    if (!isAnimating) processAnimationQueue();
                }
            } else {
                target.classList.remove('show');
                const index = animationQueue.indexOf(target);
                if (index > -1) animationQueue.splice(index, 1);
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });
}

// =========================================
// VIDEO PLAYER LOGIC (AUTO-PAUSE TUGAS 4)
// =========================================
window.playInCard = (itemId, videoId) => {

    if (window.activeVideoId && window.activeVideoId !== itemId) {
        window.stopInCard(window.activeVideoId);
    }
    
    window.activeVideoId = itemId;

    const thumbContainer = document.getElementById(`thumb-${itemId}`);
    if (!thumbContainer || !videoId) return;

    if (!thumbContainer.getAttribute('data-original')) {
        thumbContainer.setAttribute('data-original', thumbContainer.innerHTML);
    }

    thumbContainer.innerHTML = `
        <iframe class="video-frame"
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
        </iframe>
        <button class="stop-video-btn" onclick="event.stopPropagation(); stopInCard('${itemId}')">
            <i class="fas fa-stop"></i> Stop
        </button>
    `;
};

window.stopInCard = (itemId) => {
    const thumbContainer = document.getElementById(`thumb-${itemId}`);
    if (!thumbContainer) return;

    const originalHtml = thumbContainer.getAttribute('data-original');
    if (originalHtml) thumbContainer.innerHTML = originalHtml;
    
    if (window.activeVideoId === itemId) window.activeVideoId = null;
};

// =========================================
// RENDER ENGINE UTAMA (TUGAS 3 & 5)
// =========================================
window.renderScPageScripts = (data) => {
    const list = document.getElementById('scriptList');
    const paginationContainer = document.getElementById('scPaginationBtn');
    const searchInput = document.getElementById('scriptSearch');

    if (!list) return;

    window.globalStats.totalScripts = data.length;
    window.globalStats.totalDownloads = 0;

    data.forEach(item => {
        const dl = (window.siteData?.scriptDownloads && window.siteData.scriptDownloads[item.id]) || 0;
        window.globalStats.totalDownloads += dl;
    });

    let filteredData = [...data];

    if (searchInput && searchInput.value.trim() !== "") {
        const keyword = searchInput.value.trim();
        
        if (typeof window.Fuse !== 'undefined') {
            const fuse = new window.Fuse(filteredData, {
                keys: ['title', 'description', 'tags', 'version'],
                threshold: 0.4, 
                ignoreLocation: true
            });
            const result = fuse.search(keyword);
            filteredData = result.map(r => r.item);
        } else {
            const kw = keyword.toLowerCase();
            filteredData = filteredData.filter(item => {
                return (item.title || "").toLowerCase().includes(kw) || 
                       (item.description || "").toLowerCase().includes(kw) || 
                       (item.tags && item.tags.join(" ").toLowerCase().includes(kw));
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
            filteredData = filteredData.filter(item => item.tags && item.tags.some(t => t.toLowerCase().includes('error')));
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

        const rating = (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1);

        let badgeHtml = '';
        if (isRecent(item.uploadedAt)) badgeHtml = `<div class="status-badge badge-new">NEW</div>`;
        else if (item.tags.some(t => t.toLowerCase().includes('update'))) badgeHtml = `<div class="status-badge badge-update">UPDATE</div>`;

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
                    <div class="stat-item text-green"><i class="fas fa-download"></i> ${dlFormatted}</div>
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
    
    initWaterfallObserver();
    document.querySelectorAll('.awang-card').forEach(card => observer.observe(card));

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

// =========================================
// UTILS & HELPERS
// =========================================
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

window.applyScFilter = (filterType) => {
    window.currentScFilter = filterType;
    window.isShowingAll = false;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'bg-[#1e3a8a]', 'text-[#60a5fa]', 'border-[#60a5fa]', 'shadow-glow'));
    if(event?.target) event.target.classList.add('active', 'bg-[#1e3a8a]', 'text-[#60a5fa]', 'border-[#60a5fa]');

    window.renderScPageScripts(CONFIG.items);
    if(typeof playSfx === 'function') playSfx('pop');
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

if (typeof CONFIG !== 'undefined' && CONFIG.items) {
    window.renderScPageScripts(CONFIG.items);
}
