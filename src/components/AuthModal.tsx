import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ArrowRight, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: '確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。', type: 'success' });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ text: error.message || '認証エラーが発生しました', type: 'error' });
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
            onClick={onClose}
            className="absolute top-8 right-6 lg:right-12 p-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-slate-100 flex flex-col items-center">
            
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <UserCircle className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
            </div>

            <h2 className="font-serif font-bold text-2xl text-slate-800 mb-2">
              {isLogin ? 'おかえりなさい' : 'アカウントを作成'}
            </h2>
            <p className="text-sm text-slate-500 tracking-widest mb-8">
              {isLogin ? 'ログインして踏破記録を保存しましょう' : '登録してあなただけの旅行記録を始めましょう'}
            </p>

            <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
              
              {message && (
                <div className={`p-3 rounded-lg text-xs font-medium tracking-wide ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {message.text}
                </div>
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

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="パスワード" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-widest py-4 rounded-xl mt-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? '処理中...' : (isLogin ? 'ログイン' : '登録する')}
                {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
              </button>

            </form>

            <div className="mt-8 text-sm text-slate-500">
              {isLogin ? 'アカウントをお持ちでないですか？' : 'すでにアカウントをお持ちですか？'}
              <button 
                onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
                className="ml-2 text-blue-600 font-bold hover:underline"
              >
                {isLogin ? '新規登録' : 'ログイン'}
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
