function focusArea(areaName) {
    // 1. Hiển thị popup chi tiết
    const popup = document.getElementById('info-popup');
    popup.innerHTML = `
        <div style="padding:10px; color:#00f2ff">
            <h3 style="margin:0">${areaName}</h3>
            <p style="color:#fff; font-size:12px">Status: Active</p>
            <button onclick="this.parentElement.parentElement.style.display='none'">Close</button>
        </div>
    `;
    popup.style.display = 'block';

    // 2. Cập nhật vào Alarm Center bên phải
    const list = document.getElementById('alarmList');
    const entry = document.createElement('div');
    entry.className = 'alarm-card info';
    entry.innerHTML = `
        <div class="alarm-info">
            <strong>SYSTEM: Accessing ${areaName}</strong>
            <span>Time: ${new Date().toLocaleTimeString()} <mark>LIVE</mark></span>
        </div>
    `;
    list.prepend(entry);
}