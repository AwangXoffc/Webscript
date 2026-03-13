// =========================================
// FILE: js/awang1.js
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase,
    ref,
    onValue,
    update,
    increment,
    get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
    getMessaging,
    getToken
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// =========================================
// ONESIGNAL INIT
// =========================================
window.OneSignal = window.OneSignal || [];
OneSignal.push(function() {
    if(CONFIG.oneSignal && CONFIG.oneSignal.appId) {
        OneSignal.init({
            appId: CONFIG.oneSignal.appId
        });
        const userUID = localStorage.getItem('user_uid_v4');
        if (userUID) {
            OneSignal.setExternalUserId(userUID);
        }
    }
});

// =========================================
// FIREBASE INIT
// =========================================
const firebaseConfig = CONFIG.firebase;
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messaging = getMessaging(app);
const dbRef = ref(db, 'siteDataV4');

window.db = db;
window.dbRef = dbRef;
window.messaging = messaging;
window.getToken = getToken;
window.increment = increment;
window.update = update;

// =========================================
// GLOBAL STATE MANAGEMENT
// =========================================
window.siteData = {
    comments: [],
    totalLikes: 0,
    visitorCount: 0,
    scriptLikes: {},
    scriptDownloads: {},
    dislikes: {}
};

window.selectedStar = 5;
window.editingId = null;
window.currentParentId = null;
window.selectedImageUrl = null;
window.selectedProfileUrl = localStorage.getItem('user_avatar_v4') || null;

window.currentScriptPage = 0;
window.SCRIPTS_PER_PAGE = 5;
window.currentFilteredScripts = null;

window.visibleCommentLimit = 5;
window.openReplyIds = new Set();
window.isLoadingComments = false;
window.hasMoreComments = false;
window.isInitialStatLoaded = false;
window.isInitialLoadDone = false;
window.isScriptRendered = false;

const BAD_WORDS = [
    "anjing", "bangsat", "kontol", "memek", "asuh", "goblok", "tolol",
    "bajingan", "kntll", "kntl", "mmk", "meki", "mmek", "anjingg",
    "anj", "anjj", "asu", "gblk", "puki", "fefek", "bgst", "kntol",
    "memk", "ngentot", "babi"
];

// =========================================
// USER AUTHENTICATION
// =========================================
if (!localStorage.getItem('user_uid_v4')) {
    const newUid = 'uid_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_uid_v4', newUid);
}

window.USER_UID = localStorage.getItem('user_uid_v4');
window.ADMIN_UID = CONFIG.admin.uid;

// =========================================
// CACHE & NETWORK HANDLING
// =========================================
const cachedData = localStorage.getItem('awang_site_cache');
if (cachedData) {
    try {
        window.siteData = JSON.parse(cachedData);
        setTimeout(() => {
            if (typeof window.renderAll === 'function') window.renderAll();
            if (window.siteData.comments) window.renderCommentsPreservingState();
        }, 50);
    } catch(e) {
        console.error("Cache Parse Error", e);
    }
}

// =========================================
// LOGIC RENDER STATISTIK
// =========================================
window.renderAll = function() {
    requestAnimationFrame(() => {
        let comms = window.siteData.comments || [];
        if (!Array.isArray(comms)) comms = Object.values(comms);

        const totalCommLikes = comms.reduce((sum, c) => sum + (c.likes || 0), 0);
        const visitorVal = window.siteData.visitorCount || 0;
        const scriptCount = CONFIG.items ? CONFIG.items.length : 0;

        if (!window.isInitialStatLoaded && window.animateCounter) {
            window.animateCounter('statUsers', visitorVal);
            window.animateCounter('statLikes', totalCommLikes);
            window.animateCounter('statScripts', scriptCount);
            window.isInitialStatLoaded = true;
        } else {
            const elUser = document.getElementById('statUsers');
            const elLikes = document.getElementById('statLikes');
            const elScript = document.getElementById('statScripts');

            if(elUser) elUser.innerText = window.formatK(visitorVal);
            if(elLikes) elLikes.innerText = window.formatK(totalCommLikes);
            if(elScript) elScript.innerText = scriptCount;
        }

        const avg = comms.length ? (comms.reduce((a, b) => a + (b.star || 0), 0) / comms.length).toFixed(1) : "0.0";
        const elRating = document.getElementById('statRating');
        const elBigRating = document.getElementById('bigRating');
        const elRevCount = document.getElementById('reviewCountText');

        if(elRating) elRating.innerText = avg;
        if(elBigRating) elBigRating.innerText = avg;
        if(elRevCount) elRevCount.innerText = `${comms.length} REVIEWS`;

        renderRatingBars(comms);
        checkNewSystemUpdates();
    });
};

