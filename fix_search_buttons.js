const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix missing image 'blue.png' -> 'ryu.png'
content = content.replace(
  /<img src="\/fairies\/blue\.png" alt="ブルー" className="w-6 h-6 rounded-full object-cover border border-white bg-indigo-50 shadow-sm" \/>/,
  '<img src="/fairies/ryu.png" alt="リュウ" className="w-6 h-6 rounded-full object-cover border border-white bg-indigo-50 shadow-sm" />'
);

// 2. Fix the overflow-hidden clipping the badge in categories
const oldCategoryDiv = /<div className=\{\`w-16 h-16 lg:w-\[72px\] lg:h-\[72px\] rounded-3xl flex items-center justify-center transition-all duration-300 shadow-md relative overflow-hidden \$\{[\s\S]*?\}\`\}>\s*<div className=\{\`absolute inset-0 bg-gradient-to-br \$\{cat\.gradient\} opacity-0 group-hover:opacity-100 transition-opacity duration-300 \$\{isSelected \? 'hidden' : ''\}\`\} \/>\s*<cat\.icon size=\{28\} strokeWidth=\{isSelected \? 2 : 1\.5\} className=\{\`relative z-10 \$\{isSelected \? 'text-white' : 'group-hover:text-white'\}\`\} \/>\s*<span className="absolute -top-1\.5 right-0 px-2 py-0\.5 rounded-full bg-slate-900 text-white text-\[0\.55rem\] font-bold tracking-tight shadow-sm z-20 group-hover:scale-110 transition-transform">\s*\{cat\.badge\}\s*<\/span>\s*<\/div>/g;

const newCategoryDiv = `<div className={\`w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-3xl flex items-center justify-center transition-all duration-300 shadow-md relative \${
                    isSelected
                      ? \`bg-gradient-to-br \${cat.gradient} text-white shadow-lg \${cat.shadow} scale-110 ring-4 ring-offset-2 ring-blue-100\`
                      : 'bg-white text-slate-500 border border-slate-200 hover:text-white hover:scale-105'
                  }\`}>
                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                      <div className={\`absolute inset-0 bg-gradient-to-br \${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 \${isSelected ? 'hidden' : ''}\`} />
                    </div>
                    <cat.icon size={28} strokeWidth={isSelected ? 2 : 1.5} className={\`relative z-10 \${isSelected ? 'text-white' : 'group-hover:text-white'}\`} />
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-slate-800 text-white text-[0.55rem] font-bold tracking-tight shadow-md z-20 group-hover:scale-110 transition-transform whitespace-nowrap">
                      {cat.badge}
                    </span>
                  </div>`;

content = content.replace(oldCategoryDiv, newCategoryDiv);

// Add more top padding to the container to prevent clipping the badge at the top
content = content.replace(
  /<div className="flex justify-start lg:justify-center gap-4 md:gap-8 overflow-x-auto hide-scrollbar px-6 lg:px-8 snap-x pb-8 pt-4 scroll-pl-6 lg:scroll-pl-0">/,
  '<div className="flex justify-start lg:justify-center gap-5 md:gap-8 overflow-x-auto hide-scrollbar px-6 lg:px-8 snap-x pb-8 pt-6 scroll-pl-6 lg:scroll-pl-0">'
);

fs.writeFileSync(file, content);
