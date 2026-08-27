import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Mail,
  Search,
  Send,
  Edit3,
  RefreshCw
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  general: '一般的なご質問',
  bug: '不具合・バグ報告',
  checkin: 'チェックイン・位置情報',
  subscription: 'サブスク・お支払い',
  certificate: '証明書・特典',
  other: 'その他',
};

interface ContactItem {
  id: string;
  name: string;
  email: string;
  category?: string;
  message: string;
  status: 'unread' | 'in_progress' | 'resolved' | string;
  admin_note?: string;
  reply_text?: string;
  created_at: string;
}

export default function AdminContacts({ password }: { password: string }) {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('unread');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editReply, setEditReply] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contacts', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts || []);
      } else {
        toast.error(data.error || 'お問い合わせの取得に失敗しました');
      }
    } catch (err) {
      console.error(err);
      toast.error('お問い合わせの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [password]);

  const updateContact = async (id: string, status?: string, adminNote?: string, replyText?: string) => {
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ id, status, admin_note: adminNote, reply_text: replyText })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || 'お問い合わせ情報を更新しました');
        setEditingId(null);
        fetchContacts();
      } else {
        toast.error(data.error || '更新に失敗しました');
      }
    } catch (err) {
      console.error(err);
      toast.error('エラーが発生しました');
    }
  };

  const filteredContacts = contacts.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const msg = (c.message || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      const catLabel = (CATEGORY_LABELS[c.category || ''] || '').toLowerCase();
      const note = (c.admin_note || '').toLowerCase();
      const reply = (c.reply_text || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !msg.includes(q) && !cat.includes(q) && !catLabel.includes(q) && !note.includes(q) && !reply.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" />
            お問い合わせ管理・サポートデスク
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            ユーザーからの質問・不具合報告の確認、ステータス変更、返信メモ作成
          </p>
        </div>
        <button
          onClick={fetchContacts}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 最新情報に更新
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setStatusFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'unread' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            🚨 未対応 ({contacts.filter(c => c.status === 'unread').length})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            すべて ({contacts.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'in_progress' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            対応中 ({contacts.filter(c => c.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'resolved' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            解決済 ({contacts.filter(c => c.status === 'resolved').length})
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="お名前・メール・本文検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 text-xs">お問い合わせデータを読み込み中...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-950/60 rounded-xl border border-gray-800 text-xs">
          該当するお問い合わせはありません。
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map(c => {
            const isEditing = editingId === c.id;

            return (
              <div key={c.id} className="bg-gray-950 border border-gray-800 rounded-2xl p-5 shadow space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      c.status === 'resolved' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      c.status === 'in_progress' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                      'bg-red-950 text-red-300 border-red-800 animate-pulse'
                    }`}>
                      {c.status === 'unread' ? '未対応' : c.status === 'in_progress' ? '対応中' : '解決済'}
                    </span>
                    <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[c.category || ''] || c.category || '一般的なご質問'}
                    </span>
                    <span className="text-xs font-bold text-white">{c.name}</span>
                    <a href={`mailto:${c.email}`} className="text-xs text-blue-400 hover:underline font-mono">
                      &lt;{c.email}&gt;
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleString('ja-JP') : '-'}
                    </span>
                    <select
                      value={c.status}
                      onChange={(e) => {
                        if (isEditing) {
                          updateContact(c.id, e.target.value, editNote, editReply);
                        } else {
                          updateContact(c.id, e.target.value);
                        }
                      }}
                      className="bg-gray-900 text-xs text-white border border-gray-700 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="unread">未対応</option>
                      <option value="in_progress">対応中</option>
                      <option value="resolved">解決済</option>
                    </select>
                  </div>
                </div>

                {/* Inquiry Body */}
                <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {c.message}
                </div>

                {/* Admin Note & Draft Reply Section */}
                {isEditing ? (
                  <div className="bg-gray-900 border border-amber-500/40 rounded-xl p-3.5 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-amber-400 block mb-1">運営メモ (社内用)</label>
                      <textarea
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        placeholder="対応履歴や注意点などの社内メモ..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-white h-16"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-blue-400 block mb-1">返信文章の下書き</label>
                      <textarea
                        value={editReply}
                        onChange={e => setEditReply(e.target.value)}
                        placeholder="ユーザーへの回答本文..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-white h-20"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <a
                        href={`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent('【KIRATABIサポート】お問い合わせについて')}&body=${encodeURIComponent((editReply || '').replace(/\r?\n/g, '\r\n'))}`}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <Send className="w-3.5 h-3.5" /> メールソフトで返信を開く
                      </a>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">キャンセル</button>
                        <button
                          onClick={() => updateContact(c.id, c.status, editNote, editReply)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="space-y-1">
                      {c.admin_note && (
                        <p className="text-[11px] text-amber-400/90 font-medium">📝 メモ: {c.admin_note}</p>
                      )}
                      {c.reply_text && (
                        <p className="text-[11px] text-blue-300 font-medium">✉️ 返信下書きあり</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditNote(c.admin_note || '');
                        setEditReply(c.reply_text || `お問合せいただきありがとうございます。KIRATABIサポートチームです。\n\n`);
                      }}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 運営メモ・返信作成
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
