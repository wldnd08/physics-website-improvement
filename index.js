const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 데이터베이스 연결 설정 (Neon.tech 사용 예정)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// 4개 카테고리 정의
const categories = [
  { id: 'dynamics', name: '동역학' },
  { id: 'thermodynamics', name: '열역학' },
  { id: 'fluids', name: '유체역학' },
  { id: 'quantum', name: '양자역학' }
];

// 홈 화면: 4개 카테고리 목록 표시
app.get('/', (req, res) => {
  res.render('index', { categories });
});

// 특정 카테고리의 개념 목록 보기
app.get('/category/:id', async (req, res) => {
  const categoryId = req.params.id;
  const category = categories.find(c => c.id === categoryId);
  
  try {
    const conceptsResult = await pool.query('SELECT * FROM concepts WHERE category_id = $1 ORDER BY created_at DESC', [categoryId]);
    const concepts = conceptsResult.rows;

    // 각 개념에 대한 댓글들을 가져와서 추가합니다.
    for (let concept of concepts) {
      const commentsResult = await pool.query('SELECT * FROM comments WHERE concept_id = $1 ORDER BY created_at ASC', [concept.id]);
      concept.comments = commentsResult.rows;
    }

    res.render('category', { category, concepts });
  } catch (err) {
    console.error(err);
    res.render('category', { category, concepts: [] });
  }
});

// 새로운 개념 추가하기
app.post('/add-concept', async (req, res) => {
  const { category_id, title, content } = req.body;
  try {
    await pool.query('INSERT INTO concepts (category_id, title, content) VALUES ($1, $2, $3)', [category_id, title, content]);
    res.redirect(`/category/${category_id}`);
  } catch (err) {
    console.error(err);
    res.send('저장 중 오류가 발생했습니다.');
  }
});

// 댓글 추가하기 (간단하게 구현)
app.post('/add-comment', async (req, res) => {
  const { concept_id, category_id, author, comment } = req.body;
  try {
    await pool.query('INSERT INTO comments (concept_id, author, comment) VALUES ($1, $2, $3)', [concept_id, author, comment]);
    res.redirect(`/category/${category_id}`);
  } catch (err) {
    console.error(err);
    res.send('댓글 저장 중 오류가 발생했습니다.');
  }
});

// 개념 삭제하기
app.post('/delete-concept', async (req, res) => {
  const { concept_id, category_id } = req.body;
  try {
    await pool.query('DELETE FROM concepts WHERE id = $1', [concept_id]);
    res.redirect(`/category/${category_id}`);
  } catch (err) {
    console.error(err);
    res.send('삭제 중 오류가 발생했습니다.');
  }
});

// 댓글 삭제하기
app.post('/delete-comment', async (req, res) => {
  const { comment_id, category_id } = req.body;
  try {
    await pool.query('DELETE FROM comments WHERE id = $1', [comment_id]);
    res.redirect(`/category/${category_id}`);
  } catch (err) {
    console.error(err);
    res.send('댓글 삭제 중 오류가 발생했습니다.');
  }
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
