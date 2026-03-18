// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// ==========================================
// 3. API 路由 (Routes)
// ==========================================

// [POST] 會員註冊
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 防呆：檢查帳號是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: '帳號已存在' });
        }

        // 安全：密碼加密 (Hash)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 儲存新使用者
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ success: true, message: '註冊成功' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
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

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});