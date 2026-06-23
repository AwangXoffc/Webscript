class AdvancedScraperEngine {
    constructor() {
        this.currentToolData = null;
        this.currentProgressInterval = null;
        this.currentBgFile = null;
        this.currentQrPayload = "";
        this.currentQrColor = "#020617";
        this.activeMediaUrl = null;
        this.youtubeMode = 'video';
    }

    async fetchDirect(url, method) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        try {
            const resp = await fetch(url, { method: method, signal: controller.signal });
            clearTimeout(timer);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (e) {
            clearTimeout(timer);
            throw e;
        }
    }

    async fetchViaProxy(url) {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 18000);
        try {
            const resp = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timer);
            if (!resp.ok) throw new Error(`Proxy HTTP ${resp.status}`);
            return await resp.json();
        } catch (e) {
            clearTimeout(timer);
            throw e;
        }
    }

    async fetchWithFallback(urlInput, toolId) {
        const endpoints = DL_CONFIG.apis[toolId];
        if (!endpoints || endpoints.length === 0) throw new Error("Endpoint tidak ditemukan untuk modul ini.");

        let lastError = null;

        for (let endpoint of endpoints) {
            const finalUrl = endpoint.url.replace('{URL}', encodeURIComponent(urlInput));
            let data = null;

            try {
                data = await this.fetchDirect(finalUrl, endpoint.method);
            } catch (e) {
                try {
                    data = await this.fetchViaProxy(finalUrl);
                } catch (e2) {
                    lastError = e2;
                    console.warn(`Endpoint gagal (direct + proxy): ${e2.message}`);
                    continue;
                }
            }

            if (!data || data.status === false || data.error) {
                lastError = new Error("API mengembalikan status gagal atau data kosong.");
                continue;
            }

            if (toolId === 'remove_bg') {
                const imgUrl = this.findFirstImageUrl(data);
                if (!imgUrl) {
                    lastError = new Error("Tidak ada URL gambar hasil ditemukan dari API remove_bg.");
                    continue;
                }
                return {
                    parsed: {
                        title: "Remove Background Result",
                        author: "@AxoVisionAI",
                        avatar: null,
                        desc: "",
                        hashtags: [],
                        isImage: true,
                        thumb: imgUrl,
                        video: null,
                        links: [{ label: "Hasil Remove Background (PNG)", url: imgUrl }]
                    },
                    raw: data
                };
            }

            const parsed = this.parseDataRaw(data, toolId);

            if (!parsed.video && parsed.links.length === 0 && !parsed.isImage) {
                lastError = new Error("Parser tidak menemukan link media valid dari endpoint ini.");
                continue;
            }

            return { parsed: parsed, raw: data };
        }

        throw new Error(
            lastError
                ? lastError.message || "Semua fallback API gagal. Pastikan URL valid dan konten bersifat publik."
                : "Sistem API sedang offline."
        );
    }

    findFirstImageUrl(obj) {
        if (!obj || typeof obj !== 'object') return null;
        for (let k in obj) {
            let v = obj[k];
            if (typeof v === 'string' && v.startsWith('http')) return v;
            if (Array.isArray(v)) {
                for (let item of v) {
                    let r = this.findFirstImageUrl(item);
                    if (r) return r;
                }
            } else if (typeof v === 'object' && v !== null) {
                let r = this.findFirstImageUrl(v);
                if (r) return r;
            }
        }
        return null;
    }

    extractHashtags(text) {
        if (!text) return [];
        const matches = text.match(/#[\w\u0400-\u04ffÀ-ÿ\u4e00-\u9fff]+/g);
        return matches ? [...new Set(matches)].slice(0, 12) : [];
    }

    extractYoutubeId(url) {
        const match = url.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    validateUrl(toolId, url) {
        const re = DL_CONFIG.validators ? DL_CONFIG.validators[toolId] : null;
        if (!re) return { valid: true };
        if (!re.test(url)) {
            const msg = DL_CONFIG.messages.invalidUrl
                ? DL_CONFIG.messages.invalidUrl[toolId] || "Link tidak valid untuk platform ini."
                : "Link tidak valid untuk platform ini.";
            return { valid: false, msg };
        }
        return { valid: true };
    }

    parseDataRaw(raw, toolId) {
        let state = {
            title: "",
            author: "@AxoSystem",
            avatar: null,
            desc: "",
            hashtags: [],
            isImage: false,
            thumb: "https://placehold.co/600x400/0f172a/60a5fa?text=Media+Thumbnail",
            video: null,
            links: []
        };

        let linksMap = new Map();
        let titleCandidate = "";
        let descCandidate = "";

        const deepSearch = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            for (let k in obj) {
                let v = obj[k];
                if (v === null || v === undefined) continue;
                let kl = k.toLowerCase();

                if (typeof v === 'string' && v.startsWith('http')) {
                    const isImageExt = v.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i);

                    if (kl.includes('avatar') || kl.includes('profile_pic') || kl.includes('user_image') || kl.includes('author_avatar')) {
                        if (!state.avatar) state.avatar = v;
                    } else if (kl.includes('thumb') || kl.includes('cover') || kl.includes('thumbnail')) {
                        if (!state.thumb.includes('http') || state.thumb.includes('placehold')) state.thumb = v;
                    } else if (isImageExt && (kl.includes('pic') || kl.includes('image') || kl.includes('photo'))) {
                        if (!state.thumb.includes('http') || state.thumb.includes('placehold')) state.thumb = v;
                    } else if (isImageExt && !kl.includes('avatar') && !kl.includes('profile')) {
                        if (!linksMap.has(v)) linksMap.set(v, "Unduh Gambar HD");
                    } else if (!isImageExt) {
                        let label = "Unduh Media";
                        if (kl.includes('hd') || kl.includes('nowm') || kl.includes('nwm') || v.includes('1080') || v.includes('720') || v.includes('watermarkfree')) {
                            label = "Video HD - No Watermark";
                        } else if (kl.includes('wm') || kl.includes('watermark')) {
                            label = "Video SD - With Watermark";
                        } else if (kl.includes('audio') || kl.includes('music') || v.includes('.mp3') || kl.includes('mp3') || kl.includes('sound')) {
                            label = "Audio (MP3)";
                        } else if (kl.includes('video') || kl.includes('play') || v.includes('.mp4')) {
                            label = "Unduh Video";
                        } else if (kl.includes('url') || kl.includes('download') || kl.includes('link')) {
                            label = "Unduh File";
                        }
                        if (!linksMap.has(v)) linksMap.set(v, label);
                    }
                } else if (typeof v === 'string') {
                    if ((kl.includes('title') || kl === 'name') && v.length > 2 && v.length < 200) {
                        if (v.length > titleCandidate.length) titleCandidate = v;
                    }
                    if ((kl.includes('desc') || kl.includes('caption') || kl.includes('text') || kl === 'content') && v.length > descCandidate.length) {
                        descCandidate = v;
                    }
                    if ((kl.includes('author') || kl.includes('username') || kl.includes('nickname') || kl.includes('unique_id') || kl.includes('creator') || kl.includes('channel')) && v.length > 2 && state.author === "@AxoSystem") {
                        state.author = v.startsWith('@') ? v : "@" + v;
                    }
                } else if (Array.isArray(v)) {
                    v.forEach(item => deepSearch(item));
                } else if (typeof v === 'object') {
                    deepSearch(v);
                }
            }
        };

        deepSearch(raw);

        state.desc = descCandidate || "Deskripsi tidak tersedia atau tidak terdeteksi oleh sistem.";
        state.title = titleCandidate || (state.desc.substring(0, 80) + (state.desc.length > 80 ? "..." : ""));
        state.hashtags = this.extractHashtags(state.desc);

        linksMap.forEach((label, url) => {
            state.links.push({ label, url });
        });

        state.links.sort((a, b) => {
            const aIsHD = a.label.includes('HD') || a.label.includes('No Watermark');
            const bIsHD = b.label.includes('HD') || b.label.includes('No Watermark');
            if (aIsHD && !bIsHD) return -1;
            if (!aIsHD && bIsHD) return 1;
            return 0;
        });

        const videoLink = state.links.find(l =>
            l.url.includes('.mp4') ||
            l.label.includes('Video') ||
            l.label.includes('HD') ||
            l.label.includes('No Watermark')
        );
        if (videoLink) state.video = videoLink.url;

        const allAreImages = state.links.length > 0 && state.links.every(l =>
            l.url.match(/\.(jpg|jpeg|png|webp|gif)/i) ||
            l.label.toLowerCase().includes('gambar') ||
            l.label.toLowerCase().includes('image') ||
            l.label.toLowerCase().includes('foto')
        );
        state.isImage = !state.video && (allAreImages || (!state.video && state.links.length === 0 && state.thumb && !state.thumb.includes('placehold')));

        if (state.isImage && state.links.length === 0 && state.thumb) {
            state.links.push({ label: "Unduh Gambar HD", url: state.thumb });
        }

        return state;
    }

    formatStat(num) {
        if (num === null || num === undefined) return "0";
        let n = parseInt(num);
        if (isNaN(n)) return "0";
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    }
}

