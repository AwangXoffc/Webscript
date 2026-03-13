// =========================================
// FILE: js/script_tools.js
// =========================================

let currentPlatform = null;

function initToolsSidebar() {
    const sidebar = document.getElementById('sidebarContent');
    if (!sidebar || typeof DL_CONFIG === 'undefined') return;

    sidebar.innerHTML = '';

    let html = `
    <div class="px-6 mb-4 mt-2">
        <div class="text-[9px] font-black text-[#60a5fa] uppercase tracking-[0.2em] opacity-80 mb-1">SYSTEM MODULES</div>
        <div class="h-0.5 w-8 bg-[#60a5fa] rounded-full"></div>
    </div>`;

    DL_CONFIG.tools.forEach(tool => {
        const iconClass = window.getIcon ? window.getIcon(tool.icon) : "fas fa-bolt";

        html += `
        <div onclick="switchTool('${tool.id}', '${tool.name}', '${iconClass}', '${tool.color}')" class="relative overflow-hidden flex items-center gap-4 px-5 py-4 mx-3 rounded-xl cursor-pointer group transition-all duration-300 hover:bg-[#1e3a8a]/20 border border-transparent hover:border-[#60a5fa]/30 mb-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0f172a] border border-[#334155] shadow-lg group-hover:scale-110 transition-transform relative z-10" style="color: ${tool.color};">
                <i class="${iconClass} text-sm"></i>
            </div>
            <div class="flex-1 relative z-10">
                <h4 class="text-[10px] font-black uppercase text-slate-300 group-hover:text-white transition-colors tracking-wide">${tool.name}</h4>
            </div>
            <i class="fas fa-chevron-right absolute right-4 text-[8px] text-slate-600 group-hover:text-white transition-all opacity-50 group-hover:opacity-100"></i>
        </div>`;
    });

    html += `
    <div class="mt-8 px-4 border-t border-[#334155] pt-6 mx-2">
        <a href="../index.html" class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-[#60a5fa] transition-all text-[9px] font-bold uppercase tracking-widest group">
            <i class="fas fa-power-off group-hover:text-red-400 transition-colors"></i> KEMBALI KE HOME
        </a>
    </div>`;

    sidebar.innerHTML = html;
}

window.switchTool = (id, name, icon, color) => {
    currentPlatform = id;

    document.getElementById('welcomeState').style.display = 'none';
    const toolState = document.getElementById('toolState');
    toolState.style.display = 'block';

    toolState.style.animation = 'none';
    toolState.offsetHeight;
    toolState.style.animation = 'slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';

    const badge = document.getElementById('activeBadgeText');
    badge.innerHTML = `<i class="${icon} mr-2"></i> ${name}`;
    badge.style.borderColor = color;
    badge.style.color = color;
    badge.style.backgroundColor = color + '1a';
    badge.style.boxShadow = `0 0 20px ${color}30`;

    document.getElementById('urlInput').value = '';
    document.getElementById('resultCard').style.display = 'none';

    if(window.innerWidth < 768) {
        const sb = document.getElementById('sidebar');
        if(sb && sb.classList.contains('active')) toggleMenu();
    }

    if(typeof playSfx === 'function') playSfx('pop');
};

