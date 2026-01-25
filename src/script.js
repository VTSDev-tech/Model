
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

            if (!this.querySelector('a')) {
                const label = this.querySelector('.glass-label')?.textContent;
                console.log(`Bạn đã nhấn vào: ${label}`);
                
 
                this.style.transform = 'translate(-60px, 0px) scale(0.9)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
    });
    const overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    }
});

window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.warn('Cảnh báo: Không tìm thấy ảnh tại img/image.jpg');
    }
}, true);