// استبدال كل الـ fetch endpoints السابقة بالنقاط الصحيحة
// على سبيل المثال:
document.getElementById('unfriendAllBtn').addEventListener('click', async () => {
    const response = await fetch('/api/unfriend-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: currentCookies.map(c => c.cookie) })
    });
    // ...
});
