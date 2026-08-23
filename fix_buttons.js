const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const sections = [
  { color: 'amber' },
  { color: 'rose' },
  { color: 'emerald' },
  { color: 'blue' },
  { color: 'indigo' },
];

for (const sec of sections) {
  // We look for the button block:
  // <button 
  //   onClick={(e) => e.currentTarget.parentElement?.nextElementSibling?.scrollBy({ left: 300, behavior: 'smooth' })}
  //   className="text-xs font-bold text-slate-500 hover:text-{color}-600 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-{color}-50 px-3 py-1.5 rounded-full"
  // >
  //   続きをみる <ChevronRight className="w-3 h-3" />
  // </button>
  
  const btnRegex = new RegExp(
    `<button\\s*onClick=\\{\\(e\\) => e\\.currentTarget\\.parentElement\\?\\.nextElementSibling\\?\\.scrollBy\\(\\{ left: 300, behavior: 'smooth' \\}\\)\\}\\s*className="text-xs font-bold text-slate-500 hover:text-${sec.color}-600 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-${sec.color}-50 px-3 py-1\\.5 rounded-full"\\s*>\\s*続きをみる <ChevronRight className="w-3 h-3" />\\s*</button>`
  );

  const match = content.match(btnRegex);
  if (match) {
    const btnStr = match[0];
    // Remove it from current position
    content = content.replace(btnStr, '');
    
    // Now we need to append a new modified button to the bottom of the list.
    // The list ends with `</div>` (the flex gap-4 overflow-x-auto div), before the closing `</div>` of the section.
    // Instead of doing it blindly, let's just use string replace.
    
    // A better approach: replace the end of the list div.
    // The list div ends and then there is a `</div>` for the section.
    // But since it's hard to target the exact closing div, we can just replace the whole section structure if needed, or target the specific comment.
  }
}

fs.writeFileSync(file, content);
