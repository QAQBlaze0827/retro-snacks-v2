# Retro Snacks Shop Agents Notes

## 專案現況

這是一個「復古零食店」網站，前端是純靜態 HTML/CSS/JavaScript，後端是 Node.js + Express API，資料庫使用 MongoDB + Mongoose。

目前主要架構：

- 前端：`index.html`、`profile.html`、`style.css`、`script.js`、`config.js`
- 後端：`backend/server.js`
- 後端套件：`backend/package.json`
- 圖片資產：`images/`
- 文件：`docs/`
- GitHub Pages 部署流程：`.github/workflows/static.yml`
- 本地 Docker 設定：`docker-compose.yml`

正式環境規劃：

- 前端放在 GitHub Pages
- 後端放在 Render
- 資料庫放在雲端 MongoDB，建議使用 MongoDB Atlas

## 目前功能

- 首頁顯示商品列表，商品資料由後端 `GET /api/products` 取得。
- 商品支援分類篩選、搜尋、商品介紹彈窗、數量選擇、部分商品口味選項與 Sketchfab 3D 連結。
- 收藏資料目前存在瀏覽器 `localStorage`，尚未存到 MongoDB。
- 首頁輪播到 `banner2.png` 時可點擊進入 `hole-game.html` 洞洞樂活動頁。
- 洞洞樂採九宮格戳洞玩法，需登入，每個會員每天限玩一次，結果會寫入 MongoDB。
- 會員功能包含註冊、Email 驗證、登入、JWT token、個人資料讀取與更新。
- `profile.html` 會透過 JWT 呼叫 `GET /api/user/me` 與 `PUT /api/user/update`。
- 商品介紹、收藏、登入、註冊彈窗支援點擊背景遮罩關閉，不一定要按右上角叉叉。

## 近期變更紀錄

- Email 驗證已從 Resend 改為 SendGrid Web API，套件使用 `@sendgrid/mail`。
- 改用 SendGrid 的原因是 Render 免費方案會封鎖 SMTP port；SendGrid Web API 走 HTTPS，不受 SMTP 封鎖影響。
- 目前使用 SendGrid Single Sender Verification，寄件者 email 必須是 SendGrid 後台已驗證的信箱。
- 本機 Docker 測試 SendGrid 時，如果出現 `Cannot find module '@sendgrid/mail'`，通常是 `/app/node_modules` 匿名 volume 還是舊的；可用 `docker compose up --build --force-recreate --renew-anon-volumes` 重建。
- Banner 圖片已從 `banner*.jpg` 換成 `banner*.png`，`index.html` 與 `script.js` 目前都指向 png。
- Banner CSS 目前採完整呈現圖片的方向，避免 `object-fit: cover` 裁切圖片；若調整大小，優先維持 `object-fit: contain`。
- 手機操作上，彈窗背景遮罩可點擊關閉；這段邏輯在 `script.js` 的 `window.onclick`。
- 註冊驗證碼畫面已補上「若沒收到驗證信，請到垃圾郵件查找」提醒，因 SendGrid Single Sender 寄出的信可能進垃圾郵件。
- `images/` 近期新增商品圖 `yakult_1.jpg`、`cc_1.jpg`、`maixiang_1.jpg`，後端初始商品資料已改用這些新圖片。
- `backend/server.js` 的 `initialProducts` 有更新部分 Sketchfab 3D 模型網址，啟動後會透過商品名稱同步到 MongoDB。
- `images/` 目前也新增 `ramune_1.jpg`、`guoliduo_1.jpg`、`milk_candy_1.jpg`、`pudding_1.jpg`、`coke_1.jpg`，後端商品資料已改用這些 `_1` 新圖片。
- 後端商品清單新增「復古機器人」與「陀螺」，圖片分別使用 `images/robot.jpg` 與 `images/top.jpg`，分類為 `toy`。
- 「復古機器人」與「陀螺」的 Sketchfab 模型尚未完成，目前 `sketchfabUrl` 先放 `https://sketchfab.com/`。
- `backend/server.js` 啟動後會用商品名稱同步 `initialProducts` 到 MongoDB，透過 upsert 新增缺少的商品並更新既有商品圖片、價格、描述、分類與 Sketchfab 連結。
- 新增洞洞樂活動：`hole-game.html`、`hole-game.js`、`GET /api/hole-game/status`、`GET /api/hole-game/records`、`POST /api/hole-game/play`。
- 洞洞樂新增 `holeprizes` 獎品池與 `rewardrecords` 中獎紀錄；獎品池目前固定為 `5 元折價券`、`10 元折價券`、`神秘小禮`、`再接再厲`。
- 洞洞樂每日限制以台灣時區 `Asia/Taipei` 的日期字串判斷，`rewardrecords` 對 `userId + playDate` 建唯一索引。
- 洞洞樂頁面會顯示「我的中獎紀錄」，資料來自 `GET /api/hole-game/records`。

