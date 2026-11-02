import { NextResponse } from 'next/server';

// Open-Meteo WMO Weather Code から日本語表記・OpenWeather互換アイコンへの変換マップ
function mapWmoCodeToWeather(code: number): { description: string; icon: string; main: string } {
  if (code === 0) return { description: '快晴', icon: '01d', main: 'Clear' };
  if (code === 1 || code === 2) return { description: '晴れ時々曇り', icon: '02d', main: 'Clouds' };
  if (code === 3) return { description: '曇り', icon: '03d', main: 'Clouds' };
  if (code >= 45 && code <= 48) return { description: '霧', icon: '50d', main: 'Fog' };
  if (code >= 51 && code <= 57) return { description: '霧雨', icon: '09d', main: 'Drizzle' };
  if (code >= 61 && code <= 67) return { description: '雨', icon: '10d', main: 'Rain' };
  if (code >= 71 && code <= 77) return { description: '雪', icon: '13d', main: 'Snow' };
  if (code >= 80 && code <= 82) return { description: 'にわか雨', icon: '09d', main: 'Rain' };
  if (code >= 95) return { description: '雷雨', icon: '11d', main: 'Thunderstorm' };
  return { description: '晴れ', icon: '01d', main: 'Clear' };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return NextResponse.json({ error: '緯度経度が指定されていません' }, { status: 400 });
  }

  // 1. OpenWeatherMap APIキーが設定されている場合は One Call API 3.0 を優先利用
  if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey !== '') {
    try {
      const res = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${apiKey}&lang=ja&units=metric`);
      const data = await res.json();
      
      if (res.ok) {
        return NextResponse.json({ 
          current: data.current ? {
            temp: typeof data.current.temp === 'number' ? Math.round(data.current.temp) : 0,
            description: data.current.weather?.[0]?.description || '',
            icon: data.current.weather?.[0]?.icon || '01d',
            main: data.current.weather?.[0]?.main || 'Clear'
          } : null,
          alerts: data.alerts || [] 
        });
      }
    } catch {
      // OpenWeather失敗時はOpen-Meteoにフォールバック
    }
  }

  // 2. キーレスで利用可能な公共気象API (Open-Meteo) によるリアルタイム天気取得フォールバック
  try {
    const meteoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true`);
    if (meteoRes.ok) {
      const meteoData = await meteoRes.json();
      const cw = meteoData?.current_weather;
      if (cw) {
        const mapped = mapWmoCodeToWeather(Number(cw.weathercode || 0));
        return NextResponse.json({
          current: {
            temp: Math.round(Number(cw.temperature || 20)),
            description: mapped.description,
            icon: mapped.icon,
            main: mapped.main,
          },
          alerts: []
        });
      }
    }
  } catch {
    // ネットワークエラー時も 500 ではなく空レスポンスを返し画面表示を阻害しない
  }

  return NextResponse.json({ current: null, alerts: [] });
}
