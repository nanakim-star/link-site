// backend 주소는 본인의 Codespaces 3001 포트 주소로 설정해야 합니다.
const backendUrl = 'https://humble-space-guacamole-r4x4rx6rpw49cppjr-3001.app.github.dev';

const bannerGrid = document.querySelector('.banner-grid');
const linkListsContainer = document.getElementById('link-lists-container');
const placeholderImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22375%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text/css%22%3E%23holder%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%2C%20monospace%3Bfont-size%3A19pt%20%7D%20%3C/style%3E%3C/defs%3E%3Cg%3E%3Crect%20width%3D%22375%22%20height%3D%22100%22%20fill%3D%22%23EEEEEE%22%3E%3C/rect%3E%3Cg%3E%3Ctext%20x%3D%22123.5%22%20y%3D%2258.6%22%3E%EB%B0%B0%EB%84%88%20%EC%A4%80%EB%B9%84%EC%A4%91%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E';

// 배너를 화면에 그리는 함수
function renderBanners(data) {
    // 테마 색상은 일단 비활성화 (새로운 디자인과 맞지 않을 수 있음)
    // document.body.style.backgroundColor = data.site.theme_color;
    bannerGrid.innerHTML = '';
    data.banners.forEach(banner => {
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

// 링크 목록을 화면에 그리는 함수 (수정됨)
function renderLinkLists(groups) {
    linkListsContainer.innerHTML = '';
    for(let i = 0; i < 10; i++) {
        const group = groups[i];
        const listEl = document.createElement('div');
        listEl.className = 'link-group';

        if (group) {
            let itemsHtml = '<ol>';
            group.items.forEach(item => {
                let targetUrl = item.url;
                if (targetUrl && !targetUrl.startsWith('http')) { targetUrl = 'https://' + targetUrl; }
                // CSS가 순위 아이콘을 자동으로 표시하도록 div.rank 제거
                itemsHtml += `<li class="rank-${item.rank}"><a href="${targetUrl}" target="_blank">${item.name}</a></li>`;
            });
            itemsHtml += '</ol>';

            listEl.innerHTML = `
                <a href="#" class="link-group-header">
                    <h3>${group.title}</h3>
                    <span class="arrow">&gt;</span>
                </a>
                ${itemsHtml}
                <div class="link-group-footer">
                    <a href="#">... 더보기</a>
                </div>
            `;
        } else {
            listEl.innerHTML = `
                <div class="link-group-header"><h3>목록 준비중</h3></div>
                <ol style="height: 325px;"></ol>
            `;
        }
        linkListsContainer.appendChild(listEl);
    }
}

async function fetchData(siteId) {
    try {
        const bannerPromise = fetch(`${backendUrl}/api/public/sites/${siteId}/banners`);
        const linksPromise = fetch(`${backendUrl}/api/public/sites/${siteId}/link_lists`);
        
        const [bannerResponse, linksResponse] = await Promise.all([bannerPromise, linksPromise]);
        
        if (!bannerResponse.ok || !linksResponse.ok) {
            throw new Error('서버 응답 오류');
        }
        
        const bannerData = await bannerResponse.json();
        const linkGroups = await linksResponse.json();
        
        renderBanners(bannerData);
        renderLinkLists(linkGroups);

    } catch (error) {
        console.error('데이터를 가져오는 데 실패했습니다:', error);
        document.body.innerHTML = `<h1>오류: 데이터를 불러올 수 없습니다.</h1><p>사이트 ID(${siteId})가 올바른지 확인해주세요.</p>`;
    }
}

function initialize() {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site');
    if (siteId) {
        fetchData(siteId);
    } else {
        document.body.innerHTML = '<h1>사이트가 지정되지 않았습니다.</h1><p>주소창에 ?site=1 과 같이 사이트 ID를 추가해주세요.</p>';
    }
}

initialize();