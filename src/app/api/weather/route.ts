import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return NextResponse.json({ error: '緯度経度が指定されていません' }, { status: 400 });
  }

  // APIキーが未設定の場合はエラーを返す（モックデータは返さない）
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
    return NextResponse.json({ error: 'OpenWeatherMap APIキーが設定されていません' }, { status: 500 });
  }

  try {
    // 実際のOpenWeatherMap One Call API 3.0をコール (currentとalertsを取得)
    const res = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${apiKey}&lang=ja&units=metric`);
    const data = await res.json();
    
    if (!res.ok) {
       return NextResponse.json({ error: data.message || '天気情報の取得に失敗しました' }, { status: res.status });
    }

    return NextResponse.json({ 
      current: data.current ? {
        temp: Math.round(data.current.temp),
        description: data.current.weather[0]?.description || '',
        icon: data.current.weather[0]?.icon || '01d',
        main: data.current.weather[0]?.main || 'Clear'
      } : null,
      alerts: data.alerts || [] 
    });
  } catch (error) {
    return NextResponse.json({ error: '天気情報の取得中に予期せぬエラーが発生しました' }, { status: 500 });
  }
}
