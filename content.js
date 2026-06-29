// Lấy headers từ trang GoLike
function extractHeaders() {
    const headers = {};

    // Lấy từ localStorage
    try {
        const auth = localStorage.getItem('golike_auth') || localStorage.getItem('authorization');
        if (auth) headers.Authorization = auth;
    } catch (e) {}

    // Lấy từ sessionStorage
    try {
        const token = sessionStorage.getItem('token') || sessionStorage.getItem('t');
        if (token) headers['t'] = token;
    } catch (e) {}

    // Lấy từ cookies
    try {
        const cookies = document.cookie.split(';');
        cookies.forEach(c => {
            const [key, val] = c.trim().split('=');
            if (key === 't' || key === 'token') {
                headers['t'] = val;
            }
            if (key === 'g-avatar' || key === 'gavatar') {
                headers['g-avatar'] = val;
            }
            if (key === 'g-device-id' || key === 'gdevice') {
                headers['g-device-id'] = val;
            }
            if (key === 'g-username' || key === 'gusername') {
                headers['g-username'] = val;
            }
        });
    } catch (e) {}

    // Lấy từ các script tag
    try {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            const text = script.textContent || '';
            // Tìm Authorization
            const authMatch = text.match(/Authorization["']?\s*[:=]\s*["']([^"']+)["']/i);
            if (authMatch && !headers.Authorization) {
                headers.Authorization = authMatch[1];
            }
            // Tìm token T
            const tokenMatch = text.match(/["']t["']?\s*[:=]\s*["']([^"']+)["']/i);
            if (tokenMatch && !headers['t']) {
                headers['t'] = tokenMatch[1];
            }
        });
    } catch (e) {}

    // Lấy từ meta tags
    try {
        document.querySelectorAll('meta').forEach(meta => {
            const name = meta.getAttribute('name');
            const content = meta.getAttribute('content');
            if (name && content) {
                if (name.includes('authorization')) headers.Authorization = content;
                if (name.includes('token')) headers['t'] = content;
                if (name.includes('g-avatar')) headers['g-avatar'] = content;
                if (name.includes('g-device-id')) headers['g-device-id'] = content;
                if (name.includes('g-username')) headers['g-username'] = content;
            }
        });
    } catch (e) {}

    // User-Agent
    headers['User-Agent'] = navigator.userAgent;

    // Platform detection
    const platform = [];
    if (document.querySelector('[href*="instagram"]')) platform.push('Instagram');
    if (document.querySelector('[href*="facebook"]') || document.querySelector('[href*="fb.com"]')) platform.push('Facebook');
    if (document.querySelector('[href*="tiktok"]')) platform.push('TikTok');
    headers.platform = platform.join(', ') || 'Unknown';

    return headers;
}

// Gửi headers về popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getHeaders') {
        const headers = extractHeaders();
        sendResponse({ headers: headers });
    }
    return true;
});

// Lắng nghe sự kiện thay đổi URL
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Notify background
        chrome.runtime.sendMessage({
            action: 'urlChanged',
            url: location.href
        });
    }
}).observe(document, { subtree: true, childList: true });

console.log('🔑 GoLike API Copier loaded');
