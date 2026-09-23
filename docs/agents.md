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

## 2026-09-23 新商品與分類選單

- 商品清單目前共 15 項，本次檢查使用者新增的四項商品：

| 商品 | 價格 | 分類 | 圖片 |
| --- | --- | --- | --- |
| 魯班鎖 | 100 | `toy` | `images/Lubanlock.jpg` |
| 健達出奇蛋 | 40 | `candy` | `images/Kinder_Surprise.jpg` |
| 小瓜呆脆笛酥 | 50 | `cookie` | `images/Wafer_Rolls.jpg` |
| 溜溜球 | 45 | `toy` | `images/yoyo.jpg` |

- 修正商品名稱「小瓜呆脆迪酥」為圖片上的「小瓜呆脆笛酥」，分類從 `candy` 改為 `cookie`；價格保持使用者原設定。
- 四張新圖片的路徑與檔名大小寫一致；四項商品的 Sketchfab 連結目前都是首頁佔位網址，尚非專屬模型。
- 待確認：健達圖片包裝寫 `Kinder Joy`，與目前「巧克力外殼內含驚喜玩具」的描述不一致；本次保留圖片、名稱與描述，待團隊確認商品版本。
- `style.css` 的分類選單原本缺少桌面寬度且繼承漢堡選單的大字體，造成逐字換行。已改成 176px 寬、16px 字體、禁止項目文字換行、每列至少 44px 高，並加上淺底深字、邊框、陰影與滑過效果；桌面與手機共用規則。
- 驗證：`node --check backend/server.js` 通過；商品資料檢查未發現重複名稱、無效分類或圖片路徑大小寫錯誤。Playwright 使用本機 `initialProducts` 模擬商品 API，確認 15 張商品圖片可載入，320、390、768、1440px 選單不溢出，餅乾／玩具／全部商品篩選及選取後／點外面關閉正常。
- 本次未啟動後端同步 MongoDB，也未部署。後端依商品名稱 upsert；若資料庫已存在舊名「小瓜呆脆迪酥」，改名後可能留下舊資料，需先確認再處理，不要直接清空資料庫。

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
- `POST /api/verify` 的 `000000` 是使用者在測試階段刻意保留的驗證碼，目前先保留，預計正式上線前移除。現有程式沒有依環境限制此驗證碼；不要把「測試用途」誤記為「僅開發環境有效」。

## 2026-09-21 專案與 UI／UX 檢查

本次只檢查與更新文件，以下項目除 Header 現況外皆不是已完成的修正，也不代表已授權一次實作所有改善。

### 測試階段決策

- 使用者確認專案仍在測試階段，`000000` 暫時保留，後續正式上線前再移除；目前不要自行刪除這段邏輯。
- 洞洞樂獎品目前是展示結果，不提供折價券折抵、結帳或實際兌換。改善說明文案不等於新增兌換功能。
- 保留目前復古風格，先改善操作流程、可讀性與回饋，不需要重做整個網站。

### 已確認的流程問題

| 項目 | 目前行為與影響 | 後續改善方向 |
| --- | --- | --- |
| 註冊驗證 | `backend/server.js` 先儲存帳號，寄信失敗仍回傳成功；驗證碼五分鐘到期，沒有重寄入口，再註冊又會遇到帳號或 Email 已存在。 | 提供正確寄信結果、重新寄送與繼續驗證的方式。 |
| 商品載入 | `script.js` 的 `fetchProducts()` 失敗只寫入 console，畫面可能一直顯示載入中。 | 提供載入失敗提示與重試按鈕。 |
| 個人資料 | `profile.html` 的資料尚未成功載入時仍能按儲存，可能把空白欄位送回後端。 | 資料載入成功前停用儲存，失敗時提供重試。 |
| 收藏入口與歸屬 | 未登入可以加入收藏，但收藏入口被隱藏；`localStorage` 使用共用 `favorites` key，同一瀏覽器切換帳號仍共用收藏，換裝置則不同步。 | 先統一訪客收藏入口與帳號歸屬規則，再安排跨裝置同步。 |
| 搜尋與分類 | `filterCategory()` 與 `searchProduct()` 各自修改卡片顯示，條件互相覆蓋；無結果時沒有提示。 | 同時套用分類與搜尋，顯示目前條件、結果數與清除入口。 |
| 未完成的操作 | 更換大頭貼按鈕沒有功能；機器人與陀螺的 3D 按鈕仍導向 Sketchfab 首頁。 | 功能完成前隱藏入口或標示製作中，避免看起來可以操作卻沒有預期結果。 |
| 表單與彈窗 | 登入按 Enter 不送出，Esc 不關閉彈窗；送出缺少處理中與防連點狀態。 | 補上表單鍵盤操作、欄位標籤、處理中提示及暫時停用按鈕。 |

### UI／UX 改善建議

- 活動導覽：新增固定的洞洞樂入口，避免只能等待 `banner2.png` 輪播出現；活動 Banner 提供明確可點提示。
- 輪播控制：目前每三秒切換，建議加入前後切換、目前頁碼與暫停方式。
- 獎品說明：活動頁明確標示展示用途；Banner 的「人人有獎」需與獎品池含有「再接再厲」的實際規則一致。
- 價格可讀性：目前價格 `#d9534f` 與卡片底色 `#d4a373` 的對比約為 1.75:1，建議改用較深的價格文字顏色。
- 收藏概念：目前數量選擇及「單價 x 數量」容易讓人以為是購物車；若僅做收藏，可簡化為收藏／取消收藏。
- 操作回饋：一般成功訊息可改為不打斷操作的短提示，避免每次都需要關閉原生 `alert`。
- 圖片效能：本次量測三張 Banner 合計約 8.6 MiB，11 張商品圖合計約 7.1 MiB。建議保留原始檔，另提供網頁用壓縮版本並延後載入畫面外商品圖；不需裁切內容或改變顯示比例。

### 驗證範圍與優先順序

- 已讀取目前本機程式，並以 Playwright 搭配模擬商品與個人資料 API 檢查介面；未操作正式帳號、寄信、抽獎或雲端資料庫。
- 本機重現商品 API 無法連線後仍顯示載入中、未登入收藏入口隱藏、搜尋覆蓋分類、Enter 不送出登入及 Esc 不關閉登入彈窗。
- 未登入 Header 在 320、360、390、768、1440px 寬度未重現登入／註冊換行；目前 `style.css` 的 `#userArea:empty` 會隱藏空頭像容器。
- 上述瀏覽器檢查不等於實體手機、正式部署、實際寄信或完整後端測試。
- 建議先後順序：驗證流程恢復能力 → 載入失敗與重試 → 收藏一致性 → 搜尋與分類 → 視覺與操作細節。`000000` 移除安排在正式上線前處理。

## 後續功能規劃

依照「先讓使用者順利完成操作，再增加進階功能」的原則，以下保留各項功能規劃；近期優先順序以上方檢查紀錄為準。一次只完成一個功能，每個項目完成後都要單獨驗證。

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
- 依使用者目前決策，測試階段保留 `000000`，正式上線前再移除。

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