const Engine = new AdvancedScraperEngine();

async function smartDownload(url, filename) {
    if (typeof showToast === 'function') showToast("Memproses unduhan file...", "info");
    try {
        const resp = await fetch(url, { mode: 'cors' });
        if (!resp.ok) throw new Error('Fetch blob gagal');
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        if (typeof showToast === 'function') showToast("Unduhan berhasil dimulai!", "success");
        if (typeof playSfx === 'function') playSfx('success');
    } catch (e) {
        window.open(url, '_blank');
        if (typeof showToast === 'function') showToast("File dibuka di tab baru. Simpan manual dari browser.", "info");
    }
}

function initToolsSidebar() {
    const sidebar = document.getElementById('sidebarContent');
    if (!sidebar || typeof DL_CONFIG === 'undefined') return;

    sidebar.innerHTML = '';

    const categories = {
        downloader: "MEDIA EXTRACTOR",
        image: "IMAGE AI LABS",
        ai: "AI ASSISTANT",
        utility: "DEVELOPER UTILS"
    };

    let html = '';

    for (const [catKey, catName] of Object.entries(categories)) {
        const toolsInCat = DL_CONFIG.tools.filter(t => t.category === catKey);
        if (toolsInCat.length === 0) continue;

        html += `
        <div class="px-6 mb-3 mt-4">
            <div class="text-[9px] font-black text-[#60a5fa] uppercase tracking-[0.2em] opacity-80 mb-1">${catName}</div>
            <div class="h-[1px] w-full bg-gradient-to-r from-[#1e293b] to-transparent"></div>
        </div>`;

        toolsInCat.forEach(tool => {
            const iconClass = window.getIcon ? window.getIcon(tool.icon) : "fas fa-bolt";

            html += `
            <div onclick="switchTool('${tool.id}')" class="relative overflow-hidden flex items-center gap-4 px-5 py-3 mx-3 rounded-xl cursor-pointer group transition-all duration-300 hover:bg-[#1e3a8a]/20 border border-transparent hover:border-[#60a5fa]/30 mb-1.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0f172a] border border-[#334155] shadow-lg group-hover:scale-110 transition-transform relative z-10" style="color: ${tool.color};">
                    <i class="${iconClass} text-sm"></i>
                </div>
                <div class="flex-1 relative z-10">
                    <h4 class="text-[10px] font-black uppercase text-slate-300 group-hover:text-white transition-colors tracking-wide">${tool.name}</h4>
                </div>
            </div>`;
        });
    }

    html += `
    <div class="mt-8 px-4 border-t border-[#1e293b] pt-6 mx-2 mb-8">
        <a href="../index.html" class="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition-all text-[9px] font-bold uppercase tracking-widest group">
            <i class="fas fa-power-off group-hover:text-red-400 transition-colors"></i> TERMINATE SYSTEM
        </a>
    </div>`;

    sidebar.innerHTML = html;
}

