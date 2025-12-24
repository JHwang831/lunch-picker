import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, TrendingUp, Settings, Plus, Check, X, Filter, Star, MapPin, Clock, Crown, Trophy, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

const LunchPicker = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [votes, setVotes] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVotingTime, setIsVotingTime] = useState(false);
  const [timeUntilVoteEnd, setTimeUntilVoteEnd] = useState('');
  const [rerollSeed, setRerollSeed] = useState(0);
  const [excludedPickId, setExcludedPickId] = useState(null);
  const [voteUpdateCounter, setVoteUpdateCounter] = useState(0); // 강제 리렌더링용


  // 투표 시간 체크 (9:00 ~ 12:00) + 오후 1시 자동 마감
  useEffect(() => {
    const checkVotingTime = async () => {
      const now = new Date();
      const hours = now.getHours();
      
      // 오후 1시 자동 마감 체크
      if (hours === 13 && now.getMinutes() === 0) {
        await autoCloseDailyVote();
      }
      
      const isWithinVotingHours = hours >= 9 && hours < 12;
      setIsVotingTime(isWithinVotingHours);

      if (isWithinVotingHours) {
        const endTime = new Date();
        endTime.setHours(12, 0, 0, 0);
        const diff = endTime - now;
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilVoteEnd(`${hoursLeft}시간 ${minutesLeft}분 남음`);
      } else if (hours < 9) {
        setTimeUntilVoteEnd('오전 9시에 시작');
      } else {
        setTimeUntilVoteEnd('투표 종료');
      }
    };

    checkVotingTime();
    const interval = setInterval(checkVotingTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Firebase 실시간 리스너
  useEffect(() => {
    if (!currentUser) return;

    const unsubRestaurants = onSnapshot(collection(db, 'restaurants'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      
      const updatedCurrentUser = data.find(u => u.id === currentUser.id);
      if (updatedCurrentUser) {
        setCurrentUser(updatedCurrentUser);
      }
    });

    const unsubVotes = onSnapshot(collection(db, 'votes'), (snapshot) => {
      console.log('🔥 Firebase votes 업데이트!');
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      console.log('새로운 votes 데이터:', data);
      setVotes(data);
      setVoteUpdateCounter(prev => prev + 1); // 강제 리렌더링
    });

    const unsubHistory = onSnapshot(collection(db, 'history'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    return () => {
      unsubRestaurants();
      unsubUsers();
      unsubVotes();
      unsubHistory();
    };
  }, [currentUser]);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      if (usersSnapshot.empty) {
        await initializeDefaultUsers();
      }

      const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
      if (restaurantsSnapshot.empty) {
        await initializeDefaultRestaurants();
      }

      const savedUserId = localStorage.getItem('currentUserId');
      if (savedUserId) {
        const userDoc = await getDoc(doc(db, 'users', savedUserId));
        if (userDoc.exists()) {
          setCurrentUser({ id: userDoc.id, ...userDoc.data() });
          setView('home');
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
    setLoading(false);
  };

  const initializeDefaultUsers = async () => {
    const defaultUsers = [
      { id: '1', username: '황준혁', password: '0000', isAdmin: true, preferences: { disliked: [], preferred: [] } },
      { id: '2', username: '유명해', password: '0000', isAdmin: false, preferences: { disliked: [], preferred: [] } },
      { id: '3', username: '원태웅', password: '0000', isAdmin: false, preferences: { disliked: [], preferred: [] } },
      { id: '4', username: '김민철', password: '0000', isAdmin: false, preferences: { disliked: [], preferred: [] } },
      { id: '5', username: '배영은', password: '0000', isAdmin: false, preferences: { disliked: [], preferred: [] } },
      { id: '6', username: '김근희', password: '0000', isAdmin: false, preferences: { disliked: [], preferred: [] } },
      { id: '7', username: '박재훈', password: '0000', isAdmin: false, preferences: { disliked: [], preferred: [] } }
    ];

    for (const user of defaultUsers) {
      await setDoc(doc(db, 'users', user.id), user);
    }
  };

  const initializeDefaultRestaurants = async () => {
    const defaultRestaurants = [
      { id: '1', name: '대구국수', category: '한식', heaviness: '보통', price: 1, emoji: '🍜',
        naverMapUrl: 'https://naver.me/FV7YpMvT', kakaoMapUrl: 'https://kko.to/cSjoEvKs85', order: 1 },
      { id: '2', name: '잔치마을', category: '한식', heaviness: '보통', price: 2, emoji: '🍲',
        naverMapUrl: 'https://naver.me/Fk7306Cq', kakaoMapUrl: 'https://kko.to/z1y0ICPhzy', order: 2 },
      { id: '3', name: '담담카츠', category: '일식', heaviness: '헤비함', price: 2, emoji: '🍛',
        naverMapUrl: 'https://naver.me/52RKkWZr', kakaoMapUrl: 'https://kko.to/Qh_jQghQOC', order: 3 },
      { id: '4', name: '롯데리아', category: '양식', heaviness: '헤비함', price: 2, emoji: '🍔', order: 4 },
      { id: '5', name: '버거킹', category: '양식', heaviness: '헤비함', price: 2, emoji: '🍔', order: 5 },
      { id: '6', name: '맘스터치', category: '양식', heaviness: '헤비함', price: 2, emoji: '🍔', order: 6 },
      { id: '7', name: '맥도날드', category: '양식', heaviness: '헤비함', price: 2, emoji: '🍟', order: 7 },
      { id: '8', name: '어부지리복어', category: '한식', heaviness: '보통', price: 2, emoji: '🐡',
        naverMapUrl: 'https://naver.me/G2EIGZa9', kakaoMapUrl: 'https://kko.to/huN4JRQdEs', order: 8 },
      { id: '9', name: '동이식당', category: '한식', heaviness: '보통', price: 1, emoji: '🍚',
        naverMapUrl: 'https://naver.me/xmxIg5Be', kakaoMapUrl: 'https://kko.to/XCQWSMMieC', order: 9 },
      { id: '10', name: '행복한마라탕', category: '중식', heaviness: '헤비함', price: 2, emoji: '🌶️',
        naverMapUrl: 'https://naver.me/53leRhjd', kakaoMapUrl: 'https://kko.to/-z8NRhRSp9', order: 10 },
      { id: '11', name: '초막골어탕', category: '한식', heaviness: '보통', price: 1, emoji: '🐟',
        naverMapUrl: 'https://naver.me/xs3Dpij8', kakaoMapUrl: 'https://kko.to/DdhQlzs7qs', order: 11 },
      { id: '12', name: '용길이네국밥집', category: '한식', heaviness: '보통', price: 2, emoji: '🍲',
        naverMapUrl: 'https://naver.me/5bVqeLV8', kakaoMapUrl: 'https://kko.to/pJ2lSpTRtE', order: 12 },
      { id: '13', name: '박여사한식뷔페', category: '한식', heaviness: '헤비함', price: 1, emoji: '🍱',
        naverMapUrl: 'https://naver.me/xIesjweD', kakaoMapUrl: 'https://kko.to/X7b0Lrycxj', order: 13 }
    ];

    for (const restaurant of defaultRestaurants) {
      await setDoc(doc(db, 'restaurants', restaurant.id), restaurant);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const user = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find(u => u.username === username);

      if (user) {
        if (user.password === password) {
          setCurrentUser(user);
          localStorage.setItem('currentUserId', user.id);
          setView('home');
          return { success: true };
        } else {
          return { success: false, error: '비밀번호가 틀렸습니다' };
        }
      } else {
        return { success: false, error: '등록되지 않은 사용자입니다' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다' };
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
    setView('login');
  };

  const handlePasswordChange = async (oldPassword, newPassword) => {
    if (currentUser.password !== oldPassword) {
      return { success: false, error: '현재 비밀번호가 틀렸습니다' };
    }
    
    try {
      await setDoc(doc(db, 'users', currentUser.id), {
        ...currentUser,
        password: newPassword
      });
      
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: '비밀번호 변경 중 오류가 발생했습니다' };
    }
  };

  const handleVote = async (restaurantId) => {
    console.log('🗳️ 투표:', restaurantId);
    
    if (!isVotingTime) {
      alert('투표는 오전 9시부터 12시까지만 가능합니다!');
      return;
    }

    const today = new Date().toDateString();
    const voteDocRef = doc(db, 'votes', today);
    
    try {
      const voteDoc = await getDoc(voteDocRef);
      let voteData = voteDoc.exists() ? voteDoc.data() : {};
      
      if (!voteData[currentUser.id]) {
        voteData[currentUser.id] = [];
      }
      
      const userVotes = voteData[currentUser.id];
      if (userVotes.includes(restaurantId)) {
        voteData[currentUser.id] = userVotes.filter(id => id !== restaurantId);
        console.log('❌ 투표 취소');
      } else {
        voteData[currentUser.id] = [...userVotes, restaurantId];
        console.log('✅ 투표 추가');
      }
      
      await setDoc(voteDocRef, voteData);
      console.log('✅ 저장 완료!');
      
      // 수동으로 votes state 업데이트 (voteData를 변수로 저장)
      const updatedVoteData = { ...voteData };
      setVotes(prev => ({
        ...prev,
        [today]: updatedVoteData
      }));
      setVoteUpdateCounter(prev => prev + 1);
      console.log('🔄 UI 강제 업데이트!');
      
    } catch (error) {
      console.error('❌ Vote error:', error);
      alert('투표 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const recordLunch = async (restaurantId) => {
    const today = new Date().toISOString().split('T')[0];
    const historyId = `${today}_${currentUser.id}_${Date.now()}`;
    
    try {
      await setDoc(doc(db, 'history', historyId), {
        date: today,
        restaurantId,
        userId: currentUser.id,
        timestamp: serverTimestamp()
      });
      
      alert('기록되었습니다!');
    } catch (error) {
      console.error('Record lunch error:', error);
      alert('기록 중 오류가 발생했습니다');
    }
  };

  // 오후 1시 자동 마감 - 1위 밥집 히스토리에 저장 및 투표 초기화
  const autoCloseDailyVote = async () => {
    const today = new Date().toDateString();
    const voteDocRef = doc(db, 'votes', today);
    
    try {
      const voteDoc = await getDoc(voteDocRef);
      if (!voteDoc.exists()) {
        console.log('투표 데이터 없음');
        return;
      }
      
      const voteData = voteDoc.data();
      
      // 투표수 집계
      const voteCounts = {};
      Object.values(voteData).forEach(userVotes => {
        userVotes.forEach(restaurantId => {
          voteCounts[restaurantId] = (voteCounts[restaurantId] || 0) + 1;
        });
      });
      
      // 공동 1위 찾기
      const maxVotes = Math.max(...Object.values(voteCounts), 0);
      const topVotedIds = Object.entries(voteCounts)
        .filter(([id, count]) => count === maxVotes && count > 0)
        .map(([id]) => id);
      
      // 공동 1위일 경우 랜덤 선택
      const winnerId = topVotedIds.length > 0 
        ? topVotedIds[Math.floor(Math.random() * topVotedIds.length)]
        : null;
      
      if (winnerId && maxVotes > 0) {
        console.log(`✅ 오늘의 승자: ${winnerId} (${maxVotes}표)${topVotedIds.length > 1 ? ` - 공동 1위 ${topVotedIds.length}개 중 랜덤 선택` : ''}`);
        
        // 모든 사용자의 히스토리에 추가
        const todayISO = new Date().toISOString().split('T')[0];
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        for (const userDoc of usersSnapshot.docs) {
          const historyId = `${todayISO}_${userDoc.id}_auto_${Date.now()}`;
          await setDoc(doc(db, 'history', historyId), {
            date: todayISO,
            restaurantId: winnerId,
            userId: userDoc.id,
            timestamp: serverTimestamp(),
            isAutomatic: true,
            voteCount: maxVotes
          });
        }
      }
      
      // 투표 데이터 삭제
      await deleteDoc(voteDocRef);
      console.log('✅ 투표 데이터 초기화 완료');
      
    } catch (error) {
      console.error('Auto close error:', error);
    }
  };

  const getRecommendations = () => {
    const today = new Date();
    const userPrefs = currentUser?.preferences || { disliked: [], preferred: [] };
    
    // 날짜 + 리롤 카운터 기반 시드
    const todaySeed = new Date().toDateString() + '_reroll_' + rerollSeed;
    const getSeedRandom = (restaurantId) => {
      // 날짜 + 리롤 + 레스토랑 ID로 고유한 시드 생성
      const seed = todaySeed + restaurantId;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash % 30);
    };
    
    return restaurants
      .filter(restaurant => 
        !userPrefs.disliked.includes(restaurant.id) && 
        restaurant.id !== excludedPickId  // 이전 추천 제외
      )
      .map(restaurant => {
        const lastEaten = history
          .filter(h => h.restaurantId === restaurant.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        const daysSince = lastEaten 
          ? Math.floor((today - new Date(lastEaten.date)) / (1000 * 60 * 60 * 24))
          : 999;
        
        const preferredBonus = userPrefs.preferred.includes(restaurant.id) ? 50 : 0;
        const randomBonus = getSeedRandom(restaurant.id); // 리롤 가능한 랜덤
        
        const score = daysSince + preferredBonus + randomBonus;
        
        return { ...restaurant, score, daysSince, lastEaten: lastEaten?.date };
      })
      .sort((a, b) => b.score - a.score);
  };

  const getTodayVotes = () => {
    const today = new Date().toDateString();
    const todayVotes = votes[today] || {};
    
    const voteCounts = {};
    Object.values(todayVotes).forEach(userVotes => {
      userVotes.forEach(restaurantId => {
        voteCounts[restaurantId] = (voteCounts[restaurantId] || 0) + 1;
      });
    });
    
    return voteCounts;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-2xl text-orange-600">🍱 로딩중...</div>
      </div>
    );
  }

  if (view === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b-2 border-orange-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🍱</div>
            <div>
              <h1 className="text-2xl font-bold text-orange-900" style={{ fontFamily: 'Georgia, serif' }}>
                점심 뭐 먹지?
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-orange-600">안녕하세요, {currentUser.username}님!</p>
                {currentUser.isAdmin && (
                  <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <Crown size={12} />
                    관리자
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-orange-600 hover:text-orange-700 text-sm"
          >
            로그아웃
          </button>
        </div>
      </header>

      <nav className="bg-white/60 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {[
            { id: 'home', label: '홈', icon: <TrendingUp size={18} /> },
            ...(currentUser.isAdmin ? [{ id: 'restaurant', label: '밥집 관리', icon: <Settings size={18} /> }] : []),
            { id: 'profile', label: '내 프로필', icon: <Star size={18} /> },
            { id: 'history', label: '히스토리', icon: <Calendar size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                view === tab.id
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-orange-700 hover:bg-orange-100'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'home' && (
          <HomeView
            key={voteUpdateCounter} // 강제 리렌더링
            restaurants={restaurants}
            votes={votes}
            currentUser={currentUser}
            onVote={handleVote}
            getTodayVotes={getTodayVotes}
            getRecommendations={getRecommendations}
            onRecordLunch={recordLunch}
            isVotingTime={isVotingTime}
            timeUntilVoteEnd={timeUntilVoteEnd}
            onReroll={(currentPickId) => {
              setExcludedPickId(currentPickId);
              setRerollSeed(prev => prev + 1);
            }}
          />
        )}
        {view === 'restaurant' && currentUser.isAdmin && (
          <RestaurantView restaurants={restaurants} />
        )}
        {view === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            restaurants={restaurants}
            onPasswordChange={handlePasswordChange}
          />
        )}
        {view === 'history' && (
          <HistoryView history={history} restaurants={restaurants} users={users} />
        )}
      </main>
    </div>
  );
};

export default LunchPicker;

// LoginScreen Component
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const users = ['황준혁', '유명해', '원태웅', '김민철', '배영은', '김근희', '박재훈'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim() && password) {
      setLoading(true);
      const result = await onLogin(username.trim(), password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">🍱</div>
          <h1 className="text-5xl font-bold text-orange-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            점심 뭐 먹지?
          </h1>
          <p className="text-orange-600">함께 정하는 맛있는 점심</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-orange-200">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-orange-900 font-semibold mb-2">이름</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:outline-none text-lg"
                placeholder="이름을 입력하세요"
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className="block text-orange-900 font-semibold mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:outline-none text-lg"
                placeholder="비밀번호 (초기: 0000)"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-orange-600 mb-2">빠른 선택:</p>
            <div className="flex flex-wrap gap-2">
              {users.map(user => (
                <button
                  key={user}
                  onClick={() => { setUsername(user); setError(''); }}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
                >
                  {user}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
            💡 처음 사용하시나요? 초기 비밀번호는 <strong>0000</strong> 입니다
          </div>
        </div>
      </div>
    </div>
  );
};

// HomeView Component
const HomeView = ({ restaurants, votes, currentUser, onVote, getTodayVotes, getRecommendations, onRecordLunch, isVotingTime, timeUntilVoteEnd, onReroll }) => {
  const [filter, setFilter] = useState({ category: 'all', heaviness: 'all', price: 'all' });
  
  const today = new Date().toDateString();
  const voteCounts = getTodayVotes();
  const userVotes = votes[today]?.[currentUser.id] || [];
  const recommendations = getRecommendations();
  const topPick = recommendations[0];

  // 공동 1위 찾기
  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  const topVotedIds = Object.entries(voteCounts)
    .filter(([id, count]) => count === maxVotes && count > 0)
    .map(([id]) => id);
  const topVotedRestaurants = topVotedIds.map(id => restaurants.find(r => r.id === id)).filter(Boolean);

  const filteredRestaurants = restaurants.filter(restaurant => {
    if (filter.category !== 'all' && restaurant.category !== filter.category) return false;
    if (filter.heaviness !== 'all' && restaurant.heaviness !== filter.heaviness) return false;
    if (filter.price !== 'all' && restaurant.price !== parseInt(filter.price)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* 투표 시간 안내 */}
      <div className={`rounded-2xl p-4 flex items-center justify-between ${
        isVotingTime ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-100 border-2 border-gray-300'
      }`}>
        <div className="flex items-center gap-3">
          <Clock size={24} className={isVotingTime ? 'text-green-600' : 'text-gray-600'} />
          <div>
            <p className={`font-bold ${isVotingTime ? 'text-green-900' : 'text-gray-700'}`}>
              {isVotingTime ? '🎯 투표 진행중!' : '⏰ 투표 시간 아님'}
            </p>
            <p className={`text-sm ${isVotingTime ? 'text-green-700' : 'text-gray-600'}`}>
              {timeUntilVoteEnd}
            </p>
          </div>
        </div>
        {!isVotingTime && (
          <p className="text-sm text-gray-600">투표는 오전 9시~12시</p>
        )}
      </div>

      {/* AI Recommendation */}
      {topPick && (
        <div className="bg-gradient-to-r from-orange-400 to-amber-400 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
              🎯 오늘의 AI 추천
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => onReroll(topPick.id)}
                className="bg-white/80 text-orange-600 px-4 py-2 rounded-full font-semibold hover:bg-white transition-all flex items-center gap-2"
                title="다른 추천 보기"
              >
                <RefreshCw size={18} />
                리롤
              </button>
              <button
                onClick={() => onRecordLunch(topPick.id)}
                className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold hover:bg-orange-50 transition-colors"
              >
                선택완료
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-7xl">{topPick.emoji}</div>
            <div className="flex-1">
              <h3 className="text-4xl font-bold mb-2">{topPick.name}</h3>
              <div className="flex gap-3 text-sm mb-3">
                <span className="bg-white/30 px-3 py-1 rounded-full">{topPick.category}</span>
                <span className="bg-white/30 px-3 py-1 rounded-full">{topPick.heaviness}</span>
                <span className="bg-white/30 px-3 py-1 rounded-full">{'₩'.repeat(topPick.price)}</span>
              </div>
              {topPick.daysSince < 999 && (
                <p className="text-white/80">마지막으로 먹은지 {topPick.daysSince}일 지남</p>
              )}
              {(topPick.naverMapUrl || topPick.kakaoMapUrl) && (
                <div className="flex gap-2 mt-3">
                  {topPick.naverMapUrl && (
                    <a
                      href={topPick.naverMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-white/90 text-green-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-white transition-colors"
                    >
                      <MapPin size={14} />
                      네이버지도
                    </a>
                  )}
                  {topPick.kakaoMapUrl && (
                    <a
                      href={topPick.kakaoMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-white/90 text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-white transition-colors"
                    >
                      <MapPin size={14} />
                      카카오맵
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100">
        <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
          <Filter size={20} />
          필터
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-orange-700 block mb-2">카테고리</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
            >
              <option value="all">전체</option>
              <option value="한식">한식</option>
              <option value="양식">양식</option>
              <option value="중식">중식</option>
              <option value="일식">일식</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-orange-700 block mb-2">포만감</label>
            <select
              value={filter.heaviness}
              onChange={(e) => setFilter({ ...filter, heaviness: e.target.value })}
              className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
            >
              <option value="all">전체</option>
              <option value="가벼움">가벼움</option>
              <option value="보통">보통</option>
              <option value="헤비함">헤비함</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-orange-700 block mb-2">가격대</label>
            <select
              value={filter.price}
              onChange={(e) => setFilter({ ...filter, price: e.target.value })}
              className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
            >
              <option value="all">전체</option>
              <option value="1">₩</option>
              <option value="2">₩₩</option>
              <option value="3">₩₩₩</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voting */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-2">
            <Users size={24} />
            오늘의 투표
          </h2>
          {topVotedRestaurants.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
              <Trophy size={20} className="text-yellow-600" />
              <span className="font-bold text-yellow-900">
                {topVotedRestaurants.length === 1 ? (
                  <>현재 1위: {topVotedRestaurants[0].name} ({maxVotes}표)</>
                ) : (
                  <>공동 1위 ({maxVotes}표): {topVotedRestaurants.map(r => r.name).join(', ')}</>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRestaurants.map(restaurant => {
            const voteCount = voteCounts[restaurant.id] || 0;
            const hasVoted = userVotes.includes(restaurant.id);
            const isTopVoted = topVotedIds.includes(restaurant.id) && voteCount > 0;

            return (
              <div
                key={restaurant.id}
                className={`relative bg-white rounded-2xl p-6 shadow-lg transition-all border-3 ${
                  isTopVoted 
                    ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400'
                    : hasVoted 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-orange-100'
                }`}
              >
                {isTopVoted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Trophy size={12} />
                    1위
                  </div>
                )}
                {voteCount > 0 && (
                  <div className={`absolute -top-2 -right-2 ${isTopVoted ? 'bg-yellow-500' : 'bg-orange-500'} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg`}>
                    {voteCount}
                  </div>
                )}
                <div className="text-5xl mb-3">{restaurant.emoji}</div>
                <h3 className="font-bold text-lg text-orange-900 mb-2">{restaurant.name}</h3>
                <div className="flex flex-wrap gap-1 text-xs mb-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    {restaurant.category}
                  </span>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    {restaurant.heaviness}
                  </span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    {'₩'.repeat(restaurant.price)}
                  </span>
                </div>
                
                {(restaurant.naverMapUrl || restaurant.kakaoMapUrl) && (
                  <div className="flex gap-1 mb-3">
                    {restaurant.naverMapUrl && (
                      <a
                        href={restaurant.naverMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg text-xs hover:bg-green-100 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin size={12} />네이버지도
                      </a>
                    )}
                    {restaurant.kakaoMapUrl && (
                      <a
                        href={restaurant.kakaoMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg text-xs hover:bg-yellow-100 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin size={12} />카카오맵
                      </a>
                    )}
                  </div>
                )}

                <button
                  onClick={() => onVote(restaurant.id)}
                  disabled={!isVotingTime}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    hasVoted
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  } ${!isVotingTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {hasVoted ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check size={16} />
                      투표함
                    </span>
                  ) : (
                    '투표하기'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// RestaurantView Component
const RestaurantView = ({ restaurants }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '', category: '한식', heaviness: '보통', price: 1, emoji: '🍚',
    naverMapUrl: '', kakaoMapUrl: ''
  });

  const handleAdd = async () => {
    if (newRestaurant.name.trim()) {
      try {
        const newId = Date.now().toString();
        const maxOrder = Math.max(...restaurants.map(r => r.order || 0), 0);
        
        await setDoc(doc(db, 'restaurants', newId), {
          ...newRestaurant,
          id: newId,
          order: maxOrder + 1
        });
        
        setNewRestaurant({ name: '', category: '한식', heaviness: '보통', price: 1, emoji: '🍚', naverMapUrl: '', kakaoMapUrl: '' });
        setIsAdding(false);
        alert('밥집이 추가되었습니다!');
      } catch (error) {
        console.error('Add restaurant error:', error);
        alert('밥집 추가 중 오류가 발생했습니다');
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'restaurants', id));
        alert('밥집이 삭제되었습니다!');
      } catch (error) {
        console.error('Delete restaurant error:', error);
        alert('밥집 삭제 중 오류가 발생했습니다');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-2">
          <Crown size={24} className="text-amber-500" />
          밥집 관리 (관리자 전용)
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? '취소' : '밥집 추가'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">밥집 이름 *</label>
              <input
                type="text"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
                placeholder="대구국수"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">이모지 *</label>
              <input
                type="text"
                value={newRestaurant.emoji}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, emoji: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none text-2xl"
                placeholder="🍜"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">카테고리 *</label>
              <select
                value={newRestaurant.category}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, category: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              >
                <option value="한식">한식</option>
                <option value="양식">양식</option>
                <option value="중식">중식</option>
                <option value="일식">일식</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">포만감 *</label>
              <select
                value={newRestaurant.heaviness}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, heaviness: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              >
                <option value="가벼움">가벼움</option>
                <option value="보통">보통</option>
                <option value="헤비함">헤비함</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">가격대 *</label>
              <select
                value={newRestaurant.price}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, price: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              >
                <option value="1">₩</option>
                <option value="2">₩₩</option>
                <option value="3">₩₩₩</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-orange-900 mb-2">네이버 지도 링크</label>
              <input
                type="text"
                value={newRestaurant.naverMapUrl}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, naverMapUrl: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
                placeholder="https://naver.me/..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-orange-900 mb-2">카카오맵 링크</label>
              <input
                type="text"
                value={newRestaurant.kakaoMapUrl}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, kakaoMapUrl: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
                placeholder="https://kko.to/..."
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            추가하기
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {restaurants.map(restaurant => (
          <div
            key={restaurant.id}
            className="relative bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100"
          >
            <button
              onClick={() => handleDelete(restaurant.id)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
            <div className="text-5xl mb-3">{restaurant.emoji}</div>
            <h3 className="font-bold text-lg text-orange-900 mb-2">{restaurant.name}</h3>
            <div className="flex flex-wrap gap-1 text-xs mb-2">
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {restaurant.category}
              </span>
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {restaurant.heaviness}
              </span>
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                {'₩'.repeat(restaurant.price)}
              </span>
            </div>
            {(restaurant.naverMapUrl || restaurant.kakaoMapUrl) && (
              <div className="flex gap-1 mt-2">
                {restaurant.naverMapUrl && (
                  <a href={restaurant.naverMapUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded text-xs">
                    <MapPin size={12} />네이버지도
                  </a>
                )}
                {restaurant.kakaoMapUrl && (
                  <a href={restaurant.kakaoMapUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded text-xs">
                    <MapPin size={12} />카카오맵
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ProfileView Component
const ProfileView = ({ currentUser, restaurants, onPasswordChange }) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const togglePreference = async (type, restaurantId) => {
    const preferences = { ...currentUser.preferences };
    const list = preferences[type];
    
    if (list.includes(restaurantId)) {
      preferences[type] = list.filter(id => id !== restaurantId);
    } else {
      preferences[type] = [...list, restaurantId];
      const opposite = type === 'disliked' ? 'preferred' : 'disliked';
      preferences[opposite] = preferences[opposite].filter(id => id !== restaurantId);
    }
    
    try {
      await setDoc(doc(db, 'users', currentUser.id), {
        ...currentUser,
        preferences
      });
    } catch (error) {
      console.error('Update preference error:', error);
      alert('선호도 업데이트 중 오류가 발생했습니다');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('비밀번호는 최소 4자 이상이어야 합니다');
      return;
    }

    const result = await onPasswordChange(oldPassword, newPassword);
    
    if (result.success) {
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess(false);
      }, 2000);
    } else {
      setPasswordError(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-900">내 프로필</h2>
        <button
          onClick={() => setShowPasswordChange(!showPasswordChange)}
          className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors text-sm"
        >
          {showPasswordChange ? '취소' : '비밀번호 변경'}
        </button>
      </div>

      {showPasswordChange && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
          <h3 className="font-bold text-orange-900 mb-4">비밀번호 변경</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">현재 비밀번호</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              />
            </div>
            {passwordError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                비밀번호가 성공적으로 변경되었습니다!
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              변경하기
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100">
        <h3 className="font-bold text-orange-900 mb-4">선호하는 밥집</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {restaurants.map(restaurant => {
            const isPreferred = currentUser.preferences.preferred.includes(restaurant.id);
            const isDisliked = currentUser.preferences.disliked.includes(restaurant.id);

            return (
              <button
                key={restaurant.id}
                onClick={() => togglePreference('preferred', restaurant.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isPreferred
                    ? 'bg-green-100 border-green-500'
                    : isDisliked
                    ? 'bg-gray-100 border-gray-300 opacity-50'
                    : 'bg-white border-orange-200 hover:border-orange-400'
                }`}
              >
                <div className="text-3xl mb-2">{restaurant.emoji}</div>
                <div className="text-sm font-semibold text-orange-900">{restaurant.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100">
        <h3 className="font-bold text-orange-900 mb-4">싫어하는 밥집</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {restaurants.map(restaurant => {
            const isPreferred = currentUser.preferences.preferred.includes(restaurant.id);
            const isDisliked = currentUser.preferences.disliked.includes(restaurant.id);

            return (
              <button
                key={restaurant.id}
                onClick={() => togglePreference('disliked', restaurant.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isDisliked
                    ? 'bg-red-100 border-red-500'
                    : isPreferred
                    ? 'bg-gray-100 border-gray-300 opacity-50'
                    : 'bg-white border-orange-200 hover:border-orange-400'
                }`}
              >
                <div className="text-3xl mb-2">{restaurant.emoji}</div>
                <div className="text-sm font-semibold text-orange-900">{restaurant.name}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// HistoryView Component
const HistoryView = ({ history, restaurants, users }) => {
  const groupedHistory = history.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-900">히스토리</h2>

      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-orange-600">
            아직 기록이 없습니다
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100">
              <h3 className="font-bold text-orange-900 mb-4">{date}</h3>
              <div className="flex flex-wrap gap-4">
                {groupedHistory[date].map((record, idx) => {
                  const restaurant = restaurants.find(r => r.id === record.restaurantId);
                  const user = users.find(u => u.id === record.userId);
                  
                  if (!restaurant) return null;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-xl"
                    >
                      <div className="text-3xl">{restaurant.emoji}</div>
                      <div>
                        <div className="font-semibold text-orange-900">{restaurant.name}</div>
                        <div className="text-sm text-orange-600">{user?.username}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};