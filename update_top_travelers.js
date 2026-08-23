const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `            <div className="lg:w-2/3 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
              {topRankers.slice(0, 3).map((ranker, idx) => (
                <div key={ranker.id} className={\`relative bg-white rounded-2xl p-5 shadow-sm border transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col items-center text-center \${idx === 0 ? 'border-amber-200 bg-gradient-to-b from-white to-amber-50/30' : idx === 1 ? 'border-slate-200' : 'border-orange-200 bg-gradient-to-b from-white to-orange-50/30'}\`} onClick={() => router.push('/ranking')}>
                  {/* Rank Badge */}
                  <div className={\`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md \${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-500'}\`}>
                    {idx + 1}
                  </div>
                  
                  <div className={\`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-inner border-2 \${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-100 to-amber-200 text-amber-700 border-amber-300 shadow-amber-500/20' : 
                    idx === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 border-slate-300 shadow-slate-500/20' :
                    'bg-gradient-to-br from-orange-50 to-orange-200 text-orange-800 border-orange-300 shadow-orange-500/20'
                  }\`}>
                    {idx === 0 ? <Trophy size={24} className="drop-shadow-sm" /> : <Medal size={24} className="drop-shadow-sm" />}
                  </div>
                  
                  <h3 className="font-bold text-slate-800 w-full truncate mb-1">{ranker.username}</h3>
                  <span className="text-[0.65rem] px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full mb-3">{ranker.title}</span>
                  
                  <div className="w-full space-y-2 mt-auto">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-white/60 p-1.5 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1"><Compass size={12} className="text-blue-500"/> 島数</span>
                      <span className="font-bold">{ranker.visited}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-white/60 p-1.5 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1"><Star size={12} className="text-amber-500"/> XP</span>
                      <span className="font-bold text-amber-600">{ranker.points.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Fill empty spots if less than 3 rankers */}
              {Array.from({ length: Math.max(0, 3 - topRankers.length) }).map((_, i) => (
                <div key={\`empty-\${i}\`} className="bg-slate-50/50 rounded-2xl p-5 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-70">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 mb-3" />
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>`;

content = content.replace(
  /<div className="lg:w-2\/3 w-full flex flex-col gap-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\}\s*<\/div>\s*<Footer \/>/g,
  replacement + "\n          </div>\n        </div>\n      )}\n    </div>\n    <Footer />"
);

fs.writeFileSync(file, content);