window.backToMenu = () => {
    document.getElementById('toolState').style.display = 'none';
    const welcome = document.getElementById('welcomeState');
    welcome.style.display = 'block';
    welcome.style.animation = 'none';
    void welcome.offsetHeight;
    welcome.style.animation = 'slideUp 0.5s ease-out forwards';
    if (typeof playSfx === 'function') playSfx('pop');
};

window.setYoutubeMode = (mode) => {
    Engine.youtubeMode = mode;
    const btnThumb = document.getElementById('btnYtThumb');
    const btnVideo = document.getElementById('btnYtVideo');
    if (!btnThumb || !btnVideo) return;

    if (mode === 'thumbnail') {
        btnThumb.classList.add('active');
        btnVideo.classList.remove('active');
        const inp = document.getElementById('urlInput');
        if (inp) inp.placeholder = 'Tempel URL YouTube untuk ekstrak thumbnail...';
    } else {
        btnVideo.classList.add('active');
        btnThumb.classList.remove('active');
        const inp = document.getElementById('urlInput');
        if (inp) inp.placeholder = 'Tempel URL YouTube untuk unduh video...';
    }
    if (typeof playSfx === 'function') playSfx('pop');
};

window.switchTool = (id) => {
    Engine.currentToolData = DL_CONFIG.tools.find(t => t.id === id);
    if (!Engine.currentToolData) return;

    document.getElementById('welcomeState').style.display = 'none';

    const toolState = document.getElementById('toolState');
    toolState.style.display = 'block';
    toolState.style.animation = 'none';
    void toolState.offsetHeight;
    toolState.style.animation = 'slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';

    const iconClass = window.getIcon ? window.getIcon(Engine.currentToolData.icon) : "fas fa-bolt";

    document.getElementById('toolHeroSection').innerHTML = `
        <button onclick="backToMenu()" class="back-btn-modern"><i class="fas fa-arrow-left"></i> KEMBALI MENU</button>
        <div class="tool-hero-box border-b-4" style="border-bottom-color: ${Engine.currentToolData.color};">
            <div class="tool-hero-icon-container" style="color: ${Engine.currentToolData.color}; border-color: ${Engine.currentToolData.color}40; box-shadow: 0 0 30px ${Engine.currentToolData.color}20;">
                <i class="${iconClass}"></i>
            </div>
            <h2 class="tool-hero-title">${Engine.currentToolData.name}</h2>
            <p class="tool-hero-desc">${Engine.currentToolData.desc}</p>
            <span class="tool-badge-pill"><i class="fas fa-check-circle mr-1"></i> MODUL AKTIF</span>
        </div>
    `;

    const inputArea = document.getElementById('toolInputArea');

    if (Engine.currentToolData.id === 'uuid_gen' || Engine.currentToolData.id === 'password_gen') {
        inputArea.innerHTML = `
            <button onclick="generateUtilityTool()" class="go-btn-modern w-full rounded-xl flex items-center justify-center gap-3">
                <i class="fas fa-microchip"></i> EKSEKUSI GENERATOR SEKARANG
            </button>
        `;
    } else if (Engine.currentToolData.id === 'remove_bg') {
        inputArea.innerHTML = `
            <div class="w-full flex flex-col items-center">
                <input type="file" id="bgUploadInput" accept="image/*" class="hidden" onchange="handleBgUploadPreview(event)">
                <div id="bgDropzone" onclick="document.getElementById('bgUploadInput').click()" class="w-full border-2 border-dashed border-[#334155] hover:border-[#60a5fa] bg-[#020617] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all shadow-inner">
                    <i class="fas fa-cloud-upload-alt text-3xl text-[#60a5fa] mb-3"></i>
                    <span class="text-[11px] text-slate-300 font-bold uppercase tracking-widest text-center">Pilih Gambar dari Perangkat</span>
                    <span class="text-[9px] text-slate-500 mt-2 text-center">Format didukung: JPG, PNG, WEBP</span>
                </div>
                <div id="bgPreviewContainer" class="hidden w-full mt-2 flex flex-col items-center bg-[#020617] p-4 rounded-xl border border-[#1e293b]">
                    <img id="bgPreviewImg" src="" class="max-h-[200px] w-auto rounded-lg border border-[#334155] shadow-lg mb-4 object-contain">
                    <button id="processBtn" onclick="processRemoveBg()" class="go-btn-modern w-full text-[11px] py-4 rounded-xl">
                        <i class="fas fa-magic mr-2"></i> PROSES REMOVE BG SEKARANG
                    </button>
                </div>
            </div>
        `;
    } else if (Engine.currentToolData.id === 'qr_gen') {
        inputArea.innerHTML = `
            <input type="text" id="urlInput" class="url-input-modern" placeholder="Masukkan Teks atau URL..." autocomplete="off">
            <button id="processBtn" onclick="processUrl()" class="go-btn-modern w-full sm:w-auto">
                <i class="fas fa-qrcode mr-2 sm:hidden"></i> GENERATE
            </button>
        `;
    } else if (Engine.currentToolData.id === 'youtube') {
        Engine.youtubeMode = 'video';
        inputArea.innerHTML = `
            <div class="flex flex-col w-full gap-3">
                <div class="yt-mode-selector">
                    <button onclick="setYoutubeMode('thumbnail')" id="btnYtThumb" class="yt-mode-btn">
                        <i class="fas fa-image"></i> THUMBNAIL
                    </button>
                    <button onclick="setYoutubeMode('video')" id="btnYtVideo" class="yt-mode-btn active">
                        <i class="fas fa-video"></i> VIDEO
                    </button>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 w-full">
                    <input type="text" id="urlInput" class="url-input-modern" placeholder="Tempel URL YouTube untuk unduh video..." autocomplete="off">
                    <button id="processBtn" onclick="processUrl()" class="go-btn-modern w-full sm:w-auto">
                        <i class="fas fa-terminal mr-2 sm:hidden"></i> EKSTRAK
                    </button>
                </div>
            </div>
        `;
    } else {
        const placeholderTxt = Engine.currentToolData.id === 'ai_caption'
            ? 'Masukkan Keyword Spesifik...'
            : 'Tempel URL / Link Media Publik di Sini...';
        inputArea.innerHTML = `
            <input type="text" id="urlInput" class="url-input-modern" placeholder="${placeholderTxt}" autocomplete="off">
            <button id="processBtn" onclick="processUrl()" class="go-btn-modern w-full sm:w-auto">
                <i class="fas fa-terminal mr-2 sm:hidden"></i> EKSTRAK
            </button>
        `;
    }

    let modulesHtml = '';
    if (Engine.currentToolData.category === 'downloader') {
        modulesHtml = `
            <div class="module-card-item">
                <h4><i class="fas fa-bolt"></i> Speed</h4>
                <p>Proses bypass protokol cepat dan stabil tanpa limit bandwidth.</p>
            </div>
            <div class="module-card-item">
                <h4><i class="fas fa-video"></i> Quality</h4>
                <p>Support resolusi asli HD beserta format audio murni (MP3).</p>
            </div>
            <div class="module-card-item">
                <h4><i class="fas fa-shield-alt"></i> Privacy</h4>
                <p>Privasi terjamin. Aktivitas tidak direkam ke dalam basis data.</p>
            </div>`;
    } else if (Engine.currentToolData.category === 'utility' || Engine.currentToolData.category === 'ai' || Engine.currentToolData.category === 'image') {
        modulesHtml = `
            <div class="module-card-item">
                <h4><i class="fas fa-brain"></i> Algoritma Cerdas</h4>
                <p>Sistem merespons instruksi menggunakan logic generasi modern.</p>
            </div>
            <div class="module-card-item">
                <h4><i class="fas fa-lock"></i> Keamanan Hash</h4>
                <p>Sistem mematuhi standar enkripsi format output tertinggi.</p>
            </div>
            <div class="module-card-item">
                <h4><i class="fas fa-bolt"></i> Real-time</h4>
                <p>Hasil ditampilkan seketika langsung di browser klien Anda.</p>
            </div>`;
    }

    document.getElementById('toolModularInfo').innerHTML = `<div class="module-grid-layout">${modulesHtml}</div>`;
    document.getElementById('resultCard').style.display = 'none';

    if (window.innerWidth < 768) {
        const sb = document.getElementById('sidebar');
        if (sb && sb.classList.contains('active')) {
            if (typeof toggleMenu === 'function') toggleMenu();
        }
    }

    if (typeof playSfx === 'function') playSfx('pop');
};

