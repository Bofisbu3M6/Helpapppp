// ========== DATA.JS - LƯU TRỮ & KHỞI TẠO ==========
window.AppData = (function() {
    const ADMIN_USER = "Storenguyenlongvipios2026";
    const ADMIN_PASS = "Nguyenlongdeveloper2026";

    let users = JSON.parse(localStorage.getItem("nguyenlong_users_db")) || {};
    let products = JSON.parse(localStorage.getItem("nguyenlong_products_db")) || [];
    let purchases = JSON.parse(localStorage.getItem("nguyenlong_purchases_db")) || [];
    let deposits = JSON.parse(localStorage.getItem("nguyenlong_deposits_db")) || [];

    function randomCode() {
        return "NL" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    // Khởi tạo dữ liệu mặc định nếu chưa có
    if (Object.keys(users).length === 0) {
        users[ADMIN_USER] = {
            username: ADMIN_USER,
            password: ADMIN_PASS,
            isAdmin: true,
            balance: 999000,
            customerCode: randomCode(),
            createdAt: new Date().toISOString()
        };
        users["demoUser"] = {
            username: "demoUser",
            password: "demo123",
            isAdmin: false,
            balance: 250000,
            customerCode: randomCode(),
            createdAt: new Date().toISOString()
        };
    }

    if (products.length === 0) {
        products = [
            { id: "p1", name: "🔥 MUA GÓI TIÊU CHUẨN", price: 150000, desc: "Config Trải Nghiệm\n- Fix rung tâm cơ bản (50-60%)\n- Chạy tốt iOS & Android", files: ["https://file.demo/config-std.zip"] },
            { id: "p2", name: "⚡ Config Tiêu Chuẩn", price: 350000, desc: "Leo Rank tâm trung\n- Fix rung tâm 60%\n- Độ nhạy ổn định, dễ kéo", files: ["https://file.demo/config-pro.zip"] },
            { id: "p3", name: "🚀 Pro Script Vĩnh Viễn", price: 500000, desc: "Mở khóa VIP\n- Tối ưu đường truyền\n- Cập nhật trọn đời", files: ["https://file.demo/script-pro.zip"] },
            { id: "p4", name: "👑 CONFIG VIP LIMITED", price: 500000, desc: "Dân chuyên / Đi kèo tiền\n- Bám đầu 99%\n- Ổn định 100% No Delay", files: ["https://file.demo/vip-limited.zip"] }
        ];
    }

    function saveAll() {
        localStorage.setItem("nguyenlong_users_db", JSON.stringify(users));
        localStorage.setItem("nguyenlong_products_db", JSON.stringify(products));
        localStorage.setItem("nguyenlong_purchases_db", JSON.stringify(purchases));
        localStorage.setItem("nguyenlong_deposits_db", JSON.stringify(deposits));
    }

    saveAll();

    return {
        ADMIN_USER,
        ADMIN_PASS,
        users,
        products,
        purchases,
        deposits,
        saveAll,
        randomCode
    };
})();