window.processUrl = async () => {
    const url = document.getElementById('urlInput').value.trim();
    const btn = document.getElementById('processBtn');
    const status = document.getElementById('statusText');

    if (!navigator.onLine) {
        if(typeof showToast === 'function') showToast("Sistem Offline: Periksa koneksi internet Anda!", "warning");
        status.innerText = "OFFLINE MODE";
        return;
    }

    if(!url) {
        if(typeof showToast === 'function') showToast("URL KOSONG!", "info");
        return;
    }
    if(!currentPlatform) {
        if(typeof showToast === 'function') showToast("PILIH TOOLS DULU!", "warning");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    status.innerText = DL_CONFIG.messages.processing;

    try {
        const apiConfig = DL_CONFIG.apis[currentPlatform];
        const finalUrl = apiConfig.url.replace('{URL}', encodeURIComponent(url));

        const response = await fetch(finalUrl, { method: apiConfig.method });
        if(!response.ok) throw new Error("API Offline / Link Invalid");
        
        const data = await response.json();
        const result = parseSmartScraper(data);

        if (!result.video && result.links.length === 0 && !result.thumb.includes('http')) {
            throw new Error("Media tidak ditemukan atau dilindungi privasi.");
        }

        renderResult(result);
        if(typeof showToast === 'function') showToast(DL_CONFIG.messages.success, "success");
        if(typeof playSfx === 'function') playSfx('success');

    } catch (e) {
        console.error("Scraper Error:", e);
        if(typeof showToast === 'function') showToast(DL_CONFIG.messages.error, "error");
        status.innerText = "ERROR: SCRAPING GAGAL";
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-arrow-right"></i>';
        if(status.innerText === DL_CONFIG.messages.processing) {
            status.innerText = "READY TO PROCESS";
        }
    }
};

function formatStatNumber(num) {
    if (num === null || num === undefined) return "0";
    let n = parseInt(num);
    if (isNaN(n)) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function parseSmartScraper(response) {
    let result = {
        title: "Media Ready",
        author: "@AwangSystem",
        avatar: null,
        desc: "Deskripsi tidak tersedia.",
        likes: "0",
        comments: "0",
        shares: "0",
        thumb: "https://placehold.co/600x400/0f172a/ffffff?text=Loading+Media",
        video: null,
        links: []
    };

    let maxLikes = 0;
    let maxComments = 0;
    let maxShares = 0;
    let extractedLinks = [];
    let uniqueUrls = new Set();

    function addLink(url, label) {
        if (!url || typeof url !== 'string' || !url.startsWith('http') || uniqueUrls.has(url)) return;
        if (url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) && !label.includes('Image')) return;
        uniqueUrls.add(url);
        extractedLinks.push({ label: label, url: url });
    }

    function deepSearch(obj) {
        if (!obj || typeof obj !== 'object') return;

        for (let k in obj) {
            let v = obj[k];
            if (v === null || v === undefined) continue;

            let keyLower = k.toLowerCase();

            if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))) {
                let num = parseInt(v);
                if (keyLower.includes('like') || keyLower.includes('digg') || keyLower.includes('favorite') || keyLower.includes('love')) {
                    maxLikes = Math.max(maxLikes, num);
                }
                if (keyLower.includes('comment') || keyLower.includes('reply')) {
                    maxComments = Math.max(maxComments, num);
                }
                if (keyLower.includes('share') || keyLower.includes('repost') || keyLower.includes('forward')) {
                    maxShares = Math.max(maxShares, num);
                }
            }

            if (typeof v === 'object') {
                deepSearch(v);
            } else if (typeof v === 'string') {
                
                if (keyLower.includes('title') || keyLower.includes('desc') || keyLower.includes('caption')) {
                    if (v.length > result.desc.length || result.desc === "Deskripsi tidak tersedia.") {
                        result.desc = v;
                    }
                }

                if (keyLower.includes('username') || keyLower.includes('nickname') || keyLower.includes('unique_id') || keyLower.includes('author')) {
                    if (v.length > 2 && result.author === "@AwangSystem") result.author = "@" + v;
                }

                if (v.startsWith('http')) {
                    if ((keyLower.includes('avatar') || keyLower.includes('profile')) && !result.avatar) {
                        result.avatar = v;
                    }

                    if ((keyLower.includes('cover') || keyLower.includes('thumb') || keyLower.includes('pic')) && !keyLower.includes('avatar')) {
                        if (result.thumb.includes('placehold') || !result.thumb.includes('http')) {
                            result.thumb = v;
                        }
                    }

                    if (v.includes('.mp4') || v.includes('.mp3') || keyLower.includes('play') || keyLower.includes('url') || keyLower.includes('video') || keyLower.includes('music') || keyLower.includes('download')) {
                        if (!v.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)) {
                            let label = "480p (SD) - Standard";
                            
                            if (keyLower.includes('hd') || v.includes('1080') || keyLower.includes('high')) {
                                label = "1080p (FHD) - Original";
                            } else if (keyLower.includes('nowm') || keyLower.includes('nwm') || keyLower.includes('no_watermark') || v.includes('720')) {
                                label = "720p (HD) - No Watermark";
                            } else if (keyLower.includes('wm') || keyLower.includes('watermark')) {
                                label = "360p (SD) - With Watermark";
                            }
                            
                            if (keyLower.includes('audio') || keyLower.includes('music') || v.includes('.mp3')) {
                                label = "Audio (MP3)";
                            }

                            addLink(v, label);
                        }
                    }
                }
            }
        }
    }

    deepSearch(response);

    result.likes = formatStatNumber(maxLikes);
    result.comments = formatStatNumber(maxComments);
    result.shares = formatStatNumber(maxShares);
    result.title = result.desc.substring(0, 50) + (result.desc.length > 50 ? "..." : "");

    extractedLinks.sort((a, b) => {
        if (a.label.includes('1080p')) return -1;
        if (b.label.includes('1080p')) return 1;
        if (a.label.includes('720p')) return -1;
        if (b.label.includes('720p')) return 1;
        return 0;
    });

    result.links = extractedLinks;

    let previewLink = result.links.find(l => l.label.includes('1080p')) || result.links.find(l => l.label.includes('720p')) || result.links.find(l => !l.label.includes('Audio'));
    if (previewLink) result.video = previewLink.url;

    return result;
}

