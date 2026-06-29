let headersData = {};

document.addEventListener('DOMContentLoaded', () => {
    refreshData();
});

function refreshData() {
    const status = document.getElementById('statusMsg');
    status.textContent = '🔄 Đang lấy headers...';
    status.className = 'status';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getHeaders' }, (response) => {
            if (chrome.runtime.lastError) {
                status.textContent = '❌ Vui lòng mở GoLike (app.golike.net)';
                status.className = 'status error';
                return;
            }

            if (response && response.headers) {
                headersData = response.headers;
                renderHeaders(headersData);
                status.textContent = '✅ Đã lấy headers thành công!';
                status.className = 'status success';
            } else {
                status.textContent = '❌ Không tìm thấy headers. Đăng nhập GoLike trước!';
                status.className = 'status error';
            }
        });
    });
}

function renderHeaders(data) {
    const container = document.getElementById('apiData');

    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<div class="status error">❌ Chưa có headers</div>';
        return;
    }

    const fields = [
        { key: 'Authorization', label: 'Authorization' },
        { key: 't', label: 'Token T' },
        { key: 'g-avatar', label: 'g-avatar' },
        { key: 'g-device-id', label: 'g-device-id' },
        { key: 'g-username', label: 'g-username' },
        { key: 'User-Agent', label: 'User-Agent' },
        { key: 'platform', label: 'Platform' }
    ];

    let html = '';
    fields.forEach(f => {
        if (data[f.key]) {
            const value = data[f.key].length > 60 ? data[f.key].substring(0, 60) + '...' : data[f.key];
            html += `
                <div class="header-group">
                    <div class="label">${f.label}</div>
                    <div class="value" title="${data[f.key]}">${value}</div>
                </div>
            `;
        }
    });

    // Platform tags
    if (data.platform) {
        html += `<div style="margin-top:6px;">`;
        data.platform.split(',').forEach(p => {
            html += `<span class="platform-tag ${p.trim().toLowerCase()}">${p.trim()}</span>`;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
}

function copyHeader(key) {
    const status = document.getElementById('statusMsg');
    if (!headersData[key]) {
        status.textContent = `❌ Không tìm thấy ${key}`;
        status.className = 'status error';
        return;
    }

    navigator.clipboard.writeText(headersData[key]).then(() => {
        status.textContent = `✅ Đã copy ${key}`;
        status.className = 'status success';
    }).catch(() => {
        status.textContent = '❌ Copy thất bại';
        status.className = 'status error';
    });
}

function copyAllHeaders() {
    const status = document.getElementById('statusMsg');
    if (!headersData || Object.keys(headersData).length === 0) {
        status.textContent = '❌ Không có dữ liệu';
        status.className = 'status error';
        return;
    }

    const json = JSON.stringify(headersData, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        status.textContent = '✅ Đã copy tất cả headers (JSON)';
        status.className = 'status success';
    }).catch(() => {
        status.textContent = '❌ Copy thất bại';
        status.className = 'status error';
    });
}

// Lắng nghe message từ background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateHeaders') {
        headersData = message.data;
        renderHeaders(headersData);
        document.getElementById('statusMsg').textContent = '✅ Headers đã cập nhật';
        document.getElementById('statusMsg').className = 'status success';
    }
});
