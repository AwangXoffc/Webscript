import {
    getDatabase, ref, push, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const chatBox = document.getElementById('chatBox');
const userPrompt = document.getElementById('userPrompt');
const sendBtn = document.getElementById('sendBtn');
const emptyState = document.getElementById('emptyState');
const historyList = document.getElementById('historyList');
const appContainer = document.querySelector('.ai-container');
const inputWrapper = document.querySelector('.input-area-wrapper');
const replyPreview = document.getElementById('replyPreview');
const replyToName = document.getElementById('replyToName');
const replyTextEl = document.getElementById('replyText');
const inputBoxContainer = document.querySelector('.input-box-container');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const btnOpenSidebar = document.getElementById('btnOpenSidebar');
const btnNewChat = document.getElementById('btnNewChat');
const btnClearHistory = document.getElementById('btnClearHistory');
const btnResetSession = document.getElementById('btnResetSession');
const btnCancelReply = document.getElementById('btnCancelReply');

const uploadMenuBtn = document.getElementById('uploadMenuBtn');
const uploadPanel = document.getElementById('uploadPanel');
const fileInputAI = document.getElementById('fileInputAI');
const filePreviewContainer = document.getElementById('filePreviewContainer');

let selectedAIFile = null;
let selectedAIFileType = null;
let selectedAIVisionFrames = [];
let selectedAIFileText = null;
let selectedAIFileDataUrl = null;
let isMediaProcessing = false; 
let chatSessions = JSON.parse(localStorage.getItem('chat_sessions_v2') || "[]");
let currentSessionId = null;
let currentMode = 'normal';
let targetMsgId = null;
let ttsState = {
    msgId: null,
    isSpeaking: false,
    isPaused: false,
    utterances: [],
    currentIndex: 0,
    rawText: '',
    chunks: []
};

let voices = [];
window.wasOfflineAi = false;

const LONG_TEXT_THRESHOLD = 500;
let pastedNoteItems = [];

window.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG !== 'undefined') {
        const profileImgLocal = '../assets/images/profile.jpg';
        const bgImgLocal = '../assets/images/background.jpg';
        const avatarEl = document.getElementById('sidebarAvatar');
        if (avatarEl) avatarEl.src = profileImgLocal;
        const aiNameEl = document.getElementById('aiNameDisplay');
        if (aiNameEl) aiNameEl.innerText = CONFIG.aiSystem.aiName;
        const customBg = document.getElementById('customBg');
        if (customBg) customBg.style.backgroundImage = `url('${bgImgLocal}')`;
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    if (userPrompt) {
        userPrompt.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
                return;
            }
        });

        userPrompt.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        userPrompt.addEventListener('paste', handlePasteEvent);
    }

    if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', openSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    if (btnNewChat) btnNewChat.addEventListener('click', () => startNewChat(true));
    if (btnClearHistory) btnClearHistory.addEventListener('click', clearAllHistory);
    if (btnResetSession) btnResetSession.addEventListener('click', clearCurrentChat);
    if (btnCancelReply) btnCancelReply.addEventListener('click', cancelReply);

    if (uploadMenuBtn) {
        uploadMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (uploadPanel) {
                uploadPanel.classList.toggle('active');
                if (typeof playSfx === 'function') playSfx('pop');
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.msg-menu-container') && !e.target.closest('.msg-tools')) {
            document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.remove('active'));
            document.querySelectorAll('.message').forEach(m => m.classList.remove('z-active'));
        }
        if (uploadPanel && !e.target.closest('#uploadPanel') && !e.target.closest('#uploadMenuBtn')) {
            uploadPanel.classList.remove('active');
        }
    });

    updateOnlineStatus();
    renderSidebarHistory();

    const lastSessionId = localStorage.getItem('last_active_session');
    if (lastSessionId && chatSessions.some(s => s.id === lastSessionId)) {
        loadSession(lastSessionId);
    } else {
        startNewChat(false);
    }

    initSafeZone();
    loadVoices();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

function setMediaProcessing(isProcessing) {
    isMediaProcessing = isProcessing;
    updateSendBtnState();
}

function updateSendBtnState() {
    if (!sendBtn) return;
    if (isMediaProcessing) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.4';
        sendBtn.style.cursor = 'not-allowed';
        sendBtn.title = 'Tunggu media selesai diproses...';
    } else {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '';
        sendBtn.style.cursor = '';
        sendBtn.title = '';
    }
}

function handlePasteEvent(e) {
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    if (!pastedText || pastedText.length <= LONG_TEXT_THRESHOLD) return;

    e.preventDefault();

    const noteId = 'note_' + Date.now();
    const noteItem = {
        id: noteId,
        text: pastedText,
        preview: pastedText.substring(0, 120) + (pastedText.length > 120 ? '...' : '')
    };
    pastedNoteItems.push(noteItem);

    const noteEl = document.createElement('div');
    noteEl.id = 'pasted-note-' + noteId;
    noteEl.style.cssText = `
        display: flex; align-items: flex-start; gap: 8px;
        background: #1e293b; border: 1px solid #334155;
        border-radius: 12px; padding: 10px 12px; margin-bottom: 8px;
        cursor: pointer; position: relative; width: 100%;
        box-sizing: border-box; transition: border-color 0.2s;
    `;
    noteEl.onmouseenter = () => noteEl.style.borderColor = '#60a5fa';
    noteEl.onmouseleave = () => noteEl.style.borderColor = '#334155';

    noteEl.innerHTML = `
        <div style="width:32px;height:32px;border-radius:8px;background:#0f172a;border:1px solid #334155;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="fas fa-sticky-note" style="color:#60a5fa;font-size:13px;"></i>
        </div>
        <div style="flex:1;min-width:0;" onclick="openNotePopup('${noteId}')">
            <div style="font-size:9px;font-weight:800;color:#60a5fa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Catatan Tempel &bull; ${pastedText.length.toLocaleString()} karakter</div>
            <div style="font-size:11px;color:#cbd5e1;line-height:1.5;word-break:break-word;white-space:pre-wrap;">${escapeHtml(pastedText.substring(0, 100))}${pastedText.length > 100 ? '<span style="color:#64748b;"> ...klik untuk lihat lengkap</span>' : ''}</div>
        </div>
        <button onclick="removePastedNote('${noteId}')" style="width:22px;height:22px;background:#ef4444;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;color:white;font-size:10px;" title="Hapus">
            <i class="fas fa-times"></i>
        </button>
    `;

    const previewArea = document.getElementById('pastedNotesArea');
    if (previewArea) {
        previewArea.appendChild(noteEl);
        previewArea.classList.add('active');
    } else {
        const notesArea = document.createElement('div');
        notesArea.id = 'pastedNotesArea';
        notesArea.style.cssText = 'width:100%;margin-bottom:6px;display:flex;flex-direction:column;gap:6px;';
        notesArea.appendChild(noteEl);
        inputBoxContainer.insertBefore(notesArea, inputBoxContainer.firstChild);
    }
}