function toggleProgress(show) {
    const container = document.getElementById('dlProgressContainer');
    const inputArea = document.getElementById('toolInputArea');
    const progressBar = document.getElementById('dlProgressBar');
    const statusText = document.getElementById('dlStatusText');
    const percentText = document.getElementById('dlPercentage');

    if (show) {
        inputArea.style.display = 'none';
        container.style.display = 'block';
        progressBar.style.width = '0%';
        percentText.innerText = '0%';
        statusText.innerText = 'Menghubungkan ke Advanced Protocol...';

        let p = 0;
        clearInterval(Engine.currentProgressInterval);
        Engine.currentProgressInterval = setInterval(() => {
            p += Math.random() * 12;
            if (p > 90) p = 90;
            progressBar.style.width = p + '%';
            percentText.innerText = Math.floor(p) + '%';

            if (p > 25) statusText.innerText = 'Melewati autentikasi endpoint...';
            if (p > 50) statusText.innerText = 'Mengekstraksi metadata spesifik...';
            if (p > 75) statusText.innerText = 'Memfinalisasi format output resolusi...';
        }, 350);
    } else {
        clearInterval(Engine.currentProgressInterval);
        progressBar.style.width = '100%';
        percentText.innerText = '100%';
        statusText.innerText = 'Operasi Selesai!';

        setTimeout(() => {
            container.style.display = 'none';
            inputArea.style.display = 'flex';
        }, 600);
    }
}

