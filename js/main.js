// =========================================
// FILE: js/main.js
// =========================================

// =========================================
// SYSTEM SECURITY (ANTI-THEFT) & DEV LOGIC
// =========================================
(function initializeSystemSecurity() {
    if (typeof CONFIG === 'undefined') return;
    
    if (CONFIG.security && CONFIG.security.allowedDomains) {
        const allowed = CONFIG.security.allowedDomains;
        const current = window.location.hostname;
        if (current !== "" && !allowed.includes(current) && !current.includes("127.0.0.1") && !current.includes("localhost")) {
            console.error("SECURITY ALERT: UNAUTHORIZED DOMAIN DETECTED.");
            eval(CONFIG.security.garbageCode);
            return;
        }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'developer') {
        if (CONFIG.admin && CONFIG.admin.uid) {
            localStorage.setItem('user_uid_v4', CONFIG.admin.uid);
            localStorage.setItem('user_name_v4', CONFIG.adminNames[0] || "Awang Official");
            const newUrl = window.location.href.split('?')[0];
            window.history.replaceState({}, document.title, newUrl);
            setTimeout(() => {
                alert("✅ SYSTEM: AKSES DEVELOPER BERHASIL DIPULIHKAN!\nID Anda telah dikembalikan sebagai Admin.");
                window.location.reload();
            }, 500);
        }
    }
})();

// =========================================
// GLOBAL MAINTENANCE CHECKER (PER-PAGE)
// =========================================
(function checkMaintenance() {
    if (typeof CONFIG === 'undefined' || !CONFIG.maintenanceConfig) return;

    const mConfig = CONFIG.maintenanceConfig;
    if (mConfig.active && mConfig.pages) {
        let currentPath = window.location.pathname.toLowerCase();
        let pageName = currentPath.split("/").pop().replace(".html", "");
        
        if (pageName === "" || currentPath === "/") pageName = "home";
        if (pageName === "index") pageName = "home";

        const isLocked = mConfig.pages[pageName] === true;

        if (isLocked && pageName !== "maintenance") {
            const maintPath = currentPath.includes("/pages/") ? "maintenance.html" : "pages/maintenance.html";
            window.location.href = maintPath;
        }
    }
})();

// =========================================
// ADVANCED NETWORK & SIGNAL CHECKER
// =========================================
window.wasOffline = false;
function updateNetworkStatus() {
    if (navigator.onLine) {
        if (typeof showToast === 'function' && window.wasOffline) {
            showToast("Sinyal kembali stabil. Sistem terhubung.", "success");
            window.wasOffline = false;
        }
        if (window.terminalStatus) window.terminalStatus = "ONLINE";
    } else {
        if (typeof showToast === 'function') {
            showToast("Sinyal terputus! Mode Offline Aktif.", "warning");
        }
        window.wasOffline = true;
        if (window.terminalStatus) window.terminalStatus = "OFFLINE";
    }
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// =========================================
// LAYOUT RECALCULATION & FAIL-SAFE LOADER (TUGAS 1)
// =========================================
window.addEventListener('load', () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        const loader = document.getElementById('loader-wrapper');
        if (loader && loader.style.display !== 'none') {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
            if(window.renderAll && window.siteData) window.renderAll();
        }
    }, 500);
});

setTimeout(() => {
    const loader = document.getElementById('loader-wrapper');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
        if(window.renderAll && window.siteData) window.renderAll();
    }
}, 3000);

// =========================================
// ANIMATION HELPER: COUNT UP
// =========================================
window.animateCounter = (id, targetValue, duration = 2000) => {
    const element = document.getElementById(id);
    if (!element) return;

    const start = 0;
    const end = parseInt(targetValue) || 0;

    if (end === 0) {
        element.innerText = "0";
        return;
    }

    let startTime = null;

    const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeProgress * (end - start) + start);

        element.innerText = window.formatK ? window.formatK(current) : current.toLocaleString();

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.innerText = window.formatK ? window.formatK(end) : end;
        }
    };

    window.requestAnimationFrame(step);
};

