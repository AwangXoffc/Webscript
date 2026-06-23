import {
    onValue,
    update,
    increment,
    ref,
    get,
    remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
    getToken
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

window.toggleCommentMenu = (id) => {
    if (event) event.stopPropagation();
    const targetMenu = document.getElementById(`menu-${id}`);
    const allMenus = document.querySelectorAll('.dropdown-menu');

    allMenus.forEach(m => {
        if (m.id !== `menu-${id}`) m.classList.remove('active');
    });
    if (targetMenu) {
        targetMenu.classList.toggle('active');
        if(typeof playSfx === 'function') playSfx('pop');
    }
};

window.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
});

window.deleteComment = (id) => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
    Swal.fire({
        html: `
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa]"></div>
            <h3 class="text-xl font-black text-center mt-4 mb-4 uppercase text-[#f8fafc] tracking-wide">Hapus Ulasan?</h3>
            <p class="text-sm text-gray-400 mb-6 font-medium">Data yang dihapus tidak bisa dikembalikan!</p>
        `,
        showCancelButton: true,
        confirmButtonText: 'HAPUS',
        cancelButtonText: 'BATAL',
        buttonsStyling: false,
        background: '#0f172a',
        customClass: {
            popup: 'rounded-[2.5rem] p-8 border border-[#334155] shadow-2xl relative overflow-hidden',
            actions: 'flex gap-4 w-full mt-4 m-0',
            confirmButton: 'flex-1 bg-[#1e3a8a] rounded-xl py-4 font-black text-white uppercase text-[10px] shadow-lg hover:bg-[#1e40af] transition-colors active:scale-95',
            cancelButton: 'flex-1 text-gray-400 font-bold uppercase text-[10px] hover:text-white transition-colors bg-white/5 py-4 rounded-xl border border-white/10'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            if (!navigator.onLine && typeof showToast === 'function') {
                showToast("Sistem Offline: Menunggu koneksi untuk menghapus...", "warning");
            }

            let currentData = window.siteData.comments || [];
            if (!Array.isArray(currentData)) currentData = Object.values(currentData);

            const newData = currentData.filter(c => c.id !== id && c.parentId !== id);

            window.forceRerender = true;
            update(window.dbRef, { comments: newData })
                .then(() => {
                    if(typeof showToast === 'function') showToast("Ulasan berhasil dihapus", "success");
                    if(typeof playSfx === 'function') playSfx('success');
                })
                .catch((err) => {
                    console.error(err);
                    if(typeof showToast === 'function') showToast("Gagal menghapus", "info");
                });
        }
    });
};

window.editComment = (id) => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
    let currentData = window.siteData.comments || [];
    if (!Array.isArray(currentData)) currentData = Object.values(currentData);

    const target = currentData.find(c => c.id === id);
    if (target) {
        window.editingId = id;
        window.currentParentId = null;

        if(window.openModal) window.openModal();
        const nameInput = document.getElementById('revName');
        const textInput = document.getElementById('revText');
        const titleModal = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitReviewBtn');

        if(nameInput) nameInput.value = target.name;
        if(textInput) textInput.value = target.text;

        if(titleModal) {
            titleModal.innerText = "EDIT ULASAN";
            titleModal.style.color = "#fbbf24";
        }
        if(submitBtn) {
            submitBtn.innerText = "UPDATE";
            submitBtn.classList.add("bg-yellow-600");
        }

        if (target.star) {
            window.selectedStar = target.star;
            const starElements = document.querySelectorAll('#starInput span');
            starElements.forEach(s => {
                const v = parseInt(s.getAttribute('data-v'));
                if (v <= target.star) {
                    s.style.color = '#facc15';
                    s.style.transform = 'scale(1.1)';
                } else {
                    s.style.color = '#374151';
                    s.style.transform = 'scale(1)';
                }
            });
        }
        if(typeof playSfx === 'function') playSfx('pop');
    }
};

