let cachedHeaders = {};

// Lắng nghe message từ content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'urlChanged') {
        // Refresh headers khi URL thay đổi
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id === sender.tab.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getHeaders' }, (response) => {
                    if (response && response.headers) {
                        cachedHeaders = response.headers;
                        // Gửi update đến popup
                        chrome.runtime.sendMessage({
                            action: 'updateHeaders',
                            data: cachedHeaders
                        });
                    }
                });
            }
        });
    }
});

// Intercept API requests để lấy headers thực tế
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.url.includes('gateway.golike.net')) {
            const headers = {};
            details.requestHeaders.forEach(h => {
                headers[h.name] = h.value;
            });
            cachedHeaders = { ...cachedHeaders, ...headers };
            
            // Lưu vào storage
            chrome.storage.local.set({ headers: cachedHeaders });
        }
        return { requestHeaders: details.requestHeaders };
    },
    { urls: ['https://gateway.golike.net/*'] },
    ['requestHeaders', 'extraHeaders']
);

// Lấy headers từ storage khi popup mở
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        chrome.storage.local.get(['headers'], (result) => {
            if (result.headers) {
                port.postMessage({
                    action: 'updateHeaders',
                    data: result.headers
                });
            }
        });
    }
});

console.log('🔑 GoLike API Copier Background Service');
