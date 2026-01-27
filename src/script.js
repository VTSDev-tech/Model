function transitionToPage(event, url) {
    if (event) event.preventDefault(); // Đảm bảo chặn mọi hành động mặc định
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
            mapImage.onload = () => {
                mapComp.classList.add('loaded');
            };
        }
    }

    markers.forEach(marker => {
        marker.addEventListener('click', function(e) {
            const label = this.querySelector('.glass-label')?.textContent?.trim();

            // Ưu tiên xử lý Parking Management bằng logic chặn sự kiện mạnh mẽ
            if (label === 'PARKING MANAGEMENT') {
                e.preventDefault();
                e.stopPropagation(); // Ngăn chặn tuyệt đối việc nhảy vào thẻ a gốc

                const targetUrl = 'https://vtsdev-tech.github.io/parking/#/dashboard';
                
                this.style.transform = 'translate(-60px, 0px) scale(0.9)';
                
                setTimeout(() => {
                    transitionToPage(e, targetUrl);
                    // Reset lại vị trí cũ sau khi nhấn
                    this.style.transform = 'translate(-60px, 0px)';
                }, 150);
                
                return false; 
            }

            if (!this.querySelector('a')) {
                console.log(`Bạn đã nhấn vào: ${label}`);
                
                this.style.transform = 'translate(-60px, 0px) scale(0.9)';
                setTimeout(() => {
                    this.style.transform = 'translate(-60px, 0px)';
                }, 150);
            }
        });
    });

    const overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
        // Luôn ép overlay ẩn đi khi trang được tải/tải lại
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    }

    // === PHẦN FIX MỚI: Buộc reload khi load từ cache (back/forward button) ===
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {  // Trang được load lại từ cache (khi nhấn back/forward)
            console.log('Trang load từ cache (back button) → reload để tránh redirect cũ');
            
            // Kiểm tra nếu đang ở trang parking (hoặc hash liên quan)
            if (window.location.href.includes('vtsdev-tech.github.io/parking') || 
                window.location.hash.includes('/dashboard') || 
                window.location.hash.includes('/login')) {
                
                // Buộc reload trang fresh, bỏ qua cache redirect
                window.location.reload();
            }
        }
    });
    // === Kết thúc phần fix ===
});

window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.warn('Cảnh báo: Không tìm thấy ảnh tại img/image.jpg');
    }
}, true);