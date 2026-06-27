document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitBtn');
  const studentNameInput = document.getElementById('studentName');
  const emotionSelect = document.getElementById('emotion');
  const contentInput = document.getElementById('content');
  
  const loadingMessage = document.getElementById('loadingMessage');
  const errorMessage = document.getElementById('errorMessage');
  
  const diaryForm = document.getElementById('diary-form');
  const responseArea = document.getElementById('responseArea');
  const aiResponseContent = document.getElementById('aiResponseContent');

  submitBtn.addEventListener('click', async () => {
    // 1. 사용자 입력값 가져오기
    const studentName = studentNameInput.value.trim();
    const emotion = emotionSelect.value;
    const content = contentInput.value.trim();

    // 입력값 검증 (비어있는지 확인)
    if (!studentName || !emotion || !content) {
      showError('모든 항목을 입력해주세요! 빈칸이 있으면 안 돼요.');
      return;
    }

    // 2. 로딩 상태 표시
    hideError();
    submitBtn.disabled = true;
    loadingMessage.classList.remove('hidden');

    try {
      // 3. 서버(백엔드)로 데이터 전송 및 AI 응답 요청
      const response = await fetch('/api/diaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentName, emotion, content })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '서버 응답 오류가 발생했습니다.');
      }

      // 4. 성공적으로 응답을 받으면 화면 변경
      diaryForm.classList.add('hidden'); // 입력 폼 숨기기
      responseArea.classList.remove('hidden'); // 결과 영역 보이기
      
      // 줄바꿈 문자를 HTML 태그로 변환하여 출력
      aiResponseContent.innerHTML = data.aiResponse.replace(/\n/g, '<br>');

    } catch (error) {
      console.error('일기 전송 중 오류 발생:', error);
      showError('일기를 보내는 중 문제가 발생했어요. 인터넷 연결을 확인하거나 나중에 다시 시도해주세요.');
    } finally {
      // 로딩 상태 해제
      submitBtn.disabled = false;
      loadingMessage.classList.add('hidden');
    }
  });

  // 에러 메시지 표시 함수
  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }

  // 에러 메시지 숨김 함수
  function hideError() {
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
  }
});
