// ==========================================
// 1. 基本設定與初始化
// ==========================================
// 後端 API 的網址集中在 config.js，避免不同頁面各自寫死。
const API_URL = window.RETRO_SNACKS_CONFIG.API_URL;

console.log("當前連線的 API 網址是:", API_URL);

// 當網頁一打開時，要做的事情
window.onload = function() {
    fetchProducts();    // 1. 去資料庫抓商品
    showUser();         // 2. 檢查有沒有登入，更新右上角
    updateFavoriteCount();  // 3. 更新收藏圖示數字
};

// ==========================================
// 2. 首頁 Banner 輪播圖
// ==========================================
let images = ["images/banner1.jpg", "images/banner2.jpg", "images/banner3.jpg"];
let index = 0;
setInterval(() => {
    index++;
    if (index >= images.length) index = 0;
    const slide = document.getElementById("slide");
    if (slide) slide.src = images[index];
}, 3000); // 3秒換一張

// ==========================================
// 3. 商品讀取與顯示 (動態從資料庫抓取)
// ==========================================
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        renderProducts(products); // 抓到資料後，把它畫在畫面上
    } catch (err) {
        console.error("抓取商品失敗:", err);
    }
}

// 把抓到的商品陣列，變成一張張卡片 HTML
function renderProducts(products) {
    const container = document.getElementById('productContainer');
    if (!container) return;
    container.innerHTML = ''; // 清空原本的「載入中」文字

    products.forEach(p => {
        const card = document.createElement('div');
        // 加入分類 class (例如 card candy)，方便篩選
        card.className = `card ${p.category}`; 
        // 存入 data-name 方便搜尋
        card.dataset.name = p.name; 

        card.innerHTML = `
            <img src="${p.image}">
            <h3>${p.name}</h3>
            <p>$${p.price}</p>
            <button onclick='showProduct(${JSON.stringify(p)})'>商品介紹</button>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// 4. 商品介紹彈窗 (全新升級：整合 Sketchfab 3D 邏輯)
// ==========================================
function showProduct(product) {
    // 填入基本資料
    document.getElementById("pname").innerText = product.name;
    document.getElementById("ptext").innerText = product.description || "經典懷舊滋味";
    document.getElementById("pimg").src = product.image;
    document.getElementById("pprice").innerText = "價格 $" + product.price;
    document.getElementById("popupQty").value = 1; // 數量重置為 1

    const optionSection = document.getElementById("optionSection");
    const optionSelect = document.getElementById("productOption");

    // 💡 檢查有沒有舊的 3D 按鈕，如果沒有就建立一個
    let view3dBtn = document.getElementById("view3dBtn");
    if (!view3dBtn) {
        view3dBtn = document.createElement("button");
        view3dBtn.id = "view3dBtn";
        view3dBtn.style.width = "100%";
        view3dBtn.style.padding = "10px";
        view3dBtn.style.marginTop = "10px";
        view3dBtn.style.backgroundColor = "#4185f4"; // 藍色按鈕區隔收藏
        view3dBtn.style.color = "white";
        view3dBtn.style.border = "none";
        view3dBtn.style.borderRadius = "20px";
        view3dBtn.style.cursor = "pointer";
        view3dBtn.style.fontWeight = "bold";
        
        // 把 3D 按鈕塞到「加入收藏」按鈕的上方
        const addBtn = document.getElementById("popupAddBtn");
        addBtn.parentNode.insertBefore(view3dBtn, addBtn);
    }

    // 💡 核心 3D 連動邏輯開始
    if (product.options && product.options.length > 0) {
        // 【情況 A】商品有分口味（例如：飛壘、麥香）
        optionSection.style.display = "block"; // 顯示選單
        
        // 渲染選單選項（注意：現在要用 opt.flavor 喔！）
        optionSelect.innerHTML = product.options.map(opt => `<option value="${opt.flavor}">${opt.flavor}</option>`).join('');
        
        // 定義一個「更新 3D 按鈕網址」的動作
        function update3dButtonLink() {
            const currentFlavor = optionSelect.value;
            // 從陣列中找出目前選中口味的完整物件
            const matchedOpt = product.options.find(opt => opt.flavor === currentFlavor);
            
            if (matchedOpt && matchedOpt.sketchfabUrl) {
                view3dBtn.innerText = `📦 查看 ${currentFlavor} 3D 模型`;
                view3dBtn.style.display = "block";
                view3dBtn.onclick = function() {
                    window.open(matchedOpt.sketchfabUrl, '_blank'); // 開新視窗
                };
            } else {
                view3dBtn.style.display = "none"; // 沒填網址就先藏起來
            }
        }

        // 一打開彈窗先觸發一次更新，並且設定「當使用者切換口味時」自動重新對應網址
        update3dButtonLink();
        optionSelect.onchange = update3dButtonLink;

    } else {
        // 【情況 B】商品沒分口味（例如：彈珠汽水、布丁）
        optionSection.style.display = "none"; // 隱藏口味選單
        
        if (product.sketchfabUrl) {
            view3dBtn.innerText = "📦 查看 3D 商品模型";
            view3dBtn.style.display = "block";
            view3dBtn.onclick = function() {
                window.open(product.sketchfabUrl, '_blank');
            };
        } else {
            view3dBtn.style.display = "none"; // 資料庫完全沒 3D 連結就隱藏
        }
    }

    document.getElementById("popup").style.display = "block"; // 顯示彈窗

    document.getElementById("popupAddBtn").innerText = "加入收藏";

    // 綁定「加入收藏」按鈕點擊事件
    document.getElementById("popupAddBtn").onclick = function() {
        let qty = parseInt(document.getElementById("popupQty").value);
        let selectedOption = optionSection.style.display === "block" ? optionSelect.value : "";
        addToFavorites(product.name, product.price, qty, selectedOption, product.image);
        closePopup();
    };
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// 彈窗內的數量按鈕 (+/-)
function changeQty(amount) {
    let qtyInput = document.getElementById("popupQty");
    let newQty = parseInt(qtyInput.value) + amount;
    if (newQty >= 1) qtyInput.value = newQty;
}

// ==========================================
// 5. 分類篩選與搜尋
// ==========================================
function toggleDropdown(event) {
    event.stopPropagation();
    document.getElementById("myDropdown").classList.toggle("show");
}

// 點擊外面自動關閉下拉選單
window.onclick = function(event) {
    const dropdown = document.getElementById("myDropdown");
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
}

function filterCategory(type) {
    let cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        if (type === "all" || card.classList.contains(type)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

function searchProduct() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        let name = card.dataset.name ? card.dataset.name.toLowerCase() : "";
        card.style.display = name.includes(input) ? "block" : "none";
    });
}

// ==========================================
// 6. 收藏系統 (儲存在 localStorage)
// ==========================================
function addToFavorites(name, price, qty, option, image) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    const existingItem = favorites.find(item => item.name === name && item.option === option);
    if (existingItem) {
        existingItem.quantity = qty;
        existingItem.image = image;
    } else {
        // 把選擇的商品資訊存進收藏
        favorites.push({ 
            name: name, 
            price: price, 
            quantity: qty, 
            image: image,
            option: option // 口味
        });
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateFavoriteCount();
    alert(`已加入收藏：${name} ${option} x ${qty}`);
}

function updateFavoriteCount() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    let countElement = document.getElementById("favoriteCount");
    if (countElement) {
        countElement.innerText = favorites.length;
        countElement.style.display = favorites.length > 0 ? "block" : "none";
    }
}

function openFavorites() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    let html = "";

    favorites.forEach((item, i) => {
        const imageSrc = item.image || "images/logo.jpg";
        html += `
            <div class="favorite-item">
                <img class="favorite-item-img" src="${imageSrc}" alt="${item.name}" onerror="this.src='images/logo.jpg'">
                <div class="favorite-item-info">
                    <strong>${item.name}</strong>
                    <span>${item.option ? '('+item.option+')' : '未選口味'}</span>
                    <span>$${item.price} x ${item.quantity}</span>
                </div>
                <button class="favorite-remove-btn" onclick="removeFavorite(${i})">刪除</button>
            </div>
        `;
    });

    document.getElementById("favoriteItems").innerHTML = html || "<p style='color:black;'>目前沒有收藏商品</p>";
    document.getElementById("favoriteSummary").innerText = `共 ${favorites.length} 項收藏`;
    document.getElementById("favoriteModal").style.display = "block";
}

function closeFavorites() {
    document.getElementById("favoriteModal").style.display = "none";
}

function removeFavorite(i) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites.splice(i, 1);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    openFavorites();
    updateFavoriteCount();
}

// ==========================================
// 7. 會員登入註冊 (對接後端 API)
// ==========================================
function openLogin() { document.getElementById("loginModal").style.display = "block"; }
function openRegister() { document.getElementById("registerModal").style.display = "block"; }
function closeModal() {
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("registerModal").style.display = "none";
}
function switchRegister() { closeModal(); openRegister(); }
function switchLogin() { closeModal(); openLogin(); }

async function register() {
    let user = document.getElementById("regUser").value.trim();
    let email = document.getElementById("regEmail").value.trim();
    let pass = document.getElementById("regPass").value.trim();

    if(!user || !email || !pass) { alert("請填寫所有欄位"); return; }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, email: email, password: pass })
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById("regInitial").style.display = "none";
            document.getElementById("regVerify").style.display = "block";
        } else {
            alert(data.message);
        }
    } catch (err) { alert("伺服器連線失敗"); }
}

async function verifyCode() {
    let user = document.getElementById("regUser").value.trim();
    let code = document.getElementById("verifyCode").value.trim();
    try {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, code: code })
        });
        const data = await response.json();
        if (data.success) {
            alert("驗證成功！請登入");
            location.reload();
        } else { alert(data.message); }
    } catch (err) { alert("驗證失敗"); }
}

async function login() {
    let user = document.getElementById("loginUser").value.trim();
    let pass = document.getElementById("loginPass").value.trim();

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem("loginUser", data.user.username);
            localStorage.setItem("authToken", data.token);
            sessionStorage.removeItem("loginStatusNoticeShown");
            alert("登入成功！");
            location.reload(); // 重新整理來顯示頭像
        } else { alert("失敗：" + data.message); }
    } catch (err) { alert("連線錯誤"); }
}

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp && payload.exp * 1000 < Date.now();
    } catch (err) {
        return true;
    }
}

function clearLoginState(message) {
    localStorage.removeItem("loginUser");
    localStorage.removeItem("authToken");
    if (message && !sessionStorage.getItem("loginStatusNoticeShown")) {
        sessionStorage.setItem("loginStatusNoticeShown", "true");
        alert(message);
    }
}

// 根據登入狀態切換右上角按鈕
function showUser() {
    let user = localStorage.getItem("loginUser");
    let token = localStorage.getItem("authToken");
    let loginBtn = document.getElementById("loginBtn");
    let regBtn = document.getElementById("regBtn");
    let cartBtn = document.getElementById("cartBtn");
    let userArea = document.getElementById("userArea");

    if (user && token && !isTokenExpired(token)) {
        userArea.innerHTML = `
            <img src="images/user-icon.jpg" style="width: 50px; height: 50px; border-radius: 50%; cursor: pointer; border: 2px solid #fff;" 
                 onclick="location.href='profile.html'" title="個人資訊">
        `;
        if (loginBtn) loginBtn.style.display = "none";
        if (regBtn) regBtn.style.display = "none";
        if (cartBtn) cartBtn.style.display = "inline-flex";
    } else {
        if (user || token) {
            clearLoginState("登入狀態已失效，請重新登入。");
        }
        userArea.innerHTML = "";
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (regBtn) regBtn.style.display = "inline-block";
        if (cartBtn) cartBtn.style.display = "none";
    }
}
