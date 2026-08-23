const fs = require('fs');
const file = 'src/app/ranking/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCardRegex = /className=\{\`relative overflow-hidden p-6 rounded-3xl flex items-center gap-5 border transition-all hover:scale-\[1\.01\] \$\{isMe \? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300 shadow-lg' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'\}\`\}[\s\S]*?YOUR RANK[\s\S]*?<\/div>\s*\)\}\s*\{\/\* ランクバッジ \*\/\}/m;

const newCardPrefix = `className={\`relative overflow-hidden p-6 rounded-3xl flex items-center gap-5 border transition-all hover:scale-[1.01] \${isMe ? 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)] text-white' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}\`}
              >
                {isMe && (
                  <div className="absolute top-0 right-0 px-6 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[0.7rem] font-bold tracking-widest rounded-bl-2xl shadow-md z-10 flex items-center gap-1.5">
                    <User size={12} />
                    YOUR RANK
                  </div>
                )}
                
                {/* ランクバッジ */}`;

content = content.replace(oldCardRegex, newCardPrefix);

// Also need to fix text colors inside isMe for the dark theme
content = content.replace(
  /<h3 className=\{\`font-bold text-lg truncate \$\{isMe \? 'text-blue-900' : 'text-slate-800'\}\`\}>\{p\.username\}<\/h3>/g,
  `<h3 className={\`font-bold text-lg truncate \${isMe ? 'text-white drop-shadow-md' : 'text-slate-800'}\`}>{p.username}</h3>`
);

content = content.replace(
  /<span className="text-\[0\.65rem\] px-2 py-0\.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-bold">/g,
  `<span className={\`text-[0.65rem] px-2 py-0.5 rounded-full font-bold \${isMe ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' : 'bg-blue-50 text-blue-600 border-blue-100'}\`}>`
);

// Fix colors for stats in isMe
content = content.replace(
  /<div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-0\.5">/g,
  `<div className={\`flex items-center justify-between text-xs font-bold mb-0.5 \${isMe ? 'text-white/80' : 'text-slate-500'}\`}>`
);

fs.writeFileSync(file, content);