function renderResult(data) {
    const videoEl = document.getElementById('resVideo');
    const thumbEl = document.getElementById('resThumb');
    const overlay = document.getElementById('playOverlay');

    if (data.video) {
        videoEl.src = data.video;
        videoEl.poster = data.thumb;
        videoEl.muted = false; 
        videoEl.autoplay = false; 
        videoEl.controls = true; 
        videoEl.preload = "auto";
        videoEl.playsInline = true;
        
        videoEl.setAttribute("referrerpolicy", "no-referrer");
        videoEl.setAttribute("crossorigin", "anonymous");

        videoEl.load();

        videoEl.classList.remove('hidden');
        thumbEl.style.display = 'none';
        overlay.style.display = 'none'; 
    } else {
        videoEl.classList.add('hidden');
        thumbEl.src = data.thumb;
        thumbEl.style.display = 'block';
        overlay.style.display = 'flex';
    }

    const resAvatarImg = document.getElementById('resAvatarImg');
    const resAvatarIcon = document.getElementById('resAvatarIcon');
    if (data.avatar && resAvatarImg) {
        resAvatarImg.src = data.avatar;
        resAvatarImg.classList.remove('hidden');
        if (resAvatarIcon) resAvatarIcon.style.display = 'none';
    } else {
        if (resAvatarImg) resAvatarImg.classList.add('hidden');
        if (resAvatarIcon) resAvatarIcon.style.display = 'block';
    }

    document.getElementById('resTitle').innerText = data.title;
    document.getElementById('resAuthor').innerText = data.author;
    document.getElementById('resDesc').innerText = data.desc;

    document.getElementById('statLikes').innerText = data.likes;
    document.getElementById('statComments').innerText = data.comments;
    document.getElementById('statShares').innerText = data.shares;

    const linksContainer = document.getElementById('downloadLinks');
    if (data.links.length > 0) {
        linksContainer.innerHTML = data.links.map(l => {
            let isAudio = l.label.includes('Audio');
            let iconColor = isAudio ? 'text-pink-500' : 'text-[#60a5fa]';
            let iconType = isAudio ? 'fa-music' : 'fa-download';

            return `
            <a href="${l.url}" target="_blank" class="dl-block" rel="noopener noreferrer" referrerpolicy="no-referrer">
                <div class="flex items-center gap-3">
                    <div class="dl-icon"><i class="fas ${iconType} ${iconColor}"></i></div>
                    <span class="dl-label">${l.label}</span>
                </div>
                <i class="fas fa-chevron-right text-[10px] text-slate-500"></i>
            </a>`;
        }).join('');
    } else {
        linksContainer.innerHTML = `<div class="text-center text-xs text-red-400 font-bold p-4 bg-red-900/20 rounded-xl border border-red-500/30">Data video diblokir server atau link telah kedaluwarsa.</div>`;
    }

    const resCard = document.getElementById('resultCard');
    resCard.style.display = 'block';
    
    setTimeout(() => {
        resCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

window.addEventListener('load', () => {
    setTimeout(initToolsSidebar, 100);
});
