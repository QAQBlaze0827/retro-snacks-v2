require('dns').setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 引入 Resend
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ==========================================
// 1. 資料庫連線與自動匯入商品
// ==========================================
const dbUrl = process.env.MONGODB_URI || 'mongodb://db:27017/retro_shop';

// 初始商品清單
const initialProducts = [
    { name: "彈珠汽水", price: 30, image: "images/ramune.jpg", category: "drink", description: "復古玻璃瓶裝，內含彈珠的經典汽水" },
    { name: "果粒多", price: 25, image: "images/guoliduo.jpg", category: "drink", description: "滿滿果粒的清爽果汁" },
    { name: "牛奶糖", price: 15, image: "images/milk_candy.jpg", category: "candy", description: "濃郁奶香，入口即化的甜蜜滋味" },
    { name: "布丁", price: 20, image: "images/pudding.jpg", category: "candy", description: "古早味雞蛋布丁" },
    { name: "養樂多", price: 10, image: "images/yakult.jpg", category: "drink", description: "陪伴大家長大的發酵乳" },
    { name: "飛壘口香糖", price: 10, image: "images/feilei.jpg", category: "candy", options: ["草莓", "橘子", "藍莓", "荔枝"], description: "可以吹出超大泡泡的經典口香糖" },
    { name: "可口可樂糖", price: 10, image: "images/coke.jpg", category: "candy", description: "可樂形狀的硬糖，香甜可口" },
    { name: "CC樂", price: 12, image: "images/cc.jpg", category: "candy", description: "管狀彩色糖果，小朋友的最愛" },
    { name: "麥香系列", price: 15, image: "images/maixiang.jpg", category: "drink", options: ["紅茶", "綠茶", "奶茶"], description: "熟悉的麥香最對味" }
];

mongoose.connect(dbUrl)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        
        // 自動檢查並匯入商品
        const count = await Product.countDocuments();
        if (count === 0) {
            console.log('🚀 資料庫商品為空，正在匯入初始資料...');
            await Product.insertMany(initialProducts);
            console.log('✅ 商品資料匯入成功！');
        }
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// 2. 定義資料模型 (Schemas)
// ==========================================

// 使用者模型
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    birthday: { type: String, default: "" },
    phone: { type: String, default: "" },
    preference: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    codeExpires: Date
});
const User = mongoose.model('User', userSchema);

// 商品模型
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "經典懷舊零食" },
    image: { type: String, required: true },
    category: { type: String, required: true },
    options: [String] // 存放口味陣列
});
const Product = mongoose.model('Product', productSchema);

// ==========================================
// 3. API 路由 (Routes)
// ==========================================

// --- 商品相關 API ---

// [GET] 取得所有商品
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ success: false, message: "抓取商品失敗" });
    }
});

// --- 會員相關 API ---

// [POST] 會員註冊
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: '帳號或 Email 已存在' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            verificationCode: code,
            codeExpires: Date.now() + 300000
        });

        await newUser.save();

        // 使用 Resend 寄信
        try {
            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: email, 
                subject: '您的註冊驗證碼',
                html: `<strong>哈囉 ${username}！</strong><br>您的驗證碼是：<h1>${code}</h1>`
            });
            console.log(`🚀 驗證碼已寄至: ${email}`);
        } catch (mailErr) {
            console.error("❌ Resend 寄信失敗 (可能受限沙盒模式):", mailErr.message);
        }

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// [POST] 驗證驗證碼
app.post('/api/verify', async (req, res) => {
    try {
        const { username, code } = req.body;

        // 萬用碼邏輯
        if (code === '000000') {
            const user = await User.findOne({ username });
            if (user) {
                user.isVerified = true;
                user.verificationCode = undefined;
                user.codeExpires = undefined;
                await user.save();
                return res.json({ success: true, message: '測試驗證成功！' });
            }
        }
        
        const user = await User.findOne({ username, verificationCode: code });
        if (!user || user.codeExpires < Date.now()) {
            return res.status(400).json({ success: false, message: '驗證碼錯誤或已過期' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.codeExpires = undefined;
        await user.save();

        res.json({ success: true, message: '驗證成功！' });
    } catch (err) {
        res.status(500).json({ success: false, message: '驗證失敗' });
    }
});

// [POST] 會員登入
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: '帳號或密碼錯誤' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ success: false, message: '帳號尚未驗證' });
        }

        res.json({ success: true, message: '登入成功', user: { username: user.username } });
    } catch (err) {
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// [GET] 取得特定使用者完整資料 (整合版)
app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ success: false, message: '找不到使用者' });
        
        res.json({ 
            success: true, 
            username: user.username,
            email: user.email,
            birthday: user.birthday,
            phone: user.phone,
            preference: user.preference
        });
    } catch (err) {
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// [PUT] 更新使用者詳細資料
app.put('/api/user/update', async (req, res) => {
    try {
        const { username, birthday, phone, preference } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { username: username },
            { birthday, phone, preference },
            { new: true }
        );
        res.json({ success: true, message: "更新成功", user: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: "更新失敗" });
    }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});