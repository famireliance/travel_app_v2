const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(/<img src="\/fairies\/ruri\.png"/g, '<img src="/fairies/ruri.jpg"');
content = content.replace(/<img src="\/fairies\/shisa\.png"/g, '<img src="/fairies/shisa.jpg"');
content = content.replace(/<img src="\/fairies\/shida\.png"/g, '<img src="/fairies/shida.jpg"');

fs.writeFileSync('src/app/page.tsx', content);
console.log('Fixed fairy icons in page.tsx');
