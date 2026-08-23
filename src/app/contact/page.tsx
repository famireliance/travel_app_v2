'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '送信に失敗しました');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-bold tracking-widest">ホームに戻る</span>
          </Link>
          <div className="flex items-center gap-2 text-blue-600">
            <Shield size={20} />
            <span className="font-serif font-bold tracking-widest">KIRATABI</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl font-bold text-slate-800 mb-4 tracking-widest">お問い合わせ</h1>
          <p className="text-slate-500">
            アプリのご利用に関する質問や、不具合のご報告、<br className="hidden sm:block"/>
            その他ご要望などがございましたら、お気軽にお問い合わせください。
          </p>
        </div>

        {submitted ? (
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
              <CheckCircle size={36} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">送信が完了しました</h2>
            <p className="text-slate-500 text-sm mb-6">
              お問い合わせありがとうございます。<br/>内容を確認のうえ、3営業日以内にご返信させていただきます。
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm">
              <ArrowLeft size={16} /> ホームに戻る
            </Link>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <MessageSquare size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">お問い合わせフォーム</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="contact-name">お名前 <span className="text-red-500">*</span></label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                  placeholder="例：山田 太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="contact-email">メールアドレス <span className="text-red-500">*</span></label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="contact-category">お問い合わせ種類 <span className="text-red-500">*</span></label>
                <select
                  id="contact-category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition bg-white"
                >
                  <option value="general">一般的なご質問</option>
                  <option value="bug">不具合・バグ報告</option>
                  <option value="checkin">チェックイン・位置情報について</option>
                  <option value="subscription">サブスクリプション・お支払いについて</option>
                  <option value="certificate">証明書・特典について</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="contact-message">お問い合わせ内容 <span className="text-red-500">*</span></label>
                <textarea
                  id="contact-message"
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition resize-none"
                  placeholder="お問い合わせ内容を詳しくご記入ください..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
              >
                <Send size={16} />
                {isSubmitting ? '送信中...' : '送信する'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Mail size={14} />
                <span>メールでも直接お問い合わせいただけます</span>
              </div>
              <a href="mailto:support@kira-tabi.com" className="text-blue-500 hover:underline text-sm font-mono">support@kira-tabi.com</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
