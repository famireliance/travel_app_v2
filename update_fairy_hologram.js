const fs = require('fs');
const file = 'src/app/mypage/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the img tag for the companion
content = content.replace(
  /<img\s+src=\{companionChar.image_url\}/g,
  "<img src={companionChar.image_url} className={`absolute inset-0 w-full h-full object-contain ${(subscriptionTier === 'premium' || subscriptionTier === 'ultimate') ? 'hologram-effect' : ''}`}"
);

// We should also replace the style where they are rendered.
// Let's just do a blanket regex for any fairy images. Actually, the easiest is to find `className={`... absolute inset-0 w-full h-full object-contain...`}` in MyPage.tsx
content = content.replace(
  /<img\s+src=\{char\.image_url\}\s+alt=\{char\.name\}\s+className="absolute inset-0 w-full h-full object-contain drop-shadow-md"/g,
  "<img src={char.image_url} alt={char.name} className={`absolute inset-0 w-full h-full object-contain drop-shadow-md ${(subscriptionTier === 'premium' || subscriptionTier === 'ultimate') ? 'hologram-effect' : ''}`}"
);

fs.writeFileSync(file, content);
