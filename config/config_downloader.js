// =========================================
// FILE: config/config_downloader.js
// =========================================

const DL_CONFIG = {
    // =========================================
    // SETTING UMUM
    // =========================================
    system: {
        appName: "Media Saver Pro",
        version: "6.0.0 (Ultimate Scraper Edition)",
        maintenance: false
    },

    // =========================================
    // DAFTAR TOOLS (SIDEBAR)
    // =========================================
    tools: [
        {
            id: "tiktok",
            name: "TikTok No WM",
            icon: "tiktok",
            color: "#ff0050"
        },
        {
            id: "instagram",
            name: "Instagram Reels",
            icon: "instagram",
            color: "#E1306C"
        },
        {
            id: "youtube",
            name: "YouTube Video",
            icon: "youtube",
            color: "#ff0000"
        },
        {
            id: "facebook",
            name: "Facebook HD",
            icon: "facebook",
            color: "#1877F2"
        },
        {
            id: "twitter",
            name: "X / Twitter",
            icon: "twitter",
            color: "#1DA1F2"
        }
    ],

    // =========================================
    // SMART SCRAPER ENDPOINTS (NO API KEY)
    // =========================================
    apis: {
        tiktok: {
            url: "https://api.siputzx.my.id/api/d/tiktok?url={URL}",
            method: "GET"
        },
        instagram: {
            url: "https://api.siputzx.my.id/api/d/igdl?url={URL}",
            method: "GET"
        },
        youtube: {
            url: "https://api.siputzx.my.id/api/d/ytmp4?url={URL}",
            method: "GET"
        },
        facebook: {
            url: "https://api.siputzx.my.id/api/d/facebook?url={URL}",
            method: "GET"
        },
        twitter: {
            url: "https://api.siputzx.my.id/api/d/twitter?url={URL}",
            method: "GET"
        }
    },

    // =========================================
    // PESAN TEXT UI
    // =========================================
    messages: {
        welcomeTitle: "SYSTEM ONLINE",
        welcomeDesc: "Terhubung ke Ultimate Scraper Engine. Siap mengunduh semua media.",
        processing: "EXTRACTING MEDIA DATA...",
        success: "MEDIA SUCCESSFULLY SCRAPED",
        error: "GAGAL MENGAMBIL DATA / LINK INVALID",
        maintenance: "Fitur sedang maintenance."
    }
};
