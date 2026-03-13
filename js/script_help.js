// =========================================
// FILE: js/script_help.js
// =========================================

import {
    getDatabase,
    ref,
    push,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const db = getDatabase();
const ticketsRef = ref(db, 'siteDataV4/tickets');

const ADMIN_EMAIL = "awangcustomerservice@gmail.com";

// =========================================
// SIDEBAR KHUSUS ADMIN
// =========================================
function renderAdminSidebar() {
    const sidebar = document.getElementById('sidebarContent');
    if(!sidebar) return;

    const adminContacts = [
        { name: "WhatsApp Admin", icon: "fab fa-whatsapp", link: "https://wa.me/6281234567890" },
        { name: "Telegram Admin", icon: "fab fa-telegram", link: "https://t.me/awangoffc" },
        { name: "YouTube Channel", icon: "fab fa-youtube", link: "https://www.youtube.com/@AwangOfc" }
    ];

    let html = `<div class="px-2 space-y-2 mt-4">`;

    html += `<div class="px-4 mb-2 text-[10px] font-bold text-[#60a5fa] uppercase tracking-widest opacity-80">Direct Contact</div>`;

    adminContacts.forEach(c => {
        html += `
        <a href="${c.link}" target="_blank" onclick="playSfx('pop')" class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/50 transition-all group">
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <i class="${c.icon} text-sm"></i>
            </div>
            <span class="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors uppercase tracking-wide">${c.name}</span>
        </a>`;
    });

    html += `</div>
    <div class="mt-auto pt-8 px-4 text-center opacity-40 mb-6">
        <p class="text-[9px] uppercase tracking-widest font-bold text-slate-500">Awang System V4.0</p>
        <p class="text-[8px] text-slate-600 mt-1">© 2026 All Rights Reserved</p>
    </div>`;

    sidebar.innerHTML = html;
}

setTimeout(renderAdminSidebar, 500);

// =========================================
// LOGIKA INTERAKSI & PENGIRIMAN
// =========================================
window.currentCategory = 'bug';

window.selectCategory = (cat) => {
    window.currentCategory = cat;

    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));

    const targetBtn = document.getElementById(`cat-${cat}`);
    if(targetBtn) targetBtn.classList.add('active');

    if(typeof playSfx === 'function') playSfx('pop');
};

window.submitTicket = async () => {
    const name = document.getElementById('ticketName').value.trim();
    const msg = document.getElementById('ticketMsg').value.trim();
    const btn = document.getElementById('submitTicketBtn');

    if (!navigator.onLine) {
        if(typeof showToast === 'function') showToast("Koneksi terputus! Tidak dapat mengirim laporan.", "warning");
        return;
    }

    if (!name || !msg) {
        if(typeof showToast === 'function') showToast("Isi nama & pesan dulu bang!", "info");
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SENDING...';

    const ticketId = 'T-' + Math.floor(1000 + Math.random() * 9000);

    try {
        await push(ticketsRef, {
            ticketId: ticketId,
            name: name,
            message: msg,
            category: window.currentCategory,
            status: 'pending',
            timestamp: serverTimestamp(),
            device: navigator.userAgent
        });
    } catch (e) {
        console.error("Firebase Error (Non-Fatal):", e);
    }

    try {
        const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: `LAPORAN BARU: ${name} [${ticketId}]`,
                _template: "table",
                _captcha: "false",
                User: name,
                Pesan: msg,
                Kategori: window.currentCategory.toUpperCase(),
                ID_Ticket: ticketId
            })
        });

        if (response.ok) {
            if(typeof showToast === 'function') showToast("Laporan Berhasil Terkirim!", "success");
            if(typeof playSfx === 'function') playSfx('success');

            document.getElementById('ticketMsg').value = '';

            btn.innerHTML = '<i class="fas fa-check"></i> SUKSES';
            btn.className = "w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2";
        } else {
            throw new Error("Server Reject");
        }

    } catch (err) {
        console.warn("Email API Fail, Fallback to WA");
        if(typeof showToast === 'function') showToast("Gagal email, dialihkan ke WA...", "warning");

        setTimeout(() => {
            const waText = `*LAPORAN WEBSITE (FALLBACK)*%0A%0ANama: ${name}%0APesan: ${msg}%0AKategori: ${window.currentCategory.toUpperCase()}`;
            const waLink = `https://wa.me/6281234567890?text=${waText}`;
            window.open(waLink, '_blank');
        }, 1500);

    } finally {
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.className = "w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2";
        }, 3000);
    }
};
