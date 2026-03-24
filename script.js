// ... الكود السابق
// تعديل دالة addCookie
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
        if (response.ok && data.success) {
            currentCookies.push({ cookie: data.user.cookie || cookie, user: data.user });
            updateCookiesList();
            addLog(`✅ تم إضافة Cookie الحساب: ${data.user.name}`, 'success');
            document.getElementById('cookieInput').value = '';
        } else {
            addLog(`❌ ${data.message || 'فشل التحقق من الكوكي'}`, 'error');
        }
    } catch (error) {
        addLog(`❌ خطأ في الاتصال بالخادم: ${error.message}`, 'error');
    }
});
