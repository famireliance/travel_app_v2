const fs = require('fs');

function replaceImagesInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Top page usage: `/region/${island.region_id || 'okinawa_main'}.jpg`
  // We want to replace it with `island.hero_image_url || island.image_url || \`/region/${island.region_id || 'okinawa_main'}.jpg\``
  
  // Replace in page.tsx
  content = content.replace(
    /src=\{\`\/region\/\$\{island\.region_id \|\| 'okinawa_main'\}\.jpg\`\}/g,
    'src={island.hero_image_url || island.image_url || `/region/${island.region_id || \'okinawa_main\'}.jpg`}'
  );
  
  // Replace in search/page.tsx (usually island.region_id)
  content = content.replace(
    /src=\{\`\/region\/\$\{island\.region_id\}\.jpg\`\}/g,
    'src={island.hero_image_url || island.image_url || `/region/${island.region_id}.jpg`}'
  );
  
  // Replace in island card component if exists
  content = content.replace(
    /src=\{\`\/region\/\$\{isl\.region_id \|\| 'okinawa_main'\}\.jpg\`\}/g,
    'src={isl.hero_image_url || isl.image_url || `/region/${isl.region_id || \'okinawa_main\'}.jpg`}'
  );
  
  fs.writeFileSync(filePath, content);
}

replaceImagesInFile('src/app/page.tsx');
if (fs.existsSync('src/app/search/page.tsx')) {
  replaceImagesInFile('src/app/search/page.tsx');
}
if (fs.existsSync('src/app/island/[id]/page.tsx')) {
  replaceImagesInFile('src/app/island/[id]/page.tsx');
}
console.log('Frontend image tags updated successfully.');
