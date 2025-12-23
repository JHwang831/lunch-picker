# 🍱 점심 뭐 먹지?

팀원들과 함께 정하는 점심 메뉴 추천 시스템

## 기능

- ✅ **로그인 시스템** - 비밀번호 보호 (초기: 0000)
- ✅ **자동 로그인** - 한번 로그인하면 유지
- ✅ **AI 추천** - 마지막 섭취일, 개인 선호도 기반 추천
- ✅ **투표 시스템** - 팀원들과 함께 투표
- ✅ **메뉴 관리** - 자유롭게 메뉴 추가/삭제
- ✅ **개인 프로필** - 선호/비선호 메뉴 설정, 비밀번호 변경
- ✅ **히스토리** - 언제 무엇을 먹었는지 기록

## 로컬에서 실행하기

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 빌드
```bash
npm run build
```

## Vercel 배포

### GitHub에 올리기
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lunch-picker.git
git push -u origin main
```

### Vercel에서 배포
1. https://vercel.com 접속
2. GitHub로 로그인
3. "New Project" 클릭
4. 저장소 선택
5. Framework Preset: "Vite" 선택
6. Deploy!

## 사용자 정보

기본 사용자 (초기 비밀번호: 0000):
- 황준혁
- 유명해
- 원태웅
- 김민철
- 배영은
- 김근희
- 박재훈

⚠️ **중요**: 이 버전은 localStorage를 사용하므로 각 브라우저에 데이터가 개별 저장됩니다. 팀원들과 실시간으로 데이터를 공유하려면 Firebase 버전이 필요합니다.

## 기술 스택

- React 18
- Vite
- Tailwind CSS
- Lucide React (아이콘)
- LocalStorage (데이터 저장)

## 라이센스

MIT