## API 設定

前端 API 網址集中在 `config.js`：

- 本機 `localhost` / `127.0.0.1`：`http://localhost:3000/api`
- 非本機環境：`https://retro-snacks-v2.onrender.com/api`

如果 Render 網址更換，優先修改 `config.js`，不要分散改 `script.js` 和 `profile.html`。

## 後端環境變數

Render 上至少需要設定：

```env
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<production secret>
SENDGRID_API_KEY=<SendGrid API key>
SENDGRID_FROM_EMAIL=<verified Single Sender email>
SENDGRID_FROM_NAME=Retro Snacks Shop
PORT=<Render usually provides this automatically>
```

注意：

- 不要提交 `.env` 或任何密鑰。
- `.gitignore` 已排除 `.env`、`backend/.env`、`node_modules/`。
- `JWT_SECRET` 目前有開發用 fallback，正式環境一定要在 Render 設定。

## 資料庫

目前主要 collections：

- `users`：會員帳號、bcrypt 密碼 hash、Email、驗證狀態、生日、電話、偏好。
- `products`：商品名稱、價格、圖片路徑、分類、描述、Sketchfab 連結、口味選項。
- `holeprizes`：洞洞樂獎品池，包含獎品名稱、是否中獎、抽中權重。
- `rewardrecords`：洞洞樂遊玩紀錄，記錄會員、獎品、是否中獎、遊玩日期與建立時間。

後端啟動並成功連線 MongoDB 後，會依商品名稱同步 `backend/server.js` 裡的 `initialProducts`。

目前同步方式會使用 upsert：商品名稱已存在就更新資料，商品名稱不存在就新增。修改 `initialProducts` 會影響正式 MongoDB Atlas 的商品資料，更新前要確認不會覆蓋手動編輯過的商品內容。

## 本地開發

後端：

```bash
cd backend
npm install
npm run dev
```

前端：

- 可用 Live Server 開 `index.html`
- 或直接開靜態 HTML
- 本機 hostname 是 `localhost` 或 `127.0.0.1` 時，前端會自動連到 `http://localhost:3000/api`

Docker Compose：

```bash
docker-compose up
```

如果後端套件有新增或移除，Docker 裡的 `/app/node_modules` 可能仍使用舊匿名 volume。需要強制重建時可用：

```bash
docker compose up --build --force-recreate --renew-anon-volumes
```

目前 `docker-compose.yml` 會啟動：

- `app`：後端 API
- `db`：本地 MongoDB

## 驗證方式

修改 JavaScript 後，至少執行：

```bash
node --check script.js
node --check backend/server.js
```

後端依賴安裝後可執行：

```bash
cd backend
npm start
```

目前 `backend/package.json` 沒有正式測試，`npm test` 仍是預設失敗指令。

## 部署注意事項

- GitHub Pages workflow 目前會把整個 repo 上傳為 Pages artifact，包含 `backend/` 與 `docs/`。如果只想公開前端檔案，之後可以改成只上傳靜態前端必要檔案。
- 後端 `app.use(cors())` 目前開放所有來源。正式環境若只允許 GitHub Pages 前端，建議改成用環境變數限制 CORS origin。
- `backend/dockerfile` 檔名是小寫；部分 Linux/Docker 環境預設尋找 `Dockerfile`，如果 Docker build 找不到檔案，需改名或在 compose/render 設定 dockerfile 路徑。
- `backend/dockerfile` 目前 CMD 是 `npm run dev`，會使用 nodemon。正式部署建議使用 `npm start`，避免 production 跑 dev server。

## 目前看到的風險

- `index.html`、`script.js`、`backend/server.js`、`.gitignore`、`docker-compose.yml` 部分中文註解或畫面文字顯示為亂碼；`node --check` 目前通過，但畫面文案與註解可讀性需要整理。
- `script.js` 集中很多前端邏輯，未來修改時要小心只動必要區塊，避免牽動商品、會員、收藏三種流程。
- 收藏還在 `localStorage`，換裝置或清除瀏覽器資料就會消失。
- Email 驗證目前依賴 SendGrid Web API，Render 沒設 `SENDGRID_API_KEY` 與 `SENDGRID_FROM_EMAIL` 時寄信會失敗。
- 註冊流程目前即使 SendGrid 寄信失敗，仍可能回傳註冊成功，使用者會停在無法取得驗證碼的狀態。
- `POST /api/verify` 有測試用驗證碼 `000000`，正式上線前應移除或只允許開發環境使用。

