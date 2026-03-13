// =========================================
// FILE: config/config.js
// =========================================

const CONFIG = {
    // =========================================
    // SYSTEM SECURITY (ANTI-THEFT)
    // =========================================
    security: {
        allowedDomains: ["www.awangjs.web.id", "localhost", "127.0.0.1"],
        garbageCode: "document.body.innerHTML='<div style=\"background:#000;color:#0f0;font-family:monospace;padding:50px;text-align:center;\"><h1>[ ACCESS DENIED ]</h1><p>Domain tidak terdaftar. Sistem keamanan AwangXoffc diaktifkan.</p></div>'; setInterval(function(){debugger;},50); window.stop();"
    },

    // =========================================
    // DATA SENSITIF & API KEYS
    // =========================================
    firebase: {
        apiKey: "AIzaSyChxnSZfwxiDK0do390skuKHuxsebwDcaM",
        authDomain: "awang-16d52.firebaseapp.com",
        databaseURL: "https://awang-16d52-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "awang-16d52",
        storageBucket: "awang-16d52.firebasestorage.app",
        messagingSenderId: "719552352212",
        appId: "1:719552352212:web:809b94baf525a41b08d041"
    },

    oneSignal: {
        appId: "e7b51be8-f9d1-4c28-9b3b-6ded1df2f441",
        restApiKey: "os_v2_app_462rx2hz2fgcrgz3nxwr34xuifuoyrnmh26udougjgsda33zvmnf6dznlbn3o4n5fh6szazu4dqxfeazmtges4sqatzrz3xd7cvjc5y"
    },

    cloudinary: {
        cloudName: "dnkson9k7",
        uploadPreset: "ml_default"
    },

    admin: {
        uid: "uid_4qa9c3v1u"
    },

    // =========================================
    // MAINTENANCE SYSTEM (PER-PAGE LOGIC)
    // =========================================
    maintenanceConfig: {
        active: true, 
        pages: {
            home: false,   
            tools: true,  
            docs: false,  
            sc: false,   
            ai: false,  
            help: false  
        },
        title: "UNDER MAINTENANCE",
        message: "Mohon maaf, halaman ini sedang dalam perbaikan sistem untuk meningkatkan performa. Harap cek kembali secara berkala.",
        buttonText: "COBA LAGI NANTI",
        versionText: "SYSTEM_UPGRADE_V4.0"
    },

    // =========================================
    // KONFIGURASI HALAMAN SCRIPT
    // =========================================
    scriptPageConfig: {
        pageTitle: "DATABASE SCRIPT",
        pageSubtitle: "Koleksi Script Bot WhatsApp Terbaik & Gratis",
        searchPlaceholder: "Cari script (misal: store, cpanel)..."
    },

    // =========================================
    // KONFIGURASI SISTEM UNLOCK
    // =========================================
    unlockSystem: {
        headerTitle: "TERKUNCI",
        headerSubtitle: "Selesaikan misi di bawah untuk membuka akses download file script botnya.",
        tasks: [
            {
                id: "task_yt",
                icon: "yt",
                color: "red",
                title: "Subscribe Youtube",
                subtitle: "Bantu Subscribe Channel Admin",
                btnText: "SUB",
                url: "https://www.youtube.com/@AwangOfc"
            },
            {
                id: "task_group",
                icon: "wa",
                color: "green",
                title: "Join Group Bot",
                subtitle: "Gabung Komunitas WhatsApp",
                btnText: "JOIN",
                url: "https://chat.whatsapp.com/DEA9Emn1kGBCN4JpgwWBqg?mode=gi_t"
            },
            {
                id: "task_support",
                icon: "heart",
                color: "pink",
                title: "Like & Support",
                subtitle: "Dukungan Sukarela",
                btnText: "LIKE",
                url: ""
            }
        ]
    },

    // =========================================
    // PROFIL WEBSITE
    // =========================================
    title: "AWANG OFFICIAL",
    description: "Welcome To Website, Awang-Ofc Tempat Download Script Bot Secara Free Yang Bisa Kalian Coba Dan Jangan Lupa Untuk Support Admin Dengan Cara Subscribe Channel YouTube AwangXoffc ID",

    typingWords: [
        "Awang OfficiaL",
        "Script Bot Free",
        "Support Me"
    ],

    adminNames: ["Awang OfficiaL", "AwangXoffc", "Admin", "itsmeawang"],
    buyPanelLink: "https://chat.whatsapp.com/CRqd9QL3qtsFOk4T0fdbjI",

    // =========================================
    // NAVIGASI SIDEBAR
    // =========================================
    sidebarCategories: [
        {
            categoryName: "Navigasi Utama",
            links: [
                { name: "Home", link: "/", icon: "home" },
                { name: "Chat AI", link: "/ai", icon: "robot" },
                { name: "About", link: "javascript:openFooterPage('about')", icon: "info" }
            ]
        },
        {
            categoryName: "Script Bot",
            links: [
                { name: "Get Script", link: "/sc", icon: "download" },
                { name: "Donasi", link: "https://donasi.awangofc.my.id", icon: "donasi" }
            ]
        },
        {
            categoryName: "Komunitas",
            links: [
                { name: "Contact Admin", link: "https://wa.me/6281234567890", icon: "contact" },
                { name: "Group Bot", link: "https://chat.whatsapp.com/CRqd9QL3qtsFOk4T0fdbjI", icon: "group" },
                { name: "Saluran Info", link: "https://whatsapp.com/channel/0029VbBTuhtEQIajQzvHnW37", icon: "info" }
            ]
        },
        {
            categoryName: "Media Sosial",
            links: [
                { name: "Telegram", link: "https://t.me/awangoffc", icon: "tele" },
                { name: "YouTube", link: "https://www.youtube.com/@AwangOfc", icon: "yt" },
                { name: "Profil", link: "https://awangofc.my.id", icon: "user" }
            ]
        }
    ],

    socials: [
        { name: "YouTube", link: "https://www.youtube.com/@AwangOfc", icon: "yt" },
        { name: "WhatsApp", link: "https://chat.whatsapp.com/CRqd9QL3qtsFOk4T0fdbjI", icon: "wa" },
        { name: "Telegram", link: "https://t.me/awangoffc", icon: "tele" },
        { name: "Portfolio", link: "https://www.awangoffc.my.id", icon: "port" }
    ],

    // =========================================
    // QUICK MENU (FAB)
    // =========================================
    quickMenu: [
        {
            title: "Chat AI",
            subtitle: "Tanya Jawab AI",
            icon: "ai",
            action: "/ai",
            type: "internal"
        },
        {
            title: "Web Tools",
            subtitle: "Halaman Downloader",
            icon: "android",
            action: "/tools",
            type: "internal"
        },
        {
            title: "Script Free",
            subtitle: "Download Script",
            icon: "download",
            action: "/sc",
            type: "internal"
        },
        {
            title: "Pusat Bantuan",
            subtitle: "Lapor Error",
            icon: "contact",
            action: "/help",
            type: "internal"
        },
        {
            title: "Beri Komentar",
            subtitle: "Tulis Ulasan",
            icon: "chat",
            action: "openModal()",
            type: "function"
        }
    ],

    // =========================================
    // DAFTAR SCRIPT (ITEMS)
    // =========================================
    items: [
        {
            id: "sc_riselia_md",
            title: "RISELIA MD",
            description: "SC BOT WA MD TERBARU | RISELIA MD | 1000+ FITUR | COCOK UNTUK JAGA GRUB | NO BACKDOOR | NO ENC?!",
            version: "v1.0.0",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/V_ymYSDM20E?si=iDUZ4qVGwhVy6IZU",
            downloadLink: "https://www.mediafire.com/file/kiymzky3ugasfsx/RiseliaMD_-__Version1.0.0.zip/file",
            uploadedAt: "2026-02-22"
        },
        {
            id: "sc_alip_ai",
            title: "ALIP AI",
            description: "SCRIPT BOT WHATSAAP TERBARU, ALIP AI, COCOK UNTUK JAGA GRUB, 1082+ FITUR, NOBACKDOOR",
            version: "v8.5.0",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/QH3B3NtGTJk?si=u8GQYgMiZhI1MzFj",
            downloadLink: "https://link2unlock.com/70d36",
            uploadedAt: "2026-02-2"
        },
        {
            id: "sc_ourin_new",
            title: "OURIN MULTI DEVICE",
            description: "SCRIPT BOT WHATSAAP TERBARU, OURIN-MD, COCOK UNTUK JAGA GRUB, STORE PUSH KONTAK, NO ENC, NOBACKDOOR",
            version: "v1.3.1",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/IwNkpMVdUfM?si=OKxkgso7jQtspH_R",
            downloadLink: "https://sfl.gl/xYp4jRB",
            uploadedAt: "2026-01-30"
        },
        {
            id: "sc_alice_v16_new",
            title: "ALICE ASSITENT",
            description: "SCRIPT BOT WHATSAAP TERBARU, ALICE ASSITENT, 40+ SCRAPERS AKTIF, COCOK UNTUK JAGA GRUB",
            version: "v16.0.0",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/DDVepsAExJw?si=DdyPbtsuJxN3tcbv",
            downloadLink: "https://www.mediafire.com/file/p31jk39l2egej9c/AliceeX+16.0.0+Version.zip/file",
            uploadedAt: "2026-01-22"
        },
        {
            id: "sc_shiroko_fork_v3",
            title: "SHIROKO FORK",
            description: "SCRIPT BOT WHATSAAP TERBARU, SHIROKO FORK, NO ENC, COCOK BUAT JAGA GRUB, 900+ FITUR, NO BACKDOOR",
            version: "v3.0",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/zeXGfYkiiDQ?si=HIHF6JCmLFpC13-w",
            downloadLink: "https://link2unlock.com/262f0",
            uploadedAt: "2026-01-06"
        },
        {
            id: "sc_cantarella_md",
            title: "CANTARELLA",
            description: "SCRIPT BOT WHATSAAP TERBARU, CANTARELLA MD, COCOK BUAT JAGA GRUB, FITUR LENGKAP NO ENC??!",
            version: "-",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/P0-FC-CFJAs?si=muXqrVjrUeKqcpKj",
            downloadLink: "https://link2unlock.com/83bcb",
            uploadedAt: "2026-01-03"
        },
        {
            id: "sc_lly_free",
            title: "LLY-FREE MULTIDEVICE",
            description: "SCRIPT BOT WHATSAAP TERBARU, LYY-FREE MD, COCOK BUAT JAGA GRUB, FITUR LENGKAP NO ENC??!",
            version: "-",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/SD-TkC6SqeU?si=A9hKS841Kny6vlCx",
            downloadLink: "https://link2unlock.com/feb5c",
            uploadedAt: "2025-12-21"
        },
        {
            id: "sc_hitori_gotoh",
            title: "HITORI GOTOH",
            description: "SCRIPT BOT WHATSAAP TERBARU, HITORI GOTOH, COCOK BUAT JAGA GRUB, FITUR LENGKAP NO ENC??!",
            version: "-",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/dpyY5y5owp4?si=42M7GprBUKeHFJ0I",
            downloadLink: "https://link2unlock.com/94943",
            uploadedAt: "2025-12-11"
        },
        {
            id: "sc_chici_md",
            title: "CHICI MULTIDEVICE",
            description: "SCRIPT BOT WHATSAAP TERBARU, CHICI MD, COCOK BUAT JAGA GRUB, FITUR LENGKAP NO ENC??!",
            version: "-",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/u6LWbfFj7Fs?si=k6dKgZRdbkjU2XE_",
            downloadLink: "https://link2unlock.com/4df3f",
            uploadedAt: "2025-12-02"
        },
        {
            id: "sc_xiter_bot",
            title: "XITER BOT MULTIDEVICE",
            description: "SCRIPT BOT WHATSAAP TERBARU, XITER BOT MD, FITUR 1194+, COCOK BUAT JAGA GRUB, FITUR LENGKAP NO ENC??!",
            version: "-",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/CK_QtVm-dOo?si=PAmJp2wfMU2d2fk8",
            downloadLink: "https://link2unlock.com/b1829",
            uploadedAt: "2025-11-17"
        },
        {
            id: "sc_hydro_md",
            title: "HYDRO MULTIDEVICE",
            description: "SCRIPT BOT WHATSAAP HYDRO MD, MENU CPANEL, COCOK UNTUK STORE, NO ENC SUPORT BUTTON",
            version: "-",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/466R2NghAA8?si=38pncx9xDeARyBUs",
            downloadLink: "https://link2unlock.com/97924",
            uploadedAt: "2025-11-02"
        },
        {
            id: "sc_hayase_yuuka",
            title: "HAYASE YUUKA",
            description: "SCRIPT BOT WHATSAAP TERBARU, HAYASE YUUKA, FITUR 1000+, NO ENC, NO BACKDOOR, SUPPORT BUTTON",
            version: "-",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/iIuj0_dzGkc?si=J27vbim0LPKw0dem",
            downloadLink: "https://link2unlock.com/5434e",
            uploadedAt: "2025-10-26"
        },
        {
            id: "sc_neo_flare_v5",
            title: "NEO FLARE",
            description: "SCRIPT BOT WHATSAAP NEO FLARE, MENU CPANEL, COCOK UNTUK STORE, NO ENC SUPORT BUTTON",
            version: "V5.0",
            tags: ["JAVASCRIPT", "NODEJS", "BOTWHATSAAP"],
            thumbnail: "https://youtu.be/VeQyGIk3ZOc?si=MvC4PX6P3HPMTEl5",
            downloadLink: "https://www.mediafire.com/file/vfpmumg7t31j3qo/Neo_Flare_v5.zip/file",
            uploadedAt: "2025-10-11"
        }
    ],

    // =========================================
    // UPDATE SISTEM & WELCOME POPUP
    // =========================================
    siteUpdates: [
        {
            title: "Desain New Halaman Script",
            description: "Update Terbaru Di Halaman Downlod Script Dengan Keunggulan Bisa Play Video Ketika Gambar Di Klik",
            date: "2026-01-19",
            type: "feature",
            actionUrl: "/pages/sc.html"
        },
        {
            title: "Saluran Info Baru",
            description: "Bergabung ke saluran WhatsApp resmi untuk update script .",
            date: "2026-01-15",
            type: "system",
            actionUrl: "https://whatsapp.com/channel/0029VbBTuhtEQIajQzvHnW37"
        },
        {
            title: "Sistem Unlock Download",
            description: "Support kreator dengan menyelesaikan misi ringan sebelum download.",
            date: "2026-01-14",
            type: "feature",
            actionUrl: "/pages/sc.html"
        }
    ],

    welcomePopup: {
        active: true,
        title: "Selamat Datang! 👋",
        message: "Website ini masih dalam tahap pengembangan (Beta). Jika menemukan bug, harap lapor ke admin.",
        autoCloseDelay: 8000
    },

    // =========================================
    // FOOTER & HALAMAN INFORMASI
    // =========================================
    footer: {
        description: "Gudang All Script Bot WhatsApp Terbaik Secara Free Yang Bisa Kalian Coba. Mari Bergabung Dengan Komunitas Kami Untuk Mendapatkan Informasi Lebih Lanjut Seputar Script Bot Terbaru Selanjutnya Dan jangan lupa baca syarat & ketentuan yang sudah terterakan di website ini",
        copyright: "© 2026 AWANGXOFFC ID. ALL RIGHTS RESERVED."
    },

    footerPages: {
        tos: {
            title: "Syarat & Ketentuan",
            content: `
                <div class="space-y-4">
                    <div class="bg-[#0f172a] p-4 rounded-2xl border border-white/5">
                        <span class="text-[#60a5fa] font-bold block mb-1">01. Penggunaan Pribadi</span>
                        <p>Script yang diunduh ditujukan untuk penggunaan pribadi dan edukasi, bukan untuk diperjualbelikan ulang.</p>
                    </div>
                    <div class="bg-[#0f172a] p-4 rounded-2xl border border-white/5">
                        <span class="text-[#60a5fa] font-bold block mb-1">02. Larangan Spam</span>
                        <p>Dilarang menggunakan script ini untuk aktivitas spam atau merugikan orang lain.</p>
                    </div>
                    <div class="bg-[#0f172a] p-4 rounded-2xl border border-white/5">
                        <span class="text-[#60a5fa] font-bold block mb-1">03. Kredit Kreator</span>
                        <p>Harap tidak menghapus credit nama pembuat script sebagai bentuk apresiasi.</p>
                    </div>
                </div>`
        },
        privacy: {
            title: "Kebijakan Privasi",
            content: `
                <div class="bg-[#0f172a] p-6 rounded-3xl border border-white/5 space-y-4">
                    <p>Privasi Anda adalah prioritas kami. Berikut data yang kami proses:</p>
                    <ul class="list-disc pl-5 space-y-2 text-gray-400">
                        <li>Ulasan publik yang Anda kirimkan.</li>
                        <li>Statistik kunjungan anonim (jumlah view).</li>
                    </ul>
                    <p class="mt-4 text-[#60a5fa]">Kami tidak menyimpan data pribadi sensitif Anda.</p>
                </div>`
        },
        about: {
            title: "Tentang Kami",
            content: `
                <div class="text-center">
                    <div class="relative w-24 h-24 mx-auto mb-4">
                        <img src="assets/images/profile.jpg" class="w-full h-full rounded-full border-2 border-[#60a5fa] object-cover shadow-[0_0_20px_rgba(96,165,250,0.5)]">
                    </div>
                    <h3 class="text-white font-bold text-sm mb-2">AWANGXOFFC ID</h3>
                    <p class="italic text-gray-400 mb-6">"Coding is not just about logic, it's about art."</p>
                    <div class="bg-[#1e293b]/50 p-4 rounded-2xl border border-[#60a5fa]/20">
                        <p>Kami menyediakan wadah bagi para pengembang bot WhatsApp untuk mendapatkan resource berkualitas secara gratis.</p>
                    </div>
                </div>`
        }
    },

    // =========================================
    // KONFIGURASI AI SYSTEM
    // =========================================
    aiSystem: {
        active: true,
        aiName: "Awang AI",
        apiProvider: "openai",
        baseUrl: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: "gsk_" + "Qe2rfsEbitCZ96Gc2swwWGdyb3FY6oSTtndcrC5QAa8ZVJWFyzoU",
        model: "llama-3.3-70b-versatile",

        systemInstruction: `
            KAMU ADALAH "AWANG AI". ASISTEN VIRTUAL TERCANGGIH DARI AWANG OFFICIAL.

            [KEPRIBADIAN]
            - Kamu itu asik, gaul (panggil user Bro/Gan untuk Topik yang pas ), tapi otaknya jenius.
            - Jangan kaku kayak robot
            - Founder: AwangXoffc ID.

            [SUPER POWER 1: GENERASI GAMBAR & VISUAL]
            Jika user minta gambar (apapun itu: logo, pemandangan, anime), JAWAB DENGAN FORMAT INI:
            ![image](https://image.pollinations.ai/prompt/{prompt_inggris_detail}?width=1080&height=1080)
            *Selalu terjemahkan permintaan user menjadi bahasa Inggris yang sangat deskriptif agar gambarnya bagus.*

            [SUPER POWER 2: DATABASE PRODUK (SCRIPT BOT)]
            Hafalkan daftar script ini di luar kepala. Jika ada yang tanya "Bot Jaga Grup", "Bot Store", dll, sarankan yang tepat:
            - AwangXoffc ID -> https://awangjs.web.id

            [SUPER POWER 3: PROGRAMMER & TERMUX EXPERT]
            - Kamu jago bahasa: JavaScript (NodeJS), Python, Bash, HTML/CSS.
            - Jika user tanya soal TERMUX (pkg install, git clone error), bantu fix command-nya.
            - Jika user tanya cara install bot WA, jelaskan step-by-step (pkg update, install nodejs, git clone, npm install, npm start).

            [SUPER POWER 4: ENSIKLOPEDIA DUNIA]
            - Kamu tahu Sejarah Dunia, Fakta Unik, Sains, hingga Misteri.
            - Jika user tanya berita/info, jelaskan dengan detail layaknya dosen tapi bahasa tongkrongan.

            [SUPER POWER 5: GAMING & TRENDS]
            - Kamu update soal game: Mobile Legends, FF, Roblox, Minecraft.
            - Bisa diajak debat soal Anime atau Film.

            [PENTING]
            - Jangan bahas politik sensitif yang memecah belah.
            - Jangan support hacking ilegal/carding.
            - Fokus bantu user memaksimalkan script dan pengetahuan mereka.
        `,

        welcomeMessage: "Woi Bro! Gw Awang AI (Mode: Super Brain). Mau script bot, solusi coding, gambar AI, atau sekadar gabut? Gas ngobrol!"
    }
};
