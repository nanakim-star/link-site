// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
}));
app.use(express.json());
app.use(express.static('public')); 

// API: 배너 목록 가져오기 (GET)
app.get('/api/banners', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM link_site_banners ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('DB에서 배너를 가져오는 데 실패했습니다:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// API: 새 배너 추가하기 (POST)
app.post('/api/banners', async (req, res) => {
  try {
    const { link_url, image_url, alt_text } = req.body;
    if (!link_url || !image_url) {
      return res.status(400).json({ error: '연결 주소와 이미지 경로는 필수입니다.' });
    }
    const result = await pool.query(
      'INSERT INTO link_site_banners (link_url, image_url, alt_text) VALUES ($1, $2, $3) RETURNING *',
      [link_url, image_url, alt_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('DB에 배너를 추가하는 데 실패했습니다:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// --- 이 부분이 새로 추가되었습니다 ---
// API: 기존 배너 삭제하기 (DELETE)
app.delete('/api/banners/:id', async (req, res) => {
  try {
    const { id } = req.params; // 주소에서 삭제할 배너의 id를 가져옵니다.
    const result = await pool.query('DELETE FROM link_site_banners WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '삭제할 배너를 찾을 수 없습니다.' });
    }
    res.status(200).json({ message: '배너가 성공적으로 삭제되었습니다.', deletedBanner: result.rows[0] });
  } catch (error) {
    console.error('DB에서 배너를 삭제하는 데 실패했습니다:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});
// --- 여기까지 ---

app.listen(port, async () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`관리자 페이지는 http://localhost:${port}/admin.html 에서 접속할 수 있습니다.`);
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS link_site_banners (
        id SERIAL PRIMARY KEY,
        link_url TEXT NOT NULL,
        image_url TEXT NOT NULL,
        alt_text VARCHAR(255)
      );
    `);
    console.log('"link_site_banners" 테이블이 준비되었습니다.');
  } catch (error) {
    console.error('테이블 생성 중 오류 발생:', error);
  }
});