require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3001;

// --- 미들웨어, 인증, DB, 파일업로드 등 ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true, cookie: { secure: false } }));
const checkAuth = (req, res, next) => {
    if (req.session.isAuthenticated) { return next(); }
    res.redirect('/login.html');
};
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../frontend/images/');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.redirect('/admin.html');
    } else { res.redirect('/login.html?error=1'); }
});
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login.html'); });
app.get('/admin.html', checkAuth, (req, res) => { res.sendFile(path.join(__dirname, 'public', 'admin.html')); });
// --- 🔐 관리자 전용 API 라우터 ---
const adminApiRouter = express.Router();
adminApiRouter.use(checkAuth);

// 사이트 관리
adminApiRouter.get('/sites', async (req, res) => { try { const result = await pool.query('SELECT * FROM sites ORDER BY id ASC'); res.json(result.rows); } catch (e) { res.status(500).json({error: e.message}); } });
adminApiRouter.post('/sites', async (req, res) => { try { const { site_name, site_domain, theme_color, telegram_link, title_font } = req.body; const result = await pool.query('INSERT INTO sites (site_name, site_domain, theme_color, telegram_link, title_font) VALUES ($1, $2, $3, $4, $5) RETURNING *', [site_name, site_domain, theme_color, telegram_link, title_font]); res.status(201).json(result.rows[0]); } catch (e) { res.status(500).json({error: e.message}); } });
adminApiRouter.put('/sites/:id', async (req, res) => { try { const { id } = req.params; const { site_name, site_domain, theme_color, telegram_link, title_font } = req.body; const result = await pool.query('UPDATE sites SET site_name = $1, site_domain = $2, theme_color = $3, telegram_link = $4, title_font = $5 WHERE id = $6 RETURNING *', [site_name, site_domain, theme_color, telegram_link, title_font, id]); res.status(200).json(result.rows[0]); } catch (e) { res.status(500).json({ error: e.message, details: e.stack }); } });

// 배너 관리
adminApiRouter.get('/sites/:siteId/banners', async (req, res) => { try { const { siteId } = req.params; const result = await pool.query('SELECT * FROM link_site_banners WHERE site_id = $1', [siteId]); const banners = Array(20).fill(null); result.rows.forEach(row => { banners[row.slot_id - 1] = row; }); res.json(banners); } catch (e) { res.status(500).json({error: e.message}); } });
adminApiRouter.post('/sites/:siteId/banners/:slotId', upload.single('bannerImage'), async (req, res) => { try { const { siteId, slotId } = req.params; const { link_url, alt_text } = req.body; let image_url; if(req.file){image_url = `/images/${req.file.filename}`;} const existing = await pool.query('SELECT * FROM link_site_banners WHERE site_id = $1 AND slot_id = $2', [siteId, slotId]); if (existing.rows.length > 0) { if (image_url) { const oldImagePath = path.join(__dirname, '../frontend', existing.rows[0].image_url); if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath); await pool.query('UPDATE link_site_banners SET link_url = $1, image_url = $2, alt_text = $3 WHERE site_id = $4 AND slot_id = $5', [link_url, image_url, alt_text, siteId, slotId]); } else { await pool.query('UPDATE link_site_banners SET link_url = $1, alt_text = $2 WHERE site_id = $3 AND slot_id = $4', [link_url, alt_text, siteId, slotId]); } } else { if (!image_url) {return res.status(400).json({error: "새로 등록할 때는 이미지 파일이 필요합니다."});} await pool.query('INSERT INTO link_site_banners (site_id, slot_id, link_url, image_url, alt_text) VALUES ($1, $2, $3, $4, $5)', [siteId, slotId, link_url, image_url, alt_text]); } res.status(201).json({ message: '성공' }); } catch (e) { res.status(500).json({error: e.message}); } });
adminApiRouter.delete('/sites/:siteId/banners/:slotId', async (req, res) => { try { const { siteId, slotId } = req.params; const result = await pool.query('DELETE FROM link_site_banners WHERE site_id = $1 AND slot_id = $2 RETURNING *', [siteId, slotId]); if (result.rows.length > 0) { const imagePath = path.join(__dirname, '../frontend', result.rows[0].image_url); if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } res.status(200).json({ message: '삭제 완료' }); } catch (e) { res.status(500).json({error: e.message}); } });
// 링크 목록 관리
adminApiRouter.get('/sites/:siteId/link_groups', async (req, res) => { try { const { siteId } = req.params; const groupsResult = await pool.query('SELECT * FROM link_groups WHERE site_id = $1 ORDER BY display_order ASC', [siteId]); const groups = groupsResult.rows; for (const group of groups) { const itemsResult = await pool.query('SELECT * FROM link_items WHERE group_id = $1 ORDER BY rank ASC', [group.id]); group.items = itemsResult.rows; } res.json(groups); } catch (e) { res.status(500).json({error: e.message}); } });
adminApiRouter.post('/sites/:siteId/link_groups', async (req, res) => { try { const { siteId } = req.params; const { title } = req.body; const result = await pool.query('INSERT INTO link_groups (site_id, title) VALUES ($1, $2) RETURNING *', [siteId, title]); res.status(201).json(result.rows[0]); } catch (e) { res.status(500).json({error: e.message}); } });
adminApiRouter.delete('/link_groups/:groupId', async (req, res) => { try { const { groupId } = req.params; await pool.query('DELETE FROM link_groups WHERE id = $1', [groupId]); res.status(200).json({ message: '삭제 완료' }); } catch (e) { res.status(500).json({error: e.message}); } });
adminApiRouter.post('/link_groups/:groupId/items', async (req, res) => { const client = await pool.connect(); try { const { groupId } = req.params; const { items } = req.body; await client.query('BEGIN'); await client.query('DELETE FROM link_items WHERE group_id = $1', [groupId]); for (const item of items) { if (item.name && item.url) { await client.query('INSERT INTO link_items (group_id, rank, name, url) VALUES ($1, $2, $3, $4)', [groupId, item.rank, item.name, item.url]); } } await client.query('COMMIT'); res.status(201).json({ message: '저장 완료' }); } catch (e) { await client.query('ROLLBACK'); res.status(500).json({error: e.message}); } finally { client.release(); } });

