// 향후 Render 등에 백엔드 배포 시, 아래 변수에 백엔드 주소를 입력하세요.
const BACKEND_URL = '';

document.addEventListener('DOMContentLoaded', () => {
  const loginArea = document.getElementById('loginArea');
  const dashboardArea = document.getElementById('dashboardArea');
  const teacherPasswordInput = document.getElementById('teacherPassword');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  
  const refreshBtn = document.getElementById('refreshBtn');
  const diaryListContainer = document.getElementById('diaryList');
  const dashboardError = document.getElementById('dashboardError');
  
  const totalDiariesElem = document.getElementById('totalDiaries');
  const recentActivityElem = document.getElementById('recentActivity');

  // 로그인 버튼 클릭 이벤트
  loginBtn.addEventListener('click', async () => {
    const password = teacherPasswordInput.value;
    
    if (!password) {
      showLoginError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      // 서버에 로그인 인증 요청
      const response = await fetch(BACKEND_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // 인증 성공 시 대시보드 표시
        loginArea.classList.add('hidden');
        dashboardArea.classList.remove('hidden');
        loadDiaries(); // 일기 목록 불러오기
      } else {
        showLoginError(result.message || '인증에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      showLoginError('서버와 통신하는 중 문제가 발생했습니다.');
    }
  });

  // 엔터키로 로그인 가능하게 처리
  teacherPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  // 새로고침 버튼 이벤트
  refreshBtn.addEventListener('click', () => {
    loadDiaries();
  });

  // 일기 목록 불러오기 함수
  async function loadDiaries() {
    diaryListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">데이터를 불러오는 중...</div>';
    dashboardError.classList.add('hidden');
    
    try {
      const response = await fetch(BACKEND_URL + '/api/diaries');
      const diaries = await response.json();
      
      if (!response.ok) {
        throw new Error('데이터를 가져오는데 실패했습니다.');
      }
      
      renderDiaries(diaries);
      updateStats(diaries);
      
    } catch (error) {
      console.error('일기 목록 로딩 에러:', error);
      dashboardError.textContent = '일기 데이터를 불러오는 중 오류가 발생했습니다.';
      dashboardError.classList.remove('hidden');
      diaryListContainer.innerHTML = '';
    }
  }

  // 일기 데이터를 HTML로 렌더링하는 함수
  function renderDiaries(diaries) {
    diaryListContainer.innerHTML = ''; // 초기화
    
    if (diaries.length === 0) {
      diaryListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">아직 작성된 일기가 없습니다.</div>';
      return;
    }
    
    diaries.forEach(diary => {
      // 작성일 포맷팅 (예: 2023. 10. 27. 오후 2:30)
      const dateObj = new Date(diary.createdAt);
      const formattedDate = dateObj.toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      const diaryItem = document.createElement('div');
      diaryItem.className = 'diary-item';
      
      // 일기 내용 줄바꿈 처리
      const formattedContent = (diary.content || '').replace(/\n/g, '<br>');
      const formattedAiResponse = (diary.aiResponse || '').replace(/\n/g, '<br>');
      
      diaryItem.innerHTML = `
        <div class="diary-header">
          <div class="diary-author">${diary.studentName} 학생 <span class="emotion-badge" style="margin-left: 0.5rem;">${diary.emotion}</span></div>
          <div class="diary-date">${formattedDate}</div>
        </div>
        <div class="diary-content">
          ${formattedContent}
        </div>
        <div class="ai-response">
          <div class="ai-response-label">🤖 AI 선생님의 피드백</div>
          ${formattedAiResponse}
        </div>
      `;
      
      diaryListContainer.appendChild(diaryItem);
    });
  }

  // 통계 업데이트 함수
  function updateStats(diaries) {
    totalDiariesElem.textContent = diaries.length + ' 건';
    
    if (diaries.length > 0) {
      // 최신 활동 (가장 최근 일기 작성 시간)
      const lastDate = new Date(diaries[0].createdAt);
      const timeString = lastDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      const today = new Date().toLocaleDateString() === lastDate.toLocaleDateString() ? '오늘' : lastDate.toLocaleDateString('ko-KR');
      recentActivityElem.textContent = `${today} ${timeString}`;
    } else {
      recentActivityElem.textContent = '-';
    }
  }

  // 로그인 에러 표시 헬퍼
  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
  }
});
