// إدارة الـ Cookies
let currentCookies = [];

document.getElementById('addCookieBtn').addEventListener('click', async () => {
    const cookie = document.getElementById('cookieInput').value.trim();
    if (!cookie) return addLog('❌ الرجاء إدخال Cookie صالح', 'error');
    
    addLog('🔄 جاري التحقق من الـ Cookie...', 'info');
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
    } else {
        addLog(`❌ ${data.message}`, 'error');
    }
});

function updateCookiesList() {
    const listDiv = document.getElementById('cookiesList');
    listDiv.innerHTML = currentCookies.map(c => `
        <div class="cookie-item">
            <span>🍪 ${c.user.name}</span>
            <button class="btn small remove-cookie" data-cookie="${c.cookie}">إزالة</button>
        </div>
    `).join('');
}

// تحديث معلومات الحساب
document.getElementById('refreshInfoBtn')?.addEventListener('click', async () => {
    if (currentCookies.length === 0) {
        addLog('❌ لا يوجد Cookies نشطة', 'error');
        return;
    }
    
    const infoDiv = document.getElementById('accountInfo');
    infoDiv.innerHTML = '<div class="loading">جاري التحميل...</div>';
    
    for (const cookieData of currentCookies) {
        const response = await fetch('/api/cookie-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie: cookieData.cookie })
        });
        
        if (response.ok) {
            const info = await response.json();
            infoDiv.innerHTML += `
                <div class="account-details">
                    <h4>${info.name}</h4>
                    <p>💰 روبوكس: ${info.robux}</p>
                    <p>📍 الموقع: ${info.location}</p>
                    <p>🎂 تاريخ الميلاد: ${info.birthday}</p>
                    <p>⚥ الجنس: ${info.gender}</p>
                </div>
            `;
        }
    }
});

// الإجراءات الجماعية
document.querySelectorAll('.mass-action').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const action = btn.dataset.action;
        addLog(`🔄 بدء تنفيذ: ${action}...`, 'info');
        
        // هنا سيتم استدعاء الـ API المناسب
        const response = await fetch(`/api/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookies: currentCookies.map(c => c.cookie) })
        });
        
        if (response.ok) {
            addLog(`✅ تم تنفيذ ${action} بنجاح`, 'success');
        } else {
            addLog(`❌ فشل في تنفيذ ${action}`, 'error');
        }
    });
});

// سرقة الملابس
document.getElementById('stealClothesBtn')?.addEventListener('click', async () => {
    const groupId = document.getElementById('groupId').value;
    if (!groupId) {
        addLog('❌ الرجاء إدخال معرف المجموعة', 'error');
        return;
    }
    
    addLog(`🔄 جاري سرقة ملابس المجموعة ${groupId}...`, 'info');
    const response = await fetch('/api/steal-group-clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            cookie: currentCookies[0]?.cookie,
            groupId 
        })
    });
    
    const result = await response.json();
    addLog(result.message, result.success ? 'success' : 'error');
});

// إضافة سجل
function addLog(message, type = 'info') {
    const logDiv = document.getElementById('logMessages');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// تبديل علامات التبويب
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// تحميل تلقائي للمعلومات عند بدء التشغيل
window.addEventListener('load', () => {
    addLog('✨ الأداة جاهزة للاستخدام. قم بإضافة Cookie للبدء.', 'info');
});
