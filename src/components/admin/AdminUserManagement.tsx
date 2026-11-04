import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Users, Shield, Building, Trash2, X, Plus, Key, Mail, User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id?: string;
  org_name?: string;
  last_login_at?: string;
  created_at?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function AdminUserManagement({ password }: { password: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor',
    org_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchOrgs();
  }, [password]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-password': password }
      });
      if (!res.ok) {
        toast.error('ユーザー権限がありません');
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
      toast.error('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/admin/users?type=organizations', {
        headers: { 'x-admin-password': password }
      });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
        if (data.length > 0 && !formData.org_id) {
          setFormData(prev => ({ ...prev, org_id: data[0].id }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'editor',
      org_id: orgs.length > 0 ? orgs[0].id : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('氏名、メールアドレス、パスワードは必須です');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('パスワードは6文字以上で設定してください');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'スタッフの追加に失敗しました');
        return;
      }
      toast.success('スタッフを追加しました');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || '通信エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (u: User) => {
    const newPassword = window.prompt(`スタッフ「${u.name}」(${u.email}) の新しいパスワードを入力してください（6文字以上）:`);
    if (newPassword === null) return;
    if (newPassword.length < 6) {
      toast.error('パスワードは6文字以上で設定してください');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: u.id, password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'パスワードの再設定に失敗しました');
        return;
      }
      toast.success(`「${u.name}」のパスワードを再設定しました`);
    } catch (err: any) {
      toast.error(err.message || '通信エラーが発生しました');
    }
  };

  const handleDelete = async (u: User) => {
    if (!window.confirm(`スタッフ「${u.name}」(${u.email}) を削除しますか？\nこの操作は元に戻せません。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'スタッフの削除に失敗しました');
        return;
      }
      toast.success('スタッフを削除しました');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || '通信エラーが発生しました');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/50 text-purple-300 border border-purple-700/60 flex items-center gap-1 w-fit"><Shield className="w-3 h-3 text-purple-400" /> システム全体管理者</span>;
      case 'org_admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/50 text-blue-300 border border-blue-700/60 flex items-center gap-1 w-fit"><Shield className="w-3 h-3 text-blue-400" /> 組織管理者</span>;
      case 'editor':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 w-fit"><Shield className="w-3 h-3 text-emerald-400" /> 編集者</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700 flex items-center gap-1 w-fit"><Shield className="w-3 h-3 text-gray-400" /> 閲覧者</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            組織・スタッフ管理
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            ダッシュボードを利用する自治体・観光協会スタッフのアカウント発行と権限管理を行います。
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-blue-900/30 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          スタッフを追加
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-xs animate-pulse">読み込み中...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">登録されているスタッフアカウントがありません</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-800">
                <th className="p-3.5 font-bold">名前 / メールアドレス</th>
                <th className="p-3.5 font-bold">ロール</th>
                <th className="p-3.5 font-bold">所属組織</th>
                <th className="p-3.5 font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-300 divide-y divide-gray-800/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/40 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-white text-sm">{u.name}</div>
                    <div className="text-gray-500 font-mono text-[11px]">{u.email}</div>
                  </td>
                  <td className="p-3.5">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="p-3.5">
                    <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                      <Building className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      {u.org_name || (u.org_id ? '自治体組織' : 'システム管理')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                        title="パスワード再設定"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="スタッフを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* スタッフ追加モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 text-white space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> 新規スタッフアカウント発行
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mb-1.5">
                  <UserIcon className="w-3 h-3 text-blue-400" /> 氏名・担当者名
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: 八丈 太郎"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mb-1.5">
                  <Mail className="w-3 h-3 text-blue-400" /> メールアドレス
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="例: staff2@hachijo.tokyo.jp"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mb-1.5">
                  <Key className="w-3 h-3 text-blue-400" /> 初期パスワード (6文字以上)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mb-1.5">
                    <Shield className="w-3 h-3 text-blue-400" /> 権限ロール
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="editor">編集者 (editor)</option>
                    <option value="viewer">閲覧のみ (viewer)</option>
                    <option value="org_admin">組織管理者 (org_admin)</option>
                  </select>
                </div>

                {orgs.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mb-1.5">
                      <Building className="w-3 h-3 text-blue-400" /> 所属組織
                    </label>
                    <select
                      value={formData.org_id}
                      onChange={e => setFormData({ ...formData, org_id: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    >
                      {orgs.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-lg shadow-blue-900/40 disabled:opacity-50"
                >
                  {submitting ? '追加中...' : 'アカウントを作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

