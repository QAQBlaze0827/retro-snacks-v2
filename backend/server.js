// backend/server.js
require('dns').setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

// Middleware
app.use(express.json()); // 解析 JSON 格式的請求體
app.use(cors()); // 允許跨域請求 (讓前端能存取 API)

// ==========================================
// 1. 資料庫連線設定 (Docker 階段)
// ==========================================
// 這裡的 'db' 是 Docker Compose 裡 MongoDB 服務的名字
const dbUrl = process.env.MONGODB_URI || 'mongodb://db:27017/retro_shop';

mongoose.connect(dbUrl)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// 2. 定義資料模型 (Schema)
// ==========================================
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    email: { type: String, required: true }, // 新增 Email
    birthday: { type: String, default: "" },      // 生日
    phone: { type: String, default: "" },         // 電話
    preference: { type: String, default: "" },    // 網站傾向我也不知道這功能到底要幹嘛
    isVerified: { type: Boolean, default: false }, // 是否驗證成功
    verificationCode: String, // 存放驗證碼
    codeExpires: Date // 驗證碼過期時間
});
// 2. 更新 transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // 587 必須設為 false
    requireTLS: true, // 強制要求加密連線
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        // 即使憑證不完全匹配也允許連線，增加相容性
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    connectionTimeout: 20000 // 把時間拉長到 20 秒，給 Render 一點緩衝
});
// 在 transporter 定義完後立刻測試
transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ 郵件伺服器連線失敗:", error);
    } else {
        console.log("✅ 郵件伺服器已就緒，可以發信");
    }
});
const User = mongoose.model('User', userSchema);

// ==========================================
// 3. API 路由 (Routes)
// ==========================================

// [POST] 會員註冊
app.post('/api/register', async (req, res) => {
    try {
        const { username, password ,email} = req.body;
        // 這裡可以加一行 log 看看有沒有成功收到請求
        console.log("收到註冊請求:", username, email);
        // 防呆：檢查帳號是否已存在
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: '帳號或 Email 已存在' });
        }

        // 安全：密碼加密 (Hash)
        const hashedPassword = await bcrypt.hash(password, 10);
        // 產生驗證碼
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 產生 6 位數驗證碼

        // 儲存新使用者
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            verificationCode: code,
            codeExpires: Date.now() + 300000 // 5 分鐘後過期
        });

        await newUser.save();
        //測試
        console.log("資料庫存入成功");
        // // 強力捕獲寄信錯誤
        // try {
        //     await transporter.sendMail({
        //         from: `"復古零食店" <${process.env.EMAIL_USER}>`,
        //         to: email,
        //         subject: '您的註冊驗證碼',
        //         text: `驗證碼是：${code}`
        //     });
        //     console.log("✅ 郵件寄出成功");
        //     return res.status(201).json({ success: true });
        // } catch (mailErr) {
        //     console.error("❌ 寄信失敗:", mailErr.message);
        //     // 就算寄信失敗，也要回傳 JSON 給前端，前端才不會跳「連線伺服器發生錯誤」
        //     return res.status(500).json({ success: false, message: "郵件系統連線失敗: " + mailErr.message });
        // }
        // 2. 修改發信那一段
        try {
            const data = await resend.emails.send({
                from: 'onboarding@resend.dev', // 測試期請先用這個官方預設發信人
                to: email, // 你的接收信箱
                subject: '您的註冊驗證碼',
                html: `<strong>哈囉 ${username}！</strong><br>您的驗證碼是：<h1>${code}</h1><br>請於 5 分鐘內輸入。`
            });

            console.log("🚀 Resend 寄信成功:", data);
            return res.status(201).json({ success: true });
        } catch (mailErr) {
            console.error("❌ Resend 寄信失敗:", mailErr);
            return res.status(500).json({ success: false, message: "郵件系統繁忙，請稍後再試" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 4. API [POST] 驗證驗證碼
app.post('/api/verify', async (req, res) => {
    try {
        const { username, code } = req.body;

        // --- 萬用碼邏輯開始 ---
        if (code === '000000') {
            const user = await User.findOne({ username });
            if (user) {
                user.isVerified = true;
                user.verificationCode = undefined;
                user.codeExpires = undefined;
                await user.save();
                console.log("✅ 使用萬用碼驗證成功");
                return res.json({ success: true, message: '測試驗證成功！請重新登入' });
            }
        }
        // --- 萬用碼邏輯結束 ---
        
        const user = await User.findOne({ username });
        if (!user || user.verificationCode !== code || user.codeExpires < Date.now()) {
            return res.status(400).json({ success: false, message: '驗證碼錯誤或已過期' });
        }

        user.isVerified = true;
        user.verificationCode = undefined; // 清空
        user.codeExpires = undefined;
        await user.save();

        res.json({ success: true, message: '驗證成功！請重新登入' });
    } catch (err) {
        res.status(500).json({ success: false, message: '驗證過程出錯' });
    }
});

// [POST] 會員登入
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. 尋找使用者
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: '帳號或密碼錯誤' });
        }

        // 2. 比對加密密碼
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: '帳號或密碼錯誤' });
        }

        // 3. 登入成功 (正式環境通常會回傳 JWT Token，這裡簡化處理)
        res.json({ 
            success: true, 
            message: '登入成功', 
            user: { username: user.username } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// [GET] 取得特定使用者資料
app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ success: false, message: '找不到使用者' });
        }
        // 只回傳需要的資料，不要把密碼傳回去
        res.json({ 
            success: true, 
            username: user.username,
            email: user.email || "未設定",
            birthday: user.birthday || "",      // 新增回傳生日
            phone: user.phone || "",            // 新增回傳電話
            preference: user.preference || ""   // 新增回傳傾向
        });
    } catch (err) {
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// [PUT] 更新使用者詳細資料
app.put('/api/user/update', async (req, res) => {
    try {
        const { username, birthday, phone, preference } = req.body;
        
        // 根據帳號尋找並更新資料
        const updatedUser = await User.findOneAndUpdate(
            { username: username },
            { 
                birthday: birthday, 
                phone: phone,
                preference: preference 
            },
            { new: true } // 回傳更新之後的最新資料
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "找不到該使用者" });
        }

        res.json({ success: true, message: "資料更新成功", user: updatedUser });
    } catch (err) {
        console.error("更新失敗:", err);
        res.status(500).json({ success: false, message: "伺服器錯誤" });
    }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});