window.loveComment = (id) => {
    if (!navigator.onLine && typeof showToast === 'function') {
        showToast("Offline: Perubahan akan disimpan saat online", "warning");
    }

    let currentData = window.siteData.comments || [];
    if (!Array.isArray(currentData)) currentData = Object.values(currentData);
    const updatedData = currentData.map(c => {
        if (c.id === id) {
            return { ...c, adminLoved: !c.adminLoved };
        }
        return c;
    });
    const el = document.getElementById(`comment-${id}`);
    if (el) {
        const avatarCont = el.querySelector('.avatar-container');
        const currentTarget = updatedData.find(c => c.id === id);
        const existingBadge = avatarCont.querySelector('.admin-love-badge');
        if (currentTarget.adminLoved) {
            if (!existingBadge) {
                const badge = document.createElement('div');
                badge.className = 'admin-love-badge';
                badge.innerHTML = '<i class="fas fa-heart"></i>';
                avatarCont.appendChild(badge);
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    }

    update(window.dbRef, { comments: updatedData });
    if(typeof playSfx === 'function') playSfx('pop');
};

window.pinComment = (id) => {
    if (!navigator.onLine && typeof showToast === 'function') {
        showToast("Offline: Perubahan akan disimpan saat online", "warning");
    }

    let currentData = window.siteData.comments || [];
    if (!Array.isArray(currentData)) currentData = Object.values(currentData);
    const targetComment = currentData.find(c => c.id === id);
    const willBePinned = targetComment ? !targetComment.isPinned : false;
    const updatedData = currentData.map(c => {
        if (c.id === id) {
            return { ...c, isPinned: willBePinned };
        } else {
            return { ...c, isPinned: false };
        }
    });
    window.forceRerender = true;
    update(window.dbRef, { comments: updatedData });

    if(willBePinned) {
        if(typeof playSfx === 'function') playSfx('success');
    } else {
        if(typeof playSfx === 'function') playSfx('pop');
    }
};

window.replyComment = (parentId, name) => {
    window.currentParentId = parentId;
    window.editingId = null;

    if(window.openModal) window.openModal();
    const textInput = document.getElementById('revText');
    const titleModal = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitReviewBtn');
    if(textInput) {
        textInput.value = `@${name} `;
        textInput.placeholder = `Membalas @${name}...`;
        textInput.focus();
    }
    if(titleModal) {
        titleModal.innerText = `BALAS ${name.toUpperCase()}`;
        titleModal.style.color = "#60a5fa";
    }
    if(submitBtn) {
        submitBtn.innerText = "KIRIM BALASAN";
        submitBtn.classList.remove("bg-yellow-600");
    }
};

window.trackDownload = (id, link) => {
    if(link && link !== "#") {
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        if(typeof showToast === 'function') showToast("Link error / kosong", "info");
    }

    try {
        if(window.dbRef && navigator.onLine) {
            const updates = {};
            updates[`scriptDownloads/${id}`] = increment(1);
            update(window.dbRef, updates).catch(()=>{});
        }
    } catch(e) {
        console.warn("Track download fail (offline?)");
    }
};

window.executeDownload = (id, link) => {
    Swal.close();
    window.trackDownload(id, link);
};

window.handleEngagement = (id, type, counterId) => {
    if (!navigator.onLine && typeof showToast === 'function') {
        showToast("Offline: Interaksi ditunda", "warning");
    }

    let myInts = JSON.parse(localStorage.getItem('my_ints_v4') || '{}');

    let currentData = window.siteData.comments || [];
    if (!Array.isArray(currentData)) currentData = Object.values(currentData);

    const updated = currentData.map(c => {
        if(c.id === id) {
            if(myInts[id] === type) {
                c[type === 'like' ? 'likes' : 'dislikes'] = Math.max(0, (c[type === 'like' ? 'likes' : 'dislikes'] || 0) - 1);
                delete myInts[id];
            } else {
                if(myInts[id]) {
                    const prevType = myInts[id];
                    c[prevType === 'like' ? 'likes' : 'dislikes'] = Math.max(0, (c[prevType === 'like' ? 'likes' : 'dislikes'] || 0) - 1);
                }
                c[type === 'like' ? 'likes' : 'dislikes'] = (c[type === 'like' ? 'likes' : 'dislikes'] || 0) + 1;
                myInts[id] = type;
            }
            
            const countEl = document.getElementById(counterId);
            
            if (countEl) countEl.innerText = c[type === 'like' ? 'likes' : 'dislikes'];
            
            const btnLike = document.getElementById(`btn-like-${id}`);
            const btnDislike = document.getElementById(`btn-dislike-${id}`);
            if (btnLike && btnDislike) {
                btnLike.className = `text-[10px] font-black ${myInts[id] === 'like' ?
'text-[#60a5fa]' : 'text-gray-500'}`;
                btnLike.querySelector('i').className = `${myInts[id] === 'like' ? 'fas' : 'far'} fa-thumbs-up`;
                btnDislike.className = `text-[10px] font-black ${myInts[id] === 'dislike' ? 'text-red-400' : 'text-gray-500'}`;
                btnDislike.querySelector('i').className = `${myInts[id] === 'dislike' ?
'fas' : 'far'} fa-thumbs-down`;
            }
        }
        return c;
});

    localStorage.setItem('my_ints_v4', JSON.stringify(myInts));
    update(window.dbRef, { comments: updated });
    if(typeof playSfx === 'function') playSfx('pop');
};

window.renderScripts = (data) => {
    const list = document.getElementById('scriptList');
    if(!list) return;
    requestAnimationFrame(() => {
        const isScPage = list.closest('.sc-container') !== null;
        if(isScPage) {
            if (window.renderScPageScripts) window.renderScPageScripts(data);
        } else {
            if (window.renderHomeScripts) window.renderHomeScripts(data);
        }
    });
};

window.toggleReplies = (id) => {
    const el = document.getElementById(`replies-${id}`);
    const icon = document.querySelector(`#reply-toggle-${id} i`);
    if (el) {
        if (el.classList.contains('hidden')) {
            el.classList.remove('hidden');
            if(window.openReplyIds) window.openReplyIds.add(id);
            if(icon) { icon.classList.remove('fa-caret-down'); icon.classList.add('fa-caret-up'); }
        } else {
            el.classList.add('hidden');
            if(window.openReplyIds) window.openReplyIds.delete(id);
            if(icon) { icon.classList.remove('fa-caret-up'); icon.classList.add('fa-caret-down'); }
        }
        if(typeof playSfx === 'function') playSfx('pop');
    }
};

window.initUnlockProcess = (id, downloadLink) => {
    const sys = CONFIG.unlockSystem;
    const tasks = sys.tasks || [];
    window.unlockState = {};
    tasks.forEach(t => { window.unlockState[t.id] = false; });

    let tasksHtml = '';
    tasks.forEach(t => {
        let iconClass = 'fas fa-link';
        if(t.icon === 'yt') iconClass = 'fab fa-youtube';
        if(t.icon === 'wa') iconClass = 'fab fa-whatsapp';
        if(t.icon === 'bullhorn') iconClass = 'fas fa-bullhorn';
        if(t.icon === 'heart') iconClass = 'fas fa-heart';

        let colorHex = '#60a5fa';
        if(t.color === 'red') colorHex = '#ef4444';
        if(t.color === 'green') colorHex = '#22c55e';
        if(t.color === 'blue') colorHex = '#3b82f6';
        if(t.color === 'pink') colorHex = '#ec4899';

        tasksHtml += `
        <div class="ul-task-card group cursor-pointer" id="task-${t.id}" onclick="handleTask('${t.id}', '${t.url}')">
            <div class="ul-task-icon" style="color: ${colorHex}; border-color: ${colorHex};">
                <i class="${iconClass}"></i>
            </div>
            <div class="ul-task-text">
                <div class="ul-task-title">${t.title}</div>
                <div class="ul-task-subtitle">${t.subtitle}</div>
            </div>
            <div class="ul-task-btn" id="btn-${t.id}">${t.btnText}</div>
        </div>`;
});

    const customStyles = `
    <style>
        .swal2-popup.lux-modal { background: #0f172a;
border: 2px solid #334155; border-radius: 20px; box-shadow: 6px 6px 0px rgba(0,0,0,0.5); padding: 0; overflow: hidden;
}
        .lux-header { background: url('../assets/images/background.jpg') center/cover; position: relative; padding: 25px 20px 20px;
text-align: center; border-bottom: 2px solid #334155; }
        .lux-header::after { content: ''; position: absolute;
inset: 0; background: rgba(2,6,23,0.85); z-index: 1; }
        .lux-header-content { position: relative; z-index: 2;
}
        .lux-icon-wrap { width: 55px; height: 55px; border-radius: 50%; background: #1e293b;
border: 2px solid #60a5fa; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: 3px 3px 0px rgba(0,0,0,0.5);
}
        .lux-icon-wrap i { font-size: 1.5rem;
}
        .ul-task-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #1e293b;
border: 2px solid #334155; border-radius: 12px; margin-bottom: 10px; transition: all 0.2s ease-in-out; position: relative; box-shadow: 3px 3px 0px rgba(0,0,0,0.4);
}
        .ul-task-card:hover { transform: translate(-2px, -2px); border-color: #60a5fa; box-shadow: 5px 5px 0px rgba(0,0,0,0.5);
background: #233147; }
        .ul-task-card.completed { background: #14532d; border-color: #22c55e;
box-shadow: 3px 3px 0px rgba(0,0,0,0.6); }
        .ul-task-icon { width: 38px; height: 38px;
border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 2px solid; background: #0f172a !important; transition: 0.2s;
box-shadow: inset 2px 2px 0px rgba(0,0,0,0.3); }
        .ul-task-card:hover .ul-task-icon { transform: scale(1.05) rotate(5deg);
}
        .ul-task-text { flex: 1; text-align: left;
}
        .ul-task-title { color: #f8fafc; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; transition: 0.2s;
}
        .ul-task-card:hover .ul-task-title { color: #60a5fa;
}
        .ul-task-subtitle { color: #94a3b8; font-size: 9px; font-weight: 600; margin-top: 2px;
}
        .ul-task-btn { padding: 5px 10px; border-radius: 8px; background: #0f172a; color: #60a5fa;
font-size: 9px; font-weight: 900; border: 1px solid #334155; text-transform: uppercase; transition: 0.2s; box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
}
        .ul-task-card.completed .ul-task-btn { background: #22c55e; color: white; border-color: #16a34a;
}
        .ul-progress-bg { background: #0f172a; border-radius: 8px; height: 8px; width: 100%; overflow: hidden;
border: 1px solid #334155; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.5);
}
        .ul-progress-fill { background: #60a5fa; height: 100%; width: 0%;
transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .final-dl-btn { width: 100%;
padding: 12px; border-radius: 10px; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; transition: all 0.2s; position: relative; border: 2px solid;
}
        .btn-locked { background: #1e293b; border-color: #334155; color: #64748b; cursor: not-allowed; box-shadow: none;
}
        .btn-unlocked { background: #2563eb; border-color: #1d4ed8; color: white; cursor: pointer;
box-shadow: 3px 3px 0px #1e3a8a; }
        .btn-unlocked:hover { transform: translate(-2px, -2px);
box-shadow: 5px 5px 0px #1e3a8a; background: #3b82f6; }
        .btn-unlocked:active { transform: translate(0px, 0px);
box-shadow: 0px 0px 0px #1e3a8a; }
    </style>`;
    Swal.fire({
        customClass: { popup: 'lux-modal' },
        html: `${customStyles}
        <div class="lux-header">
            <div class="lux-header-content">
                <div class="lux-icon-wrap">
                    <i class="fas fa-lock text-[#60a5fa]" id="main-lock-icon"></i>
                </div>
                <h3 class="text-white font-black tracking-[0.2em] uppercase mb-1" style="font-family: 'Press Start 2P', cursive; font-size: 10px;">${sys.headerTitle}</h3>
                <p class="text-[#94a3b8] text-[9px] font-medium max-w-[220px] mx-auto leading-tight">${sys.headerSubtitle}</p>
            </div>
        </div>
        <div class="px-5 py-5 bg-[#020617]">
            <div class="mb-4">
                <div class="flex justify-between items-center text-[9px] font-black text-[#60a5fa] mb-2 tracking-widest uppercase">
                    <span>Progress</span>
                    <span id="progress-text" class="bg-[#0f172a] px-2 py-1 rounded border border-[#334155]">0%</span>
                </div>
                <div class="ul-progress-bg"><div class="ul-progress-fill" id="progress-bar"></div></div>
            </div>
            <div class="mb-5">
                ${tasksHtml}
            </div>
            <button id="final-dl-btn" disabled onclick="window.executeDownload('${id}', '${downloadLink}')" class="final-dl-btn btn-locked">
                <span class="relative z-10 flex items-center justify-center gap-2">
                    <i class="fas fa-lock text-sm" id="dl-icon"></i> <span id="dl-text">LOCKED</span>
                </span>
            </button>
        </div>`,
        showConfirmButton: false,
        showCloseButton: true,
        background: '#020617',
        width: 340,
        showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutDown animate__faster'
        }
    });
};

window.handleTask = (key, url) => {
    if (window.unlockState[key]) return;

    if (url) window.open(url, '_blank');

    window.unlockState[key] = true;
    const card = document.getElementById(`task-${key}`);
    const btn = document.getElementById(`btn-${key}`);

    if (card) {
        card.classList.add('completed');
        const iconWrap = card.querySelector('.ul-task-icon');
        if(iconWrap) {
            iconWrap.style.color = '#22c55e';
            iconWrap.style.borderColor = '#22c55e';
            iconWrap.style.background = '#064e3b !important';
        }
    }
    if (btn) {
        btn.innerHTML = '<i class="fas fa-check text-white"></i>';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#16a34a';
        btn.style.color = 'white';
        btn.style.boxShadow = '2px 2px 0px #064e3b';
    }
    if(typeof playSfx === 'function') playSfx('pop');

    const s = window.unlockState;
    const total = Object.keys(s).length;
    const done = Object.values(s).filter(v => v).length;
    const percent = Math.round((done / total) * 100);
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('progress-text');

    if(bar) bar.style.width = `${percent}%`;
    if(txt) txt.innerText = `${percent}%`;
    if (done === total) {
        const dlBtn = document.getElementById('final-dl-btn');
        const dlIcon = document.getElementById('dl-icon');
        const dlText = document.getElementById('dl-text');
        const mainIcon = document.getElementById('main-lock-icon');

        if(mainIcon) {
            mainIcon.className = "fas fa-unlock-alt text-3xl text-[#22c55e]";
            mainIcon.style.filter = "none";
            mainIcon.parentElement.style.borderColor = "#22c55e";
            mainIcon.parentElement.style.boxShadow = "3px 3px 0px #064e3b";
        }

        if (dlBtn) {
            dlBtn.disabled = false;
            dlBtn.classList.remove('btn-locked');
            dlBtn.classList.add('btn-unlocked');
            dlIcon.className = "fas fa-download text-sm";
            dlText.innerText = "DOWNLOAD SEKARANG";
            if(typeof playSfx === 'function') playSfx('success');
        }
    }
};
