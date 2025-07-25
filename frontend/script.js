// Codespaces의 3001 포트에 해당하는 공개 주소를 여기에 입력해야 합니다.
const backendUrl = 'https://solid-guacamole-jjgj4g74q994cpgvw-3001.app.github.dev';

// --- 페이지 요소 ---
const siteTitleElement = document.getElementById('site-title');
const telegramLinkElement = document.getElementById('telegram-link');
const bannerGrid = document.querySelector('.banner-grid');
const linkListsContainer = document.getElementById('link-lists-container');
const clockElement = document.getElementById('clock');
const dateElement = document.getElementById('date');
const placeholderImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22375%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text/css%22%3E%23holder%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%2C%20monospace%3Bfont-size%3A19pt%20%7D%20%3C/style%3E%3C/defs%3E%3Cg%3E%3Crect%20width%3D%22375%22%20height%3D%22100%22%20fill%3D%22%23EEEEEE%22%3E%3C/rect%3E%3Cg%3E%3Ctext%20x%3D%22123.5%22%20y%3D%2258.6%22%3E%EB%B0%B0%EB%84%88%20%EC%A4%80%EB%B9%84%EC%A4%91%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E';

// --- 기능 함수 ---

// 실시간 시계 업데이트
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

// 사이트 정보 렌더링
function renderSiteInfo(site) {
    document.title = site.site_name;
    siteTitleElement.textContent = site.site_name;
    siteTitleElement.style.fontFamily = site.title_font;
    document.body.style.backgroundColor = site.theme_color;
    if (site.telegram_link) {
        let targetUrl = site.telegram_link;
        if (targetUrl && !targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }
        telegramLinkElement.href = targetUrl;
    }
}

// 배너 렌더링
function renderBanners(banners) {
    bannerGrid.innerHTML = '';
    banners.forEach(banner => {
        const link = document.createElement('a');
        const image = document.createElement('img');
        if (banner) {
            let targetUrl = banner.link_url;
            if (targetUrl && !targetUrl.startsWith('http')) { targetUrl = 'https://' + targetUrl; }
            link.href = targetUrl;
            link.target = '_blank';
            image.src = `${backendUrl}${banner.image_url}`;
            image.alt = banner.alt_text;
        } else {
            link.href = '#';
            image.src = placeholderImage;
            image.alt = '배너 준비중';
        }
        link.appendChild(image);
        bannerGrid.appendChild(link);
    });
}

// 링크 목록 렌더링
function renderLinkLists(groups, siteId) {
    linkListsContainer.innerHTML = '';
    for(let i = 0; i < 10; i++) {
        const group = groups[i];
        const listEl = document.createElement('div');
        listEl.className = 'link-group';

        if (group) {
            const detailPageUrl = `group.html?site=${siteId}&group=${group.id}`;
            let itemsHtml = '<ol>';
            group.items.forEach(item => {
                let targetUrl = item.url;
                if (targetUrl && !targetUrl.startsWith('http')) { targetUrl = 'https://' + targetUrl; }
                itemsHtml += `<li class="rank-${item.rank}"><a href="${targetUrl}" target="_blank">${item.name}</a></li>`;
            });
            itemsHtml += '</ol>';

            listEl.innerHTML = `
                <a href="${detailPageUrl}" class="link-group-header">
                    <h3>${group.title}</h3>
                    <span class="arrow">&gt;</span>
                </a>
                ${itemsHtml}
                <div class="link-group-footer">
                    <a href="${detailPageUrl}">... 더보기</a>
                </div>
            `;
        } else {
            listEl.innerHTML = `<div class="link-group-header"><h3>목록 준비중</h3></div><ol style="height: 325px;"></ol>`;
        }
        linkListsContainer.appendChild(listEl);
    }
}

// 서버에서 모든 데이터 가져오기
async function fetchData(siteId) {
    try {
        const bannerPromise = fetch(`${backendUrl}/api/public/sites/${siteId}/banners`);
        const linksPromise = fetch(`${backendUrl}/api/public/sites/${siteId}/link_lists`);
        
        const [bannerResponse, linksResponse] = await Promise.all([bannerPromise, linksPromise]);
        
        if (!bannerResponse.ok || !linksResponse.ok) throw new Error('서버 응답 오류');
        
        const bannerData = await bannerResponse.json();
        const linkGroups = await linksResponse.json();
        
        renderSiteInfo(bannerData.site);
        renderBanners(bannerData.banners);
        renderLinkLists(linkGroups, siteId);

    } catch (error) {
        console.error('데이터를 가져오는 데 실패했습니다:', error);
        document.body.innerHTML = `<h1>오류: 데이터를 불러올 수 없습니다.</h1><p>사이트 ID(${siteId})가 올바른지 확인해주세요.</p>`;
    }
}

// 페이지 초기화 및 시작
function initialize() {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site');
    if (siteId) {
        setInterval(updateTime, 1000);
        updateTime();
        fetchData(siteId);
    } else {
        document.body.innerHTML = '<h1>사이트가 지정되지 않았습니다.</h1><p>주소창에 ?site=1 과 같이 사이트 ID를 추가해주세요.</p>';
    }
}

initialize();