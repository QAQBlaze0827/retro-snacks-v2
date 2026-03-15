// ==========================================
// 1. 首頁 Banner 輪播圖設定
// ==========================================
// 定義要輪播的圖片路徑陣列
let images = [
    "images/banner1.jpg",
    "images/banner2.jpg",
    "images/banner3.jpg"
];
let index = 0; // 目前顯示的圖片索引值

// 設定計時器，每 3000 毫秒（3 秒）更換一次圖片
setInterval(() => {
    index++;
    // 如果索引值超過陣列長度，就歸零回到第一張
    if (index >= images.length) { index = 0; }
    // 更新 HTML 中 id="slide" 的圖片來源
    document.getElementById("slide").src = images[index];
}, 3000);

// ==========================================
// 2. 商品彈出視窗功能 (商品介紹)
// ==========================================
function showProduct(name, text, img, price) {
    document.getElementById("popup").style.display = "block";
    document.getElementById("pname").innerText = name;
    document.getElementById("ptext").innerText = text;
    document.getElementById("pimg").src = img;
    document.getElementById("pprice").innerText = "價格 $" + price;

    // 每次打開視窗時，把數量輸入框重置為 1
    document.getElementById("popupQty").value = 1;

    // 綁定視窗內的「加入購物車」按鈕點擊事件
    document.getElementById("popupAddBtn").onclick = function() {
        let qty = parseInt(document.getElementById("popupQty").value); // 取得輸入的數量
        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        // 根據選擇的數量，把商品塞進購物車陣列
        for (let i = 0; i < qty; i++) {
            cart.push({ name: name, price: price });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount(); // 更新右上角購物車數字
        alert(`${name} 共 ${qty} 份已加入購物車！`);
        closePopup(); // 加入完成後自動關閉視窗
    };
}

// 關閉商品彈出視窗
function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// 控制視窗內的數量加減按鈕
function changeQty(amount) {
    let qtyInput = document.getElementById("popupQty");
    let currentQty = parseInt(qtyInput.value);
    let newQty = currentQty + amount;

    // 防呆：確保數量最少是 1
    if (newQty >= 1) {
        qtyInput.value = newQty;
    }
}

// ==========================================
// 3. 商品分類與搜尋功能
// ==========================================
// 根據分類按鈕過濾商品
function filterCategory(type) {
    let cards = document.querySelectorAll(".card"); // 抓取所有商品卡片
    cards.forEach(card => {
        if (type === "all") {
            card.style.display = "block"; // 選擇「全部」就顯示所有卡片
        } else if (card.classList.contains(type)) {
            card.style.display = "block"; // 包含該分類 class 的就顯示
        } else {
            card.style.display = "none";  // 不包含的就隱藏
        }
    });
}

// 搜尋商品功能 (透過輸入框文字即時篩選)
function searchProduct() {
    let input = document.getElementById("searchInput").value.toLowerCase(); // 取得輸入值並轉小寫
    let cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        // 假設你的 HTML 商品卡片上有 data-name 屬性 (雖然你目前的 HTML 沒加上，但原本設計應該有)
        let name = card.dataset.name ? card.dataset.name.toLowerCase() : "";
        if (name.includes(input)) {
            card.style.display = "block"; // 包含搜尋字詞的顯示
        } else {
            card.style.display = "none";  // 不包含的隱藏
        }
    });
}

// ==========================================
// 4. 購物車核心功能
// ==========================================
// 將商品加入購物車
function addToCart(name, price) {
    // 從 localStorage 讀取購物車資料，如果沒有就建立空陣列
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push({ name, price }); // 將新商品推入陣列
    // 將更新後的陣列轉回字串存回 localStorage
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount(); // 更新右上角購物車數量顯示
    alert(name + " 已加入購物車");
}

// 更新購物車圖示旁邊的數量數字 (已加入防呆機制)
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let countElement = document.getElementById("cartCount");
    // 檢查是否有找到 cartCount 標籤 (避免在首頁隱藏時發生錯誤)
    if (countElement) {
        countElement.innerText = cart.length;
    }
}

