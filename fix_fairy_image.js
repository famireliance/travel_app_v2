const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\{companionStage\.image \? \(\n *<img src=\{companionStage\.image\} alt=\{companionStage\.name\} className="w-full h-full object-cover" \/>\n *\) : \(\n *companionStage\.icon\n *\)\}/,
  `{companionChar.image_url ? (
                      <img src={companionChar.image_url} alt={companionChar.name} className={\`w-full h-full object-cover \${(subscriptionTier === 'premium' || subscriptionTier === 'ultimate') ? 'hologram-effect' : ''}\`} />
                    ) : companionStage.image ? (
                      <img src={companionStage.image} alt={companionStage.name} className={\`w-full h-full object-cover \${(subscriptionTier === 'premium' || subscriptionTier === 'ultimate') ? 'hologram-effect' : ''}\`} />
                    ) : (
                      companionStage.icon
                    )}`
);

fs.writeFileSync(file, content);
