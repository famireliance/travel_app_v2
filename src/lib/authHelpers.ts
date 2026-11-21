export function translateAuthError(errorMsg: string): string {
  const msg = (errorMsg || '').toLowerCase();

  if (
    msg.includes('token has expired or is invalid') ||
    msg.includes('invalid or has expired') ||
    msg.includes('otp_expired') ||
    msg.includes('flow state')
  ) {
    return '認証リンクの有効期限が切れているか、既に使用済みです。もう一度マジックリンクを送信してください。';
  }
  if (msg.includes('email rate limit exceeded') || msg.includes('over_email_send_rate_limit')) {
    return '短時間にメール送信が集中しました。1分ほど時間をおいてから再度お試しください。';
  }
  if (msg.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (msg.includes('email not confirmed')) {
    return 'メールアドレスの確認が完了していません。受信トレイの確認メール、またはマジックリンクからログインしてください。';
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
    return 'セキュリティ上の理由により、再リクエストは数十秒ほど待ってから行ってください。';
  }

  return '認証中にエラーが発生しました。再度お試しください。';
}
