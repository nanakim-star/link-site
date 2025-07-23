document.addEventListener('DOMContentLoaded', () => {
    // 뷰 요소
    const siteView = document.getElementById('site-management-view');
    const bannerView = document.getElementById('banner-management-view');
    const linkView = document.getElementById('link-management-view');
    let currentSiteId = null;
    let currentSiteName = '';

    // 공통 요소
    const backToSitesBtns = document.querySelectorAll('.back-to-sites');

    // 사이트 관리 요소
    const siteListDiv = document.getElementById('site-list');
    const siteForm = document.getElementById('site-form');
    const siteEditModal = document.getElementById('site-edit-modal');
    const siteEditForm = document.getElementById('site-edit-form');
    const closeSiteEditModalBtn = document.getElementById('close-site-edit-modal');

    // --- 사이트 관리 기능 ---
    async function loadSites() {
        siteListDiv.innerHTML = '로딩 중...';
        try {
            const response = await fetch('/api/admin/sites');
            const sites = await response.json();
            siteListDiv.innerHTML = '<h2>사이트 목록</h2>';
            if (sites.length === 0) {
                siteListDiv.innerHTML += '<p>생성된 사이트가 없습니다.</p>';
                return;
            }
            sites.forEach(site => {
                const siteItem = document.createElement('div');
                siteItem.className = 'site-item';
                siteItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="display: inline-block; width: 20px; height: 20px; background-color: ${site.theme_color}; border: 1px solid #ccc;"></span>
                        <span><strong>ID: ${site.id}</strong> - ${site.site_name}</span>
                    </div>
                    <div>
                        <button class="edit-site-btn" data-site-id="${site.id}">정보 수정</button>
                        <button class="manage-links-btn" data-site-id="${site.id}" data-site-name="${site.site_name}">링크 목록 관리</button>
                        <button class="manage-banners-btn" data-site-id="${site.id}" data-site-name="${site.site_name}">배너 관리</button>
                    </div>
                `;
                siteListDiv.appendChild(siteItem);
            });
        } catch (error) {
            siteListDiv.innerHTML = '<p style="color: red;">사이트 목록 로딩 실패</p>';
        }
    }

    siteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const siteData = {
            site_name: document.getElementById('site-name').value,
            site_domain: document.getElementById('site-domain').value,
            theme_color: document.getElementById('theme-color').value,
        };
        await fetch('/api/admin/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(siteData) });
        siteForm.reset();
        loadSites();
    });

    siteListDiv.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.matches('.manage-banners-btn')) { showBannerGridView(target.dataset.siteId, target.dataset.siteName); }
        if (target.matches('.manage-links-btn')) { showLinkGroupView(target.dataset.siteId, target.dataset.siteName); }
        if (target.matches('.edit-site-btn')) {
            const siteId = target.dataset.siteId;
            const res = await fetch('/api/admin/sites');
            const sites = await res.json();
            const currentSite = sites.find(s => s.id == siteId);
            document.getElementById('edit-site-id').value = currentSite.id;
            document.getElementById('edit-site-name').value = currentSite.site_name;
            document.getElementById('edit-site-domain').value = currentSite.site_domain;
            document.getElementById('edit-theme-color').value = currentSite.theme_color;
            siteEditModal.style.display = 'flex';
        }
    });

    siteEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const siteId = document.getElementById('edit-site-id').value;
        const siteData = {
            site_name: document.getElementById('edit-site-name').value,
            site_domain: document.getElementById('edit-site-domain').value,
            theme_color: document.getElementById('edit-theme-color').value
        };
        await fetch(`/api/admin/sites/${siteId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(siteData) });
        siteEditModal.style.display = 'none';
        loadSites();
    });
    // --- 배너 관리 기능 ---
    const bannerViewTitle = document.getElementById('banner-view-title');
    const bannerGrid = document.getElementById('banner-grid');
    const bannerModal = document.getElementById('edit-modal');
    const bannerForm = document.getElementById('banner-form');
    const bannerModalTitle = document.getElementById('modal-title');
    const slotIdInput = document.getElementById('slot-id-input');
    const linkUrlInput = document.getElementById('link-url-input');
    const altTextInput = document.getElementById('alt-text-input');
    const imageFileInput = document.getElementById('image-file-input');
    const closeModalBtn = document.getElementById('close-modal');
    const placeholderImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22375%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20375%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text/css%22%3E%23holder%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A19pt%20%7D%20%3C/style%3E%3C/defs%3E%3Cg%3E%3Crect%20width%3D%22375%22%20height%3D%22100%22%20fill%3D%22%23EEEEEE%22%3E%3C/rect%3E%3Cg%3E%3Ctext%20x%3D%22123.5%22%20y%3D%2258.6%22%3E%EB%B0%B0%EB%84%88%20%EC%A4%80%EB%B9%84%EC%A4%91%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E';

    async function loadBanners() {
        if (!currentSiteId) return;
        bannerGrid.innerHTML = '로딩 중...';
        try {
            const response = await fetch(`/api/admin/sites/${currentSiteId}/banners`);
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
            const banners = await response.json();
            bannerGrid.innerHTML = '';
            for (let i = 0; i < 20; i++) {
                const slotData = banners[i];
                const slotElement = document.createElement('div');
                slotElement.className = 'slot';
                const slotId = i + 1;
                if (slotData) {
                    slotElement.innerHTML = `
                        <img src="${slotData.image_url}" alt="${slotData.alt_text}">
                        <div class="slot-info"><strong>슬롯 #${slotId}</strong><br>${slotData.alt_text}</div>
                        <div class="slot-actions">
                            <button class="edit-btn" data-slot-id="${slotId}">수정</button>
                            <button class="delete-btn" data-slot-id="${slotId}">삭제</button>
                        </div>
                    `;
                } else {
                    slotElement.innerHTML = `
                        <img src="${placeholderImage}" alt="배너 준비중">
                        <div class="slot-info"><strong>슬롯 #${slotId}</strong><br>미등록</div>
                        <div class="slot-actions"><button class="register-btn" data-slot-id="${slotId}">등록</button></div>
                    `;
                }
                bannerGrid.appendChild(slotElement);
            }
        } catch (error) {
            bannerGrid.innerHTML = `<p style="color: red;">오류: 배너 목록을 불러올 수 없습니다. (${error.message})</p>`;
        }
    }

    function openBannerModal(slotId, isEditing = false, bannerData = {}) {
        bannerForm.reset();
        slotIdInput.value = slotId;
        if (isEditing) {
            bannerModalTitle.textContent = `슬롯 #${slotId} 수정`;
            linkUrlInput.value = bannerData.link_url;
            altTextInput.value = bannerData.alt_text;
            imageFileInput.required = false;
        } else {
            bannerModalTitle.textContent = `슬롯 #${slotId} 등록`;
            imageFileInput.required = true;
        }
        bannerModal.style.display = 'flex';
    }

    bannerGrid.addEventListener('click', async (e) => {
        const slotId = e.target.dataset.slotId;
        if (!slotId) return;
        if (e.target.matches('.register-btn')) { openBannerModal(slotId); }
        if (e.target.matches('.edit-btn')) {
            const response = await fetch(`/api/admin/sites/${currentSiteId}/banners`);
            const banners = await response.json();
            const bannerData = banners[slotId - 1];
            openBannerModal(slotId, true, bannerData);
        }
        if (e.target.matches('.delete-btn')) {
            if (confirm(`정말로 슬롯 #${slotId}의 배너를 삭제하시겠습니까?`)) {
                await fetch(`/api/admin/sites/${currentSiteId}/banners/${slotId}`, { method: 'DELETE' });
                loadBanners();
            }
        }
    });
    
    bannerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const slotId = document.getElementById('slot-id-input').value;
        const formData = new FormData();
        formData.append('link_url', linkUrlInput.value);
        formData.append('alt_text', altTextInput.value);
        if (imageFileInput.files[0]) {
            formData.append('bannerImage', imageFileInput.files[0]);
        }
        await fetch(`/api/admin/sites/${currentSiteId}/banners/${slotId}`, {
            method: 'POST',
            body: formData,
        });
        bannerModal.style.display = 'none';
        loadBanners();
    });
    // --- 링크 목록 관리 ---
    const linkViewTitle = document.getElementById('link-view-title');
    const linkGroupsContainer = document.getElementById('link-groups-container');
    const newGroupForm = document.getElementById('new-group-form');
    const linkItemsModal = document.getElementById('link-items-modal');
    const linkItemsForm = document.getElementById('link-items-form');
    const linkModalTitle = document.getElementById('link-modal-title');
    const saveLinkItemsBtn = document.getElementById('save-link-items-btn');
    const closeLinkModalBtn = document.getElementById('close-link-modal');
    let currentGroupId = null;

    async function loadLinkGroups() {
        if (!currentSiteId) return;
        linkGroupsContainer.innerHTML = '로딩 중...';
        try {
            const response = await fetch(`/api/admin/sites/${currentSiteId}/link_groups`);
            const groups = await response.json();
            linkGroupsContainer.innerHTML = '';
            if (groups.length === 0) {
                linkGroupsContainer.innerHTML = '<p>생성된 링크 그룹이 없습니다.</p>';
            }
            groups.forEach(group => {
                const groupEl = document.createElement('div');
                groupEl.className = 'link-group';
                groupEl.innerHTML = `
                    <div class="link-group-header">
                        <h3>${group.title}</h3>
                        <div>
                            <button class="edit-items-btn" data-group-id="${group.id}" data-group-title="${group.title}">항목 편집</button>
                            <button class="delete-group-btn" data-group-id="${group.id}">그룹 삭제</button>
                        </div>
                    </div>
                `;
                linkGroupsContainer.appendChild(groupEl);
            });
        } catch(error) {
            linkGroupsContainer.innerHTML = '<p style="color: red;">링크 그룹 로딩 실패</p>';
        }
    }
    
    newGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-group-title').value;
        await fetch(`/api/admin/sites/${currentSiteId}/link_groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        document.getElementById('new-group-title').value = '';
        loadLinkGroups();
    });

    linkGroupsContainer.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.matches('.delete-group-btn')) {
            if (confirm('정말 이 그룹과 하위 항목들을 모두 삭제하시겠습니까?')) {
                await fetch(`/api/admin/link_groups/${target.dataset.groupId}`, { method: 'DELETE' });
                loadLinkGroups();
            }
        }
        if (target.matches('.edit-items-btn')) {
            currentGroupId = target.dataset.groupId;
            linkModalTitle.textContent = `[${target.dataset.groupTitle}] 항목 편집`;
            
            const response = await fetch(`/api/admin/sites/${currentSiteId}/link_groups`);
            const groups = await response.json();
            const currentGroup = groups.find(g => g.id == currentGroupId);
            const items = currentGroup.items || [];

            linkItemsForm.innerHTML = '';
            for (let i = 0; i < 10; i++) {
                const item = items[i] || {};
                linkItemsForm.innerHTML += `<div class="link-item-form"><span>#${i + 1}</span><input type="text" class="item-name" placeholder="이름" value="${item.name || ''}"><input type="text" class="item-url" placeholder="URL" value="${item.url || ''}"></div>`;
            }
            linkItemsModal.style.display = 'flex';
        }
    });

    saveLinkItemsBtn.addEventListener('click', async () => {
        const items = [];
        const itemRows = linkItemsForm.querySelectorAll('.link-item-form');
        itemRows.forEach((row, index) => {
            const name = row.querySelector('.item-name').value;
            const url = row.querySelector('.item-url').value;
            if(name && url) { items.push({ rank: index + 1, name, url }); }
        });

        await fetch(`/api/admin/link_groups/${currentGroupId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        linkItemsModal.style.display = 'none';
    });
    // --- 화면 전환 및 초기화 ---
    function showSiteListView() {
        siteView.classList.remove('hidden');
        bannerView.classList.add('hidden');
        linkView.classList.add('hidden');
        loadSites();
    }
    function showBannerGridView(siteId, siteName) {
        currentSiteId = siteId;
        currentSiteName = siteName;
        siteView.classList.add('hidden');
        bannerView.classList.remove('hidden');
        linkView.classList.add('hidden');
        bannerViewTitle.textContent = `[${siteName}] 배너 관리`;
        loadBanners();
    }
    function showLinkGroupView(siteId, siteName) {
        currentSiteId = siteId;
        currentSiteName = siteName;
        siteView.classList.add('hidden');
        bannerView.classList.add('hidden');
        linkView.classList.remove('hidden');
        linkViewTitle.textContent = `[${siteName}] 링크 목록 관리`;
        loadLinkGroups();
    }
    
    backToSitesBtns.forEach(btn => {
        btn.addEventListener('click', showSiteListView);
    });

    // 모달 닫기 로직
    closeModalBtn.onclick = () => { bannerModal.style.display = 'none'; };
    closeSiteEditModalBtn.onclick = () => { siteEditModal.style.display = 'none'; };
    closeLinkModalBtn.onclick = () => { linkItemsModal.style.display = 'none'; };

    window.onclick = (e) => {
        if (e.target == bannerModal) bannerModal.style.display = 'none';
        if (e.target == siteEditModal) siteEditModal.style.display = 'none';
        if (e.target == linkItemsModal) linkItemsModal.style.display = 'none';
    };

    // 초기 화면 로드
    showSiteListView();
});