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
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);
  const [showAlreadyRegisteredActions, setShowAlreadyRegisteredActions] = useState(false);

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setNickname('');
    setMessage(null);
    setShowResendButton(false);
    setShowAlreadyRegisteredActions(false);
    onClose();
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setMessage({
          text: translateAuthError(error.message || '') || '再送に失敗しました。しばらく待ってから再試行してください。',
          type: 'error',
        });
      } else {
        setMessage({
          text: '確認メールを再送しました。迷惑メールフォルダもあわせてご確認ください。',
          type: 'success',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLinkDirect = async () => {
    if (!email.trim()) {
      setActiveTab('magic');
      setMessage(null);
      setShowAlreadyRegisteredActions(false);
      return;
    }
    setLoading(true);
    setMessage(null);
    setShowAlreadyRegisteredActions(false);
    setShowResendButton(false);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setActiveTab('magic');
      setMessage({
        text: '✉️ ログイン用マジックリンクを送信しました！\n受信トレイのリンクをタップすると自動的にログインします。',
        type: 'success',
      });
    } catch (error: any) {
      setActiveTab('magic');
      setMessage({ text: translateAuthError(error?.message || ''), type: 'error' });
    } finally {
      setLoading(false);
    }
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
    setShowAlreadyRegisteredActions(false);

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
            data: { nickname },
          },
        });
        if (error) throw error;

        // Supabase GoTrue仕様:
        // 既に「本登録（メール確認）が完了しているアカウント」に対して signUp を呼ぶと、
        // アカウント列挙攻撃防止のためエラーにはせず identities: []（空配列）を返し、メールは一切送信しない。
        // （また本登録済みアドレスに対し resend({ type: 'signup' }) を呼んでも同じく 200 OK でメールは送信されない）
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setMessage({
            text: '⚠️ このメールアドレスは既に本登録済みです（新規登録用の確認メールは送信されません）。\n「ログイン」またはパスワード不要の「マジックリンク」からログインしてください。',
            type: 'error',
          });
          setShowAlreadyRegisteredActions(true);
          setLoading(false);
          return;
        }

        localStorage.setItem('kiratabi_traveler_name', nickname);

        if (data?.session) {
          if (onAuthSuccess) onAuthSuccess();
          handleClose();
          return;
        }

        setMessage({
          text: '✅ 仮登録を受け付けました！確認メールを送信しました。\n\n📧 メールが届かない場合:\n• 迷惑メールフォルダをご確認ください\n• 1分ほど待ってから下の再送ボタンをお試しください',
          type: 'success',
        });
        setShowResendButton(true);
      } else if (activeTab === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage({
          text: '✉️ ログインリンクを送信しました！\nメール内のリンクをタップすると自動的にログインします（迷惑メールフォルダもご確認ください）。',
          type: 'success',
        });
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
          className="fixed inset-0 z-[12000] bg-[#F8FAFC]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 font-sans"
        >
          <button
            onClick={handleClose}
            className="absolute top-8 right-6 lg:right-12 p-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-slate-100 flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 shrink-0">
              <UserCircle className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
            </div>

            <h2 className="font-serif font-bold text-2xl text-slate-800 mb-2">
              {activeTab === 'login'
                ? 'おかえりなさい'
                : activeTab === 'signup'
                  ? 'アカウントを作成'
                  : 'マジックリンク'}
            </h2>
            <p className="text-sm text-slate-500 tracking-widest mb-6 text-center">
              {activeTab === 'login'
                ? 'KIRATABI共通アカウントでログインして離島記録と精霊図鑑を保存'
                : activeTab === 'signup'
                  ? 'KIRATABI共通アカウントを作成して離島の旅を始めましょう'
                  : 'メールのリンクから安全にログイン'}
            </p>

            {/* Tabs */}
            <div className="flex w-full bg-slate-100 rounded-lg p-1 mb-6">
              {(['login', 'signup', 'magic'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setMessage(null);
                    setShowResendButton(false);
                    setShowAlreadyRegisteredActions(false);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'login' ? 'ログイン' : tab === 'signup' ? '新規登録' : 'マジックリンク'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
              {activeTab === 'signup' && (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900 mb-2">
                  <p className="font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> 無料登録でできること
                  </p>
                  <ul className="list-none space-y-2 text-xs font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span> 端末を変えても
                      <span className="font-bold">踏破データ・図鑑をクラウド保存</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span> みんなの島ノート（タイムライン）での
                      <span className="font-bold">交流・投稿</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span> 全国の旅人と競える
                      <span className="font-bold">旅人ランキング参加</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span> 実績を証明する
                      <span className="font-bold">公式到達認定書（PDF）発行</span>
                    </li>
                  </ul>
                </div>
              )}

              {message && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium tracking-wide whitespace-pre-wrap ${
                    message.type === 'error'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {showAlreadyRegisteredActions && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setActiveTab('login');
                      setMessage(null);
                      setShowAlreadyRegisteredActions(false);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-3 rounded-lg transition-colors"
                  >
                    パスワードでログインへ
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSendMagicLinkDirect}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg transition-colors"
                  >
                    マジックリンクを送信する
                  </button>
                </div>
              )}

              {showResendButton && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendEmail}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition-colors mb-2"
                >
                  確認メールを再送する
                </button>
              )}

              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  strokeWidth={1.5}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {activeTab !== 'magic' && (
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                    strokeWidth={1.5}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワード (6文字以上)"
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              )}

              {activeTab === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('magic');
                    setMessage(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-blue-600 text-right transition-colors -mt-1"
                >
                  パスワードをお忘れ・未設定の方（メールリンクでログイン）→
                </button>
              )}

              {activeTab === 'signup' && (
                <>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                      strokeWidth={1.5}
                    />
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="パスワード（確認用）"
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative">
                    <UserCircle
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                      strokeWidth={1.5}
                    />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
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
                {loading
                  ? '処理中...'
                  : activeTab === 'login'
                    ? 'ログイン'
                    : activeTab === 'signup'
                      ? '登録する'
                      : 'リンクを送信'}
                {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
