const apiUrl = 'https://humble-space-guacamole-r4x4rx6rpw49cppjr-3001.app.github.dev/api/banners';

const bannerGrid = document.querySelector('.banner-grid');

// 백엔드 서버에서 배너 데이터를 가져와서 화면에 표시하는 함수
async function fetchBanners() {
    // 기존의 bannerGrid 내용을 비웁니다.
    bannerGrid.innerHTML = '';

    try {
        const response = await fetch(apiUrl);
        const bannerData = await response.json();

        bannerData.forEach(banner => {
            const link = document.createElement('a');
            link.href = banner.link_url;
            link.target = '_blank';

            const image = document.createElement('img');
            image.src = banner.image_url;
            image.alt = banner.alt_text;

            link.appendChild(image);
            bannerGrid.appendChild(link);
        });

    } catch (error) {
        console.error('배너 데이터를 가져오는 데 실패했습니다:', error);
        bannerGrid.textContent = '배너를 불러올 수 없습니다. 서버 상태를 확인해주세요.';
    }
}

fetchBanners();