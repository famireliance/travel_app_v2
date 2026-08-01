'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Login State
  const [loginInput, setLoginInput] = useState('');
  
  // User Search State
  const [searchEmail, setSearchEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [serviceRoleWarning, setServiceRoleWarning] = useState('');
  
  // All Users State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordMessage, setChangePasswordMessage] = useState('');

  // Grant State
  const [islandId, setIslandId] = useState('');
  const [status, setStatus] = useState('visited');
  const [visitedAt, setVisitedAt] = useState('');
  const [note, setNote] = useState('');
  const [grantMessage, setGrantMessage] = useState('');
  const [grantHistory, setGrantHistory] = useState<any[]>([]);

  // Sections
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'password' | 'moderation'

  // Moderation State
  const [diaries, setDiaries] = useState<any[]>([]);
  const [isLoadingDiaries, setIsLoadingDiaries] = useState(false);
  const [diariesMessage, setDiariesMessage] = useState('');

  useEffect(() => {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
    // Set default datetime to now
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setVisitedAt(localISOTime);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput) {
      sessionStorage.setItem('admin_password', loginInput);
      setPassword(loginInput);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setServiceRoleWarning('');
    setUser(null);
    try {
      const res = await fetch('/api/admin/find-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ email: searchEmail })
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.status === 503) {
        setServiceRoleWarning(data.error);
        return;
      }
      if (!res.ok) {
        setSearchError(data.error || 'エラーが発生しました');
        return;
      }
      setUser(data);
    } catch (err: any) {
      setSearchError(err.message);
    }
  };

  const handleFetchAllUsers = async () => {
    setIsLoadingUsers(true);
    setSearchError('');
    setServiceRoleWarning('');
    try {
      const res = await fetch('/api/admin/list-users', {
        method: 'GET',
        headers: {
          'x-admin-password': password
        }
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.status === 503) {
        setServiceRoleWarning(data.error);
        return;
      }
      if (!res.ok) {
        setSearchError(data.error || 'エラーが発生しました');
        return;
      }
      setAllUsers(data);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleGrantVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantMessage('');
    if (!user) return;
    try {
      const res = await fetch('/api/admin/grant-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          userId: user.id,
          islandId,
          status,
          visitedAt: new Date(visitedAt).toISOString(),
          note
        })
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        setGrantMessage(`エラー: ${data.error}`);
        return;
      }
      setGrantMessage(data.message);
      setGrantHistory(prev => [{
        id: Date.now(),
        email: user.email,
        islandId,
        status,
        visitedAt,
        note,
        grantedAt: new Date().toLocaleString()
      }, ...prev]);
      setIslandId('');
      setNote('');
    } catch (err: any) {
      setGrantMessage(`エラー: ${err.message}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordMessage('');
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setChangePasswordMessage(`エラー: ${data.error}`);
        return;
      }
      setChangePasswordMessage(`${data.message}\n新しいパスワード: ${data.newPassword}`);
      setNewPassword('');
    } catch (err: any) {
      setChangePasswordMessage(`エラー: ${err.message}`);
    }
  };

  const handleFetchDiaries = async () => {
    setIsLoadingDiaries(true);
    setDiariesMessage('');
    try {
      const res = await fetch('/api/admin/list-diaries', {
        method: 'GET',
        headers: {
          'x-admin-password': password
        }
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        setDiariesMessage(`エラー: ${data.error}`);
        return;
      }
      setDiaries(data);
    } catch (err: any) {
      setDiariesMessage(`エラー: ${err.message}`);
    } finally {
      setIsLoadingDiaries(false);
    }
  };

  const handleModerateDiary = async (diaryId: string, action: 'hide' | 'show' | 'delete') => {
    if (action === 'delete') {
      if (!window.confirm('本当にこの日記を削除しますか？この操作は取り消せません。')) return;
    }
    try {
      const res = await fetch('/api/admin/moderate-diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ diaryId, action })
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        toast.error(`エラー: ${data.error}`);
        return;
      }
      toast.success(data.message);
      if (action === 'delete') {
        setDiaries(prev => prev.filter(d => d.id !== diaryId));
      } else {
        setDiaries(prev => prev.map(d => d.id === diaryId ? { ...d, is_hidden: action === 'hide' } : d));
      }
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">管理者ログイン</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">管理者パスワード</label>
            <input
              type="password"
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors">
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
        <h2 className="text-xl font-bold text-blue-400 mb-8">Admin Panel</h2>
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('user')}
            className={`w-full text-left px-4 py-2 rounded transition-colors ${activeTab === 'user' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
          >
            ユーザー管理・付与
          </button>
          <button 
            onClick={() => setActiveTab('password')}
            className={`w-full text-left px-4 py-2 rounded transition-colors ${activeTab === 'password' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
          >
            パスワード変更
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`w-full text-left px-4 py-2 rounded transition-colors ${activeTab === 'moderation' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
          >
            投稿管理
          </button>
        </nav>
        <button onClick={handleLogout} className="mt-8 text-sm text-gray-400 hover:text-white text-left px-4 py-2">
          ログアウト
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {serviceRoleWarning && (
          <div className="mb-6 bg-yellow-900/50 border-l-4 border-yellow-500 p-4 rounded shadow">
            <p className="text-yellow-200">{serviceRoleWarning}</p>
          </div>
        )}

        {activeTab === 'user' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-gray-100 border-b border-gray-700 pb-4">ユーザー管理</h2>
            
            {/* Search Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">ユーザー検索</h3>
              <form onSubmit={handleSearchUser} className="flex gap-4">
                <input
                  type="email"
                  placeholder="メールアドレス"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-bold transition-colors">
                  検索
                </button>
              </form>
              {searchError && <p className="text-red-400 mt-3">{searchError}</p>}
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button 
                  onClick={handleFetchAllUsers}
                  disabled={isLoadingUsers}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded text-sm transition-colors"
                >
                  {isLoadingUsers ? '取得中...' : '全ユーザーを一覧表示'}
                </button>
              </div>
            </div>
            
            {/* All Users Table */}
            {allUsers.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-300">ユーザー一覧 (計: {allUsers.length}名)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-700 text-gray-400">
                      <tr>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">到達数</th>
                        <th className="py-2 pr-4">登録日時</th>
                        <th className="py-2">最終ログイン</th>
                        <th className="py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u: any) => (
                        <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 pr-4 font-mono">{u.email}</td>
                          <td className="py-3 pr-4">
                            <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full text-xs font-bold">
                              {u.visitCount}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-3 text-gray-400">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '-'}</td>
                          <td className="py-3">
                            <button 
                              onClick={() => {
                                setUser(u);
                                setAllUsers([]);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-blue-400 hover:text-blue-300 underline text-xs"
                            >
                              選択して付与
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* User Info & Grant Form */}
            {user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 h-fit">
                  <h3 className="text-xl font-semibold mb-4 text-green-400">ユーザー情報</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-gray-400 block">ID:</span> {user.id}</p>
                    <p><span className="text-gray-400 block">Email:</span> {user.email}</p>
                    <p><span className="text-gray-400 block">登録日:</span> {new Date(user.created_at).toLocaleString()}</p>
                    <p><span className="text-gray-400 block">最終ログイン:</span> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'なし'}</p>
                    <p><span className="text-gray-400 block">島訪問数:</span> <span className="text-xl font-bold text-white">{user.visitCount}</span></p>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
                  <h3 className="text-xl font-semibold mb-4 text-purple-400">到達記録付与</h3>
                  <form onSubmit={handleGrantVisit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">島名 / ID</label>
                      <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:outline-none focus:border-blue-500"
                        value={islandId}
                        onChange={(e) => setIslandId(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ステータス</label>
                      <select
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:outline-none focus:border-blue-500"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="visited">訪問済み (visited)</option>
                        <option value="verified_visited">公式認定 (verified_visited)</option>
                        <option value="planning">行きたい (planning)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">到達日時</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:outline-none focus:border-blue-500"
                        value={visitedAt}
                        onChange={(e) => setVisitedAt(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">メモ (任意)</label>
                      <textarea
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:outline-none focus:border-blue-500"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold transition-colors">
                      付与する
                    </button>
                    {grantMessage && (
                      <p className={`mt-3 text-sm ${grantMessage.includes('エラー') ? 'text-red-400' : 'text-green-400'}`}>
                        {grantMessage}
                      </p>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Grant History */}
            {grantHistory.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 mt-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-300">セッション内 付与履歴</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-700 text-gray-400">
                      <tr>
                        <th className="py-2">Email</th>
                        <th className="py-2">島ID</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">到達日時</th>
                        <th className="py-2">付与時刻</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grantHistory.map(h => (
                        <tr key={h.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-2">{h.email}</td>
                          <td className="py-2">{h.islandId}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${h.status === 'visited' ? 'bg-blue-900 text-blue-200' : h.status === 'verified_visited' ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-400">{h.visitedAt.replace('T', ' ')}</td>
                          <td className="py-2 text-gray-400">{h.grantedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'password' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-100 border-b border-gray-700 pb-4 mb-8">パスワード変更</h2>
            <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">新しいパスワード (8文字以上)</label>
                  <input
                    type="password"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded transition-colors">
                  パスワード変更手順を生成
                </button>
              </form>
              {changePasswordMessage && (
                <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded">
                  <pre className="whitespace-pre-wrap text-sm text-green-400 font-mono">
                    {changePasswordMessage}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-gray-100 border-b border-gray-700 pb-4">投稿管理 (モデレーション)</h2>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">最新の日記一覧</h3>
                <button 
                  onClick={handleFetchDiaries}
                  disabled={isLoadingDiaries}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
                >
                  {isLoadingDiaries ? '取得中...' : '最新の日記を取得'}
                </button>
              </div>
              {diariesMessage && <p className="text-red-400 mb-4">{diariesMessage}</p>}
              
              {diaries.length > 0 && (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-700 text-gray-400">
                      <tr>
                        <th className="py-2 pr-4">投稿者ID</th>
                        <th className="py-2 pr-4">島ID</th>
                        <th className="py-2 pr-4">投稿日時</th>
                        <th className="py-2 pr-4 w-1/3">内容プレビュー</th>
                        <th className="py-2 pr-4">状態</th>
                        <th className="py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diaries.map(d => (
                        <tr key={d.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 pr-4 font-mono text-xs">{d.user_id.substring(0,8)}...</td>
                          <td className="py-3 pr-4 text-gray-300">{d.island_id}</td>
                          <td className="py-3 pr-4 text-gray-400">{new Date(d.created_at).toLocaleString()}</td>
                          <td className="py-3 pr-4">
                            <div className="line-clamp-2 text-gray-300">
                              {d.content.substring(0, 30)}{d.content.length > 30 ? '...' : ''}
                            </div>
                            {d.photo_url && (
                              <a href={d.photo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs mt-1 inline-block">
                                [写真を見る]
                              </a>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {d.is_hidden ? (
                              <span className="bg-red-900/50 text-red-200 px-2 py-1 rounded-full text-xs font-bold border border-red-700/50">非表示</span>
                            ) : (
                              <span className="bg-green-900/50 text-green-200 px-2 py-1 rounded-full text-xs font-bold border border-green-700/50">公開中</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              {d.is_hidden ? (
                                <button 
                                  onClick={() => handleModerateDiary(d.id, 'show')}
                                  className="text-green-400 hover:text-green-300 underline text-xs"
                                >
                                  表示に戻す
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleModerateDiary(d.id, 'hide')}
                                  className="text-yellow-400 hover:text-yellow-300 underline text-xs"
                                >
                                  非表示にする
                                </button>
                              )}
                              <button 
                                onClick={() => handleModerateDiary(d.id, 'delete')}
                                className="text-red-400 hover:text-red-300 underline text-xs ml-2"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