function checkNewSystemUpdates() {
    const scripts = CONFIG.items || [];
    const siteUpdates = CONFIG.siteUpdates || [];
    const now = new Date();

    const newScriptsCount = scripts.filter(s => {
        const upDate = new Date(s.uploadedAt);
        const diffTime = Math.abs(now - upDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 3;
    }).length;

    const newSiteInfoCount = siteUpdates.filter(s => {
        const upDate = new Date(s.date);
        const diffTime = Math.abs(now - upDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 3;
    }).length;

    const totalNew = newScriptsCount + newSiteInfoCount;
    const notifBadge = document.getElementById('notif-badge-count');

    if(notifBadge) {
        if(totalNew > 0) {
            notifBadge.innerText = totalNew;
            notifBadge.style.display = 'flex';
        } else {
            notifBadge.style.display = 'none';
        }
    }
}

function renderRatingBars(comms) {
    const container = document.getElementById('ratingBarsContainer');
    if(!container) return;

    const total = comms.length || 1;
    let html = '';
    for (let i = 5; i >= 1; i--) {
        const count = comms.filter(c => i === c.star).length;
        const perc = (count / total) * 100;
        html += `<div class="flex items-center gap-3"><span class="text-[10px] font-bold w-2 text-[#60a5fa]">${i}</span><div class="rating-bar-bg" style="background: #1e293b;"><div class="rating-bar-fill" style="width: ${perc}%; background: #60a5fa;"></div></div></div>`;
    }
    container.innerHTML = html;
}

// =========================================
// SYSTEM KOMENTAR & FORMATTER
// =========================================
window.renderCommentsPreservingState = () => {
    const container = document.getElementById('commentList');
    if(!container) return;

    let data = window.siteData.comments || [];
    if (!Array.isArray(data)) data = Object.values(data);

    if(data.length === 0) {
         container.innerHTML = `<div class="text-center py-10 text-gray-600 text-xs italic">Belum ada ulasan. Jadilah yang pertama!</div>`;
         const saContainer = document.getElementById('showAllContainer');
         if(saContainer) saContainer.classList.add('hidden');
         return;
    }

    let mainComments = data.filter(c => !c.parentId);

    mainComments.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    window.hasMoreComments = mainComments.length > window.visibleCommentLimit;
    const commentsToRender = mainComments.slice(0, window.visibleCommentLimit);

    let html = commentsToRender.map(c => window.createSingleCommentHTML(c, false)).join('');
    container.innerHTML = html;

    commentsToRender.forEach(c => {
        const relevantReps = data.filter(r => r.parentId === c.id)
            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const toggleDiv = document.getElementById(`reply-toggle-${c.id}`);
        if(toggleDiv && relevantReps.length > 0) {
            toggleDiv.innerHTML = `
            <div class="reply-toggle-btn" onclick="toggleReplies('${c.id}')" style="color: #60a5fa; border-color: rgba(96, 165, 250, 0.3);">
                <i class="fas ${window.openReplyIds.has(c.id) ? 'fa-caret-up' : 'fa-caret-down'}"></i> ${relevantReps.length} Balasan
            </div>`;
        }

        const replyContainer = document.getElementById(`replies-${c.id}`);
        if(replyContainer && relevantReps.length > 0) {
            replyContainer.innerHTML = relevantReps.map(r => window.createSingleCommentHTML(r, true)).join('');
            if (window.openReplyIds.has(c.id)) {
                replyContainer.classList.remove('hidden');
            }
        }
    });

    updatePaginationUI();
};

window.fetchFirstPage = async () => {
    window.isLoadingComments = true;
    window.visibleCommentLimit = 5;

    try {
        const snapshot = await get(ref(db, 'siteDataV4/comments'));
        if (snapshot.exists()) {
            let d = snapshot.val();
            if (!Array.isArray(d)) d = Object.values(d);
            window.siteData.comments = d;
        }
    } catch(e) {
        console.error("Fetch Error", e);
        if (!navigator.onLine && typeof showToast === 'function') {
            showToast("Offline: Menggunakan data tersimpan", "warning");
        }
    }

    window.renderCommentsPreservingState();
    window.isLoadingComments = false;
};

window.fetchNextComments = () => {
    if (window.isLoadingComments) return;
    window.isLoadingComments = true;
    window.visibleCommentLimit += 5;
    window.renderCommentsPreservingState();
    window.isLoadingComments = false;
    if(typeof playSfx === 'function') playSfx('pop');
};

function updatePaginationUI() {
    const btn = document.getElementById('toggleCommentsBtn');
    const hideBtn = document.getElementById('hideCommentsBtn');
    const container = document.getElementById('showAllContainer');
    if(!container) return;

    if (window.hasMoreComments || window.visibleCommentLimit > 5) {
        container.classList.remove('hidden');

        if (!window.hasMoreComments) {
            if(btn) btn.classList.add('hidden');
        } else {
            if(btn) {
                btn.classList.remove('hidden');
                btn.className = "w-full bg-[#1e293b] border border-[#334155] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#60a5fa] hover:bg-[#334155] transition-all btn-3d";
            }
        }

        if (window.visibleCommentLimit > 5) {
            if(hideBtn) hideBtn.classList.remove('hidden');
        } else {
            if(hideBtn) hideBtn.classList.add('hidden');
        }
    } else {
        container.classList.add('hidden');
    }
}

window.resetPagination = () => {
    window.visibleCommentLimit = 5;
    window.renderCommentsPreservingState();
    document.getElementById('communitySection').scrollIntoView({ behavior: 'smooth' });
};

window.formatCommentText = (text) => {
    if(!text) return "";
    let formatted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    formatted = formatted.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, function(url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: none; border-bottom: 1px solid rgba(96, 165, 250, 0.3); word-break: break-word;">${url}</a>`;
    });
    formatted = formatted.replace(/@([a-zA-Z0-9_.-]+)/g, '<span class="mention-tag" style="color: #60a5fa; background: rgba(96, 165, 250, 0.1); border-color: rgba(96, 165, 250, 0.3); padding: 2px 6px; border-radius: 4px; margin-right: 4px; margin-left: 2px; font-weight: 700;">@$1</span>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
};

window.createSingleCommentHTML = (c, isReply = false) => {
    const myInteractions = JSON.parse(localStorage.getItem('my_ints_v4') || '{}');
    const isCommentDeveloper = (c.uid === window.ADMIN_UID);
    const isMyComment = (c.uid === window.USER_UID);
    const isViewerAdmin = (window.USER_UID === window.ADMIN_UID);
    const userInt = myInteractions[c.id];
    
    const existingElement = document.getElementById(`comment-${c.id}`);
    const animationStyle = existingElement ? "" : "animation: smooth-appear 0.6s ease backwards;";

    const avatarStyle = c.userAvatar ? `background-image: url('${c.userAvatar}'); background-size: cover; border: none;` : '';
    const avatarContent = c.userAvatar ? '' : (c.name ? c.name.charAt(0).toUpperCase() : '?');
    const formattedText = window.formatCommentText(c.text);

    let stars = '';
    const starCount = c.star || 0;

    if (starCount > 0) {
        for(let i=1; i<=5; i++) {
            stars += `<i class="fas fa-star text-[8px] ${i <= starCount ? 'text-yellow-400' : 'text-gray-700'}"></i>`;
        }
    }

    const pfx = isReply ? 'rep' : 'cnt';
    const nameColorClass = isCommentDeveloper ? 'text-[#60a5fa]' : 'text-gray-400';
    const editedBadge = `<span style="font-size: 7px; background: #1e293b; color: #94a3b8; padding: 1px 4px; border-radius: 3px; border: 1px solid #334155; font-weight: 700; text-transform: uppercase; margin-left: 6px; vertical-align: middle;">EDITED</span>`;

    const menuHTML = `
    <div class="${isReply ? 'reply-menu-container' : 'comment-menu-container'}">
        <div class="dot-menu-btn" onclick="toggleCommentMenu('${c.id}')"><i class="fas fa-ellipsis-v text-[10px]"></i></div>
        <div class="dropdown-menu" id="menu-${c.id}">
            ${isMyComment ? `<div class="dropdown-item" onclick="editComment('${c.id}')"><i class="fas fa-edit"></i> Edit</div>` : ''}
            ${isViewerAdmin ? `<div class="dropdown-item" onclick="loveComment('${c.id}')"><i class="fas fa-heart text-red-500"></i> ${c.adminLoved ? 'Unlove' : 'Love'}</div>` : ''}
            ${(!isReply && isViewerAdmin) ? `<div class="dropdown-item" onclick="pinComment('${c.id}')"><i class="fas fa-thumbtack text-[#60a5fa]"></i> ${c.isPinned ? 'Lepas Semat' : 'Sematkan'}</div>` : ''}
            ${(isMyComment || isViewerAdmin) ? `<div class="dropdown-item danger" onclick="deleteComment('${c.id}')"><i class="fas fa-trash-alt"></i> Hapus</div>` : ''}
            <div class="dropdown-item" onclick="showToast('Laporan Terkirim', 'info')"><i class="fas fa-flag"></i> Lapor</div>
        </div>
    </div>`;

    if(isReply) {
        return `
        <div class="reply-item flex gap-3 mb-2 relative" id="comment-${c.id}" style="${animationStyle}">
            <div class="avatar-container">
                <div class="avatar-img flex items-center justify-center text-white font-black text-sm" style="${avatarStyle}; ${c.userAvatar ? '' : 'border-color: #60a5fa;'}">
                    ${avatarContent}
                </div>
                ${c.adminLoved ? `<div class="admin-love-badge" style="width:16px; height:16px; bottom:-2px; right:-2px;"><i class="fas fa-heart" style="font-size:8px;"></i></div>` : ''}
            </div>
            <div class="bg-white/5 p-3 rounded-2xl flex-1 border border-white/5">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[11px] font-black flex items-center ${nameColorClass}">
                        ${c.name} ${isCommentDeveloper ? '<span class="dev-badge" style="background: #1e3a8a;">Developer</span>' : ''}
                    </span>
                    <div class="flex items-center">
                        ${c.isEdited ? editedBadge : ''}
                        <span class="text-[7px] timestamp-text uppercase font-bold ml-2" style="color: #64748b;">${window.formatDate(c.timestamp)}</span>
                    </div>
                </div>
                ${starCount > 0 ? `<div class="flex items-center mb-1 gap-0.5">${stars}</div>` : ''}
                <p class="text-[12px] text-gray-300 mb-2 pr-2 leading-relaxed" style="word-wrap: break-word;">${formattedText}</p>
                ${c.imageUrl ? `<img src="${c.imageUrl}" onclick="openLightbox('${c.imageUrl}')" class="comment-image mb-3">` : ''}
                <div class="flex gap-4 items-center mt-2">
                    <button id="btn-like-${c.id}" onclick="handleEngagement('${c.id}', 'like', '${pfx}-like-${c.id}')" class="text-[10px] font-black ${userInt === 'like' ? 'text-[#60a5fa]' : 'text-gray-500'}"><i class="${userInt === 'like' ? 'fas' : 'far'} fa-thumbs-up"></i> <span id="${pfx}-like-${c.id}">${c.likes || 0}</span></button>
                    <button id="btn-dislike-${c.id}" onclick="handleEngagement('${c.id}', 'dislike', '${pfx}-dislike-${c.id}')" class="text-[10px] font-black ${userInt === 'dislike' ? 'text-red-400' : 'text-gray-500'}"><i class="${userInt === 'dislike' ? 'fas' : 'far'} fa-thumbs-down"></i> <span id="${pfx}-dislike-${c.id}">${c.dislikes || 0}</span></button>
                    <button onclick="replyComment('${c.parentId}', '${c.name.replace(/\s+/g, '')}')" class="text-[9px] text-gray-400 font-black uppercase hover:text-white">Balas</button>
                </div>
            </div>
            ${menuHTML}
        </div>`;
    } else {
        const pinnedBadge = c.isPinned ? `<div class="pinned-badge" style="color: #FFFFFF; font-size: 10px; margin-bottom: 6px; font-weight: 800; display: flex; align-items: center; gap: 5px;"><i class="fas fa-thumbtack transform rotate-45"></i> Disematkan oleh @Awang</div>` : '';

        return `
        <div class="comment-wrapper" id="comment-${c.id}" style="${animationStyle}">
            <div class="comment-main">
                <div class="avatar-container">
                    <div class="avatar-img flex items-center justify-center text-white font-black text-sm" style="${avatarStyle}; border-color: #60a5fa;">
                        ${avatarContent}
                    </div>
                    ${c.adminLoved ? `<div class="admin-love-badge"><i class="fas fa-heart"></i></div>` : ''}
                </div>
                <div class="flex-1">
                    ${pinnedBadge}
                    <div class="flex items-center justify-between mb-0.5">
                        <span class="font-black text-xs flex items-center ${isCommentDeveloper ? 'text-[#60a5fa]' : 'text-gray-200'}">
                            ${c.name} ${isCommentDeveloper ? '<span class="dev-badge" style="background: #1e3a8a;">Developer</span>' : ''}
                        </span>
                        <div class="flex items-center">
                             ${c.isEdited ? editedBadge : ''}
                             <span class="text-[8px] timestamp-text font-bold uppercase tracking-tighter ml-2" style="color: #64748b;">${window.formatDate(c.timestamp)}</span>
                        </div>
                    </div>
                    <div class="flex items-center mb-2 gap-0.5">${stars}</div>
                    <p class="text-gray-300 text-[12px] home-snug mb-2 pr-4 leading-relaxed">${formattedText}</p>
                    ${c.imageUrl ? `<img src="${c.imageUrl}" onclick="openLightbox('${c.imageUrl}')" class="comment-image mb-3">` : ''}
                    <div class="flex items-center gap-5">
                        <button id="btn-like-${c.id}" onclick="handleEngagement('${c.id}', 'like', '${pfx}-like-${c.id}')" class="eng-btn flex items-center gap-1.5 text-[10px] font-black ${userInt === 'like' ? 'text-[#60a5fa]' : 'text-gray-500'}">
                            <i class="${userInt === 'like' ? 'fas' : 'far'} fa-thumbs-up"></i> <span id="${pfx}-like-${c.id}">${c.likes || 0}</span>
                        </button>
                        <button id="btn-dislike-${c.id}" onclick="handleEngagement('${c.id}', 'dislike', '${pfx}-dislike-${c.id}')" class="eng-btn flex items-center gap-1.5 text-[10px] font-black ${userInt === 'dislike' ? 'text-red-400' : 'text-gray-500'}">
                            <i class="${userInt === 'dislike' ? 'fas' : 'far'} fa-thumbs-down"></i> <span id="${pfx}-dislike-${c.id}">${c.dislikes || 0}</span>
                        </button>
                        <button onclick="replyComment('${c.id}', '${c.name.replace(/\s+/g, '')}')" class="eng-btn text-gray-400 text-[10px] font-black uppercase hover:text-white">Balas</button>
                    </div>
                </div>
            </div>
            ${menuHTML}
            <div id="reply-toggle-${c.id}"></div>
            <div id="replies-${c.id}" class="reply-section hidden" style="border-left-color: #334155;"></div>
        </div>`;
    }
};

window.postReview = async () => {
    const nameInput = document.getElementById('revName').value.trim();
    const textInput = document.getElementById('revText').value.trim();
    const hpValue = document.getElementById('hp_user_check').value;
    const fileInput = document.getElementById('revFile');
    const profileFileInput = document.getElementById('revProfileFile');
    const imageFile = fileInput.files[0];
    const profileFile = profileFileInput.files[0];

    if (hpValue !== "") return;

    if(!textInput || textInput.length < 1) {
        if(typeof showToast === 'function') showToast("Mohon isi pesan!", "info");
        return;
    }

    if (BAD_WORDS.some(word => textInput.toLowerCase().includes(word))) {
        if(typeof showToast === 'function') showToast("Kata kasar terdeteksi!", "info");
        return;
    }

    if (!navigator.onLine) {
        if(typeof showToast === 'function') showToast("Koneksi terputus! Tidak dapat mengirim.", "warning");
        return;
    }

    const submitBtn = document.getElementById('submitReviewBtn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "SENDING...";
    submitBtn.disabled = true;

    try {
        let finalImageUrl = window.selectedImageUrl;
        let finalProfileUrl = window.selectedProfileUrl;

        if (profileFile) {
            if(typeof showToast === 'function') showToast("Mengunggah profil...", "info");
            const uploadedProf = await window.uploadToCloudinary(profileFile);
            if (uploadedProf) finalProfileUrl = uploadedProf;
        }
        if (imageFile) {
            if(typeof showToast === 'function') showToast("Mengunggah gambar...", "info");
            finalImageUrl = await window.uploadToCloudinary(imageFile);
            if (!finalImageUrl) throw new Error("Gagal mengunggah gambar.");
        }

        const name = nameInput || localStorage.getItem('user_name_v4') || "User_" + Math.floor(Math.random() * 999);
        localStorage.setItem('user_name_v4', name);
        if (finalProfileUrl) {
            localStorage.setItem('user_avatar_v4', finalProfileUrl);
            window.selectedProfileUrl = finalProfileUrl;
        }

        let currentData = window.siteData.comments || [];
        if (!Array.isArray(currentData)) {
            currentData = Object.values(currentData);
        }

        let updated = [...currentData];

        if(window.editingId) {
            updated = updated.map(c => c.id === window.editingId ? {
                ...c,
                name: name,
                text: textInput,
                star: window.selectedStar,
                imageUrl: finalImageUrl || c.imageUrl || null,
                userAvatar: finalProfileUrl || c.userAvatar || null,
                isEdited: true
            } : c);
            if(typeof showToast === 'function') showToast("Ulasan diperbarui!", "success");
        } else {
            const now = new Date();
            const newId = 'rev_' + now.getTime();
            const newCommentObj = {
                id: newId, uid: window.USER_UID, parentId: window.currentParentId || null,
                name: name, text: textInput, imageUrl: finalImageUrl || null, userAvatar: finalProfileUrl || null,
                star: window.currentParentId ? 5 : window.selectedStar,
                likes: 0, dislikes: 0, adminLoved: false, isPinned: false, isEdited: false,
                timestamp: now.toISOString()
            };
            updated.push(newCommentObj);

            let targetUserUID = null;
            if (window.currentParentId) {
                const parentComment = currentData.find(c => c.id === window.currentParentId);
                if (parentComment) targetUserUID = parentComment.uid;
            }
            if(CONFIG.oneSignal && CONFIG.oneSignal.appId) {
                const appId = CONFIG.oneSignal.appId;
                const apiKey = CONFIG.oneSignal.restApiKey;
                let notificationTarget = targetUserUID && targetUserUID !== window.USER_UID
                    ? { "include_external_user_ids": [targetUserUID] }
                    : { "included_segments": ["Total Subscriptions"] };

                fetch("https://onesignal.com/api/v1_1/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=utf-8", "Authorization": "Basic " + apiKey },
                    body: JSON.stringify({
                        app_id: appId, ...notificationTarget,
                        headings: {"en": window.currentParentId ? `Balasan dari ${name}` : `Ulasan Baru: ${name}`},
                        contents: {"en": textInput.substring(0, 80)},
                        url: window.location.href
                    })
                }).catch(e => console.error("Notif failed", e));
            }
            if(typeof showToast === 'function') showToast("Berhasil terkirim", "success");
        }

        await update(dbRef, { comments: updated });

        // RESET STATE AFTER POST
        window.editingId = null;
        window.currentParentId = null;
        if(window.closeModal) window.closeModal();

        submitBtn.innerText = "Kirim";
        submitBtn.classList.remove("bg-yellow-600");
        const modalTitle = document.getElementById('modalTitle');
        if(modalTitle) { modalTitle.innerText = "KIRIM ULASAN"; modalTitle.style.color = "#f8fafc"; }
        if(typeof playSfx === 'function') playSfx('success');

    } catch (error) {
        console.error("Submission Error:", error);
        if(typeof showToast === 'function') showToast(error.message || "Gagal", "info");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
};

onValue(window.dbRef, (snap) => {
    try {
        const loader = document.getElementById('loader-wrapper');
        const isScPage = window.location.pathname.includes('sc.html') || window.location.href.includes('/sc');

        if(snap.exists()) {
            const val = snap.val();

            let comms = val.comments || [];
            if(!Array.isArray(comms)) comms = Object.values(comms);

            window.siteData.comments = comms;
            window.siteData.scriptDownloads = val.scriptDownloads || {};
            window.siteData.scriptLikes = val.scriptLikes || {};
            window.siteData.visitorCount = val.visitorCount || 0;

            localStorage.setItem('awang_site_cache', JSON.stringify(window.siteData));
        }

        if(window.renderAll) window.renderAll();

        if (!isScPage) {
            if (!window.isInitialLoadDone) {
                window.fetchFirstPage();
                window.isInitialLoadDone = true;
            } else {
                window.renderCommentsPreservingState();
            }
        }

        if (typeof window.renderScripts === 'function' && !document.getElementById('scriptSearch').value) {
            if (window.isScriptRendered && typeof window.updateOnlyScriptStats === 'function') {
                window.updateOnlyScriptStats();
            } else {
                requestAnimationFrame(() => {
                    if (CONFIG.items) window.renderScripts(CONFIG.items);
                    window.isScriptRendered = true;
                });
            }
        }

        if (isScPage) {
            if(loader) loader.style.display = 'none';
        } else {
            setTimeout(() => {
                if(loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.style.display = 'none', 500);
                }
            }, 500);
        }

    } catch (err) {
        console.error(err);
        const ldr = document.getElementById('loader-wrapper');
        if(ldr) ldr.style.display = 'none';
    }
}, (error) => {
    document.getElementById('loader-wrapper').style.display = 'none';
    if (!navigator.onLine) {
        if(typeof showToast === 'function') showToast("Offline: Gagal sinkronisasi data", "warning");
    } else {
        if(typeof showToast === 'function') showToast("Gagal memuat data", "info");
    }
});
