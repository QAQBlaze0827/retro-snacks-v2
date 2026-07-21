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
- 收藏/購物車資料目前存在瀏覽器 `localStorage`，尚未存到 MongoDB。
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

後端啟動並成功連線 MongoDB 後，會檢查 `products` 是否為空；如果是空的，會匯入 `backend/server.js` 裡的 `initialProducts`。

如果修改 `initialProducts`，不會自動更新已存在的正式資料庫商品，除非手動清空資料或另外寫 migration。

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
- 收藏/購物車還在 `localStorage`，換裝置或清瀏覽器資料就會消失。
- Email 驗證目前依賴 SendGrid Web API，Render 沒設 `SENDGRID_API_KEY` 與 `SENDGRID_FROM_EMAIL` 時寄信會失敗。
- `POST /api/verify` 有測試用驗證碼 `000000`，正式上線前應移除或只允許開發環境使用。

## 修改原則

- 一次只做一個功能，避免同時大改前端、後端與部署。
- 優先沿用目前的純 HTML/CSS/JavaScript 寫法，不要自行導入框架。
- 不要提交密鑰、MongoDB 連線字串、JWT secret、Email service API key。
- 修改 API 路徑時，同步確認 `config.js`、`backend/server.js` 和 Render 設定。
- 修改資料欄位時，同步更新 `docs/資料庫排版.md`。
- 修改部署流程時，同步確認 GitHub Pages workflow 與 Render start command。
