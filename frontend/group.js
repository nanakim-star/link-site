// backend 주소는 본인의 Codespaces 3001 포트 주소로 설정해야 합니다.
const backendUrl = 'https://solid-guacamole-jjgj4g74q994cpgvw-3001.app.github.dev';

// --- 페이지 요소 ---
const siteTitleElement = document.getElementById('site-title');
const clockElement = document.getElementById('clock');
const dateElement = document.getElementById('date');
const telegramLinkElement = document.getElementById('telegram-link');
const groupTitleElement = document.getElementById('group-title');
const itemGridContainer = document.getElementById('item-grid-container');
const backLink = document.getElementById('back-link');
const placeholderImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22375%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text/css%22%3E%23holder%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%2C%20sans-serif%2C%2C%20monospace%3Bfont-size%3A19pt%20%7D%20%3C/style%3E%3C/defs%3E%3Cg%3E%3Crect%20width%3D%22375%22%20height%3D%22100%22%20fill%3D%22%23EEEEEE%22%3E%3C/rect%3E%3Cg%3E%3Ctext%20x%3D%22123.5%22%20y%3D%2258.6%22%3E%EB%B0%B0%EB%84%88%20%EC%A4%80%EB%B9%84%EC%A4%91%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E';

// --- 기능 함수 ---
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (clockElement) clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
    if (dateElement) dateElement.textContent = `${year}년 ${month}월 ${date}일 (${day})`;
}

// 그룹 항목들을 그리드 형태로 그리는 함수
function renderGroupItemsAsGrid(items) {
    itemGridContainer.innerHTML = '';
    if (items.length === 0) {
        itemGridContainer.innerHTML = '<p style="text-align:center;">이 목록에는 등록된 항목이 없습니다.</p>';
        return;
    }
    items.forEach(item => {
        let targetUrl = item.url;
        if (targetUrl && !targetUrl.startsWith('http')) { targetUrl = 'https://' + targetUrl; }
        
        const link = document.createElement('a');
        link.href = targetUrl;
        link.target = '_blank';
        // item.image_url이 있으면 그걸 쓰고, 없으면 placeholder 사용
        link.innerHTML = `<img src="${item.image_url || placeholderImage}" alt="${item.name}">`;
        
        itemGridContainer.appendChild(link);
    });
}

async function fetchGroupData(siteId, groupId) {
    backLink.href = `index.html?site=${siteId}`;

    try {
        // 상세 페이지에서는 사이트 정보와 그룹 정보를 모두 가져와야 합니다.
        const sitePromise = fetch(`${backendUrl}/api/public/sites/${siteId}/banners`);
        const groupPromise = fetch(`${backendUrl}/api/public/link_groups/${groupId}`);

        const [siteResponse, groupResponse] = await Promise.all([sitePromise, groupPromise]);

        if (!siteResponse.ok || !groupResponse.ok) throw new Error('서버 응답 오류');
        
        const siteData = await siteResponse.json();
        const groupData = await groupResponse.json();

        // 페이지 전체에 사이트 정보 적용
        document.title = `${groupData.group.title} - ${siteData.site.site_name}`;
        siteTitleElement.textContent = siteData.site.site_name;
        siteTitleElement.style.fontFamily = siteData.site.title_font;
        document.body.style.backgroundColor = siteData.site.theme_color;
        if (siteData.site.telegram_link) {
            let telegramUrl = siteData.site.telegram_link;
            if (telegramUrl && !telegramUrl.startsWith('http')) { telegramUrl = 'https://' + telegramUrl; }
            telegramLinkElement.href = telegramUrl;
        }

        // 그룹 제목 표시
        groupTitleElement.textContent = groupData.group.title;
        
        // 항목들을 그리드로 표시
        renderGroupItemsAsGrid(groupData.items);

    } catch (error) {
        console.error('데이터를 가져오는 데 실패했습니다:', error);
        document.body.innerHTML = `<h1>오류: 데이터를 불러올 수 없습니다.</h1><p>주소를 확인해주세요.</p>`;
    }
}

function initialize() {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site');
    const groupId = params.get('group');

    if (siteId && groupId) {
        setInterval(updateTime, 1000);
        updateTime();
        fetchData(siteId, groupId);
    } else {
        document.body.innerHTML = '<h1>사이트 또는 그룹이 지정되지 않았습니다.</h1>';
    }
}

initialize();