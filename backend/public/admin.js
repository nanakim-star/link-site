// public/admin.js

const form = document.getElementById('banner-form');
const messageDiv = document.getElementById('message');
const bannerListDiv = document.getElementById('banner-list');

// 페이지가 로드될 때 현재 배너 목록을 불러오는 함수
async function loadBanners() {
    try {
        const response = await fetch('/api/banners');
        const banners = await response.json();

        bannerListDiv.innerHTML = ''; // 목록을 비웁니다.

        banners.forEach(banner => {
            const bannerItem = document.createElement('div');
            bannerItem.innerHTML = `
                <span>
                    <strong>ID: ${banner.id}</strong> | ${banner.alt_text} (${banner.image_url})
                </span>
                <button class="delete-btn" data-id="${banner.id}">삭제</button>
            `;
            bannerListDiv.appendChild(bannerItem);
        });
    } catch (error) {
        bannerListDiv.innerHTML = '<p style="color: red;">배너 목록을 불러오는 데 실패했습니다.</p>';
    }
}

// 배너 추가 폼 제출 이벤트
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... (기존 추가하기 코드와 동일) ...
    const banner = {
        link_url: document.getElementById('link_url').value,
        image_url: document.getElementById('image_url').value,
        alt_text: document.getElementById('alt_text').value,
    };

    try {
        const response = await fetch('/api/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(banner),
        });

        if (response.ok) {
            messageDiv.textContent = '✅ 배너가 성공적으로 저장되었습니다!';
            messageDiv.style.color = 'green';
            form.reset();
            loadBanners(); // 저장 후 목록 새로고침
        } else {
            const result = await response.json();
            throw new Error(result.error || '저장에 실패했습니다.');
        }
    } catch (error) {
        messageDiv.textContent = `❌ 오류: ${error.message}`;
        messageDiv.style.color = 'red';
    }
});

// 삭제 버튼 클릭 이벤트
bannerListDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        if (confirm(`정말로 ID ${id} 배너를 삭제하시겠습니까?`)) {
            try {
                const response = await fetch(`/api/banners/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    alert('성공적으로 삭제되었습니다.');
                    loadBanners(); // 삭제 후 목록 새로고침
                } else {
                    throw new Error('삭제에 실패했습니다.');
                }
            } catch (error) {
                alert(error.message);
            }
        }
    }
});

// 페이지 첫 로드 시 배너 목록 불러오기
loadBanners();