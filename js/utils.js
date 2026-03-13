// =========================================
// FILE: js/utils.js
// =========================================

// =========================================
// ADVANCED PERFORMANCE HELPERS
// =========================================
window.throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

window.debounce = (func, delay) => {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
};

// =========================================
// FITUR SMART ICON V4
// =========================================
window.getIcon = function(input) {
    if (!input) return 'fas fa-link';
    const s = input.toLowerCase().trim();

    if (s.includes('fa-') || s.includes('fab ') || s.includes('fas ') || s.includes('far ')) {
        return input;
    }

    if (s.includes('wa') || s.includes('whats')) return 'fab fa-whatsapp';
    if (s.includes('tele') || s.includes('t.me') || s.includes('tg')) return 'fab fa-telegram-plane';
    if (s.includes('yt') || s.includes('you') || s.includes('tube')) return 'fab fa-youtube';
    if (s.includes('ig') || s.includes('insta')) return 'fab fa-instagram';
    if (s.includes('fb') || s.includes('face')) return 'fab fa-facebook-f';
    if (s.includes('mess') || s.includes('msg')) return 'fab fa-facebook-messenger';
    if (s.includes('twit') || s.includes('x') || s.includes('tweet')) return 'fab fa-twitter';
    if (s.includes('tiktok') || s.includes('tt')) return 'fab fa-tiktok';
    if (s.includes('git') || s.includes('hub')) return 'fab fa-github';
    if (s.includes('discord') || s.includes('dc')) return 'fab fa-discord';
    if (s.includes('linked') || s.includes('in')) return 'fab fa-linkedin-in';
    if (s.includes('pin') || s.includes('pinterest')) return 'fab fa-pinterest';
    if (s.includes('reddit')) return 'fab fa-reddit-alien';
    if (s.includes('skype')) return 'fab fa-skype';
    if (s.includes('slack')) return 'fab fa-slack';
    if (s.includes('stack')) return 'fab fa-stack-overflow';
    if (s.includes('steam')) return 'fab fa-steam';
    if (s.includes('twitch')) return 'fab fa-twitch';
    if (s.includes('line')) return 'fab fa-line';
    if (s.includes('snap')) return 'fab fa-snapchat-ghost';
    if (s.includes('quora')) return 'fab fa-quora';
    if (s.includes('medium')) return 'fab fa-medium';
    if (s.includes('tumblr')) return 'fab fa-tumblr';
    if (s.includes('vimeo')) return 'fab fa-vimeo-v';
    if (s.includes('threads')) return 'fas fa-at';

    if (s.includes('js') || s.includes('java') || s.includes('node')) return 'fab fa-js';
    if (s.includes('html') || s.includes('web')) return 'fab fa-html5';
    if (s.includes('css') || s.includes('style')) return 'fab fa-css3-alt';
    if (s.includes('python') || s.includes('py')) return 'fab fa-python';
    if (s.includes('php')) return 'fab fa-php';
    if (s.includes('react')) return 'fab fa-react';
    if (s.includes('vue')) return 'fab fa-vuejs';
    if (s.includes('angular')) return 'fab fa-angular';
    if (s.includes('laravel')) return 'fab fa-laravel';
    if (s.includes('bootstrap')) return 'fab fa-bootstrap';
    if (s.includes('sass') || s.includes('scss')) return 'fab fa-sass';
    if (s.includes('android') || s.includes('apk')) return 'fab fa-android';
    if (s.includes('apple') || s.includes('ios') || s.includes('mac')) return 'fab fa-apple';
    if (s.includes('windows') || s.includes('win')) return 'fab fa-windows';
    if (s.includes('linux') || s.includes('ubuntu') || s.includes('kali')) return 'fab fa-linux';
    if (s.includes('docker')) return 'fab fa-docker';
    if (s.includes('npm')) return 'fab fa-npm';
    if (s.includes('rust')) return 'fab fa-rust';
    if (s.includes('swift')) return 'fab fa-swift';

    if (s.includes('chat') || s.includes('komen')) return 'fas fa-comment';
    if (s.includes('aws') || s.includes('amazon')) return 'fab fa-aws';
    if (s.includes('google cloud') || s.includes('gcp')) return 'fab fa-google';
    if (s.includes('cloudflare')) return 'fab fa-cloudflare';
    if (s.includes('digital') || s.includes('ocean')) return 'fab fa-digital-ocean';
    if (s.includes('vercel')) return 'fas fa-triangle-exclamation';
    if (s.includes('heroku')) return 'fab fa-salesforce';
    if (s.includes('cpanel') || s.includes('host') || s.includes('domain')) return 'fas fa-cogs';
    if (s.includes('server') || s.includes('vps') || s.includes('rdp') || s.includes('ssh')) return 'fas fa-server';
    if (s.includes('database') || s.includes('sql') || s.includes('db') || s.includes('mongo')) return 'fas fa-database';

    if (s.includes('figma')) return 'fab fa-figma';
    if (s.includes('sketch')) return 'fab fa-sketch';
    if (s.includes('dribbble')) return 'fab fa-dribbble';
    if (s.includes('behance')) return 'fab fa-behance';
    if (s.includes('palette') || s.includes('color') || s.includes('art')) return 'fas fa-palette';
    if (s.includes('camera') || s.includes('foto') || s.includes('photo')) return 'fas fa-camera';
    if (s.includes('edit') || s.includes('brush') || s.includes('design')) return 'fas fa-paint-brush';
    if (s.includes('vector') || s.includes('pen')) return 'fas fa-pen-nib';

    if (s.includes('bitcoin') || s.includes('btc')) return 'fab fa-bitcoin';
    if (s.includes('eth') || s.includes('ethereum')) return 'fab fa-ethereum';
    if (s.includes('wallet') || s.includes('donasi') || s.includes('saweria') || s.includes('trakteer') || s.includes('dana') || s.includes('gopay') || s.includes('ovo') || s.includes('shopeepay')) return 'fas fa-wallet';
    if (s.includes('bank') || s.includes('transfer') || s.includes('atm') || s.includes('bca') || s.includes('bri') || s.includes('mandiri')) return 'fas fa-university';
    if (s.includes('money') || s.includes('uang') || s.includes('cash') || s.includes('dollar')) return 'fas fa-money-bill-wave';
    if (s.includes('credit') || s.includes('card') || s.includes('cc')) return 'far fa-credit-card';
    if (s.includes('paypal')) return 'fab fa-paypal';
    if (s.includes('qris')) return 'fas fa-qrcode';

    if (s.includes('user') || s.includes('profil') || s.includes('me') || s.includes('admin') || s.includes('akun') || s.includes('portfolio') || s.includes('owner')) return 'fas fa-user-circle';
    if (s.includes('group') || s.includes('grup') || s.includes('komunitas') || s.includes('team') || s.includes('family')) return 'fas fa-users';
    if (s.includes('home') || s.includes('beranda') || s.includes('dash') || s.includes('utama')) return 'fas fa-home';
    if (s.includes('about') || s.includes('tentang') || s.includes('bio') || s.includes('info')) return 'fas fa-info-circle';
    if (s.includes('contact') || s.includes('kontak') || s.includes('hubungi') || s.includes('call')) return 'fas fa-address-book';
    if (s.includes('map') || s.includes('lokasi') || s.includes('loc') || s.includes('alamat')) return 'fas fa-map-marker-alt';
    if (s.includes('login') || s.includes('masuk') || s.includes('sign in')) return 'fas fa-sign-in-alt';
    if (s.includes('logout') || s.includes('keluar') || s.includes('sign out')) return 'fas fa-sign-out-alt';
    if (s.includes('set') || s.includes('atur') || s.includes('config') || s.includes('preference')) return 'fas fa-cog';
    if (s.includes('shop') || s.includes('store') || s.includes('jual') || s.includes('belanja') || s.includes('toko') || s.includes('cart') || s.includes('market')) return 'fas fa-shopping-cart';
    if (s.includes('price') || s.includes('harga') || s.includes('list') || s.includes('tag') || s.includes('pricelist')) return 'fas fa-tags';
    if (s.includes('brief') || s.includes('port') || s.includes('cv') || s.includes('job') || s.includes('kerja') || s.includes('hire')) return 'fas fa-briefcase';
    if (s.includes('stat') || s.includes('anal') || s.includes('chart') || s.includes('graph')) return 'fas fa-chart-line';
    if (s.includes('topup') || s.includes('diamond')) return 'fas fa-gem';
    if (s.includes('premium') || s.includes('pro')) return 'fas fa-star';

    if (s.includes('image') || s.includes('img') || s.includes('pic') || s.includes('galeri')) return 'fas fa-image';
    if (s.includes('video') || s.includes('vid') || s.includes('film') || s.includes('movie')) return 'fas fa-video';
    if (s.includes('music') || s.includes('audio') || s.includes('mp3') || s.includes('song') || s.includes('sound')) return 'fas fa-music';
    if (s.includes('file') || s.includes('doc') || s.includes('pdf') || s.includes('txt') || s.includes('archive') || s.includes('zip') || s.includes('rar')) return 'fas fa-file-alt';
    if (s.includes('download') || s.includes('unduh') || s.includes('get') || s.includes('ambil')) return 'fas fa-download';
    if (s.includes('upload') || s.includes('unggah') || s.includes('post')) return 'fas fa-upload';
    if (s.includes('link') || s.includes('url') || s.includes('tautan') || s.includes('web')) return 'fas fa-link';
    if (s.includes('ai') || s.includes('chatai')) return 'fas fa-robot';
    if (s.includes('code') || s.includes('script') || s.includes('bot') || s.includes('source') || s.includes('sc') || s.includes('coding')) return 'fas fa-code';
    if (s.includes('term') || s.includes('shell') || s.includes('cmd') || s.includes('cli')) return 'fas fa-terminal';

    if (s.includes('bug') || s.includes('error') || s.includes('fix') || s.includes('report')) return 'fas fa-bug';
    if (s.includes('lock') || s.includes('kunci') || s.includes('secure') || s.includes('private')) return 'fas fa-lock';
    if (s.includes('api') || s.includes('key') || s.includes('token')) return 'fas fa-key';
    if (s.includes('rocket') || s.includes('boost') || s.includes('panel') || s.includes('laju') || s.includes('speed')) return 'fas fa-rocket';
    if (s.includes('star') || s.includes('favorite') || s.includes('fav') || s.includes('testi') || s.includes('rate')) return 'fas fa-star';
    if (s.includes('heart') || s.includes('love') || s.includes('cinta') || s.includes('like')) return 'fas fa-heart';
    if (s.includes('edit') || s.includes('ubah') || s.includes('update')) return 'fas fa-edit';
    if (s.includes('delete') || s.includes('hapus') || s.includes('trash') || s.includes('remove')) return 'fas fa-trash-alt';
    if (s.includes('share') || s.includes('bagi') || s.includes('bagikan')) return 'fas fa-share-alt';
    if (s.includes('search') || s.includes('cari') || s.includes('find')) return 'fas fa-search';
    if (s.includes('bell') || s.includes('notif') || s.includes('lonceng')) return 'fas fa-bell';
    if (s.includes('calendar') || s.includes('date') || s.includes('tgl') || s.includes('jadwal')) return 'fas fa-calendar-alt';
    if (s.includes('clock') || s.includes('time') || s.includes('jam') || s.includes('waktu')) return 'fas fa-clock';
    if (s.includes('check') || s.includes('done') || s.includes('ok') || s.includes('success')) return 'fas fa-check-circle';
    if (s.includes('question') || s.includes('help') || s.includes('bantuan') || s.includes('faq')) return 'fas fa-question-circle';
    if (s.includes('warn') || s.includes('alert') || s.includes('info') || s.includes('perhatian')) return 'fas fa-exclamation-circle';
    if (s.includes('crown') || s.includes('king') || s.includes('vip') || s.includes('owner')) return 'fas fa-crown';
    if (s.includes('game') || s.includes('play') || s.includes('main')) return 'fas fa-gamepad';
    if (s.includes('fire') || s.includes('hot') || s.includes('viral')) return 'fas fa-fire';
    if (s.includes('medal') || s.includes('badge') || s.includes('achievement')) return 'fas fa-medal';
    if (s.includes('trophy') || s.includes('piala') || s.includes('winner')) return 'fas fa-trophy';
    if (s.includes('gift') || s.includes('hadiah') || s.includes('giveaway')) return 'fas fa-gift';

    return 'fas fa-link';
};

