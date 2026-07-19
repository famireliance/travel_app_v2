import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return NextResponse.json({ error: '緯度経度が指定されていません' }, { status: 400 });
  }

  // APIキーが未設定の場合は、テスト用にモックデータ（ランダム確率）を返します
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
    const random = Math.random();
    
    // 20%の確率でテスト用のアラートを発生させる
    if (random > 0.8) {
      return NextResponse.json({
        alerts: [{
          event: "波浪警報",
          description: "沿岸部では高波に警戒してください。小型船舶等の運行に影響が出る可能性があります。",
          severity: "Warning",
          sender_name: "気象庁 (Test Mock)"
        }]
      });
    } else if (random > 0.95) {
      return NextResponse.json({
        alerts: [{
          event: "暴風・大雨特別警報",
          description: "猛烈な風と雨が予想されます。安全な場所へ避難してください。",
          severity: "Danger",
          sender_name: "気象庁 (Test Mock)"
        }]
      });
    }
    
    // 平常時
    return NextResponse.json({ alerts: [] });
  }

  try {
    // 実際のOpenWeatherMap One Call API 3.0をコール
    const res = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,daily&appid=${apiKey}&lang=ja`);
    const data = await res.json();
    return NextResponse.json({ alerts: data.alerts || [] });
  } catch (error) {
    return NextResponse.json({ error: '天気情報の取得に失敗しました' }, { status: 500 });
  }
}
