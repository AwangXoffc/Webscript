// =========================================
// FILE: js/script_ai.js
// =========================================

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

let chatSessions = JSON.parse(localStorage.getItem('chat_sessions_v2') || "[]");
let currentSessionId = null;
let currentMode = 'normal';
let targetMsgId = null;
let ttsState = { msgId: null, isSpeaking: false, isPaused: false, utterance: null };
let voices = [];
window.wasOfflineAi = false; 

// =========================================
// SYSTEM INIT
// =========================================
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
        userPrompt.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        userPrompt.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }

    if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', openSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    if (btnNewChat) btnNewChat.addEventListener('click', () => startNewChat(true));
    if (btnClearHistory) btnClearHistory.addEventListener('click', clearAllHistory);
    if (btnResetSession) btnResetSession.addEventListener('click', clearCurrentChat);
    if (btnCancelReply) btnCancelReply.addEventListener('click', resetInputMode);

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.msg-menu-container') && !e.target.closest('.msg-tools')) {
            document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.remove('active'));
            document.querySelectorAll('.message').forEach(m => m.classList.remove('z-active'));
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

// =========================================
// CORE LOGIC (SIDEBAR & UI)
// =========================================
function openSidebar() {
    if(sidebar) sidebar.classList.add('active');
    if(overlay) overlay.classList.add('active');
}

function closeSidebar() {
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.classList.remove('active');
}

function updateOnlineStatus() {
    if (!statusDot || !statusText) return;
    if (navigator.onLine) {
        statusDot.className = "w-1.5 h-1.5 rounded-full status-online animate-pulse";
        statusText.innerText = "ONLINE"; statusText.style.color = "#60a5fa";
        if (window.wasOfflineAi) {
            if(typeof showToast === 'function') showToast("Koneksi AI Terhubung Kembali", "success");
            window.wasOfflineAi = false;
        }
    } else {
        statusDot.className = "w-1.5 h-1.5 rounded-full status-offline";
        statusText.innerText = "OFFLINE"; statusText.style.color = "#ef4444";
        if (!window.wasOfflineAi) {
            if(typeof showToast === 'function') showToast("Koneksi AI Terputus!", "warning");
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
    if(appContainer) appContainer.style.height = `${viewportHeight}px`;
}

function loadVoices() {
    if ('speechSynthesis' in window) {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); };
    }
}