// =========================================
// WELCOME POPUP SYSTEM
// =========================================
window.initWelcomePopup = () => {
    if (typeof CONFIG === 'undefined' || !CONFIG.welcomePopup || !CONFIG.welcomePopup.active) return;

    const popup = document.getElementById('welcomePopup');
    const titleEl = document.getElementById('wp-title');
    const msgEl = document.getElementById('wp-msg');
    const progEl = document.getElementById('wp-progress');

    if (!popup) return;

    if (titleEl) titleEl.innerText = CONFIG.welcomePopup.title;
    if (msgEl) msgEl.innerText = CONFIG.welcomePopup.message;

    setTimeout(() => {
        popup.classList.remove('hidden');
        popup.classList.add('welcome-active');
        if(typeof playSfx === 'function') playSfx('pop');

        const duration = CONFIG.welcomePopup.autoCloseDelay || 8000;

        if (progEl) {
            progEl.style.width = '100%';
            void progEl.offsetWidth;
            progEl.style.transition = `width ${duration}ms linear`;
            progEl.style.width = '0%';
        }

        window.welcomeTimeout = setTimeout(() => {
            window.closeWelcomePopup();
        }, duration);

    }, 1500);
};

window.closeWelcomePopup = () => {
    const popup = document.getElementById('welcomePopup');
    if (!popup) return;
    if (window.welcomeTimeout) clearTimeout(window.welcomeTimeout);

    popup.style.opacity = '0';
    popup.style.transform = 'translate(0, 20px)';
    popup.style.transition = 'all 0.3s ease';

    setTimeout(() => {
        popup.classList.add('hidden');
    }, 300);
};

// =========================================
// NOTIFICATION SYSTEM LOGIC
// =========================================
window.toggleNotifModal = () => {
    const m = document.getElementById('notifModal');
    if(!m) return;

    if(m.classList.contains('hidden')) {
        m.classList.remove('hidden');
        setTimeout(() => m.classList.add('active'), 10);
        renderNotifications();
    } else {
        m.classList.remove('active');
        setTimeout(() => m.classList.add('hidden'), 300);
    }
    if(typeof playSfx === 'function') playSfx('pop');
};

window.markNotificationsRead = () => {
    const badge = document.getElementById('notif-badge-count');
    if(badge) {
        badge.style.display = 'none';
        badge.innerText = '0';
    }
    localStorage.setItem('last_read_notif_time', new Date().toISOString());
    window.toggleNotifModal();
    if(typeof showToast === 'function') showToast("Semua notifikasi ditandai dibaca", "success");
    if(typeof playSfx === 'function') playSfx('success');
};

window.handleNotifAction = (url) => {
    if (!url) return;

    let finalUrl = url;
    if (!url.startsWith('http')) {
        if (url.startsWith('/')) url = url.substring(1);

        if (url === 'sc.html' || url === 'sc') finalUrl = '/pages/sc.html';
        else if (url === 'ai.html' || url === 'ai') finalUrl = '/pages/ai.html';
        else if (url === 'tools.html' || url === 'tools') finalUrl = '/pages/tools.html';
        else if (url === 'help.html' || url === 'help') finalUrl = '/pages/help.html';
        else if (url === 'docs.html' || url === 'docs') finalUrl = '/pages/docs.html';
        else if (url === 'index.html' || url === '') finalUrl = '/index.html';
        else if (url.includes('pages/')) finalUrl = '/' + url;
        else finalUrl = '/pages/' + url;
    }

    if (finalUrl.startsWith('http')) {
        window.open(finalUrl, '_blank');
    } else {
        window.location.href = finalUrl;
    }

    window.toggleNotifModal();
};

