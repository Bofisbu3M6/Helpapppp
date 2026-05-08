// ========== SCRIPT.JS - LUỒNG CHÍNH ==========
(function() {
    const data = window.AppData;
    const adminAPI = window.AdminManager;
    if (!data || !adminAPI) {
        console.error("Lỗi khởi tạo module");
        return;
    }

    let currentUser = null;

    // Helper toast
    function showToast(msg, isError = false) {
        const toast = document.getElementById("globalToast");
        if (!toast) return;
        toast.textContent = msg;
        toast.style.display = "block";
        toast.style.backgroundColor = isError ? "#8b2c2c" : "#1f4f2b";
        setTimeout(() => { toast.style.display = "none"; }, 2600);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Render danh sách sản phẩm
    function renderProducts() {
        const container = document.getElementById("productsGrid");
        if (!container || !currentUser) return;
        if (data.products.length === 0) {
            container.innerHTML = "<div style='padding:30px;text-align:center'>Chưa có sản phẩm</div>";
            return;
        }
        container.innerHTML = data.products.map(prod => `
            <div class="product-item">
                <div class="product-name">${escapeHtml(prod.name)}</div>
                <div class="product-price">${prod.price.toLocaleString()}đ</div>
                <div class="product-desc">${escapeHtml(prod.desc).replace(/\n/g, '<br>')}</div>
                <button class="btn-buy" data-id="${prod.id}" data-price="${prod.price}" data-name="${escapeHtml(prod.name)}" data-files='${JSON.stringify(prod.files)}'>
                    <i class="fas fa-cart-shopping"></i> MUA NGAY
                </button>
            </div>
        `).join('');

        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!currentUser) { showToast("Vui lòng đăng nhập", true); return; }
                const price = parseInt(btn.dataset.price);
                if (currentUser.balance < price) {
                    showToast(`Số dư không đủ! Cần ${price.toLocaleString()}đ`, true);
                    return;
                }
                currentUser.balance -= price;
                data.users[currentUser.username].balance = currentUser.balance;
                const productName = btn.dataset.name;
                const filesArr = JSON.parse(btn.dataset.files);
                data.purchases.push({
                    username: currentUser.username,
                    productName: productName,
                    files: filesArr,
                    boughtAt: new Date().toISOString()
                });
                data.saveAll();
                renderPurchased();
                renderProducts();
                updateBalanceUI();
                showToast(`✅ Mua thành công ${productName}! File có trong kho.`);
            });
        });
    }

    function renderPurchased() {
        const container = document.getElementById("purchasedArea");
        if (!container || !currentUser) return;
        const myPurchases = data.purchases.filter(p => p.username === currentUser.username);
        if (myPurchases.length === 0) {
            container.innerHTML = "Chưa mua sản phẩm nào.";
            return;
        }
        container.innerHTML = myPurchases.map(item => `
            <div class="purchased-card">
                <strong>${escapeHtml(item.productName)}</strong> 
                <span style="font-size:10px; color:#aaa;">${new Date(item.boughtAt).toLocaleString()}</span>
                <div class="file-links">
                    <i class="fas fa-paperclip"></i> Link tải:<br>
                    ${item.files.map(f => `<a href="${f}" target="_blank" style="color:#FFD966;">${escapeHtml(f)}</a>`).join('<br>')}
                </div>
            </div>
        `).join('');
    }

    function updateBalanceUI() {
        const balanceSpan = document.getElementById("userBalanceDisplay");
        if (balanceSpan && currentUser) {
            balanceSpan.innerHTML = currentUser.balance.toLocaleString() + "đ";
        }
    }

    // Nạp tiền
    function handleTopUp() {
        if (!currentUser) { showToast("Đăng nhập trước", true); return; }
        const method = confirm("◉ OK = ATM (Admin xử lý thủ công)\n◉ Cancel = Thẻ cào (AutoCard1s)");
        if (method) {
            let amount = prompt("Nhập số tiền nạp ATM:", "100000");
            if (amount && !isNaN(parseInt(amount))) {
                data.deposits.push({
                    username: currentUser.username,
                    amount: parseInt(amount),
                    method: "ATM",
                    status: "Chờ xử lý",
                    timestamp: new Date().toISOString()
                });
                data.saveAll();
                showToast("Yêu cầu nạp ATM đã ghi nhận, admin xử lý.");
            }
        } else {
            let code = prompt("Mã thẻ (Code):");
            let serial = prompt("Serial thẻ:");
            let money = prompt("Mệnh giá (VNĐ):");
            if (code && serial && money && !isNaN(parseInt(money))) {
                if (code.toLowerCase().includes("error") || serial.toLowerCase().includes("error")) {
                    data.deposits.push({ username: currentUser.username, amount: parseInt(money), method: "Thẻ cào", status: "Thất bại", timestamp: new Date().toISOString() });
                    data.saveAll();
                    showToast("Thẻ lỗi! Sai mã/serial.", true);
                } else {
                    currentUser.balance += parseInt(money);
                    data.users[currentUser.username].balance = currentUser.balance;
                    data.deposits.push({ username: currentUser.username, amount: parseInt(money), method: "Thẻ cào Auto", status: "Thành công", timestamp: new Date().toISOString() });
                    data.saveAll();
                    showToast(`Nạp thẻ thành công! +${parseInt(money).toLocaleString()}đ`);
                    renderProducts();
                    updateBalanceUI();
                }
            } else showToast("Thông tin không hợp lệ", true);
        }
    }

    // Xử lý đăng nhập/đăng ký
    let isLoginMode = true;
    function switchAuthMode() {
        isLoginMode = !isLoginMode;
        const title = document.getElementById("authTitle");
        const submitBtn = document.getElementById("authSubmitBtn");
        const switchLabel = document.getElementById("switchAuthLabel");
        const toggleBtn = document.getElementById("toggleAuthModeBtn");
        const forgotHint = document.getElementById("forgotPasswordHint");
        if (isLoginMode) {
            title.innerText = "ĐĂNG NHẬP";
            submitBtn.innerText = "ĐĂNG NHẬP";
            switchLabel.innerText = "Bạn không có tài khoản?";
            toggleBtn.innerText = "Đăng ký";
            forgotHint.style.display = "block";
        } else {
            title.innerText = "ĐĂNG KÝ";
            submitBtn.innerText = "ĐĂNG KÝ";
            switchLabel.innerText = "Đã có tài khoản?";
            toggleBtn.innerText = "Đăng nhập";
            forgotHint.style.display = "none";
        }
    }

    function handleAuth() {
        const username = document.getElementById("authUsername").value.trim();
        const password = document.getElementById("authPassword").value.trim();
        const captcha = document.getElementById("captchaCheck").checked;
        if (!username || !password) { showToast("Vui lòng nhập đầy đủ", true); return; }
        if (!captcha) { showToast("Xác nhận bạn không phải người máy", true); return; }

        if (isLoginMode) {
            if (data.users[username] && data.users[username].password === password) {
                currentUser = data.users[username];
                localStorage.setItem("current_session_user", username);
                showToast(`Chào mừng ${username}`);
                switchToMainApp();
            } else {
                showToast("Sai tên đăng nhập hoặc mật khẩu", true);
            }
        } else {
            if (data.users[username]) { showToast("Tên đã tồn tại", true); return; }
            const newUser = {
                username, password, isAdmin: false, balance: 50000,
                customerCode: data.randomCode(), createdAt: new Date().toISOString()
            };
            data.users[username] = newUser;
            data.saveAll();
            currentUser = newUser;
            localStorage.setItem("current_session_user", username);
            showToast("Đăng ký thành công! +50,000đ");
            switchToMainApp();
        }
    }

    function switchToMainApp() {
        document.getElementById("authScreen").style.display = "none";
        document.getElementById("mainAppScreen").style.display = "block";
        renderProducts();
        renderPurchased();
        updateBalanceUI();
        if (currentUser && currentUser.isAdmin) {
            document.getElementById("adminPanelSection").style.display = "block";
        } else {
            document.getElementById("adminPanelSection").style.display = "none";
        }
    }

    function logout() {
        localStorage.removeItem("current_session_user");
        location.reload();
    }

    // Gắn sự kiện
    document.getElementById("toggleAuthModeBtn")?.addEventListener("click", switchAuthMode);
    document.getElementById("authSubmitBtn")?.addEventListener("click", handleAuth);
    document.getElementById("navLogout")?.addEventListener("click", logout);
    document.getElementById("navTopUp")?.addEventListener("click", handleTopUp);
    
    document.getElementById("navAccountInfo")?.addEventListener("click", () => {
        if (currentUser) alert(`👤 Tài khoản: ${currentUser.username}\n🎫 Mã KH: ${currentUser.customerCode}\n📅 Tạo: ${new Date(currentUser.createdAt).toLocaleString()}\n💰 Số dư: ${currentUser.balance.toLocaleString()}đ`);
        else showToast("Chưa đăng nhập", true);
    });
    document.getElementById("navDepositHistory")?.addEventListener("click", () => {
        if (!currentUser) return;
        let his = data.deposits.filter(d => d.username === currentUser.username);
        if (his.length === 0) alert("Chưa có lịch sử nạp");
        else alert(his.map(h => `${h.method} - ${h.amount.toLocaleString()}đ - ${h.status} - ${new Date(h.timestamp).toLocaleString()}`).join("\n"));
    });
    document.getElementById("navPurchaseHistory")?.addEventListener("click", () => {
        if (!currentUser) return;
        let his = data.purchases.filter(p => p.username === currentUser.username);
        if (his.length === 0) alert("Chưa mua sản phẩm");
        else alert(his.map(p => `${p.productName} - ${new Date(p.boughtAt).toLocaleString()}`).join("\n"));
    });
    document.getElementById("navAdminPanel")?.addEventListener("click", () => {
        if (currentUser && currentUser.isAdmin) document.getElementById("adminPanelSection").style.display = "block";
        else showToast("Không có quyền admin", true);
    });

    // Admin actions
    document.getElementById("adminAddProductBtn")?.addEventListener("click", () => {
        const name = document.getElementById("adminProdName").value.trim();
        const desc = document.getElementById("adminProdDesc").value.trim();
        const price = document.getElementById("adminProdPrice").value;
        const filesRaw = document.getElementById("adminProdFiles").value;
        const fileArr = filesRaw.split("\n").filter(f => f.trim() !== "");
        const result = adminAPI.addProduct(name, desc, price, fileArr);
        showToast(result.msg, !result.success);
        if (result.success) {
            renderProducts();
            document.getElementById("adminProdName").value = "";
            document.getElementById("adminProdDesc").value = "";
            document.getElementById("adminProdPrice").value = "";
            document.getElementById("adminProdFiles").value = "";
        }
    });
    document.getElementById("adminAddMoneyBtn")?.addEventListener("click", () => {
        const target = document.getElementById("adminTargetUser").value.trim();
        const amount = document.getElementById("adminMoneyAmount").value;
        const result = adminAPI.addMoneyToUser(target, amount);
        showToast(result.msg, !result.success);
        if (result.success && currentUser && currentUser.username === target) {
            currentUser.balance = data.users[target].balance;
            updateBalanceUI();
            renderProducts();
        }
    });
    document.getElementById("adminSelfAddMoneyBtn")?.addEventListener("click", () => {
        const result = adminAPI.addMoneyToAdmin(currentUser);
        showToast(result.msg, !result.success);
        if (result.success) {
            currentUser.balance = data.users[currentUser.username].balance;
            updateBalanceUI();
            renderProducts();
        }
    });

    // Kiểm tra session
    const savedSession = localStorage.getItem("current_session_user");
    if (savedSession && data.users[savedSession]) {
        currentUser =
