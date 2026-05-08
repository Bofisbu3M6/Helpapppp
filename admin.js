// ========== ADMIN.JS - QUẢN TRỊ ==========
window.AdminManager = (function() {
    const data = window.AppData;
    if (!data) return;

    function addProduct(name, desc, price, filesArr) {
        if (!name || isNaN(price) || price <= 0) return { success: false, msg: "Tên và giá không hợp lệ" };
        const newProduct = {
            id: "prod_" + Date.now(),
            name: name,
            price: parseInt(price),
            desc: desc || "Gói cấu hình cao cấp",
            files: filesArr.length ? filesArr : ["https://default-link.com/config.zip"]
        };
        data.products.push(newProduct);
        data.saveAll();
        return { success: true, msg: "Thêm sản phẩm thành công!" };
    }

    function addMoneyToUser(username, amount) {
        if (!data.users[username] || isNaN(amount) || amount <= 0) return { success: false, msg: "User không tồn tại hoặc số tiền sai" };
        data.users[username].balance += parseInt(amount);
        data.saveAll();
        return { success: true, msg: `Đã cộng ${parseInt(amount).toLocaleString()}đ cho ${username}` };
    }

    function addMoneyToAdmin(adminUser) {
        if (adminUser && adminUser.isAdmin) {
            adminUser.balance += 100000;
            data.users[adminUser.username] = adminUser;
            data.saveAll();
            return { success: true, msg: "Admin +100,000đ thành công!" };
        }
        return { success: false, msg: "Không có quyền admin" };
    }

    return {
        addProduct,
        addMoneyToUser,
        addMoneyToAdmin
    };
})();