window.handleBgUploadPreview = (event) => {
    const file = event.target.files[0];
    if (file) {
        Engine.currentBgFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bgPreviewImg').src = e.target.result;
            document.getElementById('bgDropzone').classList.add('hidden');
            document.getElementById('bgPreviewContainer').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
        if (typeof playSfx === 'function') playSfx('pop');
    }
};

window.processRemoveBg = async () => {
    if (!Engine.currentBgFile) {
        if (typeof showToast === 'function') showToast("Pilih gambar terlebih dahulu!", "warning");
        return;
    }

    if (!navigator.onLine) {
        if (typeof showToast === 'function') showToast("Sistem Offline: Periksa koneksi internet Anda!", "warning");
        return;
    }

    toggleProgress(true);

    try {
        const cloudinaryUrl = await window.uploadToCloudinary(Engine.currentBgFile);
        if (!cloudinaryUrl) throw new Error("Gagal mengunggah gambar ke server perantara.");

        const fetchResult = await Engine.fetchWithFallback(cloudinaryUrl, 'remove_bg');
        const resultUrl = fetchResult.parsed.links.length > 0 ? fetchResult.parsed.links[0].url : null;

        if (!resultUrl) throw new Error("Gagal memproses. API tidak merespons link output yang valid.");

        renderRemoveBgCustomResult(resultUrl);
        if (typeof showToast === 'function') showToast("Background berhasil dihapus dengan sempurna!", "success");
        if (typeof playSfx === 'function') playSfx('success');
    } catch (e) {
        console.error(e);
        if (typeof showToast === 'function') showToast(e.message, "error");
    } finally {
        toggleProgress(false);
    }
};

window.processUrl = async () => {
    const inputEl = document.getElementById('urlInput');
    if (!inputEl) return;
    const url = inputEl.value.trim();

    if (!navigator.onLine) {
        if (typeof showToast === 'function') showToast("Sistem Offline: Periksa koneksi internet Anda!", "warning");
        return;
    }

    if (!url) {
        if (typeof showToast === 'function') showToast("Mohon isi form input terlebih dahulu!", "info");
        return;
    }

    if (!Engine.currentToolData) {
        if (typeof showToast === 'function') showToast("Pilih modul tools terlebih dahulu!", "warning");
        return;
    }

    if (Engine.currentToolData.id === 'qr_gen') {
        Engine.currentQrPayload = url;
        Engine.currentQrColor = "#020617";
        renderQrCustomResult();
        return;
    }

    if (Engine.currentToolData.id === 'ai_caption') {
        handleLocalGenerator('ai_caption', url);
        return;
    }

    const validation = Engine.validateUrl(Engine.currentToolData.id, url);
    if (!validation.valid) {
        if (typeof showToast === 'function') showToast(validation.msg, "warning");
        return;
    }

    if (Engine.currentToolData.id === 'youtube' && Engine.youtubeMode === 'thumbnail') {
        const videoId = Engine.extractYoutubeId(url);
        if (!videoId) {
            if (typeof showToast === 'function') showToast("Tidak dapat mendeteksi ID video YouTube dari link ini.", "error");
            return;
        }

        const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const parsedData = {
            title: `Thumbnail Video YouTube`,
            author: `@youtube/${videoId}`,
            avatar: null,
            desc: `Thumbnail HD dari video YouTube dengan ID: ${videoId}. Pilih resolusi untuk mengunduh gambar thumbnail berkualitas tinggi.`,
            hashtags: [],
            isImage: true,
            thumb: thumbUrl,
            video: null,
            links: []
        };

        Engine.activeMediaUrl = thumbUrl;
        renderResult(parsedData);

        if (typeof showToast === 'function') showToast("Thumbnail YouTube berhasil diekstrak!", "success");
        if (typeof playSfx === 'function') playSfx('success');
        return;
    }

    toggleProgress(true);

    try {
        const fetchResult = await Engine.fetchWithFallback(url, Engine.currentToolData.id);
        renderResult(fetchResult.parsed);
        if (typeof showToast === 'function') showToast(DL_CONFIG.messages.success, "success");
        if (typeof playSfx === 'function') playSfx('success');
    } catch (e) {
        console.error("Extraction Error:", e);
        if (typeof showToast === 'function') showToast(e.message || DL_CONFIG.messages.error, "error");
    } finally {
        toggleProgress(false);
    }
};

