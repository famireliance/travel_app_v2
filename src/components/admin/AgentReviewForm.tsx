import React, { useState } from 'react';
import { Save, Eye, ClipboardList, CheckCircle, Send, Star, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentReviewForm({ password }: { password: string }) {
  const [islandId, setIslandId] = useState('');
  const [accommodationId, setAccommodationId] = useState('');
  
  // 定量評価
  const [rating, setRating] = useState({
    islandVibe: 4,
    cleanliness: 4,
    food: 4,
    facilities: 3
  });

  // 公開レビュー
  const [publicReview, setPublicReview] = useState({
    title: '',
    body: '',
    agentName: 'KIRATABI 調査員',
    agentType: 'official' // official or user
  });

  // オーナー向けフィードバック
  const [ownerFeedback, setOwnerFeedback] = useState({
    sendToOwner: false,
    strengths: '',
    improvements: ''
  });

  const [isPreview, setIsPreview] = useState(false);

  const calculateOverallScore = () => {
    const total = rating.islandVibe + rating.cleanliness + rating.food + rating.facilities;
    return (total / 4).toFixed(1);
  };

  const handleSave = () => {
    // モック用の保存処理
    toast.success('評価レポートをデータベースに保存しました！');
    if (ownerFeedback.sendToOwner) {
      setTimeout(() => {
        toast.success('オーナー様にフィードバックレポートを送信しました。', { icon: '✉️' });
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            島プロ評価・レポート入稿ツール
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            対象施設の詳細評価を記録し、ユーザー向け公開レビューとオーナー向けコンサルレポートを作成します。
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPreview(!isPreview)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition"
          >
            <Eye className="w-4 h-4" />
            {isPreview ? 'エディタに戻る' : 'プレビューを確認'}
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 text-xs font-black rounded-xl flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            入稿内容を保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 左カラム: 入力フォーム */}
        <div className="space-y-6">
          
          {/* 1. 基本設定 */}
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400"/> 対象施設とエージェント情報</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">宿泊施設ID</label>
                <input type="text" value={accommodationId} onChange={e => setAccommodationId(e.target.value)} placeholder="UUID" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">島ID</label>
                <input type="text" value={islandId} onChange={e => setIslandId(e.target.value)} placeholder="UUID or slug" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">エージェント名</label>
                <input type="text" value={publicReview.agentName} onChange={e => setPublicReview({...publicReview, agentName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">属性</label>
                <select value={publicReview.agentType} onChange={e => setPublicReview({...publicReview, agentType: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none">
                  <option value="official">KIRATABI 公式エージェント</option>
                  <option value="user">KIRATABI 認定ユーザー</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. 定量評価 (内部レーティング) */}
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-200 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500"/> 島独自・定量レーティング</h3>
              <span className="bg-amber-950 text-amber-400 px-3 py-1 rounded-full text-xs font-bold font-mono border border-amber-800/50">
                総合スコア: {calculateOverallScore()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">※都市部の基準ではなく、離島事情を考慮した独自の評価軸で採点してください。</p>
            
            <div className="space-y-4">
              {[
                { key: 'islandVibe', label: '島らしさ・体験価値', desc: '独自の文化やホストとの温かい交流' },
                { key: 'cleanliness', label: '清潔感・手入れ', desc: '古くてもピカピカに清掃されているか' },
                { key: 'food', label: '食事の満足度', desc: '地魚や地酒など、島ならではの食体験' },
                { key: 'facilities', label: '機能性・インフラ', desc: 'Wi-Fi速度、コンセント、水回りの利便性' }
              ].map(item => (
                <div key={item.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-gray-300">{item.label} <span className="text-gray-500 font-normal ml-1">({item.desc})</span></span>
                    <span className="text-amber-400 font-bold">{rating[item.key as keyof typeof rating]} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={rating[item.key as keyof typeof rating]} 
                    onChange={e => setRating({...rating, [item.key]: parseInt(e.target.value)})}
                    className="w-full accent-amber-500" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. オーナー向けフィードバック */}
          <div className="bg-blue-950/20 border border-blue-900/50 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-blue-200 flex items-center gap-2"><Send className="w-4 h-4 text-blue-400"/> オーナー向けフィードバックレポート</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={ownerFeedback.sendToOwner} onChange={e => setOwnerFeedback({...ownerFeedback, sendToOwner: e.target.checked})} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                <span className="ml-2 text-xs font-bold text-gray-400">レポートを送付する</span>
              </label>
            </div>
            
            <div className={`space-y-4 ${!ownerFeedback.sendToOwner && 'opacity-50 pointer-events-none'}`}>
              <div>
                <label className="block text-xs font-bold text-blue-300 mb-1">良かった点・称賛ポイント（自信に繋がる声）</label>
                <textarea value={ownerFeedback.strengths} onChange={e => setOwnerFeedback({...ownerFeedback, strengths: e.target.value})} className="w-full h-20 bg-gray-950 border border-blue-900/50 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none" placeholder="例: 共用トイレが非常に清潔で、女性でも安心できました。" />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">改善ヒント・提案（低コストですぐできること）</label>
                <textarea value={ownerFeedback.improvements} onChange={e => setOwnerFeedback({...ownerFeedback, improvements: e.target.value})} className="w-full h-20 bg-gray-950 border border-amber-900/50 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" placeholder="例: 枕元にスマホ充電用の延長コードが1つあるだけで、さらに喜ばれると思います。" />
              </div>
            </div>
          </div>
          
        </div>

        {/* 右カラム: 公開レビュー & プレビュー */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-400"/> 公開用レビュー入稿</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">レビュータイトル</label>
                <input type="text" value={publicReview.title} onChange={e => setPublicReview({...publicReview, title: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="例: 青酎と地魚のハーモニー。飾らない島時間がここにある" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">レビュー本文（※ネガティブ表現をポジティブ変換すること）</label>
                <textarea value={publicReview.body} onChange={e => setPublicReview({...publicReview, body: e.target.value})} className="w-full h-48 bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-emerald-500 outline-none leading-relaxed" placeholder="レビュー本文を入力..." />
              </div>
            </div>
          </div>

          {/* プレビュー表示エリア */}
          {isPreview && (
            <div className="bg-white p-6 rounded-3xl shadow-xl">
              <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest text-center border-b pb-2">フロントエンド表示プレビュー</div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-1 md:p-1.5 rounded-[2rem] border border-amber-200/60 relative overflow-hidden mt-4">
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-[1.75rem] border border-white">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className={`w-5 h-5 ${publicReview.agentType === 'official' ? 'text-amber-500' : 'text-emerald-500'}`} />
                    <h2 className="font-serif font-bold text-slate-900 text-base">
                      {publicReview.agentType === 'official' ? 'KIRATABI 公式エージェント滞在記' : 'KIRATABI 認定ユーザー滞在記'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= parseFloat(calculateOverallScore()) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-amber-600">{calculateOverallScore()}</span>
                  </div>

                  <h3 className="text-sm font-bold text-amber-900 mb-2 leading-snug">
                    「{publicReview.title || '（タイトル未入力）'}」
                  </h3>
                  <p className="text-xs text-slate-700 leading-loose font-serif whitespace-pre-wrap">
                    {publicReview.body || '（本文未入力）'}
                  </p>
                </div>
              </div>

              {ownerFeedback.sendToOwner && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest border-b pb-2 text-center">オーナーへの送付レポート（非公開）</div>
                  <h4 className="font-bold text-sm text-slate-800 mt-3 mb-1">【KIRATABI 調査員が感動したポイント】</h4>
                  <p className="text-xs text-slate-600 mb-3">{ownerFeedback.strengths || '...'}</p>
                  <h4 className="font-bold text-sm text-slate-800 mb-1">【さらなる集客アップのヒント】</h4>
                  <p className="text-xs text-slate-600">{ownerFeedback.improvements || '...'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
