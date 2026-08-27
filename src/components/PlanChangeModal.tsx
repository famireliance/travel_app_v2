import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Star, Zap, CreditCard, Shield, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'free' | 'premium' | 'ultimate';
  onPlanChanged: (newTier: 'premium' | 'ultimate') => void;
}

export function PlanChangeModal({ isOpen, onClose, currentTier, onPlanChanged }: PlanChangeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmingPlan, setConfirmingPlan] = useState<'premium' | 'ultimate' | null>(null);

  const executeChangePlan = async () => {
    if (!confirmingPlan || currentTier === confirmingPlan) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      if (currentTier === 'free') {
        const res = await fetch('/api/subscription/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, tier: confirmingPlan }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '決済ページの開始に失敗しました');
        if (data.url) {
          window.location.href = data.url;
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ target_tier: confirmingPlan })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'プラン変更に失敗しました');
      
      onPlanChanged(confirmingPlan);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  const handleOpenStripePortal = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setConfirmingPlan(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl relative my-8"
          >
            <button 
              onClick={handleClose} 
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-10"
              disabled={isLoading}
            >
              <X size={20} />
            </button>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
                {errorMsg}
              </div>
            )}

            {confirmingPlan ? (
              <div className="py-4">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">プラン変更の確認</h2>
                  <p className="text-slate-500 text-sm">
                    {confirmingPlan === 'ultimate' ? 'KIRATABI Ultimate (月額980円)' : 'KIRATABI Premium (月額480円)'} へ変更します。
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 max-w-lg mx-auto">
                  <ul className="text-sm text-slate-700 space-y-3">
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <span>変更は即座に反映され、新しい特典をすぐにご利用いただけます。</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <span>
                        ご請求について：現在の契約期間の残り日数に応じた差額（日割り）が計算され、**次回のご請求時に合算**して引き落とされます。（本日この場での即時決済は発生しません）
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
                  <button 
                    onClick={() => setConfirmingPlan(null)}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button 
                    onClick={executeChangePlan}
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                      confirmingPlan === 'ultimate' 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' 
                        : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                    変更を確定する
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-2">プランを変更する</h2>
                  <p className="text-sm text-slate-500">あなたの島旅をもっと特別にするプランを選びましょう。</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 relative">
                  {/* Premium Plan Card */}
                  <div className={`relative p-6 rounded-3xl border-2 transition-all ${currentTier === 'premium' ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200 bg-white hover:border-amber-200'}`}>
                    {currentTier === 'premium' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[0.7rem] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Check size={12} /> 現在のプラン
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-amber-600 font-serif font-bold text-xl mb-1">
                        <Star className="fill-amber-400 text-amber-400 w-5 h-5" />
                        Premium
                      </div>
                      <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-3xl font-bold">¥480</span>
                        <span className="text-sm text-slate-500">/ 月</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 text-sm text-slate-700">
                      <li className="flex items-start gap-2"><Check size={18} className="text-amber-500 shrink-0 mt-0.5" /> <span>公式証明書の高画質ダウンロードが無制限</span></li>
                      <li className="flex items-start gap-2"><Check size={18} className="text-amber-500 shrink-0 mt-0.5" /> <span>相棒精霊の「第2形態」が解放可能に</span></li>
                      <li className="flex items-start gap-2 text-slate-400"><X size={18} className="shrink-0 mt-0.5" /> <span>旅の記録（島ログ）の写真保存が無制限</span></li>
                      <li className="flex items-start gap-2 text-slate-400"><X size={18} className="shrink-0 mt-0.5" /> <span>1周年記念の実物証明書の無料お届け</span></li>
                    </ul>

                    <button 
                      onClick={() => setConfirmingPlan('premium')}
                      disabled={isLoading || currentTier === 'premium'}
                      className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        currentTier === 'premium' 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                      }`}
                    >
                      {currentTier === 'premium' ? '現在のご契約プランです' : currentTier === 'ultimate' ? 'Premiumにダウングレード' : 'Premiumにアップグレード'}
                    </button>
                  </div>

                  {/* Ultimate Plan Card */}
                  <div className={`relative p-6 rounded-3xl border-2 transition-all ${currentTier === 'ultimate' ? 'border-purple-500 bg-purple-50/30 shadow-lg shadow-purple-500/10' : 'border-slate-200 bg-gradient-to-b from-white to-slate-50 hover:border-purple-300'}`}>
                    {currentTier === 'ultimate' ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[0.7rem] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md shadow-purple-500/20">
                        <Check size={12} /> 現在のプラン
                      </div>
                    ) : (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[0.7rem] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md shadow-purple-500/20">
                        <Zap size={12} className="fill-white" /> おすすめ
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-purple-700 font-serif font-bold text-xl mb-1">
                        <Zap className="fill-purple-500 text-purple-500 w-5 h-5" />
                        Ultimate
                      </div>
                      <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-3xl font-bold">¥980</span>
                        <span className="text-sm text-slate-500">/ 月</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 text-sm text-slate-700">
                      <li className="flex items-start gap-2"><Check size={18} className="text-purple-600 shrink-0 mt-0.5" /> <span className="font-bold">Premiumの全機能が含まれます</span></li>
                      <li className="flex items-start gap-2"><Check size={18} className="text-purple-600 shrink-0 mt-0.5" /> <span>旅の記録（島ログ）の写真保存が無制限</span></li>
                      <li className="flex items-start gap-2"><Check size={18} className="text-purple-600 shrink-0 mt-0.5" /> <span className="font-bold text-purple-700">【究極特典】1年間継続すると、特別版の「1周年記念 実物証明書」を送料無料でお届け</span></li>
                    </ul>

                    <button 
                      onClick={() => setConfirmingPlan('ultimate')}
                      disabled={isLoading || currentTier === 'ultimate'}
                      className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        currentTier === 'ultimate' 
                          ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                    >
                      {currentTier === 'ultimate' ? '現在のご契約プランです' : 'Ultimateにアップグレード'}
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Shield size={14} /> 安全なStripe決済をご利用いただいています
                  </p>
                  <button 
                    onClick={handleOpenStripePortal}
                    className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                  >
                    <CreditCard size={16} /> お支払い方法の変更・解約はこちら (Stripe Portal) <ExternalLink size={14} />
                  </button>
                </div>
              </>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
