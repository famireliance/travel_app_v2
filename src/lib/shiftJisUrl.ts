import iconv from 'iconv-lite';

/**
 * 日本の老舗旅行サイト（じゃらん・楽天トラベル）のキーワード検索は、
 * URLパラメータにShift_JISエンコードを要求するため、
 * UTF-8文字列をShift_JISパーセントエンコーディングへ変換します。
 */
export function encodeShiftJisUrl(str: string): string {
  if (!str) return '';
  try {
    const buf = iconv.encode(str, 'Shift_JIS');
    let result = '';
    for (let i = 0; i < buf.length; i++) {
      result += '%' + buf[i].toString(16).toUpperCase();
    }
    return result;
  } catch (err) {
    console.error('Shift_JIS encoding error:', err);
    return encodeURIComponent(str);
  }
}
