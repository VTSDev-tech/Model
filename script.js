function focusArea(areaName) {
    // 1. Hiển thị popup chi tiết (Cập nhật giao diện đồng bộ với Camera System)
    const popup = document.getElementById('info-popup');
    popup.innerHTML = `
        <div style="padding:15px; background:#1a202c; border:1px solid #0ea5e9; border-radius:8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5)">
            <h3 style="margin:0; color:#0ea5e9; font-family:sans-serif; font-size:16px">${areaName}</h3>
            <p style="color:#10b981; font-size:12px; margin:8px 0">● Trạng thái: Đang hoạt động</p>
            <button onclick="this.closest('#info-popup').style.display='none'" style="cursor:pointer; background:#334155; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:11px; width:100%">Đóng cửa sổ</button>
        </div>
    `;
    popup.style.display = 'block';

    // 2. Cập nhật vào Alarm Center bên phải
    const list = document.getElementById('alarmList');
    const entry = document.createElement('div');
    entry.className = 'alarm-card info';
    entry.innerHTML = `
        <div class="alarm-info" style="border-left:3px solid #0ea5e9; padding:10px; background:rgba(14,165,233,0.1); margin-bottom:5px; border-radius:0 4px 4px 0">
            <strong style="display:block; font-size:13px; color:#f8fafc">HỆ THỐNG: Truy cập ${areaName}</strong>
            <span style="font-size:11px; color:#94a3b8">Thời gian: ${new Date().toLocaleTimeString()} <mark style="background:#ef4444; color:white; padding:1px 4px; border-radius:2px; font-weight:bold">LIVE</mark></span>
        </div>
    `;
    list.prepend(entry);
}