## 後續功能規劃

依照「先讓使用者順利完成操作，再增加進階功能」的原則，建議依序處理以下項目。一次只完成一個功能，每個項目完成後都要單獨驗證。

### 1. 商品與個人資料載入狀態

- Render 冷啟動時，商品可能需要等待一段時間才會顯示。
- 商品載入期間顯示明確的「後端啟動中」提示。
- 載入失敗時顯示錯誤訊息與重新載入按鈕，不要讓畫面一直停在「載入中」。
- `profile.html` 讀取個人資料時也要有載入中、失敗與重試狀態。

### 2. Email 驗證流程

- SendGrid 寄信失敗時，註冊 API 必須明確回傳失敗，避免使用者誤以為驗證碼已寄出。
- 新增重新寄送驗證碼功能。
- 重寄按鈕加入倒數時間，避免短時間內重複寄信。
- 顯示驗證碼剩餘有效時間。
- 正式環境移除 `000000` 萬用驗證碼，或限制為開發環境才能使用。

### 3. 表單操作與驗證

- 登入、註冊、驗證及儲存個人資料時，按鈕顯示處理中並暫時停用。
- 檢查帳號、密碼長度、Email 與電話格式。
- 避免使用者重複送出相同請求。
- 將成功、失敗提示統一成相同的畫面風格。

### 4. 更換大頭貼

目前 `profile.html` 只有「更換大頭貼」按鈕，尚未實作選擇、預覽、儲存與顯示流程。

建議分兩個階段：

1. 預設頭像版
   - 在 `images/` 準備數張預設頭像。
   - User Schema 新增 `avatarUrl` 欄位，只儲存圖片路徑。
   - 個人資訊頁提供頭像選擇與預覽。
   - `GET /api/user/me` 與個人資料更新 API 回傳及儲存 `avatarUrl`。
   - 首頁登入後的右上角頭像改為顯示使用者選擇的圖片。

2. 自訂圖片上傳版
   - 使用 Cloudinary 等外部圖片儲存服務。
   - Render 本機檔案不適合保存使用者上傳圖片，重新部署後可能消失。
   - MongoDB 只儲存圖片網址，不直接儲存 Base64 圖片。
   - 限制 JPG、PNG、WebP 格式及檔案大小，並保留預設頭像作為載入失敗時的備用圖片。

現階段優先採用預設頭像版，改動較少，也不需要增加外部儲存服務。

### 5. 忘記密碼與修改密碼

- 新增透過 Email 驗證碼重設密碼的流程。
- 個人資訊頁提供修改密碼功能。
- 重設密碼與登入 API 應限制嘗試次數。

### 6. 收藏跨裝置同步

- 新增收藏資料模型或將收藏欄位放入使用者資料。
- 登入會員的收藏改存 MongoDB。
- 使用者換手機或瀏覽器後仍能看到相同收藏。
- 未登入狀態可繼續使用 `localStorage`，登入後再決定是否合併收藏。

### 7. 帳號與 API 安全

- 使用環境變數限制 CORS，只允許正式 GitHub Pages 網址與本機開發網址。
- 對註冊、登入、寄送驗證碼及驗證 API 加入請求次數限制。
- 正式環境必須設定 `JWT_SECRET`，不可使用開發用 fallback。
- 後端檢查輸入資料，只接受允許更新的欄位。

### 8. 操作細節與無障礙

- 圖片補上適當的 `alt` 文字及載入失敗備用圖片。
- 表單欄位加入對應的 `label`。
- 支援 Enter 送出登入與註冊表單。
- 支援 Esc 關閉彈窗。
- 搜尋或分類沒有結果時，顯示「沒有符合的商品」。

## 修改原則

- 一次只做一個功能，避免同時大改前端、後端與部署。
- 優先沿用目前的純 HTML/CSS/JavaScript 寫法，不要自行導入框架。
- 不要提交密鑰、MongoDB 連線字串、JWT secret、Email service API key。
- 修改 API 路徑時，同步確認 `config.js`、`backend/server.js` 和 Render 設定。
- 修改資料欄位時，同步更新 `docs/資料庫排版.md`。
- 修改部署流程時，同步確認 GitHub Pages workflow 與 Render start command。