function renderNotifications() {
    const container = document.getElementById('notifContent');
    if(!container) return;

    const lastRead = localStorage.getItem('last_read_notif_time');
    const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);

    const safeItems = (typeof CONFIG !== 'undefined' && CONFIG.items) ? CONFIG.items : [];
    const safeUpdates = (typeof CONFIG !== 'undefined' && CONFIG.siteUpdates) ? CONFIG.siteUpdates : [];

    const scripts = safeItems.map(s => ({
        title: s.title,
        desc: "Script bot baru telah tersedia. Klik untuk detail.",
        date: s.uploadedAt,
        actionUrl: "sc.html",
        icon: "fas fa-code",
        color: "text-[#60a5fa]",
        bg: "bg-[#1e3a8a]/20",
        isNew: new Date(s.uploadedAt) > lastReadDate
    }));

    const systemUpdates = safeUpdates.map(s => ({
        title: s.title,
        desc: s.description,
        date: s.date,
        actionUrl: s.actionUrl || "",
        icon: s.type === 'feature' ? "fas fa-star" : "fas fa-info-circle",
        color: s.type === 'feature' ? "text-yellow-400" : "text-gray-400",
        bg: s.type === 'feature' ? "bg-yellow-600/10" : "bg-gray-600/10",
        isNew: new Date(s.date) > lastReadDate
    }));

    const allNotifs = [...scripts, ...systemUpdates].sort((a,b) => new Date(b.date) - new Date(a.date));

    if(allNotifs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 opacity-50">
                <i class="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
                <p class="text-xs text-gray-400">Tidak ada notifikasi.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allNotifs.map(item => {
        const cursorStyle = item.actionUrl ? "cursor-pointer hover:bg-white/5" : "cursor-default";
        const clickEvent = item.actionUrl ? `onclick="window.handleNotifAction('${item.actionUrl}')"` : "";
        const badge = item.isNew ? '<span class="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">BARU</span>' : '<span class="text-gray-600 text-[8px] font-bold">DIBACA</span>';

        return `
        <div class="flex gap-3 bg-[#0f172a] p-3 rounded-xl border border-white/5 transition-colors ${cursorStyle}" ${clickEvent}>
            <div class="w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center ${item.color} border border-white/5 shrink-0">
                <i class="${item.icon}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                    ${badge}
                    <span class="text-[8px] text-gray-500">${window.formatUploadDate ? window.formatUploadDate(item.date) : item.date}</span>
                </div>
                <h4 class="text-[#f8fafc] text-[10px] font-bold line-clamp-1 leading-tight">${item.title}</h4>
                <p class="text-[#94a3b8] text-[9px] mt-1 line-clamp-2">${item.desc}</p>
            </div>
        </div>
    `}).join('');
}

// =========================================
// QUICK MENU HANDLER
// =========================================
window.toggleQuickMenu = () => {
    const fab = document.getElementById('fabContainer');
    if (fab) {
        fab.classList.toggle('active');
        if(typeof playSfx === 'function') playSfx('pop');
    }
};

function renderQuickMenu() {
    const list = document.getElementById('quickMenuList');
    if (!list || typeof CONFIG === 'undefined' || !CONFIG.quickMenu) return;

    list.innerHTML = CONFIG.quickMenu.map(item => {
        let action = "";

        if (item.type === 'link') {
            action = `window.open('${item.action}', '_blank')`;
        } else if (item.type === 'internal') {
            let path = item.action;
            if (!path.startsWith('http') && !path.includes('pages/') && path !== '/') {
                if (path.startsWith('/')) path = '/pages' + path + '.html';
                else path = '/pages/' + path + '.html';
            }
            path = path.replace('.html.html', '.html');
            action = `window.location.href='${path}'`;
        } else if (item.type === 'function') {
            action = item.action;
        }

        const iconClass = window.getIcon ? window.getIcon(item.icon) : "fas fa-link";

        return `
        <div class="quick-menu-item" onclick="${action}; toggleQuickMenu(); playSfx('pop')">
            <div class="qm-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="qm-content">
                <div class="qm-title">${item.title}</div>
                <div class="qm-subtitle">${item.subtitle}</div>
            </div>
        </div>`;
    }).join('');
}

// =========================================
// MODAL & REVIEW UI LOGIC (WITH RESET LOGIC)
// =========================================
window.openModal = () => {
    const m = document.getElementById('revModal');
    if (m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
        window.selectedStar = 5;
        updateStarVisuals(5);

        window.selectedImageUrl = null;
        const revFile = document.getElementById('revFile');
        if(revFile) revFile.value = '';
        const imgCont = document.getElementById('imagePreviewContainer');
        if(imgCont) imgCont.style.display = 'none';

        const savedName = localStorage.getItem('user_name_v4');
        const nameInput = document.getElementById('revName');
        if(savedName && nameInput && !nameInput.value) nameInput.value = savedName;

        const savedAvatar = localStorage.getItem('user_avatar_v4');
        if(savedAvatar && !window.selectedProfileUrl) {
            window.selectedProfileUrl = savedAvatar;
            const profImg = document.getElementById('profilePreviewImg');
            const profCont = document.getElementById('profilePreviewContainer');
            if(profImg && profCont) {
                profImg.src = savedAvatar;
                profCont.style.display = 'block';
            }
        }
    }
};

