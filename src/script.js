function transitionToPage(event, url) {
    if (event) {
        event.preventDefault();
        event.stopPropagation(); // Ngăn bubble lên các element cha
    }
    const overlay = document.getElementById('page-transition-overlay');
    
    if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        setTimeout(() => {
            window.location.href = url;
        }, 500);
    } else {
        window.location.href = url;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mapComp = document.querySelector('.solution-advanced-map-comp');
    const mapImage = mapComp?.querySelector('.img-box img');
    const markers = document.querySelectorAll('.marker.at-action');

    if (mapImage) {
        if (mapImage.complete) {
            mapComp.classList.add('loaded');
        } else {
            mapImage.addEventListener('load', () => {
                mapComp.classList.add('loaded');
            });
            mapImage.addEventListener('error', () => {
                console.warn('Không tải được ảnh bản đồ: img/logomap.png');
                mapComp.classList.add('loaded'); // Vẫn hiển thị marker dù ảnh lỗi
            });
        }
    }

    markers.forEach(marker => {
        marker.addEventListener('click', function(e) {
            const label = this.querySelector('.glass-label')?.textContent?.trim();

            // Xử lý Parking Management: dùng link repo của bạn
            if (label === 'PARKING MANAGEMENT') {
                e.preventDefault();
                e.stopPropagation();

                // Link đúng repo hoanghaiduong (dashboard thay vì login để vào thẳng nếu auth)
                const targetUrl = 'https://hoanghaiduong.github.io/weihu-parking-admin/#/dashboard';
                
                // Hiệu ứng nhấn nhẹ
                this.style.transform = 'translate(-60px, 0px) scale(0.92)';
                
                setTimeout(() => {
                    transitionToPage(e, targetUrl);
                    // Reset vị trí
                    this.style.transform = 'translate(-60px, 0px)';
                }, 180);
                
                return false;
            }

            // Các marker khác
            if (!this.querySelector('a')) {
                console.log(`Bạn đã nhấn vào: ${label}`);
                
                this.style.transform = 'translate(-60px, 0px) scale(0.92)';
                setTimeout(() => {
                    this.style.transform = 'translate(-60px, 0px)';
                }, 180);
            }
        });
    });

    const overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    }

    // === PHẦN FIX: Buộc reload khi load từ cache (back/forward button) ===
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {  // Trang load từ cache (back/forward)
            console.log('Trang load từ cache (back button) → reload để tránh redirect cũ');
            
            // Kiểm tra nếu đang ở trang parking (dùng link hoanghaiduong)
            if (window.location.href.includes('hoanghaiduong.github.io/weihu-parking-admin') || 
                window.location.hash.includes('/dashboard') || 
                window.location.hash.includes('/login')) {
                
                // Buộc reload fresh, bỏ cache redirect
                window.location.reload();
            }
        }
    });
    // === Kết thúc phần fix ===
});

window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.warn('Cảnh báo: Không tìm thấy ảnh tại', e.target.src);
    }
}, true);