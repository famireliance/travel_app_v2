import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminContacts({ password }: { password: string }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/admin/contacts', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) setContacts(data.contacts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        toast.success('ステータスを更新しました');
        fetchContacts();
      }
    } catch (err) {
      toast.error('エラーが発生しました');
    }
  };

  if (loading) return <div className="p-4 text-white">読み込み中...</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-amber-400">✉️ お問い合わせ管理</h3>
      {contacts.length === 0 ? (
        <p className="text-gray-400 text-sm">お問い合わせはありません。</p>
      ) : (
        <div className="space-y-4">
          {contacts.map(c => (
            <div key={c.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-bold mr-2 ${
                    c.status === 'resolved' ? 'bg-green-900 text-green-300' :
                    c.status === 'in_progress' ? 'bg-blue-900 text-blue-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {c.status === 'unread' ? '未対応' : c.status === 'in_progress' ? '対応中' : '解決済'}
                  </span>
                  <span className="text-sm font-bold text-white">{c.category}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(c.created_at).toLocaleString('ja-JP')}</span>
                </div>
                <div className="space-x-2">
                  <select 
                    value={c.status}
                    onChange={(e) => updateStatus(c.id, e.target.value)}
                    className="bg-gray-800 text-xs text-white border border-gray-600 rounded px-2 py-1"
                  >
                    <option value="unread">未対応</option>
                    <option value="in_progress">対応中</option>
                    <option value="resolved">解決済</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-bold mb-1">{c.name} &lt;{c.email}&gt;</p>
              <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 whitespace-pre-wrap mt-2">
                {c.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