window.closeModal = () => {
    const m = document.getElementById('revModal');
    if (m) {
        m.classList.add('hidden');
        m.classList.remove('flex');
    }
    window.currentParentId = null;
    window.editingId = null;

    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('submitReviewBtn');
    const txt = document.getElementById('revText');
    if(title) { title.innerText = "KIRIM ULASAN"; title.style.color = "#f8fafc"; }
    if(btn) { btn.innerText = "KIRIM"; btn.classList.remove("bg-yellow-600"); }
    if(txt) { txt.value = ""; txt.placeholder = "Tulis ulasan..."; }
};

function initReviewStars() {
    const stars = document.querySelectorAll('#starInput span');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const val = parseInt(this.getAttribute('data-v'));
            window.selectedStar = val;
            updateStarVisuals(val);
            if(typeof playSfx === 'function') playSfx('pop');
        });
    });
}

function updateStarVisuals(val) {
    document.querySelectorAll('#starInput span').forEach(s => {
        const v = parseInt(s.getAttribute('data-v'));
        if (v <= val) {
            s.style.color = '#facc15';
            s.style.transform = 'scale(1.1)';
        } else {
            s.style.color = '#374151';
            s.style.transform = 'scale(1)';
        }
    });
}

window.previewImage = (event) => {
    const file = event.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('imagePreviewImg');
            const cont = document.getElementById('imagePreviewContainer');
            if(img && cont) {
                img.src = e.target.result;
                cont.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
};

window.clearImageSelection = () => {
    document.getElementById('revFile').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
    window.selectedImageUrl = null;
};

window.previewProfileImage = (event) => {
    const file = event.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('profilePreviewImg');
            const cont = document.getElementById('profilePreviewContainer');
            if(img && cont) {
                img.src = e.target.result;
                cont.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
};

window.clearProfileSelection = () => {
    document.getElementById('revProfileFile').value = '';
    document.getElementById('profilePreviewContainer').style.display = 'none';
    window.selectedProfileUrl = null;
};

// =========================================
// UI INIT & SIDEBAR RENDER LOGIC
// =========================================
function initUI() {
    if (typeof CONFIG === 'undefined') return;

    const navBrand = document.getElementById('navBrand');
    const webSlogan = document.getElementById('webSlogan');
    const webTitle = document.getElementById('webTitle');

    if(navBrand) navBrand.innerText = CONFIG.title;
    if(webSlogan) webSlogan.innerText = CONFIG.description;

    const basePath = window.location.pathname.includes('/pages/') ? '../' : './';
    const profileImgLocal = basePath + 'assets/images/profile.jpg';
    const bgImgLocal = basePath + 'assets/images/background.jpg';

    const mainAvatar = document.getElementById('mainAvatar');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if(mainAvatar) mainAvatar.src = profileImgLocal;
    if(sidebarAvatar) sidebarAvatar.src = profileImgLocal;

    const customBg = document.getElementById('customBg');
    if(customBg) customBg.style.backgroundImage = `url('${bgImgLocal}')`;

    const buyBtn = document.getElementById('buyPanelBtn');
    if(buyBtn) buyBtn.href = CONFIG.buyPanelLink;

    const side = document.getElementById('sidebarContent');
    if (side && CONFIG.sidebarCategories) {
        let globalDelay = 0;

        side.innerHTML = CONFIG.sidebarCategories.map(cat => {
            const headerHtml = `
            <div class="sidebar-category-header reveal-on-scroll" style="transition-delay: ${globalDelay * 0.03}s; border-left-color: #60a5fa;">
                <span class="text-[10px] text-[#60a5fa] font-black uppercase tracking-widest">${cat.categoryName}</span>
            </div>`;
            globalDelay++;

            const linksHtml = cat.links.map(l => {
                const isInternal = l.link.startsWith('javascript:') || l.link.startsWith('#') || !l.link.startsWith('http');
                const targetAttr = isInternal ? '' : 'target="_blank"';
                const closeSidebarAction = "if(window.innerWidth < 768) toggleMenu();";

                const iconClass = window.getIcon ? window.getIcon(l.icon || l.name) : "fas fa-link";

                let finalLink = l.link;
                if (!l.link.startsWith('http') && !l.link.startsWith('javascript')) {
                    if (l.link === '/') {
                        finalLink = '/index.html';
                    } else if (!l.link.includes('/pages/')) {
                        finalLink = '/pages' + (l.link.startsWith('/') ? '' : '/') + l.link + '.html';
                    }
                    finalLink = finalLink.replace('.html.html', '.html');
                }

                const itemHtml = `
                <a href="${finalLink}" ${targetAttr} onclick="playSfx('pop'); ${closeSidebarAction}" class="sidebar-item flex items-center gap-4 px-6 py-3 reveal-on-scroll" style="transition-delay: ${globalDelay * 0.03}s">
                    <div class="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center border border-[#334155] shadow-inner shrink-0">
                        <i class="${iconClass} text-[#60a5fa] text-xs"></i>
                    </div>
                    <span class="text-[11px] font-bold uppercase text-[#94a3b8] tracking-wider group-hover:text-white transition-colors flex-1">${l.name}</span>
                    <i class="fas fa-chevron-right text-[8px] text-[#334155]"></i>
                </a>`;
                globalDelay++;
                return itemHtml;
            }).join('');

            return headerHtml + linksHtml;
        }).join('');
    }

    const sBox = document.getElementById('socialBox');
    if (sBox && CONFIG.socials) {
        sBox.innerHTML = CONFIG.socials.map((s, idx) => `
            <a href="${s.link}" target="_blank" onclick="playSfx('pop')" class="w-11 h-11 bg-[#1e293b] border border-[#334155] rounded-2xl flex items-center justify-center text-[#60a5fa] transition-all hover:scale-110 hover:bg-[#334155] shadow-lg reveal-on-scroll" style="transition-delay: ${idx * 0.1}s">
                <i class="${window.getIcon(s.icon || s.name)} text-lg"></i>
            </a>`).join('');
    }

    renderFooter();
    renderQuickMenu();
    initReviewStars();

    if(window.renderScripts && CONFIG.items) window.renderScripts(CONFIG.items);

    setTimeout(() => {
        if(window.initScrollReveal) window.initScrollReveal();

        const instantElements = document.querySelectorAll('.stat-box, #mainAvatar, #webTitle, #webSlogan, #socialBox a, #buyPanelBtn');
        instantElements.forEach(el => {
            el.classList.add('is-visible');
        });

        const els = document.querySelectorAll('.reveal-on-scroll');
        els.forEach(el => el.classList.add('is-visible'));
    }, 100);

    window.initWelcomePopup();
}

function renderFooter() {
    const foot = document.getElementById('mainFooter');
    if (!foot || typeof CONFIG === 'undefined') return;

    foot.innerHTML = `<div class="px-8 max-w-lg mx-auto reveal-on-scroll">
        <div class="text-center mb-10">
            <div class="pixel-font text-sm text-[#60a5fa] mb-4">${CONFIG.title}</div>
            <p class="text-[#94a3b8] text-[11px] leading-relaxed">${CONFIG.footer.description}</p>
        </div>

        <div class="grid grid-cols-2 gap-8 mb-10 border-t border-[#334155] py-10">
            <div>
                <h4 class="text-[10px] font-black text-[#f8fafc] uppercase mb-4 tracking-widest border-l-2 border-[#60a5fa] pl-2">INFO</h4>
                <div class="flex flex-col gap-3">
                    <button onclick="openFooterPage('tos'); playSfx('pop')" class="text-left text-[11px] text-[#94a3b8] font-bold uppercase hover:text-[#60a5fa] transition-colors flex items-center gap-2"><i class="fas fa-file-alt text-[9px]"></i> Syarat & Ketentuan</button>
                    <button onclick="openFooterPage('privacy'); playSfx('pop')" class="text-left text-[11px] text-[#94a3b8] font-bold uppercase hover:text-[#60a5fa] transition-colors flex items-center gap-2"><i class="fas fa-user-secret text-[9px]"></i> Kebijakan Privasi</button>
                    <button onclick="openFooterPage('about'); playSfx('pop')" class="text-left text-[11px] text-[#94a3b8] font-bold uppercase hover:text-[#60a5fa] transition-colors flex items-center gap-2"><i class="fas fa-info-circle text-[9px]"></i> Tentang Kami</button>
                </div>
            </div>
            <div>
                <h4 class="text-[10px] font-black text-[#f8fafc] uppercase mb-4 tracking-widest border-l-2 border-[#60a5fa] pl-2">IKUTI</h4>
                <div class="flex flex-wrap gap-2">
                    ${(CONFIG.socials || []).map(s => `<a href="${s.link}" target="_blank" onclick="playSfx('pop')" class="w-9 h-9 bg-[#1e293b] rounded-xl flex items-center justify-center text-sm text-[#60a5fa] hover:bg-[#334155] transition-all border border-[#334155]"><i class="${window.getIcon(s.icon || s.name)}"></i></a>`).join('')}
                </div>
            </div>
        </div>
        <div class="text-center text-[9px] text-[#475569] font-black uppercase tracking-[0.3em] opacity-70">${CONFIG.footer.copyright}</div>
    </div>`;
}

// =========================================
// ANIMATION TERMINAL
// =========================================
async function startTerminalAnimation() {
    const table = document.getElementById('terminalLines');
    const termWindow = document.querySelector('.terminal-window');

    if (!table || !termWindow) return;

    let isTerminalVisible = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isTerminalVisible = entry.isIntersecting;
        });
    }, { threshold: 0.1 });

    observer.observe(termWindow);

    const logs = [
        { t: "system.init_v2()", c: "text-[#60a5fa]" },
        { t: "connect_firebase... [OK]", c: "text-green-400" },
        { t: "loading_assets...", c: "text-purple-400" },
        { t: "security_check_pass...", c: "text-yellow-400" },
        { t: "root@server: online", c: "text-[#94a3b8]" },
        { t: "ready_to_serve...", c: "text-white" }
    ];

    let line = 1;

    while(true) {
        if(!document.getElementById('terminalLines')) {
            observer.disconnect();
            break;
        }

        if (!isTerminalVisible) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
        }

        table.innerHTML = '';
        line = 1;

        for(let log of logs) {
            if (!isTerminalVisible) break;

            const tr = document.createElement('tr');
            tr.className = 'term-row';
            tr.innerHTML = `<td class="term-num">${line++}</td><td class="term-code ${log.c}"><span class="txt"></span></td>`;
            table.appendChild(tr);

            const span = tr.querySelector('.txt');

            for(let char of log.t) {
                if (!isTerminalVisible) break;
                span.innerHTML += char;
                await new Promise(r => setTimeout(r, 30));
            }

            const termBody = document.getElementById('terminalContent');
            if(termBody) termBody.scrollTop = termBody.scrollHeight;

            await new Promise(r => setTimeout(r, 800));
        }

        if (isTerminalVisible) {
            const status = window.terminalStatus || (navigator.onLine ? "ONLINE" : "OFFLINE");
            const color = status === "ONLINE" ? "text-green-500" : "text-red-500";

            const statTr = document.createElement('tr');
            statTr.className = 'term-row';
            statTr.innerHTML = `<td class="term-num">${line++}</td><td class="term-code ${color}">Status: ${status}</td>`;
            table.appendChild(statTr);

            const termBody = document.getElementById('terminalContent');
            if(termBody) termBody.scrollTop = termBody.scrollHeight;
        }

        await new Promise(r => setTimeout(r, 4000));
    }
}

