const form = document.getElementById('banner-form');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const banner = {
        link_url: document.getElementById('link_url').value,
        image_url: document.getElementById('image_url').value,
        alt_text: document.getElementById('alt_text').value,
    };

    try {
        const response = await fetch('/api/banners', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(banner),
        });

        if (response.ok) {
            messageDiv.textContent = '✅ 배너가 성공적으로 저장되었습니다!';
            messageDiv.style.color = 'green';
            form.reset();
        } else {
            const result = await response.json();
            throw new Error(result.error || '저장에 실패했습니다.');
        }
    } catch (error) {
        messageDiv.textContent = `❌ 오류: ${error.message}`;
        messageDiv.style.color = 'red';
    }
});