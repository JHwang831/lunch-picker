import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCtqEGysWYcpZzMcS9orBzlDsjw4Vro5Ko",
  authDomain: "lunch-picker-7ed2f.firebaseapp.com",
  projectId: "lunch-picker-7ed2f",
  storageBucket: "lunch-picker-7ed2f.firebasestorage.app",
  messagingSenderId: "1097447003916",
  appId: "1:1097447003916:web:343c7b245633e9e4955b29",
  measurementId: "G-LG7F23K49V"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 초기화
export const db = getFirestore(app);

// 오프라인 지속성 활성화 (선택사항)
try {
  enableIndexedDbPersistence(db);
} catch (err) {
  if (err.code === 'failed-precondition') {
    console.warn('여러 탭이 열려있어 오프라인 지속성을 사용할 수 없습니다.');
  } else if (err.code === 'unimplemented') {
    console.warn('브라우저가 오프라인 지속성을 지원하지 않습니다.');
  }
}

export default app;