// =========================================
// ANIMATION TITLE
// =========================================
function initTypingTitle() {
    const el = document.getElementById('webTitle');
    if(!el || typeof CONFIG === 'undefined' || !CONFIG.typingWords) return;

    const words = CONFIG.typingWords;
    let wIdx = 0, cIdx = 0, isDel = false;

    function type() {
        const cur = words[wIdx];
        const txt = isDel ? cur.substring(0, cIdx--) : cur.substring(0, cIdx++);

        el.innerHTML = txt === "" ? " " : txt;

        let typeSpeed = isDel ? 60 : 120;

        if(!isDel && cIdx > cur.length) {
            isDel = true;
            typeSpeed = 2000;
        } else if(isDel && cIdx < 0) {
            isDel = false;
            wIdx = (wIdx+1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

// =========================================
// EXPORT UI ACTIONS
// =========================================
window.openFooterPage = (key) => {
    const m = document.getElementById('footerPageModal');
    const title = document.getElementById('fPageTitle');
    const content = document.getElementById('fPageContent');

    if(m && title && content && typeof CONFIG !== 'undefined' && CONFIG.footerPages[key]) {
        title.innerText = CONFIG.footerPages[key].title;
        content.innerHTML = CONFIG.footerPages[key].content;
        m.classList.add('active');
    }
    if(typeof playSfx === 'function') playSfx('pop');
};

window.closeFooterModal = () => {
    const m = document.getElementById('footerPageModal');
    if(m) m.classList.remove('active');
};

window.toggleMenu = () => {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    if(sb && ov) {
        sb.classList.toggle('active');
        ov.classList.toggle('active');
    }
    if(typeof playSfx === 'function') playSfx('pop');
};

window.onload = () => {
    initUI();
    initTypingTitle();
    startTerminalAnimation();
};
