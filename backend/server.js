// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

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
    isVerified: { type: Boolean, default: false }, // 是否驗證成功
    verificationCode: String, // 存放驗證碼
    codeExpires: Date // 驗證碼過期時間
});
// 2. 設定 Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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
        // 發信
        await transporter.sendMail({
            from: `"復古零食店" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '您的註冊驗證碼',
            text: `哈囉 ${username}！您的驗證碼是：${code}，請於 5 分鐘內輸入。`
        });

        res.status(201).json({ success: true, message: '驗證碼已寄出' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 4. API [POST] 驗證驗證碼
app.post('/api/verify', async (req, res) => {
    try {
        const { username, code } = req.body;
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
            email: user.email || "未設定",
            username: user.username
        });
    } catch (err) {
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});