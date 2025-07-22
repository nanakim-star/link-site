// 1. 필요한 도구들을 불러옵니다.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// 2. 기본 설정을 합니다.
const app = express();
const port = 3001;

// 3. 데이터베이스에 연결합니다.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 4. 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 요청 본문 파싱
app.use(express.static('public')); // 'public' 폴더를 정적 파일 경로로 설정

// 5. API: 배너 목록 가져오기 (GET)
app.get('/api/banners', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM link_site_banners ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('DB에서 배너를 가져오는 데 실패했습니다:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 6. API: 새 배너 추가하기 (POST)
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

// 7. 서버 시작
app.listen(port, async () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`관리자 페이지는 http://localhost:${port}/admin.html 에서 접속할 수 있습니다.`);
  
  // 테이블 자동 생성 로직 (기존과 동일)
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