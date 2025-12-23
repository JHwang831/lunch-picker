import React, { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, Settings, Plus, Check, X, Filter, Star } from 'lucide-react';

const LunchPicker = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); // login, home, menu, profile, history
  const [menus, setMenus] = useState([]);
  const [users, setUsers] = useState([]);
  const [votes, setVotes] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const loadedMenus = JSON.parse(localStorage.getItem('menus') || 'null') || getDefaultMenus();
      const loadedUsers = JSON.parse(localStorage.getItem('users') || 'null') || getDefaultUsers();
      
      setMenus(loadedMenus);
      setUsers(loadedUsers);
      setVotes(JSON.parse(localStorage.getItem('votes') || '{}'));
      setHistory(JSON.parse(localStorage.getItem('history') || '[]'));

      // 초기 사용자가 없으면 기본 사용자 저장
      if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(getDefaultUsers()));
      }

      // 자동 로그인 확인
      const savedUserId = localStorage.getItem('currentUserId');
      if (savedUserId) {
        const user = loadedUsers.find(u => u.id === parseInt(savedUserId));
        if (user) {
          setCurrentUser(user);
          setView('home');
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      const defaultUsers = getDefaultUsers();
      setMenus(getDefaultMenus());
      setUsers(defaultUsers);
      setVotes({});
      setHistory([]);
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    setLoading(false);
  };

  const getDefaultMenus = () => [
    { id: 1, name: '김치찌개', category: '한식', heaviness: '보통', price: 1, emoji: '🍲' },
    { id: 2, name: '된장찌개', category: '한식', heaviness: '보통', price: 1, emoji: '🥘' },
    { id: 3, name: '삼겹살', category: '한식', heaviness: '헤비함', price: 2, emoji: '🥓' },
    { id: 4, name: '비빔밥', category: '한식', heaviness: '보통', price: 1, emoji: '🍚' },
    { id: 5, name: '파스타', category: '양식', heaviness: '보통', price: 2, emoji: '🍝' },
    { id: 6, name: '스테이크', category: '양식', heaviness: '헤비함', price: 3, emoji: '🥩' },
    { id: 7, name: '샐러드', category: '양식', heaviness: '가벼움', price: 2, emoji: '🥗' },
    { id: 8, name: '짜장면', category: '중식', heaviness: '헤비함', price: 1, emoji: '🍜' },
    { id: 9, name: '짬뽕', category: '중식', heaviness: '헤비함', price: 1, emoji: '🍲' },
    { id: 10, name: '초밥', category: '일식', heaviness: '보통', price: 2, emoji: '🍣' },
    { id: 11, name: '라멘', category: '일식', heaviness: '헤비함', price: 2, emoji: '🍜' },
    { id: 12, name: '샌드위치', category: '양식', heaviness: '가벼움', price: 1, emoji: '🥪' }
  ];

  const getDefaultUsers = () => [
    { id: 1, username: '황준혁', password: '0000', preferences: { disliked: [], preferred: [] } },
    { id: 2, username: '유명해', password: '0000', preferences: { disliked: [], preferred: [] } },
    { id: 3, username: '원태웅', password: '0000', preferences: { disliked: [], preferred: [] } },
    { id: 4, username: '김민철', password: '0000', preferences: { disliked: [], preferred: [] } },
    { id: 5, username: '배영은', password: '0000', preferences: { disliked: [], preferred: [] } },
    { id: 6, username: '김근희', password: '0000', preferences: { disliked: [], preferred: [] } },
    { id: 7, username: '박재훈', password: '0000', preferences: { disliked: [], preferred: [] } }
  ];

  const saveData = (type, data) => {
    try {
      localStorage.setItem(type, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${type}:`, error);
    }
  };

  const handleLogin = (username, password) => {
    const user = users.find(u => u.username === username);
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
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
    setView('login');
  };

  const handlePasswordChange = (oldPassword, newPassword) => {
    if (currentUser.password !== oldPassword) {
      return { success: false, error: '현재 비밀번호가 틀렸습니다' };
    }
    
    const updatedUser = { ...currentUser, password: newPassword };
    const updatedUsers = users.map(u =>
      u.id === updatedUser.id ? updatedUser : u
    );
    
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
    saveData('users', updatedUsers);
    
    return { success: true };
  };

  const handleVote = (menuId) => {
    const today = new Date().toDateString();
    const newVotes = { ...votes };
    
    if (!newVotes[today]) {
      newVotes[today] = {};
    }
    
    if (!newVotes[today][currentUser.id]) {
      newVotes[today][currentUser.id] = [];
    }
    
    const userVotes = newVotes[today][currentUser.id];
    if (userVotes.includes(menuId)) {
      newVotes[today][currentUser.id] = userVotes.filter(id => id !== menuId);
    } else {
      newVotes[today][currentUser.id] = [...userVotes, menuId];
    }
    
    setVotes(newVotes);
    saveData('votes', newVotes);
  };

  const recordLunch = (menuId) => {
    const today = new Date().toISOString().split('T')[0];
    const newHistory = [...history, { date: today, menuId, userId: currentUser.id }];
    setHistory(newHistory);
    saveData('history', newHistory);
  };

  const getRecommendations = () => {
    const today = new Date();
    const userPrefs = currentUser?.preferences || { disliked: [], preferred: [] };
    
    return menus
      .filter(menu => !userPrefs.disliked.includes(menu.id))
      .map(menu => {
        const lastEaten = history
          .filter(h => h.menuId === menu.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        const daysSince = lastEaten 
          ? Math.floor((today - new Date(lastEaten.date)) / (1000 * 60 * 60 * 24))
          : 999;
        
        const preferredBonus = userPrefs.preferred.includes(menu.id) ? 50 : 0;
        const randomBonus = Math.random() * 30;
        
        const score = daysSince + preferredBonus + randomBonus;
        
        return { ...menu, score, daysSince, lastEaten: lastEaten?.date };
      })
      .sort((a, b) => b.score - a.score);
  };

  const getTodayVotes = () => {
    const today = new Date().toDateString();
    const todayVotes = votes[today] || {};
    
    const voteCounts = {};
    Object.values(todayVotes).forEach(userVotes => {
      userVotes.forEach(menuId => {
        voteCounts[menuId] = (voteCounts[menuId] || 0) + 1;
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

  // Login Screen
  if (view === 'login') {
    return <LoginScreen onLogin={handleLogin} existingUsers={users} />;
  }

  // Main App
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b-2 border-orange-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🍱</div>
            <div>
              <h1 className="text-2xl font-bold text-orange-900" style={{ fontFamily: 'Georgia, serif' }}>
                점심 뭐 먹지?
              </h1>
              <p className="text-sm text-orange-600">안녕하세요, {currentUser.username}님!</p>
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

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {[
            { id: 'home', label: '홈', icon: <TrendingUp size={18} /> },
            { id: 'menu', label: '메뉴 관리', icon: <Settings size={18} /> },
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'home' && (
          <HomeView
            menus={menus}
            votes={votes}
            currentUser={currentUser}
            onVote={handleVote}
            getTodayVotes={getTodayVotes}
            getRecommendations={getRecommendations}
            onRecordLunch={recordLunch}
          />
        )}
        {view === 'menu' && (
          <MenuView
            menus={menus}
            onUpdate={(newMenus) => {
              setMenus(newMenus);
              saveData('menus', newMenus);
            }}
          />
        )}
        {view === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            menus={menus}
            onUpdate={(updatedUser) => {
              const updatedUsers = users.map(u =>
                u.id === updatedUser.id ? updatedUser : u
              );
              setUsers(updatedUsers);
              setCurrentUser(updatedUser);
              saveData('users', updatedUsers);
            }}
            onPasswordChange={handlePasswordChange}
          />
        )}
        {view === 'history' && (
          <HistoryView history={history} menus={menus} users={users} />
        )}
      </main>
    </div>
  );
};

// Login Screen Component
const LoginScreen = ({ onLogin, existingUsers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password) {
      const result = onLogin(username.trim(), password);
      if (!result.success) {
        setError(result.error);
      }
    }
  };

  const handleQuickLogin = (user) => {
    setUsername(user.username);
    setError('');
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
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:outline-none text-lg"
                placeholder="이름을 입력하세요"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-orange-900 font-semibold mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:outline-none text-lg"
                placeholder="비밀번호 (초기: 0000)"
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              로그인
            </button>
          </form>

          {existingUsers.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-orange-600 mb-2">빠른 선택:</p>
              <div className="flex flex-wrap gap-2">
                {existingUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
                  >
                    {user.username}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
            💡 처음 사용하시나요? 초기 비밀번호는 <strong>0000</strong> 입니다
          </div>
        </div>
      </div>
    </div>
  );
};

// Home View Component
const HomeView = ({ menus, votes, currentUser, onVote, getTodayVotes, getRecommendations, onRecordLunch }) => {
  const [filter, setFilter] = useState({ category: 'all', heaviness: 'all', price: 'all' });
  const voteCounts = getTodayVotes();
  const today = new Date().toDateString();
  const userVotes = votes[today]?.[currentUser.id] || [];

  const recommendations = getRecommendations();
  const topPick = recommendations[0];

  const filteredMenus = menus.filter(menu => {
    if (filter.category !== 'all' && menu.category !== filter.category) return false;
    if (filter.heaviness !== 'all' && menu.heaviness !== filter.heaviness) return false;
    if (filter.price !== 'all' && menu.price !== parseInt(filter.price)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* AI Recommendation */}
      {topPick && (
        <div className="bg-gradient-to-r from-orange-400 to-amber-400 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
              🎯 오늘의 추천
            </h2>
            <button
              onClick={() => onRecordLunch(topPick.id)}
              className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              선택완료
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-7xl">{topPick.emoji}</div>
            <div>
              <h3 className="text-4xl font-bold mb-2">{topPick.name}</h3>
              <div className="flex gap-3 text-sm">
                <span className="bg-white/30 px-3 py-1 rounded-full">{topPick.category}</span>
                <span className="bg-white/30 px-3 py-1 rounded-full">{topPick.heaviness}</span>
                <span className="bg-white/30 px-3 py-1 rounded-full">{'₩'.repeat(topPick.price)}</span>
              </div>
              {topPick.daysSince < 999 && (
                <p className="mt-2 text-white/80">마지막으로 먹은지 {topPick.daysSince}일 지남</p>
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
        <h2 className="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-2">
          <Users size={24} />
          오늘의 투표
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMenus.map(menu => {
            const voteCount = voteCounts[menu.id] || 0;
            const hasVoted = userVotes.includes(menu.id);

            return (
              <button
                key={menu.id}
                onClick={() => onVote(menu.id)}
                className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-3 ${
                  hasVoted ? 'border-orange-500 bg-orange-50' : 'border-orange-100'
                }`}
              >
                {voteCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                    {voteCount}
                  </div>
                )}
                {hasVoted && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </div>
                )}
                <div className="text-5xl mb-3">{menu.emoji}</div>
                <h3 className="font-bold text-lg text-orange-900 mb-2">{menu.name}</h3>
                <div className="flex flex-wrap gap-1 text-xs">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    {menu.category}
                  </span>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    {menu.heaviness}
                  </span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    {'₩'.repeat(menu.price)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Menu Management View
const MenuView = ({ menus, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: '',
    category: '한식',
    heaviness: '보통',
    price: 1,
    emoji: '🍚'
  });

  const handleAdd = () => {
    if (newMenu.name.trim()) {
      onUpdate([...menus, { ...newMenu, id: Date.now() }]);
      setNewMenu({ name: '', category: '한식', heaviness: '보통', price: 1, emoji: '🍚' });
      setIsAdding(false);
    }
  };

  const handleDelete = (id) => {
    onUpdate(menus.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-900">메뉴 관리</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? '취소' : '메뉴 추가'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">메뉴 이름</label>
              <input
                type="text"
                value={newMenu.name}
                onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
                placeholder="김치찌개"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">이모지</label>
              <input
                type="text"
                value={newMenu.emoji}
                onChange={(e) => setNewMenu({ ...newMenu, emoji: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none text-2xl"
                placeholder="🍲"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">카테고리</label>
              <select
                value={newMenu.category}
                onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              >
                <option value="한식">한식</option>
                <option value="양식">양식</option>
                <option value="중식">중식</option>
                <option value="일식">일식</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">포만감</label>
              <select
                value={newMenu.heaviness}
                onChange={(e) => setNewMenu({ ...newMenu, heaviness: e.target.value })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              >
                <option value="가벼움">가벼움</option>
                <option value="보통">보통</option>
                <option value="헤비함">헤비함</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">가격대</label>
              <select
                value={newMenu.price}
                onChange={(e) => setNewMenu({ ...newMenu, price: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              >
                <option value="1">₩</option>
                <option value="2">₩₩</option>
                <option value="3">₩₩₩</option>
              </select>
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
        {menus.map(menu => (
          <div
            key={menu.id}
            className="relative bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100"
          >
            <button
              onClick={() => handleDelete(menu.id)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
            <div className="text-5xl mb-3">{menu.emoji}</div>
            <h3 className="font-bold text-lg text-orange-900 mb-2">{menu.name}</h3>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {menu.category}
              </span>
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {menu.heaviness}
              </span>
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                {'₩'.repeat(menu.price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Profile View Component
const ProfileView = ({ currentUser, menus, onUpdate, onPasswordChange }) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const togglePreference = (type, menuId) => {
    const preferences = { ...currentUser.preferences };
    const list = preferences[type];
    
    if (list.includes(menuId)) {
      preferences[type] = list.filter(id => id !== menuId);
    } else {
      preferences[type] = [...list, menuId];
      // Remove from opposite list
      const opposite = type === 'disliked' ? 'preferred' : 'disliked';
      preferences[opposite] = preferences[opposite].filter(id => id !== menuId);
    }
    
    onUpdate({ ...currentUser, preferences });
  };

  const handlePasswordSubmit = (e) => {
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

    const result = onPasswordChange(oldPassword, newPassword);
    
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
              <label className="block text-sm font-semibold text-orange-900 mb-2">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">
                새 비밀번호
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-orange-900 mb-2">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none"
              />
            </div>
            {passwordError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {passwordError}
              </div>
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
        <h3 className="font-bold text-orange-900 mb-4">선호하는 메뉴</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {menus.map(menu => {
            const isPreferred = currentUser.preferences.preferred.includes(menu.id);
            const isDisliked = currentUser.preferences.disliked.includes(menu.id);

            return (
              <button
                key={menu.id}
                onClick={() => togglePreference('preferred', menu.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isPreferred
                    ? 'bg-green-100 border-green-500'
                    : isDisliked
                    ? 'bg-gray-100 border-gray-300 opacity-50'
                    : 'bg-white border-orange-200 hover:border-orange-400'
                }`}
              >
                <div className="text-3xl mb-2">{menu.emoji}</div>
                <div className="text-sm font-semibold text-orange-900">{menu.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100">
        <h3 className="font-bold text-orange-900 mb-4">싫어하는 메뉴</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {menus.map(menu => {
            const isPreferred = currentUser.preferences.preferred.includes(menu.id);
            const isDisliked = currentUser.preferences.disliked.includes(menu.id);

            return (
              <button
                key={menu.id}
                onClick={() => togglePreference('disliked', menu.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isDisliked
                    ? 'bg-red-100 border-red-500'
                    : isPreferred
                    ? 'bg-gray-100 border-gray-300 opacity-50'
                    : 'bg-white border-orange-200 hover:border-orange-400'
                }`}
              >
                <div className="text-3xl mb-2">{menu.emoji}</div>
                <div className="text-sm font-semibold text-orange-900">{menu.name}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// History View Component
const HistoryView = ({ history, menus, users }) => {
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
                  const menu = menus.find(m => m.id === record.menuId);
                  const user = users.find(u => u.id === record.userId);
                  
                  if (!menu) return null;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-xl"
                    >
                      <div className="text-3xl">{menu.emoji}</div>
                      <div>
                        <div className="font-semibold text-orange-900">{menu.name}</div>
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

export default LunchPicker;
