const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy } = require('firebase/firestore');

// Firebase 설정 정보 (.env 파일에서 불러옴)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Firebase 및 Firestore 데이터베이스 초기화
const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);
const diariesCol = collection(firestoreDb, 'diaries');

/**
 * 새로운 일기 데이터를 Firestore에 안전하게 저장합니다.
 * @param {Object} diaryEntry 학생 일기 객체 (studentName, emotion, content, aiResponse)
 * @returns {Object} 저장된 일기 객체
 */
async function saveDiary(diaryEntry) {
  try {
    const newEntry = {
      studentName: diaryEntry.studentName,
      emotion: diaryEntry.emotion,
      content: diaryEntry.content,
      aiResponse: diaryEntry.aiResponse,
      createdAt: new Date().toISOString()
    };
    
    // Firestore 문서 추가 (Add Document)
    const docRef = await addDoc(diariesCol, newEntry);
    
    return {
      id: docRef.id,
      ...newEntry
    };
  } catch (error) {
    console.error('Firebase 저장 중 오류 발생:', error);
    throw new Error('일기 데이터를 Firebase에 저장하는 데 실패했습니다.');
  }
}

/**
 * 저장된 모든 일기 목록을 Firestore에서 가져옵니다. 최신순으로 정렬하여 반환합니다.
 * @returns {Array} 일기 객체 배열
 */
async function getAllDiaries() {
  try {
    // 작성일 기준 역순(최신순) 정렬 쿼리
    const q = query(diariesCol, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const diaries = [];
    querySnapshot.forEach((doc) => {
      diaries.push({ id: doc.id, ...doc.data() });
    });
    
    return diaries;
  } catch (error) {
    console.error('Firebase 읽기 중 오류 발생:', error);
    throw new Error('일기 데이터를 Firebase에서 불러오는 데 실패했습니다.');
  }
}

module.exports = {
  saveDiary,
  getAllDiaries
};