window.generateUtilityTool = () => {
    if (!Engine.currentToolData) return;
    handleLocalGenerator(Engine.currentToolData.id, null);
};

function handleLocalGenerator(type, payload) {
    let resultText = '';

    if (type === 'uuid_gen') {
        resultText = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    } else if (type === 'password_gen') {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|{}[]<>?";
        for (let i = 0; i < 18; i++) {
            resultText += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } else if (type === 'ai_caption') {
        const tag = payload ? payload.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10) : 'Content';
        resultText = `Momen luar biasa yang sayang untuk dilewatkan! Setiap detiknya menyimpan cerita yang tak terlupakan. Bagikan ke orang terdekat dan jangan lupa simpan kenangan terbaik ini.\n\n#Viral #Trending #${tag} #AxoSystem #FYP`;
    }

    renderLocalTextResult(Engine.currentToolData.name, resultText);

    if (typeof playSfx === 'function') playSfx('success');
    if (typeof showToast === 'function') showToast("Proses eksekusi lokal berhasil!", "success");
}

window.downloadImageResized = (imageUrl, filename, targetHeight, format = 'png') => {
    if (typeof showToast === 'function') showToast(`Memproses resolusi ${targetHeight}p HD...`, "info");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');

        let finalHeight = targetHeight;
        if (targetHeight === 240) finalHeight = 720;
        if (targetHeight === 360) finalHeight = 1080;
        if (targetHeight === 480) finalHeight = 1440;

        const finalWidth = Math.round((img.width / img.height) * finalHeight);

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, 1.0);

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${filename}_${targetHeight}p.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (typeof showToast === 'function') showToast(`Unduhan ${targetHeight}p selesai!`, "success");
    };
    img.onerror = () => {
        smartDownload(imageUrl, `${filename}.${format}`);
    };
    img.src = imageUrl;
};

window.downloadCurrentImage = (targetHeight) => {
    if (!Engine.activeMediaUrl) {
        if (typeof showToast === 'function') showToast("URL media tidak tersedia.", "warning");
        return;
    }
    downloadImageResized(Engine.activeMediaUrl, 'Axo_Media', targetHeight, 'png');
};

window.downloadMediaResized = async (targetHeight) => {
    if (!Engine.activeMediaUrl) {
        if (typeof showToast === 'function') showToast("URL media tidak tersedia.", "warning");
        return;
    }
    await smartDownload(Engine.activeMediaUrl, `Axo_Media_${targetHeight}p.mp4`);
};

