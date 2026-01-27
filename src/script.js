function transitionToPage(event, url) {
    event.preventDefault(); // Chặn chuyển trang ngay lập tức
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
            // Thêm .trim() để đảm bảo so sánh chính xác tuyệt đối ngay cả khi HTML có khoảng trắng thừa
            const label = this.querySelector('.glass-label')?.textContent?.trim();

            // Kiểm tra nếu là nút PARKING MANAGEMENT thì thực hiện chuyển hướng
            if (label === 'PARKING MANAGEMENT') {
                // Chặn sự kiện lan tỏa để không dính link cũ trong thẻ <a>
                e.preventDefault();
                e.stopPropagation();

                const targetUrl = 'https://vtsdev-tech.github.io/parking/#/dashboard';
                
                // Hiệu ứng bấm nút trước khi chuyển trang
                this.style.transform = 'translate(-60px, 0px) scale(0.9)';
                
                // Gọi hàm transition có sẵn của bạn để chuyển trang mượt mà
                setTimeout(() => {
                    transitionToPage(e, targetUrl);
                }, 150);
                
                return false; 
            }

            if (!this.querySelector('a')) {
                console.log(`Bạn đã nhấn vào: ${label}`);
                
                this.style.transform = 'translate(-60px, 0px) scale(0.9)';
                setTimeout(() => {
                    // Trả về transform mặc định của class .marker.at-action để tránh bị lệch
                    this.style.transform = 'translate(-60px, 0px)';
                }, 150);
            }
        });
    });

    const overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
        // Đảm bảo overlay biến mất khi quay lại trang (xử lý lỗi Back button)
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    }
});

window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.warn('Cảnh báo: Không tìm thấy ảnh tại img/image.jpg');
    }
}, true);