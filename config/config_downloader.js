const DL_CONFIG = {
    system: {
        appName: "AXO TOOLS PLATFORM",
        version: "9.1.0 (Ultimate Advanced Scraper Engine)",
        maintenance: false
    },
    tools: [
        {
            id: "tiktok",
            category: "downloader",
            name: "TikTok Downloader",
            icon: "tiktok",
            color: "#ff0050",
            desc: "Ekstrak video & slide TikTok resolusi tinggi (HD) tanpa watermark beserta metadata komprehensif."
        },
        {
            id: "instagram",
            category: "downloader",
            name: "Instagram Downloader",
            icon: "instagram",
            color: "#E1306C",
            desc: "Simpan Reels, Post, IGTV, dan Story dari Instagram pada kualitas original."
        },
        {
            id: "youtube",
            category: "downloader",
            name: "YouTube Downloader",
            icon: "youtube",
            color: "#ff0000",
            desc: "Unduh video YouTube pada berbagai resolusi atau ekstrak thumbnail langsung."
        },
        {
            id: "facebook",
            category: "downloader",
            name: "Facebook Downloader",
            icon: "facebook",
            color: "#1877F2",
            desc: "Dapatkan video dari platform Facebook publik. Ekstrak pada kualitas SD maupun HD."
        },
        {
            id: "remove_bg",
            category: "image",
            name: "Remove Background AI",
            icon: "image",
            color: "#a855f7",
            desc: "Hapus background gambar dengan AI instan dan unduh dalam berbagai resolusi HD."
        },
        {
            id: "ai_caption",
            category: "ai",
            name: "AI Caption Gen",
            icon: "robot",
            color: "#60a5fa",
            desc: "Hasilkan ide caption sosial media canggih secara otomatis berdasarkan AI."
        },
        {
            id: "qr_gen",
            category: "utility",
            name: "QR Code Generator",
            icon: "qrcode",
            color: "#34d399",
            desc: "Ciptakan kode QR modern untuk link atau teks yang dibagikan secara universal."
        },
        {
            id: "uuid_gen",
            category: "utility",
            name: "UUID v4 Generator",
            icon: "fingerprint",
            color: "#8b5cf6",
            desc: "Generate identifier UUID versi 4 yang sangat unik, acak, dan terenkripsi."
        },
        {
            id: "password_gen",
            category: "utility",
            name: "Password Generator",
            icon: "key",
            color: "#f59e0b",
            desc: "Rangkai password kuat dari kombinasi karakter alfa-numerik dan simbol spesial."
        }
    ],
    apis: {
        tiktok: [
            { url: "https://api.siputzx.my.id/api/d/tiktok?url={URL}", method: "GET" },
            { url: "https://api.ryzendesu.vip/api/downloader/ttdl?url={URL}", method: "GET" },
            { url: "https://api.vreden.my.id/api/tiktok?url={URL}", method: "GET" },
            { url: "https://api.agatz.my.id/api/tiktok?url={URL}", method: "GET" }
        ],
        instagram: [
            { url: "https://api.ryzendesu.vip/api/downloader/igdl?url={URL}", method: "GET" },
            { url: "https://api.siputzx.my.id/api/d/igdl?url={URL}", method: "GET" },
            { url: "https://api.vreden.my.id/api/igdownload?url={URL}", method: "GET" },
            { url: "https://api.agatz.my.id/api/instagram?url={URL}", method: "GET" }
        ],
        youtube: [
            { url: "https://api.ryzendesu.vip/api/downloader/ytdl?url={URL}", method: "GET" },
            { url: "https://api.siputzx.my.id/api/d/ytmp4?url={URL}", method: "GET" },
            { url: "https://api.vreden.my.id/api/ytmp4?url={URL}", method: "GET" }
        ],
        facebook: [
            { url: "https://api.ryzendesu.vip/api/downloader/fbdl?url={URL}", method: "GET" },
            { url: "https://api.siputzx.my.id/api/d/facebook?url={URL}", method: "GET" },
            { url: "https://api.vreden.my.id/api/facebook?url={URL}", method: "GET" }
        ],
        remove_bg: [
            { url: "https://api.siputzx.my.id/api/tools/removebg?url={URL}", method: "GET" },
            { url: "https://api.ryzendesu.vip/api/ai/removebg?url={URL}", method: "GET" },
            { url: "https://api.vreden.my.id/api/removebg?url={URL}", method: "GET" }
        ]
    },
    validators: {
        tiktok: /tiktok\.com/i,
        instagram: /instagram\.com/i,
        youtube: /youtu(be\.com|\.be)/i,
        facebook: /(facebook\.com|fb\.watch)/i
    },
    messages: {
        welcomeTitle: "SYSTEM ONLINE",
        welcomeDesc: "Terhubung ke Ultimate Scraper Engine. Siap memproses ekstraksi media.",
        processing: "MENGEKSTRAKSI METADATA DAN LINK MEDIA...",
        success: "EKSTRAKSI DATA MEDIA BERHASIL DILAKUKAN",
        error: "GAGAL MENGAMBIL DATA. PASTIKAN URL VALID DAN PUBLIK.",
        maintenance: "Sistem modul ini sedang menjalani maintenance.",
        invalidUrl: {
            tiktok: "Link tidak valid. Pastikan menggunakan link TikTok yang benar.",
            instagram: "Link tidak valid. Pastikan menggunakan link Instagram yang benar.",
            youtube: "Link tidak valid. Pastikan menggunakan link YouTube yang benar.",
            facebook: "Link tidak valid. Pastikan menggunakan link Facebook yang benar."
        }
    }
};