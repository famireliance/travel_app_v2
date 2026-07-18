const url = 'https://lpuxsjpdenrwzyxfnggo.supabase.co';
const key = 'sb_publishable_MhCfBWG7bfQ5vcnN1zw9Hw_6bVf9kOd';

async function analyze() {
  try {
    const res = await fetch(`${url}/rest/v1/islands?select=*`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`Total islands analyzed: ${data.length}`);
      let truncatedDescCount = 0;
      let nullAccessCount = 0;
      let nullCoordsCount = 0;
      let shortDescCount = 0;

      data.forEach(i => {
        if (!i.description || i.description.endsWith('…') || i.description.endsWith('...')) {
          truncatedDescCount++;
        } else if (i.description.length < 80) {
          shortDescCount++;
        }
        if (!i.access || i.access === 'null') nullAccessCount++;
        if (!i.coordinates || i.coordinates === 'null') nullCoordsCount++;
      });

      console.log(`- Truncated description (ends with …): ${truncatedDescCount}`);
      console.log(`- Short description (< 80 chars): ${shortDescCount}`);
      console.log(`- Missing access info: ${nullAccessCount}`);
      console.log(`- Missing coordinates: ${nullCoordsCount}`);

      // Show a few random truncated items
      const truncatedSamples = data.filter(i => i.description && (i.description.endsWith('…') || i.description.endsWith('...'))).slice(0, 5);
      console.log('Sample truncated descriptions:');
      truncatedSamples.forEach(t => {
        console.log(`  [${t.name}] ${t.description.substring(0, 60)}...`);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

analyze();
