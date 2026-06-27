require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json()); // JSON 형식의 본문을 파싱하기 위함
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일(HTML, CSS, JS) 서빙

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * 일기 등록 및 AI 피드백 생성 API
 * 학생이 일기를 제출하면 이 엔드포인트가 호출됩니다.
 */
app.post('/api/diaries', async (req, res) => {
  try {
    const { studentName, emotion, content } = req.body;

    if (!studentName || !emotion || !content) {
      return res.status(400).json({ error: '모든 항목(이름, 감정, 내용)을 입력해주세요.' });
    }

    let aiResponseText = 'AI 응답을 생성하지 못했습니다.';

    // 환경변수에 API Key가 설정되어 있는지 확인
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY가 설정되어 있지 않습니다.');
      aiResponseText = '선생님, 서버에 AI(Gemini) API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.';
    } else {
      try {
        // Gemini 모델 가져오기
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // AI에게 지시할 프롬프트 작성
        const prompt = `
당신은 초등학생의 마음을 잘 알아주는 다정하고 따뜻한 선생님이자 친구입니다.
학생의 이름은 '${studentName}'이고, 오늘의 기분은 '${emotion}'입니다.
다음은 학생이 작성한 일기 내용입니다:
"${content}"

위 일기를 읽고, 학생의 감정에 공감하고 위로와 격려를 해주는 따뜻한 답장을 3~4문장 정도로 작성해주세요. 학생의 눈높이에 맞춰 친절하게 말해주세요.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiResponseText = response.text();
      } catch (aiError) {
        console.error('Gemini API 호출 오류:', aiError);
        aiResponseText = '미안해요, AI 선생님이 너무 바빠서 지금은 답장을 쓰기 어려워요. 조금 뒤에 다시 시도해볼까요?';
      }
    }

    // 데이터베이스에 저장할 일기 데이터 구성
    const newDiary = {
      studentName,
      emotion,
      content,
      aiResponse: aiResponseText
    };

    // db.js를 통해 Firestore에 저장 (비동기 처리)
    const savedDiary = await db.saveDiary(newDiary);
    
    // 클라이언트에 저장된 결과 반환
    res.status(201).json(savedDiary);

  } catch (error) {
    console.error('일기 등록 중 서버 오류 발생:', error);
    res.status(500).json({ error: '서버에 문제가 발생했습니다.' });
  }
});

/**
 * 일기 목록 조회 API
 * 교사 대시보드에서 일기 목록을 가져올 때 호출됩니다.
 */
app.get('/api/diaries', async (req, res) => {
  try {
    const diaries = await db.getAllDiaries();
    res.status(200).json(diaries);
  } catch (error) {
    console.error('일기 조회 중 서버 오류 발생:', error);
    res.status(500).json({ error: '데이터를 가져오는 중 문제가 발생했습니다.' });
  }
});

/**
 * 교사 대시보드 로그인(비밀번호 인증) API
 */
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.TEACHER_PASSWORD) {
    // 실제 운영 환경에서는 JWT 토큰 등을 발급해야 하지만, 
    // 여기서는 간단히 성공 여부만 반환합니다.
    res.status(200).json({ success: true, message: '인증 성공' });
  } else {
    res.status(401).json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
