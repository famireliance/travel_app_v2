const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const sections = [
  { arr: 'kiratabiChoice', color: 'amber' },
  { arr: 'recommendedForWomen', color: 'rose' },
  { arr: 'relaxingGetaways', color: 'emerald' },
  { arr: 'adventureNature', color: 'blue' },
  { arr: 'historicalCultural', color: 'indigo' },
];

for (const sec of sections) {
  const mapStart = content.indexOf(`{${sec.arr}.map((island, idx) => (`);
  if (mapStart !== -1) {
    // Find the end of this map block, which ends with `))} \n </div>`
    const endStr = `))}\n          </div>`;
    const mapEnd = content.indexOf(endStr, mapStart);
    
    if (mapEnd !== -1) {
      const insertionPoint = mapEnd + endStr.length;
      
      const btnBlock = `
          <div className="mt-6 flex justify-center max-w-7xl mx-auto px-4 lg:px-0">
            <button 
              onClick={() => router.push('/search')}
              className="text-sm font-bold text-slate-500 hover:text-${sec.color}-600 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-${sec.color}-50 px-6 py-2.5 rounded-full shadow-sm"
            >
              続きをみる <ChevronRight className="w-4 h-4" />
            </button>
          </div>`;
          
      content = content.slice(0, insertionPoint) + btnBlock + content.slice(insertionPoint);
    }
  }
}

fs.writeFileSync(file, content);
