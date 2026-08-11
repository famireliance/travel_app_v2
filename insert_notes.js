const fs = require('fs');

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if(!serviceKey) {
    console.error("No service key");
    return;
  }
  
  // get a real user id
  const usersRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  
  // if users table is hidden, we might need auth schema or something. Let's just try user_ranking_view.
  const usersRes2 = await fetch(`${supabaseUrl}/rest/v1/user_ranking_view?select=id&limit=1`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  const users = await usersRes2.json();
  const userId = users.length > 0 ? users[0].id : null;
  if(!userId) {
    console.error("No user id found");
    return;
  }
  
  const notes = [
    {
      island_id: '392',
      user_id: userId,
      content: '川平湾の色、本当に反則級の青さでした。グラスボートで海底を覗くと、サンゴの間をゆうゆうと泳ぐウミガメを発見！写真では絶対に伝わらないあの青……。一生に一度は来るべき場所だと思いました。',
      photo_url: 'https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=800&q=80',
    },
    {
      island_id: '386',
      user_id: userId,
      content: '与那覇前浜ビーチ、東洋一の呼び声は伊達じゃなかった。遠浅で透き通った海が果てしなく続いて、思わず走り出してしまいました。来間大橋から見る夕日も最高で、また絶対に来ます。',
      photo_url: 'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=800&q=80',
    },
    {
      island_id: '340',
      user_id: userId,
      content: '縄文杉まで往復10時間、さすがにヘトヘトになりましたが、あの木を目の前にした瞬間、全ての疲れが吹き飛びました。樹齢7200年……自分の存在の小ささを感じながら、ただただ圧倒されました。',
      photo_url: 'https://images.unsplash.com/photo-1553434506-e8a3b4cc7f46?w=800&q=80',
    },
    {
      island_id: '1',
      user_id: userId,
      content: '6月の礼文島は「花の浮島」の名の通り、どこを歩いても高山植物だらけ。礼文固有種のレブンウスユキソウに感動しました。スコトン岬の先に広がる利尻富士と海の景色は、日本とは思えない壮大さです。',
      photo_url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80',
    }
  ];
  
  const res = await fetch(`${supabaseUrl}/rest/v1/island_diaries`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(notes)
  });
  
  if(!res.ok) {
    const errorText = await res.text();
    console.error("Error inserting:", errorText);
  } else {
    console.log("Success! Inserted sample posts.");
  }
}
run();