app.use('/api/admin', adminApiRouter);

// --- 🌐 사용자용 공개 API ---
app.get('/api/public/sites/:siteId/banners', async (req, res) => { try { const { siteId } = req.params; const siteResult = await pool.query('SELECT * FROM sites WHERE id = $1', [siteId]); if (siteResult.rows.length === 0) { return res.status(404).json({ error: '사이트를 찾을 수 없습니다.' }); } const bannerResult = await pool.query('SELECT * FROM link_site_banners WHERE site_id = $1', [siteId]); const banners = Array(20).fill(null); bannerResult.rows.forEach(row => { banners[row.slot_id - 1] = row; }); res.json({ site: siteResult.rows[0], banners: banners }); } catch (e) { res.status(500).json({error: e.message}); } });
app.get('/api/public/sites/:siteId/link_lists', async (req, res) => { try { const { siteId } = req.params; const groupsResult = await pool.query('SELECT * FROM link_groups WHERE site_id = $1 ORDER BY display_order ASC', [siteId]); const groups = groupsResult.rows; for (const group of groups) { const itemsResult = await pool.query('SELECT * FROM link_items WHERE group_id = $1 ORDER BY rank ASC', [group.id]); group.items = itemsResult.rows; } res.json(groups); } catch (e) { res.status(500).json({error: e.message}); } });
app.get('/api/public/link_groups/:groupId', async (req, res) => { try { const { groupId } = req.params; const groupResult = await pool.query('SELECT g.*, s.site_name, s.title_font, s.theme_color FROM link_groups g JOIN sites s ON g.site_id = s.id WHERE g.id = $1', [groupId]); if (groupResult.rows.length === 0) { return res.status(404).json({ error: '그룹을 찾을 수 없습니다.'}); } const itemsResult = await pool.query('SELECT * FROM link_items WHERE group_id = $1 ORDER BY rank ASC', [groupId]); const responseData = { group: groupResult.rows[0], items: itemsResult.rows }; res.json(responseData); } catch (e) { res.status(500).json({error: e.message}); } });
// --- 서버 실행 및 테이블 생성 ---
app.listen(port, async () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS sites (
            id SERIAL PRIMARY KEY,
            site_name VARCHAR(255) NOT NULL,
            site_domain VARCHAR(255),
            theme_color VARCHAR(7) DEFAULT '#121212',
            telegram_link TEXT,
            title_font VARCHAR(255) DEFAULT '''Noto Sans KR'', sans-serif'
          );
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS link_site_banners (
            id SERIAL PRIMARY KEY,
            site_id INT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            slot_id INT NOT NULL,
            link_url TEXT NOT NULL,
            image_url TEXT NOT NULL,
            alt_text VARCHAR(255),
            UNIQUE (site_id, slot_id)
          );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS link_groups (
                id SERIAL PRIMARY KEY,
                site_id INT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                display_order INT DEFAULT 0
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS link_items (
                id SERIAL PRIMARY KEY,
                group_id INT NOT NULL REFERENCES link_groups(id) ON DELETE CASCADE,
                rank INT DEFAULT 0,
                name VARCHAR(255) NOT NULL,
                url TEXT NOT NULL
            );
        `);
        console.log("테이블들이 준비되었습니다.");
    } catch (error) {
        console.error('테이블 생성 중 오류 발생:', error);
    }
});