// =========================================
// AUDIO & TOAST NOTIFICATION
// =========================================
window.playSfx = (type) => {
    const sound = document.getElementById(type === 'success' ? 'sound-success' : 'sound-pop');
    if (sound) {
        sound.currentTime = 0;
        sound.volume = 0.5;
        sound.play().catch(() => {});
    }
};

window.showToast = (msg, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    const icon = type === 'success' ? 'fa-check' : (type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info');
    const colorClass = type === 'success' ? 'text-green-500' : (type === 'warning' ? 'text-yellow-500' : 'text-blue-500');

    toast.innerHTML = `
        <div class="toast-icon ${colorClass}"><i class="fas ${icon}"></i></div>
        <div class="toast-msg">${msg}</div>
    `;

    container.appendChild(toast);

    void toast.offsetWidth;

    setTimeout(() => toast.classList.add('show'), 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

// =========================================
// FORMATTERS
// =========================================
window.formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} • ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

window.formatUploadDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

window.formatK = (num) => {
    if (!num) return "0";
    return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.abs(num);
};

// =========================================
// CLOUDINARY UPLOAD HANDLER
// =========================================
window.uploadToCloudinary = async (file) => {
    if (!navigator.onLine) {
        if(typeof showToast === 'function') showToast("Sistem Offline: Gagal mengunggah gambar", "warning");
        return null;
    }

    if (typeof CONFIG === 'undefined' || !CONFIG.cloudinary) {
        if(typeof showToast === 'function') showToast("Config Cloudinary Hilang!", "error");
        return null;
    }

    const CLOUD_NAME = CONFIG.cloudinary.cloudName;
    const UPLOAD_PRESET = CONFIG.cloudinary.uploadPreset;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'user_reviews');

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Upload gagal');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (err) {
        console.error("Cloudinary Error:", err);
        return null;
    }
};

// =========================================
// UI UTILITIES (SCROLL & LIGHTBOX)
// =========================================
let isScrollThrottled = false;

window.updateScrollDots = (cId, dId) => {
    if (isScrollThrottled) return;
    isScrollThrottled = true;

    window.requestAnimationFrame(() => {
        const list = document.getElementById(cId);
        const dots = document.getElementById(dId);

        if (list && dots) {
            const scrollLeft = list.scrollLeft;
            const width = list.clientWidth;

            if (width > 0) {
                const active = Math.round(scrollLeft / width);
                const count = Math.ceil(list.scrollWidth / width);

                let dotHtml = '';
                for (let i = 0; i < count; i++) {
                    dotHtml += `<div class="dot-item ${i === active ? 'active' : ''}"></div>`;
                }

                if (dots.innerHTML !== dotHtml) {
                    dots.innerHTML = dotHtml;
                }
            }
        }
        setTimeout(() => { isScrollThrottled = false; }, 100);
    });
};

window.openLightbox = (url) => {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    if (lb && img) {
        img.src = url;
        lb.classList.add('active');
        if(typeof playSfx === 'function') playSfx('pop');
    }
};

window.closeLightbox = () => {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('active');
};
