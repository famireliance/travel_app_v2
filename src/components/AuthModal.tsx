import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ArrowRight, UserCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { translateAuthError } from '@/lib/authHelpers';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'magic'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setNickname('');
    setMessage(null);
    setShowResendButton(false);
    onClose();
  };

  const handleResendEmail = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setMessage({ text: '再送に失敗しました。しばらく待ってから再試行してください。', type: 'error' });
    else setMessage({ text: '確認メールを再送しました。スパムフォルダもご確認ください。', type: 'success' });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab !== 'magic' && password.length < 6) {
      setMessage({ text: 'パスワードは6文字以上で設定してください', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setShowResendButton(false);

    try {
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onAuthSuccess) onAuthSuccess();
        handleClose();
      } else if (activeTab === 'signup') {
        if (password !== passwordConfirm) {
          setMessage({ text: '確認用パスワードが一致しません', type: 'error' });
          setLoading(false);
          return;
        }
        if (!nickname.trim()) {
          setMessage({ text: 'トラベラーネーム（ニックネーム）を入力してください', type: 'error' });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { nickname }
          }
        });
        if (error) throw error;

        // Supabaseのセキュリティ仕様: 既に登録済みのメールアドレスの場合、エラーにはならず identities が空で返る
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          // 未確認のまま残っているアカウントの可能性が高いため、確認メールを強制的に再送する
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          });
          
          if (resendError) {
            // 既に本登録（確認済み）の場合は再送エラーになる可能性があるので案内を変更
            throw new Error('このメールアドレスは既に登録されています。ログイン画面からログインをお試しください。');
          }
          
          localStorage.setItem('kiratabi_traveler_name', nickname);
          setMessage({ 
            text: '⚠️ このメールアドレスは過去に登録リクエストがありました。\n確認メールを再送しましたので、受信トレイをご確認ください。', 
            type: 'success' 
          });
          setShowResendButton(true);
          setLoading(false);
          return;
        }

        localStorage.setItem('kiratabi_traveler_name', nickname);
        setMessage({ text: '✅ 登録完了！確認メールを送信しました。\n\n📧 メールが届かない場合:\n• スパム/迷惑メールフォルダをご確認ください\n• しばらく待ってから再送ボタンをお試しください', type: 'success' });
        setShowResendButton(true);
      } else if (activeTab === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        if (error) throw error;
        setMessage({ text: '✉️ ログインリンクを送信しました！メールのリンクをクリックしてください。', type: 'success' });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ text: translateAuthError(error.message || ''), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#F8FAFC]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 font-sans"
        >
          <button 
            onClick={handleClose}
            className="absolute top-8 right-6 lg:right-12 p-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-slate-100 flex flex-col items-center">
            
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <UserCircle className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
            </div>

            <h2 className="font-serif font-bold text-2xl text-slate-800 mb-2">
              {activeTab === 'login' ? 'おかえりなさい' : activeTab === 'signup' ? 'アカウントを作成' : 'マジックリンク'}
            </h2>
            <p className="text-sm text-slate-500 tracking-widest mb-6 text-center">
              {activeTab === 'login' ? 'ログインして踏破記録を保存しましょう' : activeTab === 'signup' ? '登録してあなただけの旅行記録を始めましょう' : 'メールのリンクから安全にログイン'}
            </p>

            {/* Tabs */}
            <div className="flex w-full bg-slate-100 rounded-lg p-1 mb-6">
              {(['login', 'signup', 'magic'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setActiveTab(tab); setMessage(null); setShowResendButton(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab === 'login' ? 'ログイン' : tab === 'signup' ? '新規登録' : 'マジックリンク'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
              
              {activeTab === 'signup' && (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900 mb-2">
                  <p className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> 無料登録でできること</p>
                  <ul className="list-none space-y-2 text-xs font-medium">
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> 端末を変えても<span className="font-bold">踏破データ・図鑑をクラウド保存</span></li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> デジタル島ノート（タイムライン）での<span className="font-bold">交流・投稿</span></li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> 全国の旅人と競える<span className="font-bold">旅人ランキング参加</span></li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> 実績を証明する<span className="font-bold">公式到達認定書（PDF）発行</span></li>
                  </ul>
                </div>
              )}
              
              {message && (
                <div className={`p-3 rounded-lg text-xs font-medium tracking-wide whitespace-pre-wrap ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {message.text}
                </div>
              )}

              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendEmail}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition-colors mb-2"
                >
                  確認メールを再送する
                </button>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="メールアドレス" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {activeTab !== 'magic' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="パスワード (6文字以上)" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              )}

              {activeTab === 'signup' && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                    <input 
                      type="password" 
                      value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                      placeholder="パスワード（確認用）" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                    <input 
                      type="text" 
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      placeholder="トラベラーネーム（ニックネーム）" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-widest py-4 rounded-xl mt-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? '処理中...' : (activeTab === 'login' ? 'ログイン' : activeTab === 'signup' ? '登録する' : 'リンクを送信')}
                {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
              </button>

            </form>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
