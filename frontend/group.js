// backend 주소는 본인의 Codespaces 3001 포트 주소로 설정해야 합니다.
const backendUrl = 'https://refactored-dollop-r7g4vxgppv7h56gv-3001.app.github.dev';

const groupTitleElement = document.getElementById('group-title');
const itemListContainer = document.getElementById('item-list-container');
const backLink = document.getElementById('back-link');

async function fetchGroupData(groupId, siteId) {
    // 뒤로가기 링크에 사이트 ID를 먼저 설정합니다.
    if(siteId) {
        backLink.href = `index.html?site=${siteId}`;
    }

    const apiUrl = `${backendUrl}/api/public/link_groups/${groupId}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('서버 응답 오류');
        
        const data = await response.json();
        
        // 데이터 로드 후, site_id가 없다면 다시 설정
        if(!siteId && data.group.site_id) {
             backLink.href = `index.html?site=${data.group.site_id}`;
        }
        
        document.title = data.group.title;
        groupTitleElement.textContent = data.group.title;
        
        let itemsHtml = '<div class="link-group" style="width: auto; background: white;"><ol>';
        if (data.items.length > 0) {
            data.items.forEach(item => {
                let targetUrl = item.url;
                if (targetUrl && !targetUrl.startsWith('http')) { targetUrl = 'https://' + targetUrl; }
                itemsHtml += `<li class="rank-${item.rank}"><a href="${targetUrl}" target="_blank">${item.name}</a></li>`;
            });
        } else {
            itemsHtml += '<li>등록된 항목이 없습니다.</li>';
        }
        itemsHtml += '</ol></div>';
        itemListContainer.innerHTML = itemsHtml;

    } catch (error) {
        document.body.innerHTML = `<h1>오류: 데이터를 불러올 수 없습니다.</h1><p>그룹 ID(${groupId})가 올바른지 확인해주세요.</p>`;
    }
}

function initialize() {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('group');
    const siteId = params.get('site'); // site ID도 함께 가져옵니다.

    if (groupId) {
        fetchGroupData(groupId, siteId);
    } else {
        document.body.innerHTML = '<h1>그룹이 지정되지 않았습니다.</h1>';
    }
}

initialize();