// 打開購物車視窗並渲染內容
function openCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let html = "";
    let total = 0;

    // 迴圈處理購物車內的每一項商品
    cart.forEach((item, i) => {
        html += `
            <p>
            ${item.name} - $${item.price}
            <button onclick="removeItem(${i})">刪除</button>
            </p>
        `;
        total += item.price; // 累加總金額
    });

    // 將產生的 HTML 塞入購物車清單區塊
    document.getElementById("cartItems").innerHTML = html;
    document.getElementById("cartTotal").innerText = "總金額 $" + total;
    document.getElementById("cartModal").style.display = "block"; // 顯示購物車視窗
}

// 關閉購物車視窗
function closeCart() {
    document.getElementById("cartModal").style.display = "none";
}

// 從購物車中移除單一商品
function removeItem(i) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(i, 1); // 根據索引值刪除該項商品
    localStorage.setItem("cart", JSON.stringify(cart)); // 存回 localStorage
    openCart();        // 重新渲染購物車畫面
    updateCartCount(); // 更新右上角數字
}

// 結帳功能
function checkout() {
    alert("結帳成功！");
    localStorage.removeItem("cart"); // 清空購物車資料
    updateCartCount(); // 歸零右上角數字
    closeCart();       // 關閉購物車視窗
}

// ==========================================
// 5. 登入與註冊 Modal (彈出視窗) 控制
// ==========================================
function openLogin() { document.getElementById("loginModal").style.display = "block"; }
function openRegister() { document.getElementById("registerModal").style.display = "block"; }
function closeModal() {
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("registerModal").style.display = "none";
}
// 註冊/登入視窗互相切換
function switchRegister() { closeModal(); openRegister(); }
function switchLogin() { closeModal(); openLogin(); }

// ==========================================
// 6. 會員註冊與登入邏輯 (使用 localStorage 模擬資料庫)
// ==========================================
// 註冊功能
function register() {
    let user = document.getElementById("regUser").value.trim();
    let pass = document.getElementById("regPass").value.trim();
    let accounts = JSON.parse(localStorage.getItem("accounts")) || {};

    // 將新帳號密碼存入物件
    accounts[user] = { password: pass };
    localStorage.setItem("accounts", JSON.stringify(accounts));
    alert("註冊成功");
    closeModal();
}

// 登入功能
function login() {
    let user = document.getElementById("loginUser").value.trim();
    let pass = document.getElementById("loginPass").value.trim();
    let accounts = JSON.parse(localStorage.getItem("accounts")) || {};

    // 檢查帳號是否存在
    if (!accounts[user]) {
        alert("帳號不存在");
        return;
    }
    // 檢查密碼是否正確
    if (accounts[user].password !== pass) {
        alert("密碼錯誤");
        return;
    }

    // 登入成功，將使用者名稱存入 loginUser
    localStorage.setItem("loginUser", user);
    showUser(); // 更新頁面右上角的使用者狀態
    closeModal();
}

// ==========================================
// 7. 頁面狀態更新與初始化
// ==========================================
// 根據登入狀態，更新右上角 UI (顯示大頭貼或登入按鈕)
function showUser() {
    let user = localStorage.getItem("loginUser");
    let loginBtn = document.getElementById("loginBtn");
    let regBtn = document.getElementById("regBtn");
    let cartBtn = document.getElementById("cartBtn"); // 抓取購物車按鈕

    if (user) {
        // 有登入：顯示個人頭像 (點擊連至個人資訊頁)，隱藏登入註冊按鈕，顯示購物車
        document.getElementById("userArea").innerHTML = `
            <img src="images/user-icon.jpg" style="width: 50px; height: 50px; border-radius: 50%; cursor: pointer; vertical-align: middle; margin-right: 20px;" onclick="location.href='profile.html'" alt="個人資訊">
        `;
        if (loginBtn) loginBtn.style.display = "none";
        if (regBtn) regBtn.style.display = "none";
        if (cartBtn) cartBtn.style.display = "inline-block";
    } else {
        // 未登入：清空頭像區塊，顯示登入註冊按鈕，隱藏購物車
        document.getElementById("userArea").innerHTML = "";
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (regBtn) regBtn.style.display = "inline-block";
        if (cartBtn) cartBtn.style.display = "none";
    }
}

// 登出功能 (此處的登出會重新整理頁面，個人資訊頁也有專屬的登出函數)
function logout() {
    localStorage.removeItem("loginUser");
    location.reload();
}

// 初始化：當網頁載入時，先執行一次更新購物車與檢查登入狀態
updateCartCount();
showUser();