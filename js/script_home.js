// =========================================
// FILE: js/script_home.js
// =========================================

import {
    update,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

function formatCompactNumber(number) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
}

// =========================================
// FETCH YOUTUBE STATS 
// =========================================
async function getRealYoutubeStats(videoId, elementId) {
    if(!videoId) return;
    if(!navigator.onLine) return; 

    try {
        const apiKey = CONFIG.firebase.apiKey;
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const stats = data.items[0].statistics;
            const viewCount = formatCompactNumber(stats.viewCount);
            const likeCount = formatCompactNumber(stats.likeCount);

            const viewEl = document.getElementById(`views-${elementId}`);
            if(viewEl) viewEl.innerHTML = `<i class="fas fa-eye stat-icon-view" style="color: #60a5fa;"></i> ${viewCount}`;

            const likeEl = document.getElementById(`likes-${elementId}`);
            if(likeEl) likeEl.innerHTML = `<i class="fas fa-thumbs-up stat-icon-like" style="color: #ec4899;"></i> ${likeCount}`;
        }
    } catch (e) {
    }
}

// =========================================
// RENDER LOGIC UTAMA
// =========================================
window.renderHomeScripts = (data) => {
    const list = document.getElementById('scriptList');

    if (!list || list.classList.contains('grid') || list.closest('.sc-container')) return;

    transformHomeSearch();

    window.requestAnimationFrame(() => {
        const now = new Date();

        let sortedData = [...data].sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        const recentScripts = sortedData.filter(item => {
            if (!item.uploadedAt) return false;

            const uploadDate = new Date(item.uploadedAt);
            const diffTime = Math.abs(now - uploadDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays <= 7;
        });

        if (recentScripts.length === 0) {
            list.innerHTML = `
            <div class="snap-center w-full flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-[#334155] rounded-3xl bg-[#0f172a] mx-auto reveal-on-scroll is-visible" style="min-width: 100%;">
                <div class="mb-4 animate-bounce">
                    <i class="fas fa-history text-4xl text-[#475569]"></i>
                </div>
                <p class="text-[#60a5fa] font-bold text-[10px] uppercase leading-relaxed tracking-widest mb-4">
                    Belum ada script baru minggu ini
                </p>
                <button onclick="window.location.href='/pages/sc.html'; playSfx('pop')" class="px-6 py-3 bg-[#1e3a8a] rounded-xl text-white text-[10px] font-black uppercase shadow-md active:scale-95 transition-all hover:bg-[#1e40af]">
                    Cek Database Lengkap
                </button>
            </div>`;

            const dots = document.getElementById('scrollDots');
            if(dots) dots.style.display = 'none';

            initHomeScrollReveal();
            return;
        }

        let htmlContent = recentScripts.map((item, idx) => {
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = item.thumbnail.match(regExp);
            const videoId = (match && match[7].length == 11) ? match[7] : false;

            const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : item.thumbnail;
            const fallbackUrl = 'https://placehold.co/600x400/0f172a/60a5fa?text=No+Image';

            if(videoId) setTimeout(() => getRealYoutubeStats(videoId, item.id), idx * 100);

            const tags = item.tags || ["#BotWA", "#Free"];
            const tagsHtml = tags.slice(0, 3).map(tag => `
                <span class="text-[8px] font-black text-[#60a5fa] bg-[#1e3a8a]/20 border border-[#60a5fa]/20 px-1.5 py-0.5 rounded-[4px] tracking-wider uppercase">
                    ${tag}
                </span>`).join('');

            const loadMode = idx < 2 ? "eager" : "lazy";
            const revealClass = idx < 3 ? "reveal-on-scroll is-visible" : "reveal-on-scroll";
            const delayStyle = idx < 3 ? "" : `transition-delay: ${idx * 0.1}s;`;
            
            const version = item.version || "v1.0";
            const desc = item.description || "Script bot WhatsApp multi device fitur lengkap.";

            return `
            <div class="script-card snap-center relative hover:scale-[1.02] transition-transform ${revealClass}" id="card-${item.id}" style="${delayStyle}; border-color: rgba(148, 163, 184, 0.1);">
                <div class="new-badge-modern" style="background: #2563eb; border-color: #60a5fa; color: #ffffff;">NEW</div>
                
                <div class="thumb-container" style="border-bottom-color: rgba(148, 163, 184, 0.05);">
                    <img src="${thumbUrl}" 
                         loading="${loadMode}" 
                         decoding="async"
                         alt="${item.title}" 
                         onerror="this.src='${fallbackUrl}';">
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                        <i class="fas fa-play-circle text-4xl text-white drop-shadow-lg"></i>
                    </div>
                </div>

                <div class="script-info-wrapper">
                    <div class="mb-2">
                        <div class="flex justify-between items-start mb-1">
                            <h4 class="text-sm font-black text-[#f8fafc] leading-tight uppercase tracking-wide line-clamp-2" title="${item.title}">${item.title}</h4>
                            <span class="bg-[#0f172a] text-[#94a3b8] text-[8px] px-1.5 py-0.5 rounded border border-[#334155] font-mono font-bold shrink-0 ml-2">${version}</span>
                        </div>
                        <p class="text-[9px] text-[#94a3b8] line-clamp-2 mb-2 leading-relaxed" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${desc}</p>
                        <div class="flex flex-wrap gap-1 mb-1">${tagsHtml}</div>
                    </div>

                    <div class="card-stats-row mt-auto" style="border-top-color: rgba(148, 163, 184, 0.1);">
                        <div class="stats-left">
                            <div id="views-${item.id}" class="stat-item text-[#94a3b8]"><i class="fas fa-eye stat-icon-view" style="color: #60a5fa;"></i> ...</div>
                            <div id="likes-${item.id}" class="stat-item text-[#94a3b8]"><i class="fas fa-thumbs-up stat-icon-like" style="color: #ec4899;"></i> ...</div>
                        </div>
                        <div class="stat-item text-[8px] text-[#94a3b8]"><i class="fas fa-calendar-alt stat-icon-date" style="color: #fbbf24;"></i> ${window.formatUploadDate(item.uploadedAt)}</div>
                    </div>

                    <div class="flex gap-2 mt-3 pt-3 border-t border-[#334155]/30">
                        <button onclick="window.initUnlockProcess('${item.id}', '${item.downloadLink}'); playSfx('pop')" class="flex-1 py-3 bg-[#1e293b] hover:bg-[#334155] rounded-xl text-[10px] font-black uppercase text-white shadow-md shadow-[#0f172a]/30 active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#334155]">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');

        list.innerHTML = htmlContent;
        if(window.updateScrollDots) window.updateScrollDots('scriptList', 'scrollDots');
        initHomeScrollReveal();
    });
};

function transformHomeSearch() {
    const searchInput = document.getElementById('scriptSearch');
    if(!searchInput) return;
    if(document.getElementById('btn-home-action')) return;

    const parent = searchInput.parentElement;
    parent.innerHTML = '';
    parent.className = "relative mb-10 group w-full reveal-on-scroll is-visible";

    const newButtonHtml = `
    <button id="btn-home-action" onclick="window.location.href='/pages/sc.html'; playSfx('pop')" class="w-full relative overflow-hidden bg-[#0f172a] border border-[#334155] rounded-2xl py-5 px-6 flex items-center justify-between group hover:border-[#60a5fa] transition-all shadow-lg active:scale-95">
        <div class="flex items-center gap-5">
            <div class="w-12 h-12 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#60a5fa] group-hover:scale-110 transition-transform duration-300">
                <i class="fas fa-database text-lg"></i>
            </div>
            <div class="text-left">
                <div class="text-[#f8fafc] font-black text-xs uppercase tracking-[0.15em] mb-1 group-hover:text-[#60a5fa] transition-colors">Buka Database</div>
                <div class="text-[#94a3b8] text-[10px] font-bold group-hover:text-[#cbd5e1] transition-colors">Temukan Semua Script Gratis</div>
            </div>
        </div>
        <div class="w-10 h-10 rounded-full border border-[#334155] flex items-center justify-center text-[#64748b] group-hover:bg-[#60a5fa] group-hover:text-white group-hover:border-transparent transition-all duration-300">
            <i class="fas fa-arrow-right text-xs"></i>
        </div>
        <div class="absolute top-0 right-0 w-20 h-full bg-white/5 skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </button>`;

    parent.innerHTML = newButtonHtml;
}

function initHomeScrollReveal() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                window.requestAnimationFrame(() => {
                    entry.target.classList.add('is-visible');
                });
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll:not(.is-visible)').forEach(el => observer.observe(el));
}
