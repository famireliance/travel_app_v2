const fs = require('fs');
const file = 'src/components/CertificateModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Free limit reached error message
content = content.replace(
  /無料プランで発行できる公式証明書は3枚までです。無制限に発行するには、Premiumプランへのアップグレードをご検討ください。/,
  "{limitErrorMessage}"
);

// Replace Premium block
content = content.replace(
  /<Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" \/>[\s\S]*?無料で公式証明書を発行する\n *<\/button>\n *<\/div>/m,
  `<Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2 font-serif text-lg">公式証明書を発行します</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                              用途に合わせて発行する証明書のタイプを選択してください。
                            </p>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('card'); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors border border-slate-200"
                              >
                                【無料・無制限】簡易カード版を発行
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('high_quality'); }}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="w-4 h-4" /> 公式高画質版を発行 (Free:1枚/Premium:月5枚)
                              </button>
                            </div>
                          </div>`
);

// Replace Free block
content = content.replace(
  /<Award className="w-12 h-12 text-blue-500 mx-auto mb-3" \/>[\s\S]*?簡易カード版を発行する\n *<\/button>\n *<\/div>\n *<\/div>/m,
  `<Award className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2 font-serif text-lg">公式証明書を発行します</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                              用途に合わせて発行する証明書のタイプを選択してください。
                            </p>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('card'); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors border border-slate-200"
                              >
                                【無料・無制限】簡易カード版を発行
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('high_quality'); }}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="w-4 h-4" /> 公式高画質版を発行 (Free:1枚/Premium:月5枚)
                              </button>
                            </div>
                          </div>`
);

fs.writeFileSync(file, content);