// =========================================
// CHAT LOGIC (SEND, EDIT, REPLY)
// =========================================
async function sendMessage() {
    const userText = userPrompt.value.trim();
    if (!userText) return;

    if (!navigator.onLine) {
        Swal.fire({ toast: true, position: 'top', icon: 'error', title: 'Offline!', showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#fff' });
        return;
    }

    if (currentMode === 'edit' && targetMsgId) {
        handleEditSubmit(targetMsgId, userText);
        return;
    }

    userPrompt.value = "";
    userPrompt.style.height = 'auto';
    const replyContextData = (currentMode === 'reply') ? { ...targetMsgId } : null;
    resetInputMode();

    if (!currentSessionId) {
        currentSessionId = 'sess_' + Date.now();
        const newTitle = userText.length > 30 ? userText.substring(0, 30) + "..." : userText;
        chatSessions.unshift({ id: currentSessionId, title: newTitle, messages: [], timestamp: Date.now() });
        saveSessions();
        renderSidebarHistory();
        if (emptyState) emptyState.style.display = 'none';
    }

    const now = new Date();
    const msgId = 'msg_' + Date.now();
    const msgObj = { id: msgId, role: "user", content: userText, timestamp: now.toISOString(), replyTo: replyContextData };

    renderUserMessage(msgObj);
    scrollToBottom();

    let sessionIdx = chatSessions.findIndex(s => s.id === currentSessionId);
    if(sessionIdx !== -1) { chatSessions[sessionIdx].messages.push(msgObj); saveSessions(); }

    await getAIResponse(currentSessionId, false);
}

async function handleEditSubmit(msgId, newText) {
    const sessionIdx = chatSessions.findIndex(s => s.id === currentSessionId);
    if (sessionIdx === -1) return;

    const msgIdx = chatSessions[sessionIdx].messages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    chatSessions[sessionIdx].messages[msgIdx].content = newText;
    chatSessions[sessionIdx].messages[msgIdx].isEdited = true;
    saveSessions();

    const msgEl = document.getElementById(msgId);
    if (msgEl) {
        const bubbleContent = msgEl.querySelector('.bubble');
        const replyEl = bubbleContent.querySelector('.reply-context-bubble');
        const menuEl = bubbleContent.querySelector('.msg-menu-container');
        const replyHTML = replyEl ? replyEl.outerHTML : '';
        const menuHTML = menuEl ? menuEl.outerHTML : '';
        const timeStr = formatTime(new Date(chatSessions[sessionIdx].messages[msgIdx].timestamp));

        bubbleContent.innerHTML = `${menuHTML}${replyHTML}${escapeHtml(newText)}<span class="msg-time"><span class="edited-label mr-1">diedit</span>${timeStr}</span>`;
    }

    userPrompt.value = "";
    userPrompt.style.height = 'auto';
    resetInputMode();

    const nextMsg = chatSessions[sessionIdx].messages[msgIdx + 1];
    if (nextMsg && nextMsg.role === 'assistant') {
        const aiEl = document.getElementById(nextMsg.id);
        if (aiEl) aiEl.remove();
        chatSessions[sessionIdx].messages.splice(msgIdx + 1, 1);
        saveSessions();
    }

    await getAIResponse(currentSessionId, true);
}

async function getAIResponse(sessId, isEditResponse) {
    const loadingId = "loading-" + Date.now();
    const loadingBubble = `<div class="message ai animate-fade-in-up" id="${loadingId}"><div class="avatar ai"><i class="fas fa-robot"></i></div><div class="bubble typing-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>`;
    chatBox.insertAdjacentHTML('beforeend', loadingBubble);
    scrollToBottom();

    try {
        const GROQ_URL = CONFIG.aiSystem.baseUrl;
        const activeSession = chatSessions.find(s => s.id === sessId);
        if (!activeSession) throw new Error("Sesi hilang");

        let messagesPayload = [{ role: "system", content: CONFIG.aiSystem.systemInstruction }];
        if (isEditResponse) messagesPayload.push({ role: "system", content: "User mengedit pesan terakhirnya." });

        const historyForAPI = activeSession.messages.map(m => {
            let content = m.content;
            if(m.replyTo) content = `[Reply: "${m.replyTo.text}"]: ${content}`;
            return { role: m.role, content: content };
        });
        messagesPayload = messagesPayload.concat(historyForAPI);

        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${CONFIG.aiSystem.apiKey}` },
            body: JSON.stringify({ model: CONFIG.aiSystem.model, messages: messagesPayload, temperature: 0.7 })
        });

        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        const aiReply = data.choices[0].message.content;
        const aiMsgId = 'msg_' + Date.now() + '_ai';
        const aiMsgObj = { id: aiMsgId, role: "assistant", content: aiReply, timestamp: new Date().toISOString() };

        renderAIMessage(aiMsgObj);

        const sIdx = chatSessions.findIndex(s => s.id === sessId);
        if(sIdx !== -1) { chatSessions[sIdx].messages.push(aiMsgObj); saveSessions(); }

    } catch (error) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        chatBox.insertAdjacentHTML('beforeend', `<div class="message ai"><div class="avatar ai"><i class="fas fa-exclamation-triangle"></i></div><div class="bubble" style="background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;"><b>ERROR:</b> ${error.message}</div></div>`);
        scrollToBottom();
    }
}

// =========================================
// RENDERERS
// =========================================
function renderUserMessage(msg) {
    const timeStr = formatTime(new Date(msg.timestamp));
    const replyHTML = msg.replyTo ? `<div class="reply-context-bubble"><div class="reply-name"><i class="fas fa-reply"></i> ${msg.replyTo.role === 'user' ? 'Anda' : 'Awang AI'}</div><div class="truncate">${escapeHtml(msg.replyTo.text)}</div></div>` : '';
    const editedIcon = msg.isEdited ? '<span class="edited-label mr-1">diedit</span>' : '';

    const html = `
        <div class="message user animate-fade-in-up" id="${msg.id}">
            <div class="bubble">
                <div class="msg-menu-container">
                    <div class="msg-actions-btn" onclick="toggleMsgMenu('${msg.id}')"><i class="fas fa-ellipsis-v text-xs"></i></div>
                    <div class="msg-dropdown" id="menu-${msg.id}">
                        <div class="msg-dropdown-item" onclick="activateReply('${msg.id}', '${escapeHtml(msg.content)}', 'user')"><i class="fas fa-reply"></i> Balas</div>
                        <div class="msg-dropdown-item" onclick="activateEdit('${msg.id}', '${escapeHtml(msg.content)}')"><i class="fas fa-edit"></i> Edit</div>
                        <div class="msg-dropdown-item delete" onclick="deleteMessage('${msg.id}')"><i class="fas fa-trash-alt"></i> Hapus</div>
                    </div>
                </div>
                ${replyHTML}${escapeHtml(msg.content)}<span class="msg-time">${editedIcon}${timeStr}</span>
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
    try { parsedHTML = (typeof marked !== 'undefined') ? marked.parse(msg.content) : escapeHtml(msg.content); } catch (e) { parsedHTML = escapeHtml(msg.content); }
    tempDiv.querySelector('.content-raw').innerHTML = parsedHTML;
    chatBox.insertAdjacentHTML('beforeend', tempDiv.innerHTML);

    const containerEl = document.getElementById(msg.id);
    if (containerEl && typeof hljs !== 'undefined') containerEl.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
    if (containerEl) addMessageControls(containerEl, msg.content, msg.id);

    scrollToBottom();
}

// =========================================
// PRO TTS & TOOLS
// =========================================
function updateTTSIcon(msgId, status) {
    document.querySelectorAll('.tts-btn').forEach(btn => {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    });

    if (msgId && status === 'playing') {
        const activeBtn = document.querySelector(`#${msgId} .tts-btn`);
        if (activeBtn) {
            activeBtn.classList.add('playing');
            activeBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    } else if (msgId && status === 'paused') {
        const activeBtn = document.querySelector(`#${msgId} .tts-btn`);
        if (activeBtn) {
            activeBtn.classList.remove('playing');
            activeBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
}

function stopTTS() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    ttsState.isSpeaking = false;
    ttsState.isPaused = false;
    ttsState.msgId = null;
    updateTTSIcon(null, 'stopped');
}

function getBestVoice(langCode) {
    return voices.find(v => v.lang === langCode && v.name.includes('Google')) ||
           voices.find(v => v.lang === langCode && v.name.includes('Microsoft')) ||
           voices.find(v => v.lang === langCode) ||
           voices.find(v => v.lang.includes(langCode.split('-')[0])) ||
           voices[0];
}

window.toggleTTS = function(rawText, msgId) {
    if (!('speechSynthesis' in window)) {
        Swal.fire('Error', 'Perangkat tidak mendukung suara', 'error');
        return;
    }

    if (ttsState.msgId === msgId && ttsState.isPaused) {
        window.speechSynthesis.resume();
        ttsState.isPaused = false;
        ttsState.isSpeaking = true;
        updateTTSIcon(msgId, 'playing');
        return;
    }

    if (ttsState.msgId === msgId && ttsState.isSpeaking) {
        window.speechSynthesis.pause();
        ttsState.isPaused = true;
        ttsState.isSpeaking = false;
        updateTTSIcon(msgId, 'paused');
        return;
    }

    stopTTS();

    const cleanText = rawText
        .replace(/```[\s\S]*?```/g, 'Kode program disembunyikan.')
        .replace(/[*#_>~\-]/g, ' ')
        .replace(/https?:\/\/\S+/g, 'Link.')
        .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    const englishWords = ['the', 'is', 'a', 'and', 'to', 'in', 'it', 'you', 'that', 'code'];
    const wordArr = cleanText.toLowerCase().split(/\s+/);
    const engCount = wordArr.filter(w => englishWords.includes(w)).length;
    const lang = engCount > 3 ? 'en-US' : 'id-ID';

    utterance.lang = lang;
    utterance.voice = getBestVoice(lang);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
        ttsState.msgId = msgId;
        ttsState.isSpeaking = true;
        ttsState.isPaused = false;
        updateTTSIcon(msgId, 'playing');
    };

    utterance.onend = () => {
        stopTTS();
    };

    utterance.onerror = () => {
        stopTTS();
    };

    window.speechSynthesis.speak(utterance);
};

function addMessageControls(container, rawText, msgId) {
    const bubble = container.querySelector('.bubble');
    if(!bubble || bubble.querySelector('.msg-tools')) return;

    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'msg-tools';

    const menuContainer = document.createElement('div');
    menuContainer.style.position = 'relative';
    menuContainer.innerHTML = `
        <div class="tool-btn" onclick="toggleMsgMenu('${msgId}')"><i class="fas fa-ellipsis-v"></i></div>
        <div class="msg-dropdown" id="menu-${msgId}">
            <div class="msg-dropdown-item" onclick="activateReply('${msgId}', '${escapeHtml(rawText.substring(0,50))}', 'assistant')"><i class="fas fa-reply"></i> Balas</div>
        </div>
    `;

    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'tts-btn tool-btn';
    ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    ttsBtn.onclick = () => window.toggleTTS(rawText, msgId);

    toolsDiv.appendChild(ttsBtn);
    toolsDiv.appendChild(menuContainer);
    bubble.appendChild(toolsDiv);

    container.querySelectorAll('pre').forEach(pre => {
        if(pre.querySelector('.copy-btn')) return;
        const btn = document.createElement('button'); btn.className = 'copy-btn'; btn.innerHTML = '<i class="fas fa-copy"></i> Salin';
        btn.onclick = () => navigator.clipboard.writeText(pre.innerText).then(() => { btn.innerHTML = '<i class="fas fa-check"></i>'; setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i> Salin', 2000); });
        pre.appendChild(btn);
    });
}

// =========================================
// UTILS STANDARD
// =========================================
window.toggleMsgMenu = function(id) {
    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.message').forEach(m => m.classList.remove('z-active'));
    const menu = document.getElementById(`menu-${id}`);
    const parent = document.getElementById(id);
    if(menu && parent) { menu.classList.add('active'); parent.classList.add('z-active'); }
};

window.activateReply = function(id, text, role) {
    currentMode = 'reply'; targetMsgId = { id, text, role };
    if(replyPreview) {
        replyPreview.classList.remove('hidden'); replyPreview.classList.add('flex');
        replyPreview.style.borderLeftColor = "#60a5fa";
        replyToName.innerText = role === 'user' ? "Membalas Diri Sendiri" : "Membalas Awang AI";
        replyTextEl.innerText = text.substring(0, 60) + "...";
    }
    document.getElementById(`menu-${id}`).classList.remove('active');
    document.getElementById(id).classList.remove('z-active');
    userPrompt.focus();
};

window.activateEdit = function(id, text) {
    currentMode = 'edit'; targetMsgId = id;
    userPrompt.value = text; userPrompt.focus();
    if(replyPreview) {
        replyPreview.classList.remove('hidden'); replyPreview.classList.add('flex');
        replyPreview.style.borderLeftColor = "#eab308";
        replyToName.innerText = "MENGEDIT PESAN"; replyToName.style.color = "#eab308";
        replyTextEl.innerText = text.substring(0, 60) + "...";
    }
    sendBtn.innerHTML = '<i class="fas fa-check"></i>';
    sendBtn.classList.add('edit-mode-btn');
    if(inputBoxContainer) inputBoxContainer.classList.add('editing');
    document.getElementById(`menu-${id}`).classList.remove('active');
    document.getElementById(id).classList.remove('z-active');
};

window.resetInputMode = function() {
    currentMode = 'normal'; targetMsgId = null;
    if(replyPreview) { replyPreview.classList.add('hidden'); replyPreview.classList.remove('flex'); }
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    sendBtn.classList.remove('edit-mode-btn');
    if(inputBoxContainer) inputBoxContainer.classList.remove('editing');
};

window.cancelReply = function() { window.resetInputMode(); userPrompt.value = ""; };

window.deleteMessage = function(id) {
    const sessionIdx = chatSessions.findIndex(s => s.id === currentSessionId);
    if(sessionIdx === -1) return;
    Swal.fire({
        title: 'Hapus Pesan?', icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Ya', background: '#020617', color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            chatSessions[sessionIdx].messages = chatSessions[sessionIdx].messages.filter(m => m.id !== id);
            saveSessions();
            const el = document.getElementById(id);
            if(el) el.remove();
        }
    });
};

function loadSession(id) {
    stopTTS();
    const session = chatSessions.find(s => s.id === id);
    if (!session) return;
    currentSessionId = id; localStorage.setItem('last_active_session', id);
    if (emptyState) emptyState.style.display = 'none';
    chatBox.innerHTML = '';
    session.messages.forEach(msg => { if (msg.role === 'user') renderUserMessage(msg); else if (msg.role === 'assistant') renderAIMessage(msg); });
    renderSidebarHistory();
    if (window.innerWidth < 768) { document.getElementById('sidebar').classList.remove('active'); document.getElementById('overlay').classList.remove('active'); }
    setTimeout(() => { scrollToBottom(); adjustSafeZone(); }, 100);
}

window.startNewChat = function(closeSidebar = true) {
    stopTTS();
    currentSessionId = null; chatBox.innerHTML = '';
    if (emptyState) { emptyState.style.display = 'flex'; chatBox.appendChild(emptyState); }
    document.querySelectorAll('.history-session-item').forEach(el => el.classList.remove('active'));
    localStorage.removeItem('last_active_session');

    if (closeSidebar) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }
    adjustSafeZone();
};

function renderSidebarHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';
    chatSessions.forEach(session => {
        const isActive = session.id === currentSessionId ? 'active' : '';
        const div = document.createElement('div');
        div.className = `history-session-item ${isActive}`;
        div.onclick = (e) => { if(e.target.closest('.history-del-btn')) return; loadSession(session.id); };
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
    Swal.fire({ title: 'Hapus Sesi Ini?', text: "Chat ini akan hilang.", icon: 'question', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Hapus', background: '#020617', color: '#f8fafc' }).then((result) => {
        if (result.isConfirmed) { chatSessions = chatSessions.filter(s => s.id !== currentSessionId); saveSessions(); window.startNewChat(false); renderSidebarHistory(); }
    });
};

function formatTime(dateObj) { if (!dateObj || isNaN(dateObj.getTime())) return ""; const h = String(dateObj.getHours()).padStart(2, '0'); const m = String(dateObj.getMinutes()).padStart(2, '0'); return `${h}:${m}`; }
function saveSessions() { localStorage.setItem('chat_sessions_v2', JSON.stringify(chatSessions)); }
function escapeHtml(text) { if (!text) return text; return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function scrollToBottom() { if (chatBox) setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100); }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
if(userPrompt) {
    userPrompt.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            window.sendMessage();
        }
    });
}