window.renderQrCustomResult = () => {
    document.getElementById('resVideoWrapper').style.display = 'none';
    document.getElementById('resStatsGrid').style.display = 'none';
    document.getElementById('dividerTextContainer').style.display = 'none';
    document.getElementById('downloadLinks').style.display = 'none';
    document.getElementById('localResultBox').classList.add('hidden');
    document.getElementById('removeBgResultBox').classList.add('hidden');
    document.getElementById('resolutionActionBox').classList.add('hidden');
    document.getElementById('resHashtagsWrap').classList.add('hidden');

    document.getElementById('resAuthorHeader').style.display = 'flex';
    document.getElementById('resTitle').innerText = "QR Code Gen Premium";
    document.getElementById('resAuthor').innerText = "@AxoUtility";
    document.getElementById('resDesc').innerText = "QR Code sukses dieksekusi secara instan. Silakan modifikasi tema warna sesuai dengan preferensi desain Anda sebelum ditarik ke media penyimpanan.";

    const resAvatarImg = document.getElementById('resAvatarImg');
    const resAvatarIcon = document.getElementById('resAvatarIcon');
    resAvatarImg.classList.add('hidden');
    resAvatarIcon.style.display = 'block';

    const qrBox = document.getElementById('qrResultBox');
    qrBox.classList.remove('hidden');

    updateQrImageDisplay();

    const resCard = document.getElementById('resultCard');
    resCard.style.display = 'block';

    setTimeout(() => {
        resCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
};

window.updateQrImageDisplay = () => {
    const imgEl = document.getElementById('qrGeneratedImage');
    const colorHex = Engine.currentQrColor.replace('#', '');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&data=${encodeURIComponent(Engine.currentQrPayload)}&color=${colorHex}&margin=10`;
    imgEl.src = url;
};

window.setQrColor = (hex) => {
    Engine.currentQrColor = hex;
    updateQrImageDisplay();
    if (typeof playSfx === 'function') playSfx('pop');
};

window.downloadQr = (format) => {
    const colorHex = Engine.currentQrColor.replace('#', '');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&data=${encodeURIComponent(Engine.currentQrPayload)}&color=${colorHex}&margin=10&format=${format}`;
    downloadImageResized(url, 'Axo_QRCode', 480, format);
};

window.renderRemoveBgCustomResult = (imageUrl) => {
    document.getElementById('resVideoWrapper').style.display = 'none';
    document.getElementById('resStatsGrid').style.display = 'none';
    document.getElementById('dividerTextContainer').style.display = 'none';
    document.getElementById('downloadLinks').style.display = 'none';
    document.getElementById('localResultBox').classList.add('hidden');
    document.getElementById('qrResultBox').classList.add('hidden');
    document.getElementById('resolutionActionBox').classList.add('hidden');
    document.getElementById('resHashtagsWrap').classList.add('hidden');

    document.getElementById('resAuthorHeader').style.display = 'flex';
    document.getElementById('resTitle').innerText = "AI Labs: Background Terhapus";
    document.getElementById('resAuthor').innerText = "@AxoVisionAI";
    document.getElementById('resDesc').innerText = "Latar belakang foto telah dihilangkan secara sempurna melalui algoritma AI canggih. Pilih opsi resolusi di bawah untuk mengunduh versi bersih transparan ke penyimpanan Anda.";

    const resAvatarImg = document.getElementById('resAvatarImg');
    const resAvatarIcon = document.getElementById('resAvatarIcon');
    resAvatarImg.classList.add('hidden');
    resAvatarIcon.style.display = 'block';

    const rbBox = document.getElementById('removeBgResultBox');
    rbBox.classList.remove('hidden');

    document.getElementById('removeBgGeneratedImage').src = imageUrl;

    document.getElementById('btnDlBg240').onclick = () => downloadImageResized(imageUrl, 'Axo_RemoveBG', 240, 'png');
    document.getElementById('btnDlBg360').onclick = () => downloadImageResized(imageUrl, 'Axo_RemoveBG', 360, 'png');
    document.getElementById('btnDlBg480').onclick = () => downloadImageResized(imageUrl, 'Axo_RemoveBG', 480, 'png');

    const resCard = document.getElementById('resultCard');
    resCard.style.display = 'block';

    setTimeout(() => {
        resCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
};

function renderResult(data) {
    const videoEl = document.getElementById('resVideo');
    const thumbEl = document.getElementById('resThumb');
    const overlay = document.getElementById('playOverlay');
    const videoWrapper = document.getElementById('resVideoWrapper');
    const resolutionBox = document.getElementById('resolutionActionBox');
    const linksContainer = document.getElementById('downloadLinks');
    const statsGrid = document.getElementById('resStatsGrid');
    const hashtagsWrap = document.getElementById('resHashtagsWrap');
    const hashtagsContainer = document.getElementById('resHashtags');

    Engine.activeMediaUrl = data.video || (data.links.length > 0 ? data.links[0].url : null);

    statsGrid.style.display = 'none';

    if (data.isImage) {
        videoEl.classList.add('hidden');
        const imgSrc = data.thumb || (data.links.length > 0 ? data.links[0].url : '');
        thumbEl.src = imgSrc;
        thumbEl.style.display = 'block';
        thumbEl.style.opacity = '1';
        thumbEl.style.objectFit = 'contain';
        overlay.style.display = 'none';
        videoWrapper.classList.add('image-mode');
        Engine.activeMediaUrl = imgSrc;
    } else if (data.video) {
        videoEl.src = data.video;
        videoEl.poster = data.thumb;
        videoEl.muted = false;
        videoEl.controls = true;
        videoEl.preload = "auto";
        videoEl.playsInline = true;
        videoEl.setAttribute("referrerpolicy", "no-referrer");
        videoEl.setAttribute("crossorigin", "anonymous");
        videoEl.load();
        videoEl.classList.remove('hidden');
        thumbEl.style.display = 'none';
        overlay.style.display = 'none';
        videoWrapper.classList.remove('image-mode');
    } else {
        videoEl.classList.add('hidden');
        thumbEl.src = data.thumb;
        thumbEl.style.display = 'block';
        thumbEl.style.opacity = '0.6';
        thumbEl.style.objectFit = 'cover';
        overlay.style.display = 'flex';
        videoWrapper.classList.remove('image-mode');
    }

    const resAvatarImg = document.getElementById('resAvatarImg');
    const resAvatarIcon = document.getElementById('resAvatarIcon');
    if (data.avatar) {
        resAvatarImg.src = data.avatar;
        resAvatarImg.classList.remove('hidden');
        resAvatarIcon.style.display = 'none';
    } else {
        resAvatarImg.classList.add('hidden');
        resAvatarIcon.style.display = 'block';
    }

    document.getElementById('resTitle').innerText = data.title || '';
    document.getElementById('resAuthor').innerText = data.author || '';
    document.getElementById('resDesc').innerText = data.desc || '';

    if (data.hashtags && data.hashtags.length > 0) {
        hashtagsWrap.classList.remove('hidden');
        hashtagsContainer.innerHTML = data.hashtags
            .map(h => `<span class="hashtag-pill">${h}</span>`)
            .join('');
    } else {
        hashtagsWrap.classList.add('hidden');
        hashtagsContainer.innerHTML = '';
    }

    resolutionBox.innerHTML = '';
    linksContainer.innerHTML = '';

    if (data.isImage) {
        resolutionBox.classList.remove('hidden');
        resolutionBox.innerHTML = `
            <span class="resolution-section-label">Pilih Resolusi Unduhan</span>
            <div class="resolution-btn-group">
                <button onclick="downloadCurrentImage(240)" class="resolution-btn secondary">
                    <i class="fas fa-download"></i> 240p
                </button>
                <button onclick="downloadCurrentImage(360)" class="resolution-btn secondary">
                    <i class="fas fa-download"></i> 360p
                </button>
                <button onclick="downloadCurrentImage(480)" class="resolution-btn primary">
                    <i class="fas fa-download"></i> 480p HD
                </button>
            </div>
        `;
        linksContainer.style.display = 'none';
    } else {
        const hasVideoSource = data.video || data.links.some(l =>
            l.url.includes('.mp4') || l.label.includes('Video') || l.label.includes('HD')
        );

        if (hasVideoSource) {
            resolutionBox.classList.remove('hidden');
            resolutionBox.innerHTML = `
                <span class="resolution-section-label">Pilih Resolusi Video Output</span>
                <div class="resolution-btn-group">
                    <button onclick="downloadMediaResized(240)" class="resolution-btn secondary">
                        <i class="fas fa-download"></i> 240p
                    </button>
                    <button onclick="downloadMediaResized(360)" class="resolution-btn secondary">
                        <i class="fas fa-download"></i> 360p
                    </button>
                    <button onclick="downloadMediaResized(480)" class="resolution-btn primary">
                        <i class="fas fa-download"></i> 480p HD
                    </button>
                </div>
            `;
        } else {
            resolutionBox.classList.add('hidden');
        }

        const audioLinks = data.links.filter(l =>
            l.label.toLowerCase().includes('audio') ||
            l.label.toLowerCase().includes('mp3') ||
            l.label.toLowerCase().includes('sound') ||
            l.url.includes('.mp3')
        );

        if (audioLinks.length > 0) {
            linksContainer.style.display = 'flex';
            linksContainer.innerHTML = audioLinks.map(l => {
                const safeUrl = l.url.replace(/'/g, "\\'");
                const safeName = `Axo_Audio_${Date.now()}.mp3`;
                return `
                <button onclick="smartDownload('${safeUrl}', '${safeName}')" class="dl-block-modern" style="background: linear-gradient(135deg, #3b0764 0%, #6b21a8 100%); border-color: #a855f7;">
                    <div class="flex items-center gap-4">
                        <div class="dl-icon-modern"><i class="fas fa-music text-pink-400"></i></div>
                        <span class="dl-label-modern">${l.label}</span>
                    </div>
                    <i class="fas fa-arrow-down text-xs text-slate-500"></i>
                </button>`;
            }).join('');
        } else if (!hasVideoSource) {
            linksContainer.style.display = 'block';
            linksContainer.innerHTML = `<div class="text-center text-xs text-red-400 font-bold p-5 bg-red-900/20 rounded-xl border border-red-500/30">Data tautan ekstraksi terproteksi oleh limit server origin. Coba beberapa saat lagi.</div>`;
        } else {
            linksContainer.style.display = 'none';
        }
    }

    document.getElementById('localResultBox').classList.add('hidden');
    document.getElementById('qrResultBox').classList.add('hidden');
    document.getElementById('removeBgResultBox').classList.add('hidden');
    document.getElementById('dividerTextContainer').style.display = 'block';
    document.getElementById('resVideoWrapper').style.display = 'flex';
    document.getElementById('resAuthorHeader').style.display = 'flex';

    const resCard = document.getElementById('resultCard');
    resCard.style.display = 'block';

    setTimeout(() => {
        resCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

function renderLocalTextResult(title, textValue) {
    document.getElementById('resVideoWrapper').style.display = 'none';
    document.getElementById('resStatsGrid').style.display = 'none';
    document.getElementById('dividerTextContainer').style.display = 'none';
    document.getElementById('downloadLinks').style.display = 'none';
    document.getElementById('qrResultBox').classList.add('hidden');
    document.getElementById('removeBgResultBox').classList.add('hidden');
    document.getElementById('resolutionActionBox').classList.add('hidden');
    document.getElementById('resHashtagsWrap').classList.add('hidden');

    document.getElementById('resTitle').innerText = "Utility Result: " + title;
    document.getElementById('resAuthor').innerText = "@AxoSystemLokal";
    document.getElementById('resDesc').innerText = "Sistem kami telah sukses mengkalkulasi eksekusi parameter lokal Anda. Data output tersimpan di bawah ini.";

    const resAvatarImg = document.getElementById('resAvatarImg');
    const resAvatarIcon = document.getElementById('resAvatarIcon');
    resAvatarImg.classList.add('hidden');
    resAvatarIcon.style.display = 'block';

    document.getElementById('resAuthorHeader').style.display = 'flex';

    const localBox = document.getElementById('localResultBox');
    localBox.classList.remove('hidden');
    document.getElementById('localResultText').innerText = textValue;

    const resCard = document.getElementById('resultCard');
    resCard.style.display = 'block';

    setTimeout(() => {
        resCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

window.copyLocalResult = () => {
    const text = document.getElementById('localResultText').innerText;
    navigator.clipboard.writeText(text).then(() => {
        if (typeof showToast === 'function') showToast("Data berhasil disalin!", "success");
        if (typeof playSfx === 'function') playSfx('pop');
    });
};

window.addEventListener('load', () => {
    setTimeout(initToolsSidebar, 100);
});