window.openNotePopup = function(noteId) {
    const note = pastedNoteItems.find(n => n.id === noteId);
    if (!note) return;

    Swal.fire({
        html: `
            <div style="text-align:left;">
                <div style="font-size:10px;font-weight:800;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-sticky-note"></i> ISI CATATAN &bull; ${note.text.length.toLocaleString()} karakter
                </div>
                <div style="background:#020617;border:1px solid #334155;border-radius:12px;padding:16px;max-height:60vh;overflow-y:auto;font-size:12px;color:#cbd5e1;line-height:1.7;white-space:pre-wrap;word-break:break-word;">${escapeHtml(note.text)}</div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: '#0f172a',
        width: Math.min(window.innerWidth - 32, 600),
        customClass: {
            popup: 'rounded-[20px] border border-[#334155] shadow-2xl p-6',
            closeButton: 'text-gray-400 hover:text-white'
        }
    });
};

window.removePastedNote = function(noteId) {
    pastedNoteItems = pastedNoteItems.filter(n => n.id !== noteId);
    const el = document.getElementById('pasted-note-' + noteId);
    if (el) el.remove();
    const area = document.getElementById('pastedNotesArea');
    if (area && area.children.length === 0) area.remove();
};

window.selectUploadType = (type) => {
    if (uploadPanel) uploadPanel.classList.remove('active');
    selectedAIFileType = type;
    if (fileInputAI) {
        if (type === 'image') fileInputAI.accept = 'image/*';
        else if (type === 'video') fileInputAI.accept = 'video/*';
        else fileInputAI.accept = '.pdf,.doc,.docx,.txt,.csv,.json,.md,.html,.js,.css,.xml,.yaml,.yml,.log,.ini,.env,.ts,.jsx,.tsx,.sh,.py,.php,.java,.c,.cpp,.go,.rb,.swift,.kt,.dart';
        fileInputAI.click();
    }
};

async function extractVideoFrames(file, maxFrames = 10) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';

        video.onloadedmetadata = () => {
            const duration = video.duration;
            const frameCount = Math.min(maxFrames, Math.max(8, Math.floor(duration * 2.5)));
            const frames = [];

            const captureFrame = (time) => {
                return new Promise((res) => {
                    video.currentTime = time;
                    video.onseeked = () => {
                        const canvas = document.createElement('canvas');
                        let w = video.videoWidth;
                        let h = video.videoHeight;
                        const maxD = 720;
                        if (w > h && w > maxD) { h = Math.round(h * maxD / w); w = maxD; }
                        else if (h > maxD) { w = Math.round(w * maxD / h); h = maxD; }
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, w, h);
                        res(canvas.toDataURL('image/jpeg', 0.82));
                    };
                });
            };

            const captureAll = async () => {

                const step = duration / (frameCount + 1);
                for (let i = 0; i <= frameCount; i++) {
                    const t = Math.min(i * step, duration - 0.1);
                    const frame = await captureFrame(Math.max(0.05, t));
                    frames.push(frame);
                }
                URL.revokeObjectURL(video.src);
                resolve({ frames, duration: Math.round(duration), width: video.videoWidth, height: video.videoHeight });
            };

            captureAll();
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve({ frames: [], duration: 0, width: 0, height: 0 });
        };
    });
}

window.handleAIFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        const tempUrl = URL.createObjectURL(file);
        tempVideo.src = tempUrl;
        await new Promise((res) => { tempVideo.onloadedmetadata = res; tempVideo.onerror = res; });
        const dur = tempVideo.duration;
        URL.revokeObjectURL(tempUrl);

        if (dur > 30) {
            showVideoTooLongNotif();
            if (fileInputAI) fileInputAI.value = '';
            return;
        }
    }

    setMediaProcessing(true);

    selectedAIFile = file;
    selectedAIVisionFrames = [];

    if (file.type.startsWith('image/')) selectedAIFileType = 'image';
    else if (file.type.startsWith('video/')) selectedAIFileType = 'video';
    else selectedAIFileType = 'file';

    filePreviewContainer.innerHTML = '';
    const previewEl = document.createElement('div');
    previewEl.className = 'preview-item';
    previewEl.id = 'current-preview-item';
    previewEl.innerHTML = `
        <div class="preview-loading-overlay" id="previewLoader">
            <i class="fas fa-circle-notch"></i>
            <span class="preview-loading-text" id="previewLoadText">0%</span>
        </div>
        <div id="previewContent" style="width:100%;height:100%;opacity:0;transition:opacity 0.3s;"></div>
    `;
    filePreviewContainer.appendChild(previewEl);
    filePreviewContainer.classList.add('active');

    const reader = new FileReader();

    reader.onprogress = (e) => {
        if (e.lengthComputable && selectedAIFileType !== 'video') {
            const percent = Math.round((e.loaded / e.total) * 100);
            const txt = document.getElementById('previewLoadText');
            if (txt) txt.innerText = percent + '%';
        }
    };

    reader.onload = async (e) => {
        const dataUrl = e.target.result;
        selectedAIFileDataUrl = dataUrl;
        const pContent = document.getElementById('previewContent');
        const pLoader = document.getElementById('previewLoader');

        try {
            if (selectedAIFileType === 'image') {
                const img = new Image();
                img.src = dataUrl;
                await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                const maxD = 900;
                if (w > h && w > maxD) { h = Math.round(h * maxD / w); w = maxD; }
                else if (h > maxD) { w = Math.round(w * maxD / h); h = maxD; }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.85);
                selectedAIVisionFrames = [compressed];
                if (pContent) pContent.innerHTML = `<img src="${compressed}" alt="preview">`;
                if (pLoader) pLoader.remove();
                if (pContent) pContent.style.opacity = '1';

            } else if (selectedAIFileType === 'video') {
                let simProgress = 10;
                const simInt = setInterval(() => {
                    simProgress += 8;
                    if (simProgress > 90) simProgress = 90;
                    const txt = document.getElementById('previewLoadText');
                    if (txt) txt.innerText = simProgress + '%';
                }, 300);

                const { frames, duration, width, height } = await extractVideoFrames(file, 10);
                clearInterval(simInt);

                if (frames.length > 0) {
                    selectedAIVisionFrames = frames;
                    if (pContent) {
                        pContent.innerHTML = `
                            <div style="position:relative;width:100%;height:100%;">
                                <img src="${frames[0]}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:11px;">
                                <div style="position:absolute;bottom:2px;left:2px;background:rgba(0,0,0,0.7);color:#60a5fa;font-size:8px;font-weight:800;padding:2px 5px;border-radius:4px;">
                                    ${frames.length} frame
                                </div>
                            </div>`;
                    }
                } else {
                    if (pContent) pContent.innerHTML = `<div class="file-icon"><i class="fas fa-video"></i></div>`;
                }
                if (pLoader) pLoader.remove();
                if (pContent) pContent.style.opacity = '1';

            } else {
                if (pContent) pContent.innerHTML = `<div class="file-icon"><i class="fas fa-file-alt"></i></div>`;
                const ext = file.name.split('.').pop().toLowerCase();
                const readableExts = ['txt','csv','json','md','html','js','css','ts','jsx','tsx','sh','py','php','java','c','cpp','go','rb','swift','kt','dart','xml','yaml','yml','log','ini','env','sql'];
                if (readableExts.includes(ext)) {
                    const txtReader = new FileReader();
                    await new Promise((res) => {
                        txtReader.onload = (e2) => { selectedAIFileText = e2.target.result; res(); };
                        txtReader.onerror = res;
                        txtReader.readAsText(file, 'UTF-8');
                    });
                } else {
                    selectedAIFileText = `[Informasi Sistem: User melampirkan dokumen biner dengan nama ${file.name}. Format ini tidak dapat diekstrak teksnya secara langsung. Jawab pertanyaan user terkait dokumen ini sesuai konteks yang diberikan.]`;
                }
                if (pLoader) pLoader.remove();
                if (pContent) pContent.style.opacity = '1';
            }

            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-preview-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.onclick = clearAIFileSelection;
            previewEl.appendChild(removeBtn);

        } catch (err) {
            console.error('File processing error:', err);
            if (pLoader) pLoader.remove();
            if (pContent) {
                pContent.innerHTML = `<div class="file-icon"><i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i></div>`;
                pContent.style.opacity = '1';
            }
        } finally {

            setMediaProcessing(false);
        }
    };

    reader.onerror = () => {
        setMediaProcessing(false);
    };

    reader.readAsDataURL(file);
    if (typeof playSfx === 'function') playSfx('pop');
};

function showVideoTooLongNotif() {
    const existingNotif = document.getElementById('video-too-long-notif');
    if (existingNotif) existingNotif.remove();

    const notif = document.createElement('div');
    notif.id = 'video-too-long-notif';
    notif.style.cssText = `
        background: #1e293b; border: 1px solid #ef4444; border-radius: 10px;
        padding: 10px 14px; margin-bottom: 8px; display: flex;
        align-items: center; gap: 10px; font-size: 11px; font-weight: 700;
        color: #fca5a5; animation: fadeIn 0.3s ease; width: 100%; box-sizing: border-box;
    `;
    notif.innerHTML = `
        <i class="fas fa-exclamation-circle" style="color:#ef4444;font-size:15px;flex-shrink:0;"></i>
        <span>Video terlalu panjang. Maksimal <strong>30 detik</strong>. Harap pilih video yang lebih pendek.</span>
        <button onclick="document.getElementById('video-too-long-notif').remove()" style="margin-left:auto;background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:12px;flex-shrink:0;">
            <i class="fas fa-times"></i>
        </button>
    `;

    const wrapper = inputBoxContainer.parentElement || document.querySelector('.input-area-wrapper');
    wrapper.insertBefore(notif, inputBoxContainer);

    setTimeout(() => { if (notif.parentElement) notif.remove(); }, 5000);
}

window.clearAIFileSelection = () => {
    selectedAIFile = null;
    selectedAIFileType = null;
    selectedAIVisionFrames = [];
    selectedAIFileText = null;
    selectedAIFileDataUrl = null;
    if (fileInputAI) fileInputAI.value = '';
    if (filePreviewContainer) {
        filePreviewContainer.innerHTML = '';
        filePreviewContainer.classList.remove('active');
    }
    setMediaProcessing(false);
};

window.openMediaPreview = function(url, type, msgIdOrContent) {
    const modal = document.getElementById('mediaPreviewModal');
    const wrapper = document.getElementById('mediaPreviewWrapper');
    if (!modal || !wrapper) return;

    wrapper.innerHTML = '';

    if (type === 'video') {
        wrapper.innerHTML = `<video src="${url}" controls autoplay class="max-h-[85vh] max-w-full rounded-2xl shadow-2xl border border-white/10"></video>`;
    } else if (type === 'image') {
        wrapper.innerHTML = `<img src="${url}" class="max-h-[85vh] max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain">`;
    } else if (type === 'file') {
        let fileContent = msgIdOrContent;
        if (msgIdOrContent && msgIdOrContent.startsWith('msg_')) {
            for (let session of chatSessions) {
                const msg = session.messages.find(m => m.id === msgIdOrContent);
                if (msg && msg.fileText) { fileContent = msg.fileText; break; }
            }
        }

        if (fileContent) {
            const escaped = fileContent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            wrapper.innerHTML = `
                <div style="background:#0f172a;border:1px solid #334155;border-radius:16px;width:min(90vw,700px);max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px rgba(0,0,0,0.6);position:relative;">
                    <div style="padding:14px 18px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;background:#020617;border-radius:16px 16px 0 0;">
                        <span style="font-size:11px;font-weight:800;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;"><i class="fas fa-file-alt"></i> Isi Dokumen</span>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:9px;color:#64748b;font-weight:700;">${fileContent.length.toLocaleString()} karakter</span>
                            <button onclick="closeMediaPreview()" class="w-7 h-7 bg-white/10 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-full flex items-center justify-center transition-all z-[4010]">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div style="overflow-y:auto;flex:1;padding:16px 18px;" class="custom-scrollbar">
                        <pre style="font-family:'Fira Code',monospace;font-size:12px;color:#cbd5e1;white-space:pre-wrap;word-break:break-word;line-height:1.7;margin:0;">${escaped}</pre>
                    </div>
                </div>`;
            document.getElementById('globalMediaCloseBtn').style.display = 'none';
        } else {
            wrapper.innerHTML = `
                <div style="background:#0f172a;padding:40px;border-radius:16px;border:1px solid #334155;text-align:center;max-width:400px;width:100%;box-shadow:0 25px 50px rgba(0,0,0,0.5);position:relative;">
                    <button onclick="closeMediaPreview()" class="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-full flex items-center justify-center transition-all z-[4010]"><i class="fas fa-times"></i></button>
                    <i class="fas fa-file-alt" style="font-size:64px;color:#60a5fa;margin-bottom:20px;display:block;"></i>
                    <h3 style="color:white;font-weight:700;margin-bottom:8px;font-size:16px;">File Document</h3>
                    <p style="color:#64748b;font-size:12px;line-height:1.6;">Konten file ini telah dikirim ke AI untuk dianalisis.</p>
                </div>`;
            document.getElementById('globalMediaCloseBtn').style.display = 'none';
        }
    } else {
        document.getElementById('globalMediaCloseBtn').style.display = 'flex';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { modal.classList.remove('opacity-0'); wrapper.classList.remove('scale-95'); }, 10);
    if (typeof playSfx === 'function') playSfx('pop');
};

window.closeMediaPreview = function() {
    const modal = document.getElementById('mediaPreviewModal');
    const wrapper = document.getElementById('mediaPreviewWrapper');
    if (!modal) return;
    modal.classList.add('opacity-0');
    wrapper.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        wrapper.innerHTML = '';
        document.getElementById('globalMediaCloseBtn').style.display = 'flex';
    }, 300);
};

window.openCodePreview = function(code, langClass) {
    const modal = document.getElementById('codePreviewModal');
    const content = document.getElementById('codePreviewContent');
    if (!modal || !content) return;
    content.className = `hljs text-[13px] leading-[1.7] p-6 block font-mono ${langClass}`;
    content.textContent = code;
    if (typeof hljs !== 'undefined') hljs.highlightElement(content);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);
    if (typeof playSfx === 'function') playSfx('pop');
};

window.closeCodePreview = function() {
    const modal = document.getElementById('codePreviewModal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
};

window.copyPreviewCode = function() {
    const content = document.getElementById('codePreviewContent');
    if (!content) return;
    navigator.clipboard.writeText(content.textContent).then(() => {
        const btn = document.getElementById('copyPreviewCodeBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Tersalin';
        btn.classList.add('text-green-400', 'border-green-400/50');
        btn.classList.remove('text-[#60a5fa]', 'border-[#334155]');
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('text-green-400', 'border-green-400/50');
            btn.classList.add('text-[#60a5fa]', 'border-[#334155]');
        }, 2000);
    });
};

function openSidebar() {
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function updateOnlineStatus() {
    if (!statusDot || !statusText) return;
    if (navigator.onLine) {
        statusDot.className = "w-1.5 h-1.5 rounded-full status-online animate-pulse";
        statusText.innerText = "ONLINE";
        statusText.style.color = "#60a5fa";
        if (window.wasOfflineAi) {
            if (typeof showToast === 'function') showToast("Koneksi AI Terhubung Kembali", "success");
            window.wasOfflineAi = false;
        }
    } else {
        statusDot.className = "w-1.5 h-1.5 rounded-full status-offline";
        statusText.innerText = "OFFLINE";
        statusText.style.color = "#ef4444";
        if (!window.wasOfflineAi) {
            if (typeof showToast === 'function') showToast("Koneksi AI Terputus!", "warning");
            window.wasOfflineAi = true;
        }
    }
}

function initSafeZone() {
    adjustSafeZone();
    window.addEventListener('resize', () => {
        adjustSafeZone();
        scrollToBottom();
        if (window.innerWidth < 768) closeSidebar();
    });
}

function adjustSafeZone() {
    if (!inputWrapper) return;
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    inputWrapper.style.paddingBottom = (viewportHeight < window.screen.height * 0.75) ? '10px' : '20px';
    if (appContainer) appContainer.style.height = `${viewportHeight}px`;
}

function loadVoices() {
    if ('speechSynthesis' in window) {
        voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); };
        }
    }
}

function getBestMaleVoice(lang) {
    const allVoices = window.speechSynthesis.getVoices();
    const maleKeywords = ['male','man','david','mark','daniel','james','george','ryan','tom','ali','ardi','andika','yusuf','android','wavenet-b','wavenet-d','neural2-b','neural2-d','journey-d'];
    const femaleKeywords = ['female','woman','zira','linda','samantha','victoria','karen','moira','tessa','allison','ava','siti','dewi','gadis','sri','wavenet-a','wavenet-c','neural2-a','neural2-c'];

    const isLikelyMale = (v) => {
        const name = v.name.toLowerCase();
        if (femaleKeywords.some(k => name.includes(k))) return false;
        if (maleKeywords.some(k => name.includes(k))) return true;
        return null;
    };

    const langVoices = allVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    const exactLangVoices = allVoices.filter(v => v.lang === lang);
    const pool = exactLangVoices.length > 0 ? exactLangVoices : langVoices;
    const definitelyMale = pool.filter(v => isLikelyMale(v) === true);
    const notFemale = pool.filter(v => isLikelyMale(v) !== false);

    if (definitelyMale.length > 0) {
        const google = definitelyMale.find(v => v.name.toLowerCase().includes('google'));
        const ms = definitelyMale.find(v => v.name.toLowerCase().includes('microsoft'));
        return google || ms || definitelyMale[0];
    }
    if (notFemale.length > 0) {
        const google = notFemale.find(v => v.name.toLowerCase().includes('google'));
        const ms = notFemale.find(v => v.name.toLowerCase().includes('microsoft'));
        return google || ms || notFemale[0];
    }
    return pool[0] || allVoices[0];
}

function splitTextIntoChunks(text, chunkSize = 180) {
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const chunks = [];
    let current = '';
    for (const sentence of sentences) {
        if ((current + sentence).length > chunkSize && current.length > 0) { chunks.push(current.trim()); current = sentence; }
        else current += sentence;
    }
    if (current.trim().length > 0) chunks.push(current.trim());
    return chunks;
}

function speakChunks(chunks, startIndex, msgId) {
    if (startIndex >= chunks.length) { stopTTS(); return; }
    ttsState.currentIndex = startIndex;

    const speakNext = (index) => {
        if (index >= chunks.length) { stopTTS(); return; }
        if (!ttsState.isSpeaking) return;
        const chunk = chunks[index];
        const utter = new SpeechSynthesisUtterance(chunk);
        const englishWords = ['the','is','a','and','to','in','it','you','that','code','function','const','var','let'];
        const wordArr = chunk.toLowerCase().split(/\s+/);
        const engCount = wordArr.filter(w => englishWords.includes(w)).length;
        const lang = engCount > 3 ? 'en-US' : 'id-ID';
        utter.lang = lang;
        utter.voice = getBestMaleVoice(lang);
        utter.rate = 0.92;
        utter.pitch = 0.95;
        utter.volume = 1.0;
        utter.onstart = () => { ttsState.currentIndex = index; ttsState.isSpeaking = true; ttsState.isPaused = false; updateTTSIcon(msgId, 'playing'); };
        utter.onend = () => { if (ttsState.msgId === msgId && ttsState.isSpeaking && !ttsState.isPaused) speakNext(index + 1); };
        utter.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') speakNext(index + 1); };
        window.speechSynthesis.speak(utter);
    };

    speakNext(startIndex);
}

function stopTTS() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    ttsState.isSpeaking = false;
    ttsState.isPaused = false;
    ttsState.msgId = null;
    ttsState.currentIndex = 0;
    ttsState.chunks = [];
    updateTTSIcon(null, 'stopped');
}

function updateTTSIcon(msgId, status) {
    document.querySelectorAll('.tts-btn').forEach(btn => {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    });
    if (msgId && status === 'playing') {
        const activeBtn = document.querySelector(`#${msgId} .tts-btn`);
        if (activeBtn) { activeBtn.classList.add('playing'); activeBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
    } else if (msgId && status === 'paused') {
        const activeBtn = document.querySelector(`#${msgId} .tts-btn`);
        if (activeBtn) { activeBtn.classList.remove('playing'); activeBtn.innerHTML = '<i class="fas fa-play"></i>'; }
    }
}

window.toggleTTS = function(rawText, msgId) {
    if (!('speechSynthesis' in window)) { Swal.fire('Error', 'Perangkat tidak mendukung fitur suara', 'error'); return; }
    voices = window.speechSynthesis.getVoices();

    if (ttsState.msgId === msgId && ttsState.isSpeaking) {
        window.speechSynthesis.cancel();
        ttsState.isPaused = true;
        ttsState.isSpeaking = false;
        updateTTSIcon(msgId, 'paused');
        return;
    }
    if (ttsState.msgId === msgId && ttsState.isPaused) {
        ttsState.isPaused = false;
        ttsState.isSpeaking = true;
        updateTTSIcon(msgId, 'playing');
        speakChunks(ttsState.chunks, ttsState.currentIndex, msgId);
        return;
    }
    if (ttsState.msgId && ttsState.msgId !== msgId) window.speechSynthesis.cancel();

    const cleanText = cleanTextForTTS(rawText);
    if (!cleanText || cleanText.trim().length === 0) return;

    const chunks = splitTextIntoChunks(cleanText);
    ttsState.msgId = msgId;
    ttsState.isSpeaking = true;
    ttsState.isPaused = false;
    ttsState.currentIndex = 0;
    ttsState.rawText = rawText;
    ttsState.chunks = chunks;

    updateTTSIcon(msgId, 'playing');
    speakChunks(chunks, 0, msgId);
};

function cleanTextForTTS(rawText) {
    return rawText
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[*#_>~\-]{2,}/g, ' ')
        .replace(/[*#_>~]/g, '')
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function getLoadingConfig(hasMedia, mediaType) {
    if (!hasMedia) {
        return { type: 'dots', text: '' };
    }
    if (mediaType === 'image') {
        return { type: 'media', text: 'Menganalisis gambar...' };
    } else if (mediaType === 'video') {
        return { type: 'media', text: 'Menganalisis video...' };
    } else {
        return { type: 'media', text: 'Memproses file...' };
    }
}

function buildLoadingBubble(loadingId, config) {
    const statusBarHtml = config.type === 'media' ? `
        <div id="${loadingId}-statusbar" style="position:fixed;bottom:72px;left:50%;transform:translateX(-50%);z-index:200;max-width:600px;width:100%;pointer-events:none;">
            <div style="margin:0 16px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:8px 14px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);">
                <i class="fas fa-spinner fa-spin" style="color:#60a5fa;font-size:12px;flex-shrink:0;"></i>
                <span style="font-size:11px;font-weight:700;color:#60a5fa;" id="${loadingId}-statustext">${config.text}</span>
            </div>
        </div>` : '';

    const bubbleContent = config.type === 'media'
        ? `<div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
                    <div style="width:32px;height:32px;border-radius:50%;background:rgba(96,165,250,0.1);border:2px solid rgba(96,165,250,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:pulse 2s infinite;">
                        <i class="fas fa-${config.text.includes('gambar') ? 'image' : config.text.includes('video') ? 'video' : 'file-alt'}" style="color:#60a5fa;font-size:13px;"></i>
                    </div>
                    <div>
                        <div style="font-size:11px;font-weight:800;color:#60a5fa;margin-bottom:3px;" id="${loadingId}-bubbletext">${config.text}</div>
                        <div class="typing-dots" style="display:flex;gap:4px;padding:2px 0;">
                            <span style="width:5px;height:5px;background:#60a5fa;border-radius:50%;animation:bounce 1.4s infinite;"></span>
                            <span style="width:5px;height:5px;background:#60a5fa;border-radius:50%;animation:bounce 1.4s 0.2s infinite;"></span>
                            <span style="width:5px;height:5px;background:#60a5fa;border-radius:50%;animation:bounce 1.4s 0.4s infinite;"></span>
                        </div>
                    </div>
                </div>
           </div>`
        : `<div class="typing-dots"><span></span><span></span><span></span></div>`;

    return `
        ${statusBarHtml}
        <div class="message ai animate-fade-in-up" id="${loadingId}">
            <div class="avatar ai"><i class="fas fa-robot"></i></div>
            <div class="bubble typing-bubble flex flex-col">${bubbleContent}</div>
        </div>`;
}

function removeLoadingBubble(loadingId) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    const statusBar = document.getElementById(loadingId + '-statusbar');
    if (statusBar) statusBar.remove();
}

async function sendMessage() {
    if (isMediaProcessing) {
        if (typeof showToast === 'function') showToast("Tunggu media selesai diproses...", "info");
        return;
    }

    const userText = userPrompt.value.trim();
    const hasFile = selectedAIFileType !== null;
    const hasPastedNotes = pastedNoteItems.length > 0;

    if (!userText && !hasFile && !hasPastedNotes) return;

    if (!navigator.onLine) {
        Swal.fire({ toast: true, position: 'top', icon: 'error', title: 'Offline!', showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#fff' });
        return;
    }

    if (currentMode === 'edit' && targetMsgId) {
        handleEditSubmit(targetMsgId, userText);
        return;
    }

    let finalPromptText = userText;
    let fileMetaHtml = '';
    let notesContextText = '';

    if (hasPastedNotes) {
        notesContextText = pastedNoteItems.map((n, i) => `[Catatan Tempel ${i + 1}]:\n${n.text}`).join('\n\n');
        finalPromptText = userText ? `${userText}\n\n${notesContextText}` : notesContextText;
    }

    const tempVisionFrames = [...selectedAIVisionFrames];
    const savedFileType = selectedAIFileType;
    const savedFileName = selectedAIFile ? selectedAIFile.name : 'media';
    const savedFileText = selectedAIFileText;
    const savedFileDataUrl = selectedAIFileDataUrl;
    const now = new Date();
    const msgId = 'msg_' + Date.now();

    if (hasFile) {
        let fileDesc = '';
        if (savedFileType === 'video') {
            const frameCount = tempVisionFrames.length;
            fileDesc = `[System Info: User melampirkan VIDEO bernama "${savedFileName}" (${frameCount} frame diambil secara merata dari keseluruhan durasi video). AI WAJIB menganalisis keseluruhan isi video secara mendalam berdasarkan SEMUA frame yang dikirim — perhatikan setiap detail visual, teks, objek, orang, aktivitas, warna, latar belakang, dan perubahan antar frame. Berikan analisis yang akurat, kontekstual, dan komprehensif seperti platform AI modern.]`;
        } else if (savedFileType === 'image') {
            fileDesc = `[System Info: User melampirkan GAMBAR bernama "${savedFileName}". Analisis setiap elemen visual secara menyeluruh dan akurat.]`;
        } else {
            fileDesc = `[System Info: User melampirkan FILE DOKUMEN bernama "${savedFileName}". Analisis isi dokumen dan jawab pertanyaan user berdasarkan kontennya.]`;
        }

        if (!userText && !hasPastedNotes) {
            finalPromptText = `${fileDesc}\n\nTolong analisis dan deskripsikan isi dari file/media yang saya lampirkan secara detail dan komprehensif.`;
        } else {
            finalPromptText = (hasPastedNotes ? `${userText}\n\n${notesContextText}` : userText) + `\n\n${fileDesc}`;
        }

        if (savedFileType === 'image' && tempVisionFrames.length > 0) {
            const srcToUse = tempVisionFrames[0];
            fileMetaHtml = `<div class="mt-1 mb-1 cursor-pointer relative group" onclick="openMediaPreview('${srcToUse}', 'image')">
                <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);opacity:0;transition:opacity 0.2s;display:flex;align-items:center;justify-content:center;border-radius:12px;z-index:10;" class="group-hover:opacity-100">
                    <i class="fas fa-expand" style="color:white;font-size:22px;"></i>
                </div>
                <img src="${srcToUse}" class="max-w-full h-auto rounded-xl border border-[#334155] shadow-lg object-contain" style="max-height:250px;" alt="Uploaded Image">
            </div>`;
        } else if (savedFileType === 'video' && tempVisionFrames.length > 0) {
            const previewSrc = tempVisionFrames[0];
            fileMetaHtml = `<div class="mt-1 mb-1">
                <div class="cursor-pointer relative group" onclick="openMediaPreview('${savedFileDataUrl || previewSrc}', 'video')">
                    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);opacity:0;transition:opacity 0.2s;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:12px;z-index:10;" class="group-hover:opacity-100">
                        <i class="fas fa-play-circle" style="color:white;font-size:28px;margin-bottom:4px;"></i>
                        <span style="color:white;font-size:9px;font-weight:700;">Putar Video</span>
                    </div>
                    <img src="${previewSrc}" class="max-w-full h-auto rounded-xl border border-[#334155] shadow-lg object-cover" style="max-height:200px;width:100%;" alt="Video Preview">
                    <div style="position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,0.75);color:#60a5fa;font-size:8px;font-weight:800;padding:3px 7px;border-radius:5px;z-index:5;">
                        <i class="fas fa-film" style="margin-right:4px;"></i>${tempVisionFrames.length} frames
                    </div>
                </div>
            </div>`;
        } else if (savedFileType === 'file') {
            fileMetaHtml = `<div class="mt-1 mb-1 p-3 bg-[#020617]/50 rounded-lg border border-[#334155] flex items-center justify-between gap-3 text-[11px] text-gray-300 font-bold cursor-pointer hover:bg-[#1e293b] transition-colors" onclick="openMediaPreview('', 'file', '${msgId}')">
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-file-alt" style="color:#60a5fa;font-size:16px;"></i>
                    <span style="word-break:break-all;">${escapeHtml(savedFileName)}</span>
                </div>
                <i class="fas fa-expand" style="color:#64748b;flex-shrink:0;"></i>
            </div>`;
        }
    }

    let notesHtml = '';
    if (hasPastedNotes) {
        notesHtml = pastedNoteItems.map(n => `
            <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:8px 12px;margin-top:6px;cursor:pointer;font-size:11px;color:#cbd5e1;" onclick="openNotePopup('${n.id}')">
                <div style="font-size:9px;font-weight:800;color:#60a5fa;text-transform:uppercase;margin-bottom:3px;display:flex;align-items:center;gap:6px;">
                    <i class="fas fa-sticky-note"></i> Catatan Tempel &bull; ${n.text.length.toLocaleString()} karakter
                </div>
                <div style="white-space:pre-wrap;word-break:break-word;">${escapeHtml(n.text.substring(0, 80))}${n.text.length > 80 ? '<span style="color:#64748b;"> ...klik untuk lihat</span>' : ''}</div>
            </div>`).join('');
    }

    userPrompt.value = '';
    userPrompt.style.height = 'auto';
    const replyContextData = (currentMode === 'reply') ? { ...targetMsgId } : null;
    const capturedNotes = [...pastedNoteItems];
    pastedNoteItems = [];
    const notesArea = document.getElementById('pastedNotesArea');
    if (notesArea) notesArea.remove();

    clearAIFileSelection();
    resetInputMode();

    if (!currentSessionId) {
        currentSessionId = 'sess_' + Date.now();
        const newTitle = userText.length > 30 ? userText.substring(0, 30) + '...' : (userText || 'File / Media Analysis');
        chatSessions.unshift({ id: currentSessionId, title: newTitle, messages: [], timestamp: Date.now() });
        saveSessions();
        renderSidebarHistory();
        if (emptyState) emptyState.style.display = 'none';
    }

    const displayContent = fileMetaHtml + notesHtml + (userText ? `<div class="mt-2 text-[14px] leading-relaxed text-[#f8fafc]">${escapeHtml(userText)}</div>` : '');

    const msgObj = {
        id: msgId,
        role: 'user',
        content: finalPromptText,
        rawText: userText,
        displayHtml: displayContent,
        timestamp: now.toISOString(),
        replyTo: replyContextData,
        fileVisionFrames: tempVisionFrames,
        fileVisionFrame: tempVisionFrames[0] || null,
        fileText: savedFileText,
        fileType: savedFileType,
        fileName: savedFileName,
        fileDataUrl: savedFileDataUrl,
        pastedNotes: capturedNotes
    };

    renderUserMessage(msgObj);
    scrollToBottom();

    let sessionIdx = chatSessions.findIndex(s => s.id === currentSessionId);
    if (sessionIdx !== -1) {
        chatSessions[sessionIdx].messages.push(msgObj);
        saveSessions();
    }

    await getAIResponse(currentSessionId, false, savedFileType, hasFile);
}

async function handleEditSubmit(msgId, newText) {
    const sessionIdx = chatSessions.findIndex(s => s.id === currentSessionId);
    if (sessionIdx === -1) return;
    const msgIdx = chatSessions[sessionIdx].messages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    const msgObj = chatSessions[sessionIdx].messages[msgIdx];

    let finalContent = newText;
    let fileMetaHtml = '';
    let currentVisionFrames = msgObj.fileVisionFrames ? [...msgObj.fileVisionFrames] : [];
    let currentVisionFrame = msgObj.fileVisionFrame || null;
    let currentFileType = msgObj.fileType || null;
    let currentFileName = msgObj.fileName || null;
    let currentFileText = msgObj.fileText || null;
    let currentFileDataUrl = msgObj.fileDataUrl || null;

    if (selectedAIFileType !== null) {
        currentFileType = selectedAIFileType;
        currentFileName = selectedAIFile ? selectedAIFile.name : 'media';
        currentFileText = selectedAIFileText;
        currentVisionFrames = [...selectedAIVisionFrames];
        currentVisionFrame = selectedAIVisionFrames[0] || null;
        currentFileDataUrl = selectedAIFileDataUrl;
    }

    const hasFile = currentFileType !== null && currentFileType !== undefined;

    if (hasFile) {
        let fileDesc = '';
        if (currentFileType === 'video') {
            fileDesc = `[System Info: User melampirkan VIDEO "${currentFileName}" (${currentVisionFrames.length} frame dari seluruh durasi). AI WAJIB menganalisis keseluruhan video secara mendalam.]`;
        } else if (currentFileType === 'image') {
            fileDesc = `[System Info: User melampirkan GAMBAR "${currentFileName}". Analisis setiap elemen visual secara detail dan akurat.]`;
        } else {
            fileDesc = `[System Info: User melampirkan FILE DOKUMEN "${currentFileName}". Analisis isi dokumen.]`;
        }

        if (!newText) {
            finalContent = `${fileDesc}\n\nTolong analisis dan deskripsikan isi dari file/media yang saya lampirkan secara detail dan komprehensif.`;
        } else {
            finalContent = `${newText}\n\n${fileDesc}`;
        }

        if (currentFileType === 'image' && currentVisionFrame) {
            fileMetaHtml = `<div class="mt-1 mb-1 cursor-pointer relative group" onclick="openMediaPreview('${currentVisionFrame}', 'image')">
                <img src="${currentVisionFrame}" class="max-w-full h-auto rounded-xl border border-[#334155] shadow-lg" style="max-height:200px;" alt="Image">
            </div>`;
        } else if (currentFileType === 'video' && currentVisionFrame) {
            fileMetaHtml = `<div class="mt-1 mb-1 cursor-pointer relative group" onclick="openMediaPreview('${currentFileDataUrl || currentVisionFrame}', 'video')">
                <img src="${currentVisionFrame}" class="max-w-full h-auto rounded-xl border border-[#334155] shadow-lg" style="max-height:200px;" alt="Video Preview">
            </div>`;
        } else if (currentFileType === 'file') {
            const safeFileName = escapeHtml(currentFileName || 'file');
            fileMetaHtml = `<div class="mt-1 mb-1 p-3 bg-[#020617]/50 rounded-lg border border-[#334155] flex items-center justify-between gap-3 text-[11px] text-gray-300 font-bold cursor-pointer hover:bg-[#1e293b] transition-colors" onclick="openMediaPreview('', 'file', '${msgId}')">
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-file-alt" style="color:#60a5fa;font-size:16px;"></i>
                    <span style="word-break:break-all;">${safeFileName}</span>
                </div>
                <i class="fas fa-expand" style="color:#64748b;flex-shrink:0;"></i>
            </div>`;
        }

        msgObj.fileVisionFrames = currentVisionFrames;
        msgObj.fileVisionFrame = currentVisionFrame;
        msgObj.fileType = currentFileType;
        msgObj.fileText = currentFileText;
        msgObj.fileName = currentFileName;
        msgObj.fileDataUrl = currentFileDataUrl;
    } else {
        msgObj.fileVisionFrames = [];
        msgObj.fileVisionFrame = null;
        msgObj.fileType = null;
        msgObj.fileText = null;
        msgObj.fileName = null;
        msgObj.fileDataUrl = null;
        finalContent = newText;
    }

    const newDisplayHtml = fileMetaHtml + (newText ? `<div class="mt-2 text-[14px] leading-relaxed text-[#f8fafc]">${escapeHtml(newText)}</div>` : '');

    msgObj.rawText = newText;
    msgObj.content = finalContent;
    msgObj.displayHtml = newDisplayHtml;
    msgObj.isEdited = true;
    saveSessions();

    const msgEl = document.getElementById(msgId);
    if (msgEl) {
        const bubbleContent = msgEl.querySelector('.bubble');
        const replyEl = bubbleContent.querySelector('.reply-context-bubble');
        const menuEl = bubbleContent.querySelector('.msg-menu-container');
        const replyHTML = replyEl ? replyEl.outerHTML : '';
        const menuHTML = menuEl ? menuEl.outerHTML : '';
        const timeStr = formatTime(new Date(msgObj.timestamp));
        bubbleContent.innerHTML = `${menuHTML}${replyHTML}${newDisplayHtml}<span class="msg-time"><span class="edited-label mr-1">diedit</span>${timeStr}</span>`;
    }

    clearAIFileSelection();
    resetInputMode();
    userPrompt.value = '';
    userPrompt.style.height = 'auto';

    const nextMsg = chatSessions[sessionIdx].messages[msgIdx + 1];
    if (nextMsg && nextMsg.role === 'assistant') {
        const aiEl = document.getElementById(nextMsg.id);
        if (aiEl) aiEl.remove();
        chatSessions[sessionIdx].messages.splice(msgIdx + 1, 1);
        saveSessions();
    }

    await getAIResponse(currentSessionId, true, currentFileType, hasFile);
}

async function getAIResponse(sessId, isEditResponse, latestFileType, hasMediaInSession) {
    const loadingId = 'loading-' + Date.now();
    const activeSession = chatSessions.find(s => s.id === sessId);

    let requiresVision = false;
    if (activeSession) {
        activeSession.messages.forEach(m => {
            if ((m.fileVisionFrames && m.fileVisionFrames.length > 0) || m.fileVisionFrame) requiresVision = true;
        });
    }

    const detectedMediaType = latestFileType || (requiresVision ? 'image' : null);
    const loadingConfig = getLoadingConfig(requiresVision || hasMediaInSession, detectedMediaType);
    const loadingHtml = buildLoadingBubble(loadingId, loadingConfig);

    chatBox.insertAdjacentHTML('beforeend', loadingHtml);
    scrollToBottom();

    try {
        const GROQ_URL = CONFIG.aiSystem.baseUrl;
        if (!activeSession) throw new Error('Sesi hilang');

        let messagesPayload = [];
        let sysContent = CONFIG.aiSystem.systemInstruction + '\n[PENTING - FORMATTING UI]: 1. Berikan jeda spasi/enter kosong antar paragraf agar teks tidak berdempetan. 2. JIKA penjelasan memiliki hubungan konteks komparasi/data terstruktur, WAJIB tampilkan dalam format Markdown Table yang rapi. 3. Gunakan list penomoran (1, 2, 3) pada judul poin urutan langkah, TAPI BIJAKLAH, jangan semua diberi nomor jika bukan sebuah urutan.';

        if (isEditResponse) sysContent += '\n[System Note: User mengedit pesan terakhirnya. Berikan respons ulang yang relevan berdasarkan versi pesan terbaru.]';

        if (!requiresVision) {
            messagesPayload.push({ role: 'system', content: sysContent });
        }

        const historyForAPI = activeSession.messages.map((m, index) => {
            let contentStr = m.content;
            if (m.replyTo) contentStr = `[Reply to: "${m.replyTo.text}"]: ${contentStr}`;

            if (m.fileText) {
                const maxLen = m.fileType === 'video' ? 2000 : 4000;
                contentStr += `\n\n[ISI FILE DOKUMEN - "${m.fileName || 'file'}" - FULL CONTENT]:\n${m.fileText.substring(0, maxLen)}`;
                if (m.fileText.length > maxLen) contentStr += `\n...[konten dipotong, total ${m.fileText.length} karakter]`;
            }

            const isLastMsg = index === activeSession.messages.length - 1;
            const frames = m.fileVisionFrames && m.fileVisionFrames.length > 0
                ? m.fileVisionFrames
                : (m.fileVisionFrame ? [m.fileVisionFrame] : []);

            if (requiresVision && index === 0 && m.role === 'user') {
                contentStr = `[SYSTEM INSTRUCTION: ${sysContent}]\n\n` + contentStr;
            }

            if (frames.length > 0 && m.role === 'user') {
                if (isLastMsg) {

                    const contentArr = [{ type: 'text', text: contentStr }];
                    const maxFramesToSend = m.fileType === 'video'
                        ? Math.min(frames.length, 10)
                        : Math.min(frames.length, 4);
                    const step = frames.length / maxFramesToSend;

                    for (let i = 0; i < maxFramesToSend; i++) {
                        const idx = Math.min(Math.floor(i * step), frames.length - 1);
                        contentArr.push({ type: 'image_url', image_url: { url: frames[idx] } });
                    }
                    return { role: m.role, content: contentArr };
                } else {
                    const frameNote = m.fileType === 'video'
                        ? `\n[Video file "${m.fileName}" previously analyzed with ${frames.length} frames extracted from full duration]`
                        : `\n[Image file "${m.fileName}" previously analyzed]`;
                    return { role: m.role, content: contentStr + frameNote };
                }
            }

            return { role: m.role, content: contentStr };
        });

        messagesPayload = messagesPayload.concat(historyForAPI);

        const apiModel = requiresVision
            ? (CONFIG.aiSystem.visionModel || 'meta-llama/llama-4-scout-17b-16e-instruct')
            : CONFIG.aiSystem.model;

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.aiSystem.apiKey}`
            },
            body: JSON.stringify({ model: apiModel, messages: messagesPayload, temperature: 0.7, max_tokens: 2048 })
        });

        removeLoadingBubble(loadingId);

        if (!response.ok) {
            let errMsg = 'API Error';
            try {
                const errData = await response.json();
                errMsg = errData.error?.message || `API Error: ${response.status}`;
            } catch (e) {
                errMsg = `HTTP Error: ${response.status}`;
            }
            throw new Error(errMsg);
        }

        const data = await response.json();
        const aiReply = data.choices[0].message.content;
        const aiMsgId = 'msg_' + Date.now() + '_ai';
        const aiMsgObj = { id: aiMsgId, role: 'assistant', content: aiReply, timestamp: new Date().toISOString() };
        renderAIMessage(aiMsgObj);

        const sIdx = chatSessions.findIndex(s => s.id === sessId);
        if (sIdx !== -1) {
            chatSessions[sIdx].messages.push(aiMsgObj);
            saveSessions();
        }

    } catch (error) {
        removeLoadingBubble(loadingId);
        chatBox.insertAdjacentHTML('beforeend', `
            <div class="message ai">
                <div class="avatar ai"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="bubble" style="background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;">
                    <b>System Error:</b> ${escapeHtml(error.message)}
                </div>
            </div>`);
        scrollToBottom();
    }
}

function renderUserMessage(msg) {
    const timeStr = formatTime(new Date(msg.timestamp));
    let replyHTML = '';
    if (msg.replyTo) {
        const isImage = msg.replyTo.isImage && msg.replyTo.imageUrl;
        if (isImage) {
            replyHTML = `
                <div class="reply-context-bubble" onclick="scrollToMessage('${msg.replyTo.id}')">
                    <div class="reply-name"><i class="fas fa-reply"></i> ${msg.replyTo.role === 'user' ? 'Anda' : 'AXO AI'}</div>
                    <img src="${msg.replyTo.imageUrl}" alt="replied image" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-top:4px;border:1px solid rgba(96,165,250,0.3);">
                </div>`;
        } else {
            replyHTML = `
                <div class="reply-context-bubble" onclick="scrollToMessage('${msg.replyTo.id}')">
                    <div class="reply-name"><i class="fas fa-reply"></i> ${msg.replyTo.role === 'user' ? 'Anda' : 'AXO AI'}</div>
                    <div class="truncate">${escapeHtml(msg.replyTo.text)}</div>
                </div>`;
        }
    }

    const editedIcon = msg.isEdited ? '<span class="edited-label mr-1">diedit</span>' : '';
    const contentToDisplay = msg.displayHtml || escapeHtml(msg.content);

    let cleanText = msg.rawText !== undefined ? msg.rawText : msg.content.replace(/\[System Info:.*?\]/gs, '').trim();
    if (!cleanText && (msg.fileVisionFrames?.length > 0 || msg.fileVisionFrame)) cleanText = '';

    const fileTypeSafe = msg.fileType || 'image';
    const visionFrameSafe = (msg.fileVisionFrames && msg.fileVisionFrames[0]) || msg.fileVisionFrame || '';

    const html = `
        <div class="message user animate-fade-in-up" id="${msg.id}">
            <div class="bubble flex flex-col">
                <div class="msg-menu-container">
                    <div class="msg-actions-btn" onclick="toggleMsgMenu('${msg.id}')"><i class="fas fa-ellipsis-v text-xs"></i></div>
                    <div class="msg-dropdown" id="menu-${msg.id}">
                        <div class="msg-dropdown-item" onclick="activateReply('${msg.id}', '${escapeHtml(cleanText)}', 'user', '${visionFrameSafe}')"><i class="fas fa-reply"></i> Balas</div>
                        <div class="msg-dropdown-item" onclick="activateEdit('${msg.id}', '${escapeHtml(cleanText)}', '${visionFrameSafe}', '${fileTypeSafe}')"><i class="fas fa-edit"></i> Edit</div>
                        <div class="msg-dropdown-item delete" onclick="deleteMessage('${msg.id}')"><i class="fas fa-trash-alt"></i> Hapus</div>
                    </div>
                </div>
                ${replyHTML}${contentToDisplay}<span class="msg-time">${editedIcon}${timeStr}</span>
            </div>
            <div class="avatar user"><img src="../assets/images/profile.jpg" style="width:100%;height:100%;border-radius:10px;object-fit:cover;"></div>
        </div>`;
    chatBox.insertAdjacentHTML('beforeend', html);
}

function renderAIMessage(msg) {
    const timeStr = formatTime(new Date(msg.timestamp));
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
        <div class="message ai animate-fade-in-up" id="${msg.id}">
            <div class="avatar ai"><i class="fas fa-robot"></i></div>
            <div class="bubble markdown-body">
                <div class="content-raw"></div>
                <span class="msg-time">${timeStr}</span>
            </div>
        </div>`;

    let parsedHTML;
    try {
        parsedHTML = (typeof marked !== 'undefined') ? marked.parse(msg.content) : escapeHtml(msg.content);
    } catch (e) {
        parsedHTML = escapeHtml(msg.content);
    }

    tempDiv.querySelector('.content-raw').innerHTML = parsedHTML;
    chatBox.insertAdjacentHTML('beforeend', tempDiv.innerHTML);

    const containerEl = document.getElementById(msg.id);
    if (containerEl) {
        if (typeof hljs !== 'undefined') containerEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));

        containerEl.querySelectorAll('table').forEach(table => {
            if (!table.parentElement.classList.contains('table-scroll-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-scroll-wrapper';
                wrapper.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;border-radius:12px;margin:12px 0;';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });

        applyWatermarkToAIImages(containerEl);

        addMessageControls(containerEl, msg.content, msg.id);
    }
    scrollToBottom();
}

function applyWatermarkToAIImages(containerEl) {
    const images = containerEl.querySelectorAll('.content-raw img');
    images.forEach(img => {
        const src = img.src || img.getAttribute('src') || '';
        const isAIImage = src.includes('pollinations.ai') || src.includes('image.pollinations') || img.closest('a')?.href?.includes('pollinations');

        if (!isAIImage && !img.closest('[data-ai-image]')) return;

        img.style.display = 'block';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        img.style.cursor = 'pointer';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative;display:inline-block;max-width:100%;border-radius:12px;overflow:hidden;';
        wrapper.setAttribute('data-ai-image', '1');

        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        const wm = document.createElement('div');
        wm.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 10px;
            background: rgba(2, 6, 23, 0.72);
            color: rgba(255,255,255,0.92);
            font-size: 10px;
            font-weight: 800;
            font-family: 'Plus Jakarta Sans', sans-serif;
            letter-spacing: 1.5px;
            padding: 3px 9px;
            border-radius: 6px;
            pointer-events: none;
            user-select: none;
            border: 1px solid rgba(96,165,250,0.3);
            text-transform: uppercase;
            backdrop-filter: blur(4px);
        `;
        wm.textContent = 'AXO AI';
        wrapper.appendChild(wm);
    });
}

function addMessageControls(container, rawText, msgId) {
    const bubble = container.querySelector('.bubble');
    if (!bubble || bubble.querySelector('.msg-tools')) return;

    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'msg-tools';

    const menuContainer = document.createElement('div');
    menuContainer.style.position = 'relative';

    const replyImgEl = bubble.querySelector('img');
    const replyImageUrl = replyImgEl ? replyImgEl.src : null;

    menuContainer.innerHTML = `
        <div class="tool-btn" onclick="toggleMsgMenu('${msgId}')"><i class="fas fa-ellipsis-v"></i></div>
        <div class="msg-dropdown" id="menu-${msgId}">
            <div class="msg-dropdown-item" onclick="activateReply('${msgId}', '${escapeHtml(rawText.substring(0, 50))}', 'assistant'${replyImageUrl ? `, '${replyImageUrl}'` : ''})"><i class="fas fa-reply"></i> Balas</div>
        </div>
    `;

    const checkText = cleanTextForTTS(rawText);
    if (checkText.length > 0) {
        const ttsBtn = document.createElement('button');
        ttsBtn.className = 'tts-btn tool-btn';
        ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        ttsBtn.title = 'Putar / Jeda Suara';
        ttsBtn.onclick = () => window.toggleTTS(rawText, msgId);
        toolsDiv.appendChild(ttsBtn);
    }

    toolsDiv.appendChild(menuContainer);
    bubble.appendChild(toolsDiv);

    container.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.code-toolbar')) return;

        const toolBar = document.createElement('div');
        toolBar.className = 'code-toolbar absolute top-3 right-3 flex gap-2 z-10';

        const btnPreview = document.createElement('button');
        btnPreview.className = 'flex items-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#60a5fa] hover:text-white border border-[#334155] hover:border-[#60a5fa]/50 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest shadow-md';
        btnPreview.innerHTML = '<i class="fas fa-expand"></i> Preview';
        btnPreview.onclick = () => {
            const codeEl = pre.querySelector('code');
            const codeText = codeEl ? codeEl.innerText : pre.innerText;
            window.openCodePreview(codeText, codeEl ? codeEl.className : '');
        };

        const btnCopy = document.createElement('button');
        btnCopy.className = 'flex items-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#60a5fa] hover:text-white border border-[#334155] hover:border-[#60a5fa]/50 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest shadow-md';
        btnCopy.innerHTML = '<i class="fas fa-copy"></i> Salin';
        btnCopy.onclick = () => navigator.clipboard.writeText(pre.innerText).then(() => {
            btnCopy.innerHTML = '<i class="fas fa-check text-green-400"></i> Disalin';
            setTimeout(() => btnCopy.innerHTML = '<i class="fas fa-copy"></i> Salin', 2000);
        });

        toolBar.appendChild(btnPreview);
        toolBar.appendChild(btnCopy);
        pre.appendChild(toolBar);
    });
}

window.toggleMsgMenu = function(id) {
    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.message').forEach(m => m.classList.remove('z-active'));
    const menu = document.getElementById(`menu-${id}`);
    const parent = document.getElementById(id);
    if (menu && parent) { menu.classList.add('active'); parent.classList.add('z-active'); }
};

window.activateReply = function(id, text, role, imageUrl) {
    currentMode = 'reply';
    const isImage = !!imageUrl;
    let cleanText = text.replace(/\[System Info:.*?\]/gs, '').trim();
    if (!cleanText && isImage) cleanText = 'Media File';
    targetMsgId = { id, text: cleanText, role, isImage, imageUrl: imageUrl || null };

    if (replyPreview) {
        replyPreview.classList.remove('hidden');
        replyPreview.classList.add('flex');
        replyPreview.style.borderLeftColor = '#60a5fa';
        replyToName.innerText = role === 'user' ? 'Membalas Diri Sendiri' : 'Membalas Awang AI';
        replyToName.style.color = '';
        if (isImage && imageUrl) {
            replyTextEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><img src="${imageUrl}" alt="replied image" style="width:30px;height:30px;object-fit:cover;border-radius:4px;border:1px solid rgba(96,165,250,0.3);"><span class="truncate">${cleanText}</span></div>`;
        } else {
            replyTextEl.textContent = cleanText.substring(0, 60) + (cleanText.length > 60 ? '...' : '');
        }
    }

    const menuEl = document.getElementById(`menu-${id}`);
    if (menuEl) menuEl.classList.remove('active');
    const parentEl = document.getElementById(id);
    if (parentEl) parentEl.classList.remove('z-active');

    userPrompt.focus();
};

window.activateEdit = function(id, text, visionFrame, fileType) {
    currentMode = 'edit';
    targetMsgId = id;

    const sessionIdx = chatSessions.findIndex(s => s.id === currentSessionId);
    let latestRawText = text;
    let latestVisionFrames = [];
    let latestVisionFrame = visionFrame || null;
    let latestFileType = fileType || null;
    let latestFileName = null;
    let latestFileText = null;
    let latestFileDataUrl = null;

    if (sessionIdx !== -1) {
        const msgObj = chatSessions[sessionIdx].messages.find(m => m.id === id);
        if (msgObj) {
            latestRawText = msgObj.rawText !== undefined ? msgObj.rawText : '';
            latestVisionFrames = msgObj.fileVisionFrames ? [...msgObj.fileVisionFrames] : [];
            latestVisionFrame = (latestVisionFrames[0]) || msgObj.fileVisionFrame || null;
            latestFileType = msgObj.fileType || null;
            latestFileName = msgObj.fileName || null;
            latestFileText = msgObj.fileText || null;
            latestFileDataUrl = msgObj.fileDataUrl || null;
        }
    }

    userPrompt.value = latestRawText;
    userPrompt.style.height = 'auto';
    userPrompt.style.height = Math.min(userPrompt.scrollHeight, 120) + 'px';
    userPrompt.focus();

    if (latestFileType && (latestVisionFrame || latestFileText)) {
        selectedAIVisionFrames = latestVisionFrames.length > 0 ? latestVisionFrames : (latestVisionFrame ? [latestVisionFrame] : []);
        selectedAIFileType = latestFileType;
        selectedAIFileText = latestFileText;
        selectedAIFileDataUrl = latestFileDataUrl;

        filePreviewContainer.innerHTML = '';
        const previewEl = document.createElement('div');
        previewEl.className = 'preview-item';

        if (latestFileType === 'image' && latestVisionFrame) {
            previewEl.innerHTML = `<img src="${latestVisionFrame}" alt="preview">`;
        } else if (latestFileType === 'video' && latestVisionFrame) {
            previewEl.innerHTML = `
                <div style="position:relative;width:100%;height:100%;">
                    <img src="${latestVisionFrame}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:11px;">
                    <div style="position:absolute;bottom:2px;left:2px;background:rgba(0,0,0,0.7);color:#60a5fa;font-size:7px;font-weight:800;padding:2px 4px;border-radius:3px;">${latestVisionFrames.length} frame</div>
                </div>`;
        } else {
            previewEl.innerHTML = `<div class="file-icon"><i class="fas fa-file-alt"></i></div>`;
        }

        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-preview-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = clearAIFileSelection;
        previewEl.appendChild(removeBtn);
        filePreviewContainer.appendChild(previewEl);
        filePreviewContainer.classList.add('active');
    } else {
        clearAIFileSelection();
    }

    if (replyPreview) {
        replyPreview.classList.remove('hidden');
        replyPreview.classList.add('flex');
        replyPreview.style.borderLeftColor = '#eab308';
        replyToName.innerText = 'MENGEDIT PESAN';
        replyToName.style.color = '#eab308';
        const previewText = latestRawText
            ? (latestRawText.substring(0, 60) + (latestRawText.length > 60 ? '...' : ''))
            : (latestFileType ? 'Media Attachment' : '');
        replyTextEl.textContent = previewText;
    }

    sendBtn.innerHTML = '<i class="fas fa-check"></i>';
    sendBtn.classList.add('edit-mode-btn');
    if (inputBoxContainer) inputBoxContainer.classList.add('editing');

    const menuEl = document.getElementById(`menu-${id}`);
    if (menuEl) menuEl.classList.remove('active');
    const parentEl = document.getElementById(id);
    if (parentEl) parentEl.classList.remove('z-active');
};

window.resetInputMode = function() {
    currentMode = 'normal';
    targetMsgId = null;
    if (replyPreview) { replyPreview.classList.add('hidden'); replyPreview.classList.remove('flex'); }
    if (replyToName) replyToName.style.color = '';
    sendBtn.innerHTML = '<i class="fas fa-paper-plane text-xs"></i>';
    sendBtn.classList.remove('edit-mode-btn');
    if (inputBoxContainer) inputBoxContainer.classList.remove('editing');
};

window.cancelReply = function() { window.resetInputMode(); userPrompt.value = ''; clearAIFileSelection(); };

window.scrollToMessage = function(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'background 0.3s';
        el.style.background = 'rgba(96,165,250,0.08)';
        setTimeout(() => { el.style.background = ''; }, 1200);
    }
};

window.deleteMessage = function(id) {
    const sessionIdx = chatSessions.findIndex(s => s.id === currentSessionId);
    if (sessionIdx === -1) return;

    Swal.fire({
        html: `
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa]"></div>
            <h3 class="text-xl font-black text-center mt-4 mb-4 uppercase text-[#f8fafc] tracking-wide">Hapus Pesan?</h3>
            <p class="text-sm text-gray-400 mb-6 font-medium">Pesan yang dihapus tidak bisa dikembalikan!</p>
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
            chatSessions[sessionIdx].messages = chatSessions[sessionIdx].messages.filter(m => m.id !== id);
            saveSessions();
            const el = document.getElementById(id);
            if (el) el.remove();
        }
    });
};

function loadSession(id) {
    stopTTS();
    const session = chatSessions.find(s => s.id === id);
    if (!session) return;
    currentSessionId = id;
    localStorage.setItem('last_active_session', id);
    if (emptyState) emptyState.style.display = 'none';
    chatBox.innerHTML = '';

    clearAIFileSelection();
    resetInputMode();
    userPrompt.value = '';
    userPrompt.style.height = 'auto';

    session.messages.forEach(msg => {
        if (msg.role === 'user') renderUserMessage(msg);
        else if (msg.role === 'assistant') renderAIMessage(msg);
    });

    renderSidebarHistory();
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }
    setTimeout(() => { scrollToBottom(); adjustSafeZone(); }, 100);
}

window.startNewChat = function(doCloseSidebar = true) {
    stopTTS();
    currentSessionId = null;
    chatBox.innerHTML = '';
    if (emptyState) { emptyState.style.display = 'flex'; chatBox.appendChild(emptyState); }
    document.querySelectorAll('.history-session-item').forEach(el => el.classList.remove('active'));
    localStorage.removeItem('last_active_session');
    if (doCloseSidebar) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    clearAIFileSelection();
    resetInputMode();
    userPrompt.value = '';
    userPrompt.style.height = 'auto';

    pastedNoteItems = [];
    const notesArea = document.getElementById('pastedNotesArea');
    if (notesArea) notesArea.remove();

    adjustSafeZone();
};

function renderSidebarHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';
    chatSessions.forEach(session => {
        const isActive = session.id === currentSessionId ? 'active' : '';
        const div = document.createElement('div');
        div.className = `history-session-item ${isActive}`;
        div.onclick = (e) => { if (e.target.closest('.history-del-btn')) return; loadSession(session.id); };
        div.innerHTML = `<i class="far fa-message text-xs"></i><div class="history-title">${escapeHtml(session.title)}</div><button class="history-del-btn" onclick="window.deleteSession('${session.id}')"><i class="fas fa-trash-alt text-[10px]"></i></button>`;
        historyList.appendChild(div);
    });
}

window.deleteSession = function(id) {
    stopTTS();
    chatSessions = chatSessions.filter(s => s.id !== id);
    saveSessions();
    if (currentSessionId === id) window.startNewChat(false);
    renderSidebarHistory();
};

window.clearAllHistory = function() {
    stopTTS();
    chatSessions = [];
    localStorage.removeItem('chat_sessions_v2');
    localStorage.removeItem('last_active_session');
    saveSessions();
    window.startNewChat(false);
    renderSidebarHistory();
};

window.clearCurrentChat = function() {
    if (!currentSessionId) { userPrompt.value = ''; return; }

    Swal.fire({
        html: `
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa]"></div>
            <h3 class="text-xl font-black text-center mt-4 mb-4 uppercase text-[#f8fafc] tracking-wide">Hapus Sesi Ini?</h3>
            <p class="text-sm text-gray-400 mb-6 font-medium">Seluruh riwayat chat di sesi ini akan hilang!</p>
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
            chatSessions = chatSessions.filter(s => s.id !== currentSessionId);
            saveSessions();
            window.startNewChat(false);
            renderSidebarHistory();
        }
    });
};

function formatTime(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const h = String(dateObj.getHours()).padStart(2, '0');
    const m = String(dateObj.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function saveSessions() {
    localStorage.setItem('chat_sessions_v2', JSON.stringify(chatSessions));
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function scrollToBottom() {
    if (chatBox) setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);
}