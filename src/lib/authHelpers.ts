export function translateAuthError(errorMsg: string): string {
  const msg = errorMsg.toLowerCase();
  
  if (msg.includes('token has expired or is invalid')) {
    return '認証リンクの有効期限が切れているか、無効です。再度ログインをお試しください。';
  }
  if (msg.includes('email rate limit exceeded')) {
    return 'メール送信の上限に達しました。しばらく時間をおいてから再度お試しください。';
  }
  if (msg.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (msg.includes('user already registered')) {
    return 'このメールアドレスは既に登録されています。';
  }
  if (msg.includes('password should be at least')) {
    return 'パスワードは6文字以上で設定してください。';
  }
  if (msg.includes('signups not allowed for this instance')) {
    return '現在、新規登録は制限されています。';
  }
  if (msg.includes('user not found')) {
    return 'ユーザーが見つかりません。新規登録をお願いします。';
  }
  if (msg.includes('for security purposes, you can only request this')) {
    return 'セキュリティ上の理由により、再リクエストは一定時間後に行ってください。';
  }
  
  // マッチしない場合は元のエラー（または一般的なエラー）を返す
  return '認証中にエラーが発生しました。再度お試しください。';
}
